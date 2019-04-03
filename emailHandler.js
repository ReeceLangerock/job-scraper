'use strict';
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;
const texts = require('./randomText');

function buildEmailBody(data) {
	try {
		const randomGreeting = texts.greetings[Math.floor(Math.random() * texts.greetings.length)];
		const randomEnding = texts.endings[Math.floor(Math.random() * texts.endings.length)];
		let emailBody = `${randomGreeting}`;

		data.forEach(post => {
			const title = `<div style = "border: 1px solid #C9DDFF; background: #E1ECFF; padding: 0 10px; margin-top: 10px; border-radius: 3px;"><h2>${
				post.title
			}</h2>`;
			const link = `<a href = ${post.link} style = "font-size: 16px">Link To Job</a>`;
			const datePosted = `<p><b>Posted:</b> ${post.datePosted}</p>`;
			const desc = `<br/><div>${post.description}</div></div>`;
			emailBody += `${title}${datePosted}${link}${desc}`;
		});
		emailBody += `<br/>${randomEnding}</div>`;
		return emailBody;
	} catch (e) {
		console.log(e);
	}
}

// async..await is not allowed in global scope, must use a wrapper
async function sendEmail(data) {
	const oauth2Client = new OAuth2(
		process.env.OAUTH_CLIENT_ID,
		process.env.OAUTH_SECRET, // Client Secret
		'https://developers.google.com/oauthplayground' // Redirect URL
	);

	oauth2Client.setCredentials({
		refresh_token: process.env.OAUTH_REFRESH_TOKEN
	});
	const tokens = await oauth2Client.refreshAccessToken();
	const accessToken = tokens.credentials.access_token;
	// Generate test SMTP service account from ethereal.email
	// Only needed if you don't have a real mail account for testing

	// create reusable transporter object using the default SMTP transport
	let transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			type: 'OAuth2',
			clientId: process.env.OAUTH_CLIENT_ID,
			clientSecret: process.env.OAUTH_SECRET,
			refreshToken: process.env.OAUTH_REFRESH_TOKEN,
			accessToken: accessToken,
			user: process.env.GMAIL_USER, // generated ethereal user
			pass: process.env.GMAIL_PASSWORD // generated ethereal password
		}
	});

	// setup email data with unicode symbols

	const emailBody = buildEmailBody(data);
	const job = data.length > 1 ? 'Jobs' : 'Job';
	let mailOptions = {
		from: `"Reece's Robot Minions" <foo@example.com>`, // sender address
		to: process.env.EMAIL_TO, // list of receivers
		subject: `${data.length} New ${job} Posted To K12 Jobspot`, // Subject line
		text: 'Hello world?', // plain text body
		html: emailBody // html body
	};

	// send mail with defined transport object
	let info = await transporter.sendMail(mailOptions);

	console.log('Message sent: %s', info.messageId);
	// Preview only available when sending through an Ethereal account
	console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

	// Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
	// Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}
module.exports = sendEmail;
