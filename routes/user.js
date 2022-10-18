const { response } = require('express');
const bcrypt=require('bcrypt')
var express = require('express');
var router = express.Router();
const jwt = require("jsonwebtoken");
let msg = false;
var objectId=require('mongodb').ObjectId
var db = require("../config/connection");
var collection=require('../config/collections')
const controllers=require('../controllers/usercontroller')
var productHelpers=require('../helpers/product-helpers')
const userHelpers=require('../helpers/user-helpers');

const auth= require('../helpers/user-auth');
const { Admin, ObjectId } = require('mongodb');
const { forEach, result } = require('lodash');
let message = "";
let token
require('dotenv').config()

async function verify(req, res, next) {


  if (req.session.user == undefined) {

  
    res.redirect('/login')
  } 
  else 
  {
    const  token = req.cookies.usertoken;


    jwt.verify(
      token,
      process.env.USER_TOKEN_SECRET,
      async (err, phone) => {
        if (phone) {
          req.phone = phone;
          phoneNo = phone;
          next();
        } else if (err.message === "TokenExpiredError") {
        
          return res.status(403).redirect("/login");
        } else {

          res.status(403).redirect("/login");

        }
      }
    );
    let user = db
      .get()
      .collection(collection.USER_COLLECTION)
      .findOne({
        phone: phoneNo
      });
    if (user.blocked) {
      res.status(403).redirect("/Login");
    }

  }

}
function loginCheck(req,res) {
  if (req.session.user == undefined) {
   
     res.redirect('/login')
    } 
}

/* GET home page. */
router.get('/',async function(req, res, next) {
  let user=req.session.user
  token=req.cookies.usertoken
  let cartCound=null
  let wishList=null
  if(user){
    cartCound=await userHelpers.getCartCound(user._id)
    wishList = await userHelpers.getWishProd(user._id)
    wishList = wishList?.products
  }


  productHelpers.getAllProducts().then((products)=>{
    res.render('index',{products,user,cartCound,wishList,token,userf:true})
  })
});


router.get('/login',function(req,res){
  try{

  
  if(req.session.user){
    res.redirect('/')
  }else{
    if(msg){
      res.render('user/login',{loginErr:msg})
      msg=false
    }else{
      res.render('user/login',{loginErr:req.session.userLoginErr})
      req.session.userLoginErr=false
    }
    
  }
}
catch(err){
  console.log(err)
}
})

router.get('/mobiles',async(req,res)=>{
  let user=req.session.user
  let cartCound=null
  if(user){
    cartCound=await userHelpers.getCartCound(user._id)
  }
  productHelpers.getAllProductsMobile().then((products)=>{
    res.render('index',{products,user,cartCound,userf:true})
  })
})

router.get('/laptops',async(req,res)=>{
  let user=req.session.user
  let cartCound=null
  if(user){
    cartCound=await userHelpers.getCartCound(user._id)
  }
  productHelpers.getAllProductsLaptop().then((products)=>{
    res.render('index',{products,user,cartCound,userf:true})
  })
})


router.get('/Accessories',async(req,res)=>{
  let user=req.session.user
  let cartCound=null
  if(user){
    cartCound=await userHelpers.getCartCound(user._id)
  }
  productHelpers.getAllProductsAccessories().then((products)=>{
    res.render('index',{products,user,cartCound,userf:true})
  })
})


router.get('/product-page/:id',verify,async(req,res)=>{
  let user=req.session.user
  console.log('produtpage')
  let cartCound=null
  if(user){
    cartCound=await userHelpers.getCartCound(user._id)
  }
  let product=await productHelpers.getProduct(req.params.id)
  let categoryName = product.category
  let category = await productHelpers.getCategory(categoryName)
  
  let offer  = category.offer
 
   productHelpers.getOfferPrice(categoryName,offer)
   let offerPrice=product.offerPrice

    res.render('user/product',{product,offerPrice,offer,cartCound,user,userf:true})
  
})

