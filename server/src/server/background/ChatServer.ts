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
        for (let i = 0; i < gameServer.admins.length; i++) {
            if (consoleMessage.username == gameServer.admins[i]) {
                const message = consoleMessage.message.split(" ");
                switch (message[0]) {
                    case "/i":
                        switch (message[1]) {
                            case "e":
                                const entity = await gameServer.getEntityByUUID(
                                    message[2]
                                );
                                this._sendConsoleMessageToAll(
                                    JSON.stringify(entity)
                                );
                                break;
                            case "p":
                                const player: any =
                                    await gameServer.getPlayerByUsername(
                                        message[2]
                                    );
                                const dataToGet = message[3];
                                const dataToGet2 = message[4];

                                const data = player[dataToGet] as any;

                                if(dataToGet == "all") return this._sendConsoleMessageToAll(JSON.stringify(player));
                                if(dataToGet2 != undefined) return this._sendConsoleMessageToAll(data[dataToGet2]);
                                
                                this._sendConsoleMessageToAll(
                                    JSON.stringify(player[dataToGet])
                                );
                                break;
                            case "a":
                                this._sendConsoleMessageToAll(
                                    JSON.stringify(
                                        gameServer.spacemaps[message[2]]
                                            .entities
                                    )
                                );
                        }

                        break;
                    case "/c":
                        switch (message[1]) {
                            case "e":
                                const player =
                                    await gameServer.getPlayerByUsername(
                                        consoleMessage.username
                                    );
                                if (player?.currentMap) {
                                    gameServer.spacemaps[
                                        player.currentMap
                                    ].spawnAlien(message[2], {
                                        x: (0.5 - Math.random()) * 10,
                                        y: (0.5 - Math.random()) * 10,
                                    });
                                }
                                break;
                        }
                        break;
                    case "/d":
                        switch (message[1]) {
                            case "e":
                                const player =
                                    await gameServer.getPlayerByUsername(
                                        consoleMessage.username
                                    );
                                if (player?.currentMap) {
                                    gameServer.spacemaps[
                                        player.currentMap
                                    ].deleteEntityByUuid(message[2]);
                                }
                                break;
                        }
                        break;
                    case "/exp":
                        const player = await gameServer.getPlayerByUsername(
                            message[2]
                        );
                        if (player) {
                            const number = parseInt(message[3], 10);
                            if(isNaN(number)) return console.log(`Can't give "${message[3]}" isn't number!`);
                            switch (message[1]) {
                                case "give":
                                    gameServer.rewardServer.registerExperienceReward(
                                        player.uuid,
                                        Number(message[3])
                                    );
                                    break;
                                case "take":
                                    gameServer.rewardServer.registerExperienceReward(
                                        player.uuid,
                                        -Number(message[3])
                                    );
                                    break;
                            }
                        }
                        break;
                    case "/thulium":
                        const _player = await gameServer.getPlayerByUsername(
                            message[2]
                        );
                        if (_player) {
                            const number = parseInt(message[3], 10);
                            if(isNaN(number)) return console.log(`Can't give "${message[3]}" isn't number!`);
                            switch (message[1]) {
                                case "give":
                                    gameServer.rewardServer.registerThuliumReward(
                                        _player.uuid,
                                        Number([message[3]])
                                    );
                                    break;
                                case "take":
                                    gameServer.rewardServer.registerThuliumReward(
                                        _player.uuid,
                                        -Number(message[3])
                                    );
                                    break;
                                case "set":
                                    gameServer.rewardServer.registerThuliumSetReward(
                                        _player.uuid,
                                        Number([message[3]])
                                    );
                                    break;
                            }
                        }
                        break;
                    case "/credits":
                        const _player2 = await gameServer.getPlayerByUsername(
                            message[2]
                        );
                        if (_player2) {
                            const number = parseInt(message[3], 10);
                            if(isNaN(number)) return console.log(`Can't give "${message[3]}" isn't number!`);
                            switch (message[1]) {
                                case "give":
                                    gameServer.rewardServer.registerCreditsReward(
                                        _player2.uuid,
                                        Number([message[3]])
                                    );
                                    break;
                                case "take":
                                    gameServer.rewardServer.registerCreditsReward(
                                        _player2.uuid,
                                        -Number(message[3])
                                    );
                                    break;
                                case "set":
                                    gameServer.rewardServer.registerCreditsSetReward(
                                        _player2.uuid,
                                        Number([message[3]])
                                    )
                            }
                        }
                        break;
                    case "/item":
                        const _player3 = await gameServer.getPlayerByUsername(message[2]);
                        const item = await gameServer.shop.findItemByName(message[3]);
                        if(_player3 && item){
                            switch(message[1]){
                                case "give":
                                    gameServer.rewardServer.registerItemReward( _player3.uuid, item, 1)
                                    break;
                            }
                        }
                }
            }
        }
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
