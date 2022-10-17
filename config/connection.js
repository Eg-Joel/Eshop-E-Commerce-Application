const mongoClient=require('mongodb').MongoClient
const state={
    db:null
}
module.exports.connect=function(done){
    const url='mongodb+srv://joel:6Ku6SRGTSB4elFQO@cluster0.mk8cifj.mongodb.net/?retryWrites=true&w=majority'
    const dbname='eshop'

   mongoClient.connect(url,(err,data) =>{
    if(err) return done(err)
    state.db=data.db(dbname)
    done()
   }) 
  
}

module.exports.get=function() {
     return state.db
}