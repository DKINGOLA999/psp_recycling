import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const ContactSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  name: { type: String, required: false },
  email: { type: String, required: false },
  subject: { type: String, required: false },
  message: { type: String, required: true },
  status: { type: String, enum: ['open','closed','pending'], default: 'open' },
}, { timestamps: true });

export default model('Contact', ContactSchema);
