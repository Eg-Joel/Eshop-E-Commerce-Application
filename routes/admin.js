const { response } = require('express');

var objectId=require('mongodb').ObjectId
var db = require("../config/connection");
var collection=require('../config/collections')
var chartHelper = require('../helpers/chart-helpers')
var express = require('express');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers')
var userhelper=require('../helpers/user-helpers');
const { reject } = require('lodash');
let msg = ""
let message = "";
// var fileUpload=require('express-fileupload')

// var adminauthen=require('../helpers/admin-authentication')
// router.use(fileUpload())
// const jwt = require('jsonwebtoken');
function verifyAdmin(req, res, next) {
  if (!req.session.admin) {
    res.status(403).redirect("/admin");
  } else {
    next();
  }
}

const admins={
  name:'admin',
  email:'admin@gmail.com',
  password:'admin'
}

/* GET users listing. */
router.get('/', function(req, res, next) {
  let admin=req.session.admin

if(req.session.admin){
  userhelper.get__users__count().then((count)=>{

    productHelpers.get__products__count().then((pcount)=>{
     chartHelper.salesReport().then((data)=>{

     
   let totalsales = data.deliveredTotalSale.totalRevenue
   let orders= data.deliveredTotalSale.totalDelivered
    res.render('admin/home',{admin,admin:true,ad:true,totalsales,orders,pcount,count})
  })
  })
})
}
 else{
  res.render('admin/admin-login',{admin,admin:true})
 }
});
router.get('/home/day',(req,res)=>{
   chartHelper.findOrdersByDay().then((data)=>{
    
    res.json(data)
   })
})
router.get('/home/month',(req,res)=>{
  chartHelper.findOrderByMonth().then((data)=>{
   
   res.json(data)
  })
})

// router.get('/home/week',(req,res)=>{
//   chartHelper.findOrderByWeek().then((data)=>{
   
//    res.json(data)
//   })
// })
// router.get('/home/get-order-details',(req,res)=>{
//   chartHelper.findOrderByoder().then((data)=>{
   
//     res.json(data)
// })
// })
// router.get('/home/stats',(req,res)=>{
//   chartHelper.findOrderByYear().then((data)=>{
   
//     res.status(200).json(data)
// })
// })
router.post('/login', (req, res) => {

  

  let adminMail=req.body.email
  let adminPassword=req.body.password

  if(adminMail==admins.email&&adminPassword==admins.password){
    
  //  const adminToken = jwt.sign(admin,process.env.ADMIN_TOKEN_SECRET,{expiresIn:'12d'})
  //  res.cookie('adminToken',adminToken,{httpOnly:true})
  
  req.session.admin=admins
  req.session.admin.loggedIn=true
  // res.render('admin/home',{admin:true,ad:true})
  res.redirect('/admin')
   }else{
    // res.clearCookie('adminToken')
    res.render('admin/admin-login',{admins,admin:true})
   }
    


})

router.get('/view-products', verifyAdmin,async(req, res) => {

  var search =''
  if(req.query.search){
    search=req.query.search
  }
   const productData =await  db.get().collection(collection.PRODUCT_COLLECTION)
   .find({
    
    $or:[
      {name:{$regex:'.*'+search+'.*'}},
      {category:{$regex:'.*'+search+'.*'}},
      {price:{$regex:'.*'+search+'.*'}}
    ]

   })

 await productHelpers.getAllProducts().then((products)=>{

    productHelpers.getCategories().then((categories)=>{

    
    res.render('admin/view-products',{products,productData,admin:true,ad:true,categories,msg})
    msg=""
  })
})
})
router.get('/add-product',verifyAdmin,(req,res)=>{

  let categories=""
  productHelpers.getCategories().then((response)=>{
    categories=response

  res.render('admin/add-products',{admin:true,ad:true,categories,admin:req.session.admin})
  })
})
router.post('/add-product',verifyAdmin,(req,res)=>{
  console.log(req.body)
  // let productDetails = req.body.productdetails
  // let stringproductDetails = productDetails.replace(/\s+/g, ' ').trim()
  productHelpers.addProduct(req.body,async(id)=>{
    
    let imagees=req.files.images
    let subImages=[]
    if(req.files.image2){
      subImages.push(req.files.image2)
    }
    if(req.files?.image3)
    { subImages.push(req.files?.image3)}

     for(let index=0;index<2;index++){
      await
      subImages[index].mv("./public/productimages/" + id + index +".jpg", (err, data) => {
        if (!err) {
      
       
        } else {
          console.log(err);
        }
      })
      
    }
     

    await imagees.mv('./public/productimages/'+id+'.jpg',(err,done)=>{
      if(!err){
        res.redirect('/admin/view-products')
      }else{
        console.log(err)
      }
    })
  })
  
})
router.get('/delete-product/:id',(req,res)=>{
  let productId=req.params.id
  
  productHelpers.deleteProduct(productId).then((response)=>{
    msg = "Product deleted sucessfully"
    res.redirect("/admin/view-products")
  })
})


