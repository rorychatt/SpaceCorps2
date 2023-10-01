import {
    PlayerEntityInterface,
    getInventoryData,
    getUserDataByUsername,
} from "../db/db";
import { gameServer } from "../main";
import { Alien, Durability } from "./Alien";
import { Entity } from "./Entity";
import { tickrate } from "./GameServer";
import {
    Inventory,
    Laser,
    ShieldGenerator,
    ShipItem,
    SpeedGenerator,
} from "./Inventory";
import { Spacemap, Vector2D } from "./Spacemap";

export class Player extends Entity {
    _type: string = "Player";
    socketId: string;
    state: PlayerStateCharacteristic = "passive";
    hitPoints: Durability;
    stats: PlayerStats;
    damage: PlayerDamageCharacteristic;
    company: string = "MMF";
    destination?: Vector2D | null;
    reloadState: ReloadStateCharacteristic = "canShoot";
    lastAttackedByUUID?: string;
    speed: number = 150;
    inventory: Inventory = new Inventory();
    _activeShip: ShipItem | undefined;
    isShooting: boolean = false;
    targetUUID: string | undefined = undefined;

    public constructor(socketId: string, map: Spacemap, username: string) {
        super(map.name, username);

        this.socketId = socketId;
        this.damage = {
            maxDamage: 800,
            variance: 0.1,
        };
        this.hitPoints = {
            hullPoints: 10000,
            shieldPoints: 0,
            shieldAbsorbance: 0,
        };

        this.stats = {
            experience: 0,
            honor: 0,
            credits: 0,
            thulium: 0,
        };

        this._initializePlayerData().then(() => {
            gameServer.players.push(this);
            gameServer.spacemaps[this.currentMap].entities.push(this);
        });
    }

    private async _initializePlayerData() {
        await this._getDataFromSQL();
        this._activeShip = await this.inventory.getActiveShip();
        this._calculateSpeed();
    }

    async _getDataFromSQL() {
        let templateData = {
            currentMap: "M-1",
            company: "MMF",
            positionX: 0,
            positionY: 0,
            credits: 0,
            thulium: 0,
            experience: 0,
            honor: 0,
        };
        const res = (await getUserDataByUsername(
            this.name
        )) as PlayerEntityInterface[];
        const res2 = await getInventoryData(this.name);
        if (res && res.length > 0) {
            const data = res[0];
            templateData = {
                currentMap: data.mapName,
                company: data.company,
                positionX: data.positionX,
                positionY: data.positionY,
                credits: data.credits,
                thulium: data.thulium,
                experience: data.experience,
                honor: data.honor,
            };
        }

        if (res2[0]) {
            for (const laser in res2[0].lasers) {
                this.inventory.lasers.push(
                    new Laser(res2[0].lasers[laser].name)
                );
            }
            for (const shieldGenerator in res2[0].shieldGenerators) {
                this.inventory.shieldGenerators.push(
                    new ShieldGenerator(
                        res2[0].shieldGenerators[shieldGenerator].name
                    )
                );
            }
            for (const speedGenerator in res2[0].speedGenerators) {
                this.inventory.speedGenerators.push(
                    new SpeedGenerator(
                        res2[0].speedGenerators[speedGenerator].name
                    )
                );
            }
            for (const ship in res2[0].ships) {
                this.inventory.ships.push(
                    new ShipItem(
                        res2[0].ships[ship].name,
                        res2[0].ships[ship].isActive
                    )
                );
                for (const laser in res2[0].ships[ship].currentLasers) {
                    this.inventory.putLaserToShip(
                        res2[0].ships[ship].currentLasers[laser].name,
                        res2[0].ships[ship].name,
                        true
                    );
                }
                for (const generator in res2[0].ships[ship].currentGenerators) {
                    if (
                        res2[0].ships[ship].currentGenerators[
                            generator
                        ]._type == "ShieldGenerator"
                    ) {
                        this.inventory.putShieldGeneratorToShip(
                            res2[0].ships[ship].currentGenerators[
                                generator
                            ].name,
                            res2[0].ships[ship].name,
                            true
                        );
                    } else if (
                        res2[0].ships[ship].currentGenerators[
                            generator
                        ]._type == "SpeedGenerator"
                    ) {
                        this.inventory.putSpeedGeneratorToShip(
                            res2[0].ships[ship].currentGenerators[
                                generator
                            ].name,
                            res2[0].ships[ship].name,
                            true
                        );
                    }
                }
            }
        }
        this.currentMap = templateData.currentMap;
        this.position = {
            x: templateData.positionX,
            y: templateData.positionY,
        };
        this.stats = {
            credits: templateData.credits,
            thulium: templateData.thulium,
            experience: templateData.experience,
            honor: templateData.honor,
        };
    }

