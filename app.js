const express = require('express'),
	app = express(),
	bodyParser = require('body-parser'),
	methodOverride = require('method-override'),
	passport = require('passport'),
	flash = require('connect-flash'),
	session = require('express-session'),
    multer = require('multer'),
    upload = multer({dest: './uploads/'}),
    request = require('request');

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
    console.log('GET /redirect_user -> '+req.user.usuario);
    if(req.user.usuario == 'empleado_mostrador'){
        res.render('empleado_mostrador/principal');
    }else if(req.user.usuario == 'diseñador'){

    }else if(req.user.usuario == 'administrador'){
        res.render('administrador/principal');
    }else if(req.user.usuario == 'contador'){

    }
});

// Gestion de catalogo
router.get('/catalogo',isLoggedIn, function(req, res){
    connectionMySql.query("SELECT * FROM `modelos`",function(err,rows){
        console.log('GET /catalogo/')
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
        console.log('delete' + req.params.id_modelo)
        connectionMySql.query('DELETE from modelos where id_modelo=?',[req.params.id_modelo], function(error){
            if(error){
                console.log(error.message);
            }else{
                res.redirect('/catalogo')
            }
        });
    });

router.get('/seleccionar_modelos/:id_cliente/:filtro?/:valor?/', isLoggedIn, function(req, res){
    console.log('GET /seleccionar_modelos/:id_cliente/:filtro?/:valor?/ ')
    if(req.params.filtro == 'precio'){
        connectionMySql.query('SELECT * FROM modelos WHERE precio_unitario > ? and precio_unitario < ?;',[parseInt(req.params.valor)-10,parseInt(req.params.valor)+10 ],function(error, rows){
            if(error){
                console.log(error.message);
            }else{
               var json = JSON.parse(JSON.stringify(rows));
               res.render('empleado_mostrador/showCatalogo',{id_cliente: req.params.id_cliente,modelos: json});
            }
        });
    }else if (req.params.filtro == 'modelo'){
        connectionMySql.query('SELECT * FROM modelos WHERE id_modelo LIKE "%'+req.params.valor+'%"',[req.params.valor],function(error, rows){
            if(error){
                console.log(error.message);
            }else{
                console.log(req.params.id_cliente);
                var json = JSON.parse(JSON.stringify(rows));
                res.render('empleado_mostrador/showCatalogo',{id_cliente: req.params.id_cliente, modelos: json});
            }
         });
    }else{
        connectionMySql.query("SELECT * FROM `modelos`",function(err,rows){
            var json = JSON.parse(JSON.stringify(rows));
            // console.log(json)
            res.render('empleado_mostrador/showCatalogo',{id_cliente: req.params.id_cliente, modelos: json});
        }); 
    }
    
});

// MARK: - Rutas pedidos
router.route('/pedido/add/:id_cliente?/:modelos?')
    .get(isLoggedIn, function(req, res){
        console.log('GET /pedido/add');
        var id_cliente = req.params.id_cliente || null;
        var modelos = req.params.modelos || null;
        if(id_cliente != null && modelos!=null){
            getCliente(id_cliente, function(err, data_cliente){
                if(err){
                    res.status(500).send(err);
                }else{
                    modelos = modelos.split(',');
                    var sql = 'SELECT * FROM modelos WHERE id_modelo = ' + modelos[0] || null;
                    for (var i = 1; i < modelos.length; i++) {
                        sql += ' or id_modelo = ' + modelos[i];
                    }
                    connectionMySql.query(sql,function(error, rows){
                        if(error){
                            console.log(error.message);
                        }else{
                           var json = JSON.parse(JSON.stringify(rows));
                           res.render('empleado_mostrador/addPedido', {cliente: data_cliente, modelos: json})
                        }
                    }); 
                    
                }
            });
        }else{
             var data_cliente = {
                id_cliente: '',
                nombre: '',
                correo: '',
                telefono: ''
            };
            res.render('empleado_mostrador/addPedido', {cliente: data_cliente, modelos: {}})
        }
    })
    .post(isLoggedIn, function(req, res){
        console.log('POST /pedido/add');
        console.log(req.body.table)
        console.log(req.body)
    });

// MARK: - Agregar cliente
router.route('/cliente/add')
    .get(isLoggedIn, function(req, res){
        console.log('GET /cliente/add');
        res.render('empleado_mostrador/addCliente');
    })
    .post(isLoggedIn, function(req, res){
        console.log('POST /cliente/add');
        var data = [req.body.nombre, req.body.telefono, req.body.correo, req.body.rfc, req.body.curp, req.body.calle, req.body.no_ext || null, req.body.no_int || null,req.body.colonia, req.body.codigo_postal || null, req.body.localidad, req.body.municipio, req.body.estado];
        // console.log(data);
        connectionMySql.query('INSERT INTO `clientes` (nombre, telefono, correo, rfc, curp, calle, no_ext, no_int, colonia, codigo_postal, localidad, municipio, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', data, function(error,result,fields){
            if(error){
                console.log(error.message);
            }else{
                connectionMySql.query('SELECT * FROM clientes where id_cliente = ?', [result.insertId], function(error, rows){
                    if(error){
                        console.log(error.message);
                    }else{
                        var json = {
                            id_cliente: rows[0].id_cliente,
                            nombre: rows[0].nombre,
                            telefono: rows[0].telefono,
                            correo: rows[0].correo
                        }
                        res.render('empleado_mostrador/addPedido', {cliente: json});
                    }
                });
            }
        });
    });

router.get('/clientes/:nombre?/', isLoggedIn, function(req, res){
    if(req.params.nombre){
        connectionMySql.query('SELECT * FROM clientes WHERE nombre LIKE "%'+req.params.nombre+'%" ',function(error, rows){
            if(error){
                console.log(error.message);
            }else{
               var json = JSON.parse(JSON.stringify(rows));
                res.render('empleado_mostrador/showClientes', {clientes: json});
            }
        });
    }else{
        connectionMySql.query('SELECT * FROM clientes',function(error, rows){
            if(error){
                console.log(error.message);
            }else{
               var json = JSON.parse(JSON.stringify(rows));
                res.render('empleado_mostrador/showClientes', {clientes: json});
            }
        });
    }
    
});

// agregamos el cliente seleccionado al pedido
router.get('/cliente_seleccionado/:id_cliente/', isLoggedIn, function(req, res){
    connectionMySql.query('SELECT * FROM clientes where id_cliente = ?', [req.params.id_cliente], function(error, rows){
        if(error){
            console.log(error.message);
        }else{
            var json = {
                id_cliente: rows[0].id_cliente,
                nombre: rows[0].nombre,
                telefono: rows[0].telefono,
                correo: rows[0].correo
            }
            var modelos = {}
            res.render('empleado_mostrador/addPedido', {cliente: json, modelos: modelos});
        }
    });
});
// agregarmos los modelos seleccionados al pedido
router.get('/modelos_seleccionados/:id_cliente/:modelos/', isLoggedIn, function(req, res){
    console.log('GET /modelosSeleccionados/:modelos/ ->' + req.params.modelos);
    modelos = req.params.modelos.split(',');
    var sql = 'SELECT * FROM modelos WHERE id_modelo = ' + modelos[0] || null;
    
    for (var i = 1; i < modelos.length; i++) {
        sql += ' or id_modelo = ' + modelos[i];
    }
    connectionMySql.query(sql,function(error, rows){
        if(error){
            console.log(error.message);
        }else{
           var json = JSON.parse(JSON.stringify(rows));
           // console.log(json);
           res.redirect('/pedido/add/'+req.params.id_cliente+'/'+req.params.modelos);
           // res.render('empleado_mostrador/addPedido', {id_cliente:req.params.id_cliente, modelos: json})
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

function getCliente(id_cliente, callback){
    connectionMySql.query('SELECT *from clientes WHERE id_cliente = ?', [id_cliente], function(err, result){
        if (err) 
            callback(err,null);
        else{
            var data = {
                id_cliente: result[0].id_cliente,
                nombre: result[0].nombre,
                telefono: result[0].telefono,
                correo: result[0].correo
            }
            callback(null,data);
        }
    });
}

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