router.get('/search',(req,res)=>{
  try {
    console.log('kol');
    userHelpers.search(req.query.searchKey).then(asyncdata=>{
      res.render('index',{data:data})
     
    })
  } catch (error) {
    console.log(error);
  }
})

router.get('/sendOTP',(req,res)=>{

  try {
    res.render('user/otpLogin',{loginErr:req?.session?.userLoginErr});
    req?.session?.userLoginErr=false
  } catch (err) {
    console.log(err);
    res.redirect('/error')
  }

  // if(req.session.user){
  //   res.redirect('/')
  // }else{
  //   console.log('else');
  //   res.render('user/otpLogin',{loginErr:req?.session?.userLoginErr})
  //   req.session.userLoginErr=false
  // }
})


router.post("/sendOTP", controllers.sendOTP);


router.post("/verifyOTP", controllers.verifyOTP);




router.get('/wishlist',verify,controllers.wishlists)

router.post('/wishlist/:id',verify,(req,res)=>{
  try {
    let produdtId= req.params.id
    let userId =  req.session.user._id
 
    userHelpers.addWishlist( userId ,produdtId).then((response)=>{
      res.json(response)
    }).catch(()=>{res.redirect('/error')});;
  } catch (error) {
    console.log(err);
    res.redirect('/error')
  }
  
 
})
router.post('/remove-wishlist/:id',verify,(req,res)=>{
  console.log('lpo');
  let produdtId= req.params.id
  let userId =  req.session.user._id
  userHelpers.removeWish( userId,produdtId).then((response)=>{
    res.json({status:true})
  }).catch(()=>{res.redirect('/error')});;
  
})
router.get('/cart', verify,controllers.getCart)


router.get('/add-to-cart/:id', verify, (req,res)=>{

  
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
   res.json({status:true})
  })
})

router.post('/change-product-quantity',async(req,res,next)=>{
try {
  let price = 0
  let offerPrice=0
  let total = 0
  productHelpers.getProduct(req.body.product).then((response)=>{
    price = response.price
    offerPrice= response?.offerPrice
  }).catch (()=>{res.redirect('/error')

})
  userHelpers.changeProductQuantity(req.body).then(async(response)=>{

   let products = await userHelpers.getCartProducts(req.session.user._id)

   products.forEach((data)=>{
    try {
      if(data.product.offerPrice){
        subTotal = Number(data.quantity) * Number(data.product.offerPrice);
      
      } else {
        data.subTotal = Number(data.quantity) * Number(data.product.price);
       
      }
      total+=subTotal
      }
      catch (error) {
        subTotal = Number(data.quantity) * Number(data.product.price);
        
        total+=subTotal
      }
    
   })
   response.total = total
   response.price = price;
   response.offerPrice = offerPrice
   res.json(response);
   
  })
}catch(err){
  console.log(err);
  
  res.redirect('/error')
}
})

