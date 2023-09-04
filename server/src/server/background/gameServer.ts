import {
    GameDataConfig,
    SpacemapConfig,
    SpacemapSize,
    readGameDataConfigFiles,
} from "./loadGameData";
import { Server } from "socket.io";

export class Entity {
    name: string;

    public constructor() {
        this.name = "testEntity";
    }
}

export class Player extends Entity {
    currentMap: string;
    socketId: string;

    public constructor(socketId: string, username: string) {
        super();
        this.name = username;
        this.currentMap = "M-1";
        this.socketId = socketId;
    }
}

export class Spacemap {
    name: string;
    size: SpacemapSize;
    entities: Entity[];

    public constructor(config: SpacemapConfig) {
        this.entities = [];
        this.name = "test";
        this.size = { width: 160, height: 90 };
        if (config) {
            this.name = config.name;
            this.size = config.size;
        } else {
            console.log(`Warning! Tried to load a map without a config file!`);
        }
    }
}

interface Spacemaps {
    [key: string]: Spacemap;
}

export class GameServer {
    spacemaps: Spacemaps;
    players: Player[];
    io: Server;
    tickRate: number;
    gameLoop: NodeJS.Timeout | null;

    public constructor(io: Server) {
        this.players = [];
        this.spacemaps = {};
        this.io = io;
        this.tickRate = 60;
        this.gameLoop = null;

        this._loadSpacemapsFromConfig();
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

    async processAILogic() {}

    async processPlayerInputs() {}

    async handleDamage() {}

    async handleCurrencyTransactions() {}

    async sendMapData() {
        this.players.forEach((player) => {
            const mapData = this.spacemaps[player.currentMap];
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
