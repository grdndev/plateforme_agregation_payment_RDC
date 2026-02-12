const { Wallet, BankAccount, Transaction, LedgerEntry, User } = require('../../models');
const { sequelize } = require('../../config/database');
const config = require('../../config');
const logger = require('../../utils/logger');

/**
 * Fund Segregation Service (Système de Cantonnement)
 * Manages separation between virtual wallet and bank account funds
 * 
 * Rules:
 * - Virtual Wallet: Fast transactions, daily operations (max limit)
 * - Bank Account: Secure storage for excess funds
 * - Auto-sweep: Transfer excess from wallet to bank daily
 * - Manual transfers: Merchant can move funds between wallet and bank
 */
class FundSegregationService {
    constructor() {
        // Maximum balance allowed in virtual wallet (security measure)
        this.maxWalletBalanceUSD = config.limits?.maxWalletBalance?.USD || 50000;
        this.maxWalletBalanceCDF = config.limits?.maxWalletBalance?.CDF || 100000000; // 100M CDF

        // Auto-sweep threshold (when wallet balance exceeds this, trigger auto-sweep)
        this.autoSweepThresholdUSD = config.limits?.autoSweepThreshold?.USD || 30000;
        this.autoSweepThresholdCDF = config.limits?.autoSweepThreshold?.CDF || 60000000;

        // Minimum to keep in wallet for operations
        this.minOperationalBalanceUSD = config.limits?.minOperationalBalance?.USD || 1000;
        this.minOperationalBalanceCDF = config.limits?.minOperationalBalance?.CDF || 2000000;
    }

    /**
     * Get segregation status for a user
     * @param {string} userId
     * @returns {Promise<Object>}
     */
    async getSegregationStatus(userId) {
        try {
            const wallet = await Wallet.findOne({ where: { user_id: userId } });

            if (!wallet) {
                throw new Error('Wallet non trouvé');
            }

            const bankAccounts = await BankAccount.findAll({
                where: { user_id: userId, is_verified: true }
            });

            // Calculate total bank balance (from metadata if tracked)
            const bankBalanceUSD = this.calculateBankBalance(bankAccounts, 'USD');
            const bankBalanceCDF = this.calculateBankBalance(bankAccounts, 'CDF');

            // Calculate limits and available
            const statusUSD = this.calculateSegregationStatus(
                wallet.balance_usd,
                bankBalanceUSD,
                'USD'
            );

            const statusCDF = this.calculateSegregationStatus(
                wallet.balance_cdf,
                bankBalanceCDF,
                'CDF'
            );

            return {
                success: true,
                user_id: userId,
                segregation: {
                    USD: statusUSD,
                    CDF: statusCDF
                },
                bank_accounts: bankAccounts.map(ba => ({
                    id: ba.id,
                    bank_name: ba.bank_name,
                    account_number: this.maskAccountNumber(ba.account_number),
                    currency: ba.currency,
                    is_default: ba.is_default
                }))
            };

        } catch (error) {
            logger.error('Get segregation status error:', error);
            throw error;
        }
    }

