require('dotenv').config({ path: '../.env' }); // Adjust path if .env is at root and this file is in src/config

module.exports = {
    BACKEND_PORT: process.env.BACKEND_PORT || 5001,
    MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/leetcode-clone',
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'access_secret',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: process.env.REDIS_PORT || 6379,
    JUDGE0_URL: process.env.JUDGE0_URL || 'http://localhost:2358'
};
