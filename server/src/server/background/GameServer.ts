import { Alien } from "./Alien";
import { Player } from "./Player";
import { Spacemap, Spacemaps } from "./Spacemap";
import { GameDataConfig, readGameDataConfigFiles } from "./loadGameData";
import { Server, Socket } from "socket.io";
import { savePlayerData } from "../db/db";

export const tickrate = 120;

export class GameServer {
    spacemaps: Spacemaps;
    players: Player[];
    io: Server;
    tickRate: number;
    gameLoop: NodeJS.Timeout | null;
    _spacemapNames: string[];

    public constructor(io: Server) {
        this.players = [];
        this.spacemaps = {};
        this.io = io;
        this.tickRate = tickrate;
        this.gameLoop = null;

        this._loadSpacemapsFromConfig();
        this._spacemapNames = Object.keys(this.spacemaps);
    }

    async getPlayerBySocketId(socketId: string): Promise<Player | undefined> {
        return this.players.find((player) => player.socketId === socketId);
    }

    _loadSpacemapsFromConfig() {
        const gameDataConfig: GameDataConfig = readGameDataConfigFiles();
        for (const key in gameDataConfig) {
            if (gameDataConfig.hasOwnProperty(key)) {
                const _spacemapConfig = gameDataConfig[key];
                const _spacemap: Spacemap = new Spacemap(_spacemapConfig);
                this.spacemaps[key] = _spacemap;
            }
        }
    }

    async loadNewPlayer(socketId: string, username: string) {
        const player = new Player(socketId, username);
        this.players.push(player);
        this.spacemaps[player.currentMap].entities.push(player);
    }

    async processAILogic() {
        await Promise.all([
            this.proccessRandomSpawns(),
            this.proccessRandomMovements(),
        ]);
    }

    async proccessRandomMovements() {
        for (const spacemapName in this._spacemapNames) {
            this.spacemaps[this._spacemapNames[spacemapName]].entities.forEach(
                (entity) => {
                    if (entity instanceof Alien) {
                        entity.passiveRoam();
                    }
                }
            );
        }
    }

    async proccessRandomSpawns() {
        for (const spacemapName in this._spacemapNames) {
            this.spacemaps[
                this._spacemapNames[spacemapName]
            ].randomSpawnAlien();
        }
    }

    async processPlayerInputs() {
        this.players.forEach((player) => {
            if (player.destination) {
                player.flyToDestination();
            }
        });
    }

    async handleDamage() {}

    async handleCurrencyTransactions() {}

    async sendMapData() {
        this.players.forEach((player) => {
            let mapData: any = this.spacemaps[player.currentMap];

            for(const key of mapData.entities) {
                if(key._type === "Alien") {
                    let unnecpar = ["oreDrop"]; // parameters for delete
                    
                    for(let i = 0; i <= unnecpar.length; i++) {
                        if(key.hasOwnProperty(unnecpar[i])) {
                            delete key[unnecpar[i]];
                        }
                    }
                }
            }

            //console.log("MAPDATA:", mapData);
            this.io.to(player.socketId).emit("mapData", mapData);
        });
    }

    async disconnectPlayerBySocketId(_socketId: string) {
        const disconnectedPlayerIndex = this.players.findIndex(
            (player) => player.socketId === _socketId
        );

        if (disconnectedPlayerIndex !== -1) {
            const disconnectedPlayer = this.players[disconnectedPlayerIndex];
            const spacemap = this.spacemaps[disconnectedPlayer.currentMap];

            const playerIndexInSpacemap = spacemap.entities.findIndex(
                (entity) =>
                    entity instanceof Player && entity.socketId === _socketId
            );

            if (playerIndexInSpacemap !== -1) {
                spacemap.entities.splice(playerIndexInSpacemap, 1);
            }

            if (disconnectedPlayer.stats) {
                savePlayerData(disconnectedPlayer);
            }

            console.log(`Player ${disconnectedPlayer.name} disconnected`);

            // Implement any additional cleanup or handling logic here if needed

            this.players.splice(disconnectedPlayerIndex, 1);
        }
    }

    async updateGameWorld() {
        try {
            await Promise.all([
                this.processAILogic(),
                this.processPlayerInputs(),
                this.handleDamage(),
                this.handleCurrencyTransactions(),
            ]);

            this.sendMapData();
        } catch (error) {
            console.log(
                `Error in the game server: ${JSON.stringify(error as Error)}`
            );
        }
    }

    async addPlayerMoveToDestination(
        targetPosition: { x: number; y: number },
        socketId: string
    ) {
        const player = await this.getPlayerBySocketId(socketId);
        if (player) {
            player.destination = targetPosition;
        }
    }

    startServer() {
        // TODO: Wait for previous tick completion?

        if (this.gameLoop === null) {
            this.gameLoop = setInterval(() => {
                this.updateGameWorld();
            }, 1000 / this.tickRate);
        }
    }

    stopGameLoop() {
        if (this.gameLoop !== null) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
    }
}