    /**
     * Transfer funds from wallet to bank account (sweep)
     * @param {string} userId
     * @param {number} amount
     * @param {string} currency
     * @param {string} bankAccountId
     * @returns {Promise<Object>}
     */
    async sweepToBank(userId, amount, currency, bankAccountId) {
        const dbTransaction = await sequelize.transaction();

        try {
            const wallet = await Wallet.findOne({ where: { user_id: userId } });
            const bankAccount = await BankAccount.findOne({
                where: { id: bankAccountId, user_id: userId }
            });

            if (!wallet) throw new Error('Wallet non trouvé');
            if (!bankAccount) throw new Error('Compte bancaire non trouvé');
            if (bankAccount.currency !== currency) {
                throw new Error(`Le compte bancaire n'accepte que ${bankAccount.currency}`);
            }

            const balance = currency === 'USD' ? wallet.balance_usd : wallet.balance_cdf;
            const minBalance = currency === 'USD'
                ? this.minOperationalBalanceUSD
                : this.minOperationalBalanceCDF;

            // Validate sufficient balance
            if (balance < amount) {
                throw new Error('Solde wallet insuffisant');
            }

            // Ensure minimum operational balance remains
            if (balance - amount < minBalance) {
                throw new Error(
                    `Vous devez conserver au moins ${minBalance} ${currency} dans votre wallet pour les opérations quotidiennes`
                );
            }

            // Debit wallet
            await wallet.debit(amount, currency, dbTransaction);

            // Create sweep transaction
            const transaction = await Transaction.create({
                user_id: userId,
                wallet_id: wallet.id,
                type: 'sweep_to_bank',
                status: 'success',
                currency,
                amount_gross: amount,
                amount_commission: 0,
                amount_net: amount,
                withdrawal_bank_name: bankAccount.bank_name,
                withdrawal_account_number: bankAccount.account_number,
                withdrawal_account_name: bankAccount.account_name,
                completed_at: new Date(),
                metadata: {
                    bank_account_id: bankAccountId,
                    segregation: 'sweep'
                }
            }, { transaction: dbTransaction });

            // Update bank account balance metadata (if tracked)
            const currentBankBalance = bankAccount.metadata?.balance || 0;
            bankAccount.metadata = {
                ...bankAccount.metadata,
                balance: parseFloat(currentBankBalance) + parseFloat(amount),
                last_sweep_at: new Date()
            };
            await bankAccount.save({ transaction: dbTransaction });

            // Create ledger entries
            await LedgerEntry.recordDoubleEntry({
                transactionId: transaction.id,
                debitAccount: `merchant_wallet_${currency.toLowerCase()}`,
                creditAccount: `merchant_bank_${currency.toLowerCase()}`,
                amount,
                currency,
                description: `Sweep to bank - ${transaction.transaction_ref}`,
                metadata: {
                    bank_account: bankAccount.account_number,
                    bank_name: bankAccount.bank_name
                },
                dbTransaction
            });

            await dbTransaction.commit();

            logger.info(`Funds swept to bank: ${amount} ${currency}`, {
                userId,
                transactionRef: transaction.transaction_ref
            });

            return {
                success: true,
                transaction_ref: transaction.transaction_ref,
                amount,
                currency,
                from: 'virtual_wallet',
                to: 'bank_account',
                bank_account: {
                    bank_name: bankAccount.bank_name,
                    account_number: this.maskAccountNumber(bankAccount.account_number)
                },
                new_wallet_balance: currency === 'USD' ? wallet.balance_usd : wallet.balance_cdf,
                completed_at: transaction.completed_at
            };

        } catch (error) {
            await dbTransaction.rollback();
            logger.error('Sweep to bank error:', error);
            throw error;
        }
    }

