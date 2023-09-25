import { Alien, AlienDTO } from "./Alien";
import { Player, PlayerDTO } from "./Player";
import { Spacemap, Spacemaps } from "./Spacemap";
import { GameDataConfig, readGameDataConfigFiles } from "./loadGameData";
import { Server, Socket } from "socket.io";
import { savePlayerData } from "../db/db";
import { ChatServer } from "./ChatServer";
import { DamageEvent } from "./DamageEvent";
import { Entity } from "./Entity";
import { RewardServer } from "./RewardServer";
import { LaserProjectile, LaserProjectileDTO } from "./Projectiles";

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

    _loadSpacemapsFromConfig() {
        const gameDataConfig: GameDataConfig = readGameDataConfigFiles();
        for (const key in gameDataConfig) {
            if (gameDataConfig.hasOwnProperty(key)) {
                const _spacemapConfig = gameDataConfig[key];
                const _spacemap: Spacemap = new Spacemap(_spacemapConfig);
                this.spacemaps[key] = _spacemap;
            }
        }
    }

    async loadNewPlayer(socketId: string, username: string) {
        const player = new Player(socketId, username);
        this.players.push(player);
        this.spacemaps[player.currentMap].entities.push(player);
    }

    async processAILogic() {
        await Promise.all([
            this.proccessRandomSpawns(),
            this.proccessRandomMovements(),
        ]);
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
                    if (_damage) {
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
                    return new PlayerDTO(entity);
                } else {
                    return entity;
                }
            });

            const projectilesDTO = mapData.projectileServer.projectiles.map(
                (projectile) => {
                    if (projectile instanceof LaserProjectile) {
                        return new LaserProjectileDTO(projectile);
                    }
                }
            );

            this.io.to(player.socketId).emit("mapData", {
                name: mapData.name,
                entities: entitiesDTO,
                projectiles: projectilesDTO,
                size: mapData.size,
            });
        });
    }

    async registerPlayerAttackEvent(data: {
        playerName: string;
        targetUUID: string;
    }) {
        const [attacker, target] = await Promise.all([
            this.getPlayerByUsername(data.playerName),
            this.getEntityByUUID(data.targetUUID),
        ]);
        if (attacker && target && attacker.reloadState == "canShoot") {
            attacker.reloadState = "reloading";
            this.spacemaps[
                attacker.currentMap
            ].projectileServer.createProjectile(
                "LaserProjectile",
                attacker,
                target
            );
            attacker._reload();
        }
    }

    async handleProjectiles() {
        for (const spacemapName of this._spacemapNames) {
            for (const projectile of this.spacemaps[spacemapName]
                .projectileServer.projectiles) {
                projectile.moveToTarget();
                if (projectile.getDistanceToTarget() < 0.1) {
                    this.damageEvents.push(
                        new DamageEvent(
                            projectile.target.uuid,
                            projectile.attacker.uuid
                        )
                    );
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

            // Implement any additional cleanup or handling logic here if needed

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
