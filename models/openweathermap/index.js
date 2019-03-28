import { openWeatherMapToken } from "../../config";

export default class OpenWeaherMapParameters {
    constructor(city) {
        this.token = openWeatherMapToken;
        this.city = city;
    }
}