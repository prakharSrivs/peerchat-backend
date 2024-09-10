
socket.on("room:join",(data)=>{
    const { email, roomId } = data;
    socket.join(roomId);
    if(roomToSocketIdMap.has(roomId)) roomToSocketIdMap.get(roomId).push(socket.id);
    socketIdToRoomMap.set(socket.id, roomId);
    socketIdToEmailMap.set(socket.id, email);
    emailToSocketIdMap.set(email, socket.id);
    io.to(roomId).emit("new-user-update",roomToSocketIdMap.get(roomId)); 
})

socket.on("user:call",({ to, offer })=>{
    io.to(to).emit("incoming:call", { from: socket.id, offer });
})

socket.on("call:accepted",({to, answer})=>{
    io.to(to).emit("call:accepted:reply",{ from:socket.id, answer });
})

socket.on("nego:needed",({to, offer})=>{
    io.to(to).emit("nego:request",{ from: socket.id, offer });
})

socket.on("nego:complete",({to, answer})=>{
    io.to(to).emit("nego:complete:answer",{ from: socket.id, answer });
})

socket.on("disconnect",()=>{
    console.log("User disconnected ",socket.id)
    const email = socketIdToEmailMap.get(socket.id);
    const roomId = socketIdToRoomMap.get(socket.id);
    socketIdToEmailMap.delete(socket.id);
    socketIdToRoomMap.delete(socket.id);
    emailToSocketIdMap.delete(email);
    const participantsArray = roomToSocketIdMap.get(roomId) || [];
    const newParticipantsArray = participantsArray.filter( participant => participant !== socket.id ) || [];
    roomToSocketIdMap.set(roomId, newParticipantsArray);    
    io.to(roomId).emit("new-user-update",roomToSocketIdMap.get(roomId));
})