import { readFile, writeFile } from "fs";

await Promise.all([
    fixThreeImport(),
    fixGameServer(),
    fixPlayer(),
    fixSpacemap(),
    fixAlien(),
    fixRewardServer(),
    fixProjectileServer(),
    fixProjectiles(),
    fixChatServer(),
    fixShop(),
    fixCargoDrop(),
    fixInventory(),
    fixRankingServer(),
]);

function fixGameServer() {
    readFile("./dist/server/background/GameServer.js", "utf8", (err, data) => {
        if (err) {
            console.error(`Error reading file: ${err}`);
            return;
        }

        let modifiedData = data.replace(
            `import { readGameDataConfigFiles, readPackageJson, } from "./loadGameData";`,
            `import { readGameDataConfigFiles, readPackageJson, } from "./loadGameData.js";`
        );

        modifiedData = modifiedData.replace(
            'import { RankingServer } from "./RankingServer";',
            'import { RankingServer } from "./RankingServer.js";'
        );

        modifiedData = modifiedData.replace(
            'import { Spacemap } from "./Spacemap";',
            'import { Spacemap } from "./Spacemap.js";'
        );

        modifiedData = modifiedData.replace(
            'import { QuestServer } from "./QuestServer";',
            'import { QuestServer } from "./QuestServer.js";'
        );

        modifiedData = modifiedData.replace(
            'import { Player, PlayerDTO } from "./Player";',
            'import { Player, PlayerDTO } from "./Player.js";'
        );

        modifiedData = modifiedData.replace(
            'import { readGameDataConfigFiles } from "./loadGameData";',
            'import { readGameDataConfigFiles } from "./loadGameData.js";'
        );

        modifiedData = modifiedData.replace(
            'import { Alien, AlienDTO } from "./Alien";',
            'import { Alien, AlienDTO } from "./Alien.js";'
        );

        modifiedData = modifiedData.replace(
            'import { savePlayerData } from "../db/db";',
            'import { savePlayerData } from "../db/db.js";'
        );

        modifiedData = modifiedData.replace(
            'import { ChatServer } from "./ChatServer";',
            'import { ChatServer } from "./ChatServer.js";'
        );

        modifiedData = modifiedData.replace(
            'import { DamageEvent } from "./DamageEvent";',
            'import { DamageEvent } from "./DamageEvent.js";'
        );

        modifiedData = modifiedData.replace(
            'import { RewardServer } from "./RewardServer";',
            'import { RewardServer } from "./RewardServer.js";'
        );

        modifiedData = modifiedData.replace(
            'import { LaserProjectile, LaserProjectileDTO, RocketProjectile, RocketProjectileDTO, } from "./Projectiles";',
            'import { LaserProjectile, LaserProjectileDTO, RocketProjectile, RocketProjectileDTO, } from "./Projectiles.js";'
        );

        modifiedData = modifiedData.replace(
            'import { Portal } from "./Entity";',
            'import { Portal } from "./Entity.js";'
        );

        modifiedData = modifiedData.replace(
            'import { Shop } from "./Shop";',
            'import { Shop } from "./Shop.js";'
        );

        writeFile(
            "./dist/server/background/GameServer.js",
            modifiedData,
            (err) => {
                if (err) {
                    console.error(`Error writing file: ${err}`);
                }
            }
        );
    });
}

function fixThreeImport() {
    readFile("./dist/web/ts/gameLogic.js", "utf8", (err, data) => {
        if (err) {
            console.error(`Error reading file: ${err}`);
            return;
        }

        let modifiedData = data.replace(
            /import \* as THREE from "three";/g,
            'import * as THREE from "/three";'
        );

        modifiedData = modifiedData.replace(
            `import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";`,
            `import { GLTFLoader } from "/three/examples/jsm/loaders/GLTFLoader";`
        );

        modifiedData = modifiedData.replace(
            /import \{ OrbitControls \} from "three\/examples\/jsm\/controls\/OrbitControls";/g,
            'import { OrbitControls } from "/three/examples/jsm/controls/OrbitControls";'
        );

        modifiedData = modifiedData.replace(
            ` } from "./three/addons/renderers/CSS2DRenderer.js";`,
            ` } from "/three/addons/renderers/CSS2DRenderer.js";`
        );

        writeFile("./dist/web/ts/gameLogic.js", modifiedData, (err) => {
            if (err) {
                console.error(`Error writing file: ${err}`);
            }
        });
    });
}

