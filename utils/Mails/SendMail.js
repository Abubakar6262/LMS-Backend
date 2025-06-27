const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');

const sendMail = async (to, subject, templateName, data) => {
    try {
        // Create a transporter object using SMTP
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            service: process.env.SMTP_SERVICE,
            auth: {
                user: process.env.SMPT_MAIL,
                pass: process.env.SMTP_PASS,
            },
        });

        // Load the email template
        const templatePath = path.join(__dirname, '../Mails', templateName);

        // render the template with ejs
        const html = await ejs.renderFile(templatePath, data);

        // Set up email data
        const mailOptions = {
            from: process.env.SMPT_MAIL,    // sender address
            to,                             // list of receivers
            subject,                        // Subject line
            html,                           // html body
        };

        // Send mail with defined transport object
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending email:', error);
        throw error; // Re-throw the error for further handling if needed
    }
}
module.exports = sendMail;