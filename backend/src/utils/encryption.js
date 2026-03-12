const crypto = require('crypto');
const config = require('../config');

class Encryption {
    constructor() {
        this.algorithm = config.encryption.algorithm;
        // Ensure key is exactly 32 bytes for aes-256
        this.key = Buffer.from(config.encryption.key.padEnd(32, '0').slice(0, 32));
    }

    /**
     * Encrypt sensitive data
     * @param {string} text - Text to encrypt
     * @returns {string} Encrypted text in format: iv:encryptedData
     */
    encrypt(text) {
        if (!text) return null;

        try {
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');

            // Return IV and encrypted data separated by colon
            return `${iv.toString('hex')}:${encrypted}`;
        } catch (error) {
            throw new Error(`Encryption failed: ${error.message}`);
        }
    }

    /**
     * Decrypt sensitive data
     * @param {string} encryptedText - Encrypted text in format: iv:encryptedData
     * @returns {string} Decrypted text
     */
    decrypt(encryptedText) {
        if (!encryptedText) return null;

        try {
            const parts = encryptedText.split(':');
            if (parts.length !== 2) {
                throw new Error('Invalid encrypted text format');
            }

            const iv = Buffer.from(parts[0], 'hex');
            const encrypted = parts[1];

            const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);

            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            throw new Error(`Decryption failed: ${error.message}`);
        }
    }

    /**
     * Generate a secure random token
     * @param {number} length - Length of the token in bytes
     * @returns {string} Random token as hex string
     */
    generateToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Hash data (one-way encryption)
     * @param {string} data - Data to hash
     * @returns {string} SHA-256 hash
     */
    hash(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }
}

module.exports = new Encryption();
