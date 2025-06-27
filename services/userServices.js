const { redisClient } = require("../config/Redis");
const userModel = require("../models/userModel");


const getUserById = async (userId, res) => {
    try {
        const userData = await redisClient().get(userId);

        if (userData) {
            return res.status(200).json({
                success: true,
                user: JSON.parse(userData),
            });
        } else {
            return res.status(404).json({
                success: false,
                message: 'User not found in cache',
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error retrieving user data',
            error: error.message,
        });
    }
}

module.exports = {
    getUserById,
}