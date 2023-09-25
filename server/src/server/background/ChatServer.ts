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

        const message = consoleMessage.message.split(" ");

        switch(message[0]) {
            case "/i":
                switch(message[1]) {
                    case "e":
                        const entity = await gameServer.getEntityByUUID(message[2]);
                        this._sendConsoleMessageToAll(JSON.stringify(entity));
                        break;
                    case "p":
                        const player = await gameServer.getPlayerByUsername(message[2]);
                        this._sendConsoleMessageToAll(JSON.stringify(player));
                        break;
                }
                break;
            case "/c":
                switch(message[1]) {
                    case "e": 
                        const player = await gameServer.getPlayerByUsername(consoleMessage.username);
                        if(player?.currentMap) {
                            gameServer.spacemaps[player.currentMap].spawnAlien(message[2], {
                                x: (0.5 - Math.random()) * 10,
                                y: (0.5 - Math.random()) * 10,
                            });
                        }
                        break;
                }
                break;
            case "/d":
                switch(message[1]) {
                    case "e":
                        const player = await gameServer.getPlayerByUsername(consoleMessage.username);
                        if(player?.currentMap) {
                            gameServer.spacemaps[player.currentMap].deleteAlienByuuid(message[2]);
                        }
                        break;
                }
                break;
        }

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
