var mysql = require('mysql');

module.exports = mysql.createConnection({
	host: '127.0.0.1',
    user: 'root',
    password: 'sistemas123',
    database: 'ventas_versatil',
    port: 3306
});
