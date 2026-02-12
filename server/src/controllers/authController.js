const jwt = require('jsonwebtoken');
const { User, Wallet } = require('../models');
const { sequelize } = require('../config/database');
const config = require('../config');
const logger = require('../utils/logger');
const encryption = require('../utils/encryption');
const { authenticator } = require('otplib');
const QRCode = require('qrcode');

/**
 * Generate JWT tokens
 */
const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        { userId },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
    );

    const refreshToken = jwt.sign(
        { userId, type: 'refresh' },
        config.jwt.secret,
        { expiresIn: config.jwt.refreshExpiresIn }
    );

    return { accessToken, refreshToken };
};

/**
 * Generate temporary 2FA session token
 */
const generate2FASessionToken = (userId) => {
    return jwt.sign(
        { userId, type: '2fa_pending' },
        config.jwt.secret,
        { expiresIn: '5m' }
    );
};

class AuthController {
    /**
     * Register new merchant
     * POST /api/auth/register
     */
    static async register(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const {
                email,
                password,
                first_name,
                last_name,
                company_name,
                company_type,
                phone,
                website_url
            } = req.body;

            // Check if user already exists
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                await transaction.rollback();
                return res.status(409).json({
                    success: false,
                    message: 'Un compte existe déjà avec cet email'
                });
            }

            // Create user (starts in sandbox mode)
            const user = await User.create({
                email,
                password,
                first_name,
                last_name,
                company_name,
                company_type,
                phone,
                website_url,
                role: 'merchant_owner',
                status: 'sandbox'
            }, { transaction });

            // Create wallet for user
            await Wallet.create({
                user_id: user.id
            }, { transaction });

            await transaction.commit();

            // Generate tokens
            const tokens = generateTokens(user.id);

            logger.info(`New merchant registered: ${user.email} (${user.id})`);

