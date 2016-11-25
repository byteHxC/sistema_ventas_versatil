create database ventas_versatil;

create table users(id int auto_increment primary key, usuario varchar(20) not null, contraseña varchar(12) not null);
insert users (usuario,contraseña) values ('empleado_mostrador','sistemas123');
insert users (usuario,contraseña) values ('diseñador','sistemas123');
insert users (usuario,contraseña) values ('administrador','sistemas123');
insert users (usuario,contraseña) values ('contador','sistemas123');

create table clientes(id_cliente int auto_increment primary key,nombre varchar(60) not null, telefono varchar(15) not null, coreeo varchar(360) not null, rfc varchar(13), curp varchar(18), calle varchar(40), no_ext int, no_int int, colonia varchar(40), codigo_postal int, localidad varchar(40), municipio varchar(40), estado varchar(40));

create table modelos(id_modelo int auto_increment primary key, precio_unitario float not null, ruta_imagen varchar(50), descripcion varchar(500));

create table pedidos(no_folio int auto_increment primary key, fecha date not null, total float not null, anticipo float not null, especificaciones varchar(1000), estado varchar(20), ruta_nota_venta varchar(40), id_cliente int, foreign key(id_cliente) references clientes(id_cliente));

create table modelos_pedido(no_folio int, id_modelo int, cantidad int not null,detalles varchar(300), primary key(no_folio, id_modelo),foreign key(no_folio) references pedidos(no_folio), foreign key(id_modelo) references modelos(id_modelo));

create table facturacion(id_factura int auto_increment primary key, no_folio_pedido int, ruta_factura varchar(40), foreign key(no_folio_pedido) references pedidos(no_folio));


