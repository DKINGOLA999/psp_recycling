#!/usr/bin/env node
import dotenv from 'dotenv';
dotenv.config();
import connectDB from '../config/db.js';
import User from '../models/User.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

async function main(){
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.log('Usage: node backend/scripts/createAdmin.js <name> <email> <password>');
    process.exit(1);
  }
  const [name, email, password] = args;
  await connectDB();
  try{
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      existing.role = 'admin';
      existing.name = existing.name || name;
      if (password) existing.password = await bcrypt.hash(password, SALT_ROUNDS);
      // ensure required address fields exist with safe defaults
      existing.houseNumber = existing.houseNumber || 'N/A';
      existing.street = existing.street || 'N/A';
      existing.state = existing.state || 'N/A';
      existing.country = existing.country || 'N/A';
      existing.userType = existing.userType || 'company';
      await existing.save();
      console.log(`Updated existing user ${email} to role=admin`);
      process.exit(0);
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    // provide safe defaults for required address fields and userType
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      role: 'admin',
      houseNumber: 'N/A',
      street: 'N/A',
      state: 'N/A',
      country: 'N/A',
      userType: 'company'
    });
    console.log('Admin user created:', { id: user._id.toString(), email: user.email });
    process.exit(0);
  } catch (err){
    console.error('Error creating admin:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();
