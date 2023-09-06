import { readFile, writeFile } from "fs";

fixThreeImport();
fixGameServer();
fixPlayer();

function fixGameServer() {
    readFile("./dist/server/background/gameServer.js", "utf8", (err, data) => {
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
            'import { Player } from "./Player";',
            'import { Player } from "./Player.js";'
        );


        // Write the modified content back to the file
        writeFile(
            "./dist/server/background/gameServer.js",
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
        const modifiedData = data.replace(
            /import \* as THREE from "three";/g,
            'import * as THREE from "/three";'
        );

        // Replace the import statement for "OrbitControls"
        const modifiedDataWithOrbitControls = modifiedData.replace(
            /import \{ OrbitControls \} from "three\/examples\/jsm\/controls\/OrbitControls";/g,
            'import { OrbitControls } from "/three/examples/jsm/controls/OrbitControls";'
        );
        // Write the modified content back to the file
        writeFile("./dist/web/ts/gameLogic.js", modifiedDataWithOrbitControls, (err) => {
            if (err) {
                console.error(`Error writing file: ${err}`);
            }
        });
    });
}

function fixPlayer(){
    readFile("./dist/server/background/Player.js", "utf8", (err, data) => {
        if (err) {
            console.error(`Error reading file: ${err}`);
            return;
        }

        // Replace the import statement for "THREE" module
        const modifiedData = data.replace(
            'import { Entity } from "./Entity";',
            'import { Entity } from "./Entity.js";'
        );

        // Write the modified content back to the file
        writeFile("./dist/server/background/Player.js", modifiedData, (err) => {
            if (err) {
                console.error(`Error writing file: ${err}`);
            }
        });
    });
}
