//SETUP
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const port = process.env.PORT || 3001;
const app = express();
const bodyParser = require('body-parser');

app.use(
	bodyParser.urlencoded({
		extended: true
	})
);

const server = require('http').createServer(app);

//ROUTES
app.use('/dance', require('./dance'));
const MONGO_URI = `mongodb://${process.env.MONGO_USER}:${
	process.env.MONGO_PASSWORD
}@ds163940.mlab.com:63940/counselorjobs`;
if (!MONGO_URI) {
	throw new Error('You must provide a MongoLab URI');
}

mongoose.Promise = global.Promise;
mongoose.connect(MONGO_URI, { useNewUrlParser: true });
mongoose.connection
	.once('open', () => console.log('Connected to MongoLab instance.'))
	.on('error', error => console.log('Error connecting to MongoLab:', error));

//launch
server.listen(port, function() {
	console.log(`Server listening on port ${port}!`);
});
