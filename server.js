const express = require('express');
const routes = require('./routes');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 5001; // my mac is running something system-related on 5000

app.use('/', routes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
