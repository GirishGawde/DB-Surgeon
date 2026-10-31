const nodemailer=require("nodemailer");
require("dotenv").config();

const transporter=nodemailer.createTransport({
    service:"gmail",
    auth:{
        type:"OAuth2",
        user:process.env.EMAIL,
        clientId:process.env.CLIENT_ID,
        clientSecret:process.env.CLIENT_SECRET,
        refreshToken:process.env.REFRESH_TOKEN
    },
    // Without timeouts a hung SMTP connection blocks the calling request
    // (register / forgot password) for minutes.
    connectionTimeout:10000,
    greetingTimeout:10000,
    socketTimeout:15000
});

async function sendmail(to,subject,text,html){
    try{
        const info=await transporter.sendMail({
            from:process.env.EMAIL,
            to,
            subject,
            text,
            html
        });
        console.log("EMAIL SENT:",info.messageId);
        return info;
    }catch(err){
        console.error("EMAIL ERROR:",err);
        throw err;
    }
}

module.exports=sendmail;