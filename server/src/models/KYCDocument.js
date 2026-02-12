const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class KYCDocument extends Model { }

KYCDocument.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    document_type: {
        type: DataTypes.ENUM(
            'national_id',           // Carte d'identité
            'passport',              // Passeport
            'id_nat',                // ID.NAT
            'rccm',                  // Registre Commerce
            'company_statutes',      // Statuts société
            'tax_number',            // Numéro impôt
            'rib',                   // Relevé Identité Bancaire
            'proof_of_address',      // Justificatif domicile
            'shareholder_id',        // ID actionnaire
            'other'
        ),
        allowNull: false
    },
    file_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    file_path: {
        type: DataTypes.STRING,
        allowNull: false
    },
    file_size: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'File size in bytes'
    },
    mime_type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'expired'),
        defaultValue: 'pending'
    },
    rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    reviewed_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    reviewed_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
    }
}, {
    sequelize,
    modelName: 'KYCDocument',
    tableName: 'kyc_documents',
    indexes: [
        { fields: ['user_id'] },
        { fields: ['document_type'] },
        { fields: ['status'] },
        { fields: ['created_at'] }
    ]
});

module.exports = KYCDocument;
