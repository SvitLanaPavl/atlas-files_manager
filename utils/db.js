const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 27017;
const database = process.env.DB_DATABASE || 'files_manager';
const url = `mongodb://${host}:${port}`;

class DBClient {
  constructor() {
    this.client = new MongoClient(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    this.client.connect()
    .then(() => {
      this.db = this.client.db(database);
      console.log('Successfully connected');
    })
    .catch((err) => {
      console.error('Failed to connect', err);
    });
  }

  isAlive() {
    return this.client && this.client.isConnected();
  }

  async nbUsers() {
    try {
      return await this.db.collection('users').countDocuments();
    } catch (err) {
      console.error('Error counting users', err);
      return 0;
    }
  }

  async nbFiles() {
    try {
      return await this.db.collection('files').countDocuments();
    } catch (err) {
      console.error('Error counting files', err);
      return 0;
    }
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
