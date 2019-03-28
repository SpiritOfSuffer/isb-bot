import express from 'express';
import { groupId, responseString, accessToken, appealPhrases, commands } from '../config';
import { requestToVkAPI, requestToOpenWeatherMapAPI } from '../api';
import { hasKey, hasCommand, randomNumber, lastWordIsNotCommand } from '../helpers';
import VkParameters from '../models/vk';
import OpenWeatherMapParameters from '../models/openweathermap';

const router = express.Router();

router.post('/api/callback/approve', async (req, res) => {

    const data = req.body;
    if(data.type === "confirmation" && data.group_id === groupId) {
        res.send(responseString);
    }
    if(data.type === "message_new") {
        const text = JSON.stringify(data.object.text);
        const chatId = JSON.stringify(data.object.peer_id) - 2000000000;
        if(hasKey(appealPhrases, text)) {
            if(hasCommand(commands[0], text)) {
                if(lastWordIsNotCommand(commands[0], text)) {
                    await requestToVkAPI(new VkParameters('messages.send', chatId, `Вероятность составляет: ${randomNumber(0, 100)}%`));
                }
                else {
                    await requestToVkAPI(new VkParameters('messages.send', chatId, `Введите событие, вероятность которого нужно определить`));
                }  
            }
            if(hasCommand(commands[1], text)) {
                await requestToVkAPI(new VkParameters('messages.send', chatId, `Номер чата: ${chatId}`));
            }

            if(hasCommand(commands[2], text)) {
                await requestToVkAPI(new VkParameters('messages.getConversationMembers', 2000000000 + chatId))
                    .then(async res => {
                        let data = JSON.parse(res);
                        let randomMember = randomNumber(0, data.response.profiles.length - 1);
                        await requestToVkAPI(new VkParameters('messages.send', chatId, `Я думаю это – @id${data.response.profiles[randomMember].id}(${data.response.profiles[randomMember].first_name})`))
                    })
                    .catch(err => console.log(err));
            }

            if(hasCommand(commands[3], text)) {
                await requestToVkAPI(new VkParameters('messages.getConversationMembers', 2000000000 + chatId ))
                    .then(async res => {
                        let data = JSON.parse(res);
                        let users = '';
                        data.response.profiles.forEach(item => {
                            if(item.online === 1) {
                                users += `@id${item.id}(${item.first_name}), `;
                            }
                        });
                        await requestToVkAPI(new VkParameters('messages.send', chatId, users + "вы были призваны для привлечения внимания!"));
                    })
                    .catch(err => console.log(err));
            }

            if(hasCommand(commands[4], text)) {
                if(lastWordIsNotCommand(commands[4], text)) {
                    const city = text.split(' ').splice(-1).join().slice(0, -1);
                    console.log(city)
                    await requestToOpenWeatherMapAPI(new OpenWeatherMapParameters(city))
                        .then(async res => {
                            let data = JSON.parse(res);
                            let msg = `Погода в городе ${city}\nТемпература: ${data.main.temp}°\nСкорость ветра: ${data.wind.speed} м/c\nВлажность: ${data.main.humidity}%`;
                            await requestToVkAPI(new VkParameters('messages.send', chatId, msg));
                        })
                        .catch(err => console.log(err)); 
                }
                else {
                    await requestToVkAPI(new VkParameters('messages.send', chatId, `Введите город`));
                }
            }
        }
        res.status(200).send('ok')
    }

    console.log(req.body);
});

export default router;