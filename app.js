const express = require('express'),
	app = express(),
	bodyParser = require('body-parser'),
	methodOverride = require('method-override');

// - AppConfig
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(methodOverride("_method"));
app.use(express.static('public'));

app.set("view engine", "jade");

// Router 
var router = express.Router();

// root page
router.get('/',function(req, res){
	res.render('index');
});

app.use(router);

app.listen(3000,function () {
	console.log('Node server running on http://127.0.0.1:3000/')
});

