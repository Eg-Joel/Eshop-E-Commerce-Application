$("#search").on('change keyup paste', function () {


    let div = document.querySelector(".search-div");
    let bg = document.querySelector(".sec");
    let val = $('#search').val();
   
    if (val) {
        div.classList.add('search-div-active')
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        bg.classList.add('sec1')
    } else {
        div.classList.remove('search-div-active')
        bg.classList.remove('sec1')
    }
    
   

    
    $.ajax({
        url: "/search?val=" + val,
        method: 'get',
        success: (data) => {
           
            if (data != '') {
                document.getElementById('search-div').innerHTML = `${data.map((product) => {
                    return `<div style="margin-top:6px;" class="col-md-3">
                <div id="card" class="card p-5em mt-7" style="width: 14rem;">
                <img class="card-img-top" src="/productimages/${product._id}.jpg" alt="Card image cap">
                <div class="card-body">
                <h5 id="card-name" class="card-title">${product.name}</h5>
               
                <p class="card-text">Rs.${product.price}</p>
                <button class="btn btn-primary" onclick="addToCart('${product._id}')">add to cart</button>
               
                </div>
                </div>
                </div>`
                
                })}`
            } else {
                document.getElementById('search-div').innerHTML= '<div class="nopro">No Product Found</div>'
            }
           
           

            
        }
    })  
});




function addToCart(productId){
    $.ajax({
        url:'/add-to-cart/'+productId,
        method:'get',
        success:(response)=>{
            if(response.status)
            {
                let count=$('#cart-count').html()
                count=parseInt(count)+1
                $("#cart-count").html(count)
            }
           
            swal({
                title: "added to cart",
                type: 'success',
               
                confirmButtonText: '<i class="fa fa-times-circle"></i> Continue Shopping', 
                    showCloseButton: false,
                    showCancelButton: false,
              })
        }
    })
}


function addToWishList(productId){
    
    $.ajax({
        url:'/wishlist/'+productId,
         
        method:'post',
        success:(response)=>{
            if(response.status)
            {
               alert('added')
               
            }else{
                alert('removed')
              
            }
           
         
        }
    })
}
function removeWishList(productId){
    swal({
        title: "removed from wishlist",
        type: 'success',
       
        confirmButtonText: '<i class="fa fa-times-circle"></i> Continue Shopping', 
            showCloseButton: false,
            showCancelButton: false,
      }).then((willDelete)=>{
        if(willDelete){
            $.ajax({
                url:'/remove-wishlist/'+productId,
                
                method:'post',
                success:(response)=>{
                    
                    location.reload();   
                   
                }
            })
        }else{
            
        }
      })
   
    
}