function fixPlayer() {
    readFile("./dist/server/background/Player.js", "utf8", (err, data) => {
        if (err) {
            console.error(`Error reading file: ${err}`);
            return;
        }

        let modifiedData = data.replace(
            'import { Entity } from "./Entity";',
            'import { Entity } from "./Entity.js";'
        );

        modifiedData = modifiedData.replace(
            'import { getInventoryData, getUserDataByUsername, } from "../db/db";',
            'import { getInventoryData, getUserDataByUsername, } from "../db/db.js";'
        );

        modifiedData = modifiedData.replace(
            'import { tickrate } from "./GameServer";',
            'import { tickrate } from "./GameServer.js";'
        );

        modifiedData = modifiedData.replace(
            'import { gameServer } from "../main";',
            'import { gameServer } from "../main.js";'
        );

        modifiedData = modifiedData.replace(
            'import { Inventory, Laser, LaserAmmo, RocketAmmo, ShieldGenerator, ShipItem, SpeedGenerator, } from "./Inventory";',
            'import { Inventory, Laser, LaserAmmo, RocketAmmo, ShieldGenerator, ShipItem, SpeedGenerator, } from "./Inventory.js";'
        );

        writeFile("./dist/server/background/Player.js", modifiedData, (err) => {
            if (err) {
                console.error(`Error writing file: ${err}`);
            }
        });
    });
}

function fixSpacemap() {
    readFile("./dist/server/background/Spacemap.js", "utf8", (err, data) => {
        if (err) {
            console.error(`Error reading file: ${err}`);
            return;
        }

        let modifiedData = data.replace(
            'import { Alien } from "./Alien";',
            'import { Alien } from "./Alien.js";'
        );

        modifiedData = modifiedData.replace(
            'import { ProjectileServer } from "./ProjectileServer";',
            'import { ProjectileServer } from "./ProjectileServer.js";'
        );

        modifiedData = modifiedData.replace(
            'import { Portal } from "./Entity";',
            'import { Portal } from "./Entity.js";'
        );

        modifiedData = modifiedData.replace(
            'import { CargoDrop } from "./CargoDrop";',
            'import { CargoDrop } from "./CargoDrop.js";'
        );

        writeFile(
            "./dist/server/background/Spacemap.js",
            modifiedData,
            (err) => {
                if (err) {
                    console.error(`Error writing file: ${err}`);
                }
            }
        );
    });
}

function fixAlien() {
    readFile("./dist/server/background/Alien.js", "utf8", (err, data) => {
        if (err) {
            console.error(`Error reading file: ${err}`);
            return;
        }

        let modifiedData = data.replace(
            'import { Entity } from "./Entity";',
            'import { Entity } from "./Entity.js";'
        );

        modifiedData = modifiedData.replace(
            'import { tickrate } from "./GameServer";',
            'import { tickrate } from "./GameServer.js";'
        );

        modifiedData = modifiedData.replace(
            'import { CargoDrop, OreResource } from "./CargoDrop";',
            'import { CargoDrop, OreResource } from "./CargoDrop.js";'
        );

        writeFile("./dist/server/background/Alien.js", modifiedData, (err) => {
            if (err) {
                console.error(`Error writing file: ${err}`);
            }
        });
    });
}

function fixRewardServer() {
    readFile(
        "./dist/server/background/RewardServer.js",
        "utf8",
        (err, data) => {
            if (err) {
                console.error(`Error reading file: ${err}`);
                return;
            }

            let modifiedData = data.replace(
                'import { AlienKillReward, CargoDropReward, CreditsReward, CreditsSetReward, ExperienceReward, HonorReward, ItemReward, PlayerKillReward, ThulimReward, ThulimSetReward, } from "./Reward";',
                'import { AlienKillReward, CargoDropReward, CreditsReward, CreditsSetReward, ExperienceReward, HonorReward, ItemReward, PlayerKillReward, ThulimReward, ThulimSetReward, } from "./Reward.js";'
            );

            modifiedData = modifiedData.replace(
                'import { updateInventoryData } from "../db/db";',
                'import { updateInventoryData } from "../db/db.js";'
            );

            modifiedData = modifiedData.replace(
                'import { gameServer } from "../main";',
                'import { gameServer } from "../main.js";'
            );

            writeFile(
                "./dist/server/background/RewardServer.js",
                modifiedData,
                (err) => {
                    if (err) {
                        console.error(`Error writing file: ${err}`);
                    }
                }
            );
        }
    );
}

