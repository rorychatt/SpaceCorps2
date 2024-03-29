import { Alien, AlienDTO } from "./Alien";
import { Player, PlayerDTO } from "./Player";
import {
    PossibleSpacemapEntities,
    Spacemap,
    SpacemapSize,
    Spacemaps,
    Vector2D,
} from "./Spacemap";
import {
    GameDataConfig,
    readGameDataConfigFiles,
    readPackageJson,
} from "./loadGameData";
import { Server, Socket } from "socket.io";
import {
    getPlayerCompany,
    saveCompletedQuests,
    saveCurrentQuests,
    savePlayerData,
    setPlayerPosition,
} from "../db/db.js";
import { ChatServer } from "./ChatServer";
import { DamageEvent } from "./DamageEvent";
import { CompanyBase, Entity, Portal } from "./Entity.js";
import { RewardServer } from "./RewardServer";
import {
    AlienProjectile,
    LaserProjectile,
    LaserProjectileDTO,
    RocketProjectile,
    RocketProjectileDTO,
} from "./Projectiles.js";
import { Shop } from "./Shop";
import { CargoDrop, OreSpawn, OreSpawnDTO } from "./CargoDrop";
import {
    CompletedQuestDTO,
    QuestDTO,
    QuestServer,
    QuestTaskDTO,
} from "./QuestServer";
import { RankingServer } from "./RankingServer";
import { Worker } from "worker_threads";
import { ConsumableItemReward } from "./Reward";

export const tickrate = 20;

export class GameServer {
    spacemaps: Spacemaps;
    players: Player[];
    damageEvents: DamageEvent[];
    io: Server;
    tickRate: number;
    gameLoop: NodeJS.Timeout | null;
    _spacemapNames: string[];
    chatServer: ChatServer;
    rewardServer: RewardServer;
    questServer: QuestServer;
    rankingServer: RankingServer;
    shop: Shop;
    admins: string[];
    tickCount: number = 0;

    sendMapDataWorker: Worker;

    _version: string;

    public constructor(io: Server) {
        this.players = [];
        this.spacemaps = {};
        this.damageEvents = [];
        this.io = io;
        this.tickRate = tickrate;
        this.gameLoop = null;
        this._loadSpacemapsFromConfig();
        this._spacemapNames = Object.keys(this.spacemaps);
        this.chatServer = new ChatServer(this);
        this.rewardServer = new RewardServer();
        this.questServer = new QuestServer();
        this.rankingServer = new RankingServer();
        this.shop = new Shop();
        this.admins = ["rostik", "rory", "duma", "bedun", "hhhh"];
        this._version = readPackageJson().version;
        this.sendMapDataWorker = this.createWorker();
    }

    private createWorker() {
        const worker = new Worker(
            new URL("sendMapDataWorker.js", import.meta.url)
        );
        worker.on("error", (error) => {
            console.error(`Worker error: ${error}`);
        });
        worker.on("exit", (code) => {
            if (code !== 0) {
                console.log(`Worker stopped with exit code ${code}`);
            }
        });
        worker.on(
            "message",
            (
                data: {
                    player: Player;
                    entitiesDTO: (Entity | AlienDTO | PlayerDTO)[];
                    projectilesDTO: (
                        | LaserProjectileDTO
                        | RocketProjectileDTO
                    )[];
                    cargoboxes: CargoDrop[];
                    oreSpawnDTO: OreSpawnDTO[];
                    size: SpacemapSize;
                }[]
            ) => {
                data.forEach((e) => {
                    this.io.to(e.player.socketId).emit("mapData", {
                        name: e.player.currentMap,
                        entities: e.entitiesDTO,
                        projectiles: e.projectilesDTO,
                        cargoboxes: e.cargoboxes,
                        oreSpawnDTO: e.oreSpawnDTO,
                        size: e.size,
                    });
                });
            }
        );

        return worker;
    }

