function buscarCatalogo(){
		var filtro = document.getElementById('filtro').value || 'modelo';
		var valor = document.getElementById('valor').value || '';
		if(valor.length == 0){
			// bootbox.alert({
			//     message: "Introduzca un valor para la busqueda",
			//     size: 'small'
			// });
			alert('Introduzca un valor para la busqueda');
			document.getElementById('link').setAttribute('href','/catalogo_selected');
		}else{
			document.getElementById('link').setAttribute('href','/catalogo_selected/'+filtro+'/'+valor)
		}
}
function agregarModelos(){
	var modelos = document.getElementsByName('agregar');
	var array = ['null']
	for (var i = 0; i < modelos.length; i++) {
		if(modelos[i].checked == true){
			array.push(modelos[i].value)
		}
	}

	document.getElementById('linkAgregar').setAttribute('href','/modelosSeleccionados/'+array||null);
}
