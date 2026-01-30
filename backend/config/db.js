import mongoose from 'mongoose';

const connectDB = async () =>{
    try{
        // Prefer MONGO_URI_DEV but fall back to older MONGO_URL_DEV if present
        const uri = process.env.MONGO_URI_DEV || process.env.MONGO_URL_DEV;
        if(!uri) throw new Error('MongoDB URI not set (MONGO_URI_DEV or MONGO_URL_DEV)');
        console.log('Connecting to MongoDB using env var:', process.env.MONGO_URI_DEV ? 'MONGO_URI_DEV' : 'MONGO_URL_DEV');
        const conn = await mongoose.connect(uri);
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.log(`Error: ${error.message}`);
        process.exit(1)
    }
}

export default connectDB;