    public async getPlayerBySocketId(
        socketId: string
    ): Promise<Player | undefined> {
        return this.players.find((player) => player.socketId === socketId);
    }

    public async getPlayerByUsername(
        username: string
    ): Promise<Player | undefined> {
        return this.players.find((player) => player.name === username);
    }

    public async getPlayerByUUID(uuid: string): Promise<Player | undefined> {
        return this.players.find((player) => player.uuid === uuid);
    }

    public async attemptTeleport(playerName: string): Promise<void> {
        const _findClosestPortal = (
            portals: (Portal | Alien | Entity | Player)[],
            targetPos: Vector2D
        ): Portal | undefined => {
            if (portals.length === 0) return undefined;

            let closestPortal = portals[0];
            let closestDistance = this._getBADDistance(
                portals[0].position,
                targetPos
            );

            for (let i = 1; i < portals.length; i++) {
                const currentDistance = this._getBADDistance(
                    portals[i].position,
                    targetPos
                );
                if (currentDistance < closestDistance) {
                    closestPortal = portals[i];
                    closestDistance = currentDistance;
                }
            }

            if (closestPortal instanceof Portal) return closestPortal;
        };
        try {
            const player = await this.getPlayerByUsername(playerName);
            if (player) {
                const portals = this.spacemaps[
                    player.currentMap
                ].entities.filter((ent) => ent instanceof Portal);

                const closestPortal = _findClosestPortal(
                    portals,
                    player.position
                );
                const oldMap = this.spacemaps[player.currentMap];
                oldMap.entities.filter((e) => e.name !== playerName);
                if (closestPortal) {
                    if (
                        Math.pow(
                            closestPortal.position.x - player.position.x,
                            2
                        ) +
                        Math.pow(
                            closestPortal.position.y - player.position.y,
                            2
                        ) >
                        Math.pow(closestPortal.safeZoneRadii, 2)
                    )
                        return;

                    const targetPos = this.spacemaps[
                        closestPortal.destination
                    ].entities.filter((e) => {
                        if (e instanceof Portal) {
                            if (e.destination == oldMap.name) {
                                return true;
                            }
                        }
                    })[0].position;
                    this.sendPlayerToNewMap(
                        player,
                        closestPortal.destination,
                        targetPos
                    );
                }
            } else {
                console.error("Player not found");
            }
        } catch (error) {
            console.error("An error occurred:", error);
        }
    }

    _loadSpacemapsFromConfig() {
        const gameDataConfig: GameDataConfig = readGameDataConfigFiles();
        for (const key in gameDataConfig) {
            if (gameDataConfig.hasOwnProperty(key)) {
                const _spacemapConfig = gameDataConfig[key];
                const _spacemap: Spacemap = new Spacemap(_spacemapConfig);
                _spacemap.loadStaticEntities();
                this.spacemaps[key] = _spacemap;
            }
        }
    }

    async isInMapBounds(_roamDestination: { x: number, y: number }, mapSize: SpacemapSize) {
        if (_roamDestination == null) return false;

        const halfMapWidth = mapSize.width / 2;
        const halfMapHeight = mapSize.height / 2;

        if (
            _roamDestination.x > halfMapWidth ||
            _roamDestination.x < -halfMapWidth ||
            _roamDestination.y > halfMapHeight ||
            _roamDestination.y < -halfMapHeight
        ) {
            return false;
        }

        return true;
    }

