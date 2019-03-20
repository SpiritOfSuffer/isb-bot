import express from 'express';
import bodyParser from 'body-parser';
import request from 'request';

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json())

app.post('/api/callback/approve', (req, res) => {

    if(req.body.type === "confirmation" && req.body.group_id === 179812415) {
        res.send('4d0fcb53');
    }
    if(req.body.type === "message_new") {
        let text = req.body.text;
        console.log(text);
        /*if(text.indexOf("настя инфа") !== -1) {
            const message = `Вероятность составляет: ${randomInteger(0, 100)}%`;
            const url = `https://api.vk.com/method/messages.send?chat_id=2&message=${message}&random_id=${Math.ceil(Math.random()*100000000)}&access_token=c5f0c9862f1d6e72d2296b710eb62914730426c11bcd3ea2e787d81d1eb6f329173aebca67228e32ec96f&v=5.92`;
            request.post(encodeURI(url));
        }*/
        res.status(200).send('ok')
    }

    //console.log(req.body);
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

