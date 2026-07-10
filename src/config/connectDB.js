import mongoose from "mongoose";
import dotenv from 'dotenv'
dotenv.config()

if(!process.env.MONGODB_URI){
    throw new Error(
        "Please provide MONGODB_URI in the .env file"
    )
}

mongoose.connection.on('connected', () => console.log('MongoDB connected'))
mongoose.connection.on('error', (err) => console.log('MongoDB error:', err.message))
mongoose.connection.on('disconnected', () => console.log('MongoDB disconnected'))

async function connectDB(){
    // Fail fast (10s) instead of hanging forever when the server can't reach Atlas.
    // Throw on failure so the caller decides what to do — do NOT process.exit here,
    // otherwise a DB hiccup kills the whole HTTP server.
    await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
    })
    console.log("connect DB")
}

export default connectDB