router.get('/place-order',verify,async(req,res)=>{

  let total =0
  let orgiPrice=0
  let products = await userHelpers.getCartProducts(req.session.user._id)
  products.forEach((data)=>{
    
    
    try {
      if (data.product.offerPrice) {
        subTotal = Number(data.quantity) * Number(data.product.offerPrice);
        orgprice =  Number(data.quantity) * Number(data.product.price);
      } else {
        subTotal = Number(data.quantity) * Number(data.product.price);
       
      }
     total+=subTotal
     orgiPrice+=orgprice
    } catch (error) {
      subTotal = Number(data.quantity) * Number(data.product.price);
        
          total+=subTotal
          orgiPrice+=orgprice
    }
  })
  
  let user = await userHelpers.getUser(req.session.user._id)
  let address =false
  if(user.address){
    address=user.address
  }
  
  res.render('user/order-page',{total,orgiPrice,user:req.session.user,address})
})
router.post('/place-order',verify,async(req,res)=>{
  let product=await userHelpers.getCartProductList(req.body.userId)
 
  let total= 0
 let products = await userHelpers.getCartProducts(req.session.user._id)
  products.forEach((data)=>{
      try {
        

        if(data.product.offerPrice){
          subTotal = Number(data.quantity)*Number(data.product.offerPrice)
        }else{
          subTotal = Number(data.quantity) * Number(data.product.price);
   
        }
        total+=subTotal
      } catch (error) {
        subTotal = Number(data.quantity) * Number(data.product.price);
        total+=subTotal
      }
      if(req.body.coupon){
        let offer = Number(req.body.coupon)
        total=total-(total*(offer/100))
      }
      
      
    })
  
  
 
  userHelpers.placeOrder(req.body,product,total).then((orderId)=>{
   if(req.body['payment-method']=='COD'){
    res.json({codSuccess:true})
   }else if(req.body['payment-method']=='razorpay'){
      userHelpers.generateRazorpay(orderId,total).then((response)=>{
      res.json(response)
      })
   }else if(req.body['payment-method']=='paypal'){
    response.paypal = true;
    res.json(response)
   }else if(req.body['payment-method']=="wallet"){
    userHelpers.wallet(req.session.user._id,total).then((result)=>{
      res.json({result})
    })
   }

  
  })
 
})

router.get('/wallet',verify,async(req,res)=>{
  let total = 0
  userId = req.session.user._id
  let amount = await walletHelpers.getWallet(req.session.user._id)

  walletHelpers.getWalletTrans(req.session.user._id).then((wallet)=>{
    res.render('user/wallet',{user:req.session.user,wallet,amount})
  })
})
router.post('/verifycoupon',async(req,res)=>{
  try {
   
    let total = 0
    let products = await userHelpers.getCartProducts(req.session.user._id).catch(()=>{res.redirect('/error')})
    
    products.forEach((data)=>{
      try {
        if(data.product.offerPrice){
          subTotal = Number(data.quantity) * Number(data.product.offerPrice);
        }else{
          subTotal = Number(data.quantity) * Number(data.product.price);
        }
        total += subTotal
      } catch (error) {
        subTotal = Number(data.quantity) * Number(data.product.price);
        total+=subTotal
      }
    })
    let user = await userHelpers.getUser(req.session.user._id).catch(()=>{
      res.redirect('/error') })
      let address=false
      if(user.address){
        address=user.address
      }
      
      userHelpers.verifyCoupon(req.body).then((coupon)=>{
      
        res.render('user/order-page',{total,user:req.session.user,address,coupon})
      }).catch(()=>{res.redirect('/error')})
   
  } catch (error) {
    console.log(error)
    res.redirect('/error')
  }
})
router.get('/order-success',verify,(req,res)=>{
  res.render('user/order-success',{user:req.session.user})
})
router.get('/orders',verify,async(req,res)=>{
  let orders=await userHelpers.getUserOrders(req.session.user._id)
  // let options = {year:'numeric',month:'short',day:'numeric'}
  // orders.forEach(data => {
  //   // console.log(data)
  //   // console.log(data.date)
  //   data.date=(data.date.toLocaleDateString('en-US',options))
  // });

  res.render('user/orders',{user:req.session.user,orders})
})

router.get('/view-order-products/:id',async(req,res)=>{
  let products=await userHelpers.getOderProducts(req.params.id)
  res.render('user/view-order-products',{user:req.session.user,products})
})

router.post('/verify-payment',(req,res)=>{
 
  userHelpers.verifyPayment(req.body).then(()=>{
    console.log(req.body)
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      res.json({status:true})
      
      
    })
  }).catch((err)=>{
   
    res.json({status:false,erMsg:''})
  })
})

router.get('/user-profile',verify,(req,res)=>{
  let user=req.session.user
  res.render('user/user-profile',{user:req.session.user,user})
})

