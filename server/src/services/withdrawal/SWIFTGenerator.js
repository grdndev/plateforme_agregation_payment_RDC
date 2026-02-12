const { Transaction, User } = require('../../models');
const config = require('../../config');
const logger = require('../../utils/logger');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * SWIFT MT103 Generator
 * Generates SWIFT MT103 (Single Customer Credit Transfer) messages
 * for international wire transfers
 */
class SWIFTGenerator {
    constructor() {
        this.senderBIC = config.bank?.bic || 'PLACEHOLDERXXX';
        this.senderName = config.company?.name || 'ALMA PAYMENT PLATFORM';
        this.senderAccount = config.bank?.account || 'PLACEHOLDER_ACCOUNT';
    }

    /**
     * Generate SWIFT MT103 file for pending withdrawals
     * @param {string} currency
     * @returns {Promise<Object>}
     */
    async generateSWIFTFile(currency = 'USD') {
        try {
            // Get pending withdrawals with SWIFT code
            const withdrawals = await this.getPendingWithdrawals(currency);

            if (withdrawals.length === 0) {
                return {
                    success: false,
                    message: 'Aucun retrait en attente pour SWIFT',
                    count: 0
                };
            }

            // Generate batch ID
            const batchId = this.generateBatchId();

            // Generate SWIFT messages
            const swiftMessages = withdrawals.map((w, index) =>
                this.generateMT103Message(w, batchId, index + 1)
            );

            // Combine all messages
            const fileContent = swiftMessages.join('\n\n');

            // Calculate totals
            const totalAmount = withdrawals.reduce((sum, w) => sum + parseFloat(w.amount_net), 0);

            // Update transactions with batch ID
            const transactionIds = withdrawals.map(w => w.id);
            await Transaction.update(
                {
                    withdrawal_batch_id: batchId,
                    status: 'processing'
                },
                { where: { id: transactionIds } }
            );

            // Save file
            const fileName = `swift_mt103_${batchId}_${currency}.txt`;
            const filePath = path.join(__dirname, '../../../uploads/withdrawals', fileName);

            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, fileContent, 'utf-8');

            logger.info(`SWIFT MT103 file generated: ${batchId}`, {
                currency,
                count: withdrawals.length,
                totalAmount
            });

            return {
                success: true,
                batch_id: batchId,
                currency,
                count: withdrawals.length,
                total_amount: parseFloat(totalAmount.toFixed(2)),
                file_name: fileName,
                file_path: filePath,
                format: 'SWIFT MT103',
                transactions: withdrawals.map(w => ({
                    transaction_ref: w.transaction_ref,
                    amount: w.amount_net,
                    beneficiary: w.withdrawal_account_name,
                    swift_code: w.metadata?.swift_code
                }))
            };

        } catch (error) {
            logger.error('SWIFT file generation failed:', error);
            throw error;
        }
    }

    /**
     * Get pending withdrawals that have SWIFT/BIC code
     */
    async getPendingWithdrawals(currency) {
        const withdrawals = await Transaction.findAll({
            where: {
                type: 'withdrawal',
                status: 'pending',
                currency
            },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'email', 'company_name']
                }
            ],
            order: [['created_at', 'ASC']]
        });

        // Filter to only include those with SWIFT/BIC code
        return withdrawals.filter(w => w.metadata?.swift_code);
    }

    /**
     * Generate a single MT103 message
     * @param {Object} withdrawal
     * @param {string} batchId
     * @param {number} sequenceNumber
     * @returns {string}
     */
    generateMT103Message(withdrawal, batchId, sequenceNumber) {
        const amount = parseFloat(withdrawal.amount_net).toFixed(2);
        const currency = withdrawal.currency;
        const valueDate = this.getValueDate();
        const reference = withdrawal.transaction_ref;

        const beneficiaryName = this.formatField(withdrawal.withdrawal_account_name, 35);
        const beneficiaryAccount = withdrawal.withdrawal_account_number;
        const beneficiaryBIC = withdrawal.metadata?.swift_code || 'UNKNOWN';
        const beneficiaryBank = this.formatField(withdrawal.withdrawal_bank_name, 35);

        // MT103 Format
        const mt103 = `{1:F01${this.senderBIC}0000000000}
{2:I103${beneficiaryBIC}N}
{3:{108:${reference}}}
{4:
:20:${reference}
:23B:CRED
:32A:${valueDate}${currency}${amount}
:50K:/${this.senderAccount}
${this.formatMultiLine(this.senderName, 35)}
:59:/${beneficiaryAccount}
${beneficiaryName}
:70:/INV/WITHDRAWAL
/REC/${reference}
:71A:SHA
:72:/BATCH/${batchId}
/SEQ/${sequenceNumber}
-}`;

        return mt103;
    }

    /**
     * Generate batch ID
     */
    generateBatchId() {
        const timestamp = Date.now();
        const random = crypto.randomBytes(3).toString('hex').toUpperCase();
        return `SWIFT-${timestamp}-${random}`;
    }

    /**
     * Get value date (YYMMDD format, next business day)
     */
    getValueDate() {
        const date = new Date();
        date.setDate(date.getDate() + 1);

        const year = date.getFullYear().toString().substr(-2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return year + month + day;
    }

    /**
     * Format field to maximum length
     */
    formatField(text, maxLength) {
        if (!text) return '';
        // Remove special characters not allowed in SWIFT
        const cleaned = text
            .replace(/[^A-Za-z0-9\s\.,\-\(\)\/]/g, '')
            .toUpperCase();
        return cleaned.substring(0, maxLength);
    }

    /**
     * Format multi-line field (max 35 chars per line, max 4 lines)
     */
    formatMultiLine(text, maxLength) {
        if (!text) return '';
        const cleaned = this.formatField(text, maxLength * 4);
        const lines = [];

        for (let i = 0; i < cleaned.length; i += maxLength) {
            lines.push(cleaned.substring(i, i + maxLength));
            if (lines.length >= 4) break;
        }

        return lines.join('\n');
    }

    /**
     * Validate SWIFT/BIC code format
     */
    isValidBIC(bic) {
        // BIC format: 8 or 11 characters (AAAABBCCXXX)
        const bicRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
        return bicRegex.test(bic);
    }

    /**
     * Generate MT103 batch summary report
     */
    generateBatchReport(withdrawals, batchId) {
        const totalAmount = withdrawals.reduce((sum, w) => sum + parseFloat(w.amount_net), 0);
        const currency = withdrawals[0]?.currency || 'USD';

        let report = `SWIFT MT103 BATCH REPORT\n`;
        report += `========================\n\n`;
        report += `Batch ID: ${batchId}\n`;
        report += `Generated: ${new Date().toISOString()}\n`;
        report += `Total Transfers: ${withdrawals.length}\n`;
        report += `Total Amount: ${totalAmount.toFixed(2)} ${currency}\n\n`;
        report += `TRANSFER DETAILS\n`;
        report += `----------------\n\n`;

        withdrawals.forEach((w, i) => {
            report += `${i + 1}. ${w.transaction_ref}\n`;
            report += `   Beneficiary: ${w.withdrawal_account_name}\n`;
            report += `   Account: ${w.withdrawal_account_number}\n`;
            report += `   Bank: ${w.withdrawal_bank_name}\n`;
            report += `   BIC: ${w.metadata?.swift_code || 'N/A'}\n`;
            report += `   Amount: ${parseFloat(w.amount_net).toFixed(2)} ${currency}\n\n`;
        });

        return report;
    }
}

module.exports = new SWIFTGenerator();
