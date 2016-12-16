function validarCliente(id_cliente){
	var nombre = document.getElementById('nombre');
	if(nombre.value.length == 0 || nombre.value==null){
		// "/seleccionar_modelos/#{cliente.id_cliente}/:filtro?/:valor?/
	
		swal({
			title: "Error",
			text: "Antes de agregar modelos, agregue al cliente.",
			type: "error",
			confirmButtonText: "Aceptar"
		});
		document.getElementById('link').setAttribute('href','#');
	}else{
		document.getElementById('link').setAttribute('href','/seleccionar_modelos/'+id_cliente+'/:filtro?/:valor?/');
	}
}
function calcularTotales(){
	var error_messages = "";
	var tabla = document.getElementById('modelos_pedido');
	var data_table = parseTable(tabla);
	var total = 0;
	console.log(data_table)
	if(data_table.length == 0)
		error_messages += "- El pedido debe tener modelo(s) registrado(s). \n";
	for (var i = 0; i < data_table.length; i++) {
		total += parseInt(data_table[i].Precio_unitario) * parseInt(data_table[i].Cantidad);
		document.getElementById('modelo-'+data_table[i].Modelo_id).innerHTML=(parseInt(data_table[i].Precio_unitario) * parseInt(data_table[i].Cantidad)).toString();
		if( !(/^[1-9](\d)*$/.test(data_table[i].Cantidad)) ){
			error_messages += "- La columna de cantidad de la tabla de modelos, debe contener un valor entero. \n"
		}
	}
	if(error_messages == ""){
		document.getElementById('total').value=total.toString();
	}else{
		swal({
			title: "Error",
			text: error_messages,
			type: "error",
			confirmButtonText: "Aceptar"
		});
	}
}

function registrarPedido(){
	var error_messages = "";
	var tabla = document.getElementById('modelos_pedido');
	var data_table = parseTable(tabla);
	if(data_table.length == 0)
		error_messages += "- El pedido debe tener modelo(s) registrado(s). \n";
	for (var i = 0; i < data_table.length; i++) {
		if( !(/^[1-9](\d)*$/.test(data_table[i].Cantidad)) ){
			error_messages += "- La columna de cantidad de la tabla de modelos, debe contener un valor entero. \n"
		}
	}
	var data_pedido = {
		no_pedido: document.getElementById('no_pedido').value,
		fecha: document.getElementById('fecha').value,
		cliente_id: document.getElementById('cliente_id').value,
		total: document.getElementById('total').value,
		anticipo: document.getElementById('anticipo').value,
		especificaciones: document.getElementById('especificaciones').value,
		fecha_entrega: document.getElementById('datepicker').value
	}

	if(!(/^\d{4}\/\d{2}\/\d{2}$/.test(data_pedido.fecha_entrega)) ){
		error_messages += "- La fecha de entrega debe tener formato yyyy/mm/dd. \n";
	}
	if(data_pedido.cliente_id.length == 0){
		error_messages += "- Seleccione un cliente. \n";
	}
	if(data_pedido.total.length == 0){
		error_messages += "- El total debe contener un valor numerico. \n";
	}else if(!(/^\d+(.\d)*$/.test(data_pedido.total)) ){
		error_messages += "- El total debe ser numerico. \n";
	}
	// alert(data_pedido.anticipo)
	if(data_pedido.anticipo.length == 0){
		error_messages += "- El anticipo debe contener un valor numerico. \n";
	}else if(!(/^\d+(.\d)*$/.test(data_pedido.anticipo)) ){
		error_messages += "- El anticipo debe ser numerico. \n";
	}
	// alert(parseFloat(parseFloat(data_pedido.total)/2));	
	if(parseFloat(data_pedido.anticipo) > parseFloat(data_pedido.total)){
		error_messages +="- El anticipo deber ser menor al total.\n";
	}else if(parseFloat(data_pedido.anticipo) < parseFloat(parseFloat(data_pedido.total)/2)){
		error_messages +="- El anticipo deber ser mayor al 50 % del total.\n";
	}
	

	if(data_pedido.especificaciones.length == 0){
		error_messages += "- Debe ingresar las especificaciones del pedido. \n";
	}


	if(error_messages == ""){
		var data = {pedido: data_pedido, modelos_pedido: data_table};
		var redirectWindow = window.open('/nota_venta/'+data_pedido.no_pedido+'/', 'popup');
		$.ajax({
		    url: "/pedido/add/",
		    type: "POST",
		    data: JSON.stringify(data),
		    contentType: "application/json",
		    success: function(response) {
		    	// alert(response)
		    	if (response) {
		    		swal({
						title: "Pedido agregado.",
						text: "...",
						type: "success",
						confirmButtonText: "Aceptar"

					}, function(){
						window.location.href = response;
			        	redirectWindow.location;
					});
		        	
		        }
		    },
		    complete: function(xhr, statusText){
    			// alert(xhr.status);
    			if(xhr.status == 400){
					document.getElementById('message').innerHTML="Verificar formulario";
					document.getElementById('alert').style.display = 'block';	       
    			}
    			// alert('/nota_venta/'+data.pedido.no_pedido+'/');
    		}
		});

	}else{
		document.getElementById('message').innerHTML=error_messages;
		document.getElementById('alert').style.display = 'block';
	}

}

// $(document).ready(function(){
// 	alert('jquery')
// });