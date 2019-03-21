import express from 'express';
import bodyParser from 'body-parser';
import request from 'request';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(cors());

app.post('/api/callback/approve', (req, res) => {

    const data = req.body;
    if(data.type === "confirmation" && data.group_id === 179812415) {
        res.send('3a4e1fdb');//по необходимости поменять строку(было - 4d0fcb53) и id группы(было 179812415)
    }
    if(data.type === "message_new") {
        const text = JSON.stringify(data.object.text);
        const chat_id = JSON.stringify(data.object.peer_id) - 2000000000;
        if(text.indexOf("настя инфа") !== -1) {
            const message = `Вероятность составляет: ${randomInteger(0, 100)}%`;
            const url = `https://api.vk.com/method/messages.send?chat_id=${chat_id}&message=${message}&random_id=${Math.ceil(Math.random()*100000000)}&access_token=7478c7761bf43d803b6d4a97746bae5283ee34a97444e3d088f925cca1b209246da843541375806a8cc49&v=5.92`;//поменять токен
            //old token: c5f0c9862f1d6e72d2296b710eb62914730426c11bcd3ea2e787d81d1eb6f329173aebca67228e32ec96f
            request.post(encodeURI(url));
        }
        res.status(200).send('ok')
    }
    console.log(data);
});

app.get('/api/callback/approve', (req, res) => {
    res.json("API works");
});

function randomInteger(min, max) {
    var rand = min - 0.5 + Math.random() * (max - min + 1)
    rand = Math.round(rand);
    return rand;
  }

app.listen(port, () => {
    console.log(`Server is up on port ${port}`);
});

