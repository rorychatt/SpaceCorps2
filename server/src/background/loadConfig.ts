import * as fs from "fs";

export interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  waitForConnections: boolean;
  connectionLimit: number;
  queueLimit: number;
  port: number;
}

export interface SSHConfig {
  password: string;
  remoteIp: string;
}

export interface Config {
  database: DatabaseConfig;
  ssh: SSHConfig;
}

const readConfigFile = (filePath: string): Config | null => {
  try {
    const configFileContents = fs.readFileSync(filePath, "utf8");
    const config = JSON.parse(configFileContents) as Config;
    return config;
  } catch (error) {
    console.error("Error reading config file:", error.message);
    return null;
  }
};

export const config: Config = readConfigFile("./config.json");
