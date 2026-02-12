/**
 * Operator Detection Utility
 * Detects mobile money operator from phone number prefix (DRC)
 */
const OPERATOR_PREFIXES = {
    mpesa: ['081', '082', '083', '084', '085'],
    orange: ['089', '090', '084', '085'],
    airtel: ['097', '098', '099']
};

const OPERATOR_DISPLAY_NAMES = {
    mpesa: 'M-Pesa',
    orange: 'Orange Money',
    airtel: 'Airtel Money'
};

const OPERATOR_COLORS = {
    mpesa: {
        primary: '#00B140',
        secondary: '#00873E',
        badge: '#e60000'
    },
    orange: {
        primary: '#FF7900',
        secondary: '#CC6100',
        badge: '#ff7900'
    },
    airtel: {
        primary: '#ED1C24',
        secondary: '#C11920',
        badge: '#ff0000'
    }
};

/**
 * Detect operator from phone number
 * @param {string} phoneNumber - Phone number (with or without country code)
 * @returns {object|null} - { operator: 'mpesa', displayName: 'M-Pesa', colors: {...} }
 */
export const detectOperator = (phoneNumber) => {
    if (!phoneNumber) return null;

    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // Extract first 3 digits (prefix)
    let prefix = cleaned.substring(0, 3);

    // If starts with 243 (DRC country code), skip it
    if (cleaned.startsWith('243')) {
        prefix = cleaned.substring(3, 6);
    }

    // Check each operator's prefixes
    for (const [operator, prefixes] of Object.entries(OPERATOR_PREFIXES)) {
        if (prefixes.includes(prefix)) {
            return {
                operator,
                displayName: OPERATOR_DISPLAY_NAMES[operator],
                colors: OPERATOR_COLORS[operator]
            };
        }
    }

    return null;
};

/**
 * Format phone number for display
 * @param {string} phoneNumber 
 * @returns {string} - Formatted as "081 234 5678"
 */
export const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '';

    const cleaned = phoneNumber.replace(/\D/g, '');

    // Format as XXX XXX XXXX for DRC numbers
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
};

/**
 * Validate DRC phone number
 * @param {string} phoneNumber 
 * @returns {boolean}
 */
export const isValidPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return false;

    const cleaned = phoneNumber.replace(/\D/g, '');

    // Must be 9 or 10 digits (with or without leading 0)
    if (cleaned.length < 9 || cleaned.length > 12) return false;

    // Check if operator is recognized
    return detectOperator(phoneNumber) !== null;
};

/**
 * Get prefixes for all operators (for display/hints)
 * @returns {object}
 */
export const getOperatorPrefixes = () => OPERATOR_PREFIXES;

/**
 * Get all supported operators
 * @returns {array}
 */
export const getSupportedOperators = () => {
    return Object.keys(OPERATOR_PREFIXES).map(key => ({
        operator: key,
        displayName: OPERATOR_DISPLAY_NAMES[key],
        prefixes: OPERATOR_PREFIXES[key],
        colors: OPERATOR_COLORS[key]
    }));
};
