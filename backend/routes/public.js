// routes/public.js

import express from 'express';
import bcrypt from 'bcrypt'
import User from '../models/User.js'
import Service from '../models/Services.js'
import Contact from '../models/Contact.js'

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

            const hashed = await bcrypt.hash(password, SALT_ROUNDS);
            await User.create({
                name,
                email: email.toLowerCase(),
                password: hashed,
                houseNumber,
                street,
                state,
                country,
                userType
            });

            return res.status(201).json({
                success: true,
                message: "Registration successful. Please log in"
            })
    } catch (error) {
        console.error('Register error:', error && error.message ? error.message : error);
        return res.status(500).json({ success: false, message: error?.message || 'Server error' });
    }
})

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