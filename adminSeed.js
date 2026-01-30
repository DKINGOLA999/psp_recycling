import mongoose from "mongoose";
import dotenv from "dotenv";
import User from './backend/models/User.js'
import bcrypt from 'bcrypt'


dotenv.config()

async function createdAdmin() {
    try {
       await mongoose.connect(process.env.MONGO_URL_DEV);
       const exists = await User.findOne({email: 'admin-account@gmail.com'});
       if(exists){
        console.log("Admin user already exists.");
        return process.exit(1);
       } 

       const hashedPassword = await bcrypt.hash("admin123", 10);

       const admin = new User({
        name: "System Admin",
        email: "admin-account@gamil.com",
        password: hashedPassword,
        role: "admin",
        isVerified: "true",
        houseNumber: "A1",
        street: "Main Street",
        state: "Lagos",
        country: "Nigeria"
       })
       await admin.save();
       console.log("Admin account created successfully");
       process.exit()

    } catch (error) {
       console.error(error);
       process.exit(1); 
    }
}

createdAdmin();