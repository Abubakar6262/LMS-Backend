require("dotenv").config();
const jwt = require("jsonwebtoken");
const { redisClient } = require("../../config/Redis");

// Parse environment variables for token expiry
const accessTokenExpiry = parseInt(process.env.ACCESS_TOKEN_EXPIRY || '1', 10); // in hours
const refreshTokenExpiry = parseInt(process.env.REFRESH_TOKEN_EXPIRE || '7', 10); // in days

// Cookie options
const accessTokenOptions = {
    expires: new Date(Date.now() + accessTokenExpiry * 60 * 60 * 1000),
    maxAge: accessTokenExpiry * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
};

const refreshTokenOptions = {
    expires: new Date(Date.now() + refreshTokenExpiry * 24 * 60 * 60 * 1000),
    maxAge: refreshTokenExpiry * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
};

// Set secure flag in production
if (process.env.NODE_ENV === 'production') {
    accessTokenOptions.secure = true;
    refreshTokenOptions.secure = true;
}

const sendToken = async (user, statusCode, res) => {
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save session to Redis (avoid password, only store necessary info)
    await redisClient().set(user._id.toString(), JSON.stringify({
        _id: user._id,
        email: user.email,
        role: user.role,
    }));

    // Set tokens in cookies
    res.cookie('accessToken', accessToken, accessTokenOptions);
    res.cookie('refreshToken', refreshToken, refreshTokenOptions);

    res.status(statusCode).json({
        success: true,
        message: "Login successful",
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        },
        accessToken,
    });
};

module.exports = {
    sendToken,
    accessTokenOptions,
    refreshTokenOptions
};
