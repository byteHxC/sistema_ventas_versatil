const express = require('express'),
	app = express(),
	bodyParser = require('body-parser'),
	methodOverride = require('method-override'),
	passport = require('passport'),
	flash = require('connect-flash'),
	session = require('express-session'),
    multer = require('multer'),
    upload_image = multer({dest: './uploads/'}),
    upload_factura = multer({dest: './facturas/'}),
    request = require('request'),
    PDFDocument = require('pdfkit'),
    fs = require('fs');

// config send mails
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'versatil.invitaciones@gmail.com', // Your email id
            pass: 'versatil.123' // Your password
        }
    });

// config nota de venta
var notaVenta = require('./config/nota');
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
router.route('/login/')
	.get(notIsLoggedIn,function(req, res){
		res.render('inicio_sesion/login',{ message: req.flash('loginMessage')});
    })
	.post(passport.authenticate('local-login', {
        successRedirect : '/redirect_user', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

// - Cerrar sesión
router.get('/logout/', function(req, res) {
        req.logout();
        res.redirect('/login/');
    });

// - Redirijir segun el tipo de usuario
router.get('/redirect_user',isLoggedIn,function(req, res){
    console.log('GET /redirect_user -> '+req.user.usuario);
    if(req.user.usuario == 'empleado_mostrador'){
        res.render('empleado_mostrador/principal');
    }else if(req.user.usuario == 'diseñador'){
        res.redirect('/disenios/lista/');
    }else if(req.user.usuario == 'administrador'){
        res.render('administrador/principal');
    }else if(req.user.usuario == 'contador'){
        res.redirect('/factura/lista/');
    }
});

// Gestion de catalogo
router.get('/catalogo_lista/:filtro?/',isLoggedIn, function(req, res){
    if(req.params.filtro){
        console.log(req.params.filtro);
         connectionMySql.query("SELECT * FROM modelos where id_modelo=?",[req.params.filtro],function(err,rows){
            console.log('GET /catalogo/')
            var json = JSON.parse(JSON.stringify(rows));
            // console.log(json)
            res.render('administrador/catalogo',{modelos: json});
        });
    }else{
        connectionMySql.query("SELECT * FROM `modelos`",function(err,rows){
            console.log('GET /catalogo/')
            var json = JSON.parse(JSON.stringify(rows));
            // console.log(json)
            res.render('administrador/catalogo',{modelos: json});
        });
    }
      
});

router.route('/catalogo/add/')
    .get(isLoggedIn, function(req, res){
        console.log('GET /catalogo/add')
        res.render('administrador/addModelo')
    })
    .post(isLoggedIn,upload_image.single('imagen'),function(req, res){
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
                           connectionMySql.query("select auto_increment from information_schema.TABLES WHERE  table_name like 'pedidos';",function(error, rows){
                                var no_pedido = JSON.parse(JSON.stringify(rows))[1].auto_increment;
                                console.log('->'+rows[1]);
                                console.log(no_pedido);
                                res.render('empleado_mostrador/addPedido', {cliente: data_cliente, modelos: json,no_pedido: no_pedido});
                           });          
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
            connectionMySql.query("select auto_increment from information_schema.TABLES WHERE  table_name like 'pedidos';",function(error, rows){
                var no_pedido = JSON.parse(JSON.stringify(rows))[1].auto_increment;
                res.render('empleado_mostrador/addPedido', {cliente: data_cliente, modelos: {},no_pedido: no_pedido});
           }); 
        }
    })
    .post(isLoggedIn, function(req, res){
        console.log('POST /pedido/add/');
        // console.log(req.body);
        // console.log(req.body.pedido);
        var pedido = req.body.pedido
        var modelos_pedido = req.body.modelos_pedido;
        connectionMySql.query('INSERT INTO pedidos (fecha, total, anticipo, especificaciones, estado_disenio, id_cliente, estado_pedido, fecha_entrega) VALUES (?, ?, ?, ?, ?, ?, ?,?)', [pedido.fecha, pedido.total, pedido.anticipo, pedido.especificaciones,'pendiente',pedido.cliente_id,'pendiente', pedido.fecha_entrega], function(error, result, fields){
            if(error){
                console.log(error.message);
                res.status(400).send('#');
            }else{
                // result.insertId
                for(var i = 0; i < modelos_pedido.length; i++){
                    console.log(modelos_pedido[i]);
                    connectionMySql.query('INSERT INTO modelos_pedido (no_pedido, id_modelo, cantidad, detalles, subtotal) VALUES (?, ?, ?, ?, ?)', [result.insertId,modelos_pedido[i].Modelo,modelos_pedido[i].Cantidad, modelos_pedido[i].Detalles, modelos_pedido[i].Subtotal], function(error, result2, fields){
                        if(error){
                            console.log(error.message);
                            res.status(400).send('#');
                        }
                    });
                }
                console.log('Generando nota de venta: notas_venta/'+result.insertId+'.pdf ....');
                // // Generar nota de venta
                getCliente(pedido.cliente_id, function(err, data_cliente){
                    notaVenta.generarNota({no_pedido: result.insertId, pedido: pedido, modelos_pedido: modelos_pedido, cliente: data_cliente});
                    res.status(200).send('/redirect_user/');
                });
                 // res.status(200).send('/nota_venta/'+pedido.no_pedido+'/')
            }
        });
    });

router.get('/nota_venta/:no_pedido/', function(req, res){
    // view pdf
    var ruta_nota_venta = '/notas_venta/'+req.params.no_pedido+'.pdf'
    console.log(__dirname + ruta_nota_venta);
    fs.readFile(__dirname + ruta_nota_venta , function (err,data){
        res.contentType("application/pdf");
        res.send(data);
    });
});

// Lista para indicar terminado de pedido
router.route('/pedidos/pendientes/:no_pedido?/')
    .get(isLoggedIn, function(req, res){
        console.log(' GET /pedidos/pendientes/');
        if(req.params.no_pedido){
            console.log(req.params.no_pedido);
            if(!(/^[1-9](\d)*$/.test(req.params.no_pedido))){
                console.log('out')
                connectionMySql.query('select *from pedidos join clientes on pedidos.id_cliente=clientes.id_cliente where clientes.nombre like "%'+req.params.no_pedido+'%" LIMIT 20;',function(error, rows){
                    var pedidos = JSON.parse(JSON.stringify(rows));
                    console.log(pedidos)
                    res.render('empleado_mostrador/pedidosPendientes',{pedidos: pedidos});
                }); 
            }else{
                console.log('in')
                connectionMySql.query("select *from pedidos join clientes on pedidos.id_cliente=clientes.id_cliente where pedidos.no_pedido=? LIMIT 20;",[req.params.no_pedido],function(error, rows){
                    var pedidos = JSON.parse(JSON.stringify(rows));
                    console.log(pedidos)
                    res.render('empleado_mostrador/pedidosPendientes',{pedidos: pedidos});
                });
            }
        }else{
            connectionMySql.query("select *from pedidos join clientes on pedidos.id_cliente=clientes.id_cliente where pedidos.estado_pedido != 'entregado' order by no_pedido desc, estado_pedido LIMIT 20",function(error, rows){
                var pedidos = JSON.parse(JSON.stringify(rows));
                console.log(pedidos)
                res.render('empleado_mostrador/pedidosPendientes',{pedidos: pedidos});
            });
        }
    })
    .put(isLoggedIn, function(req, res){
        console.log('PUT /pedidos/pendientes/');
        console.log(req.params.no_pedido)
        connectionMySql.query("update pedidos set estado_pedido='terminado' where no_pedido=?",[req.params.no_pedido],function(error, result, fields){
            if(error)
                console.log(error);
            else
                res.status(200).send('/pedidos/pendientes/');
        });
    });

// Lista que cambia los pedidos a entregados 
router.route('/pedidos/entregas/:valor?/')
    .get(isLoggedIn, function(req, res){
        console.log('/pedidos/entregas/');
        if(req.params.valor){
            if((/^[1-9](\d)*$/.test(req.params.valor))){
                connectionMySql.query('select *from pedidos join clientes on pedidos.id_cliente=clientes.id_cliente where pedidos.no_pedido=? and pedidos.estado_pedido!="pendiente";',[req.params.valor],function(error, rows){
                    if(error){
                        console.log(error.message);
                    }else{
                       var pedidos = JSON.parse(JSON.stringify(rows));
                       res.render('administrador/entregaPedidos',{pedidos: pedidos});
                    }
                });
            }else{
                connectionMySql.query('select *from pedidos join clientes on pedidos.id_cliente=clientes.id_cliente where clientes.nombre like "%'+req.params.valor+'%" and pedidos.estado_pedido!="pendiente";', function(error, rows){
                    if(error){
                        console.log(error.message);
                    }else{
                       var pedidos = JSON.parse(JSON.stringify(rows));
                       res.render('administrador/entregaPedidos',{pedidos: pedidos});
                    }
                });
            }
            
        }else{
            connectionMySql.query("select *from pedidos join clientes on pedidos.id_cliente=clientes.id_cliente where pedidos.estado_pedido!='pendiente' limit 30;",function(error, rows){
                var pedidos = JSON.parse(JSON.stringify(rows));
                // console.log(pedidos)
                res.render('administrador/entregaPedidos',{pedidos: pedidos});
            });
        }
    })
    .put(isLoggedIn, function(req, res){
        console.log('PUT /pedidos/entregas/:valor?/');
        console.log(req.params.valor)
        connectionMySql.query("update pedidos set estado_pedido = 'entregado' where no_pedido=?;",[req.params.valor],function(error, result, fields){
            if(error)
                console.log(error);
            else
                res.status(200).send('/pedidos/entregas/');
        });
    })
    .post(isLoggedIn, function(req, res){
        console.log('POST /pedidos/entregas/:valor?/');
        connectionMySql.query('select * from clientes where id_cliente=?',[req.body.id_cliente], function(error,rows){
            if(error){
                console.log(error);
            }else{
                var cliente = JSON.parse(JSON.stringify(rows))[0];
                console.log(cliente);
                if(cliente.rfc == '' | cliente.curp =='' | cliente.calle == '' | cliente.no_ext == null | cliente.colonia == '' | cliente.codigo_postal == null | cliente.localidad == '' | cliente.municipio == '' | cliente.estado == '' ){
                    res.render('administrador/clienteEdit', {cliente: cliente});
                }else{
                    connectionMySql.query('update pedidos set factura=? where no_pedido=?',[false, req.body.no_pedido], function(error,result,fields){
                        if(error){
                            console.log(error.message);
                        }else{
                            res.redirect('/pedidos/entregas/');
                        }
                    });
                }
            }
        });
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
                        connectionMySql.query("select auto_increment from information_schema.TABLES WHERE  table_name like 'pedidos';",function(error, rows){
                            var no_pedido = JSON.parse(JSON.stringify(rows))[1].auto_increment;
                            console.log(no_pedido);
                            res.render('empleado_mostrador/addPedido', {cliente: json, modelos: {},no_pedido: no_pedido});
                       });
                    }
                });
            }
        });
    })
    .put(isLoggedIn, function(req, res){
        console.log('PUT /cliente/add');
        var data = [req.body.telefono, req.body.correo, req.body.rfc, req.body.curp, req.body.calle, req.body.no_ext || null, req.body.no_int || null,req.body.colonia, req.body.codigo_postal || null, req.body.localidad, req.body.municipio, req.body.estado,req.body.id_cliente];
         connectionMySql.query('update clientes set telefono=?, correo=?, rfc=?, curp=?, calle=?, no_ext=?, no_int=?, colonia=?, codigo_postal=?, localidad=?, municipio=?, estado=? where id_cliente=?', data, function(error,result,fields){
            if(error){
                console.log(error.message);
            }else{
                res.redirect('/pedidos/entregas/');
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
            connectionMySql.query("select auto_increment from information_schema.TABLES WHERE  table_name like 'pedidos';",function(error, rows){
                var no_pedido = JSON.parse(JSON.stringify(rows))[1].auto_increment;
                console.log(no_pedido);
                res.render('empleado_mostrador/addPedido', {cliente: json, modelos: {},no_pedido: no_pedido});
           });
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

// Lista de diseños a realizar
router.get('/disenios/lista/:filtro?', isLoggedIn, function(req, res){
    console.log('GET /disenios/lista/');
    if(req.params.filtro){
        console.log(req.params.filtro);
        if((/^[1-9](\d)*$/.test(req.params.filtro))){
            console.log('out');
            connectionMySql.query('select *from pedidos where no_pedido=?;', [req.params.filtro], function(error, rows){
                if(error) console.log(error)
                var pedidos = JSON.parse(JSON.stringify(rows));
                // console.log(pedidos)
                res.render('diseniador/listaDisenios',{pedidos: pedidos});
            });
        }else{
            console.log('select *from pedidos where estado_disenio like "%'+req.params.filtro+'%";')
            connectionMySql.query('select *from pedidos where estado_disenio like "%'+req.params.filtro+'%";',function(error, rows){
                if(error) console.log(error)
                var pedidos = JSON.parse(JSON.stringify(rows));
                // console.log(pedidos)
                res.render('diseniador/listaDisenios', {pedidos: pedidos});
            });
        }
    }else{
        connectionMySql.query("select *from pedidos order by estado_disenio desc limit 20;",function(error, rows){
            var pedidos = JSON.parse(JSON.stringify(rows));
            // console.log(pedidos)
            res.render('diseniador/listaDisenios',{pedidos: pedidos});
        });
    }
    
});
// Especificaciones disenio con el numero de pedido
router.route('/disenio/:no_pedido/:estado?')
    .get( isLoggedIn, function(req, res){
        console.log('GET /disenio/:no_pedido');
        connectionMySql.query("select *from pedidos where no_pedido=?",[req.params.no_pedido],function(error, rows){
            if(error) console.log(error)
            var pedido = JSON.parse(JSON.stringify(rows));
            connectionMySql.query("select *from modelos_pedido where no_pedido=?",[req.params.no_pedido],function(error, rows){
                var modelos_pedido = JSON.parse(JSON.stringify(rows));
                // console.log('->'+pedido)
                res.render('diseniador/especificacionesDisenio', {pedido: pedido[0], modelos_pedido: modelos_pedido});
            });
        });
        
    })
    .put(isLoggedIn, function(req, res){
        console.log('PUT /disenio/:no_pedido');
        connectionMySql.query("update pedidos set estado_disenio=? where no_pedido=?",[req.params.estado, req.params.no_pedido],function(error, result, fields){
            if(error)
                console.log(error);
            else
                res.status(200).send('/disenio/'+req.params.no_pedido);
        });
    });

// Lista de facturas a realizar
router.get('/factura/lista/', isLoggedIn, function(req, res){
    // mandar las factoruas de la base de datos
    // select *from pedidos where factura=0;
    console.log('GET /factura/lista/');
    connectionMySql.query("select *from pedidos where factura=0;",function(error, rows){
        var pedidos = JSON.parse(JSON.stringify(rows));
        res.render('contador/listaFacturas', {pedidos: pedidos});
    });
    

});
router.route('/factura/:no_pedido?/')
    .get( isLoggedIn, function(req, res){
        console.log('GET /factura/:no_pedido');
        connectionMySql.query("select * from pedidos join clientes on pedidos.id_cliente = clientes.id_cliente where no_pedido=?;",[req.params.no_pedido],function(error, rows){
            var pedido = JSON.parse(JSON.stringify(rows));
            connectionMySql.query("select * from modelos_pedido join modelos on modelos_pedido.id_modelo = modelos.id_modelo where no_pedido=?;",[req.params.no_pedido], function(error,rows){
                var modelos_pedido = JSON.parse(JSON.stringify(rows));
                // console.log("this-<"+modelos_pedido)
                res.render('contador/informacionPedido', {pedido: pedido[0], modelos_pedido: modelos_pedido});
            });
        }); 
    })
    .post(isLoggedIn, upload_factura.single('factura_pdf'), function(req, res){
        console.log('POST /factura/:no_pedido');
        console.log(req.file);
        var data = [req.file.filename,true, req.body.no_pedido];
        connectionMySql.query('update pedidos set filename_factura=?, factura=? where no_pedido=?', data, function(error){
            if(error){
                console.log(error.message);
            }else{
                res.redirect('/factura/'+req.body.no_pedido+'/');
            }
        });
    });
router.get('/factura_pdf/:filename/', isLoggedIn, function(req, res){
    console.log('GET /factura_pdf/:filename/');
    var ruta_nota_venta = __dirname+'/facturas/'+req.params.filename;
    fs.readFile(ruta_nota_venta , function (err,data){
        res.contentType("application/pdf");
        res.send(data);
    });
});

router.get('/send/factura_pdf/:filename/:correo/:no_pedido', isLoggedIn, function(req, res){
    console.log('GET /send/factura_pdf/:filename/:correo/:no_pedido');
    console.log(req.params);
    var mailOptions = {
        from: 'versatil.invitaciones@gmail.com', // sender address
        to: req.params.correo, // list of receivers
        subject: 'Factura de venta Versatil', // Subject line
        text: 'Gracias por su preferencia .l.',
        attachments: [{filename: 'factura'+req.params.no_pedido+'.pdf',
        path: './facturas/'+req.params.filename,
        contentType: 'application/pdf'}]
    };
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            console.log(error);
        }else{
            console.log('Message sent: ' + info.response);
            res.redirect('/redirect_user');
        };
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
