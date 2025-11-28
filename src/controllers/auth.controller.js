const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');


exports.signup = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Validate Role
        const allowedRoles = ['User', 'Organization'];
        if (!role || !allowedRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid role. Choose 'User' or 'Organization'." });
        }

        // Check if user exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(409).json({ message: 'Username or Email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            roles: [role] // Assign selected role
        });

        await newUser.save();

        // Generate tokens
        const accessToken = generateAccessToken(newUser);
        const refreshToken = generateRefreshToken(newUser);

        // Set refresh token in cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                roles: newUser.roles
            },
            accessToken
        });

    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user (allow login with email or username if desired, here using email as per plan)
        // Plan said "Email/Username", so let's support both if possible, but for now let's stick to email or check if input looks like email
        const isEmail = email.includes('@');
        const query = isEmail ? { email } : { username: email };
        
        const user = await User.findOne(query);
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Set refresh token in cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                roles: user.roles
            },
            accessToken
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.refresh = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ message: 'No refresh token provided' });
    }

    try {
        const decoded = verifyRefreshToken(refreshToken);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        const accessToken = generateAccessToken(user);
        // Optionally rotate refresh token here
        
        res.json({ accessToken });

    } catch (error) {
        return res.status(403).json({ message: 'Invalid refresh token' });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('refreshToken');
    res.status(204).send();
};

exports.me = async (req, res) => {
    // req.user is set by auth middleware
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
