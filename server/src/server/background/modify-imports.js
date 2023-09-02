import { readFile, writeFile } from 'fs';

// Specify the JavaScript file you want to modify
const filePath = './dist/web/ts/gameLogic.js';

readFile(filePath, 'utf8', (err, data) => {
    if (err) {
        console.error(`Error reading file: ${err}`);
        return;
    }

    // Replace the import statement
    const modifiedData = data.replace(
        /import \* as THREE from "three";/g,
        'import * as THREE from "/three";'
    );

    // Write the modified content back to the file
    writeFile(filePath, modifiedData, (err) => {
        if (err) {
            console.error(`Error writing file: ${err}`);
        } else {
            console.log(`Import statement modified successfully.`);
        }
    });
});