            res.status(201).json({
                success: true,
                message: 'Compte créé avec succès en mode Sandbox',
                data: {
                    user: user.toSafeObject(),
                    tokens
                },
                hint: 'Vous pouvez maintenant tester l\'intégration avec vos clés API sandbox'
            });
        } catch (error) {
            await transaction.rollback();
            logger.error('Registration error:', error);

            res.status(500).json({
                success: false,
                message: 'Erreur lors de la création du compte'
            });
        }
    }

    /**
     * Login user
     * POST /api/auth/login
     */
    static async login(req, res) {
        try {
            const { email, password } = req.body;

            // Find user
            const user = await User.findOne({ where: { email } });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Email ou mot de passe incorrect'
                });
            }

            // Check if account is locked
            if (user.isAccountLocked()) {
                return res.status(403).json({
                    success: false,
                    message: 'Compte temporairement verrouillé',
                    hint: 'Trop de tentatives de connexion échouées. Réessayez plus tard.'
                });
            }

            // Verify password
            const isPasswordValid = await user.comparePassword(password);

            if (!isPasswordValid) {
                await user.incrementLoginAttempts();

                return res.status(401).json({
                    success: false,
                    message: 'Email ou mot de passe incorrect'
                });
            }

            // Reset login attempts on successful login
            await user.resetLoginAttempts();

            // Update last login
            user.last_login_at = new Date();
            user.last_login_ip = req.ip;
            await user.save();

            // 2FA logic
            const isAdmin = ['admin', 'super_admin', 'support'].includes(user.role);

            if (user.two_fa_enabled) {
                const sessionToken = generate2FASessionToken(user.id);
                return res.json({
                    success: true,
                    message: '2FA requis',
                    data: {
                        require_2fa: true,
                        session_token: sessionToken
                    }
                });
            } else if (isAdmin) {
                // Admin MUST setup 2FA
                const tokens = generateTokens(user.id); // For now allow login but flag it
                return res.json({
                    success: true,
                    message: 'Connexion réussie. Veuillez activer la 2FA immédiatement.',
                    data: {
                        user: user.toSafeObject(),
                        tokens,
                        force_2fa_setup: true
                    }
                });
            }

            // Generate tokens
            const tokens = generateTokens(user.id);

            logger.info(`User logged in: ${user.email}`);

            res.json({
                success: true,
                message: 'Connexion réussie',
                data: {
                    user: user.toSafeObject(),
                    tokens
                }
            });
        } catch (error) {
            logger.error('Login error:', error);

            res.status(500).json({
                success: false,
                message: 'Erreur lors de la connexion'
            });
        }
    }

    /**
     * Refresh access token
     * POST /api/auth/refresh
     */
    static async refresh(req, res) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Refresh token requis'
                });
            }

            // Verify refresh token
            const decoded = jwt.verify(refreshToken, config.jwt.secret);

            if (decoded.type !== 'refresh') {
                return res.status(401).json({
                    success: false,
                    message: 'Token invalide'
                });
            }

            // Verify user still exists
            const user = await User.findByPk(decoded.userId);

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Utilisateur non trouvé'
                });
            }

            // Generate new tokens
            const tokens = generateTokens(user.id);

            res.json({
                success: true,
                message: 'Tokens rafraîchis',
                data: { tokens }
            });
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Refresh token expiré',
                    code: 'REFRESH_TOKEN_EXPIRED'
                });
            }

            logger.error('Token refresh error:', error);

            res.status(401).json({
                success: false,
                message: 'Erreur lors du rafraîchissement du token'
            });
        }
    }

    /**
     * Get current user profile
     * GET /api/auth/me
     */
    static async getProfile(req, res) {
        try {
            const user = await User.findByPk(req.userId, {
                include: [
                    {
                        model: Wallet,
                        as: 'wallet',
                        attributes: ['balance_cdf', 'balance_usd']
                    }
                ]
            });

            res.json({
                success: true,
                data: {
                    user: user.toSafeObject(),
                    wallet: user.wallet
                }
            });
        } catch (error) {
            logger.error('Get profile error:', error);

            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération du profil'
            });
        }
    }

    /**
     * Update user profile
     * PUT /api/auth/profile
     */
    static async updateProfile(req, res) {
        try {
            const user = await User.findByPk(req.userId);

            const {
                first_name,
                last_name,
                phone,
                company_name,
                website_url,
                business_description,
                estimated_monthly_volume
            } = req.body;

            // Update allowed fields
            if (first_name !== undefined) user.first_name = first_name;
            if (last_name !== undefined) user.last_name = last_name;
            if (phone !== undefined) user.phone = phone;
            if (company_name !== undefined) user.company_name = company_name;
            if (website_url !== undefined) user.website_url = website_url;
            if (business_description !== undefined) user.business_description = business_description;
            if (estimated_monthly_volume !== undefined) user.estimated_monthly_volume = estimated_monthly_volume;

            await user.save();

            logger.info(`Profile updated: ${user.email}`);

            res.json({
                success: true,
                message: 'Profil mis à jour avec succès',
                data: { user: user.toSafeObject() }
            });
        } catch (error) {
            logger.error('Update profile error:', error);

            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour du profil'
            });
        }
    }

    /**
     * Get API keys
     * GET /api/auth/api-keys
     */
    static async getApiKeys(req, res) {
        try {
            const user = await User.findByPk(req.userId);

            res.json({
                success: true,
                data: {
                    sandbox: {
                        api_key: user.api_key_sandbox,
                        api_secret: user.api_secret_sandbox
                    },
                    production: user.status === 'active' ? {
                        api_key: user.api_key_production,
                        api_secret: user.api_secret_production
                    } : null
                },
                hint: user.status !== 'active'
                    ? 'Les clés de production seront disponibles après validation de votre compte'
                    : undefined
            });
        } catch (error) {
            logger.error('Get API keys error:', error);

            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des clés API'
            });
        }
    }

    /**
     * Regenerate API keys
     * POST /api/auth/regenerate-keys
     */
    static async regenerateApiKeys(req, res) {
        try {
            const { environment } = req.body; // 'sandbox' or 'production'

            const user = await User.findByPk(req.userId);

            if (environment === 'sandbox') {
                user.api_key_sandbox = `sk_test_${encryption.generateToken(32)}`;
                user.api_secret_sandbox = encryption.generateToken(48);
            } else if (environment === 'production') {
                if (user.status !== 'active') {
                    return res.status(403).json({
                        success: false,
                        message: 'Compte non actif. Impossible de régénérer les clés de production.'
                    });
                }
                user.api_key_production = `sk_live_${encryption.generateToken(32)}`;
                user.api_secret_production = encryption.generateToken(48);
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Environnement invalide (sandbox ou production)'
                });
            }

            await user.save();

            logger.warn(`API keys regenerated for ${user.email} (${environment})`);

            res.json({
                success: true,
                message: `Clés ${environment} régénérées avec succès`,
                data: {
                    api_key: environment === 'sandbox' ? user.api_key_sandbox : user.api_key_production,
                    api_secret: environment === 'sandbox' ? user.api_secret_sandbox : user.api_secret_production
                },
                warning: 'Vos anciennes clés ne fonctionneront plus. Mettez à jour votre intégration.'
            });
        } catch (error) {
            logger.error('Regenerate API keys error:', error);

            res.status(500).json({
                success: false,
                message: 'Erreur lors de la régénération des clés'
            });
        }
    }

    /**
     * Complete 2FA Login
     * POST /api/auth/login/2fa
     */
    static async login2FA(req, res) {
        try {
            const { token, session_token } = req.body;

            if (!token || !session_token) {
                return res.status(400).json({
                    success: false,
                    message: 'Token 2FA et session_token requis'
                });
            }

            // Verify session token
            let decoded;
            try {
                decoded = jwt.verify(session_token, config.jwt.secret);
            } catch (error) {
                return res.status(401).json({
                    success: false,
                    message: 'Session de connexion expirée'
                });
            }

            if (decoded.type !== '2fa_pending') {
                return res.status(401).json({
                    success: false,
                    message: 'Session invalide'
                });
            }

            // Get user
            const user = await User.findByPk(decoded.userId);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Utilisateur non trouvé'
                });
            }

            // Verify TOTP token
            const isValid = authenticator.verify({
                token,
                secret: user.two_fa_secret
            });

            if (!isValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Code 2FA invalide'
                });
            }

            // Generate final tokens
            const tokens = generateTokens(user.id);

            // Update last login
            user.last_login_at = new Date();
            user.last_login_ip = req.ip;
            await user.save();

            logger.info(`User logged in with 2FA: ${user.email}`);

            res.json({
                success: true,
                message: 'Connexion réussie',
                data: {
                    user: user.toSafeObject(),
                    tokens
                }
            });
        } catch (error) {
            logger.error('2FA Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la validation 2FA'
            });
        }
    }

    /**
     * Setup 2FA - Step 1: Generate secret
     * POST /api/auth/2fa/setup
     */
    static async setup2FA(req, res) {
        try {
            const user = await User.findByPk(req.userId);

            if (user.two_fa_enabled) {
                return res.status(400).json({
                    success: false,
                    message: '2FA est déjà activé'
                });
            }

            // Generate secret
            const secret = authenticator.generateSecret();

            // Save temporary secret (or just return it, but better to save it as pending)
            // Using a separate field for pending secret would be safer, but let's use two_fa_secret for now
            // and only set two_fa_enabled when verified.
            user.two_fa_secret = secret;
            await user.save();

            // Generate OTP Auth URL
            const otpauth = authenticator.keyuri(
                user.email,
                'TOURPEX',
                secret
            );

            // Generate QR Code
            const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

            res.json({
                success: true,
                data: {
                    secret,
                    qr_code: qrCodeDataUrl
                }
            });
        } catch (error) {
            logger.error('2FA Setup error:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la configuration 2FA'
            });
        }
    }

    /**
     * Setup 2FA - Step 2: Verify and Enable
     * POST /api/auth/2fa/verify
     */
    static async verify2FA(req, res) {
        try {
            const { token } = req.body;
            const user = await User.findByPk(req.userId);

            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'Code 2FA requis'
                });
            }

            const isValid = authenticator.verify({
                token,
                secret: user.two_fa_secret
            });

            if (!isValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Code 2FA invalide'
                });
            }

            user.two_fa_enabled = true;
            await user.save();

            logger.info(`2FA enabled for user: ${user.email}`);

            res.json({
                success: true,
                message: '2FA activé avec succès'
            });
        } catch (error) {
            logger.error('2FA Verification error:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la vérification 2FA'
            });
        }
    }

    /**
     * Disable 2FA
     * POST /api/auth/2fa/disable
     */
    static async disable2FA(req, res) {
        try {
            const { password, token } = req.body;
            const user = await User.findByPk(req.userId);

            // Verify password
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Mot de passe incorrect'
                });
            }

            // Verify TOTP token
            const isValid = authenticator.verify({
                token,
                secret: user.two_fa_secret
            });

            if (!isValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Code 2FA invalide'
                });
            }

            user.two_fa_enabled = false;
            user.two_fa_secret = null;
            await user.save();

            logger.info(`2FA disabled for user: ${user.email}`);

            res.json({
                success: true,
                message: '2FA désactivé avec succès'
            });
        } catch (error) {
            logger.error('2FA Disable error:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la désactivation 2FA'
            });
        }
    }

    /**
     * Request Production Access
     * POST /api/auth/request-production
     */
    static async requestProduction(req, res) {
        try {
            const user = await User.findByPk(req.userId);

            if (user.status !== 'sandbox') {
                return res.status(400).json({
                    success: false,
                    message: `Impossible de demander l'accès production (statut actuel: ${user.status})`
                });
            }

            // Check if KYC is completed
            const kycDocuments = await user.getKycDocuments();
            if (!kycDocuments || kycDocuments.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Veuillez soumettre vos documents KYC avant de demander l\'accès production'
                });
            }

            user.status = 'pending_validation';
            await user.save();

            logger.info(`Merchant requested production access: ${user.email}`);

            res.json({
                success: true,
                message: 'Demande d\'accès production envoyée avec succès. Notre équipe va valider votre compte.'
            });
        } catch (error) {
            logger.error('Request production error:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la demande d\'accès production'
            });
        }
    }
}

module.exports = AuthController;
