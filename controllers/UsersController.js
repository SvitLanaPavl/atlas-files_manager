import RedisClient from '../utils/redis';
import DBClient from '../utils/db';
const mongo = require('mongodb');

const sha1 = require('sha1');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    } else if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    const usr = await DBClient.client.db().collection('users').findOne({ email });
    if (usr) {
      return res.status(400).json({ error: 'Already exist' });
    }

    const hashedPass = sha1(password);
    const newUser = { email, password: hashedPass };
    const result = await DBClient.client.db().collection('users').insertOne(newUser);
    return res.status(201).json({ id: result.insertedId, email });
  }

  static async getMe(req, res) {
    const token = req.headers['x-token'];
    const key = `auth_${token}`;
    const redis_user = await RedisClient.get(key);
    if (!redis_user) res.status(401).json({ error: 'Unauthorized' });
    else {
      const dtbase = await DBClient.client.db();
      const colection = dtbase.collection('users');
      colection.findOne({ _id: new mongo.ObjectId(redis_user)}, (err, user) => {
        res.status(200).json({ id: user._id, email: user.email });
      });
    }
  }
}

module.exports = UsersController;
