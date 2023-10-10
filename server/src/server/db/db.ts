import * as mysql from "mysql2";
import { Config, readServerConfigFile } from "../background/ServerConfig.js";
import { Player } from "../background/Player.js";
import { Inventory, InventoryDataDTO } from "../background/Inventory.js";

export interface UserCredentials {
    username: string;
    uuid?: number;
    password?: string;
    lastLogin?: string;
}

export interface PlayerEntityInterface {
    username: string;
    company: string;
    mapName: string;
    positionX: number;
    positionY: number;
    credits: number;
    thulium: number;
    experience: number;
    honor: number;
    level: number;
}

export let pool: mysql.Pool;

const config: Config = readServerConfigFile();

export function setupDatabaseConnection(): void {
    try {
        pool = mysql.createPool(config.database);
    } catch (error) {
        console.error(`Error: ${error}`);
        process.exit(1)
    }

    pool.getConnection(async (error, connection) => {
        try {
            if (error) {
                console.error("Error connecting to the database:", error);
            } else {
                console.log(`TEST CONNECT TO MYSQL: SUCCESS`);
                const loginTableQuery: string = `
                    CREATE TABLE IF NOT EXISTS login (
                    uuid INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(255),
                    password VARCHAR(255),
                    lastLogin DATETIME
                    );`;
                const playerEntityQuery: string = `
                    CREATE TABLE IF NOT EXISTS playerEntity (
                      username VARCHAR(255) PRIMARY KEY,
                      mapName VARCHAR(255) DEFAULT 'M-1',
                      company VARCHAR(255) DEFAULT 'MCC',
                      positionX DOUBLE DEFAULT 0,
                      positionY DOUBLE DEFAULT 0,
                      credits BIGINT DEFAULT 50000,
                      thulium BIGINT DEFAULT 10000,
                      experience BIGINT DEFAULT 0,
                      honor BIGINT DEFAULT 0,
                      level INT DEFAULT 1
                    );`;
                const inventoryQuery: string = `
                    CREATE TABLE IF NOT EXISTS inventory (
                        username VARCHAR(255) PRIMARY KEY,
                        lasers JSON,
                        shieldGenerators JSON,
                        speedGenerators JSON,
                        ammunition JSON,
                        ships JSON
                    );`;
                await Promise.all([
                    executeQuery(loginTableQuery),
                    executeQuery(playerEntityQuery),
                    executeQuery(inventoryQuery),
                ]);
            }
        } finally {
            connection.release();
        }
    });
}

export function updateUserLoginTime(username: string): void {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");
    const second = String(now.getSeconds()).padStart(2, "0");

    const formattedDate = `${year}:${month}:${day}:${hour}:${minute}:${second}`;

    const query = `UPDATE login SET lastlogin = "${formattedDate}" WHERE username = "${username}"`;
    executeQuery(query);
}

export function getAllUsers(): Promise<UserCredentials[]> {
    const query = "SELECT * FROM login";
    return executeQuery(query);
}

export function getUserByUsername(
    username: string
): Promise<UserCredentials[]> {
    const query = `SELECT * FROM login WHERE username = "${username}";`;
    return executeQuery(query);
}

export function getUserDataByUsername(username: string) {
    const query = `SELECT * FROM playerEntity WHERE username = "${username}"`;
    return executeQuery(query);
}

export function getAllUserStats(){
    const query = `SELECT * FROM playerEntity`;
    return executeQuery(query);
}

export async function registerNewUser(username: string, password: string) {
    const checkUserQuery = `SELECT * FROM login WHERE username = "${username}"`;

    try {
        const [userCredentials] = await executeQuery(checkUserQuery);
        if (userCredentials == undefined) {
            const loginTableQuery = `INSERT INTO login (username, password, lastLogin) VALUES ("${username}", "${password}", NOW())`;
            const playerEntityQuery = `INSERT INTO playerEntity (username) VALUES ("${username}")`;
            const inventoryQuery = `INSERT INTO inventory (username, lasers, shieldGenerators, speedGenerators, ships) VALUES ("${username}", "{}", "{}", "{}", '{"protos":{"name":"Protos","maxHealth":8000,"baseSpeed":150,"maxLasers":2,"maxGenerators":2,"isActive":true,"price":{"credits":10000}}}')`;

            executeQuery(loginTableQuery);
            executeQuery(playerEntityQuery);
            executeQuery(inventoryQuery);
        } else {
            console.log("Can't register user");
        }
    } catch (error) {
        console.log(error);
    }
}

export async function updateInventoryData(
    username: string,
    inventoryData: Inventory
): Promise<any> {
    const _inventoryData = new InventoryDataDTO();
    await _inventoryData.convertInventory(inventoryData);

    const query = `
        UPDATE inventory
        SET
            lasers = '${JSON.stringify(_inventoryData.lasers)}',
            shieldGenerators = '${JSON.stringify(
                _inventoryData.shieldGenerators
            )}',
            speedGenerators = '${JSON.stringify(
                _inventoryData.speedGenerators
            )}',
            ships = '${JSON.stringify(_inventoryData.ships)}',
            ammunition = '${JSON.stringify(_inventoryData.ammunition)}'
        WHERE username = '${username}'`;

    return executeQuery(query);
}

export function getInventoryData(username: string): Promise<any> {
    const query = `SELECT * FROM inventory WHERE username = "${username}"`;
    return executeQuery(query);
}

function executeQuery<T>(query: string): Promise<T[]> {
    return new Promise<T[]>((resolve, reject) => {
        try {
            pool.getConnection((connectionError, connection) => {
                try {
                    if (connectionError) {
                        console.error(
                            `Got error while connecting to DB, err = ${JSON.stringify(
                                connectionError
                            )}`
                        );
                        reject(connectionError);
                        return;
                    }
                    connection.query(query, (queryError, results) => {
                        connection.release();

                        if (queryError) {
                            console.error(
                                `Got error while querying DB, err = ${JSON.stringify(
                                    queryError
                                )}`
                            );
                            reject(queryError);
                            return;
                        }

                        if (Array.isArray(results)) {
                            resolve(results as T[]);
                        } else {
                            resolve([results as T]);
                        }
                    });
                } finally {
                    connection.release();
                }
            });
        } catch (err) {
            console.error(`Error while executing query = ${err}`);
        }
    });
}

export function savePlayerData(player: Player): void {
    const sql = `
      UPDATE playerEntity
      SET
        positionX = "${player.position.x}",
        positionY = "${player.position.y}",
        credits = "${player.stats.credits}",
        thulium = "${player.stats.thulium}",
        experience = "${player.stats.experience}",
        honor = "${player.stats.honor}",
        mapname = "${player.currentMap}",
        company = "${player.company}",
        level = "${player.stats.level}"
      WHERE
        username = "${player.name}"
    `;

    executeQuery(sql);
    updateInventoryData(player.name, player.inventory);
}
