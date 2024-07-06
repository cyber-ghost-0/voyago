var nodemailer = require('nodemailer');

module.exports = (email, letter) => {
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'anas.sahar.ahmad@gmail.com',
            pass: 'ombc lpfz ezrk tcay'
        }
    });

    var mailOptions = {
        from: '3mkk',
        to: email,
        subject: 'Sending Email using Node.js',
        text: letter
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            // console.log(error);
        } else {
            // console.log('Email sent: ' + info.response);
        }
    });
}