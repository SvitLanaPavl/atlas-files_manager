const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
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

      if (parentId !== 0) {
        const parentFile = await DBClient.client.db().collection('files').findOne({ _id: mongo.ObjectID(parentId) });
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
          userID: new mongo.ObjectId(mongoUserId),
          name,
          type,
          isPublic,
          parentId,
          localPath,
        });
      } else {
        newFile = await DBClient.client.db().collection('files').insertOne({
          userID: new mongo.ObjectId(mongoUserId),
          name,
          type,
          isPublic,
          parentId,
        });
      }

      return res.status(201).send({
        id: newFile.insertedId, userId: mongoUserId, name, type, isPublic, parentId,
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getShow(req, res) {
    console.log('in getShow');
    const token = req.headers['x-token'];
    console.log(`token: ${token}`);
    const key = `auth_${token}`;
    const userId = await RedisClient.get(key);
    if (!userId) {
      return res.status(401).send({error: 'Unauthorized'});
    }

    const { id } = req.params;
    const fileId = new mongo.ObjectId(id);
    const fileData = await DBClient.client.db().collection('files').findOne({ _id: fileId });
    if (!fileData) {
      return res.status(404).send({ error: 'Not found' });
    }
    if (userId !== fileData.userId.toString()) {
      return res.status(404).send({ error: 'Not found' });
    }
    const returnedFileData = {
      id: fileData._id,
      userId: fileData.userId,
      name: fileData.name,
      type: fileData.type,
      isPublic: fileData.isPublic,
      parentId: fileData.parentId
    };
    return res.send(returnedFileData);
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    const key = `auth_${token}`;
    const mongoUserId = await RedisClient.get(key);
    const { parentId = 0, page = 0 } = req.query;
    const user = await DBClient.client.db().collection('users').findOne({ _id: new mongo.ObjectId(mongoUserId) });
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    } else {
      const userfilter = [
        { $match: { parentId: parentId, userID: user._id } },
        { $skip: page * 20 },
        { $limit: 20 },
      ];
      const fileDocuments = await DBClient.client.db().collection('files').aggregate(userfilter).toArray();
      res.status(200).json(fileDocuments);
    }
  }
}

module.exports = FilesController;