    async loadNewPlayer(socketId: string, username: string, companyName?: string) {
        if (!companyName) {
            const company = await getPlayerCompany(username);
            for (const mapName in this.spacemaps) {
                for (const entity of this.spacemaps[mapName].entities) {
                    if (entity instanceof CompanyBase && company[0].company === entity.name.slice(0, 3)) {
                        const player = new Player(socketId, this.spacemaps[entity.currentMap], username);
                        player.company = company[0].company;
                        return;
                    }
                }
            }
        }

        for (const mapName in this.spacemaps) {
            for (const entity of this.spacemaps[mapName].entities) {
                if (entity instanceof CompanyBase && companyName && companyName === entity.name.slice(0, 3)) {
                    await setPlayerPosition(username, entity.currentMap, entity.position.x, entity.position.y);

                    const player = new Player(socketId, this.spacemaps[entity.currentMap], username);
                    player.company = entity.name.slice(0, 3);

                    return;
                }
            }
        }
    }

    async processAILogic() {
        await Promise.all([
            this.proccessRandomSpawns(),
            this.proccessRandomMovements(),
            this.processAlienRepairs(),
            this.processAlienAttackBehavior(),
            this.processPvpStates()
        ]);
    }

    async sendPlayerToNewMap(
        player: Player,
        newMapName: string,
        targetPos?: Vector2D
    ) {
        const oldMapName = player.currentMap;
        player.currentMap = newMapName;

        // Remove player from old map

        this.spacemaps[oldMapName].entities = this.spacemaps[
            oldMapName
        ].entities.filter((entity) => entity.uuid !== player.uuid);

        // Remove player as targetUUID from aliens/players
        this.spacemaps[oldMapName].entities.forEach((entity) => {
            if (
                (entity instanceof Alien || entity instanceof Player) &&
                entity.targetUUID == player.uuid
            ) {
                entity.targetUUID = undefined;
            }
        });

        this.spacemaps[player.currentMap].entities.push(player);

        if (targetPos) {
            player.position = { x: targetPos.x, y: targetPos.y };
        } else {
            player.position = { x: 0, y: 0 };
        }
        player.isShooting = false;
        player.destination = undefined;
        player.targetUUID = undefined;
        this.spacemaps[oldMapName].entities.forEach((entity) => {
            if (entity instanceof Alien || entity instanceof Player) {
                // TODO: Do the same for players!
                if (entity.targetUUID == player.uuid) {
                    entity.resetTargetUUID();
                }
            }
        });
    }

    async processAlienAttackBehavior() {
        if (this.tickCount === tickrate - 1) {
            for (const spacemapName in this._spacemapNames) {
                this.spacemaps[
                    this._spacemapNames[spacemapName]
                ].entities.forEach((entity) => {
                    if (
                        entity instanceof Alien &&
                        entity.movementBehaviour.attackBehaviour ==
                        "aggressive" &&
                        !entity.targetUUID
                    ) {
                        this.spacemaps[
                            this._spacemapNames[spacemapName]
                        ].entities.forEach((player) => {
                            if (player instanceof Player && player.pvpStateCharacteristic == "attackable") {
                                const dx = player.position.x - entity.position.x;
                                const dy = player.position.y - entity.position.y;
                                const distance = Math.sqrt(dx ** 2 + dy ** 2);
                                if (
                                    distance <=
                                    entity.movementBehaviour.aggroRadius
                                ) {
                                    entity.setTargetUUID(player.uuid);
                                    return;
                                }
                            }
                        });
                    }
                });
            }
        }
    }

    async processPvpStates() {
        if (this.tickCount == tickrate - 2) {
            for (const spacemapName in this._spacemapNames) {
                this.spacemaps[
                    this._spacemapNames[spacemapName]
                ].entities.forEach((entity) => {
                    if (entity instanceof Player) {
                        entity.updatePvpState();
                    }
                });
            }
        }
    }

    async processAlienRepairs() {
        if (this.tickCount == tickrate - 1) {
            for (const spacemapName in this._spacemapNames) {
                this.spacemaps[
                    this._spacemapNames[spacemapName]
                ].entities.forEach((entity) => {
                    if (entity instanceof Alien) {
                        entity.repair();
                    }
                });
            }
        }
    }

