const { User } = require('../models');
const { hashPassword } = require('./password.service');

const createUser = async ({ email, password, fullName, phone, roles = ['user'] }) => {
  const hashed = await hashPassword(password);
  return User.create({ email, password: hashed, fullName, phone, roles });
};

const getUserById = async (id) => {
  return User.findById(id).select('-password');
};

const updateUser = async (id, updates) => {
  // prevent role escalation via this method; roles should be changed via assignRole
  delete updates.roles;
  if (updates.password) delete updates.password; // separate endpoint needed for password change
  return User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
};

const listUsers = async ({ page = 1, limit = 20, filter = {} } = {}) => {
  const skip = (page - 1) * limit;
  const query = { ...filter };
  const [total, users] = await Promise.all([
    User.countDocuments(query),
    User.find(query).select('-password').skip(skip).limit(limit).lean()
  ]);
  return { total, page, limit, users, pages: Math.ceil(total / limit) };
};

const assignRole = async (id, roles) => {
  return User.findByIdAndUpdate(id, { roles }, { new: true }).select('-password');
};

const checkPermission = async (userId, permission) => {
  // placeholder: implement permission checks based on roles
  const user = await User.findById(userId);
  if (!user) return false;
  return user.roles && user.roles.includes('admin');
};

module.exports = { createUser, getUserById, updateUser, listUsers, assignRole, checkPermission };
