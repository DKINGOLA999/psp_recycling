import mongoose from 'mongoose';
const serviceSchema = new mongoose.Schema({
    title:{
        type: String,
        required: true
    },

    description:{
        type: String,
        required: true
    },
    price:{
        type: Number,
        required: true
    }
},{
    timestamps: true
})

const Service = mongoose.model("Services", serviceSchema);
export default Service;