var db=require('../config/connection')
var collection=require('../config/collections')
const bcrypt=require('bcryptjs')
const Razorpay = require('razorpay');
var objectId=require('mongodb').ObjectId
const jwt = require('jsonwebtoken')
const { reject, result } = require('lodash')
const { response } = require('express');
const { resolve } = require('path');
const { log } = require('console');
const { Collection } = require('mongodb');
const shortid = require("shortid");


require('dotenv').config()
var instance = new Razorpay({
    key_id: 'rzp_test_ln0hsvoQxrJBg5',
    key_secret: '1Hkdty19gsCP473RQcRIu6Uc',
  });

module.exports={

    doSignup:(userData)=>{
        let res=null

        return new Promise(async(resolve,reject)=>{
            await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email}).then((result)=>{
                if(result){
                    res={Err:true,msg:"email already registered"}
                    resolve(res)
                }
            });
            await db.get().collection(collection.USER_COLLECTION).findOne({phone:userData.phone}).then((result)=>{
             if(result){
                res={Err:true,msg:"phone number already registered"}
                    resolve(res)
             }
            })
            if(res== null){
       
                userData.password=await bcrypt.hash(userData.password,10)
                await db.get().collection(collection.USER_COLLECTION).insertOne(userData)

                await db.get().collection(collection.USER_COLLECTION).createIndex({email:1},{unique:true})
                resolve(userData);
                // .then((data)=>{
                //     resolve(data)   
                // })
            }
        })

        // var flag=null
        // 
        //     let user = await db.get().collection(collection.USER_COLLECTION).findOne({$or: [{email:userData.email},{name:userData.name}]});
        //     if(userData.name==admin.name||userData.email==admin.email){
        //         isUnique=false
        //         resolve(isUnique)
        //     }else if(!user){
        //         userData.password = await bcrypt.hash(userData.password,10)
        //         // console.log(isUnique)
        //         db.get().collection(collection.USER_COLLECTION).insertOne(userData)
        //         isUnique=true
        //         resolve(isUnique)    
        //     }  
        //     else if(user){
        //         flag=false
        //         resolve(flag)
        //     }
        // 
           
        
    },
    referal:(referalCode)=>{
     
      return new Promise(async(resolve,reject)=>{
        await db
        .get()
        .collection(collection.USER_COLLECTION).updateOne({_id:objectId(referalCode)},
        {$inc:{wallet:1000}}
        )
        resolve('success')
      })
    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let response={}
            let  user =await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
            if(user){
                if(user.blocked){
                    var msg="you are blocked"
                    resolve({Status: false,msg})
                }else{
                bcrypt.compare(userData.password,user.password).then((status)=>{
                    if(status){
                        console.log('login sucess')
                        response.user=user
                        response.status=true
                        resolve(response)
                    }else{
                        console.log('login faild')
                        resolve({status:false})
                    }
                })}
            }else{
                console.log("login failed")
                resolve({status:false})
            }
        })
    },
    addUser: (userData) => {
        return new Promise(async (resolve, reject) => {
            
            userData.password = await bcrypt.hash(userData.password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData)

            resolve(userData)
        })

    

    // addUser:(user,callback)=>{
        
    //     db.get().collection('user').insertOne(user).then((data)=>{
        
    //     callback(data)
    //     })
    },
    getAllUser:()=>{
        return new Promise(async(resolve,reject)=>{
            let users= await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },
    
    deleteUser:(userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).deleteOne({_id:objectId(userId)}).then((response)=>{
             
                resolve(response)  
            })
        } )
    },
    getUser:(userId)=>{
        return new Promise((resolve,reject)=>{
         db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)}).then((user)=>{
            resolve(user)
         })   
        })
    },
    blockUser:(userId)=>{
        return new Promise((resolve,reject)=>{
           
            let query={ _id: objectId(userId) };
            db.get().collection(collection.USER_COLLECTION).findOneAndUpdate(query,{$set:{blocked:true}}).then((response)=>{
                resolve(response)
            }).catch((err)=>{
                console.log(err)
            })
        })
    },
    unblockUser:(userId)=>{
        return new Promise((resolve,reject)=>{
      
            let query={ _id: objectId(userId) };
            db.get().collection(collection.USER_COLLECTION).findOneAndUpdate(query,{$set:{blocked:false}}).then((response)=>{
                resolve(response)
            }).catch((err)=>{
                console.log(err)
            })
        })
    },

    sendOTP: (phone) => {
        return new Promise(async (resolve, reject) => {
          db.get().collection(collection.USER_COLLECTION).findOne({ phone: phone }).then((response) => {
            
              resolve(response);
            });
        });
      },

      addToCart:(productId,userId)=>{
       
        return new Promise(async(resolve,reject)=>{
            let productObj={
                item:objectId(productId),
                quantity:1,
            }

            let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            
            if(userCart){
                let proExist=userCart.products.findIndex((products)=> products.item == productId)
              
                if(proExist != -1){
                    db.get().collection(collection.CART_COLLECTION)
                    .updateOne({
                        user:objectId(userId),
                        'products.item':objectId(productId)},
                    {
                        $inc:{'products.$.quantity':1},
                    }).then(()=>{
                        resolve()
                    })
                }else {

                db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId)},
                {
                  
                        $push:{products:productObj},
                })
                    .then((response)=>{
                        resolve()
                    })
                }
                
            }else{
                console.log("hereee");
                let cartObj={
                    user:objectId(userId),
                    products:[productObj]
                }
                // console.log(cartObj)
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve()
                })
            }
        })
      },get__users__count:()=>{
        return new Promise(async(resolve,reject)=>{
           let user__count = await  db.get().collection(collection.USER_COLLECTION).find({}).count()
           resolve(user__count)
        })
      },
      getCartProducts:(userId)=>{

        return new Promise(async(resolve,reject)=>{
          try{
          let cartItems= await db.get().collection(collection.CART_COLLECTION).aggregate([
            {
                $match: {user:objectId(userId)} 
            },
            {
                $unwind:'$products'
            },
            {
                $project:{
                    item:'$products.item',
                    quantity:'$products.quantity'
                  }
            },
            {
                  $lookup:{
                    from:collection.PRODUCT_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:'products'
                  }
            },
            {
                $project:{
                    item:1,
                    quantity:1,
                    product:{
                        $arrayElemAt:["$products",0]
                    }
                }
            }
           
          ]).toArray().catch((err)=>{
            reject(err)
          })
          
          resolve(cartItems)
        }catch(error){
          reject()
        }
        })
      },
      getCartCound:(userId)=>{

        return new Promise(async(resolve,reject)=>{
            let count=0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})

            if(cart){
                count=cart.products.length
            }
            resolve(count)
        })
      },
      changeProductQuantity:(details)=>{
        details.count=parseInt(details.count)
        details.quantity=parseInt(details.quantity)

        return new Promise((resolve,reject)=>{
            if(details.count==-1 && details.quantity==1){
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id:objectId(details.cart)},
                {
                    $pull:{products:{item:objectId(details.product)}}
                }).then((response)=>{
                    resolve({removeProduct:true})
                })
            }else{
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({
                    _id:objectId(details.cart),
                    'products.item':objectId(details.product)},
                {
                    $inc:{'products.$.quantity':details.count},
                }).then((response)=>{
                    resolve({status:true})
                })
            }
            
        })
      },

      deleteProduct:(details)=>{
        return new Promise((resolve,reject)=>{
            db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne({
                _id:objectId(details.cart)
            },
            {
                $pull:{
                    products:{
                        item:objectId(details.product)
                    }
                }
            }
            )
            .then(()=>{
                resolve()
            })
        })
      },

      getTotalAmount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let total= await db.get().collection(collection.CART_COLLECTION).aggregate([
              {
                  $match: {user:objectId(userId)} 
              },
              {
                  $unwind:'$products'
              },
              {
                  $project:{
                      item:'$products.item',
                      quantity:'$products.quantity'
                    }
              },
              {
                    $lookup:{
                      from:collection.PRODUCT_COLLECTION,
                      localField:'item',
                      foreignField:'_id',
                      as:'products'
                    }
              },
              {
                  $project:{
                      item:1,
                      quantity:1,
                      product:{
                          $arrayElemAt:["$products",0]
                      }
                  }
              },
              {
                $group:{
                    _id:null,
                    total:{$sum:{
                        $multiply:['$quantity','$product.price']
                    }}
                }
              }
             
            ]).toArray()
            try {
                resolve(total[0].total)
            } catch (error) {
                resolve()
            }
                
           
                
            
           
            
          })
      },
      placeOrder:(order,products,total)=>{
          return new Promise(async(resolve,reject)=>{
           var today =new Date()
           var orderDate  = new Date()
           var dd = String(orderDate.getDate()).padStart(2,'0')
           var mm = String (orderDate.getMonth()+1).padStart(2,'0')
           var yyyy= orderDate.getFullYear()
           orderDate = dd +'-'+mm+'-'+yyyy
           order.Date=orderDate
           
             
             let status=await order['payment-method']==='COD'||order['payment-method']==='wallet'||order['payment-method']==='paypal'?'placed':'pending'
             console.log(order['payment-method'])
             let orderObj= {
                deliveryDetails:{
                    address:order.address,
                    city:order.city,
                    area:order.area,
                    state:order.state,
                    pincode:order.pin,
                    date:orderDate
                    
                },
                userId:objectId(order.userId),
                PaymentMethod:order['payment-method'],
                products:products,
                totalAmount:total,
                status:status,
                cancelled:false,
                Delivered:false,
                date:today
                
             }

           await  db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
            db.get().collection(collection.CART_COLLECTION).deleteOne({user:objectId(order.userId)})
                resolve(response.insertedId)
             })
          })
      },
      cancelOrder:(orderId)=>{
        return new Promise((resolve,reject)=>{
            try {
              
                db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},
                {
                    
                    $set:{status:'cancelled',cancelled:true}
                    
                }
                ).then((response)=>{
                    resolve(response)
                })
            } catch (error) {
                console.log(error)
            }
        })
      },
      setStatus:(orderId,status1)=>{
        return new Promise((resolve,reject)=>{
            let {status}=status1
            
            if(status=='Delivered'||status=='cancelled'){
              db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},
                {
                    $set:{status:status,
                      Delivered:true}
                    
                }
                ).then((response)=>{

                    resolve(response)
                })
            }else{
              db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},
              {
                  $set:{status:status
                    }
                  
              }
              ).then((response)=>{
                  resolve(response)
              })
            }
            
                
            
        })
      },
      getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            console.log(cart.products)
            resolve(cart.products)
        })
      },
      getUserOrders:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let orders=await db.get().collection(collection.ORDER_COLLECTION).find({userId:objectId(userId)}).toArray()
            resolve(orders)
        })
      },
      getUserOrdersManage:()=>{
        return new Promise(async(resolve,reject)=>{
            let orders=await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            resolve(orders)
        })
      },
      getOderProducts:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
            let orderItems= await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {_id:objectId(orderId)} 
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                      }
                },
                {
                      $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'products'
                      }
                },
                {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{
                            $arrayElemAt:["$products",0]
                        }
                    }
                }
               
              ]).toArray()
             
              resolve(orderItems)
        })
      },
      wallet: (userId, total) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
            if (user.wallet > (total - 1)) {
                await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                    $inc: { wallet: -total }
                }).then((result) => {
                    if (result.acknowledged) {
                        resolve(true)
                    } else {
                        reject('error')
                    }
                })
            }else{
                reject('Insufficient Balance in your Wallet')
            }
 })
},
      


      editProfile:(userId,userDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({
                _id:objectId(userId)
            },
            {
                $set:{
                    name:userDetails.name,
                   
                }
            }
            ).then((response)=>{
                resolve()
            })
        })
      },
      addAddress:(userId,userDetails)=>{
        return new Promise((resolve,reject)=>{

            let address={
                address:userDetails.address,
                city: userDetails.city,
                area: userDetails.area,
                pin: userDetails.pin,
                state: userDetails.state,
                country: userDetails.country
            }
            db.get().collection(collection.USER_COLLECTION).updateOne({
                _id: objectId(userId)

            },
            {
                $push:{
                    address:address
                }
            }
            ).then((response)=>{
                resolve()
            })
        })
      },
      generateRazorpay:(orderId,total)=>{
        return new Promise((resolve,reject)=>{
            var options = {
                amount: total*100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: ""+orderId
              };
              instance.orders.create(options, function(err, order) {
                console.log("new",order);
                resolve(order)
              });
        })
      },
      verifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
            try {
                const crypto = require("crypto");
                let hmac = crypto.createHmac("sha256", "1Hkdty19gsCP473RQcRIu6Uc");
                hmac.update(
                    details["payment[razorpay_order_id]"] +
                    "|" +
                    details["payment[razorpay_payment_id]"]
                  );
                  hmac = hmac.digest("hex");
                  if (hmac == details["payment[razorpay_signature]"]) {
                    
                    resolve();
                  } else {
                    console.log('failed');
                    reject;
                  }
                     
            } catch (error) {
                reject()
                console.log(error);
            }
        })
      },
      changePaymentStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},
            {
                $set:{status:'placed',}
            }
            ).then(()=>{
               resolve()
            })
        })
      },
      addWishlist:(userId,productId)=>{
      
        
        return new Promise(async (resolve, reject) => {
            try {
            
            let wish = await db
              .get()
              .collection(collection.WISHLIST_COLLECTION)
              .findOne({
                userId: objectId(userId)
              });

              if (wish) {
                let productList = wish.products.findIndex(
                  (products) => products == productId
                );
                if (productList != -1) {
                  db.get()
                    .collection(collection.WISHLIST_COLLECTION)
                    .updateOne({
                      userId: objectId(userId)
                    },
                    
                     {
                      $pull: {
                        products: objectId(productId),
                       
                      },
                      
                    },
                    
                    )
                    .then(() => {
                      resolve({
                        status: false
                      });
                    });
                } 
                else {
                    db.get()
                      .collection(collection.WISHLIST_COLLECTION)
                      .updateOne({
                        userId: objectId(userId)
                      },
                     
                      
                      {
                        $push: {
                          products: objectId(productId),
                          
                        },
                      },
                      
                      )
                      .then(() => {
                        resolve({
                          status: true
                        });
                      });
                  }
                } else {
                  let wishObj = {
                    userId: objectId(userId),
                    products: [objectId(productId)],
                    
                    
                  };
                  db.get()
                    .collection(collection.WISHLIST_COLLECTION)
                    .insertOne(wishObj)
                    .then(() => {
                      resolve({
                        status: true,
                        

                      });
                    });
                }
                  
              } catch (error) {
                  reject()
              }
              });
            
      },
      getWishlist: (userId) => {
   console.log(userId)
        return new Promise(async (resolve, reject) => {
          try {
         
          let wishList = await db
            .get()
            .collection(collection.WISHLIST_COLLECTION)
            .aggregate([{
                $match: {
                  userId: objectId(userId)
                },
              },
              {
                $unwind: "$products",
              },
    
              {
                $lookup: {
                  from: collection.PRODUCT_COLLECTION,
                  localField: "products",
                  foreignField: "_id",
                  as: "products",
                },
              },
              {
                $project: {
                  product: {
                    $arrayElemAt: ["$products", 0]
                  },
                },
              },

              
            ])
              


            .toArray();
  
          resolve(wishList);
             
        } catch (error) {
            reject()
        }
        });
      },
      removeWish: (userId, productId) => {
      
        return new Promise((resolve, reject) => {
          try {
            db.get()
              .collection(collection.WISHLIST_COLLECTION)
              .updateOne({
                userId: objectId(userId)
              },
             
               {
                $pull: {
                  products: objectId(productId)
                },
              })
              .then(() => {
                resolve();
              }).catch((err) => {
                reject(err)
              });
          } catch (error) {
            console.log('product not existing');
            reject()
          }
    
    
    
        });
      }, getWishProd: (user) => {
        return new Promise(async (resolve, reject) => {
          try {
          
          let prods = await db
            .get()
            .collection(collection.WISHLIST_COLLECTION)
            .findOne({
              userId: objectId(user)
            });
          resolve(prods);
            
        } catch (error) {
            reject()
        }
        });
      },
      search:(val) => {
       
        return new Promise(async (resolve, reject) => {
          try {
      
          let data = await db.get().collection(collection.PRODUCT_COLLECTION).find({name:{$regex: new RegExp('^'+val+'.*','i')} }).toArray()
         
       
          resolve(data);
         
             
        } catch (error) {
            
        }
        });
      },
      addcoupon:(data)=>{
        return new Promise(async(resolve,reject)=>{
          try {
            db.get().collection(collection.COUPON_COLLECTION).insertOne(data)
          } catch (error) {
            reject()
          }
        })
      },
      getCoupon:()=>{
        return new Promise(async(resolve,reject)=>{
          try {
            let coupon= await db.get().collection(collection.COUPON_COLLECTION).find().toArray()
            resolve(coupon)
          } catch (error) {
            reject()
          }
        })
      },
      deleteCoupon:(couponId)=>{
        return new Promise(async(resolve,reject)=>{
          try {
           db.get().collection(collection.COUPON_COLLECTION).deleteOne({_id:objectId(couponId)}) 
          } catch (error) {
            reject()
          }
        })
      },
      verifyCoupon:(coupon)=>{
        console.log(coupon);
        return new Promise(async(resolve,reject)=>{
          try {
            db.get().collection(collection.COUPON_COLLECTION).findOne({
              coupon:coupon.coupon

            }).then((res)=>{
             
              resolve(res)
              
            })
          } catch (error) {
            reject()
          }
        })
      }

}

