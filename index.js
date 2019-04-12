import express from 'express';
import bodyParser from 'body-parser';
import router from './routes';
import mongoose from 'mongoose';
import { DB } from './config';
import { dropCollection } from './services';
import schedule from 'node-schedule'

const app = express();
const port = process.env.PORT || 5000;

mongoose.connect( DB, { useNewUrlParser: true }).then(
    () => { console.log('Connected to the database') },
    (err) => { console.log(`Can not connect to the database: ${err}`) }
);

schedule.scheduleJob('0 0 * * *', async () => { 
    await dropCollection('users');
    await dropCollection('nicknames');
 })

app.use(bodyParser.json())
app.use('/', router);


app.get('/', (req, res) => {
    res.json("API works");
});

app.listen(port, () => {
    console.log(`Server is up on port ${port}`);
});

