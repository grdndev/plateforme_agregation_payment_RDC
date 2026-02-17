require('dotenv').config();

module.exports = {
    // Server Configuration
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    appUrl: process.env.APP_URL || 'http://localhost:3000',
    apiUrl: process.env.API_URL || 'http://localhost:5000',

    // Database Configuration
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        name: process.env.DB_NAME || 'alma_payment_db',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 10,
            min: 2,
            acquire: 30000,
            idle: 10000
        }
    },

    // Redis Configuration
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || null,
        db: 0
    },

    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'change_this_secret_in_production',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
    },

    // Encryption
    encryption: {
        algorithm: 'aes-256-cbc',
        key: process.env.ENCRYPTION_KEY || 'change_this_32_char_key_production'
    },

    // Mobile Money Operators
    mobileMoney: {
        mpesa: {
            apiKey: process.env.MPESA_API_KEY,
            apiSecret: process.env.MPESA_API_SECRET,
            shortcode: process.env.MPESA_SHORTCODE,
            passkey: process.env.MPESA_PASSKEY,
            callbackUrl: process.env.MPESA_CALLBACK_URL,
            baseUrl: process.env.MPESA_BASE_URL || 'https://api.vodacom.cd/mpesa',
            timeout: 30000
        },
        orange: {
            apiKey: process.env.ORANGE_API_KEY,
            apiSecret: process.env.ORANGE_API_SECRET,
            merchantCode: process.env.ORANGE_MERCHANT_CODE,
            callbackUrl: process.env.ORANGE_CALLBACK_URL,
            baseUrl: process.env.ORANGE_BASE_URL || 'https://api.orange.cd/omoney',
            timeout: 30000
        },
        airtel: {
            apiKey: process.env.AIRTEL_API_KEY,
            apiSecret: process.env.AIRTEL_API_SECRET,
            merchantId: process.env.AIRTEL_MERCHANT_ID,
            callbackUrl: process.env.AIRTEL_CALLBACK_URL,
            baseUrl: process.env.AIRTEL_BASE_URL || 'https://openapi.airtel.africa',
            timeout: 30000
        }
    },

    // Exchange Rate
    exchangeRate: {
        apiKey: process.env.EXCHANGE_RATE_API_KEY,
        apiUrl: process.env.EXCHANGE_RATE_API_URL,
        updateInterval: 3600000, // 1 hour in ms
        spread: parseFloat(process.env.EXCHANGE_RATE_SPREAD) || 2.5
    },

    // Commission Rates
    commissions: {
        collection: parseFloat(process.env.COMMISSION_RATE_COLLECTION) || 2.8,
        withdrawal: parseFloat(process.env.COMMISSION_RATE_WITHDRAWAL) || 1.7
    },

    // Operational Limits
    limits: {
        minWithdrawal: {
            USD: parseFloat(process.env.MIN_WITHDRAWAL_AMOUNT_USD) || 50,
            CDF: parseFloat(process.env.MIN_WITHDRAWAL_AMOUNT_CDF) || 142725
        },
        dailyWithdrawalCutoffHour: parseInt(process.env.DAILY_WITHDRAWAL_CUTOFF_HOUR) || 16,
        conversionLockDuration: 60, // seconds
        paymentTimeout: 300, // 5 minutes
        maxRetries: 3
    },

    // Email Configuration
    email: {
        provider: process.env.EMAIL_PROVIDER || 'sendgrid',
        apiKey: process.env.EMAIL_API_KEY,
        from: process.env.EMAIL_FROM || 'noreply@almapay.cd',
        fromName: process.env.EMAIL_FROM_NAME || 'Alma Pay'
    },

    // SMS Configuration
    sms: {
        provider: process.env.SMS_PROVIDER || 'twilio',
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        phoneNumber: process.env.TWILIO_PHONE_NUMBER
    },

    // Security
    security: {
        rateLimit: {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 min
            max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
        },
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
        lockoutDuration: parseInt(process.env.ACCOUNT_LOCKOUT_DURATION_MINUTES) || 30,
        bcryptRounds: 12
    },

    // File Upload
    upload: {
        maxSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 5) * 1024 * 1024, // MB to bytes
        path: process.env.UPLOAD_PATH || './uploads',
        allowedMimeTypes: [
            'image/jpeg',
            'image/png',
            'image/jpg',
            'application/pdf'
        ]
    },

    // Bank Configuration
    bank: {
        sftp: {
            host: process.env.BANK_SFTP_HOST,
            port: parseInt(process.env.BANK_SFTP_PORT) || 22,
            username: process.env.BANK_SFTP_USER,
            password: process.env.BANK_SFTP_PASSWORD
        }
    },

    // BCC Reporting
    bcc: {
        reportEmail: process.env.BCC_REPORT_EMAIL,
        sftp: {
            host: process.env.BCC_SFTP_HOST,
            username: process.env.BCC_SFTP_USER,
            password: process.env.BCC_SFTP_PASSWORD
        }
    },

    // Logging
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        sentryDsn: process.env.SENTRY_DSN
    },

    // Feature Flags
    features: {
        enable2FA: process.env.ENABLE_2FA === 'true',
        enableFraudDetection: process.env.ENABLE_FRAUD_DETECTION === 'true',
        enableAutoReconciliation: process.env.ENABLE_AUTO_RECONCILIATION === 'true'
    },

    // Phone Prefixes for Operator Detection
    operatorPrefixes: {
        mpesa: ['081', '082', '083', '084', '085'],
        orange_money: ['089', '084', '085'],
        airtel_money: ['097', '098', '099']
    }
};
