const LocalStorage = require('node-localstorage').LocalStorage;
function TokenStorage(){
    this.localStorage;
    if (typeof localStorage === "undefined" || localStorage === null) {
        this.localStorage = new LocalStorage('./scratch');
    }
}
TokenStorage.prototype.store = function(token){
    // we use specific key for storing access token
    this.localStorage.setItem('token', token);

}

TokenStorage.prototype.storeData = function (data){
    // we use specific key for storing access token
    this.localStorage.setItem('data', data);

}

TokenStorage.prototype.get = function(){
// we get access token back by using specific key
    return this.localStorage.getItem('token');
}

TokenStorage.prototype.getUserData = function(){
// we get access token back by using specific key
    return this.localStorage.getItem('data');
}

TokenStorage.prototype.remove = function(){
    return this.localStorage.removeItem('token');
}

TokenStorage.prototype.removeUserData = function(){
    return this.localStorage.removeItem('data');
}
module.exports = TokenStorage;
