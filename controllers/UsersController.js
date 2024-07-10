import DBClient from '../utils/db';

const sha1 = require('sha1');

class UsersController {
  static async postNew(req, res) {
    console.log('0. Checking for email and password in request body');
    const { email, password } = req.body;

    console.log('1. Checking for email and password in request body');
    if (!email) {
      console.log('1.1. Email missing, sending error');
      return res.status(400).json({ error: 'Missing email' });
    } else if (!password) {
      console.log('1.2. Password missing, sending error');
      return res.status(400).json({ error: 'Missing password' });
    }

    console.log('2. Checking for existing user with email');
    const usr = await DBClient.db.collection('users').findOne({ email });
    if (usr) {
      console.log('2.1. User already exists, sending error');
      return res.status(400).json({ error: 'Already exist' });
    }

    console.log('3. Hashing password');
    const hashedPass = sha1(password);

    console.log('4. Creating new user object');
    const newUser = { email, password: hashedPass };

    console.log('5. Inserting new user into database');
    const result = await DBClient.db.collection('users').insertOne(newUser);

    console.log('6. Sending success response with user ID');
    return res.status(201).json({ id: result.insertedId, email });
  }
}

module.exports = UsersController;