    /**
     * Transfer funds from bank account to wallet (funding)
     * Note: This typically requires manual bank verification
     * @param {string} userId
     * @param {number} amount
     * @param {string} currency
     * @param {string} bankAccountId
     * @returns {Promise<Object>}
     */
    async fundFromBank(userId, amount, currency, bankAccountId, metadata = {}) {
        const dbTransaction = await sequelize.transaction();

        try {
            const wallet = await Wallet.findOne({ where: { user_id: userId } });
            const bankAccount = await BankAccount.findOne({
                where: { id: bankAccountId, user_id: userId }
            });

            if (!wallet) throw new Error('Wallet non trouvé');
            if (!bankAccount) throw new Error('Compte bancaire non trouvé');
            if (bankAccount.currency !== currency) {
                throw new Error(`Le compte bancaire n'accepte que ${bankAccount.currency}`);
            }

            const maxBalance = currency === 'USD'
                ? this.maxWalletBalanceUSD
                : this.maxWalletBalanceCDF;

            const currentBalance = currency === 'USD' ? wallet.balance_usd : wallet.balance_cdf;

            // Check wallet balance limit
            if (currentBalance + amount > maxBalance) {
                throw new Error(
                    `Le solde wallet ne peut pas dépasser ${maxBalance} ${currency} pour des raisons de sécurité`
                );
            }

            // Create funding transaction (pending verification)
            const transaction = await Transaction.create({
                user_id: userId,
                wallet_id: wallet.id,
                type: 'fund_from_bank',
                status: 'pending', // Requires admin verification
                currency,
                amount_gross: amount,
                amount_commission: 0,
                amount_net: amount,
                withdrawal_bank_name: bankAccount.bank_name,
                withdrawal_account_number: bankAccount.account_number,
                withdrawal_account_name: bankAccount.account_name,
                metadata: {
                    bank_account_id: bankAccountId,
                    segregation: 'funding',
                    ...metadata
                }
            }, { transaction: dbTransaction });

            await dbTransaction.commit();

            logger.info(`Funding request created: ${amount} ${currency}`, {
                userId,
                transactionRef: transaction.transaction_ref,
                status: 'pending_verification'
            });

            return {
                success: true,
                transaction_ref: transaction.transaction_ref,
                amount,
                currency,
                from: 'bank_account',
                to: 'virtual_wallet',
                status: 'pending',
                message: 'Demande de financement créée. En attente de vérification bancaire.',
                bank_account: {
                    bank_name: bankAccount.bank_name,
                    account_number: this.maskAccountNumber(bankAccount.account_number)
                }
            };

        } catch (error) {
            await dbTransaction.rollback();
            logger.error('Fund from bank error:', error);
            throw error;
        }
    }

    /**
     * Admin: Approve funding from bank (after bank verification)
     * @param {string} transactionRef
     * @param {string} adminId
     * @returns {Promise<Object>}
     */
    async approveFunding(transactionRef, adminId) {
        const dbTransaction = await sequelize.transaction();

        try {
            const transaction = await Transaction.findOne({
                where: {
                    transaction_ref: transactionRef,
                    type: 'fund_from_bank',
                    status: 'pending'
                }
            });

            if (!transaction) {
                throw new Error('Transaction non trouvée ou déjà traitée');
            }

            const wallet = await Wallet.findByPk(transaction.wallet_id);

            // Credit wallet
            await wallet.credit(transaction.amount_net, transaction.currency, dbTransaction);

            // Update transaction
            transaction.status = 'success';
            transaction.completed_at = new Date();
            transaction.metadata = {
                ...transaction.metadata,
                approved_by: adminId,
                approved_at: new Date()
            };
            await transaction.save({ transaction: dbTransaction });

            // Update bank account balance
            const bankAccountId = transaction.metadata?.bank_account_id;
            if (bankAccountId) {
                const bankAccount = await BankAccount.findByPk(bankAccountId);
                if (bankAccount) {
                    const currentBalance = bankAccount.metadata?.balance || 0;
                    bankAccount.metadata = {
                        ...bankAccount.metadata,
                        balance: Math.max(0, parseFloat(currentBalance) - parseFloat(transaction.amount_net)),
                        last_funding_at: new Date()
                    };
                    await bankAccount.save({ transaction: dbTransaction });
                }
            }

            // Create ledger entries
            await LedgerEntry.recordDoubleEntry({
                transactionId: transaction.id,
                debitAccount: `merchant_bank_${transaction.currency.toLowerCase()}`,
                creditAccount: `merchant_wallet_${transaction.currency.toLowerCase()}`,
                amount: transaction.amount_net,
                currency: transaction.currency,
                description: `Funding from bank - ${transaction.transaction_ref}`,
                metadata: {
                    approved_by: adminId
                },
                dbTransaction
            });

            await dbTransaction.commit();

            logger.info(`Funding approved: ${transaction.transaction_ref}`, { adminId });

            return {
                success: true,
                transaction_ref: transaction.transaction_ref,
                amount: transaction.amount_net,
                currency: transaction.currency,
                new_wallet_balance: transaction.currency === 'USD'
                    ? wallet.balance_usd
                    : wallet.balance_cdf
            };

        } catch (error) {
            await dbTransaction.rollback();
            logger.error('Approve funding error:', error);
            throw error;
        }
    }

