//SETUP
const express = require("express");
const port = process.env.PORT || 3001;
const app = express();
const bodyParser = require("body-parser");

app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

const server = require("http").createServer(app);

//ROUTES
app.use('/dance', require('./dance'))

//launch
server.listen(port, function() {
  console.log(`Server listening on port ${port}!`);
});
