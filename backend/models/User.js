import mongoose from 'mongoose';
import {v4 as uuidv4} from 'uuid'


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    account: {
        type: String,
        required: true,
        default: () => uuidv4(),
        unique: true
    },

    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
        required: true
    },

    houseNumber: {
        type: String,
        required: true
    },

    street: {
        type: String,
        required: true
    },

    state: {
        type: String,
        required: true
    },

    country: {
        type: String,
        required: true
    },

    outstanding: {
        type: Number,
        default: 0
    },

    userType: {
        type: String,
        enum: ['company', 'household'],
        required: true
    },

    emailVerified: {
        type: Boolean,
        default: false
    },

    emailVerificationCode: {
        type: String,
        required: false
    },

    emailVerificationExpires: {
        type: Date,
        required: false
    }

}, {
    timestamps: true
})




const User = mongoose.model('User', userSchema)
export default User;
