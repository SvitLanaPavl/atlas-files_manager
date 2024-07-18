const express = require('express');
const { router } = require('./routes/index');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

dotenv.config();

const app = express();
app.use(bodyParser.json());
const port = process.env.PORT; //|| 5001; my mac is running something system-related on 5000

app.use('/', router);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
