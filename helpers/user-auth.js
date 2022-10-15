const jwt = require('jsonwebtoken')
require('dotenv')
const user__helper=require('./user-helpers')
let userDetails

module.exports={

    usercookieJWTAuth:(req,res,next)=>{
        const usertoken = req.cookies.usertoken
        try{
            const user = jwt.verify(usertoken,process.env.USER_TOKEN_SECRET)
            userDetails = user
            next()
        }catch(err){
           
            console.log('error occured in userauth.js')
            res.clearCookie('usertoken')
            return res.redirect('/login')
        }
    },
    userLoggedIn:(req,res,next)=>{
        try{
            const usertoken = req.cookies.usertoken
            console.log(usertoken)
            const user = jwt.verify(usertoken,process.env.USER_TOKEN_SECRET)
            res.redirect('/')
        }catch(err){
            res.clearCookie('usertoken')
            next()
        }
    },
    
    // this is a simple function but very usefull when we need to get the user details at a certain point in code 
    get__user__details:()=>{
      
        return userDetails
    }
}