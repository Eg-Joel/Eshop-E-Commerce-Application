




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
