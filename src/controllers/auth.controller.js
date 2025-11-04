const { User, OTP } = require('../models');
const { hashPassword, comparePassword } = require('../services/password.service');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../services/auth.service');
const { logger } = require('../utils/logger');

// Register a new user
const register = async (req, res) => {
  try {
    const { email, password, fullName, phone } = req.body;
    if (!email || !password || !fullName) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'email, password and fullName are required' } });
    }

    // Check if first user to make admin
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, error: { code: 'USER_EXISTS', message: 'User already exists' } });
    }

    const count = await User.countDocuments();
    const roles = count === 0 ? ['admin'] : ['user'];

    const hashed = await hashPassword(password);
    const user = await User.create({ email, password: hashed, fullName, phone, roles });

    const payload = { id: user._id.toString(), email: user.email, roles: user.roles };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.status(201).json({ success: true, data: { user: payload, accessToken, refreshToken } });
  } catch (err) {
    logger.error('Register error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to register' } });
  }
};

// Login with email/password
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'email and password required' } });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } });

    const ok = await comparePassword(password, user.password);
    if (!ok) return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } });

    const payload = { id: user._id.toString(), email: user.email, roles: user.roles };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.json({ success: true, data: { user: payload, accessToken, refreshToken } });
  } catch (err) {
    logger.error('Login error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Login failed' } });
  }
};

// Refresh access token
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'refreshToken required' } });

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (err) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid refresh token' } });
    }

    // Optionally verify user still exists
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'User not found' } });

    const newAccess = generateAccessToken({ id: user._id.toString(), email: user.email, roles: user.roles });
    const newRefresh = generateRefreshToken({ id: user._id.toString(), email: user.email, roles: user.roles });

    res.json({ success: true, data: { accessToken: newAccess, refreshToken: newRefresh } });
  } catch (err) {
    logger.error('Refresh error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Refresh failed' } });
  }
};

// Send OTP to phone (stores OTP in DB). SMS sending is a placeholder.
const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'phone required' } });

    // generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await OTP.create({ phone, otp, expiresAt });

    // TODO: integrate SMS provider (Twilio) to send the OTP

    res.json({ success: true, data: { message: 'OTP sent (stored in DB for now)' } });
  } catch (err) {
    logger.error('Send OTP error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to send OTP' } });
  }
};

// Verify OTP and log in / create user if necessary
const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'phone and otp required' } });

    const record = await OTP.findOne({ phone, otp }).sort({ createdAt: -1 });
    if (!record) return res.status(401).json({ success: false, error: { code: 'INVALID_OTP', message: 'Invalid or expired OTP' } });

    // Remove OTPs for this phone after verification
    await OTP.deleteMany({ phone });

    // Find or create user by phone
    let user = await User.findOne({ phone });
    if (!user) {
      // create a minimal user with random password
      const randomPass = Math.random().toString(36).slice(-8);
      const hashed = await hashPassword(randomPass);
      user = await User.create({ email: `${phone}@phone.local`, phone, password: hashed, fullName: phone });
    }

    const payload = { id: user._id.toString(), email: user.email, roles: user.roles };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.json({ success: true, data: { user: payload, accessToken, refreshToken } });
  } catch (err) {
    logger.error('Verify OTP error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'OTP verification failed' } });
  }
};

module.exports = { register, login, refresh, sendOtp, verifyOtp };