router.get('/edit-product/:id',async(req,res)=>{
  let categories =""
  productHelpers.getCategories().then(async(response)=>{
    categories=response
  
  let product=await productHelpers.getProduct(req.params.id)
  
  res.render('admin/edit-product',{admins,ad:true,product,categories,admin:true})
})})
router.post('/edit-product/:id',(req,res)=>{
  let id=req.params.id
  // let productDetails = req.body.productdetails
  // let stringproductDetails = productDetails.replace(/\s+/g, ' ').trim()
  productHelpers.updateProduct(req.params.id,req.body).then(async()=>{
    // console.table(req.body)
    res.redirect('/admin/view-products')
    try{
      if(req.files.images){
        let Image = req.files.images
        Image.mv('./public/productimages/'+id+'.jpg')
      }if (req.files.image2){
        let Image2 = req.files.image2
        Image2.mv('./public/productimages/'+id+'0.jpg')
      } if (req.files.image3){
        let Image3 = req.files.image3
        Image3.mv('./public/productimages/'+id+'1.jpg')
      } 
      
      else{
       console.log('no pics ')
      }
     }catch(err){
      console.log(err)
     }

  //  try{
   
  //     let subImages=[]

  //     if(req.files?.image2){ subImages.push(req.files?.image2)}
  //     if(req.files?.image3){ subImages.push(req.files?.image3)}
  //     for (let index = 0; index < 2; index++) {
  //      await subImages[index].mv("./public/productimages/" + id + index +".jpg", (err, data) => {
  //         if (!err) {
  //         console.log("sub images added",index);
  //         res.redirect('/admin/view-products')
  //         } else {
  //           console.log(err);
  //         }
        
  //       })
  //     }
  //     if(req.files?.images){
  //       let image =req.files
    
  //     await image.mv('./public/productimages/'+id+'.jpg',(err,done)=>{
  //       if(err){
  //         console.log(err)
  //       }
  //     })
  //     // if(!err){
  //       res.redirect('/admin/view-products')
  //   }else{
  //     res.redirect('/admin/view-products')
  //   }
  //     // }else {
  //     //   console.log(err);
  //     // }
  
  //   // if(req.files){
      
  //     // let image=req.files.images
      
      
  //   // }
  //  }catch(err){
  //   console.log(err)
  //  }
  })
})
router.post('/graphdata',(req,res)=>{
  chartHelper.graphdata().then((data)=>{
    res.json({data})
  })
})

router.get('/view-categories',verifyAdmin,async(req,res)=>{
  try{
    productHelpers.getCategories().then((response)=>{
        
        let category=  response
        console.log(req.session.admin);
        res.render("admin/view-category",{category,ad:true,admin:req.session.admin,msg});
        msg=""
    })
  }catch (err) {
    console.log(err);
  }
})


router.post('/add-category',verifyAdmin,async(req,res)=>{
  try{
    productHelpers.addCategories(req.body).then((response)=>{
      if(response.err){
        message=response.msg
        res.redirect('/view-categories')
      }else{
        res.redirect("/admin/view-categories");
      }
    })
  
  }
  catch (err) {
    console.log(err);
  }
})
router.get('/edit-category',verifyAdmin,async(req,res)=>{
try{
  let catId=req.query.id
  let category=await productHelpers.categoryDetails(catId)

  res.render('admin/edit-category',{admin:true,ad:true,category,admin:req.session.admin})

}
catch(err){
  console.log(err)
}
})

