import mongodb from 'mongodb';
import { DB } from '../config';
 
export async function loadData(collection) {
    const client = await mongodb.MongoClient
    .connect(DB,
     {useNewUrlParser: true});

     return client.db('isb-bot-production').collection(collection);
}

export async function dropCollection(collection) {
    const client = await mongodb.MongoClient
    .connect(DB,
     {useNewUrlParser: true});
     client.db('isb-bot-production').collection(collection).drop();
     console.log(`Collection ${collection} was dropped`);
}

export async function insertNickname(nicknames, name, userId, nickname, chatId) {
    await nicknames.insertOne({
        name: name,
        createdAt: new Date(),
        user_id: userId,
        nickname: nickname,
        chat_id: chatId
    });
}

export async function insertUser(users, id, chatId) {
    await users.insertOne({
        user_id: id,
        giveNicknameCount: 1,
        chat_id: chatId
    });
}