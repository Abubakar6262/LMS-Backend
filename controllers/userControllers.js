const sendMail = require('../utils/Mails/SendMail');
require('dotenv').config();
const { CatchAsyncError } = require("../middlewares/CatchAsyncErrors");
const userModel = require("../models/userModel");
const ErrorHandler = require("../utils/ErrorHandler");
const jwt = require('jsonwebtoken');
const ejs = require('ejs');
const path = require('path');
const { sendToken, accessTokenOptions, refreshTokenOptions } = require('../utils/Mails/jwt');
const { redisClient } = require('../config/Redis');
const { getUserById } = require('../services/userServices');
const cloudinary = require('cloudinary').v2;

// Register a new user
const registerUser = CatchAsyncError(async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return next(new ErrorHandler('Please provide all required fields', 400));
        }

        // Check if the email is already registered
        const isEmailExist = await userModel.findOne({ email });
        if (isEmailExist) {
            return next(new ErrorHandler('Email already exists', 400));
        }

        const user = {
            name,
            email,
            password,

        }
        const activationToken = createActivationToken(user);
        const activationCode = activationToken.activationCode;

        const data = { name: user.name, activationCode }
        const html = await ejs.renderFile(path.join(__dirname, '../utils/Mails/ActivationMail.ejs'), data);
        try {
            await sendMail(user.email, 'Account Activation', 'ActivationMail.ejs', data);
            res.status(201).json({
                success: true,
                message: `Activation code sent to ${user.email}`,
                activationToken: activationToken.token
            });

        } catch (error) {
            return next(new ErrorHandler(error.message, 500));
        }

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
})

const createActivationToken = (user) => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const token = jwt.sign({
        user, activationCode
    }, process.env.ACTIVATION_TOKEN_SECRET, {
        expiresIn: '5m',
    });
    return { token, activationCode };
}

