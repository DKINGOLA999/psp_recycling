import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    name: String,
    email: String,
    account: String,
    street: String,
    monthPaidFor:{
        type: String,
        required: true,
        enum: [
            "January", "February", "March", "April", "May", "June", "July", "August", 
            "September", "October", "November", "December"
        ]
    },

    requiredAmount: {
        type: Number,
        required: true,
    },

    amountPaid:{
        type: Number,
        required: true
    },

    outstandingBefore:{
        type: Number,
        required: true
    },

    outstandingAfter:{
        type: Number,
        required: true
    }
},{
    timestamps: true,

    status: {
  type: String,
  enum: ['pending', 'approved', 'rejected'],
  default: 'pending'
}

})

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;

