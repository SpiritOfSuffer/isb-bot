import { accessToken } from "../../config";

export default class VkParameters {
    constructor(method, id, message) {
        this.method = method;
        this.token = accessToken;
        this.version= '5.92';
        if(method === 'messages.send') {
            this.params = `chat_id=${id}&message=${message}&random_id=${Math.ceil(Math.random() * 100000000)}`;
        }
        if(method === 'messages.getConversationMembers') {
            this.params = `peer_id=${id}`;
        }
        if(method === 'users.get') {
            this.params = `user_ids=${id}`;
        }
    }
}