    async proccessRandomMovements() {
        for (const spacemapName in this._spacemapNames) {
            const mapWidth =
                this.spacemaps[this._spacemapNames[spacemapName]].getMapSize()
                    .mapSize.width;
            const mapHeight =
                this.spacemaps[this._spacemapNames[spacemapName]].getMapSize()
                    .mapSize.height;

            this.spacemaps[this._spacemapNames[spacemapName]].entities.forEach(
                async (entity) => {
                    if (entity instanceof Alien) {
                        entity.passiveRoam(mapWidth, mapHeight);
                    }
                }
            );
        }
    }

    async proccessRandomSpawns() {
        if (this.tickCount == tickrate - 1) {
            for (const spacemapName in this._spacemapNames) {
                this.spacemaps[
                    this._spacemapNames[spacemapName]
                ].randomSpawnAlien();
            }
        }
        if (this.tickCount == tickrate - 1) {
            for (const spacemapName in this._spacemapNames) {
                this.spacemaps[
                    this._spacemapNames[spacemapName]
                ].randomSpawnOreSpawn();
            }
        }
    }

    async processPlayerInputs() {
        this.players.forEach((player) => {
            if (player.destination) {
                player.flyToDestination();
            }
            if (player.isCollectingCollectable && player.targetCollectable) {
                if (
                    Math.abs(
                        player.position.x - player.targetCollectable.position.x
                    ) < 0.05 &&
                    Math.abs(
                        player.position.y - player.targetCollectable.position.y
                    ) < 0.05
                ) {
                    this.rewardServer.registerCollectionReward(
                        player.uuid,
                        player.targetCollectable
                    );

                    this.questServer.registerOreCollection({
                        playerUUID: player.uuid,
                        collectable: player.targetCollectable,
                        map: player.targetCollectable.currentMap,
                    });

                    switch (player.targetCollectable._type) {
                        case "OreSpawn":
                            this.spacemaps[
                                player.targetCollectable.currentMap
                            ].oreSpawns = this.spacemaps[
                                player.targetCollectable.currentMap
                            ].oreSpawns.filter((oreSpawns) => {
                                return (
                                    oreSpawns.uuid !==
                                    player.targetCollectable?.uuid
                                );
                            });

                            break;

                        case "CargoDrop":
                            this.spacemaps[
                                player.targetCollectable.currentMap
                            ].cargoboxes = this.spacemaps[
                                player.targetCollectable.currentMap
                            ].cargoboxes.filter((cargobox) => {
                                return (
                                    cargobox.uuid !==
                                    player.targetCollectable?.uuid
                                );
                            });

                            break;
                    }
                    player.isCollectingCollectable = false;
                    player.targetCollectable = undefined;
                }
            }
        });
    }

    async handleDamage() {
        this.damageEvents.forEach(async (damageEvent) => {
            if (damageEvent.attackerUUID) {
                let damage: number = 0;
                const attackerEntity: Entity | Alien | Player | undefined =
                    await this.getEntityByUUID(damageEvent.attackerUUID);

                const defenderEntity: Entity | Alien | Player | undefined =
                    await this.getEntityByUUID(damageEvent.defenderUUID);

                if (damageEvent.damage) {
                    damage = damageEvent.damage;
                }
                if (
                    (attackerEntity && attackerEntity instanceof Player) ||
                    attackerEntity instanceof Alien
                ) {
                    const _damage = await attackerEntity.giveDamage();
                    if (_damage && damage == 0) {
                        damage = _damage;
                    }
                }
                if (
                    defenderEntity &&
                    (defenderEntity instanceof Player ||
                        defenderEntity instanceof Alien)
                ) {
                    // defenderEntity.targetUUID = attackerEntity?.uuid;
                    defenderEntity.receiveDamage(damage, attackerEntity?.uuid);
                }
            }
        });
        this.damageEvents = [];
    }

