const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to check validation results
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Erreur de validation',
            errors: errors.array().map(err => ({
                field: err.path || err.param,
                message: err.msg,
                value: err.value
            }))
        });
    }

    next();
};

/**
 * Common validation rules
 */
const validators = {
    // Email validation
    email: body('email')
        .trim()
        .isEmail().withMessage('Email invalide')
        .normalizeEmail(),

    // Password validation
    password: body('password')
        .isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères')
        .matches(/[a-z]/).withMessage('Le mot de passe doit contenir au moins une minuscule')
        .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir au moins une majuscule')
        .matches(/[0-9]/).withMessage('Le mot de passe doit contenir au moins un chiffre'),

    // Phone number validation (RDC format)
    phone: body('phone')
        .optional()
        .matches(/^(\+243|0)[0-9]{9}$/).withMessage('Numéro de téléphone invalide (format: +243XXXXXXXXX ou 0XXXXXXXXX)'),

    // UUID validation
    uuid: (field = 'id') => param(field)
        .isUUID().withMessage('ID invalide'),

    // Amount validation
    amount: (field = 'amount') => body(field)
        .isFloat({ min: 0.01 }).withMessage('Montant invalide')
        .toFloat(),

    // Currency validation
    currency: body('currency')
        .isIn(['CDF', 'USD']).withMessage('Devise invalide (CDF ou USD uniquement)'),

    // Pagination
    page: query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Numéro de page invalide')
        .toInt(),

    limit: query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limite invalide (1-100)')
        .toInt()
};

/**
 * Validation schemas for specific endpoints
 */
const schemas = {
    // Auth registration
    register: [
        validators.email,
        validators.password,
        body('first_name').optional().trim().isLength({ min: 2 }).withMessage('Prénom trop court'),
        body('last_name').optional().trim().isLength({ min: 2 }).withMessage('Nom trop court'),
        body('company_name').optional().trim().isLength({ min: 2 }).withMessage('Nom d\'entreprise trop court'),
        body('company_type').optional().isIn(['individual', 'company']).withMessage('Type d\'entreprise invalide'),
        validate
    ],

    // Auth login
    login: [
        validators.email,
        body('password').notEmpty().withMessage('Mot de passe requis'),
        validate
    ],

    // Update profile
    updateProfile: [
        body('first_name').optional().trim().isLength({ min: 2 }),
        body('last_name').optional().trim().isLength({ min: 2 }),
        validators.phone,
        body('website_url').optional().isURL().withMessage('URL invalide'),
        validate
    ],

    // Create transaction
    createPayment: [
        validators.amount('amount'),
        validators.currency,
        body('order_id').trim().notEmpty().withMessage('ID de commande requis'),
        body('customer_phone')
            .trim()
            .matches(/^(\+243|0)[0-9]{9}$/).withMessage('Numéro de téléphone client invalide'),
        body('customer_name').optional().trim(),
        body('success_url').optional().isURL(),
        body('failure_url').optional().isURL(),
        validate
    ],

    // Conversion
    convertCurrency: [
        validators.amount('amount'),
        body('from_currency').isIn(['CDF', 'USD']).withMessage('Devise source invalide'),
        body('to_currency').isIn(['CDF', 'USD']).withMessage('Devise destination invalide'),
        validate
    ],

    // Withdrawal
    withdrawal: [
        validators.amount('amount'),
        validators.currency,
        body('bank_account_id').isUUID().withMessage('ID de compte bancaire invalide'),
        validate
    ],

    // Pagination
    pagination: [
        validators.page,
        validators.limit,
        validate
    ],

    // 2FA login
    login2fa: [
        body('token').isLength({ min: 6, max: 6 }).withMessage('Code 2FA doit contenir 6 chiffres'),
        body('session_token').notEmpty().withMessage('Session token requis'),
        validate
    ],

    // 2FA verification
    verify2fa: [
        body('token').isLength({ min: 6, max: 6 }).withMessage('Code 2FA doit contenir 6 chiffres'),
        validate
    ],

    // 2FA disable
    disable2fa: [
        body('token').isLength({ min: 6, max: 6 }).withMessage('Code 2FA doit contenir 6 chiffres'),
        body('password').notEmpty().withMessage('Mot de passe requis pour désactiver la 2FA'),
        validate
    ]
};

module.exports = {
    validate,
    validators,
    schemas
};
