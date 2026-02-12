const BankTransferProcessor = require('../services/withdrawal/BankTransferProcessor');
const SEPAGenerator = require('../services/withdrawal/SEPAGenerator');
const SWIFTGenerator = require('../services/withdrawal/SWIFTGenerator');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');

/**
 * Batch Transfer Controller
 * Admin endpoints for batch bank transfer file generation
 */
class BatchTransferController {
    /**
     * Generate batch transfer file (CSV for local banks)
     * POST /api/admin/batch/generate
     */
    static async generateBatch(req, res) {
        try {
            const { currency, format = 'csv' } = req.body;

            if (!['USD', 'CDF'].includes(currency)) {
                return res.status(400).json({
                    success: false,
                    message: 'Devise invalide. Utilisez USD ou CDF.'
                });
            }

            const result = await BankTransferProcessor.generateBatchFile(currency);

            if (!result.success) {
                return res.status(200).json(result);
            }

            res.json({
                success: true,
                message: 'Fichier batch généré avec succès',
                data: result
            });

        } catch (error) {
            logger.error('Batch generation error:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la génération du fichier batch',
                error: error.message
            });
        }
    }

    /**
     * Generate SEPA XML file (for EUR/USD international transfers)
     * POST /api/admin/batch/generate-sepa
     */
    static async generateSEPA(req, res) {
        try {
            const { currency = 'USD' } = req.body;

            const result = await SEPAGenerator.generateSEPAFile(currency);

            if (!result.success) {
                return res.status(200).json(result);
            }

            res.json({
                success: true,
                message: 'Fichier SEPA XML généré avec succès',
                data: result
            });

        } catch (error) {
            logger.error('SEPA generation error:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la génération du fichier SEPA',
                error: error.message
            });
        }
    }

    /**
     * Generate SWIFT MT103 file (for international wire transfers)
     * POST /api/admin/batch/generate-swift
     */
    static async generateSWIFT(req, res) {
        try {
            const { currency = 'USD' } = req.body;

            const result = await SWIFTGenerator.generateSWIFTFile(currency);

            if (!result.success) {
                return res.status(200).json(result);
            }

            res.json({
                success: true,
                message: 'Fichier SWIFT MT103 généré avec succès',
                data: result
            });

        } catch (error) {
            logger.error('SWIFT generation error:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la génération du fichier SWIFT',
                error: error.message
            });
        }
    }

    /**
     * Download generated batch file
     * GET /api/admin/batch/download/:filename
     */
    static async downloadBatch(req, res) {
        try {
            const { filename } = req.params;

            // Security: Prevent path traversal
            if (filename.includes('..') || filename.includes('/')) {
                return res.status(400).json({
                    success: false,
                    message: 'Nom de fichier invalide'
                });
            }

            const filePath = path.join(__dirname, '../../uploads/withdrawals', filename);

            // Check if file exists
            try {
                await fs.access(filePath);
            } catch {
                return res.status(404).json({
                    success: false,
                    message: 'Fichier non trouvé'
                });
            }

            // Set headers for download
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Type', 'application/octet-stream');

            // Stream file
            const fileStream = require('fs').createReadStream(filePath);
            fileStream.pipe(res);

        } catch (error) {
            logger.error('Batch download error:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors du téléchargement du fichier',
                error: error.message
            });
        }
    }

    /**
     * List all generated batch files
     * GET /api/admin/batch/files
     */
    static async listBatchFiles(req, res) {
        try {
            const withdrawalsDir = path.join(__dirname, '../../uploads/withdrawals');

            // Ensure directory exists
            await fs.mkdir(withdrawalsDir, { recursive: true });

            // Read directory
            const files = await fs.readdir(withdrawalsDir);

            // Get file stats
            const fileList = await Promise.all(
                files.map(async (filename) => {
                    const filePath = path.join(withdrawalsDir, filename);
                    const stats = await fs.stat(filePath);

                    return {
                        filename,
                        size: stats.size,
                        created_at: stats.birthtime,
                        modified_at: stats.mtime,
                        download_url: `/api/admin/batch/download/${filename}`
                    };
                })
            );

            // Sort by creation date (newest first)
            fileList.sort((a, b) => b.created_at - a.created_at);

            res.json({
                success: true,
                count: fileList.length,
                files: fileList
            });

        } catch (error) {
            logger.error('List batch files error:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des fichiers',
                error: error.message
            });
        }
    }

    /**
     * Get batch file statistics
     * GET /api/admin/batch/stats
     */
    static async getBatchStats(req, res) {
        try {
            const { period = 'month' } = req.query;

            const statsUSD = await BankTransferProcessor.getStatistics({
                period,
                currency: 'USD'
            });

            const statsCDF = await BankTransferProcessor.getStatistics({
                period,
                currency: 'CDF'
            });

            res.json({
                success: true,
                period,
                statistics: {
                    USD: statsUSD.statistics,
                    CDF: statsCDF.statistics
                }
            });

        } catch (error) {
            logger.error('Batch stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des statistiques',
                error: error.message
            });
        }
    }

    /**
     * Mark batch as sent to bank
     * POST /api/admin/batch/:batchId/sent
     */
    static async markBatchAsSent(req, res) {
        try {
            const { batchId } = req.params;
            const { sent_at, sent_by, notes } = req.body;

            // TODO: Create BatchHistory model to track batch submissions
            // For now, just log it

            logger.info(`Batch marked as sent: ${batchId}`, {
                sent_at: sent_at || new Date(),
                sent_by: sent_by || req.user.email,
                notes
            });

            res.json({
                success: true,
                message: 'Batch marqué comme envoyé à la banque',
                batch_id: batchId
            });

        } catch (error) {
            logger.error('Mark batch as sent error:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors du marquage du batch',
                error: error.message
            });
        }
    }
}

module.exports = BatchTransferController;
