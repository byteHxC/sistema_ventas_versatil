const express = require('express'),
	app = express(),
	bodyParser = require('body-parser'),
	methodOverride = require('method-override'),
	passport = require('passport'),
	flash = require('connect-flash'),
	session = require('express-session'),
    multer = require('multer')
    upload = multer({dest: './uploads/'});

// connector myssql
const connectionMySql = require('./config/database.js')

// - AppConfig
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(methodOverride("_method"));
app.use(express.static('public'));
app.use(express.static('uploads'));


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
	res.render('index', {authenticate: req.isAuthenticated()});
});
// - Inicio de sesión
router.route('/login')
	.get(notIsLoggedIn,function(req, res){
		res.render('inicio_sesion/login',{ message: req.flash('loginMessage')});
	})
	.post(passport.authenticate('local-login', {
        successRedirect : '/redirect_user', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

// - Cerrar sesión
router.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/login');
    });

// - Redirijir segun el tipo de usuario
router.get('/redirect_user',isLoggedIn,function(req, res){
    // console.log(req.user.usuario);
    if(req.user.usuario == 'empleado_mostrador'){

    }else if(req.user.usuario == 'diseñador'){

    }else if(req.user.usuario == 'administrador'){
        res.render('administrador/principal');
    }else if(req.user.usuario == 'contador'){

    }
});

// Gestion de catalogo
router.get('/catalogo',isLoggedIn, function(req, res){
    connectionMySql.query("SELECT * FROM `modelos`",function(err,rows){
        var json = JSON.parse(JSON.stringify(rows));
        // console.log(json)
        res.render('administrador/catalogo',{modelos: json});
    });  
});

router.route('/catalogo/add')
    .get(isLoggedIn, function(req, res){
        console.log('GET /catalogo/add')
        res.render('administrador/addModelo')
    })
    .post(isLoggedIn,upload.single('imagen'),function(req, res){
        console.log("POST /catalogo/add");
        var data = [parseInt(req.body.precio_unitario),req.file.filename,req.body.descripcion];
        connectionMySql.query('INSERT INTO `modelos` (`precio_unitario`, `ruta_imagen`, `descripcion`) VALUES (?, ?, ?)', data, function(error){
            if(error){
                console.log(error.message);
            }else{
                res.redirect('/catalogo')
            }
        });
    });

router.route('/catalogo/:id_modelo')
    .get(isLoggedIn, function(req, res){
        console.log('GET this '+req.params.id_modelo)
        connectionMySql.query("SELECT * FROM `modelos` where id_modelo = ?",[req.params.id_modelo], function(err,rows){
            var json = JSON.parse(JSON.stringify(rows));
            // console.log(json)
            res.render('administrador/editModelo', {modelo: json});
            console.log('end')
        }); 
    })
    .put(isLoggedIn, function(req, res){
        console.log('UPDATE /catalogo/:id_modelo');
        // console.log(req.body)
        // console.log(req.params)
        // console.log([req.body.descripcion,req.body.precio_unitario, req.params.id_modelo])
        connectionMySql.query('UPDATE modelos set descripcion=?,precio_unitario=? where id_modelo = ?',[req.body.descripcion,req.body.precio_unitario, req.params.id_modelo], function(error){
            if(error){
                console.log(error.message);
            }else{
                res.redirect('/catalogo')
            }
        });
    })
    .delete(isLoggedIn, function(req, res){
        console.log(' delete ' + req.params.id_modelo)
        connectionMySql.query('DELETE from modelos where id_modelo=?',[req.params.id_modelo], function(error){
            if(error){
                console.log(error.message);
            }else{
                res.redirect('/catalogo')
            }
        });
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
    res.redirect('/login');
}
function notIsLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        res.redirect('/');
    // if they aren't redirect them to the home page
    return next();
}
