export function getRoleName(value) {
    switch (value) {
        case "merchant_owner": return "Marchand";
        case "merchant_collaborator": return "Collaborateur";
        case "admin": return "Administrateur";
        case "super_admin": return "Super Administrateur";
        case "support": return "Support";
        default: return "";
    }
};

export const USER_ROLES = {
    OWNER: 'merchant_owner',
    COLLABORATOR: 'merchant_collaborator',
    ADMIN: 'admin',
    SADMIN: 'super_admin',
    SUPPORT: 'support',
}