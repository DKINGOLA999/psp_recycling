import express from 'express'
import { allPaymentHistory, makePayment, userPayHistory, approvePayment, rejectPayment } from '../controller/paymentController.js'
import { ensureAuthentication, ensureRole } from '../middleWare/auth.js'

const router = express.Router();

// User makes a payment
router.post('/pay', ensureAuthentication, makePayment);

// User: get their payment records
router.get('/my-payment', ensureAuthentication, userPayHistory);

// Admin: get all payments
router.get('/all', ensureRole('admin'), allPaymentHistory);

// Admin: approve/reject
router.post('/approve/:paymentId', ensureRole('admin'), approvePayment);
router.post('/reject/:paymentId', ensureRole('admin'), rejectPayment);

export default router;