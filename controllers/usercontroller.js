const crypto = require("crypto");
const bcrypt = require("bcrypt");
const userHelpers=require('../helpers/user-helpers');
var productHelpers=require('../helpers/product-helpers')
const jwt = require("jsonwebtoken");
const JWT_AUTH_TOKEN=process.env.JWT_AUTH_TOKEN
const { strict } = require('assert');
const accountID=process.env.ACCOUNTSID
const authToken=process.env.AUTHTOKEN
const client = require('twilio')(accountID,authToken)

const smsKey = process.env.SMS_SECRET_KEY;

exports.sendOTP = (req, res) => {
try{

  const phone =req?.body?.phone
userHelpers.sendOTP(phone).then(async(response)=>{
  const phone=response?.phone
  req.session.tempUser=response

  const otp=Math.floor(100000+ Math.random() * 900000)
  const ttl= 2 * 60 * 1000
  const expires =Date.now()+ttl
  const data = `${phone}.${otp}.${expires}`

  const hash =crypto
  .createHmac("sha256",smsKey)
  .update(data)
  .digest("hex");
 
  const fullhash= `${hash}.${expires}`;


  client.messages
  .create({
    body:`your one time password for login is ${otp}`,
    from: +19786794151,
    to: `+91`+phone
  })
  .then((message)=>{})
  .catch((err)=>{
    console.error(err)
  })
  await res.status(200).cookie("hash",fullhash,{
    expires: new Date(new Date().getTime+30*10000),
    sameSite:"strict",
    httpOnly:true,
  })
  .cookie("phone", phone, {
    
    expires: new Date(new Date().getTime + 30 * 10000),
    sameSite: "strict",
    httpOnly: true,
    
  })
  .render('user/verifyOTP',{phone})
})
}catch(err){
console.log(err)
}
}
exports.verifyOTP = async (req, res) => {
    try {
      const phone = req.cookies.phone;
  
      const hash = req.cookies.hash;

      const otp = req.body.otp;

     
  
      let [hashValue, expires] = hash.split(".");
      let now = Date.now();
      if (now > parseInt(expires)) {
        return res.status(504).send({ msg: "Timeout please try again" });
      }
      const data = `${phone}.${otp}.${expires}`
      
      const newCalculatedHash = crypto
      .createHmac("sha256",smsKey)
      .update(data)
      .digest("hex")
      
        console.log(hashValue)
      if (newCalculatedHash === hashValue) {
        const accessToken = jwt.sign({ data: phone }, JWT_AUTH_TOKEN, {
          expiresIn: "300000s",
        });
        req.session.loggedIn = true;
        req.session.user = req.session.tempUser;
        await res
          .status(202)
          .cookie("accessToken", accessToken, {
            expires: new Date(new Date().getTime + 30 * 1000),
            sameSite: "strict",
            httpOnly: true,
          })
          .cookie("authSession", true, {
            expires: new Date(new Date().getTime + 30 * 1000),
          })
          .redirect("/");
             } else {
      return res.status(400).render("user/verifyOTP", { msg: "incorrect otp" });
    }
  } catch (err) {
    console.log(err);
  }
};


exports.getCart = async(req,res)=>{
  let total= 0
  let products=await userHelpers.getCartProducts(req.session.user._id)
   await userHelpers.getCartProducts(req.session.user._id).then(async(products)=>{
    products.forEach((data)=>{
    
      try{
      if(data.product.offerPrice){
        subTotal = Number(data.quantity)*Number(data.product.offerPrice)
        console.log(Number(data.product.offerPrice))
      }else{
        subTotal = Number(data.quantity)*Number(data.product.price)
      }
      total+=subTotal
    }catch(error){
      subTotal = Number(data.quantity)*Number(data.product.price)
      total+=data.subTotal
    }
    })
  
    res.render('user/user-cart',{total,products,user: req.session.user})
 
  })
 
}





exports.cancelOrder=async (req,res)=>{
  try{
    
  await userHelpers.cancelOrder(req.params.id).then((resolve,reject)=>{
    res.redirect('/orders')
  })
  }catch (error) {
    console.log(error);
      res.redirect('/error')
  }
}

exports.wishlists=async(req,res)=>{
  try {
    let products = await userHelpers.getWishlist(req.session.user._id).catch(()=>{res.redirect('/error')});;
    res.render("user/wishlist", { products, user: req.session.user });
  } catch (err) {
    console.log(err);
    res.redirect('/error')
  }
}