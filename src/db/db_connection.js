import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const DB_NAME = process.env.DB_NAME;
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL_STG}/${DB_NAME}`);
        console.log(`\nmongodb connected !! DB HOST : ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONOGODB CONNECTION ERROR", error);
        process.exit(1);
    }
}

export default connectDB