    async handleCurrencyTransactions() {
        for (const reward of this.rewardServer.pendingRewards) {
            console.log(
                `Registered following reward: ${JSON.stringify(reward)}`
            );
            const player = await this.getPlayerByUUID(reward.recipientUUID);
            if (player) {
                this.rewardServer.issueReward(player, reward);
                if ((reward as ConsumableItemReward).consumable) {
                    this.io.to(player.socketId).emit("emitRewardInfoToUser", {
                        reward: reward,
                        consumed: true,
                    });
                } else {
                    this.io.to(player.socketId).emit("emitRewardInfoToUser", {
                        reward: reward,
                        consumed: false,
                    });
                }
            } else {
                console.log(
                    `Could not find player with uuid ${reward.recipientUUID} to issue them a reward.`
                );
            }
        }
        this.rewardServer.pendingRewards = [];
    }

    async handleEntityKills() {
        // TODO: Kill players too, for now only aliens
        for (const spacemapName of this._spacemapNames) {
            const spacemap = this.spacemaps[spacemapName];
            spacemap.entities = spacemap.entities.filter((entity) => {
                if (
                    entity instanceof Alien &&
                    entity.hitPoints.hullPoints <= 0
                ) {
                    if (entity.lastAttackedByUUID) {
                        this.rewardServer.registerAlienKillReward(
                            entity.lastAttackedByUUID,
                            entity.killReward
                        );

                        this.questServer.registerAlienKill({
                            playerUUID: entity.lastAttackedByUUID,
                            entityName: entity.name,
                            map: spacemap.name,
                        });
                    }
                    if (entity.cargoDrop) {
                        const cargoContents = { ...entity.cargoDrop };
                        cargoContents.position = entity.position;
                        spacemap.spawnCargoBoxFromAlien(cargoContents);
                    }

                    for (const player of this.players) {
                        if (player.targetUUID == entity.uuid) {
                            player.targetUUID = undefined;
                        }
                    }

                    console.log(
                        `Removed ${entity.name} from map ${spacemapName} because its HP finished.`
                    );
                    return false;
                } else if (
                    entity instanceof Player &&
                    entity.hitPoints.hullPoints <= 0
                ) {
                    entity.hitPoints.hullPoints = 10000;
                    for (const mapName in this.spacemaps) {
                        for (const companyBase of this.spacemaps[mapName].entities) {
                            if (companyBase instanceof CompanyBase && companyBase.name.slice(0, 3) === entity.company) {
                                this.sendPlayerToNewMap(entity, companyBase.currentMap, { x: companyBase.position.x, y: companyBase.position.y });

                                return true;
                            }
                        }
                    }
                }
                return true;
            });
        }
    }

    async sendMapData() {
        this.sendMapDataWorker.postMessage({
            players: this.players,
            spacemaps: this.spacemaps,
        });
    }

    async registerPlayerAttackEvent(data: {
        playerName: string;
        targetUUID: string;
        weapons: string;
        ammo: string;
    }) {
        const [attacker, target] = await Promise.all([
            this.getPlayerByUsername(data.playerName),
            this.getEntityByUUID(data.targetUUID),
        ]);

        if (attacker && target) {

            if (attacker instanceof Player) attacker.pvpStateCharacteristic = "attackable"
            if (target instanceof Player && target.pvpStateCharacteristic == "pvp-protected") return;

            if (attacker.targetUUID != data.targetUUID) {
                attacker.isShooting = false;
            }

            if (data.weapons == "lasers") {
                if (attacker.isShooting) {
                    attacker.isShooting = false;
                    attacker.targetUUID = undefined;
                } else {
                    if (data.weapons == "lasers") {
                        if (
                            attacker._getAmmoAmountByName(data.ammo) >=
                            attacker._getLaserAmmoPerShot()
                        ) {
                            attacker.isShooting = true;
                            attacker.targetUUID = target.uuid;
                            attacker.shootLaserProjectileAtTarget(
                                target as Player | Alien,
                                data.ammo
                            );
                        }
                    }
                }
            } else if (data.weapons == "rockets") {
                attacker.inventory.selectedRocketAmmo =
                    await attacker.inventory.findRocketAmmoByName(
                        `${data.ammo}`
                    );

                if (attacker._getAmmoAmountByName(data.ammo) >= 1) {
                    attacker.shootRocketProjectileAtTarget(
                        target as Player | Alien,
                        data.ammo
                    );
                }
            }
        }
    }

