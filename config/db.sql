create database ventas_versatil;

create table users(id int auto_increment primary key, usuario varchar(20) not null, contraseña varchar(12) not null);
insert users (usuario,contraseña) values ('empleado_mostrador','sistemas123');
insert users (usuario,contraseña) values ('diseñador','sistemas123');
insert users (usuario,contraseña) values ('administrador','sistemas123');
insert users (usuario,contraseña) values ('contador','sistemas123');
update users set contraseña = 'test';

create table clientes(id_cliente int auto_increment primary key,nombre varchar(60) not null, telefono varchar(15) not null, correo varchar(360) not null, rfc varchar(13), curp varchar(18), calle varchar(40), no_ext int, no_int int, colonia varchar(40), codigo_postal int, localidad varchar(40), municipio varchar(40), estado varchar(40));

create table modelos(id_modelo int auto_increment primary key, precio_unitario float not null, ruta_imagen varchar(50), descripcion varchar(500));

create table pedidos(no_pedido int auto_increment primary key, fecha date not null,fecha_entrega date not null, total float not null, anticipo float not null, especificaciones varchar(1000), estado_pedido varchar(20), estado_disenio varchar(20), id_cliente int, foreign key(id_cliente) references clientes(id_cliente));

create table modelos_pedido(no_pedido int, id_modelo int, cantidad int not null,detalles varchar(500), subtotal float, primary key(no_pedido, id_modelo),foreign key(no_pedido) references pedidos(no_pedido), foreign key(id_modelo) references modelos(id_modelo));

create table facturas(id_factura int auto_increment primary key, no_pedido int, factura_pdf tinyint(1),foreign key(no_pedido) references pedidos(no_pedido));