    /**
     * Auto-sweep excess funds from wallet to bank
     * Called by cron job daily
     * @param {string} userId
     * @returns {Promise<Object>}
     */
    async autoSweep(userId) {
        try {
            const wallet = await Wallet.findOne({ where: { user_id: userId } });
            const defaultBankAccounts = await BankAccount.findAll({
                where: {
                    user_id: userId,
                    is_verified: true,
                    is_default: true
                }
            });

            if (!wallet || defaultBankAccounts.length === 0) {
                return { success: false, message: 'Wallet ou compte bancaire par défaut non trouvé' };
            }

            const sweeps = [];

            // Check USD
            const thresholdUSD = this.autoSweepThresholdUSD;
            const minBalanceUSD = this.minOperationalBalanceUSD;

            if (wallet.balance_usd > thresholdUSD) {
                const excessUSD = wallet.balance_usd - minBalanceUSD;
                const bankAccountUSD = defaultBankAccounts.find(ba => ba.currency === 'USD');

                if (bankAccountUSD && excessUSD > 0) {
                    const result = await this.sweepToBank(userId, excessUSD, 'USD', bankAccountUSD.id);
                    sweeps.push(result);
                }
            }

            // Check CDF
            const thresholdCDF = this.autoSweepThresholdCDF;
            const minBalanceCDF = this.minOperationalBalanceCDF;

            if (wallet.balance_cdf > thresholdCDF) {
                const excessCDF = wallet.balance_cdf - minBalanceCDF;
                const bankAccountCDF = defaultBankAccounts.find(ba => ba.currency === 'CDF');

                if (bankAccountCDF && excessCDF > 0) {
                    const result = await this.sweepToBank(userId, excessCDF, 'CDF', bankAccountCDF.id);
                    sweeps.push(result);
                }
            }

            return {
                success: true,
                user_id: userId,
                sweeps_performed: sweeps.length,
                sweeps
            };

        } catch (error) {
            logger.error('Auto-sweep error:', error);
            throw error;
        }
    }

    /**
     * Calculate segregation status for a currency
     */
    calculateSegregationStatus(walletBalance, bankBalance, currency) {
        const maxBalance = currency === 'USD' ? this.maxWalletBalanceUSD : this.maxWalletBalanceCDF;
        const threshold = currency === 'USD' ? this.autoSweepThresholdUSD : this.autoSweepThresholdCDF;
        const minOperational = currency === 'USD' ? this.minOperationalBalanceUSD : this.minOperationalBalanceCDF;

        const totalBalance = parseFloat(walletBalance) + parseFloat(bankBalance);
        const walletUsagePercent = totalBalance > 0 ? (walletBalance / totalBalance) * 100 : 0;

        return {
            wallet_balance: parseFloat(walletBalance).toFixed(2),
            bank_balance: parseFloat(bankBalance).toFixed(2),
            total_balance: parseFloat(totalBalance).toFixed(2),
            wallet_max_limit: maxBalance,
            wallet_available_capacity: Math.max(0, maxBalance - walletBalance),
            auto_sweep_threshold: threshold,
            min_operational_balance: minOperational,
            wallet_usage_percent: parseFloat(walletUsagePercent).toFixed(2),
            requires_sweep: walletBalance > threshold,
            can_accept_funding: walletBalance < maxBalance
        };
    }

    /**
     * Calculate total bank balance from accounts
     */
    calculateBankBalance(bankAccounts, currency) {
        return bankAccounts
            .filter(ba => ba.currency === currency)
            .reduce((sum, ba) => sum + (parseFloat(ba.metadata?.balance) || 0), 0);
    }

    /**
     * Mask account number for security
     */
    maskAccountNumber(accountNumber) {
        if (!accountNumber || accountNumber.length < 4) return '****';
        return '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4);
    }
}

module.exports = new FundSegregationService();
