import * as mysql from "mysql2";
import { Config, readServerConfigFile } from "../background/ServerConfig.js";
import { Player } from "../background/Player.js";

export interface UserCredentials {
    username: string;
    uuid?: number;
    password?: string;
    lastLogin?: string;
}

export interface PlayerEntityInterface {
    username: string;
    mapName: string;
    positionX: number;
    positionY: number;
    credits: number;
    thulium: number;
    experience: number;
    honor: number;
}

export let pool: mysql.Pool;

const config: Config = readServerConfigFile();

export function setupDatabaseConnection(): void {
    try {
        pool = mysql.createPool(config.database);
    } catch (error) {
        console.error(`Error: ${error}`);
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
                      positionX INT DEFAULT 0,
                      positionY INT DEFAULT 0,
                      credits INT DEFAULT 50000,
                      thulium INT DEFAULT 10000,
                      experience INT DEFAULT 0,
                      honor INT DEFAULT 0
                    );`;
                await Promise.all([
                    executeQuery(loginTableQuery),
                    executeQuery(playerEntityQuery),
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

export async function registerNewUser(username: string, password: string) {

    const checkUserQuery = `SELECT * FROM login WHERE username = "${username}"`;

    try {
        const [userCredentials] = await executeQuery(checkUserQuery);
        if (userCredentials == undefined) {
            const loginTableQuery = `INSERT INTO login (username, password, lastLogin) VALUES ("${username}", "${password}", NOW())`;
            const playerEntityQuery = `INSERT INTO playerEntity (username) VALUES ("${username}")`;

            executeQuery(loginTableQuery);
            executeQuery(playerEntityQuery);
        } else {
            console.log("Can't register user");
        }
    } catch (error) {
        console.log(error);
    }
}

// Function to execute a query
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
                        connection.release(); // Release the connection

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
                            // If the results are not an array, wrap them in an array
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

// TODO: SPAC-49

// Записать данные игрока в базу данных
// position (positionX, positionY), mapname, credits, thulium, experience, honor
// OPTIONAL: lastSocketId, hullPoints, shieldPoints