const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');

exports.registerUser = async ({ username, email, password, role }) => {
    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
        throw new Error('Username or Email already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = new User({
        username,
        email,
        password: hashedPassword,
        roles: [role]
    });

    await newUser.save();

    // Generate tokens
    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    return {
        user: {
            id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            roles: newUser.roles
        },
        accessToken,
        refreshToken
    };
};

exports.loginUser = async ({ email, password }) => {
    const isEmail = email.includes('@');
    const query = isEmail ? { email } : { username: email };
    
    const user = await User.findOne(query);
    if (!user) {
        throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Invalid credentials');
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return {
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            roles: user.roles
        },
        accessToken,
        refreshToken
    };
};

exports.refreshToken = async (token) => {
    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id);

    if (!user) {
        throw new Error('User not found');
    }

    const accessToken = generateAccessToken(user);
    return { accessToken };
};
