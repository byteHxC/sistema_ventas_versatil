const express = require('express'),
	app = express(),
	bodyParser = require('body-parser'),
	methodOverride = require('method-override'),
	passport = require('passport'),
	flash = require('connect-flash'),
	session = require('express-session');



// - AppConfig
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(methodOverride("_method"));
app.use(express.static('public'));

app.set("view engine", "jade");

// required for passport
app.use(session({ secret: 'ppcdsalvc' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session
require('./config/passport')(passport); 

// Router 
var router = express.Router();

// root page
router.get('/',function(req, res){
	console.log(req.isAuthenticated())
	res.render('index', {authenticate: req.isAuthenticated()});
});
// Manejo de inicios de sesión
router.route('/login')
	.get(notIsLoggedIn,function(req, res){
		res.render('inicio_sesion/login',{ message: req.flash('loginMessage')});
		
	})
	.post(passport.authenticate('local-login', {
        successRedirect : '/', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));
router.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

app.use(router);
app.use(function(req, res){
	res.status(400);
	res.render('404')
});


app.listen(3000,function () {
	console.log('Node server running on http://127.0.0.1:3000/')
});

function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();
    // if they aren't redirect them to the home page
    res.redirect('/');
}
function notIsLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        res.redirect('/');
    // if they aren't redirect them to the home page
    return next();
}
