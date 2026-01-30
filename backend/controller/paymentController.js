import Payment from '../models/Payment.js'
import User from '../models/User.js'
import Notification from '../models/Notification.js'


const MONTHLY_FEE = 5000;

export async function makePayment(req, res) {
    try{
        const userId = req.session.userId;
        if(!userId) return res.status(401).json({error: "Unauthorized"})
        const { monthPaidFor, amountPaid } = req.body;
        if (!monthPaidFor || amountPaid === undefined || amountPaid === null) {
            return res.status(400).json({ error: 'Missing payment field' });
        }

        const paid = Number(amountPaid);
        if (Number.isNaN(paid) || paid < 0) {
            return res.status(400).json({ error: 'Invalid amountPaid' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'user not found' });

        const outstandingBefore = Number(user.outstanding) || 0;

        const requiredAmount = MONTHLY_FEE + outstandingBefore;

        let outstandingAfter = requiredAmount - paid;
        if (outstandingAfter < 0) outstandingAfter = 0;

        const payment = await Payment.create({
            userId: user._id,
            name: user.name,
            email: user.email,
            account: user.account, // fixed property name
            street: user.street,

            monthPaidFor,
            requiredAmount,
            amountPaid: paid,
            outstandingAfter,
            outstandingBefore,
            status: 'pending'
        });

        user.outstanding = outstandingAfter;
        await user.save();

        res.json({ message: 'Payment recorded successfully', payment });

    } catch (error) {
        console.log(error);
        res.status(500).json({error: "Server error"});

    }
}

export const userPayHistory = async (req, res) =>{
    try {
       const payments = await Payment.find({userId: req.session.userId}).sort({createdAt: -1});
       return res.status(200).json({payments})

    } catch (error) {
       console.log(error.message)
       res.status(500).json({error: "Server Error"}) 
    }
}

export const allPaymentHistory = async (req, res) =>{
    try {
       const payments = await Payment.find().populate("userId", "name email account")
       .sort({createdAt: -1})
       return res.json({payments}) 
    } catch (error) {
                console.log(error.message);
                return res.status(500).json({ error: 'Server Error' });
    }
}
export async function approvePayment(req, res) {
    try {
        const { paymentId } = req.params;
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ error: "Payment not found" });
        }

                payment.status = 'approved';
                await payment.save();

                // create notification for the user
                try{
                    if (payment.userId) {
                        await Notification.create({
                            userId: payment.userId,
                            type: 'payment',
                            message: `Your payment for ${payment.monthPaidFor} has been approved.`,
                            data: { paymentId: payment._id, status: payment.status }
                        });
                    }
                }catch(e){ console.log('notification error', e.message) }

                res.json({ message: "Payment approved successfully", payment });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error" });
    }
}
export async function rejectPayment(req, res) {
    try {
        const { paymentId } = req.params;
        const payment = await Payment.findById(paymentId);  
        if (!payment) {
            return res.status(404).json({ error: "Payment not found" });
        }

                payment.status = 'rejected';
                await payment.save();

                // create notification for the user about rejection
                try{
                    if (payment.userId) {
                        await Notification.create({
                            userId: payment.userId,
                            type: 'payment',
                            message: `Your payment for ${payment.monthPaidFor} was rejected. Please contact support.`,
                            data: { paymentId: payment._id, status: payment.status }
                        });
                    }
                }catch(e){ console.log('notification error', e.message) }

                res.json({ message: "Payment rejected successfully", payment });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error" });
    }
}