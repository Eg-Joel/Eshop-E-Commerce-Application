console.log('js is running')
let address = document.getElementById('address')
let id = address.innerHTML
let city = document.getElementById('city')
let area = document.getElementById('area')
let state = document.getElementById('state')
let pin = document.getElementById('pin')

let addressInput=document.getElementById('address-to')
let cityInput=document.getElementById('city-to')
let areaInput=document.getElementById('area-to')
let stateInput=document.getElementById('state-to')
let pinInput=document.getElementById('pin-to')
  
function clickAddress(){
    console.log('got it')
    addressInput.innerHTML = address.innerHTML
    
    cityInput.value = city.innerHTML
    areaInput.value = area.innerHTML
    stateInput.value = state.innerHTML
    pinInput.value = pin.innerHTML
}