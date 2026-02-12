const { User, Wallet } = require('../models');
const logger = require('../utils/logger');

/**
 * Authenticate requests using API Key (for public Payment API)
 * Different from JWT - this is for merchant-to-server API calls
 */
const authenticateApiKey = async (req, res, next) => {
    try {
        // Get API key from header
        const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

        if (!apiKey) {
            return res.status(401).json({
                success: false,
                message: 'Clé API manquante',
                hint: 'Ajoutez votre clé API dans le header X-API-Key ou Authorization'
            });
        }

        // Determine environment (sandbox or production)
        const isSandbox = apiKey.startsWith('sk_test_');
        const isProduction = apiKey.startsWith('sk_live_');

        if (!isSandbox && !isProduction) {
            return res.status(401).json({
                success: false,
                message: 'Format de clé API invalide'
            });
        }

        // Find user by API key
        const whereClause = isSandbox
            ? { api_key_sandbox: apiKey }
            : { api_key_production: apiKey };

        const user = await User.findOne({
            where: whereClause,
            include: [{
                model: Wallet,
                as: 'wallet'
            }]
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Clé API invalide'
            });
        }

        // Check account status
        if (user.status === 'suspended') {
            return res.status(403).json({
                success: false,
                message: 'Compte suspendu',
                reason: user.suspension_reason
            });
        }

        if (user.status === 'closed') {
            return res.status(403).json({
                success: false,
                message: 'Compte fermé'
            });
        }

        // For production keys, account must be active
        if (isProduction && user.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Compte non actif',
                hint: 'Votre compte doit être validé pour utiliser les clés de production'
            });
        }

        // Check IP whitelist if configured
        if (user.ip_whitelist && user.ip_whitelist.length > 0) {
            const clientIp = req.ip || req.connection.remoteAddress;

            if (!user.ip_whitelist.includes(clientIp)) {
                logger.warn(`API key used from non-whitelisted IP: ${clientIp}`, {
                    userId: user.id,
                    email: user.email
                });

                return res.status(403).json({
                    success: false,
                    message: 'Adresse IP non autorisée',
                    hint: 'Configurez votre liste blanche d\'IPs dans les paramètres'
                });
            }
        }

        // Attach user and environment to request
        req.user = user;
        req.userId = user.id;
        req.environment = isSandbox ? 'sandbox' : 'production';
        req.isProduction = isProduction;

        next();
    } catch (error) {
        logger.error('API key authentication error:', error);

        return res.status(500).json({
            success: false,
            message: 'Erreur d\'authentification'
        });
    }
};

module.exports = {
    authenticateApiKey
};
