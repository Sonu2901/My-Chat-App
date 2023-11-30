const islogin=async(req,res,next)=>{
    try {
        if(req.session.user){

        }
        else{
            res.redirect('/');
        }
        next();
    } catch (error) {
        console.log(error.message);
    }
};
const islogout=async(req,res,next)=>{
    try {
        if(req.session.user){
            res.redirect('/dashboard');
        }
        else{
        }
        next();
    } catch (error) {
        console.log(error.message);
    }
};
module.exports={
    islogin,
    islogout
}
