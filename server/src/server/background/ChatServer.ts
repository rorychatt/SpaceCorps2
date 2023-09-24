import { Server } from "socket.io";
import { GameServer } from "./GameServer";
import { gameServer } from "../main";

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

        /*
        /i e ${uuid} : показывает информацию о конкретной сущности по ее uuid.

        /i p ${name} : показывает информацию о конкретном игроке по его имени.

        /c e ${name} : создать 1 объект по определенному имени на текущей карте игрока.

        /d e ${uuid} : удалить объект по заданному uuid
        */

        const message = consoleMessage.message.split(" ");

        switch(message[0]) {
            case "/i":
                switch(message[1]) {
                    case "e":
                        gameServer.getEntityByUUID(message[2]);
                        break;
                    case "p":
                        gameServer.getPlayerByUsername(message[2]);
                        break;
                }
                break;
            case "/c":
                switch(message[1]) {
                    case "e": 
                        
                        break;
                }
                break;
            case "/d":
                switch(message[1]) {
                    case "e":
                        
                        break;
                }
                break;
        }

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
