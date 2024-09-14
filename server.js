import { Server } from 'socket.io';
import { createServer } from 'http'
import express, { urlencoded, json } from 'express';
import cors from 'cors';
import { generateUniqueRoomId } from './utils.js';
import statusMonitor from 'express-status-monitor'

const HTTP_SERVER_PORT = 4500/* , SOCKET_IO_SERVER_PORT = 5000; */

const app = express();
const server = createServer(app);
const io = new Server(server,{cors: {origin: 'http://localhost:5173',   methods: ['GET', 'POST'],   credentials: true}});

app.use(statusMonitor());
app.use(cors());
app.use(urlencoded({ extended:true }))
app.use(json());

const roomToSocketIdMap = new Map();
const socketIdToRoomMap = new Map();
const userDetails = new Map();

const returnRoomDetails = (roomId)=>{
    const currRoomSockets = roomToSocketIdMap.get(roomId);
    const hashset = new Set(currRoomSockets || []);
    const uniqueSockets = Array.from(hashset);
    const result = [];
    for( let socketId of uniqueSockets ){
        const currSocketDetails = userDetails.get(socketId);
        result.push({ socketId, ...currSocketDetails });
    }
    return result;
}

io.on('connection',(socket)=>{

    socket.on("user:joined",(data)=>{
        const { roomId, email, username, peerId } = data;
        socket.join(roomId);
        userDetails.set(socket.id,{ username, email, peerId });
        if( !roomToSocketIdMap.has(roomId) ) roomToSocketIdMap.set(roomId, []);
        roomToSocketIdMap.get(roomId).push(socket.id);
        socketIdToRoomMap.set(socket.id, roomId);
        io.to(roomId).emit("user:update", returnRoomDetails(roomId));
    })

    socket.on("disconnect",()=>{
        const currUserRoomId = socketIdToRoomMap.get(socket.id);
        userDetails.delete(socket.id);
        socketIdToRoomMap.delete(socket.id);
        roomToSocketIdMap.set(
            currUserRoomId, roomToSocketIdMap.get(currUserRoomId)?.filter( socketId => socketId!=socket.id )
        );
        if( roomToSocketIdMap.get(currUserRoomId)?.length===0 ) roomToSocketIdMap.delete(currUserRoomId);
        socket.leave(currUserRoomId);
        io.to(currUserRoomId).emit("user:update", returnRoomDetails(currUserRoomId));
    })

})

app.get('/room/create',(req,res)=>{
    let roomId = generateUniqueRoomId(roomToSocketIdMap);
    roomToSocketIdMap.set(roomId, []);
    return res.send(roomId);
})

app.post('/room/isValid',(req,res)=>{
    const { roomId } = req.body;
    if( !roomId ) return res.status(400).send({ message: "Invalid Room Id" });
    return res.send({ isValid: roomToSocketIdMap.has(roomId) });
})

app.get('/status',(req,res)=>{
    return res.sendStatus(200);
})

server.listen(HTTP_SERVER_PORT, ()=> console.log("HTTP Server Listening on Port",HTTP_SERVER_PORT));