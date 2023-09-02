import fs from "fs";

interface PortalConfig {
    location: string;
    destination: string;
}

interface StaticEntitiesConfig {
    portals: PortalConfig[];
    base?: {
        location: string;
        name: string;
    };
}

interface SpaceMapConfig {
    name: string;
    size: {
        width: number;
        height: number;
    };
    staticEntities: StaticEntitiesConfig;
}

export interface GameDataConfig {
    [key: string]: SpaceMapConfig;
}

// Load and parse the JSON file
export const readGameDataConfigFiles = (): GameDataConfig => {
    let result: GameDataConfig = {
        test: {
            name: "testmap",
            size: {
                width: 160,
                height: 90,
            },
            staticEntities: {
                portals: [
                    {
                        location: "top",
                        destination: "undefined",
                    },
                ],
            },
        },
    };
    try {
        const data = fs.readFileSync(
            "./src/server/data/spacemaps.json",
            "utf8"
        );
        const jsonData = JSON.parse(data);
        result = jsonData as GameDataConfig;
    } catch (error) {
        console.log(
            `Got an error while loading game data config files, e = ${
                (error as Error).message
            }`
        );
    }
    return result;
};
