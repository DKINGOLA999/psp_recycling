import express from 'express'
import bcrypt from 'bcrypt'
import User from '../models/User.js'
import { ensureAuthentication, ensureOwnerOrAdmin } from '../middleWare/auth.js'
import Notification from '../models/Notification.js'


const router = express.Router()
const SAL_ROUNDS = 12;


//All route under this router requires login
router.use(ensureAuthentication)

//get own profile
router.get('/profile', async(req, res, next) =>{
    try {
       const user = await User.findById(req.session.userId).select('-password');
       if(!user)return res.status(404).json({error: "User not found"}) 
        return res.status(200).json({user})
    } catch (error) {
        next(error)
    }
})


//get specific profile by Id - only ownwer or admin can access
router.get('/profile/:id', ensureOwnerOrAdmin, async(req, res, next) => {
    try {
        const u = await User.findById(req.params.id).select('-password')
        if(!u) return res.status(404).json({error: "User not found"});
        return res.status(200).json({user: u});
    } catch (error) {
        next(error)               
    }
})

// Implement Update User Profile
// Update user profile (owner or admin)
router.put('/profile/:id', ensureOwnerOrAdmin, async (req, res, next) => {
    try {
        const updates = {};
        const allowed = ['name', 'email', 'password', 'houseNumber', 'street', 'state', 'country', 'userType'];
        for (const key of allowed) {
            if (req.body[key]) updates[key] = req.body[key];
        }

        if (updates.email) {
            const existing = await User.findOne({ email: updates.email.toLowerCase(), _id: { $ne: req.params.id } });
            if (existing) return res.status(409).json({ error: 'Email already in use' });
            updates.email = updates.email.toLowerCase();
        }

        if (updates.password) {
            const hashed = await bcrypt.hash(updates.password, SAL_ROUNDS);
            updates.password = hashed;
        }

        const updated = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
        if (!updated) return res.status(404).json({ error: 'User not found' });
        return res.status(200).json({ user: updated });
    } catch (error) {
        next(error);
    }
});




//Delete user by Owner or Admin
//Delete user by Owner or Admin
router.delete('/profile/:id', ensureOwnerOrAdmin, async (req, res, next) => {
    try {
        const user = await User.findById(req.session.userId)
        if(!user)return res.status(404).json({error: "User not found"})
        await User.findByIdAndDelete(req.params.id)

        if (req.session.userId && req.session.userId.toString() === req.params.id.toString()) {
            req.session.destroy(() => { });
        }
        return res.status(200).json({ message: "User deleted successfully" })
        
    } catch (error){
        next(error)
    }
})

// Notifications
// Get notifications for logged-in user
router.get('/notifications', async (req, res, next) => {
    try {
        const notes = await Notification.find({ userId: req.session.userId }).sort({ createdAt: -1 }).limit(100);
        return res.json({ notifications: notes });
    } catch (error) {
        next(error);
    }
});

// Mark a notification as read
router.post('/notifications/:id/read', async (req, res, next) => {
    try {
        const n = await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.session.userId }, { read: true }, { new: true });
        if (!n) return res.status(404).json({ error: 'Not found' });
        return res.json({ notification: n });
    } catch (error) {
        next(error);
    }
});

// Clear all notifications (mark read)
router.post('/notifications/markallread', async (req, res, next) => {
    try {
        await Notification.updateMany({ userId: req.session.userId, read: false }, { read: true });
        return res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

export default router;