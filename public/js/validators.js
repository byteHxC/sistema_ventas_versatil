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
	var data_table = parseTable(tabla);
	var data_pedido = {
		no_pedido: document.getElementById('no_pedido').value.value,
		fecha: document.getElementById('fecha').value,
		cliente_id: document.getElementById('cliente_id').value,
		total: document.getElementById('total').value,
		anticipo: document.getElementById('anticipo').value,
		especificaciones: document.getElementById('especificaciones').value,
		fecha_entrega: document.getElementById('fecha_entrega').value
	}
	var data = {pedido: data_pedido, modelos_pedido: data_table};
	$.ajax({
	    url: "/pedido/add/",
	    type: "POST",
	    data: JSON.stringify(data),
	    contentType: "application/json"
	});

	// console.log(data_table);
	// console.log(data_pedido);
}

// $(document).ready(function(){
// 	alert('jquery')
// });