router.get('/edit-profile',verify,(req,res)=>{
  let user=req.session.user
  console.log(user)
  res.render('user/edit-profile',{user:req.session.user,user})
})





router.post('/edit-profile',verify,async(req,res)=>{
  let userId=req.session.user._id;

  userHelpers.editProfile(userId,req.body).then(()=>{
    userHelpers.getUser(userId).then((response)=>{
      req.session.updatedUser=response
      updatedUser = response
      res.redirect('/user-profile')
    })
  })
})

router.get('/cancel-order/:id',verify,controllers.cancelOrder)
router.post('/add-address',verify,async(req,res)=>{
  let userId= req.session.user._id

  userHelpers.addAddress(userId,req.body).then(()=>{
    userHelpers.getUser(userId).then((response)=>{
      req.session.updatedUser = response
      updatedUser=response
      res.redirect('/user-profile')
    })
  })
})

router.post('/change-password',verify,async(req,res)=>{

  let userId = req.session.user._id

  let enteredPassword = req.body.password;
  let newPassword= req.body.newPassword
  let userdetails= await db.get().collection(collection.USER_COLLECTION).findOne({_id:ObjectId(userId)})

  let verifypassword = bcrypt.compareSync(
    enteredPassword,
    userdetails.password
  )

  if(verifypassword){
    if(enteredPassword == newPassword){
      req.session.message={
        type:"danger",
        message:"cannot type old password"
      }
      res.redirect("/user-profile")
    }else{
      await db.get().collection(collection.USER_COLLECTION).updateOne(
        {_id: objectId(userId)},
        {
          $set:{
            password:bcrypt.hashSync(newPassword,10),
          },
        }
      )
        
      req.session.message={
        type:"success",
        message:"password changed",
      }
       res.redirect('/user-profile')
    }
  }else{
    req.session.message={
      type:"success",
      message:"password is not correctt"
    }
    res.redirect('/user-profile')
  }
})

router.post('/delete-product',verify,(req,res)=>{
  
  userHelpers.deleteProduct(req.body).then(()=>{
    res.json({ status:true})
  })
})

router.get('/signup',(req,res)=>{
  if(req.session.user)
  {

    res.redirect('/')
  }else{
    res.render('user/signup',{message})
    message = "";
  }
})
router.post('/signup',(req,res)=>{
  try{
     const user={
      name:req.body.name,
      email:req.body.email,
      phone:req.body.phone,
      password:req.body.password,
      referal:req.body.referalCode
     }
     if(user.referal!= ""){
      userHelpers.referal(user.referal).then((result)=>{

      })
     }


  userHelpers.doSignup(user).then((response)=>{
    if(response.Err){
      message=response.msg
      res.redirect('/signup')
    }else if(response == "invalid referal"){
      res.json({status:"error"})
    }else
    {

      const usertoken=jwt.sign(user,process.env.USER_TOKEN_SECRET,{expiresIn:'356d'})
      res.cookie('usertoken',usertoken,{
        httpOnly:true
      })

      req.session.user=response
      req.session.user.loggedIn=true
      res.redirect('/')
    }
   
  })
  }
  catch(err){
    console.log(err)
  }
})

router.post('/login',(req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      
      const usertoken=jwt.sign(response,process.env.USER_TOKEN_SECRET,{expiresIn:'356d'})
      res.cookie('usertoken',usertoken,{
        httpOnly:true
      })

      req.session.user=response.user
      req.session.user.loggedIn=true
      
      res.redirect('/')
    }else{
      msg = response.msg;
      req.session.userLoginErr="invalid user name or password"
      res.redirect('/login')
    }
  })
})
router.get('/user/logout',(req,res)=>{
  req.session.user=null
  req.session.loggedIn=false

  res.clearCookie('usertoken')
  

  // req.session.admin.destroy()
  res.redirect('/')
})

module.exports = router;
