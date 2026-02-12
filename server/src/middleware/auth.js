const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');
const logger = require('../utils/logger');
const { hasPermission } = require('../utils/permissions');

/**
 * Middleware to verify JWT token and attach user to request
 */
const authenticateToken = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Jeton d\'authentification manquant'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, config.jwt.secret);

        // Get user from database
        const user = await User.findByPk(decoded.userId, {
            attributes: { exclude: ['password', 'two_fa_secret'] }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Check if account is suspended
        if (user.status === 'suspended') {
            return res.status(403).json({
                success: false,
                message: 'Compte suspendu',
                reason: user.suspension_reason
            });
        }

        // Check if account is closed
        if (user.status === 'closed') {
            return res.status(403).json({
                success: false,
                message: 'Compte fermé'
            });
        }

        // Attach user to request
        req.user = user;
        req.userId = user.id;

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Jeton expiré',
                code: 'TOKEN_EXPIRED'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Jeton invalide'
            });
        }

        logger.error('Authentication error:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur d\'authentification'
        });
    }
};

/**
 * Middleware to check if user has specific role
 */
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Non authentifié'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé',
                requiredRole: allowedRoles
            });
        }

        next();
    };
};

/**
 * Middleware to require active (production) account
 */
const requireActiveAccount = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Non authentifié'
        });
    }

    if (req.user.status !== 'active') {
        return res.status(403).json({
            success: false,
            message: 'Compte non actif',
            currentStatus: req.user.status,
            hint: req.user.status === 'sandbox'
                ? 'Veuillez compléter votre KYC pour activer votre compte'
                : 'Votre compte est en cours de validation'
        });
    }

    next();
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, config.jwt.secret);
            const user = await User.findByPk(decoded.userId, {
                attributes: { exclude: ['password', 'two_fa_secret'] }
            });

            if (user) {
                req.user = user;
                req.userId = user.id;
            }
        }
    } catch (error) {
        // Silently fail - it's optional
        logger.debug('Optional auth failed:', error.message);
    }

    next();
};

/**
 * Middleware to check if user has specific permission
 */
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Non authentifié'
            });
        }

        if (!hasPermission(req.user.role, permission)) {
            // Check for fine-grained permissions in User object (for collaborators)
            if (req.user.permissions && req.user.permissions[permission]) {
                return next();
            }

            return res.status(403).json({
                success: false,
                message: 'Permission insuffisante',
                requiredPermission: permission
            });
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    requireRole,
    requirePermission,
    requireActiveAccount,
    optionalAuth
};
