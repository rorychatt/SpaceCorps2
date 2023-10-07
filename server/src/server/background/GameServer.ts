import { Alien, AlienDTO } from "./Alien";
import { Player, PlayerDTO } from "./Player";
import { Spacemap, Spacemaps, Vector2D } from "./Spacemap";
import { GameDataConfig, readGameDataConfigFiles, readPackageJson } from "./loadGameData";
import { Server, Socket } from "socket.io";
import { savePlayerData } from "../db/db";
import { ChatServer } from "./ChatServer";
import { DamageEvent } from "./DamageEvent";
import { Entity, Portal } from "./Entity";
import { RewardServer } from "./RewardServer";
import {
    LaserProjectile,
    LaserProjectileDTO,
    RocketProjectile,
    RocketProjectileDTO,
} from "./Projectiles";
import { Shop } from "./Shop";

export const tickrate = 120;

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
    shop: Shop;
    admins: string[];
    tickCount: number = 0;

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
        this.shop = new Shop();
        this.admins = ["rostik", "rory", "duma"];
        this._version = readPackageJson().version;
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
        function _findClosestPortal(
            portals: (Portal | Alien | Entity | Player)[],
            targetPos: Vector2D
        ): Portal | undefined {
            if (portals.length === 0) {
                return undefined; // Return null if the array is empty
            }

            let closestPortal = portals[0]; // Initialize with the first portal
            let closestDistance = _getBADDistance(
                portals[0].position,
                targetPos
            );

            for (let i = 1; i < portals.length; i++) {
                const currentDistance = _getBADDistance(
                    portals[i].position,
                    targetPos
                );
                if (currentDistance < closestDistance) {
                    closestPortal = portals[i];
                    closestDistance = currentDistance;
                }
            }

            if (closestPortal instanceof Portal) {
                return closestPortal;
            }
        }

        function _getBADDistance(position1: Vector2D, position2: Vector2D) {
            const dx = position1.x - position2.x;
            const dy = position1.y - position2.y;
            return dx * dx + dy * dy;
        }
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
                    const targetPos = this.spacemaps[
                        closestPortal.destination
                    ].entities.filter((e) => {
                        if (e instanceof Portal) {
                            if ((e.destination = oldMap.name)) {
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

    async loadNewPlayer(socketId: string, username: string) {
        const player = new Player(socketId, this.spacemaps["M-1"], username);
    }

    async processAILogic() {
        await Promise.all([
            this.proccessRandomSpawns(),
            this.proccessRandomMovements(),
            this.processAlienRepairs(),
        ]);
    }

    async sendPlayerToNewMap(
        player: Player,
        newMapName: string,
        targetPos?: Vector2D
    ) {
        player.currentMap = newMapName;
        this.spacemaps[player.currentMap].entities.push(player);
        if (targetPos) {
            player.position = { x: targetPos.x, y: targetPos.y };
        } else {
            player.position = { x: 0, y: 0 };
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
            this.spacemaps[this._spacemapNames[spacemapName]].entities.forEach(
                (entity) => {
                    if (entity instanceof Alien) {
                        entity.passiveRoam();
                    }
                }
            );
        }
    }

    async proccessRandomSpawns() {
        for (const spacemapName in this._spacemapNames) {
            this.spacemaps[
                this._spacemapNames[spacemapName]
            ].randomSpawnAlien();
        }
    }

    async processPlayerInputs() {
        this.players.forEach((player) => {
            if (player.destination) {
                player.flyToDestination();
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
                this.io.to(player.socketId).emit("emitRewardInfoToUser", {
                    reward: reward,
                });
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
                    }
                    if (entity.cargoDrop) {
                        const cargoContents = { ...entity.cargoDrop };
                        cargoContents.position = entity.position;
                        spacemap.spawnCargoBoxFromAlien(cargoContents);
                    }
                    console.log(
                        `Removed ${entity.name} from map ${spacemapName} because its HP finished.`
                    );
                    return false;
                }
                return true;
            });
        }
    }

    async sendMapData() {
        this.players.forEach((player) => {
            const mapData: Spacemap = this.spacemaps[player.currentMap];

            let entitiesDTO = mapData.entities.map((entity) => {
                if (entity instanceof Alien) {
                    return new AlienDTO(entity);
                } else if (entity instanceof Player) {
                    if (entity.name == player.name) {
                        return entity;
                    } else {
                        return new PlayerDTO(entity);
                    }
                } else {
                    return entity;
                }
            });

            const projectilesDTO = mapData.projectileServer.projectiles.map(
                (projectile) => {
                    if (projectile instanceof LaserProjectile) {
                        return new LaserProjectileDTO(projectile);
                    } else if (projectile instanceof RocketProjectile) {
                        return new RocketProjectileDTO(projectile);
                    }
                }
            );

            this.io.to(player.socketId).emit("mapData", {
                name: mapData.name,
                entities: entitiesDTO,
                projectiles: projectilesDTO,
                cargoboxes: mapData.cargoboxes,
                size: mapData.size,
            });
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
                attacker.targetUUID = target.uuid;
                attacker.shootRocketProjectileAtTarget(
                    target as Player | Alien,
                    data.ammo
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

            console.log(`Player ${disconnectedPlayer.name} disconnected`);

            this.players.splice(disconnectedPlayerIndex, 1);
        }
    }

    async updateGameWorld() {
        try {
            await Promise.all([
                this.processAILogic(),
                this.processPlayerInputs(),
                this.handleProjectiles(),
                this.handleDamage(),
                this.handleEntityKills(),
                this.handleCurrencyTransactions(),
            ]);

            this.sendMapData();
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

    startServer() {
        // TODO: Wait for previous tick completion?

        if (this.gameLoop === null) {
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
