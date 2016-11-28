var jsdom = require("jsdom").jsdom;
jsdom.env("", function(err, window) {
    if (err) {
        console.error(err);
        return;
    }
    global.$ = require("jquery")(window);
});

function validarCliente(id_cliente){
	var nombre = document.getElementById('nombre');
	if(nombre.value.length > 1){
		// "/seleccionar_modelos/#{cliente.id_cliente}/:filtro?/:valor?/
		document.getElementById('link').setAttribute('href','/seleccionar_modelos/'+id_cliente+'/:filtro?/:valor?/');
	}else{
		alert('Primero agregue el cliente');
		document.getElementById('link').setAttribute('href','#');
	}
}

function registrarPedido(){
	var tabla = document.getElementById('modelos_pedido');
	var data = parseTable(tabla);
	document.getElementById('jsontable').value=data;
}