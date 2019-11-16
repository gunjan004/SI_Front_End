const express = require('express');
const path = require('path');
const fetch = require("node-fetch");
const app = express();
const bodyParser = require('body-parser');
const urlEncodedParser = bodyParser.urlencoded({extended : false});
const { check, validationResult} = require('express-validator/check');

const TokenStorage = require(path.join(__dirname + '/../token_storage.js'));

const tokenStorage = new TokenStorage();

let token = tokenStorage.get();
let userData = tokenStorage.getUserData();

/*tokenStorage.remove();
tokenStorage.removeUserData();*/

console.log("TOKEN :  " + token);
console.log("USER  :" + userData);

app.use(urlEncodedParser);
app.use(bodyParser.json());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname + '/../views'));
app.use('/resources', express.static(path.join(__dirname + '/../resources')));

app.get('/', function(req, res){
    res.render('index', {token : token, userData : userData});
});

app.get('/index', function(req, res){
  res.render('index', {token : token, userData : userData});
});

app.get('/signIn', function(req, res){

  let logoutData = req.query.logout;

  if(logoutData === "true"){

   // console.log("HERE");

    tokenStorage.removeUserData();
    tokenStorage.remove();
    token = tokenStorage.get();
    userData = tokenStorage.getUserData();
    logoutData = "false";
    res.render('signIn', { message: "Please sign in!", needsLogin: "yes", token : token, userData : userData});

  } else if(token) {
    res.render('signIn', {message: "Welcome " + userData + "!", needsLogin: "no", token : token, userData : userData});

  } else {
    res.render('signIn', { message: "Please sign in!", needsLogin: "yes", token : token, userData : userData});
  }
});

app.get('/register', function(req, res){
  res.render('register', {message: "", err: "", token : token, userData : userData});
});

app.post('/register', urlEncodedParser, [
  check('firstName').isLength({ min: 1}).withMessage('Enter First Name'),
  check('lastName').isLength({ min: 1}).withMessage('Enter Last Name'),
  check('emailAddress').isLength({ min: 1}).withMessage('Enter Email-Id'),
  check('password').isLength({ min: 6}).withMessage('Enter atleast 6 characters for password.'),
  check('contact').isLength({ min: 10, max: 10}).withMessage('Enter exactly 10 digits for contact')], async function(req, res){

  //console.log(req.body);

  var errors = validationResult(req);
  if (!errors.isEmpty()) {

    console.log(errors.array());

    for (var e = 0; e < errors.array().length; e++) {
      if (errors.array()[e].param === 'firstName') {
        req.body['fnameError'] = errors.array()[e].msg;
      }
      if (errors.array()[e].param === 'lastName') {
        req.body['lnameError'] = errors.array()[e].msg;
      }
      if (errors.array()[e].param === 'emailAddress') {
        req.body['emailError'] = errors.array()[e].msg;
      }
      if (errors.array()[e].param === 'password') {
        req.body['passwordError'] = errors.array()[e].msg;
      }
      if (errors.array()[e].param === 'contact') {
        req.body['contactError'] = errors.array()[e].msg;
      }
    }

    res.render("register", {
      message: "Validation error occurred",
      err: req.body,
      token : token, userData : userData});
  } else {

    //console.log(res.body);
    const response = await fetch("http://52.45.142.77:80/api/user/signUp", {
      method: "post",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.emailAddress,
        password: req.body.password,
        gender: req.body.gender,
        contactNo: req.body.contact
      })
    });

    const messageData = await response.json();

    if (response.status === 200) {
      res.redirect("/signIn");
    } else {
      res.render('register', {
        message: messageData.message, err: "", token : token, userData : userData});
    }
  }
});


app.get('/about', function(req, res){
  res.render('about', {token : token, userData : userData});
});

app.post('/signIn', urlEncodedParser, async function(req, res){

  const response = await fetch("http://52.45.142.77:80/api/user/login", {
    method: "post",
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email : req.body.emailId,
      password : req.body.password
    })
  });

  const messageData = await response.json();
  //console.log(messageData);

  if(response.status === 200){

    tokenStorage.store(messageData.token);
    tokenStorage.storeData(messageData.name);

    token = tokenStorage.get();
    userData = tokenStorage.getUserData();

    res.render('signIn', {
      message: "Welcome " + userData + "!", needsLogin: "no", token : token, userData : userData});
  } else {
    res.render('signIn', {
      message: messageData.message, needsLogin: "yes" , token : token, userData : userData});
  }
});

app.get('/mySwaps', async function(req, res) {

  if(token){

  let deleteId = req.query.gameID;

  if (deleteId === "" || deleteId === undefined) {
    //console.log("GET GAMES");

    const response = await fetch("http://52.45.142.77:80/api/user/getAllGames", {
      method: "get",
      headers: {
        "token": token
      }
    });

    const messageData = await response.json();

    if (response.status === 200) {
      res.render('mySwaps', {
        gameList: messageData.game, token : token, userData : userData});
    } else {
      res.render('mySwaps', {
        gameList: undefined, token : token, userData : userData});
    }
  } else {

    //console.log("Delete GAME ID : " +  deleteId);
    const response = await fetch("http://52.45.142.77:80/api/user/deleteGame", {
      method: "delete",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'token': token
      },
      body: JSON.stringify({
        gameID: deleteId
      })
    });
    deleteId = "";
    res.redirect("/mySwaps");
  }
} else {
    res.redirect("/pleaseLogin");
}

});

app.get('/pleaseLogin', function(req, res){
  res.render("pleaseLogin", {token : token, userData : userData});
});


app.get('/addNewGame', async function(req, res){

  if(token) {
    res.render("addNewGame", {message: "", err: "", token : token, userData : userData});
  } else {
    res.redirect("/pleaseLogin");
  }
});

app.post('/addNewGame', urlEncodedParser, [
  check('gameName').isLength({ min: 1}).withMessage('Enter Game Name'),
  check('desc').isLength({ min: 1}).withMessage('Enter Description')], async function(req, res){

  var errors = validationResult(req);
  if (!errors.isEmpty()) {

    console.log(errors.array());

    for (var e = 0; e < errors.array().length; e++) {
      if (errors.array()[e].param === 'gameName') {
        req.body['nameError'] = errors.array()[e].msg;
      }
      if (errors.array()[e].param === 'desc') {
        req.body['descError'] = errors.array()[e].msg;
      }
    }

    res.render("addNewGame", {
      message: "Validation error occurred",
      err: req.body, token : token, userData : userData});
  } else {

    //console.log("Adding....");
    //add if no error
    const response = await fetch("http://52.45.142.77:80/api/user/addGame", {
      method: "post",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'token': token
      },
      body: JSON.stringify({
        name: req.body.gameName,
        category: req.body.category,
        imageUrl: req.body.imageUrl,
        description: req.body.desc,
        rating: req.body.rating
      })
    });

    const messageData = await response.json();

    if (response.status === 200) {
      res.redirect("/mySwaps");
    } else {
      res.render('addNewGame', {
        message: messageData.message, err: "", token : token, userData : userData});
    }
  }
});

app.get('*', function(req, res){
  res.send('404 URL not found!! Please provide proper URL.');
});

app.listen(8080);
