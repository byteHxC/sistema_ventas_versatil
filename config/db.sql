create database ventas_versatil;

create table users(id int auto_increment primary key, usuario varchar(20) not null, contraseña varchar(12) not null);
	insert users (usuario,contraseña) values ('administrador','sistemas123');