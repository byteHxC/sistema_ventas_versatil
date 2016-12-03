// var nodemailer = require('nodemailer');
// var transporter = nodemailer.createTransport({
//         service: 'Gmail',
//         auth: {
//             user: '00fblanco@gmail.com', // Your email id
//             pass: '#%gmailHxC' // Your password
//         }
//     });

// var mailOptions = {
//     from: '00fblanco@yoyopo.com', // sender address
//     to: 'francisco_bco@hotmail.com', // list of receivers
//     subject: 'Email Example', // Subject line
//     text: 'putaa other'
// };

// transporter.sendMail(mailOptions, function(error, info){
//     if(error){
//         console.log(error);
//     }else{
//         console.log('Message sent: ' + info.response);
//     };
// });

var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'versatil.invitaciones@gmail.com', // Your email id
            pass: 'versatil.123' // Your password
        }
    });

var mailOptions = {
    from: 'versatil.invitaciones@gmail.com', // sender address
    to: 'francisco_bco@hotmail.com', // list of receivers
    subject: 'Email Example', // Subject line
    text: 'factura',
    attachments: [{filename: 'file.pdf',
    path: './facturas/7d8fb61cfcf696f13a14210968da181b',
    contentType: 'application/pdf'}]
};

transporter.sendMail(mailOptions, function(error, info){
    if(error){
        console.log(error);
    }else{
        console.log('Message sent: ' + info.response);
    };
});