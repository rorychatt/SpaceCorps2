import {
    PlayerEntityInterface,
    getInventoryData,
    getUserDataByUsername,
} from "../db/db";
import { gameServer } from "../main";
import { Alien, Durability } from "./Alien";
import { CargoDrop } from "./CargoDrop";
import { Entity } from "./Entity";
import { tickrate } from "./GameServer";
import {
    CreditsItem,
    ExperienceItem,
    HonorItem,
    Inventory,
    Laser,
    LaserAmmo,
    RocketAmmo,
    ShieldGenerator,
    ShipItem,
    SpeedGenerator,
    ThuliumItem,
} from "./Inventory";
import { Quest } from "./QuestServer";
import { Spacemap, Vector2D } from "./Spacemap";

export class Player extends Entity {
    _type: string = "Player";
    socketId: string;
    state: PlayerStateCharacteristic = "passive";
    hitPoints: Durability;
    stats: PlayerStats;
    damage: PlayerDamageCharacteristic;
    company: string = "MCC";
    destination?: Vector2D | null;
    reloadState: ReloadStateCharacteristic = "canShoot";
    rocketReloadState: ReloadStateCharacteristic = "canShoot";
    lastAttackedByUUID?: string;
    speed: number = 150;
    inventory: Inventory = new Inventory(this.uuid);
    _activeShip: ShipItem | undefined;
    activeShipName: string | undefined;
    isShooting: boolean = false;
    isCollectingCargoDrop: boolean = false;
    targetCargoDrop: CargoDrop | undefined = undefined;
    targetUUID: string | undefined = undefined;
    level: number = 1;
    currentActiveQuests: Quest[] = [];
    completedQuests: { questName: string; completed: boolean }[] = [];

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
            level: 1,
        };

        this._initializePlayerData().then(() => {
            gameServer.players.push(this);
            gameServer.spacemaps[this.currentMap].entities.push(this);
        });
    }

    private async _initializePlayerData() {
        await this._getDataFromSQL();
        this.level =
            await gameServer.rankingServer.experienceServer.calculatePlayerLevel(
                this
            );
        this.refreshActiveShip();
    }

    async addQuest(quest: Quest) {
        this.currentActiveQuests.push(quest);
    }

    async completeQuest(quest: Quest) {
        this.completedQuests.push({ questName: quest.name, completed: true });
    }

    async refreshActiveShip() {
        this._activeShip = await this.inventory.getActiveShip();
        this.activeShipName = this._activeShip?.name;
        this._calculateSpeed();
        this._calculateShields();
        this._calculateCargo();
    }

    async _getDataFromSQL() {
        let templateData = {
            currentMap: "M-1",
            company: "MCC",
            positionX: 0,
            positionY: 0,
            credits: 0,
            thulium: 0,
            experience: 0,
            honor: 0,
            level: 1,
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
                level: data.level,
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
                        res2[0].ships[ship].currentGenerators[generator]
                            ._type == "ShieldGenerator"
                    ) {
                        this.inventory.putShieldGeneratorToShip(
                            res2[0].ships[ship].currentGenerators[generator]
                                .name,
                            res2[0].ships[ship].name,
                            true
                        );
                    } else if (
                        res2[0].ships[ship].currentGenerators[generator]
                            ._type == "SpeedGenerator"
                    ) {
                        this.inventory.putSpeedGeneratorToShip(
                            res2[0].ships[ship].currentGenerators[generator]
                                .name,
                            res2[0].ships[ship].name,
                            true
                        );
                    }
                }
            }
            for (const ammo in res2[0].ammunition) {
                if (res2[0].ammunition[ammo]._type == "LaserAmmo") {
                    this.inventory.ammunition.push(
                        new LaserAmmo(
                            res2[0].ammunition[ammo].name,
                            res2[0].ammunition[ammo].amount
                        )
                    );
                } else if (res2[0].ammunition[ammo]._type == "RocketAmmo") {
                    this.inventory.ammunition.push(
                        new RocketAmmo(
                            res2[0].ammunition[ammo].name,
                            res2[0].ammunition[ammo].amount
                        )
                    );
                }
            }

            for (const consumable in res2[0].consumables) {
                if (res2[0].consumables[consumable]._type == "CreditsItem") {
                    this.inventory.consumables.push(
                        new CreditsItem(res2[0].consumables[consumable].name)
                    );
                } else if (
                    res2[0].consumables[consumable]._type == "ThuliumItem"
                ) {
                    this.inventory.consumables.push(
                        new ThuliumItem(res2[0].consumables[consumable].name)
                    );
                } else if (
                    res2[0].consumables[consumable]._type == "ExperienceItem"
                ) {
                    this.inventory.consumables.push(
                        new ExperienceItem(res2[0].consumables[consumable].name)
                    );
                } else if (
                    res2[0].consumables[consumable]._type == "HonorItem"
                ) {
                    this.inventory.consumables.push(
                        new HonorItem(res2[0].consumables[consumable].name)
                    );
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
            level: templateData.level,
        };
        this.refreshActiveShip();
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

    async _calculateShields() {}

    async _calculateCargo() {
        if (this._activeShip) {
            this.inventory.cargoBay.setMaxCapacity(this._activeShip.cargoBay);
        }
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

    async giveDamage(damageMultiplier?: number) {
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
        if (damageMultiplier) {
            return totalDamage * damageMultiplier;
        } else {
            return totalDamage;
        }
    }

    _getAmmoAmountByName(ammoName: string) {
        let result = 0;
        for (const ammoItem in this.inventory.ammunition) {
            if (this.inventory.ammunition[ammoItem].name === ammoName) {
                result = this.inventory.ammunition[ammoItem].amount;
            }
        }
        return result;
    }

    _getLaserAmmoPerShot() {
        if (this._activeShip) {
            return this._activeShip.currentLasers.length;
        } else {
            console.log(
                `Could not calculate laser ammo per shot for player ${this.name}`
            );
            return 1;
        }
    }

    async shootLaserProjectileAtTarget(
        target: Alien | Player,
        ammoName: string
    ) {
        if (this.reloadState == "canShoot") {
            this.reloadState = "reloading";
            const ammoItem = this.inventory.findLaserAmmoByName(ammoName);
            if (ammoItem) {
                ammoItem.amount -= this._getLaserAmmoPerShot();
                const damageAmount = await this.giveDamage(
                    ammoItem.damageMultiplier
                );
                gameServer.spacemaps[
                    this.currentMap
                ].projectileServer.createProjectile(
                    "LaserProjectile",
                    this,
                    target,
                    ammoName,
                    damageAmount
                );
                this._reload(ammoName);
            } else {
                console.log(
                    `${this.name} tried to shoot with ammo they do not posses`
                );
            }
        }
    }

    shootRocketProjectileAtTarget(target: Alien | Player, ammoName: string) {
        if (this.rocketReloadState == "canShoot") {
            this.rocketReloadState = "reloading";
            const ammoItem = this.inventory.findRocketAmmoByName(ammoName);
            if (ammoItem) {
                ammoItem.amount -= 1;
                gameServer.spacemaps[
                    this.currentMap
                ].projectileServer.createProjectile(
                    "RocketProjectile",
                    this,
                    target,
                    ammoName
                );
                this._rocketReload();
            } else {
                console.log(
                    `${this.name} tried to shoot with ammo they do not posses`
                );
            }
        }
    }

    async _reload(ammoName: string) {
        setTimeout(async () => {
            this.reloadState = "canShoot";
            if (this.targetUUID && this.isShooting) {
                const target = (await gameServer.getEntityByUUID(
                    this.targetUUID
                )) as Alien | Player;
                if (target) {
                    this.shootLaserProjectileAtTarget(target, ammoName);
                } else {
                    this.targetUUID = undefined;
                    this.isShooting = false;
                }
            }
        }, 1000);
    }

    async _rocketReload() {
        setTimeout(async () => {
            this.rocketReloadState = "canShoot";
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
            if (this.currentActiveQuests.length > 0) {
                gameServer.questServer.registerFlyDistance({
                    playerUUID: this.uuid,
                    mapName: this.currentMap,
                    distanceTravelled: travelledDistance,
                });
            }
        }
    }

    addHonor(honor: number) {
        this.stats.honor = this.stats.honor + honor;
    }

    async addExperience(experience: number) {
        this.stats.experience = this.stats.experience + experience;
        const targetLevel =
            await gameServer.rankingServer.experienceServer.calculatePlayerLevel(
                this
            );
        if (this.stats.level !== targetLevel) {
            this.stats.level = targetLevel;
        }
    }

    addThulium(thulium: number) {
        this.stats.thulium = this.stats.thulium + thulium;
    }

    setThulium(thulium: number) {
        this.stats.thulium = thulium;
    }

    addCredits(credits: number) {
        this.stats.credits = this.stats.credits + credits;
    }

    setCredits(credits: number) {
        this.stats.credits = credits;
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
    activeShipName?: string;
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
        this.activeShipName = player.activeShipName;
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
    level: number;
}

export type PlayerStateCharacteristic = "passive" | "attacking";
export type ReloadStateCharacteristic = "canShoot" | "reloading";
