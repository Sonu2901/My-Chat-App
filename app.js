require('dotenv').config();
var mongoose=require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/chat-app');
const app=require('express')();
const http=require('http').Server(app);
const userRoute=require('./routes/userRoute');
const  user=require('./models/usermodel');
const chat=require('./models/chatmodel');
app.use('/',userRoute);
const io=require('socket.io')(http);
var usp=io.of('/user-namespace');
usp.on('connection',async function(socket){
    console.log('User Connected');
    var userid=socket.handshake.auth.token;
    await user.findByIdAndUpdate({
        _id:userid},{
            $set:{is_online:'1'}
        }
    );
    socket.broadcast.emit('getOnlineUser',{user_id:userid});
    socket.on('disconnect',async function(){
        var userid=socket.handshake.auth.token;
        await user.findByIdAndUpdate({
        _id:userid},{
            $set:{is_online:'0'}
        });
        socket.broadcast.emit('getOfflineUser',{user_id:userid});
        console.log("User disconnected");
    });
    socket.on('newChat',function(data){
        socket.broadcast.emit('loadNewChat',data);
    });
    socket.on('chatExists',async function(data){
        var chats=await chat.find({$or:[
            {sender_id:data.sender_id,receiver_id:data.receiver_id},
            {sender_id:data.receiver_id,receiver_id:data.sender_id},
        ]});
        //console.log(chats);
        socket.emit('loadchats',{chats:chats});
    });
    socket.on('chat-deleted',function(id){
        socket.broadcast.emit('chatMessageDeleted',id);
    });
    socket.on('chatupdated',function(data){
        socket.broadcast.emit('chatMessageUpdated',data);
    });
    socket.on('newGroupChat',function(data){
        socket.broadcast.emit('loadNewGroupChat',data);
    });
    socket.on('groupChatDeleted',function(data){
        socket.broadcast.emit('groupChatMessageDeleted',data);
    });
    socket.on('groupChatUpdated',function(data){
        socket.broadcast.emit('groupChatMessageUpdated',data);
    });
});

http.listen(3000,function(){
    console.log("okey");
});