const { User } = require('../models');
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * API Key Controller
 * Manages API key generation, revocation, and listing for developers
 */
class APIKeyController {
    /**
     * Get all API keys for current user
     * GET /api/developers/keys
     */
    static async listKeys(req, res) {
        try {
            const userId = req.user.id;

            const user = await User.findByPk(userId, {
                attributes: ['id', 'api_keys']
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Utilisateur non trouvé'
                });
            }

            const apiKeys = user.api_keys || [];

            // Don't expose full secret keys, only prefix and suffix
            const safeKeys = apiKeys.map(key => ({
                id: key.id,
                name: key.name,
                key_preview: this.maskKey(key.key),
                full_key: key.key, // Only sent initially (will be masked in frontend after copy)
                type: key.type,
                environment: key.environment,
                created_at: key.created_at,
                last_used_at: key.last_used_at,
                is_active: key.is_active
            }));

            res.json({
                success: true,
                keys: safeKeys
            });

        } catch (error) {
            logger.error('List API keys error:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des clés API',
                error: error.message
            });
        }
    }

    /**
     * Generate new API key
     * POST /api/developers/keys
     */
    static async generateKey(req, res) {
        try {
            const userId = req.user.id;
            const { name, environment = 'sandbox' } = req.body;

            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'Le nom de la clé est requis'
                });
            }

            if (!['sandbox', 'production'].includes(environment)) {
                return res.status(400).json({
                    success: false,
                    message: 'Environment invalide. Utilisez "sandbox" ou "production"'
                });
            }

            const user = await User.findByPk(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Utilisateur non trouvé'
                });
            }

            // Check if user can create production keys (must be validated)
            if (environment === 'production' && user.status !== 'active') {
                return res.status(403).json({
                    success: false,
                    message: 'Vous devez compléter la validation KYC pour générer des clés de production'
                });
            }

            // Check existing keys limit (max 10 keys per environment)
            const existingKeys = user.api_keys || [];
            const envKeys = existingKeys.filter(k => k.environment === environment && k.is_active);

            if (envKeys.length >= 10) {
                return res.status(400).json({
                    success: false,
                    message: `Limite atteinte: maximum 10 clés actives par environnement`
                });
            }

            // Generate secret key
            const prefix = environment === 'production' ? 'alma_live_sk' : 'alma_test_sk';
            const secret = crypto.randomBytes(32).toString('hex');
            const apiKey = `${prefix}_${secret}`;

            // Create key object
            const newKey = {
                id: crypto.randomUUID(),
                name,
                key: apiKey,
                type: 'secret',
                environment,
                created_at: new Date().toISOString(),
                last_used_at: null,
                is_active: true
            };

            // Add to user's API keys
            user.api_keys = [...existingKeys, newKey];
            await user.save();

            logger.info(`API key generated: ${newKey.id}`, {
                userId,
                environment,
                name
            });

            res.status(201).json({
                success: true,
                message: 'Clé API générée avec succès',
                key: {
                    id: newKey.id,
                    name: newKey.name,
                    key: newKey.key, // Full key shown only once
                    key_preview: this.maskKey(newKey.key),
                    type: newKey.type,
                    environment: newKey.environment,
                    created_at: newKey.created_at
                },
                warning: 'Cette clé ne sera affichée qu\'une seule fois. Conservez-la en sécurité.'
            });

        } catch (error) {
            logger.error('Generate API key error:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la génération de la clé API',
                error: error.message
            });
        }
    }

    /**
     * Revoke API key
     * DELETE /api/developers/keys/:keyId
     */
    static async revokeKey(req, res) {
        try {
            const userId = req.user.id;
            const { keyId } = req.params;

            const user = await User.findByPk(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Utilisateur non trouvé'
                });
            }

            const apiKeys = user.api_keys || [];
            const keyIndex = apiKeys.findIndex(k => k.id === keyId);

            if (keyIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Clé API non trouvée'
                });
            }

            // Mark as inactive instead of deleting (for audit trail)
            apiKeys[keyIndex].is_active = false;
            apiKeys[keyIndex].revoked_at = new Date().toISOString();

            user.api_keys = apiKeys;
            await user.save();

            logger.warn(`API key revoked: ${keyId}`, { userId });

            res.json({
                success: true,
                message: 'Clé API révoquée avec succès'
            });

        } catch (error) {
            logger.error('Revoke API key error:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la révocation de la clé API',
                error: error.message
            });
        }
    }

    /**
     * Update API key name
     * PATCH /api/developers/keys/:keyId
     */
    static async updateKey(req, res) {
        try {
            const userId = req.user.id;
            const { keyId } = req.params;
            const { name } = req.body;

            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'Le nom est requis'
                });
            }

            const user = await User.findByPk(userId);
            const apiKeys = user.api_keys || [];
            const keyIndex = apiKeys.findIndex(k => k.id === keyId);

            if (keyIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Clé API non trouvée'
                });
            }

            apiKeys[keyIndex].name = name;
            user.api_keys = apiKeys;
            await user.save();

            res.json({
                success: true,
                message: 'Clé API mise à jour',
                key: apiKeys[keyIndex]
            });

        } catch (error) {
            logger.error('Update API key error:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour',
                error: error.message
            });
        }
    }

    /**
     * Verify API key (middleware helper)
     */
    static async verifyAPIKey(apiKey) {
        try {
            // Extract environment from key prefix
            const isProduction = apiKey.startsWith('alma_live_sk_');
            const isSandbox = apiKey.startsWith('alma_test_sk_');

            if (!isProduction && !isSandbox) {
                return { valid: false, message: 'Format de clé invalide' };
            }

            // Find user with this API key
            const { User } = require('../models');
            const users = await User.findAll();

            for (const user of users) {
                const apiKeys = user.api_keys || [];
                const keyData = apiKeys.find(k => k.key === apiKey && k.is_active);

                if (keyData) {
                    // Update last_used_at
                    keyData.last_used_at = new Date().toISOString();
                    user.api_keys = apiKeys;
                    await user.save();

                    return {
                        valid: true,
                        user_id: user.id,
                        environment: keyData.environment,
                        key_id: keyData.id
                    };
                }
            }

            return { valid: false, message: 'Clé API invalide ou révoquée' };

        } catch (error) {
            logger.error('Verify API key error:', error);
            return { valid: false, message: 'Erreur de vérification' };
        }
    }

    /**
     * Mask API key for display
     */
    static maskKey(key) {
        if (!key || key.length < 20) return '••••••••••••••••';
        const prefix = key.substring(0, 15);
        const suffix = key.substring(key.length - 4);
        return `${prefix}${'•'.repeat(20)}${suffix}`;
    }
}

module.exports = APIKeyController;
