var mysql = require('mysql');

var connection = mysql.createConnection({
	host: '127.0.0.1',
    user: 'root',
    password: 'sistemas123',
    database: 'ventas_versatil',
    port: 3306
});
var LocalStrategy = require('passport-local').Strategy;

module.exports = function(passport){
	passport.serializeUser(function(user, done) {
        done(null, user.id);
    });
    passport.deserializeUser(function(id, done) {
		connection.query("select * from users where id = "+id,function(err,rows){	
			done(err, rows[0]);
		});
    });

    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'usuario',
        passwordField : 'contraseña',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, usuario, contraseña, done) { // callback with email and password from our form
    	 // console.log('El usuario es: ' + usuario);
         connection.query("SELECT * FROM `users` WHERE `usuario` = '" + usuario + "'",function(err,rows){
			if (err)
                return done(err);
			 if (!rows.length) {
                return done(null, false, req.flash('loginMessage', 'No se encuentra el usuario.')); // req.flash is the way to set flashdata using connect-flash
            } 
			
			// if the user is found but the password is wrong
            if (!( rows[0].contraseña == contraseña))
                return done(null, false, req.flash('loginMessage', 'Contraseña incorrecta.')); // create the loginMessage and save it to session as flashdata
			
            // all is well, return successful user
            return done(null, rows[0]);			
		
		});
    }));
}
