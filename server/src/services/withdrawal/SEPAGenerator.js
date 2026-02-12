const { Transaction, User } = require('../../models');
const { sequelize } = require('../../config/database');
const config = require('../../config');
const logger = require('../../utils/logger');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * SEPA (Single Euro Payments Area) XML Generator
 * Generates ISO 20022 pain.001.001.03 format files for European bank transfers
 */
class SEPAGenerator {
    constructor() {
        this.debtorName = config.company?.name || 'Alma Payment Platform';
        this.debtorIBAN = config.bank?.iban || 'PLACEHOLDER_IBAN';
        this.debtorBIC = config.bank?.bic || 'PLACEHOLDER_BIC';
    }

    /**
     * Generate SEPA XML file for pending withdrawals
     * @param {string} currency
     * @returns {Promise<Object>}
     */
    async generateSEPAFile(currency = 'USD') {
        try {
            // Get pending withdrawals
            const withdrawals = await this.getPendingWithdrawals(currency);

            if (withdrawals.length === 0) {
                return {
                    success: false,
                    message: 'Aucun retrait en attente pour SEPA',
                    count: 0
                };
            }

            // Generate unique message ID
            const messageId = this.generateMessageId();
            const creationDateTime = new Date().toISOString();

            // Calculate totals
            const totalAmount = withdrawals.reduce((sum, w) => sum + parseFloat(w.amount_net), 0);
            const numberOfTransactions = withdrawals.length;

            // Generate XML content
            const xmlContent = this.generateSEPAXML({
                messageId,
                creationDateTime,
                numberOfTransactions,
                totalAmount,
                currency,
                withdrawals
            });

            // Update transactions with batch ID
            const transactionIds = withdrawals.map(w => w.id);
            await Transaction.update(
                {
                    withdrawal_batch_id: messageId,
                    status: 'processing'
                },
                { where: { id: transactionIds } }
            );

            // Save file
            const fileName = `sepa_${messageId}_${currency}.xml`;
            const filePath = path.join(__dirname, '../../../uploads/withdrawals', fileName);

            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, xmlContent, 'utf-8');

            logger.info(`SEPA XML generated: ${messageId}`, {
                currency,
                count: numberOfTransactions,
                totalAmount
            });

            return {
                success: true,
                batch_id: messageId,
                currency,
                count: numberOfTransactions,
                total_amount: parseFloat(totalAmount.toFixed(2)),
                file_name: fileName,
                file_path: filePath,
                format: 'SEPA pain.001.001.03',
                transactions: withdrawals.map(w => ({
                    transaction_ref: w.transaction_ref,
                    amount: w.amount_net,
                    beneficiary: w.withdrawal_account_name
                }))
            };

        } catch (error) {
            logger.error('SEPA file generation failed:', error);
            throw error;
        }
    }

    /**
     * Get pending withdrawals that have IBAN (SEPA compatible)
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

        // Filter to only include those with IBAN
        return withdrawals.filter(w => w.metadata?.iban);
    }

    /**
     * Generate SEPA XML content (ISO 20022 pain.001.001.03)
     */
    generateSEPAXML(data) {
        const {
            messageId,
            creationDateTime,
            numberOfTransactions,
            totalAmount,
            currency,
            withdrawals
        } = data;

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <CstmrCdtTrfInitn>
        <GrpHdr>
            <MsgId>${this.escapeXML(messageId)}</MsgId>
            <CreDtTm>${creationDateTime}</CreDtTm>
            <NbOfTxs>${numberOfTransactions}</NbOfTxs>
            <CtrlSum>${totalAmount.toFixed(2)}</CtrlSum>
            <InitgPty>
                <Nm>${this.escapeXML(this.debtorName)}</Nm>
            </InitgPty>
        </GrpHdr>
        <PmtInf>
            <PmtInfId>${this.escapeXML(messageId)}-PMT</PmtInfId>
            <PmtMtd>TRF</PmtMtd>
            <BtchBookg>true</BtchBookg>
            <NbOfTxs>${numberOfTransactions}</NbOfTxs>
            <CtrlSum>${totalAmount.toFixed(2)}</CtrlSum>
            <PmtTpInf>
                <SvcLvl>
                    <Cd>SEPA</Cd>
                </SvcLvl>
            </PmtTpInf>
            <ReqdExctnDt>${this.getExecutionDate()}</ReqdExctnDt>
            <Dbtr>
                <Nm>${this.escapeXML(this.debtorName)}</Nm>
            </Dbtr>
            <DbtrAcct>
                <Id>
                    <IBAN>${this.debtorIBAN}</IBAN>
                </Id>
                <Ccy>${currency}</Ccy>
            </DbtrAcct>
            <DbtrAgt>
                <FinInstnId>
                    <BIC>${this.debtorBIC}</BIC>
                </FinInstnId>
            </DbtrAgt>
            <ChrgBr>SLEV</ChrgBr>
${this.generateCreditTransferTransactions(withdrawals, currency)}
        </PmtInf>
    </CstmrCdtTrfInitn>
</Document>`;

        return xml;
    }

    /**
     * Generate credit transfer transaction entries
     */
    generateCreditTransferTransactions(withdrawals, currency) {
        return withdrawals.map((w, index) => {
            const endToEndId = `${w.transaction_ref}`;
            const amount = parseFloat(w.amount_net).toFixed(2);
            const beneficiaryName = this.escapeXML(w.withdrawal_account_name);
            const iban = w.metadata?.iban || '';
            const bic = w.metadata?.swift_code || '';

            return `            <CdtTrfTxInf>
                <PmtId>
                    <EndToEndId>${endToEndId}</EndToEndId>
                </PmtId>
                <Amt>
                    <InstdAmt Ccy="${currency}">${amount}</InstdAmt>
                </Amt>
                <CdtrAgt>
                    <FinInstnId>
                        ${bic ? `<BIC>${bic}</BIC>` : '<Othr><Id>NOTPROVIDED</Id></Othr>'}
                    </FinInstnId>
                </CdtrAgt>
                <Cdtr>
                    <Nm>${beneficiaryName}</Nm>
                </Cdtr>
                <CdtrAcct>
                    <Id>
                        <IBAN>${iban}</IBAN>
                    </Id>
                </CdtrAcct>
                <RmtInf>
                    <Ustrd>Withdrawal ${w.transaction_ref}</Ustrd>
                </RmtInf>
            </CdtTrfTxInf>`;
        }).join('\n');
    }

    /**
     * Generate unique message ID
     */
    generateMessageId() {
        const timestamp = Date.now();
        const random = crypto.randomBytes(4).toString('hex').toUpperCase();
        return `SEPA-${timestamp}-${random}`;
    }

    /**
     * Get execution date (next business day)
     */
    getExecutionDate() {
        const date = new Date();
        date.setDate(date.getDate() + 1);
        return date.toISOString().split('T')[0];
    }

    /**
     * Escape XML special characters
     */
    escapeXML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
}

module.exports = new SEPAGenerator();
