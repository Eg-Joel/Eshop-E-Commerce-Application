var db=require('../config/connection')
var collection=require('../config/collections')
const { result, reject } = require('lodash')
var objectId=require('mongodb').ObjectId
const { verify } = require('jsonwebtoken');
module.exports={
  
    addProduct: (product,callback) => {

        product.price=parseInt(product.price)
        db.get().collection('product').insertOne(product).then((data)=>{
      
            callback(data.insertedId)
        })
    } ,
    deleteProduct:(productId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectId(productId)}).then((response)=>{
             
                resolve(response)  
            })
        } )
    },
    get__products__count:()=>{
        return new Promise(async(resolve,reject)=>{
           let product__count = await  db.get().collection(collection.PRODUCT_COLLECTION).find({}).count()
           resolve(product__count)
        })
      },

    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    getProduct:(ProductId)=>{
        return new Promise((resolve,reject)=>{
         db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(ProductId)}).then((Product)=>{
            resolve(Product)
         })   
        })
    },
    
    getAllProductsMobile:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find({category:"mobile"}).toArray()
            resolve(products)
        })
    },
    getAllProductsLaptop:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find({category:"laptop"}).toArray()
            resolve(products)
        })
    },
    getAllProductsAccessories:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find({category:"accessories"}).toArray()
            resolve(products)
        })
    },
    getCategories:()=>{
        return new Promise(async(resolve,reject)=>{
         let categories= await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
         
         resolve(categories)
        })
    },
    getCategory:(categoryName)=>{
        return new Promise(async(resolve,reject)=>{
         let categories= await db.get().collection(collection.CATEGORY_COLLECTION).findOne({category:categoryName})
         
         resolve(categories)
        })
    },
    
   
    addCategories:(data)=>{
        let res=null
        return new Promise(async(resolve, reject) => {
            await db.get().collection(collection.CATEGORY_COLLECTION).findOne({category:data.category}).then((result)=>{
                if(result){
                    res={Err:true,msg:"category already registered"}
                    resolve(res)
                }
            })

            if(res==null){
               await db.get().collection(collection.CATEGORY_COLLECTION).insertOne(data)
               resolve(data)
            }
        })
        
        
         
         
  
    },
    categoryDetails:(catId)=>{
        
        return new Promise(async(resolve,reject)=>{
            await db.get().collection(collection.CATEGORY_COLLECTION).findOne({_id:objectId(catId)}).then((category)=>{
                resolve(category)
        })
        })

    },

    editCategory:(catId,data)=>{
        
       db.get().collection(collection.CATEGORY_COLLECTION).updateOne({_id:objectId(catId)},{$set:{category:data}})
             
        

    },
    deleteCategory:(catId)=>{
     
            db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({_id:objectId(catId)})
    },

    updateProduct:(ProductId,ProductDetails)=>{
        var check=null
        return new Promise((resolve,reject)=>{
            ProductDetails.price=parseInt(ProductDetails.price)
                
                db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(ProductId)},{
                    $set:{
                        name:ProductDetails.name,
                        category:ProductDetails.category,
                        subcategory:ProductDetails.subcategory,
                        productdetails:ProductDetails.productdetails,
                        price:ProductDetails.price,
                        offer:ProductDetails.offer

                    }
                 } )
               
                 
                 .then((response)=>{
                    resolve()
                 })
            })
            
        },
        addCategoryOffer:(catname,offer)=>{
            return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).updateOne({category:catname},
           { $set:{
                   offer:offer

            }}
            ).then((response)=>{
                resolve()
            })
            })
        },
        deleteCategoryOffer:(catId)=>{
            
            db.get().collection(collection.CATEGORY_COLLECTION).updateOne({_id:objectId(catId)},{$unset:{offer:"offer"}});
        },

        getOfferPrice:(category,offer)=>{
       
            return new Promise(async(resolve,reject)=>{
                let products =await db.get().collection(collection.PRODUCT_COLLECTION).find({category:category}).toArray()
                
                for (var i = 0; i < products.length; i++) {
                    var offerPrice = Number(100 - (offer)) / 100
                    await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(products[i]._id) },
                        {
                            $set: { offerPrice: products[i].price * offerPrice }
                        })
                }
                resolve()
                
            })
        }
        
    
    }
    
