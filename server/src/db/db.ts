import * as mysql from "mysql2";
import { config } from "../background/loadConfig";

// Create a connection pool

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

export function getAllUsers(): Promise<unknown[]> {
  const query = "SELECT * FROM login";
  return executeQuery(query);
}

// Function to execute a query
function executeQuery(query: string): Promise<unknown[]> {
  return new Promise<unknown[]>((resolve, reject) => {
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
            resolve(results);
          } else {
            // If the results are not an array, wrap them in an array
            resolve([results]);
          }
        });
      });
    } catch (err) {
      console.error(`Error while executing query = ${err}`);
    }
  });
}
