import {
    GameDataConfig,
    SpacemapConfig,
    readGameDataConfigFiles,
} from "./loadGameData";

class Entity {}

class Player {}

class Spacemap {
    config: SpacemapConfig;
    entities: Entity[];

    public constructor() {
        this.config = {
            name: "test",
            size: {
                width: 160,
                height: 90,
            },
            staticEntities: {
                portals: [],
            },
        };
        this.entities = [];
    }
}

class GameServer {
    spacemaps: Spacemap[];
    players: Player[];

    public constructor() {
        const gameDataConfig: GameDataConfig = readGameDataConfigFiles();

        this.players = [];
        this.spacemaps = [];

        for (const key in gameDataConfig) {
            if (gameDataConfig.hasOwnProperty(key)) {
                const element = gameDataConfig[key];
                console.log(JSON.stringify(element));
            }
        }
    }
}
