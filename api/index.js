import request from 'request-promise';

export async function requestToVkAPI(parameters) {
    const url = `https://api.vk.com/method/${parameters.method}?${parameters.params}&access_token=${parameters.token}&v=${parameters.version}`;
    console.log(url);
    try {
        return await request.post(encodeURI(url));
    }
    catch(e) {
        console.error(e);
    }
}

export async function requestToOpenWeatherMapAPI(parameters) {
    const url = `http://api.openweathermap.org/data/2.5/weather?q=${parameters.city}&units=metric&APPID=${parameters.token}`;
    try {
        return await request.post(encodeURI(url));
    }
    catch(e) {
        console.error(e);
    }
}
