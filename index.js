import express from 'express';
import bodyParser from 'body-parser';
import router from './routes';

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json())
app.use('/', router);

/*app.post('/api/callback/approve', async (req, res) => {

    const data = req.body;
    if(data.type === "confirmation" && data.group_id === groupId) {
        res.send(responseString);
    }
    if(data.type === "message_new") {
        const text = JSON.stringify(data.object.text);
        if(hasKey(appealPhrases, text)) {
            if(hasCommand(commands[0], text)) {
                if(lastWordIsNotCommand(commands[0], text)) {
                    await requsetToVkAPI(new Parameters('messages.send', `Вероятность составляет: ${randomNumber(0, 100)}%`, JSON.stringify(data.object.peer_id) - 2000000000));
                }
                else {
                    await requsetToVkAPI(new Parameters('messages.send', `Введите событие, вероятность которого нужно определить`, JSON.stringify(data.object.peer_id) - 2000000000));
                }  
            }
            if(hasCommand(commands[1], text)) {
                await requsetToVkAPI(new Parameters('messages.send', `Номер чата: ${JSON.stringify(data.object.peer_id) - 2000000000}`, JSON.stringify(data.object.peer_id) - 2000000000));
            }
        }
        res.status(200).send('ok')
    }

    console.log(req.body);
});*/

app.get('/', (req, res) => {
    res.json("API works");
});

app.listen(port, () => {
    console.log(`Server is up on port ${port}`);
});

