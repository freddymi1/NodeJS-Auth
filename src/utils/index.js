const Datauri = require('datauri');

const path = require('path');

const cloudinary = require ('../configs/cloudinary');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);


function uploader(req){
    return new Promise((resolve, reject) => {
        const dUri = new Datauri();

        let image = dUri.format(path.extname(req.file.originalname).toString(), req.file.buffer);

        cloudinary.uploader.upload(image.conent, (err, url) => {
            if (err) return reject(err)
            return resolve(url);
        })
    })
}

function sendEmail(mailOptions) {
    return new Promise((resolve, reject) => {
        sgMail.send(mailOptions, (error, result) => {
            if (error) return reject(error)
            return resolve(result);
        })
    })
}

module.export = { uploader, sendEmail }