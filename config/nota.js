var pdfmake = require('pdfmake');

var fonts = {
	Roboto: {
		normal: __dirname + '/../public/PDFmake/fonts/arial.ttf',		
		bold: __dirname + '/../public/PDFmake/fonts/arialbd.ttf'
	}
};

var PdfPrinter = require(__dirname + '/../node_modules/pdfmake/src/printer');
var printer = new PdfPrinter(fonts);
var fs = require('fs');

module.exports = {
	generarNota: function(data){
		console.log('generarNota..')
		var body = [];
		body.push([{ text: 'ID_MODELO', style : 'columnas'},{ text: 'CANTIDAD', style : 'columnas'},{ text: 'DESCRIPCION', style : 'columnas'},{ text: 'PRECIO UNITARIO', style : 'columnas'},{ text: 'SUBTOTAL', style : 'columnas'}])
		for(var i = 0; i < data.modelos_pedido.length; i++){
			body.push([{text: data.modelos_pedido[i].Modelo, style: 'normal'},{ text: data.modelos_pedido[i].Cantidad, style: 'normal'},{ text: data.modelos_pedido[i].Detalles, style: 'normal'},{ text: data.modelos_pedido[i].Precio_unitario, style: 'normal'},{ text: data.modelos_pedido[i].Subtotal, style: 'normal'}]); 
		}
		var body_string = JSON.stringify(body);

		var docDefinition = {
		content: [
			{
				image: __dirname + '/../public/PDFmake/images/nota.png',
				width: 500
			},
			{ 
				text: '\n\nCHILPANCINGO, GRO., '+data.pedido.fecha, 
				style: 'header' 
			},
			{ 
				text: '\n\nNo: pedido: ' + data.no_pedido, 
				style: 'header' 
			},
			{ 
				text: '\nNOMBRE: ' + data.cliente.nombre, 
				style: 'header' 
			},
			{ 
				text: '\nCORREO: ' + data.cliente.correo , 
				style: 'header' 
			},
			{ 
				text: '\nTELÉFONO: ' + data.cliente.telefono + '\n\n\n', 
				style: 'header' 
			},
			{
	         table: {
	        
	        headerRows: 1,
	        widths: [ 'auto', 'auto','*', 'auto', 'auto' ],
	        body: JSON.parse(body_string)
	      }
	    },
	    	{text: '\nTOTAL:  $ '+data.pedido.total,
	    	bold: true,
		    color: '#9A0102',
	    	alignment: 'right'
	    	 }, 

	    	  {text: '\nANTICIPO:  $ '+data.pedido.anticipo,
	    		bold: true,
		    color: '#9A0102',
	    	alignment: 'right'
	    	 } ,   
	    	{text: '\nFecha de entrega: '+data.pedido.fecha_entrega,
	    	bold: true,
		    color: '#9A0102'
	    	},


		],
		styles: {
			header: {
				fontSize: 13,
				bold: true,
				color: '#9A0102',
			},
			columnas: {
				fontSize: 13,
				bold: true,
				color: '#9A0102',
				alignment: 'center' 

			},
			normal: {
				fontSize: 13,			
				color: 'black',
				alignment: 'center' 	
			}
		}
		};

		var pdfDoc = printer.createPdfKitDocument(docDefinition);
		pdfDoc.pipe(fs.createWriteStream('notas_venta/'+data.no_pedido+'.pdf'));
		pdfDoc.end();
	}
}
