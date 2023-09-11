import express from "express";
import cors from "cors";
import http from "http";
import { Server, Socket } from "socket.io";
import {
    getUserByUsername,
    registerNewUser,
    setupDatabaseConnection,
} from "./db/db.js";
import path from "path";
import { Config, readServerConfigFile } from "./background/ServerConfig.js";
import { fileURLToPath } from "url";
import {
    GameDataConfig,
    readGameDataConfigFiles,
} from "./background/loadGameData.js";
import { GameServer } from "./background/GameServer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io: Server = new Server(server);

setupDatabaseConnection();

const config: Config = readServerConfigFile();
const gameDataConfig: GameDataConfig = readGameDataConfigFiles();

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
    res.sendFile(
        path.join(
            __dirname,
            "..",
            "..",
            "dist",
            "web",
            "ts",
            "three.module.js"
        ),
        {
            headers: {
                "Content-Type": "application/javascript",
            },
        }
    );
});

app.get("/pako", (req, res) => {
    res.sendFile(
        path.join(__dirname, "..", "..", "dist", "web", "ts", "pako.js"),
        {
            headers: {
                "Content-Type": "application/javascript",
            },
        }
    );
});

app.get("/three/examples/jsm/controls/OrbitControls", (req, res) => {
    res.sendFile(
        path.join(
            __dirname,
            "..",
            "..",
            "dist",
            "web",
            "ts",
            "OrbitControls.js"
        ),
        {
            headers: {
                "Content-Type": "application/javascript",
            },
        }
    );
});

server.listen(config.server.port, () => {
    console.log(`Node server is running at port: ${config.server.port}`);
});

const gameServer: GameServer = new GameServer(io);
gameServer.startServer();

io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("disconnect", () => {
        console.log("A user disconnected");
        gameServer.disconnectPlayerBySocketId(socket.id);
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
                    gameServer.loadNewPlayer(
                        socket.id as string,
                        userCredentials.username
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

    socket.on(
        "attemptRegister",
        async (data: { username: string; password: string }) => {
            const [userCredentials] = await getUserByUsername(data.username);
            if (userCredentials) {
                socket.emit("registerUnsuccessful", {
                    username: userCredentials.username,
                });
            } else {
                try {
                    await registerNewUser(data.username, data.password);
                } finally {
                    socket.emit("registerSuccessful", {
                        username: data.username,
                    });
                }
            }
        }
    );
});
