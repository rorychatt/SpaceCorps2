import { Server } from "socket.io";
import { GameServer } from "./GameServer";
import { gameServer } from "../main";
import { Spacemap } from "./Spacemap";

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
        let entity;

        // gameServer.spacemaps["map"].spawnAlien("1231");
        // to do command /d e, /c e

        switch(message[0]) {
            case "/i":
                switch(message[1]) {
                    case "e":
                        entity = await gameServer.getEntityByUUID(message[2]);
                        console.log(entity);
                        break;
                    case "p":
                        entity = await gameServer.getPlayerByUsername(message[2]);
                        console.log(entity);
                        break;
                }
                break;
            case "/c":
                switch(message[1]) {
                    case "e": 
                        gameServer.spacemaps["mapName"].spawnAlien(message[2], {
                            x: (0.5 - Math.random()) * 10,
                            y: (0.5 - Math.random()) * 10,
                        });
                        break;
                }
                break;
            case "/d":
                switch(message[1]) {
                    case "e":
                        gameServer.spacemaps["mapName"].deleteAlienByuuid(message[2]);
                        break;
                }
                break;
        }

        this._sendConsoleMessageToAll(consoleMessage.message);

        // TODO: main logic
    }

    async _sendChatMessageToAll(message: string) {
        const formattedMessage = `<CONSOLE>: ${message}`;
        this.io.emit(`serverMessage`, {
            type: "chat",
            message: formattedMessage,
        });
    }

    async _sendConsoleMessageToAll(message: string) {
        const formattedMessage = `<CONSOLE>: ${message}`;
        this.io.emit(`serverMessage`, {
            type: "console",
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