function fixProjectileServer() {
    readFile(
        "./dist/server/background/ProjectileServer.js",
        "utf8",
        (err, data) => {
            if (err) {
                console.error(`Error reading file: ${err}`);
                return;
            }

            let modifiedData = data.replace(
                'import { LaserProjectile, RocketProjectile, } from "./Projectiles";',
                'import { LaserProjectile, RocketProjectile, } from "./Projectiles.js";'
            );

            writeFile(
                "./dist/server/background/ProjectileServer.js",
                modifiedData,
                (err) => {
                    if (err) {
                        console.error(`Error writing file: ${err}`);
                    }
                }
            );
        }
    );
}

function fixInventory() {
    readFile("./dist/server/background/Inventory.js", "utf8", (err, data) => {
        if (err) {
            console.error(`Error reading file: ${err}`);
            return;
        }

        let modifiedData = data.replace(
            'import { OreResource } from "./CargoDrop";',
            'import { OreResource } from "./CargoDrop.js";'
        );

        writeFile(
            "./dist/server/background/Inventory.js",
            modifiedData,
            (err) => {
                if (err) {
                    console.error(`Error writing file: ${err}`);
                }
            }
        );
    });
}

function fixProjectiles() {
    readFile("./dist/server/background/Projectiles.js", "utf8", (err, data) => {
        if (err) {
            console.error(`Error reading file: ${err}`);
            return;
        }

        let modifiedData = data.replace(
            'import { Entity } from "./Entity";',
            'import { Entity } from "./Entity.js";'
        );

        modifiedData = modifiedData.replace(
            'import { tickrate } from "./GameServer";',
            'import { tickrate } from "./GameServer.js";'
        );

        modifiedData = modifiedData.replace(
            'import { laserAmmoData } from "./Inventory";',
            'import { laserAmmoData } from "./Inventory.js";'
        );

        writeFile(
            "./dist/server/background/Projectiles.js",
            modifiedData,
            (err) => {
                if (err) {
                    console.error(`Error writing file: ${err}`);
                }
            }
        );
    });
}

function fixChatServer() {
    readFile("./dist/server/background/ChatServer.js", "utf8", (err, data) => {
        if (err) {
            console.error(`Error reading file: ${err}`);
            return;
        }

        let modifiedData = data.replace(
            'import { gameServer } from "../main";',
            'import { gameServer } from "../main.js";'
        );

        writeFile(
            "./dist/server/background/ChatServer.js",
            modifiedData,
            (err) => {
                if (err) {
                    console.error(`Error writing file: ${err}`);
                }
            }
        );
    });
}

function fixShop() {
    readFile("./dist/server/background/Shop.js", "utf8", (err, data) => {
        if (err) {
            console.error(`Error reading file: ${err}`);
            return;
        }

        let modifiedData = data.replace(
            'import { gameServer } from "../main";',
            'import { gameServer } from "../main.js";'
        );

        modifiedData = modifiedData.replace(
            'import { Laser, LaserAmmo, RocketAmmo, ShieldGenerator, ShipItem, SpeedGenerator, generatorData, laserAmmoData, laserData, rocketAmmoData, shipData, } from "./Inventory";',
            'import { Laser, LaserAmmo, RocketAmmo, ShieldGenerator, ShipItem, SpeedGenerator, generatorData, laserAmmoData, laserData, rocketAmmoData, shipData, } from "./Inventory.js";'
        );

        writeFile("./dist/server/background/Shop.js", modifiedData, (err) => {
            if (err) {
                console.error(`Error writing file: ${err}`);
            }
        });
    });
}

function fixCargoDrop() {
    readFile("./dist/server/background/CargoDrop.js", "utf8", (err, data) => {
        if (err) {
            console.error(`Error reading file: ${err}`);
            return;
        }

        let modifiedData = data.replace(
            'import { Entity } from "./Entity";',
            'import { Entity } from "./Entity.js";'
        );

        writeFile(
            "./dist/server/background/CargoDrop.js",
            modifiedData,
            (err) => {
                if (err) {
                    console.error(`Error writing file: ${err}`);
                }
            }
        );
    });
}

function fixRankingServer() {
    readFile(
        "./dist/server/background/RankingServer.js",
        "utf8",
        (err, data) => {
            if (err) {
                console.error(`Error reading file: ${err}`);
                return;
            }

            let modifiedData = data.replace(
                'import { getAllUserStats } from "../db/db";',
                'import { getAllUserStats } from "../db/db.js";'
            );

            writeFile(
                "./dist/server/background/RankingServer.js",
                modifiedData,
                (err) => {
                    if (err) {
                        console.error(`Error writing file: ${err}`);
                    }
                }
            );
        }
    );
}