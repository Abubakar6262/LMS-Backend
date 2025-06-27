const { CatchAsyncError } = require("./CatchAsyncErrors");
const ErrorHandler = require("../utils/ErrorHandler");
const { redisClient } = require("../config/Redis");
const jwt = require('jsonwebtoken');

const isAuthenticated = CatchAsyncError(async (req, res, next) => {
    const token = req.cookies.accessToken;

    if (!token) {
        return next(new ErrorHandler("Please login to access this resource", 400));
    }

    const decodedData = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    if (!decodedData) {
        return next(new ErrorHandler("Invalid token, please login again", 401));
    }
    
    // Check if user exists in Redis
    const userData = await redisClient().get(decodedData.id.toString());
    if (!userData) {
        return next(new ErrorHandler("User not found, please login again", 404));
    }

    req.user = JSON.parse(userData);
    next();
});

// validate user role
const validateUserRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new ErrorHandler("You do not have permission to access this resource", 403));
        }
        next();
    };
}; 

module.exports = { isAuthenticated };
