import { readFile, writeFile } from "fs";

fixThreeImport();
fixGameServer();
fixPlayer();
fixSpacemap();
fixAlien();

function fixGameServer() {
    readFile("./dist/server/background/GameServer.js", "utf8", (err, data) => {
        if (err) {
            console.error(`Error reading file: ${err}`);
            return;
        }

        // Replace the import statement
        let modifiedData = data.replace(
            'import { readGameDataConfigFiles, } from "./loadGameData";',
            'import { readGameDataConfigFiles, } from "./loadGameData.js";'
        );

        modifiedData = modifiedData.replace(
            'import { Spacemap } from "./Spacemap";',
            'import { Spacemap } from "./Spacemap.js";'
        );

        modifiedData = modifiedData.replace(
            'import { Player, PlayerDTO } from "./Player";',
            'import { Player, PlayerDTO } from "./Player.js";'
        );

        modifiedData = modifiedData.replace(
            'import { readGameDataConfigFiles } from "./loadGameData";',
            'import { readGameDataConfigFiles } from "./loadGameData.js";'
        );

        modifiedData = modifiedData.replace(
            'import { Alien, AlienDTO } from "./Alien";',
            'import { Alien, AlienDTO } from "./Alien.js";'
        );

        modifiedData = modifiedData.replace(
            'import { savePlayerData } from "../db/db";',
            'import { savePlayerData } from "../db/db.js";'
        );

        // Write the modified content back to the file
        writeFile(
            "./dist/server/background/GameServer.js",
            modifiedData,
            (err) => {
                if (err) {
                    console.error(`Error writing file: ${err}`);
                }
            }
        );
    });
}

function fixThreeImport() {
    readFile("./dist/web/ts/gameLogic.js", "utf8", (err, data) => {
        if (err) {
            console.error(`Error reading file: ${err}`);
            return;
        }

        // Replace the import statement for "THREE" module
        let modifiedData = data.replace(
            /import \* as THREE from "three";/g,
            'import * as THREE from "/three";'
        );

        modifiedData = modifiedData.replace(
            `import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";`,
            `import { GLTFLoader } from "/three/examples/jsm/loaders/GLTFLoader";`
        )

        // Replace the import statement for "OrbitControls"
        modifiedData = modifiedData.replace(
            /import \{ OrbitControls \} from "three\/examples\/jsm\/controls\/OrbitControls";/g,
            'import { OrbitControls } from "/three/examples/jsm/controls/OrbitControls";'
        );

        modifiedData = modifiedData.replace(
            ` } from "./three/addons/renderers/CSS2DRenderer.js";`,
            ` } from "/three/addons/renderers/CSS2DRenderer.js";`
        );

        // Write the modified content back to the file
        writeFile(
            "./dist/web/ts/gameLogic.js",
            modifiedData,
            (err) => {
                if (err) {
                    console.error(`Error writing file: ${err}`);
                }
            }
        );
    });
}

function fixPlayer() {
    readFile("./dist/server/background/Player.js", "utf8", (err, data) => {
        if (err) {
            console.error(`Error reading file: ${err}`);
            return;
        }

        // Replace the import statement for "THREE" module
        let modifiedData = data.replace(
            'import { Entity } from "./Entity";',
            'import { Entity } from "./Entity.js";'
        );

        modifiedData = modifiedData.replace(
            'import { getUserDataByUsername } from "../db/db";',
            'import { getUserDataByUsername } from "../db/db.js";'
        );

        modifiedData = modifiedData.replace(
            'import { tickrate } from "./GameServer";',
            'import { tickrate } from "./GameServer.js";'
        );

        // Write the modified content back to the file
        writeFile("./dist/server/background/Player.js", modifiedData, (err) => {
            if (err) {
                console.error(`Error writing file: ${err}`);
            }
        });
    });
}

function fixSpacemap() {
    readFile("./dist/server/background/Spacemap.js", "utf8", (err, data) => {
        if (err) {
            console.error(`Error reading file: ${err}`);
            return;
        }

        // Replace the import statement for "THREE" module
        let modifiedData = data.replace(
            'import { Alien } from "./Alien";',
            'import { Alien } from "./Alien.js";'
        );

        // Write the modified content back to the file
        writeFile(
            "./dist/server/background/Spacemap.js",
            modifiedData,
            (err) => {
                if (err) {
                    console.error(`Error writing file: ${err}`);
                }
            }
        );
    });
}

function fixAlien() {
    readFile("./dist/server/background/Alien.js", "utf8", (err, data) => {
        if (err) {
            console.error(`Error reading file: ${err}`);
            return;
        }

        // Replace the import statement for "THREE" module
        let modifiedData = data.replace(
            'import { Entity } from "./Entity";',
            'import { Entity } from "./Entity.js";'
        );

        modifiedData = modifiedData.replace(
            'import { tickrate } from "./GameServer";',
            'import { tickrate } from "./GameServer.js";'
        );

        // Write the modified content back to the file
        writeFile("./dist/server/background/Alien.js", modifiedData, (err) => {
            if (err) {
                console.error(`Error writing file: ${err}`);
            }
        });
    });
}
