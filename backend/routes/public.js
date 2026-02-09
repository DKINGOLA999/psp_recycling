// routes/public.js

import express from 'express';
import bcrypt from 'bcrypt'
import User from '../models/User.js'
import Service from '../models/Services.js'
import Contact from '../models/Contact.js'
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// create a transporter if SMTP env vars are provided
let mailTransporter;
if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  mailTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  console.log('✓ Email transporter configured with:', {
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    user: process.env.EMAIL_USER,
    secure: process.env.EMAIL_SECURE === 'true'
  });
} else {
  console.warn('⚠ Email transporter NOT configured. Missing environment variables:');
  if (!process.env.EMAIL_HOST) console.warn('  - EMAIL_HOST');
  if (!process.env.EMAIL_USER) console.warn('  - EMAIL_USER');
  if (!process.env.EMAIL_PASS) console.warn('  - EMAIL_PASS');
  console.warn('  Verification codes will be logged to console instead.');
}

const router = express.Router();
const SALT_ROUNDS = 12;

router.post('/register', async (req, res, next) =>{
    try{
        // Log a sanitized version of the incoming body for debugging (mask password)
        const incoming = { ...req.body };
        if (incoming.password) incoming.password = '***';
        console.log('Register attempt:', incoming);

        const {name, email, password, houseNumber, street, state, country, userType} = req.body

        if(!name || !email || !password || !houseNumber || !street || !state || !country || !userType) return res.status(400).json({
            success: false,
            error: 'All fields are required'
        })

        const existing = await User.findOne({email: email.toLowerCase()});
        if(existing)
            return res.status(409).json({
                success: false,
                message: "Email already in use"        
            });

            // Generate 4-digit verification code
            const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
            const codeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

            const hashed = await bcrypt.hash(password, SALT_ROUNDS);
            const user = await User.create({
                name,
                email: email.toLowerCase(),
                password: hashed,
                houseNumber,
                street,
                state,
                country,
                userType,
                emailVerificationCode: verificationCode,
                emailVerificationExpires: codeExpiry,
                emailVerified: false
            });

            // Send verification email
            let emailSent = false;
            try {
                if (mailTransporter) {
                    const mailOptions = {
                        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                        to: email,
                        subject: 'Verify your email - Sigma Recycling',
                        text: `Hello ${name},\n\nThank you for registering with Sigma Recycling!\n\nYour verification code is: ${verificationCode}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nSigma Recycling Team`,
                        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #0d6efd;">Welcome to Sigma Recycling!</h2>
                            <p>Hello ${name},</p>
                            <p>Thank you for registering with us. To complete your registration, please use the verification code below:</p>
                            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                                <h1 style="color: #0d6efd; font-size: 36px; letter-spacing: 8px; margin: 0;">${verificationCode}</h1>
                            </div>
                            <p style="color: #6c757d; font-size: 14px;">This code expires in 10 minutes.</p>
                            <p>If you didn't request this, please ignore this email.</p>
                            <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
                            <p style="color: #6c757d; font-size: 12px;">Best regards,<br>Sigma Recycling Team</p>
                        </div>`
                    };
                    
                    await mailTransporter.sendMail(mailOptions);
                    emailSent = true;
                    console.log('✓ Verification email sent successfully to:', email);
                } else {
                    console.log('\n' + '='.repeat(60));
                    console.log('📧 EMAIL NOT CONFIGURED - DEVELOPMENT MODE');
                    console.log('='.repeat(60));
                    console.log(`User: ${name} (${email})`);
                    console.log(`Verification Code: ${verificationCode}`);
                    console.log(`Expires: ${codeExpiry.toLocaleString()}`);
                    console.log('='.repeat(60) + '\n');
                }
            } catch (mailErr) {
                console.error('✗ Failed to send verification email:', mailErr);
                console.log('\n' + '='.repeat(60));
                console.log('⚠ EMAIL SEND FAILED - SHOWING CODE FOR DEVELOPMENT');
                console.log('='.repeat(60));
                console.log(`User: ${name} (${email})`);
                console.log(`Verification Code: ${verificationCode}`);
                console.log(`Error: ${mailErr.message}`);
                console.log('='.repeat(60) + '\n');
            }

            return res.status(201).json({
                success: true,
                message: "Verification code sent to your email",
                userId: user._id
            })
    } catch (error) {
        console.error('Register error:', error && error.message ? error.message : error);
        return res.status(500).json({ success: false, message: error?.message || 'Server error' });
    }
})

// Verify email with code
router.post('/verify-email', async (req, res, next) => {
    try {
        const { userId, code } = req.body;

        if (!userId || !code) {
            return res.status(400).json({ success: false, error: 'Missing userId or code' });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Check if already verified
        if (user.emailVerified) {
            return res.status(400).json({ success: false, error: 'Email already verified' });
        }

        // Check if code expired
        if (new Date() > user.emailVerificationExpires) {
            return res.status(400).json({ success: false, error: 'Verification code expired. Please request a new code.' });
        }

        // Check if code matches
        if (user.emailVerificationCode !== code) {
            return res.status(400).json({ success: false, error: 'Invalid verification code' });
        }

        // Mark as verified and clear verification fields
        user.emailVerified = true;
        user.emailVerificationCode = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        console.log('Email verified for user:', user.email);

        return res.status(200).json({ success: true, message: 'Email verified successfully! You can now log in.' });
    } catch (error) {
        console.error('Verify error:', error && error.message ? error.message : error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Resend verification code
router.post('/resend-verification', async (req, res, next) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'Missing userId' });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        if (user.emailVerified) {
            return res.status(400).json({ success: false, error: 'Email already verified' });
        }

        // Generate new code
        const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
        const codeExpiry = new Date(Date.now() + 10 * 60 * 1000);

        user.emailVerificationCode = verificationCode;
        user.emailVerificationExpires = codeExpiry;
        await user.save();

        // Send email
        try {
            if (mailTransporter) {
                const mailOptions = {
                    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                    to: user.email,
                    subject: 'New verification code - Sigma Recycling',
                    text: `Hello ${user.name},\n\nYour new verification code is: ${verificationCode}\n\nThis code expires in 10 minutes.\n\nBest regards,\nSigma Recycling Team`,
                    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #0d6efd;">New Verification Code</h2>
                        <p>Hello ${user.name},</p>
                        <p>Here is your new verification code:</p>
                        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                            <h1 style="color: #0d6efd; font-size: 36px; letter-spacing: 8px; margin: 0;">${verificationCode}</h1>
                        </div>
                        <p style="color: #6c757d; font-size: 14px;">This code expires in 10 minutes.</p>
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
                        <p style="color: #6c757d; font-size: 12px;">Best regards,<br>Sigma Recycling Team</p>
                    </div>`
                };
                
                await mailTransporter.sendMail(mailOptions);
                console.log('✓ New verification code sent successfully to:', user.email);
            } else {
                console.log('\n' + '='.repeat(60));
                console.log('📧 RESEND CODE - EMAIL NOT CONFIGURED');
                console.log('='.repeat(60));
                console.log(`User: ${user.name} (${user.email})`);
                console.log(`New Verification Code: ${verificationCode}`);
                console.log(`Expires: ${codeExpiry.toLocaleString()}`);
                console.log('='.repeat(60) + '\n');
            }
        } catch (mailErr) {
            console.error('✗ Failed to resend verification email:', mailErr);
            console.log('\n' + '='.repeat(60));
            console.log('⚠ RESEND EMAIL FAILED - SHOWING CODE');
            console.log('='.repeat(60));
            console.log(`User: ${user.name} (${user.email})`);
            console.log(`New Verification Code: ${verificationCode}`);
            console.log(`Error: ${mailErr.message}`);
            console.log('='.repeat(60) + '\n');
        }

        return res.status(200).json({ success: true, message: 'New verification code sent to your email' });
    } catch (error) {
        console.error('Resend error:', error && error.message ? error.message : error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

//Login
router.post('/login', async (req, res, next) =>{
    try {
       const {email, password} = req.body;

      if(!email || !password) return res.status(400).json({
          success: false,
          error: "Email and Password required"
      })

       const user = await User.findOne({email: email.toLowerCase()});
       if(!user) return res.status(401).json({
        success: false,
        error: "Invalid credentials"
       })

       const ok = await bcrypt.compare(password, user.password);
       if(!ok) return res.status(401).json({
        success: false,
        error: "Invalid credentials"
       })

       // Check if email is verified
       if (!user.emailVerified) {
           return res.status(403).json({
               success: false,
               error: "Please verify your email before logging in",
               needsVerification: true,
               userId: user._id
           });
       }

       req.session.userId = user._id;
       req.session.role = user.role;

       return res.status(200).json({
        success: true,
        message: "Logged In",
        user: {
            id: user._id,
            role: user.role
        }
       });


    } catch (error) {
        next(error)
    }
})

// Logout
router.post('/logout', (req, res, next) => {
    try {
        const sessionPresent = !!req.session;
        console.log('POST /logout attempt', { sessionPresent, sid: req.session && req.session.userId ? String(req.session.userId) : null, cookie: req.headers.cookie });
        if(!req.session) return res.status(200).json({ success: true, message: "Logged Out" })

        req.session.destroy(error => {
            if(error) {
                console.error('POST /logout destroy error:', error && error.message ? error.message : error);
                return next(error)
            }
            res.clearCookie('connect.sid');
            return res.json({ message: "Logged Out"});
        })
    } catch (err) {
        console.error('POST /logout unexpected error:', err && err.message ? err.message : err);
        return res.status(500).json({ error: 'Server error' });
    }
})

// Also support GET /logout for simple link-based logouts (destroys session and redirects to login)
router.get('/logout', (req, res, next) => {
    try {
        const sessionPresent = !!req.session;
        console.log('GET /logout attempt', { sessionPresent, sid: req.session && req.session.userId ? String(req.session.userId) : null, cookie: req.headers.cookie });
        if (!req.session) return res.redirect('/login.html');
        req.session.destroy(err => {
            if (err) {
                console.error('Logout (GET) destroy error:', err && err.message ? err.message : err);
                // if destroy failed, still attempt to clear cookie and redirect
                res.clearCookie('connect.sid');
                return res.redirect('/login.html');
            }
            res.clearCookie('connect.sid');
            return res.redirect('/login.html');
        });
    } catch(e) {
        console.error('GET /logout unexpected error:', e && e.message ? e.message : e);
        try { res.clearCookie('connect.sid'); } catch(_) {}
        return res.redirect('/login.html');
    }
});

// Services
router.get('/service', async (req, res, next) => {
    try {
       const service = await Service.find().sort({ createdAt: -1});
       return res.status(200).json({service}); 
    } catch (error) {
        next(error);
    }
})

// company info endpoint
router.get('/info', (req, res) => {
    return res.json({
        company: "David PSP NIGERIA LIMITED",
        descriptipon: "Environmental Waste Management Services Provider",
        contact:{
            email: "davidolawore6@gmail.com",
            phone: "+234-802-399-1084"
        },
        message:"Welcome to David PSP NIGERIA LIMITED. VIEW OUR SERVICES OR TO REGISTER TO MAKE PAYMENTS"
    })
})

// Debug endpoint: returns minimal session info (safe for debugging)
router.get('/debug-session', (req, res) => {
    try {
        const sessionPresent = !!req.session;
        const userId = req.session && req.session.userId ? String(req.session.userId) : null;
        return res.json({ sessionPresent, userId });
    } catch (error) {
        return res.status(500).json({ error: 'Server error' });
    }
})

// Contact form: accepts messages from users (or anonymous visitors)
router.post('/contact', async (req, res, next) => {
    try {
        // allow logged-in users to omit name/email; otherwise require them
        const userId = req.session && req.session.userId ? req.session.userId : null;
        const { name, email, subject, message } = req.body;

        if (!message || (!userId && (!name || !email))) {
            return res.status(400).json({ success: false, error: 'Please provide a message and your contact details' });
        }

        console.log('POST /api/public/contact', { fromUser: userId ? String(userId) : null, name: name || null, email: email ? '[redacted]' : null, subject: subject || null });

        const doc = await Contact.create({ userId, name: name || '', email: email || '', subject: subject || '', message });
        console.log('Contact created id=', String(doc._id));
        return res.status(201).json({ success: true, message: 'Message sent. Our team will contact you shortly.', contactId: doc._id });
    } catch (error) {
        console.error('Contact error:', error && error.message ? error.message : error);
        return res.status(500).json({ success: false, error: error?.message || 'Server error' });
    }
})

export default router;