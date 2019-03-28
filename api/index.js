import request from 'request-promise';
import translate from 'translate-api';

export async function requestToVkAPI(parameters) {
    const url = `https://api.vk.com/method/${parameters.method}?${parameters.params}&access_token=${parameters.token}&v=${parameters.version}`;
    try {
        return await request.post(encodeURI(url));
    }
    catch(e) {
        console.error(e);
    }
}

export async function requestToOpenWeatherMapAPI(parameters) {
    //const city = await translateToEnglish(parameters.city)
    const url = `http://api.openweathermap.org/data/2.5/weather?q=${parameters.city}&units=metric&APPID=${parameters.token}`;
    try {
        return await request.post(encodeURI(url));
    }
    catch(e) {
        console.error(e);
    }
}

export async function translateToEnglish(word) {
    return await translate.getText(word,{to: 'en'});
}