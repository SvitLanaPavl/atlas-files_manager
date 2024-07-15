const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
//const dbClient = require('../utils/db');
import DBClient from '../utils/db';
const RedisClient = require('../utils/redis');
const mongo = require('mongodb');

class FilesController {
  static async postUpload(req, res) {
    try {
      const token = req.headers['x-token'];
      const mongoUserId = await RedisClient.get(`auth_${token}`);
      if (!mongoUserId) return res.status(401).json({ error: 'Unauthorized' });
      
      const { name, type, parentId = 0, isPublic = false, data } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Missing name' });
      }
      if (!type || !['folder', 'file', 'image'].includes(type)) {
        return res.status(400).json({ error: 'Missing type' });
      }
      if (type !== 'folder' && !data) {
        return res.status(400).json({ error: 'Missing data' });
      }
      // const user = await dbClient.nbUsers.findOne({ _id: req.user.id });
      // if (!user) {
      //   return res.status(401). json({ error: 'Unauthorized' });
      // }
      if (parentId !== 0) {
        const parentFile = await DBClient.connection.collection('files').findOne({ _id: mongo.ObjectID(parentId) });
        if (!parentFile) {
          return res.status(400).json({ error: 'Parent not found' });
        }
        if (parentFile.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }
      let localPath = null;
      let newFile;
      if (type !== 'folder') {
        const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }
        const fileUUID = uuidv4();
        localPath = path.join(folderPath, fileUUID);
        fs.writeFileSync(localPath, Buffer.from(data, 'base64').toString('utf-8'));
        newFile = await DBClient.client.db().collection('files').insertOne({
          userID: new mongo.ObjectID(mongoUserId),
          name,
          type,
          isPublic,
          parentId,
          localPath,
        });
      } else {
        newFile = await DBClient.client.db().collection('files').insertOne({
          userID: new mongo.ObjectID(mongoUserId),
          name,
          type,
          isPublic,
          parentId,
        });
      }
      //const result = await DBClient.connection.collection('files').insertOne(newFile);
      //res.status(201).json(result.ops[0]);
      return res.status(201).send({
        id: newFile.insertedId, userId: mongoUserId, name, type, isPublic, parentId,
      });
      //console.log('Request Body:', req.body);
      //console.log('User ID:', req.user.id);

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = FilesController;
