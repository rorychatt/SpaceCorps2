import { readFile, writeFile } from "fs";

fixThreeImport();
fixReadGameDataConfigFilesImport();

function fixReadGameDataConfigFilesImport() {
    readFile("./dist/server/background/gameServer.js", "utf8", (err, data) => {
        if (err) {
            console.error(`Error reading file: ${err}`);
            return;
        }

        // Replace the import statement
        const modifiedData = data.replace(
            'import { readGameDataConfigFiles, } from "./loadGameData";',
            'import { readGameDataConfigFiles, } from "./loadGameData.js";'
        );

        // Write the modified content back to the file
        writeFile(
            "./dist/server/background/gameServer.js",
            modifiedData,
            (err) => {
                if (err) {
                    console.error(`Error writing file: ${err}`);
                } else {
                    console.log(
                        `Import of readGameDataConfigFiles in gameserver.js Fixed.`
                    );
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
            } else {
                console.log(`Import of threejs in gameLogic fixed.`);
            }
        });
    });
}
