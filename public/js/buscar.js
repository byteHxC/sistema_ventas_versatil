function buscarCatalogo(id_cliente){
	// alert(id_cliente)
	var filtro = document.getElementById('filtro').value || 'modelo';
	var valor = document.getElementById('valor').value || '';
	if(valor.length == 0){
		swal({
			title: "Error",
			text: "Introduzca un valor para la busqueda.",
			type: "error",
			confirmButtonText: "Aceptar",
			},function(){
				// document.getElementById('link').setAttribute('href','/seleccionar_modelos/'+id_cliente);
			});
		// document.getElementById('link').setAttribute('href','');
	}else{
		document.getElementById('link').setAttribute('href','/seleccionar_modelos/'+id_cliente+'/'+filtro+'/'+valor)
		
	}
}
function agregarModelos(id_cliente){
	// alert('Agregara a este ->'+id_cliente)
	var modelos = document.getElementsByName('agregar');
	var array = ['null']
	for (var i = 0; i < modelos.length; i++) {
		if(modelos[i].checked == true){
			array.push(modelos[i].value)
		}
	}
	document.getElementById('linkAgregar').setAttribute('href','/modelos_seleccionados/'+id_cliente+'/'+array||null);
}

