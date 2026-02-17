const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class ConversionRate extends Model {
    isFresh() {
        return this.created_at + (60 * 1000) > Date.now();
    }
}

ConversionRate.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    conversion_from_currency: {
        type: DataTypes.STRING,
        allowNull: true
    },
    conversion_to_currency: {
        type: DataTypes.STRING,
        allowNull: true
    },
    conversion_amount_from: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: true
    },
    conversion_amount_to: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: true
    },
    conversion_rate: {
        type: DataTypes.DECIMAL(20, 6),
        allowNull: true
    },
    spread: {
        type: DataTypes.DECIMAL(20, 6),
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'ConversionRate',
    tableName: 'conversionRates',
    indexes: [
        { fields: ['created_at'] }
    ]
});

module.exports = ConversionRate;
