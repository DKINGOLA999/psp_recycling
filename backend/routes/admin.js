import express from 'express'
import User from '../models/User.js'
import { ensureRole } from '../middleWare/auth.js'
import Pickup from '../models/Pickup.js'
import Contact from '../models/Contact.js'
import Notification from '../models/Notification.js'

const router = express.Router();



router.use(ensureRole('admin'))

// fetch all users
router.get('/users', async (req, res, next) =>{
    try {
       const users = await User.find().select('-password')
       return res.status(200).json({users}) 
    } catch (error) {
        next(error)
    }
})

// fetch single user
router.get('/user/:id', async (req, res, next) =>{
    try {
       const u = await User.findById(req.params.id).select('-password')
       if(!u) return res.status(404).json({
        success: false,
        message: 'Not found'
       }) 
       return res.json({user: u})
    } catch (error) {
        next(error);
    }
})

//Admin delete user
router.delete('/users/:id', async (req, res, next) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        return res.json({message: "user reward"})
    } catch (error) {
        next(error)
    }
})

// Admin: list pickups
router.get('/pickups', async (req, res, next) => {
    try {
        const pickups = await Pickup.find().sort({ createdAt: -1 });
        return res.json({ pickups });
    } catch (error) {
        next(error);
    }
});

// Admin: update pickup status
router.post('/pickups/:id/status', async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!status) return res.status(400).json({ error: 'Missing status' });
        const allowed = ['requested','scheduled','completed','cancelled'];
        if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
                const p = await Pickup.findByIdAndUpdate(req.params.id, { status }, { new: true });
                if (!p) return res.status(404).json({ error: 'Not found' });

                // create notification for the user who requested the pickup (if any)
                try{
                    if (p.userId) {
                        await Notification.create({
                            userId: p.userId,
                            type: 'pickup',
                            message: `Your pickup scheduled for ${p.date ? new Date(p.date).toLocaleString() : 'the selected date'} is now '${p.status}'.`,
                            data: { pickupId: p._id, status: p.status }
                        });
                    }
                }catch(e){ console.log('notification error', e.message) }

                return res.json({ pickup: p });
    } catch (error) {
        next(error);
    }
});

// Admin: list contact messages
router.get('/contacts', async (req, res, next) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        console.log('/api/admin/contacts - count=', contacts.length);
        return res.json({ contacts });
    } catch (error) {
        next(error);
    }
});

// Admin: update contact status (open, pending, closed)
router.post('/contacts/:id/status', async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!status) return res.status(400).json({ error: 'Missing status' });
        const allowed = ['open','pending','closed'];
        if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
                const c = await Contact.findByIdAndUpdate(req.params.id, { status }, { new: true });
                if (!c) return res.status(404).json({ error: 'Not found' });

                // notify the user who sent the message (if present)
                try{
                    if (c.userId) {
                        await Notification.create({
                            userId: c.userId,
                            type: 'contact',
                            message: `Your message "${c.subject || 'Contact message'}" status changed to '${c.status}'.`,
                            data: { contactId: c._id, status: c.status }
                        });
                    }
                }catch(e){ console.log('notification error', e.message) }

                return res.json({ contact: c });
    } catch (error) {
        next(error);
    }
});

export default router;