    async registerAlienAttackEvent(data: {
        alienUUID: string;
        targetUUID: string;
    }) {
        const [attacker, target] = await Promise.all([
            this.getEntityByUUID(data.alienUUID),
            this.getPlayerByUUID(data.targetUUID),
        ]);

        if (attacker && target) {
            if (attacker instanceof Alien) {
                attacker.shootProjectileAtTarget(target);
            }
        }
    }

    async registerPlayerUseItemEvent(data: {
        playerName: string;
        itemName: string;
    }) {
        const player = await this.getPlayerByUsername(data.playerName);
        if (player) {
            const itemToUse = await player.inventory.useConsumableItem(
                data.itemName
            );
            if (itemToUse) {
                this.rewardServer.registerConsumableItemReward(
                    player.uuid,
                    itemToUse
                );
            } else {
                console.log(
                    `Player ${data.playerName} tried to use item they do not own`
                );
            }
        }
    }

    async handleProjectiles() {
        for (const spacemapName of this._spacemapNames) {
            for (const projectile of this.spacemaps[spacemapName]
                .projectileServer.projectiles) {
                projectile.moveToTarget();
                if (projectile.getDistanceToTarget() < 0.01) {
                    if (projectile instanceof LaserProjectile) {
                        this.damageEvents.push(
                            new DamageEvent(
                                projectile.target.uuid,
                                projectile.attacker.uuid,
                                projectile.damageAmount
                            )
                        );
                    } else if (projectile instanceof RocketProjectile) {
                        const hittableAliens = this.spacemaps[
                            spacemapName
                        ].entities.filter((entity) => {
                            if (entity instanceof Alien) {
                                if (
                                    (projectile.position.x -
                                        entity.position.x) **
                                    2 +
                                    (projectile.position.y -
                                        entity.position.y) **
                                    2 <=
                                    projectile.damageRadius
                                ) {
                                    return true;
                                }
                            }
                        });

                        hittableAliens.forEach((alien) => {
                            this.damageEvents.push(
                                new DamageEvent(
                                    alien.uuid,
                                    projectile.attacker.uuid,
                                    projectile.getDamage()
                                )
                            );
                        });
                    } else if (projectile instanceof AlienProjectile) {
                        this.damageEvents.push(
                            new DamageEvent(
                                projectile.target.uuid,
                                projectile.attacker.uuid,
                                projectile.damageAmount
                            )
                        );
                    }

                    this.spacemaps[spacemapName].projectileServer.projectiles =
                        this.spacemaps[
                            spacemapName
                        ].projectileServer.projectiles.filter(
                            (_projectile) =>
                                _projectile.uuid !== projectile.uuid
                        );
                }
            }
        }
    }

