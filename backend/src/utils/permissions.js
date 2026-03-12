/**
 * Permissions Configuration
 * Defines available permissions and role mappings
 */
const permissions = {
    // Transaction permissions
    VIEW_TRANSACTIONS: 'view_transactions',
    CREATE_PAYMENTS: 'create_payments',
    REFUND_PAYMENTS: 'refund_payments',

    // Wallet permissions
    VIEW_BALANCE: 'view_balance',
    CONVERT_CURRENCY: 'convert_currency',
    INITIATE_WITHDRAWAL: 'initiate_withdrawal',

    // Account data
    VIEW_API_KEYS: 'view_api_keys',
    MANAGE_API_KEYS: 'manage_api_keys',
    MANAGE_COLLABORATORS: 'manage_collaborators',
    UPDATE_PROFILE: 'update_profile',

    // Admin permissions
    ADMIN_DASHBOARD: 'admin_dashboard',
    MANAGE_USERS: 'manage_users',
    VALIDATE_KYC: 'validate_kyc',
    PROCESS_WITHDRAWALS: 'process_withdrawals',
    MANAGE_RATES: 'manage_rates',
    VIEW_SYSTEM_LOGS: 'view_system_logs'
};

const rolePermissions = {
    super_admin: Object.values(permissions),

    admin: [
        permissions.VIEW_TRANSACTIONS,
        permissions.VIEW_BALANCE,
        permissions.ADMIN_DASHBOARD,
        permissions.MANAGE_USERS,
        permissions.VALIDATE_KYC,
        permissions.PROCESS_WITHDRAWALS,
        permissions.MANAGE_RATES,
        permissions.VIEW_SYSTEM_LOGS
    ],

    support: [
        permissions.VIEW_TRANSACTIONS,
        permissions.VIEW_BALANCE,
        permissions.ADMIN_DASHBOARD,
        permissions.VIEW_SYSTEM_LOGS
    ],

    merchant_owner: [
        permissions.VIEW_TRANSACTIONS,
        permissions.CREATE_PAYMENTS,
        permissions.REFUND_PAYMENTS,
        permissions.VIEW_BALANCE,
        permissions.CONVERT_CURRENCY,
        permissions.INITIATE_WITHDRAWAL,
        permissions.VIEW_API_KEYS,
        permissions.MANAGE_API_KEYS,
        permissions.MANAGE_COLLABORATORS,
        permissions.UPDATE_PROFILE
    ],

    merchant_collaborator: [
        permissions.VIEW_TRANSACTIONS,
        permissions.VIEW_BALANCE,
        permissions.CREATE_PAYMENTS
    ]
};

/**
 * Check if a role has a specific permission
 * @param {string} role 
 * @param {string} permission 
 * @returns {boolean}
 */
const hasPermission = (role, permission) => {
    if (!rolePermissions[role]) return false;
    return rolePermissions[role].includes(permission);
};

module.exports = {
    permissions,
    rolePermissions,
    hasPermission
};
