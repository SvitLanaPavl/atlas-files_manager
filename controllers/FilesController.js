const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const dbClient = require('../utils/db');

class FilesController {
  static async postUpload(req, res) {
    try {
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
      const user = await dbClient.nbUsers.findOne({ _id: req.user.id });
      if (!user) {
        return res.status(401). json({ error: 'Unauthorized' });
      }
      if (parentId !== 0) {
        const parentFile = await dbClient.connection.collection('files').findOne({ _id: parentId });
        if (!parentFile) {
          return res.status(400).json({ error: 'Parent not found' });
        }
        if (parentFile.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }
      let localPath = null;
      if (type !== 'folder') {
        const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }
        const fileUUID = uuidv4();
        localPath = path.join(folderPath, fileUUID);
        fs.writeFileSync(localPath, Buffer.from(data, 'base64'));
      }
      const newFile = {
        userID: user._id,
        name,
        type,
        isPublic,
        parentId,
        localPath,
      };
      const result = await dbClient.connection.collection('files').insertOne(newFile);
      res.status(201).json(result.ops[0]);
      console.log('Request Body:', req.body);
      console.log('User ID:', req.user.id);

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = FilesController;
