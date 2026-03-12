const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Admin Controller
 * Handles all Admin actions
 */
class AdminController {

    /**
     * ADMIN: Suspend account
     * POST /api/admin/merchant/:id/suspend
     */
    static async merchantSuspend(req, res) {
        try {
            const { id } = req.params;
            const { User } = require('../models');

            const user = await User.findOne({
                 where: { id,
                    role: { [Op.or]: ['merchant_owner', 'merchant_collaborator']}
                  }
            });

            if (!user) {
                throw new Error(`User not found ${id}`);
            }

            user.status = 'suspended';
            await user.save();

            res.json({
                success: true,
                message: `User ${user.email} has been suspended`
            });

        } catch (error) {
            logger.error('Admin - Suspend account error :', error);
            res.status(500).json({
                success: false,
                message: error.message || 'SUSPEND_ACCOUNT_ERROR'
            });
        }
    }
}

module.exports = AdminController;
