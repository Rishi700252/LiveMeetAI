import 'dotenv/config';
import express from "express";
import {createServer} from "node:http";

import {Server} from "socket.io";
import mongoose from "mongoose";

import cors from "cors";
import userRoutes from"./routes/users.routes.js";
import meetingRoutes from "./routes/meeting.routes.js";
import {connectToSocket} from "./controller/socketManager.js";

const app=express();
const server =createServer(app);
const io=connectToSocket(server);




app.set("port",(process.env.PORT || 8000))
app.use(cors());
app.use(express.json({limit:"40kb"}))
app.use(express.urlencoded({limit:"40kb",extended:true}));

app.use("/api/v1/users",userRoutes);
app.use("/api/v1/meetings", meetingRoutes);




const start = async () =>{
    const mongoURI = process.env.MONGO_URI || "mongodb+srv://kumarrishi7469_db_user:f5IWbErx4tpNtiik@cluster0.qws1lvx.mongodb.net/?appName=Cluster0";
    const connectionDb = await mongoose.connect(mongoURI);
    console.log(`Mongo Connected DB Host:${connectionDb.connection.host}`)
    server.listen(app.get("port"),() =>{
        console.log(`listening on port ${app.get("port")}`);
    });
}

start();