    async _calculateSpeed() {
        if (this._activeShip) {
            const shipSpeed = this._activeShip.baseSpeed;
            let speedFromGenerators = 0;
            this._activeShip.currentGenerators.forEach((generator) => {
                if (generator instanceof SpeedGenerator) {
                    speedFromGenerators += generator.baseSpeed;
                }
            });
            this.speed = shipSpeed + speedFromGenerators;
        }
    }

    async _calculateShields() {

    }

    async receiveDamage(damage: number, attackerUUID?: string) {
        let shieldDamage: number = damage * this.hitPoints.shieldAbsorbance;
        let hullDamage: number = damage - shieldDamage;

        if (shieldDamage > this.hitPoints.shieldPoints) {
            let excessDamage = shieldDamage - this.hitPoints.shieldPoints;
            hullDamage = hullDamage + excessDamage;
            this.hitPoints.shieldPoints = 0;
        } else {
            this.hitPoints.shieldPoints =
                this.hitPoints.shieldPoints - shieldDamage;
        }

        this.hitPoints.hullPoints = this.hitPoints.hullPoints - hullDamage;

        if (attackerUUID) {
            this.lastAttackedByUUID = attackerUUID;
        }

        console.log(
            `${this.name} got shot by ${damage} damage and now has ${this.hitPoints.hullPoints} HP and ${this.hitPoints.shieldPoints} SP`
        );
    }

    async giveDamage() {
        let totalDamage = 0;
        if (this._activeShip) {
            for (const _laser in this._activeShip.currentLasers) {
                const laser = this._activeShip.currentLasers[_laser];
                const isCritical = Math.random() <= laser.criticalChance;
                const damageMultiplier = isCritical
                    ? laser.criticalMultiplier
                    : 1;
                totalDamage +=
                    laser.maxDamage *
                    (1 - Math.random() * laser.damageVariance) *
                    damageMultiplier;
            }
        }
        return totalDamage;
    }

    shootProjectileAtTarget(target: Alien | Player | Entity) {
        if (this.reloadState == "canShoot") {
            this.reloadState = "reloading";
            gameServer.spacemaps[
                this.currentMap
            ].projectileServer.createProjectile(
                "LaserProjectile",
                this,
                target
            );
            this._reload();
        }
    }

    async _reload() {
        setTimeout(async () => {
            this.reloadState = "canShoot";
            if (this.targetUUID && this.isShooting) {
                const target = await gameServer.getEntityByUUID(
                    this.targetUUID
                );
                if (target) {
                    this.shootProjectileAtTarget(target);
                } else {
                    this.targetUUID = undefined;
                    this.isShooting = false;
                }
            }
        }, 1000);
    }

    async flyToDestination() {
        if (this.destination) {
            const travelledDistance = this.speed / tickrate / 100;
            const direction = {
                x: this.destination.x - this.position.x,
                y: this.destination.y - this.position.y,
            };
            const totalDistance = Math.sqrt(
                direction.x ** 2 + direction.y ** 2
            );
            if (travelledDistance < totalDistance) {
                const dx = (travelledDistance / totalDistance) * direction.x;
                const dy = (travelledDistance / totalDistance) * direction.y;
                this.position = {
                    x: this.position.x + dx,
                    y: this.position.y + dy,
                };
            } else {
                this.destination = null;
            }
        }
    }

    addHonor(honor: number) {
        this.stats.honor = this.stats.honor + honor;
    }

    addExperience(experience: number) {
        this.stats.experience = this.stats.experience + experience;
    }

    addThulium(thulium: number) {
        this.stats.thulium = this.stats.thulium + thulium;
    }

    addCredits(credits: number) {
        this.stats.credits = this.stats.credits + credits;
    }

    removeHonor(honor: number) {
        this.stats.honor = this.stats.honor - honor;
    }

    removeExperience(experience: number) {
        this.stats.experience = this.stats.experience - experience;
    }

    removeCredits(credits: number) {
        this.stats.credits = this.stats.credits - credits;
    }

    removeThulium(thulium: number) {
        this.stats.thulium = this.stats.thulium - thulium;
    }
}

export class PlayerDTO {
    name: string;
    position: Vector2D;
    _type: string;
    hitPoints?: Durability;
    stats?: PlayerStats;
    company?: string;
    targetUUID?: string;
    uuid: string;

    constructor(player: Player) {
        this.name = player.name;
        this.position = player.position;
        this._type = player._type;
        this.hitPoints = player.hitPoints;
        this.stats = player.stats;
        this.company = player.company;
        this.uuid = player.uuid;
        this.targetUUID = player.targetUUID;
    }
}

export interface PlayerDamageCharacteristic {
    maxDamage: number;
    variance: number;
}

export interface PlayerStats {
    experience: number;
    honor: number;
    credits: number;
    thulium: number;
}

export type PlayerStateCharacteristic = "passive" | "attacking";
export type ReloadStateCharacteristic = "canShoot" | "reloading";
