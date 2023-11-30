const express=require("express");
const user_route=express();
const auth=require('../middlewares/auth');
const bodyParser=require('body-parser');

const session=require('express-session');
const {SESSION_SECRET}=process.env;

user_route.use(session({secret:SESSION_SECRET}));
const cookieParser=require('cookie-parser');
user_route.use(cookieParser());
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({extended:true}));

user_route.set('view engine','ejs');
user_route.set('views','./views');

user_route.use(express.static('public'));

const path=require('path');
const multer=require('multer');

const storage=multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,'../public/images'));
    },
    filename:function(req,file,cb){
        const name=Date.now()+'-'+file.originalname;
        cb(null,name);
    }
});
const userController=require('../controllers/userController');
const upload=multer({
    storage:storage
});
user_route.get('/register',auth.islogout,userController.registerLoad);
user_route.post('/register',upload.single('image'),userController.register);
user_route.get('/',auth.islogout,userController.loadLogin);
user_route.post('/',userController.login);
user_route.get('/logout',auth.islogin,userController.logout);
user_route.get('/dashboard',auth.islogin,userController.dashboard);
user_route.post('/save-chat',userController.saveChat);
user_route.post('/delete-chat',userController.deletechat);
user_route.post('/update-chat',userController.updatechat);
user_route.get('/groups',auth.islogin,userController.loadGroups);
user_route.post('/groups',upload.single('image'),userController.createGroup);
user_route.post('/get-members',auth.islogin,userController.getMembers);
user_route.post('/add-members',auth.islogin,userController.addMembers);
user_route.post('/update-chat-group',auth.islogin,upload.single('image'),userController.updateChatGroup);
user_route.post('/delete-chat-group',auth.islogin,userController.deleteChatGroup);
user_route.get('/share-group/:id',userController.shareGroup);
user_route.post('/join-group',userController.joinGroup);
user_route.get('/group-chat',auth.islogin,userController.groupChats);
user_route.post('/group-chat-save',userController.groupChatSave);
user_route.post('/load-group-chats',userController.loadGroupChats);
user_route.post('/delete-group-chat',userController.deleteGroupChat);
user_route.post('/update-group-chat',userController.updateGroupChat);
user_route.get('*',function (req,res) {
   res.redirect('/'); 
});
module.exports= user_route;