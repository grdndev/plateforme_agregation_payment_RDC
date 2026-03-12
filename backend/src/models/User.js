const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const config = require('../config');
const encryption = require('../utils/encryption');

class User extends Model {
    // Instance methods
    async comparePassword(candidatePassword) {
        return bcrypt.compare(candidatePassword, this.password);
    }

    async incrementLoginAttempts() {
        this.login_attempts += 1;
        this.last_login_attempt = new Date();

        if (this.login_attempts >= config.security.maxLoginAttempts) {
            this.account_locked_until = new Date(
                Date.now() + config.security.lockoutDuration * 60 * 1000
            );
        }

        await this.save();
    }

    async loginSuccess(ip) {
        this.login_attempts = 0;
        this.account_locked_until = null;
        this.last_login_attempt = new Date();
        this.last_login_at = new Date();
        this.last_login_ip = ip;

        await this.save();
    }

    isAccountLocked() {
        if (!this.account_locked_until) return false;
        return new Date() < this.account_locked_until;
    }

    toSafeObject() {
        const { password, api_hash_sandbox, api_hash_production, two_fa_secret, ...safeUser } = this.toJSON();
        return safeUser;
    }
}

User.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('merchant_owner', 'merchant_collaborator', 'admin', 'super_admin', 'support'),
        allowNull: false,
        defaultValue: 'merchant_owner'
    },
    status: {
        type: DataTypes.ENUM('sandbox', 'pending_validation', 'active', 'suspended', 'closed'),
        allowNull: false,
        defaultValue: 'sandbox'
    },
    first_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    company_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    company_type: {
        type: DataTypes.ENUM('individual', 'company'),
        allowNull: true
    },
    website_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    business_description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    estimated_monthly_volume: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true
    },

    // API Keys (encrypted)
    api_key_sandbox: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const value = this.getDataValue('api_key_sandbox');
            return value ? encryption.decrypt(value) : null;
        },
        set(value) {
            if (value) {
                this.setDataValue('api_key_sandbox', encryption.encrypt(value));
            }
        }
    },
    api_hash_sandbox: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    api_key_production: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const value = this.getDataValue('api_key_production');
            return value ? encryption.decrypt(value) : null;
        },
        set(value) {
            if (value) {
                this.setDataValue('api_key_production', encryption.encrypt(value));
            }
        }
    },
    api_hash_production: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    // IP Whitelist
    ip_whitelist: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
    },

    // 2FA
    two_fa_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    two_fa_secret: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const value = this.getDataValue('two_fa_secret');
            return value ? encryption.decrypt(value) : null;
        },
        set(value) {
            if (value) {
                this.setDataValue('two_fa_secret', encryption.encrypt(value));
            } else {
                this.setDataValue('two_fa_secret', null);
            }
        }
    },

    // Customization
    payment_page_logo_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    payment_page_color: {
        type: DataTypes.STRING,
        defaultValue: '#f39c12'
    },

    // Webhooks & Redirects
    webhook_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    success_redirect_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    failure_redirect_url: {
        type: DataTypes.STRING,
        allowNull: true
    },

    // Notifications preferences
    email_notifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    sms_notifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },

    // Security
    login_attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    last_login_attempt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    account_locked_until: {
        type: DataTypes.DATE,
        allowNull: true
    },
    last_login_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    last_login_ip: {
        type: DataTypes.STRING,
        allowNull: true
    },

    // Permissions (for collaborators)
    permissions: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },

    // Timestamps
    email_verified_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    validated_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    suspended_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    suspension_reason: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    indexes: [
        { fields: ['email'], unique: true },
        { fields: ['status'] },
        { fields: ['role'] },
        { fields: ['created_at'] }
    ],
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                user.password = await bcrypt.hash(user.password, config.security.bcryptRounds);
            }

            // Generate API keys for sandbox on creation
            if (user.role === 'merchant_owner') {
                user.api_key_sandbox = `alma_test_sk_${encryption.generateToken(32)}`;
                user.api_hash_sandbox = encryption.hash(user.api_key_sandbox);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                user.password = await bcrypt.hash(user.password, config.security.bcryptRounds);
            }

            if (user.changed('api_key_sandbox')) {
                user.api_hash_sandbox = encryption.hash(user.api_key_sandbox);
            }

            if (user.changed('api_key_production')) {
                user.api_hash_production = encryption.hash(user.api_key_production);
            }
        }
    }
});

module.exports = User;
