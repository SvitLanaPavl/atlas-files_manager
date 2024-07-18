const Bull = require('bull');
const imageThumbnail = require('image-thumbnail');
const DBClient = require('./utils/db');
const mongo = require('mongodb');

const fileQueue = new Bull('fileQueue');
console.log('in worker.js');

fileQueue.process(async (job) => {
    console.log('in fileQueue process');
    const { fileId, userId } = job.data;

    if (!fileId) throw new Error('Missing fileId');
    if (!userId) throw new Error('Missing userId');

    const mongoFile = await DBClient.client.db().collection(files).findOne({ _id: mongo.ObjectId(fileId), userID });
    if (!mongoFile) throw new Error('File not found');

    const thumbnailWidth = [500, 250, 100];
    for (const size of thumbnailWidth) {
        const thumbnail = await imageThumbnail(mongoFile.localPath, { width: size, height: size });
        const imageName = `${fileId}_${size}.jpg`;
        await DBClient.client.db().collection('users').updateOne({ _id: mongo.ObjectId(userId) }, { $set: { [`${thumbnail}.${size}`]: imageName } });
    }
});

module.exports = fileQueue;
