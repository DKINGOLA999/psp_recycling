import express from 'express';
import Pickup from '../models/Pickup.js';
import Contact from '../models/Contact.js';
import { ensureAuthentication } from '../middleWare/auth.js';
import User from '../models/User.js';
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
}

const router = express.Router();

// Create a pickup request (authenticated users)
router.post('/', ensureAuthentication, async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const { name, email, date, wasteType, note } = req.body;
    if (!date || !wasteType || !name) return res.status(400).json({ error: 'Missing required fields' });

    const pickupDate = new Date(date);
    const pickup = await Pickup.create({ userId, name, email: email || '', date: pickupDate, wasteType, note: note || '' });


    // Notify admin by creating a Contact message for the admin team
    const user = userId ? await User.findById(userId).select('email name') : null;
    const adminMessage = `Pickup requested by ${name}${user && user.email ? ' ('+user.email+')' : ''} for ${pickupDate.toISOString().slice(0,10)}.\nWaste type: ${wasteType}\nNotes: ${note || '-'}\nPickup id: ${pickup._id}`;
    await Contact.create({ userId, name: name || (user && user.name) || '', email: email || (user && user.email) || '', subject: 'New pickup request', message: adminMessage });

    // Send email to admin if transporter is configured and ADMIN_CONTACT_EMAIL is set
    try {
      if (mailTransporter && process.env.ADMIN_CONTACT_EMAIL) {
        await mailTransporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: process.env.ADMIN_CONTACT_EMAIL,
          subject: `New pickup request from ${name}`,
          text: adminMessage
        });
      }
    } catch (mailErr) {
      console.warn('Failed to send pickup notification email:', mailErr && mailErr.message ? mailErr.message : mailErr);
    }

    return res.status(201).json({ message: 'Pickup requested successfully', pickupId: pickup._id });
  } catch (error) {
    console.error('Pickup create error:', error && error.message ? error.message : error);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
