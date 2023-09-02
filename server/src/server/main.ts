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
import { Config, readServerConfigFile } from "./background/loadServerConfig.js";
import { fileURLToPath } from "url";
import { GameDataConfig, readGameDataConfigFiles } from "./background/loadGameData.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

setupDatabaseConnection();

const config: Config = readServerConfigFile();
const gameDataConfig: GameDataConfig = readGameDataConfigFiles()

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "..", "..", "src", "web")));
app.use(express.static(path.join(__dirname, "..", "..", "dist", "web")));

app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "..", "..", "src", "web", "html", "index.html")
    );
});

app.get("/three", (req, res) => {
    // Use res.sendFile to send the file with the correct MIME type
    res.sendFile(path.join(__dirname, "..", "..", "dist", "web", "ts", "three.module.js"), { 
        headers: {
            'Content-Type': 'application/javascript'
        }
    });
});

server.listen(config.server.port, () => {
    console.log(`Node server is running at port: ${config.server.port}`);
});

io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });

    socket.on(
        "authenticate",
        async (data: { username: string; password: string }) => {
            try {
                const [userCredentials] = await getUserByUsername(
                    data.username
                );
                if (
                    userCredentials &&
                    userCredentials.password === data.password
                ) {
                    socket.emit("loginSuccessful", {
                        username: userCredentials.username,
                    });
                    console.log(
                        `${userCredentials.username} logs into the game`
                    );
                } else {
                    socket.emit("loginUnsuccessful", {
                        username: data.username,
                    });
                    console.log(
                        `${userCredentials.username} entered the wrong password`
                    );
                }
            } catch (e) {
                console.log(
                    `Failed to check user credentials, error: ${
                        (e as Error).message
                    }`
                );
                socket.emit("loginUnsuccessful", {
                    username: data.username,
                });
            }
        }
    );
});

console.log(JSON.stringify(gameDataConfig))