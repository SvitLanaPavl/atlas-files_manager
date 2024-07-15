import RedisClient from '../utils/redis';
import DBClient from '../utils/db';
import { v4 as uuid4 } from 'uuid';

const sha1 = require('sha1');
console.log(sha1("toto1234!"));

class AuthController {
    static async getConnect(req, res) {
        console.log('in getConnect func');
        const [authType, b64UserPass] = req.headers.authorization.split(' ');

        if (authType !== 'Basic') res.status(500).json({ error: 'Invalid auth type' });
        else {
            console.log('authType is Basic');
            const decode_bs64 = (base64_str) => {
                const buff = Buffer.from(base64_str, 'base64');
                return buff.toString('utf-8');
            };
        
            const [email, passwd] = decode_bs64(b64UserPass).split(':', 2);
            const databs = await DBClient.connection;
            const user = await databs.collection('users').findOne({
                email,
                password: sha1(passwd)
            });
            console.log('Querying for user:', { email, password: sha1(passwd) });
            console.log('User found:', user);
            if (!user) res.status(401).json({ error: 'Unauthorized' });
            else {
                const token = uuid4();
                const key = `auth_${token}`;

                await RedisClient.set(key, user._id.toString(), 24 * 60 * 60);
                res.status(200).json({ token });
            }
        }
    }
    static async getDisconnect(req, res) {
        const token = req.headers['x-token'];
        const key = `auth_${token}`;

        const user = await RedisClient.get(key);
        if (!user) res.status(401).json({ error: 'Unauthorized' });
        else {
            await RedisClient.del(key);
            res.status(204).send();
        }
    }
}

module.exports = AuthController;
