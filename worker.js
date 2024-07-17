const Bull = require('bull');
const imageThumbnail = require('image-thumbnail');
const DBClient = require('./utils/db');
const mongo = require('mongodb');

const fileQueue = new Bull('fileQueue');