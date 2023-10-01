import * as fs from "fs";
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
import { ChatMessage } from "./background/ChatServer.js";
import { generatorData, laserData, shipData } from "./background/Inventory.js";

const aliensData = JSON.parse(
    fs.readFileSync("./src/server/data/aliens.json", "utf-8")
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io: Server = new Server(server);

setupDatabaseConnection();

const config: Config = readServerConfigFile();
const gameDataConfig: GameDataConfig = readGameDataConfigFiles();

handleHTTPRequests();

server.listen(config.server.port, () => {
    console.log(`Node server is running at port: ${config.server.port}`);
});

export const gameServer: GameServer = new GameServer(io);
gameServer.startServer();

io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("disconnect", () => {
        console.log("A user disconnected");
        gameServer.disconnectPlayerBySocketId(socket.id);
    });

    socket.on("checkisAdmin", (data) => {
        for (let i = 0; i < gameServer.admins.length; i++) {
            if (gameServer.admins[i] == data) {
                socket.emit("userisAdmin");
            }
        }
    });

    socket.on(
        "authenticate",
        async (data: { username: string; password: string }) => {
            try {
                const [userCredentials] = await getUserByUsername(
                    data.username
                );

                if (data.username.length <= 0 || data.password.length <= 0)
                    return;

                if (
                    userCredentials &&
                    userCredentials.password === data.password
                ) {
                    socket.emit("loginSuccessful", {
                        username: userCredentials.username,
                    });
                    socket.emit("shopData", {
                        lasers: laserData,
                        generators: generatorData,
                        ships: shipData,
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
            for (const key in aliensData) {
                if (data.username == key) {
                    socket.emit("registerUnsuccessful", {
                        username: data.username,
                    });
                    return;
                }
            }

            let regex = /^[A-Za-z0-9! =]+$/;
            const [userCredentials] = await getUserByUsername(data.username);
            if (data.username.length < 4 && data.password.length < 4) {
                socket.emit("registerUnsuccessful", {
                    username: data.username,
                });

                return;
            }

            if (!regex.test(data.username)) {
                socket.emit("registerUnsuccessful", {
                    username: data.username,
                });

                return;
            }

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

    socket.on(
        "playerMoveToDestination",
        (data: { targetPosition: { x: number; y: number } }) => {
            gameServer.addPlayerMoveToDestination(
                data.targetPosition,
                socket.id
            );
        }
    );

    socket.on("attemptTeleport", (data: { playerName: string }) => {
        gameServer.attemptTeleport(data.playerName);
    });

    // Handle chat message from client
    socket.on("sendChatMessageToServer", (data: ChatMessage) => {
        gameServer.chatServer.handleClientMessage(data);
    });

    // Handle console message from client (command too!!)
    socket.on("sendConsoleMessageToServer", (data: ChatMessage) => {
        gameServer.chatServer.handleConsoleMessage(data);
    });

    socket.on(
        "shootEvent",
        (data: { playerName: string; targetUUID: string; weapons: string }) => {
            gameServer.registerPlayerAttackEvent(data);
        }
    );

    socket.on(
        "playerPurchaseEvent",
        (data: { playerName: string; itemName: string }) => {
            gameServer.shop.sellItem(data.playerName, data.itemName);
        }
    );

    socket.on(
        "equipItemEvent",
        async (data: { playerName: string; itemName: string }) => {
            const player = await gameServer.getPlayerByUsername(
                data.playerName
            );
            if (player) {
                player.inventory.equipItem(data.itemName);
                player._calculateSpeed();
                player._calculateShields();
            }
        }
    );

    socket.on(
        "unequipItemEvent",
        async (data: { playerName: string; itemName: string }) => {
            const player = await gameServer.getPlayerByUsername(
                data.playerName
            );
            if (player) {
                player.inventory.unequipItem(data.itemName);
                player._calculateSpeed();
                player._calculateShields();
            }
        }
    );
});

function handleHTTPRequests() {
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

    app.get("/three/examples/jsm/loaders/GLTFLoader", (req, res) => {
        res.sendFile(
            path.join(
                __dirname,
                "..",
                "..",
                "dist",
                "web",
                "ts",
                "GLTFLoader.js"
            ),
            {
                headers: {
                    "Content-Type": "application/javascript",
                },
            }
        );
    });

    app.get("/three/addons/renderers/CSS2DRenderer.js", (req, res) => {
        res.sendFile(
            path.join(
                __dirname,
                "..",
                "..",
                "dist",
                "web",
                "ts",
                "CSS2DRenderer.js"
            ),
            {
                headers: {
                    "Content-Type": "application/javascript",
                },
            }
        );
    });
}
