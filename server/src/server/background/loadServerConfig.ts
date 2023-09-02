import * as fs from "fs";

export interface DatabaseConfig {
    host: string;
    user: string;
    password: string;
    database: string;
    waitForConnections?: boolean;
    connectionLimit?: number;
    queueLimit?: number;
    port?: number;
}

export interface SSHConfig {
    password: string;
    remoteIp: string;
}

export interface ServerConfig {
    port: number;
    localhost?: string;
}

export interface Config {
    database: DatabaseConfig;
    ssh?: SSHConfig;
    server: ServerConfig;
}

export const readServerConfigFile = (): Config => {
    let config: Config = {
        database: {
            host: "localhost",
            user: "root",
            password: "password",
            database: "test",
        },
        server: {
            port: 3000,
        },
    };
    try {
        const configFileContents = fs.readFileSync("./config.json", "utf8");
        config = JSON.parse(configFileContents) as Config;
    } catch (error) {
        console.error("Error reading config file:", (error as Error).message);
    }
    return config;
};
