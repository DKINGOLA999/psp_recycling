import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const PickupSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  name: { type: String, required: true },
  email: { type: String, required: false },
  date: { type: Date, required: true },
  wasteType: { type: String, required: true },
  note: { type: String },
  status: { type: String, enum: ['requested','scheduled','completed','cancelled'], default: 'requested' }
}, { timestamps: true });

export default model('Pickup', PickupSchema);