router.post('/editCategory',verifyAdmin,(req,res)=>{
  try{
    let catId=req.query.id
    let data = req.body.category
    productHelpers.editCategory(catId,data)

    res.redirect('/admin/view-categories')
  }catch (err){
    console.log(err)
  }
})
router.get('/delete-category',verifyAdmin,async(req,res)=>{
try{
  let productId=req.query.id
  productHelpers.deleteCategory(productId)
  msg = "category deleted sucessfully"
  res.redirect('/admin/view-categories')
}catch(err){
  console.log(err)
}
})

router.post('/add-category-offer/:name',(req,res)=>{
  let category = req.params.name
  let offer=req.body.offer
 console.log(category);
  productHelpers.addCategoryOffer(category,offer).then((response)=>{
   res.redirect('/admin/view-categories')
  })
 })
 router.get('/delete-category-offer/:id',(req,res)=>{
  let catId=req.params.id
  
  productHelpers.deleteCategoryOffer(catId)
  res.redirect('/admin/view-categories')
 })
 
 router.get('/view-coupons',verifyAdmin,(req,res)=>{
  try {
    userhelper.getCoupon().then((response)=>{
      let coupon =response
      res.render('admin/view-coupons',{coupon,admin:true,ad:true})
    }).catch(()=>{res.redirect('/error')})
  } catch (error) {
    console.log(err);
    res.redirect('/error')
  }
  
 })
 router.post('/add-coupon',async(req,res)=>{
  try {
    userhelper.addcoupon(req.body).catch(()=>{
      res.redirect('/error')
    })
    res.redirect('/admin/view-coupons')
  } catch (error) {
    console.log(err);
    res.redirect('/error')
  }
 })
 router.get('/delete-coupon/:id',async(req,res)=>{
  try {
    let couponId =req.params.id
    userhelper.deleteCoupon(couponId).catch(()=>{
      res.redirect('/erroe')
    })
    res.redirect('/admin/view-coupons')
  } catch (error) {
    console.log(err);
    res.redirect('/error')
  }
 })

router.get('/view-user',verifyAdmin,(req,res)=>{
  
  userhelper.getAllUser().then((users)=>{
    // console.log(users)
    // res.send('fjdsal;')
    let blockedUser = req.session.blocked
    res.render('admin/view-user',{users,admin:true,ad:true,admin:req.session.admin,msg,blockedUser});
    msg=""
    })
 
})

router.get('/block-user',(req,res)=>{
  try {
    let userId=req.query.id
    userhelper.blockUser(userId).then((response)=>{
    msg = "user blocked sucessfully"
    res.redirect("/admin/view-user");
  })
  } catch (err) {
    console.log(err);
  }
})

router.get('/unblock-user',(req,res)=>{
  try {
    let userId=req.query.id
    userhelper.unblockUser(userId).then((response)=>{
    msg = "user unblocked sucessfully"
    res.redirect("/admin/view-user");
})
} catch (err) {
  console.log(err);
}
})

router.get('/delete-user/:id',(req,res)=>{
  let userId=req.params.id
  userhelper.deleteUser(userId).then((response)=>{
    msg = "user deleted sucessfully"
    res.redirect("/admin/view-user")
  })
})

router.get('/logout',(req,res)=>{
  // res.clearCookie('admintoken')
  req.session.admin=null
  req.session.loggedIn=false
  res.render('admin/admin-login',{admin:true})
})
router.get('/orders-manage',verifyAdmin,async(req,res)=>{
  let orders=await userhelper.getUserOrdersManage()
  let options = {year:'numeric',month:'short',day:'numeric'}
  orders.forEach(data => {
   
    data.date=(data.date.toLocaleDateString('en-US',options))
  });
  res.render('admin/oder-manage',{admin:true,ad:true,admin:req.session.admin,orders,options})
})
router.get('/sales-report',verifyAdmin,async(req,res)=>{
  let orders=await userhelper.getUserOrdersManage()
  let options = {year:'numeric',month:'short',day:'numeric'}
  orders.forEach(data => {
   
    data.date=(data.date.toLocaleDateString('en-US',options))
  });
  res.render('admin/sales-report',{admin:true,ad:true,admin:req.session.admin,orders,options})
})
router.post('/set-status/:id',verifyAdmin,(req,res)=>{
  try {
    
    userhelper.setStatus(req.params.id,req.body).then((resolve,reject)=>{
      res.redirect('/admin/orders-manage')
    })
    
  } catch (error) {
    console.log(err);
  }
})



module.exports = router;
