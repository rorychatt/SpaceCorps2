import fs from "fs";
import { SpacemapConfig } from "./Spacemap";

export interface GameDataConfig {
    [key: string]: SpacemapConfig;
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
