import { Server } from "socket.io";
import { GameServer } from "./GameServer";

export class ChatServer {
    io: Server;
    time: Date;

    constructor(gameServer: GameServer) {
        this.io = gameServer.io;
        this.time = new Date();
    }

    async handleClientMessage(chatMessage: ChatMessage) {
        this.time = new Date();
        const formattedMessage = `<${chatMessage.username}>: ${chatMessage.message}`;
        console.log(this.time + " " + formattedMessage);
        this.io.emit(`serverMessage`, {
            type: "chat",
            message: formattedMessage,
        });
    }

    async handleConsoleMessage(consoleMessage: ChatMessage) {
        this.time = new Date();
        // TODO: check for privileges here!!!

        // TODO: main logic
    }

    async _sendChatMessageToAll(message: Message) {
        const formattedMessage = `<CONSOLE>: ${message.message}`;
        this.io.emit(`serverMessage`, {
            type: "chat",
            message: formattedMessage,
        });
    }

    async _sendConsoleMessageToAll(message: Message) {
        const formattedMessage = `<CONSOLE>: ${message}`;
        this.io.emit(`serverMessage`, {
            type: "chat",
            message: formattedMessage,
        });
    }
}

export interface Message {
    message: string;
}

export interface ChatMessage extends Message {
    username: string;
}

export interface ServerMessage extends Message {
    username: string;
}
