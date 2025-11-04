#!/usr/bin/env node
/**
 * Simple script to create or ensure an admin user in the backend MongoDB.
 * Usage:
 *   node scripts/create_admin.js [email] [password] [fullName]
 * If arguments are omitted the script will use the default values below.
 */

const path = require('path');

// Load backend environment if .env exists
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const { connectDatabase, disconnectDatabase } = require('../src/config/database');
const { User } = require('../src/models');
const { hashPassword } = require('../src/services/password.service');

const DEFAULT_EMAIL = process.argv[2] || 'mondalsubarna29@gmail.com';
const DEFAULT_PASSWORD = process.argv[3] || '12345678';
const DEFAULT_FULLNAME = process.argv[4] || 'subarna mondal';

async function main() {
  try {
    await connectDatabase();
    console.log('Connected to database');

    const email = DEFAULT_EMAIL;
    const password = DEFAULT_PASSWORD;
    const fullName = DEFAULT_FULLNAME;

    let user = await User.findOne({ email });
    if (user) {
      // Ensure admin role
      if (!user.roles || !user.roles.includes('admin')) {
        user.roles = Array.from(new Set([...(user.roles || []), 'admin']));
        await user.save();
        console.log(`Updated existing user ${email} with admin role`);
      } else {
        console.log(`User ${email} already exists with admin role`);
      }
    } else {
      const hashed = await hashPassword(password);
      user = await User.create({ email, password: hashed, fullName, roles: ['admin'] });
      console.log(`Created admin user ${email}`);
    }

    console.log('Admin user id:', user._id.toString());
  } catch (err) {
    console.error('Failed to create admin user', err);
    process.exitCode = 1;
  } finally {
    try {
      await disconnectDatabase();
    } catch (e) {
      // ignore
    }
    process.exit();
  }
}

main();
