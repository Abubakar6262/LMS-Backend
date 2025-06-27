const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        console.log('MongoDB connection attempt...', process.env.MONGO_URI);

        const conn = await mongoose.connect(process.env.MONGO_URI); // No options needed in Mongoose 6+

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.log(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = { connectDB };
