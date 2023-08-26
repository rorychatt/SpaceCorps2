import * as mysql from "mysql2";
import { config } from "../background/loadConfig";

export interface UserCredentials {
  username: string;
  uuid: number;
  password: string;
  lastLogin: string;
}

export let pool: mysql.Pool;

export function setupDatabaseConnection(): void {
  try {
    pool = mysql.createPool(config.database);
  } catch (error) {
    console.error(`Error: ${error}`);
  }

  pool.getConnection((error, connection) => {
    if (error) {
      console.error("Error connecting to the database:", error);
    } else {
      console.log(`TEST CONNECT TO MYSQL: SUCCESS`);
      connection.release(); // Release the connection
    }
  });
}

export function updateUserLoginTime(username: string): void {
    const now = new Date();
  
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    
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

// Function to execute a query
// Function to execute a query
function executeQuery<T>(query: string): Promise<T[]> {
  return new Promise<T[]>((resolve, reject) => {
    try {
      pool.getConnection((connectionError, connection) => {
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
              `Got error while querying DB, err = ${JSON.stringify(queryError)}`
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
      });
    } catch (err) {
      console.error(`Error while executing query = ${err}`);
    }
  });
}
