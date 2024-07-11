import DBClient from '../utils/db';

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
}

module.exports = UsersController;