// activate user account
const activateUser = CatchAsyncError(async (req, res, next) => {
    try {
        const { activationToken, activationCode } = req.body;

        const newUser = jwt.verify(activationToken, process.env.ACTIVATION_TOKEN_SECRET);

        if (!newUser || newUser.activationCode !== activationCode) {
            return next(new ErrorHandler('Invalid activation token or code', 400));
        }
        const { name, email, password } = newUser.user;
        const existUser = await userModel.findOne({ email });
        if (existUser) {
            return next(new ErrorHandler('User already exists', 400));
        }

        const user = await userModel.create({
            name,
            email,
            password,
        });
        res.status(201).json({
            success: true,
            message: 'User activated successfully',
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
})

// Login user
const loginUser = CatchAsyncError(async (req, res, next) => {
    try {
        const { email, password } = req.body;
        // Validate required fields
        if (!email || !password) {
            return next(new ErrorHandler('Please provide all required fields', 400));
        }
        // Check if the user exists
        const user = await userModel.findOne({ email }).select('+password');
        if (!user) {
            return next(new ErrorHandler('Invalid email or password', 401));
        }
        // Check if the password is correct
        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            return next(new ErrorHandler('Invalid email or password', 401));
        }

        sendToken(user, 200, res);
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Logout user
const logoutUser = CatchAsyncError(async (req, res, next) => {
    try {
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        const userId = req.user?._id?.toString();
        if (!userId) {
            return next(new ErrorHandler('User not authenticated', 401));
        }

        await redisClient().del(userId);

        res.status(200).json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// update access token
const updateAccessToken = CatchAsyncError(async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return next(new ErrorHandler('Please login to access this resource', 401));
        }
        const decodedData = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        if (!decodedData) {
            return next(new ErrorHandler('Invalid refresh token, please login again', 401));
        }

        const userData = await redisClient().get(decodedData.id.toString());
        if (!userData) {
            return next(new ErrorHandler('User not found, please login again', 404));
        }

        const user = JSON.parse(userData);
        const newAccessToken = jwt.sign({ id: user._id, role: user.role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5m' });
        const newRefreshToken = jwt.sign({ id: user._id, role: user.role }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '3d' });

        req.user = user; // Set user in request for further use
        res.cookie('accessToken', newAccessToken, accessTokenOptions);
        res.cookie('refreshToken', newRefreshToken, refreshTokenOptions);
        res.status(200).json({
            success: true,
            accessToken: newAccessToken,
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});


// get user info
const getUserInfo = CatchAsyncError(async (req, res, next) => {
    try {
        const userId = req.user?._id?.toString();
        if (!userId) {
            return next(new ErrorHandler('User not authenticated', 401));
        }

        getUserById(userId, res);

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// social auth
const socialAuth = CatchAsyncError(async (req, res, next) => {
    try {
        const { email, name, avatar } = req.body;
        if (!email || !name) {
            return next(new ErrorHandler('Please provide all required fields', 400));
        }
        const existingUser = await userModel.findOne({ email });

        if (existingUser) {
            sendToken(existingUser, 200, res);
        } else {
            const newUser = await userModel.create({
                name: name,
                email: email,
                password: 'socialAuthPassword', // Placeholder password
            });
            sendToken(newUser, 201, res);
        }
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// update user info
const updateUserInfo = CatchAsyncError(async (req, res, next) => {
    try {
        const userId = req.user?._id?.toString();
        if (!userId) {
            return next(new ErrorHandler('User not authenticated', 401));
        }

        const { name, email } = req.body;
        if (!name || !email) {
            return next(new ErrorHandler('Please provide all required fields', 400));
        }

        const updatedUser = await userModel.findByIdAndUpdate(userId, { name, email }, { new: true });
        if (!updatedUser) {
            return next(new ErrorHandler('User not found', 404));
        }
        await redisClient().set(userId, JSON.stringify(updatedUser));

        res.status(200).json({
            success: true,
            user: updatedUser,
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// update user password
const updateUserPassword = CatchAsyncError(async (req, res, next) => {
    try {
        const userId = req.user?._id?.toString();
        if (!userId) {
            return next(new ErrorHandler('User not authenticated', 401));
        }

        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return next(new ErrorHandler('Please provide all required fields', 400));
        }

        const user = await userModel.findById(userId).select('+password');
        if (!user) {
            return next(new ErrorHandler('User not found', 404));
        }

        const isMatch = await user.comparePassword(oldPassword);
        if (!isMatch) {
            return next(new ErrorHandler('Old password is incorrect', 400));
        }

        user.password = newPassword;
        await user.save();
        await redisClient().set(userId, JSON.stringify(user));
        res.status(200).json({
            success: true,
            message: 'Password updated successfully',
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
})

// update profile picture
const updateProfilePicture = CatchAsyncError(async (req, res, next) => {
    try {
        const userId = req.user?._id?.toString();
        if (!userId) {
            return next(new ErrorHandler('User not authenticated', 401));
        }

        const { avatar } = req.body;
        if (!avatar) {
            return next(new ErrorHandler('Please provide an avatar URL', 400));
        }

        // Get user first to access existing avatar info
        const user = await userModel.findById(userId);
        if (!user) {
            return next(new ErrorHandler('User not found', 404));
        }

        // Upload new avatar to Cloudinary
        const uploadAtCloud = await cloudinary.uploader.upload(avatar, {
            folder: "lms/user/avatars",
            width: 150,
        });

        // Delete previous avatar from Cloudinary if it exists
        if (user.avatar?.public_id) {
            await cloudinary.uploader.destroy(user.avatar.public_id);
        }

        // Update user with new avatar info
        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            {
                avatar: {
                    public_id: uploadAtCloud?.public_id,
                    url: uploadAtCloud?.secure_url,
                },
            },
            { new: true }
        );

        // Cache updated user
        await redisClient().set(userId, JSON.stringify(updatedUser));

        res.status(200).json({
            success: true,
            user: updatedUser,
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});


module.exports = {
    registerUser,
    activateUser,
    loginUser,
    logoutUser,
    updateAccessToken,
    getUserInfo,
    socialAuth,
    updateUserInfo,
    updateUserPassword,
    updateProfilePicture
}