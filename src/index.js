import dotenv from "dotenv";
dotenv.config()
import connectDB from './db/db_connection.js';
import app from './configs/express.config.js'

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 3000, ()=>{
        console.log("Server is running.........")
    })
})
.catch((error)=>{
    console.log("mongodb connection failed", error);
})