    async disconnectPlayerBySocketId(_socketId: string) {
        const disconnectedPlayerIndex = this.players.findIndex(
            (player) => player.socketId === _socketId
        );

        if (disconnectedPlayerIndex !== -1) {
            const disconnectedPlayer = this.players[disconnectedPlayerIndex];
            const spacemap = this.spacemaps[disconnectedPlayer.currentMap];

            spacemap.entities.forEach((entity) => {
                if (entity instanceof Alien || entity instanceof Player) {
                    if (entity.targetUUID == disconnectedPlayer.uuid) {
                        entity.targetUUID = undefined;
                    }
                }
            });

            const playerIndexInSpacemap = spacemap.entities.findIndex(
                (entity) =>
                    entity instanceof Player && entity.socketId === _socketId
            );

            if (playerIndexInSpacemap !== -1) {
                spacemap.entities.splice(playerIndexInSpacemap, 1);
            }

            if (disconnectedPlayer.stats) {
                savePlayerData(disconnectedPlayer);
            }

            if (disconnectedPlayer.currentActiveQuests) {
                const questDTO = disconnectedPlayer.currentActiveQuests.map(
                    (quest) => {
                        const tasksDTO = quest.tasks.map(
                            (task) =>
                                new QuestTaskDTO(
                                    task._id,
                                    task.currentAmount,
                                    task.completed
                                )
                        );
                        return new QuestDTO(quest.questName, tasksDTO);
                    }
                );

                saveCurrentQuests({
                    username: disconnectedPlayer.name,
                    currentQuests: questDTO,
                });
            }

            if (disconnectedPlayer.completedQuests) {
                const completedQuestsDTO =
                    disconnectedPlayer.completedQuests.map(
                        (quest) => new CompletedQuestDTO(quest.questName)
                    );

                saveCompletedQuests({
                    username: disconnectedPlayer.name,
                    completedQuests: completedQuestsDTO,
                });
            }

            console.log(`Player ${disconnectedPlayer.name} disconnected`);

            this.players.splice(disconnectedPlayerIndex, 1);
        }
    }

    async updateGameWorld() {
        try {
            this.sendMapData();
            Promise.all([
                this.processAILogic(),
                this.processPlayerInputs(),
                this.handleProjectiles(),
                this.handleDamage(),
                this.handleEntityKills(),
                this.handleCurrencyTransactions(),
            ]);
        } catch (error) {
            console.log(
                `Error in the game server: ${JSON.stringify(error as Error)}`
            );
        }
    }

    async addPlayerMoveToDestination(
        targetPosition: { x: number; y: number },
        socketId: string
    ) {
        const player = await this.getPlayerBySocketId(socketId);
        if (player) {
            player.isCollectingCollectable = false;
            player.targetCollectable = undefined;
            player.destination = targetPosition;
        }
    }

    public async getEntityByUUID(
        uuid: string
    ): Promise<Alien | Player | Entity | undefined> {
        return new Promise<Alien | Player | Entity | undefined>(
            (resolve, reject) => {
                for (const spacemapName of this._spacemapNames) {
                    const spacemap = this.spacemaps[spacemapName];
                    const entity = spacemap.entities.find(
                        (e) => e.uuid === uuid
                    );
                    if (entity) {
                        resolve(entity);
                        return;
                    }
                }
                resolve(undefined);
            }
        );
    }

    public async addPlayerCollectCargoDrop(
        cargoDrop: CargoDrop,
        player: Player
    ) {
        await this.addPlayerMoveToDestination(
            cargoDrop.position,
            player.socketId
        );

        player.isCollectingCollectable = true;
        player.targetCollectable = cargoDrop;
    }

    public async addPlayerCollectOreSpawn(oreSpawn: OreSpawn, player: Player) {
        await this.addPlayerMoveToDestination(
            oreSpawn.position,
            player.socketId
        );

        player.isCollectingCollectable = true;
        player.targetCollectable = oreSpawn;
    }

    _getBADDistance(position1: Vector2D, position2: Vector2D) {
        const dx = position1.x - position2.x;
        const dy = position1.y - position2.y;
        return dx * dx + dy * dy;
    }

    startServer() {
        // TODO: Wait for previous tick completion?

        if (this.gameLoop === null) {
            this.rankingServer.start();
            this.gameLoop = setInterval(() => {
                this.updateGameWorld();
                this.tickCount++;
                if (this.tickCount >= tickrate) {
                    this.tickCount = 0;
                }
            }, 1000 / this.tickRate);
        }
    }

    stopGameLoop() {
        if (this.gameLoop !== null) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
    }
}
