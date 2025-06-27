const { Redis } = require('ioredis');

const redisClient = () => {
    if (process.env.REDIS_URI) {
        console.log('Connecting to Redis using URI');
        return new Redis(process.env.REDIS_URI);

    } else {
        console.log("Redis connection failed: REDIS_URI is not set");

    }
}

module.exports = { redisClient };