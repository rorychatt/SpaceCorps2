import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import {
    getUserByUsername,
    setupDatabaseConnection,
    updateUserLoginTime,
    UserCredentials,
} from "./db/db.js";
import path from "path";
import { Config, readConfigFile } from "./background/loadConfig.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

setupDatabaseConnection();

const config: Config = readConfigFile("./config.json");
// console.log(`config = ${JSON.stringify(config)}`)

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "..", "..", "src", "web")))
app.use(express.static(path.join(__dirname, "..", "..", "dist", "web")))

app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "..", "..", "src", "web", "html", "index.html")
    );
});

app.listen(config.server.port, () => {
    console.log(`Node server is running at port: ${config.server.port}`);
});
