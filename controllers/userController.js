const User=require('../models/usermodel');
const Chat=require('../models/chatmodel');
const Group=require('../models/groupmodel');
const Member=require('../models/membermodel');
const GroupChat=require('../models/groupchatmodel');
const bcrypt=require('bcrypt');
const mongoose=require("mongoose");
const membermodel = require('../models/membermodel');

const registerLoad=async(req,res)=>{
    try {
        res.render('register');
    } catch (error) {
        
        console.log(error.message);
    }
};
const register=async(req,res)=>{
    try {
        const passwordHash=await bcrypt.hash(req.body.password,10);
        const user=new User({
            name:req.body.name,
            email:req.body.email,
            image:'images/'+req.file.filename,
            password:passwordHash
        });
        await user.save();
        res.render('register',{message:'Registration Successfull'});
    } catch (error) {
        
        console.log(error.message);
    }
};
const loadLogin=async(req,res)=>{
    try {
        res.render('login');
    } catch (error) {
        console.log(error.message);
    }
}
const login=async(req,res)=>{
    try {
        if(req.body.goToRegister){
            res.redirect('/register');
            return;
        }
        const email=req.body.email;
        const password=req.body.password;
        const userdata=await User.findOne({email:email});
        if(userdata){
            const flag=await bcrypt.compare(password,userdata.password);
            if(flag){

                req.session.user=userdata;
                res.cookie(`user`,JSON.stringify(userdata))
               return res.redirect('/dashboard');
            }
            else{
                return res.render('login',{message:"Email and passeord do not match"});
            }
        }
        else{
           return res.render('login',{message:"Email and passeord do not match"});
        }
    } catch (error) {
         console.log(error.message);
    }
}
const logout=async(req,res)=>{
    try {
        res.clearCookie('user');
        req.session.destroy();
        res.redirect('/');
    } catch (error) {
        console.log(error.message);
    }
}
const dashboard=async(req,res)=>{
    try {
       var users=await User.find({_id:{$nin:[req.session.user._id]}});
       
        res.render('dashboard',{user: req.session.user,users:users});
    } catch (error) {
        console.log(error.message);
    }
}
const saveChat=async(req,res)=>{
    // console.log(req);
    const obj=req.body;
    //console.log(obj.sender_id);
  try {
    var chat=new Chat({
        sender_id:obj.sender_id,
        receiver_id:obj.receiver_id,
        message:obj.message
    });
    var newchat=await chat.save();
    res.status(200).send({
        success:true,
        msg:"Chat Inserted!",
        data:newchat
    });
  } catch (error) {
    res.status(400).send({success:false,msg:error.message});
  }  
};
const deletechat=async (req,res)=>{
    try {
        await Chat.deleteOne({_id:req.body.id});
        res.status(200).send({success:true});
    } catch (error) {
        res.status(400).send({success:false,msg:error.message});
    }
};
const updatechat=async (req,res)=>{
    try {
        await Chat.findByIdAndUpdate({_id:req.body.id},{
            $set:{
                message:req.body.message
            }
        })
        res.status(200).send({success:true});
    } catch (error) {
        res.status(400).send({success:false,msg:error.message});
    }
}
const loadGroups=async(req,res)=>{
    try { 
        const groups=await Group.find({creator_id:req.session.user._id});      
         res.render('group',{groups:groups});
     } catch (error) {
         console.log(error.message);
     }
}
const createGroup=async(req,res)=>{
    try {
        const group=new Group({
            creator_id:req.session.user._id,
            name:req.body.name,
            image:'images/'+req.file.filename,
            limit:req.body.limit
        });
        await group.save();
        const groups=await Group.find({creator_id:req.session.user._id});       
        res.render('group',{message:req.body.name+' Group Created Successfully! ',groups:groups});
    } catch (error) {
        console.log(error.message);
    }
}
const getMembers=async (req,res)=>{
    //console.log(new mongoose.Types.ObjectId(req.body.group_id));
    try {
        var users=await User.aggregate([
            {
                $lookup:{
                    from:"members",
                    localField:"_id",
                    foreignField:"user_id",
                    pipeline:[
                        {
                            $match:{
                                $expr:{
                                    $and:[
                                        {
                                            $eq:["$group_id",new mongoose.Types.ObjectId(req.body.group_id)]
                                        }
                                    ]
                                }
                            }
                        }
                    ],
                    as:"member"
                }
            },
            {
                $match:{
                    "_id":{
                        $nin:[new mongoose.Types.ObjectId(req.session.user._id)]
                    }
                }
            }
        ]);
       //console.log(users);
        res.status(200).send({success:true,data:users});
        
    } catch (error) {
        res.status(400).send({success:false,msg:error.message});
    }
}
const addMembers=async (req,res)=>{
    try {
        if(!req.body.members){
            res.status(200).send({success:false,msg:"Please Select a Member"});
        }
        else if(req.body.members.length>parseInt(req.body.limit)){
            res.status(200).send({success:false,msg:"You can't select more than "+req.body.limit+" members"});
        }
        else{
            await Member.deleteMany({group_id:req.body.group_id});
            let data=[];
            let members=req.body.members;
            for(let i=0;i<members.length;i++){
                data.push({
                    group_id:req.body.group_id,
                    user_id:members[i]
                });
            }
            await Member.insertMany(data);
            res.status(200).send({success:true,msg:"Members added successfully"});
        }
    } catch (error) {
        res.status(400).send({success:false,msg:error.message});
    }
}
const updateChatGroup=async(req,res)=>{
    try {
        if(parseInt(req.body.limit)<parseInt(req.body.last_limit)){
            await Member.deleteMany({group_id:req.body.id});
        }
        let updateObj;
        if(req.file!==undefined){
            updateObj={
                name:req.body.name,
                image:"images/"+req.file.filename,
                limit:req.body.limit
            }
        }
        else{
            updateObj={
                name:req.body.name,
                limit:req.body.limit
            }
        }
        await Group.findByIdAndUpdate({_id:req.body.id},{
            $set:updateObj
        })
        res.status(200).send({success:true,msg:"Group Updated successfully"});
        
    } catch (error) {
        res.status(400).send({success:false,msg:error.message});
    }
}
const deleteChatGroup=async(req,res)=>{
    try {
        await Group.deleteOne({_id:req.body.id});
        await Member.deleteMany({group_id:req.body.id});
        res.status(200).send({success:true,msg:"Group Deleted successfully"});
    } catch (error) {
        res.status(400).send({success:false,msg:error.message});
    }
}
const shareGroup=async(req,res)=>{
    try {
        var group_data=await Group.findOne({_id:req.params.id});
        
        if(!group_data){
            console.log(10);
            res.render('error',{message:"404 Page Not Found"});
        }
        else if(req.session.user==undefined){
            console.log(8);
            res.render('error',{message:"You need to login first."});
        }
        else{
            let totalMembers=await Member.find({group_id:req.params.id}).count();
            let available=group_data.limit-totalMembers;
            let isOwner=group_data.creator_id==req.session.user._id?true:false;
            let isJoined=await Member.find({group_id:req.params.id,user_id:req.session.user._id}).count();
            res.render('sharelink',{group_data:group_data,avilable:available,totalMembers:totalMembers,isJoined:isJoined,isOwner:isOwner});
        }
    } catch (error) {
        console.log(error.message); 
    }
}
const joinGroup=async(req,res)=>{
   // console.log("hello");
    try {
        const member=new Member({
            group_id:req.body.group_id,
            user_id:req.session.user._id
        });
        await member.save();
        res.send({success:true});
    } catch (error) {
        res.send({success:false,msg:error.message});
    }   
}
const groupChats=async(req,res)=>{
    try {
        const myGroups=await Group.find({creator_id:req.session.user._id});
        const joinedGroups=await Member.find({user_id:req.session.user._id}).populate('group_id');
        res.render('chat-group',{myGroups:myGroups,joinedGroups:joinedGroups});
    } catch (error) {
        console.log(error.message);
    }
};
const groupChatSave=async(req,res)=>{
    try {
        var chat=new GroupChat({
            sender_id:req.body.sender_id,
            group_id:req.body.group_id,
            message:req.body.message
        })
        var newchat=await chat.save();
        var cChat=await GroupChat.findOne({_id:newchat._id}).populate('sender_id');
        res.send({success:true,chat:cChat});
    } catch (error) {
        res.send({success:false,msg:error.message});
    }
};
const loadGroupChats=async(req,res)=>{
    try {
        const groupChats=await GroupChat.find({group_id:req.body.group_id}).populate('sender_id');
        res.send({success:true,chats:groupChats})
    } catch (error) {
        res.send({success:false,msg:error.msg});
    }
};
const deleteGroupChat=async(req,res)=>{
    try {
        await GroupChat.deleteOne({_id:req.body.id});
        res.send({success:true});
    } catch (error) {
        res.send({success:false,msg:error.msg});
    }
};
const updateGroupChat=async(req,res)=>{
    try {
        await GroupChat.findByIdAndUpdate({_id:req.body.id},
            {
                $set:{
                    message:req.body.message
                }
            });
        res.send({success:true});
    } catch (error) {
        res.send({success:false,msg:error.msg});
    }
};
module.exports={
    register,
    registerLoad,
    loadLogin,
    login,
    logout,
    dashboard,
    saveChat,
    deletechat,
    updatechat,
    loadGroups,
    createGroup,
    getMembers,
    addMembers,
    updateChatGroup,
    deleteChatGroup,
    shareGroup,
    joinGroup,
    groupChats,
    groupChatSave,
    loadGroupChats,
    deleteGroupChat,
    updateGroupChat
}