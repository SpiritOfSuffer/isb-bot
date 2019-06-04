import express from 'express';
import { groupId, responseString, accessToken, appealPhrases, commands, BotConfig, nicknames } from '../config';
import { requestToVkAPI, requestToOpenWeatherMapAPI } from '../api';
import { hasKey, hasCommand, randomNumber, lastWordIsNotCommand } from '../helpers';
import VkParameters from '../models/vk';
import OpenWeatherMapParameters from '../models/openweathermap';
import cheerio from 'cheerio';
import request from 'request';
import mongodb from 'mongodb';
import { loadData, insertNickname, insertUser } from '../services';
import fs from 'fs';

const router = express.Router();

router.post('/api/callback/approve', async (req, res) => {

    const data = req.body;
    if(data.type === "message_new" && data.object.action) {
        if(data.object.action.type === "chat_invite_user") {
            fs.readFile('greetings.json', 'utf8', function (err, data) {
                if (err) throw err; // we'll not consider error handling for now
                var obj = JSON.parse(data);
                console.log(data);
            });

            const chatId = JSON.stringify(data.object.peer_id) - 2000000000;
            const invitedUserId = data.object.action.member_id;
            await requestToVkAPI(new VkParameters('users.get', invitedUserId))
            .then(async res => {
                let data = JSON.parse(res);
                console.log(data);
                let invitedUserName = data.response[0].first_name;
                await requestToVkAPI(new VkParameters('messages.send', chatId, `Привет-привет, @id${invitedUserId}(${invitedUserName})`));
            });
        }
    }

    if(data.type === "confirmation" && data.group_id === groupId) {
        res.send(responseString);
    }
    if(data.type === "message_new") {
        const text = JSON.stringify(data.object.text);
        const from_id = JSON.stringify(data.object.from_id);
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

            if(hasCommand(commands[5], text)) {
                if(lastWordIsNotCommand(commands[5], text)) {
                    const word = text.split(' ').splice(-1).join().slice(0, -1);
                    console.log(word);
                    try {
                        request(encodeURI(`https://rifmus.net/rifma/${word}`), (error, response, body) => {
                            if(error) {
                                console.error(error);
                            }
                             let rhymes = cheerio.load(body)(".multicolumn").text().replace(/\s+/g, ' ').split(' ');
                             rhymes.length <= 1 ? 
                             requestToVkAPI(new VkParameters('messages.send', chatId, `${word} – рифма не найдена`)):
                             requestToVkAPI(new VkParameters('messages.send', chatId, `${word} – ${rhymes[randomNumber(0, rhymes.length - 2)]}`));
                        });
                    }
                    catch(e) {
                        console.error(e);
                    }
                    
                }
                else {
                    await requestToVkAPI(new VkParameters('messages.send', chatId, 'Вы не указали рифмуемое слово.'));
                }
            }
            if(hasCommand(commands[6], text)) {
                if(lastWordIsNotCommand(commands[6], text)) {
                    let user = text.split(' ').splice(-2);//.splice(-1).join().slice(0, -1);
                    if(user[0] != commands[6].split(' ').splice(-1)) {
                        console.log(`${user[0]} !== ${commands[6].split(' ').splice(-1)}`);
                        user = user.join(' ').slice(0, -1);
                    }
                    else {
                        user = user.splice(-1).join().slice(0, -1);
                        if(user.startsWith('[')) {
                            user = user.slice(user.indexOf('|') + 1, user.indexOf(']'));
                        }
                    }
                    console.log(user);
                    let usersCollection = await loadData('users');
                    let nicknamesCollection = await loadData('nicknames');                
                    await requestToVkAPI(new VkParameters('messages.getConversationMembers', 2000000000 + chatId ))
                        .then(async res => {
                            let data = JSON.parse(res);
                            let users = [];
                            data.response.profiles.forEach(item => {
                                if(item.first_name === user && item.id != from_id || item.last_name === user && item.id != from_id || 
                                   item.first_name === user.split(' ')[0] && item.last_name === user.split(' ')[1] && item.id != from_id ||
                                   item.first_name === user.split(' ')[0] && item.last_name.startsWith(user.split(' ')[1]) && item.id != from_id ||
                                   item.id === user.slice(3, user.indexOf('|')) && item.first_name === user.slice(user.indexOf('|') + 1, user.indexOf(']')) && item.id != from_id) {

                                    console.log(item.id + ":" + from_id);
                                    users.push(item);
                                }
                            });
                            console.log(users);
                            if(users.length === 1) {
                                let nickname = nicknames[randomNumber(0, nicknames.length - 1)];  
                                usersCollection.findOne({ $and: [ { user_id: from_id }, { chat_id : chatId } ] }, async (err, user) => {
                                    
                                    try {
                                        if(user) {
                                            if(user.giveNicknameCount === 3) {
                                                await requestToVkAPI(new VkParameters('messages.send', chatId, `Лимит выдачи кличек. Попробуйте завтра.`));
                                            }
                                            else {
                                                nicknamesCollection.findOne({ $and: [ { user_id: users[0].id }, { chat_id : chatId } ] }, async (err, user) => {
                                                    try {
                                                        if(user) {
                                                            await requestToVkAPI(new VkParameters('messages.send', chatId, `У пользователя уже есть кличка`));
                                                        }
                                                        else {
                                                            usersCollection.update( 
                                                                { $and: [ { user_id: from_id }, { chat_id : chatId } ] }, 
                                                                { $inc : { giveNicknameCount: 1 }});
                                                            await insertNickname(nicknamesCollection, `${users[0].first_name} ${users[0].last_name}`, users[0].id, nickname, chatId);
                                                            let config = new BotConfig(users[0].first_name, nickname);
                                                            await requestToVkAPI(new VkParameters('messages.send', chatId, config.answers[randomNumber(0, config.answers.length - 1)]));
                                                        }
                                                    }
                                                    catch(e) {
                                                        console.log(e);
                                                    }
                                                });
                                            }
                                        }
                                        else {
                                            nicknamesCollection.findOne({ $and: [ { user_id: users[0].id }, { chat_id : chatId } ] }, async (err, user) => {
                                                try {
                                                    if(user) {
                                                        await requestToVkAPI(new VkParameters('messages.send', chatId, `У пользователя уже есть кличка`));
                                                    }
                                                    else {
                                                        await insertUser(usersCollection, from_id, chatId);
                                                        await insertNickname(nicknamesCollection, `${users[0].first_name} ${users[0].last_name}`, users[0].id, nickname, chatId);
                                                        let config = new BotConfig(users[0].first_name, nickname);
                                                        await requestToVkAPI(new VkParameters('messages.send', chatId, config.answers[randomNumber(0, config.answers.length - 1)]));
                                                    }
                                                }
                                                catch(e) {
                                                    console.log(e);                                                        
                                                }
                                            });
                                        }
                                    }
                                    catch(e) {
                                        console.log(e);
                                    }
                                });
                                
                            }
                            else if(users.length > 1) {
                                let userForNickname = users[randomNumber(0, users.length - 1)];
                                let nickname = nicknames[randomNumber(0, nicknames.length - 1)];
                                usersCollection.findOne({ $and: [ { user_id: from_id }, { chat_id : chatId } ] }, async (err, user) => {
                                    try {
                                        if(user) {
                                            if(user.giveNicknameCount === 3) {
                                                await requestToVkAPI(new VkParameters('messages.send', chatId, `Лимит выдачи кличек. Попробуйте завтра.`));
                                            }
                                            else {
                                                nicknamesCollection.findOne({ $and: [ { user_id: userForNickname.id }, { chat_id : chatId } ] }, async (err, user) => {
                                                    try {
                                                        if(user) {
                                                            await requestToVkAPI(new VkParameters('messages.send', chatId, `У пользователя уже есть кличка`));
                                                        }
                                                        else {
                                                            usersCollection.update( 
                                                                { $and: [ { user_id: from_id }, { chat_id : chatId } ] }, 
                                                                { $inc : { giveNicknameCount: 1 }});
                                                            await insertNickname(nicknamesCollection, `${userForNickname.first_name} ${userForNickname.last_name}`, userForNickname.id, nickname, chatId);
                                                            let config = new BotConfig(userForNickname.first_name, nickname);
                                                            await requestToVkAPI(new VkParameters('messages.send', chatId, config.answers[randomNumber(0, config.answers.length - 1)]));
                                                        }
                                                    }
                                                    catch(e) {
                                                        console.log(e);
                                                    }
                                                });
                                            }
                                        }
                                        else {
                                            nicknamesCollection.findOne({ $and: [ { user_id: userForNickname.id }, { chat_id : chatId } ] }, async (err, user) => {
                                                try {
                                                    if(user) {
                                                        await requestToVkAPI(new VkParameters('messages.send', chatId, `У пользователя уже есть кличка`));
                                                    }
                                                    else {
                                                        await insertUser(usersCollection, from_id, chatId);
                                                        await insertNickname(nicknamesCollection, `${userForNickname.first_name} ${userForNickname.last_name}`, userForNickname.id, nickname, chatId);
                                                        let config = new BotConfig(userForNickname.first_name, nickname);
                                                        await requestToVkAPI(new VkParameters('messages.send', chatId, config.answers[randomNumber(0, config.answers.length - 1)]));
                                                    }
                                                }
                                                catch(e) {
                                                    console.log(e);                                                        
                                                }
                                            });
                                        }
                                    }
                                    catch(e) {
                                        console.log(e);
                                    }
                                });
                                    
                            }
                            else {
                                await requestToVkAPI(new VkParameters('messages.send', chatId, `Пользователя нет в чате, либо вы пытались дать кличку самому себе.`));
                            }
                        })
                        .catch(err => console.log(err));
                }
                else {
                    await requestToVkAPI(new VkParameters('messages.send', chatId, 'Ты не указал кому выдать кличку.'));
                }
            }

            if(hasCommand(commands[7], text)) {
                let message = 'Клички пользователей чата:\n';
                await loadData('nicknames')
                    .then(async data => {
                        let users =  await data.find( { chat_id : chatId }).sort( { createdAt: -1 }).toArray();
                        //console.log(users);
                        if(users.length !== 0) {
                            users.forEach((user) => {
                                message += `${user.name} - "${user.nickname}"\n`;
                            });

                            await requestToVkAPI(new VkParameters('messages.send', chatId, message));
                        }
                        else {
                            await requestToVkAPI(new VkParameters('messages.send', chatId, 'В этом чате еще ни у кого нет клички'));
                        }
                    })
                    .catch(e => {
                        console.error(e);
                    });
            }
            
            if(hasCommand(commands[8], text)) {
                const greeting = text.split(' ').splice(2).join(' ');
                let obj = {
                    table: []
                 };

                fs.readFile('../greetings.json', 'utf8', function readFileCallback(err, data){
                    if (err){
                        console.log(err);
                    } else {
                    obj = JSON.parse(data); //now it an object
                    obj.table.push({chat_id: chatId, greeting: greeting}); //add some data
                    json = JSON.stringify(obj); //convert it back to json
                    fs.writeFile('../greetings.json', json, 'utf8', callback); // write it back 
                }});

                await requestToVkAPI(new VkParameters('messages.send', chatId, 'Приветствие добавлено'));

            }
        }
        res.status(200).send('ok')
    }
    console.log(req.body);
});

export default router;