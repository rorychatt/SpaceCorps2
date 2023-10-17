import * as fs from "fs";
import express from "express";
import cors from "cors";
import http from "http";
import { Server, Socket } from "socket.io";
import {
    executeQuery,
    getUserByUsername,
    loadPlayerSettings,
    registerNewUser,
    savePlayerSettings,
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
import {
    generatorData,
    laserAmmoData,
    laserData,
    rocketAmmoData,
    shipData,
} from "./background/Inventory.js";
import { Quest } from "./background/QuestServer.js";

const aliensData = JSON.parse(
    fs.readFileSync("./src/server/data/aliens.json", "utf-8")
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io: Server = new Server(server);
const config: Config = readServerConfigFile();
export let gameServer: GameServer;

setupDatabaseConnection().then(() => {
    gameServer = new GameServer(io);
    gameServer.startServer();
});

handleHTTPRequests();

server.listen(config.server.port, () => {
    console.log(`Node server is running at port: ${config.server.port}`);
});

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
            for (let i = 0; i < gameServer.players.length; i++) {
                if (gameServer.players[i].name == data.username) {
                    socket.emit("userAlreadyLogined", {
                        username: data.username,
                    });
                    return;
                }
            }

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
                        gameversion: gameServer._version,
                    });

                    const playerSettings = await loadPlayerSettings(
                        userCredentials.username
                    );

                    socket.emit("loadPlayerSettings", {
                        username: userCredentials.username,
                        playerSettings: playerSettings,
                    });

                    socket.emit("shopData", {
                        lasers: laserData,
                        generators: generatorData,
                        ships: shipData,
                        ammunition: {
                            laserAmmo: laserAmmoData,
                            rocketAmmo: rocketAmmoData,
                        },
                    });

                    socket.emit("questsData", {
                        username: userCredentials.username,
                        quests: gameServer.questServer.quests,
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
                if (data.username == key || data.username == "Portal") {
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

    socket.on("getQuest", (data: { username: string, quest: Quest }) => {

        // -> acceptQuest renaming

        // data: {username: ... , questName: string}

        // gameServer.questServer.issueQuest(username: string, questName: string)


        for(let i = 0; i < gameServer.players.length; i++) {
            if(gameServer.players[i].name == data.username) {                
                if(gameServer.players[i].currentActiveQuests.length >= 3) return;
                for(let j = 0; j < gameServer.players[i].currentActiveQuests.length; j++) {
                    if(gameServer.players[i].currentActiveQuests[j].name == data.quest.name) return;
                }

                gameServer.players[i].currentActiveQuests.push(data.quest); 
            }
        }
    });

    socket.on("completeQuest", (data: { username: string, questName: string }) => {

                // -> acceptQuest renaming

        // data: {username: ... , questName: string}

        // gameServer.questServer.issueQuest(username: string, questName: string)


        // for(let i = 0; i < gameServer.players.length; i++) {
        //     if(gameServer.players[i].name == data.username) {
        //         for(let j = 0; j < gameServer.players[i].currentActiveQuests.length; j++) {
        //             gameServer.players[i].currentActiveQuests = gameServer.players[i].currentActiveQuests.filter(item => item != gameServer.players[i].currentActiveQuests[j]);
        //             gameServer.questServer.quests[j].completed = true;

        //             console.log(gameServer.players[i].currentActiveQuests);
        //             console.log("gameServer.questServer.quests[j]:", gameServer.questServer.quests[j]);
        //         }
        //     }
        // }
    });

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

    socket.on("sendChatMessageToServer", (data: ChatMessage) => {
        gameServer.chatServer.handleClientMessage(data);
    });

    socket.on("sendConsoleMessageToServer", (data: ChatMessage) => {
        gameServer.chatServer.handleConsoleMessage(data);
    });

    socket.on(
        "shootEvent",
        (data: {
            playerName: string;
            targetUUID: string;
            weapons: string;
            ammo: string;
        }) => {
            gameServer.registerPlayerAttackEvent(data);
        }
    );

    socket.on(
        "playerPurchaseEvent",
        (data: { playerName: string; itemName: string; amount?: number }) => {
            gameServer.shop.sellItem(
                data.playerName,
                data.itemName,
                data.amount
            );
        }
    );

    socket.on(
        "equipItemEvent",
        async (data: { playerName: string; itemName: string }) => {
            const player = await gameServer.getPlayerByUsername(
                data.playerName
            );
            if (player) {
                player.inventory.equipItem(data.itemName, player);
                player._calculateSpeed();
                player._calculateShields();
                player._calculateCargo();
            }
        }
    );

    socket.on(
        "playerCollectCargoBox",
        async (data: { playerName: string; cargoDropUUID: string }) => {
            const player = await gameServer.getPlayerByUsername(
                data.playerName
            );
            if (player) {
                const cargoDrop = gameServer.spacemaps[
                    player.currentMap
                ].cargoboxes.find((cargobox) => {
                    return cargobox.uuid === data.cargoDropUUID;
                });
                if (cargoDrop) {
                    gameServer.addPlayerCollectCargoDrop(cargoDrop, player);
                }
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
                player._calculateCargo();
            }
        }
    );

    socket.on("getTop10Experience", () => {
        socket.emit("serverTop10Experience", {
            top10: gameServer.rankingServer.topExperienceList,
        });
    });

    socket.on("getTop10Honor", () => {
        socket.emit("serverTop10Honor", {
            top10: gameServer.rankingServer.topHonorList,
        });
    });

    socket.on("saveSettings", (settingsData: SettingsData) => {
        savePlayerSettings(settingsData);
    });
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

type SettingsData = { username: string; volume: number; antiAliasing: boolean };
