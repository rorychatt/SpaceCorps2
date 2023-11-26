import { Entity } from "./Entity";
import * as fs from "fs";
import { tickrate } from "./GameServer";
import { Spacemap, Vector2D } from "./Spacemap";
import { CargoDrop, OreResource, PossibleOreNames } from "./CargoDrop";
import { Player } from "./Player";
import { gameServer } from "../main.js";

export class Alien extends Entity {
    _type: string = "Alien";
    hitPoints: Durability;
    killReward: _KillReward;
    cargoDrop: CargoDrop;
    damage: AlienDamageCharacteristic;
    movementBehaviour: MovementBehaviour;
    canRepair: boolean = false;
    _roamDestination: Vector2D | null = null;
    _maxHP: number;
    _maxSP: number;
    activeShipName: string;
    lastAttackedByUUID?: string;
    targetUUID: string | undefined;
    _timeOutSet: boolean;
    canShoot: boolean;

    public constructor(map: Spacemap, name: string, position: Vector2D) {
        super(map.name, name, position);

        this.activeShipName = name;

        this.hitPoints = {
            hullPoints: 1000,
            shieldPoints: 1000,
            shieldAbsorbance: 0.5,
        };
        this.killReward = {
            credits: 1000,
            thulium: 1000,
            experience: 1,
            honor: 1,
        };
        this.cargoDrop = new CargoDrop(map.name, this.position);
        this.damage = {
            maxDamage: 100,
            variance: 0.2,
            criticalChance: 0.01,
            criticalMultiplier: 2,
        };
        this.movementBehaviour = {
            behaviour: "circular",
            speed: 360,
            attackBehaviour: "passive",
            aggroRadius: 5,
            aggroTime: 10,
            attackRadius: 10,
        };
        this._maxHP = 1000;
        this._maxSP = 1000;
        this.targetUUID = undefined;
        this._timeOutSet = false;
        this.canShoot = true;
        this._getData();
    }

    _getData() {
        try {
            const rawData = fs.readFileSync("./src/server/data/aliens.json");
            const aliensData = JSON.parse(rawData.toString("utf-8"));
            this.hitPoints = aliensData[this.name].hitPoints;
            this.killReward = aliensData[this.name].killReward;
            this.damage = aliensData[this.name].damage;
            this.movementBehaviour = aliensData[this.name].movementBehaviour;
            this._maxHP = aliensData[this.name].hitPoints.hullPoints;
            this._maxSP = aliensData[this.name].hitPoints.shieldPoints;

            const oreDrops = aliensData[this.name].oreDrop;
            oreDrops.forEach((oreDrop: _OreDropData) => {
                this.cargoDrop.ores.push(
                    new OreResource(oreDrop.oreName, oreDrop.amount)
                );
            });
            this.cargoDrop.ores;
        } catch (error) {
            console.error("Error reading the file:", error);
        }
    }

    async setTargetUUID(playerUUID: string) {
        const player = await gameServer.getPlayerByUUID(playerUUID);
        if(!player) return;

        const dx = player.position.x - this.position.x;
        const dy = player.position.y - this.position.y;
        const distance = Math.sqrt(dx ** 2 + dy ** 2);
    
        if(this.currentMap != player.currentMap) return;
        if(this.movementBehaviour.attackBehaviour == "passive") return;
        if (distance <= this.movementBehaviour.aggroRadius * 2) {
            this.targetUUID = playerUUID;
        }
    }

    async resetTargetUUID() {
        this.targetUUID = undefined;
    }

    async _chasePlayer() {
        if(!this.targetUUID) return;
        const player = await gameServer.getPlayerByUUID(this.targetUUID);
        if (!player) return;
        if(this.currentMap != player.currentMap) return;
        
        const newX = player.position.x + (((this.movementBehaviour.attackRadius) - (Math.random() * this.movementBehaviour.attackRadius / 2)));
        const newY = player.position.y + (((this.movementBehaviour.attackRadius) - (Math.random() * this.movementBehaviour.attackRadius / 2)));

        this._roamDestination = { x: newX, y: newY };
        this.flyToDestination();
    }
    
    async _checkForCanAttack() {
        if(!this.targetUUID) return;
        const player = await gameServer.getPlayerByUUID(this.targetUUID);
        if (!player) return;
    
        const dx = player.position.x - this.position.x;
        const dy = player.position.y - this.position.y;
        const distance = Math.sqrt(dx ** 2 + dy ** 2);
    
        if (distance + 0.05 <= this.movementBehaviour.attackRadius) {
            // DISCUSS
            // Обновление targetUUID если player в радиусе атаки, первый способ
            // this.targetUUID = player.uuid;
            await gameServer.registerAlienAttackEvent({ alienUUID: this.uuid, targetUUID: player.uuid });
        } else {
            this._chasePlayer();
        }

        if(!this._timeOutSet) {
            this._timeOutSet = true;
            setTimeout(() => {
                // Обновление targetUUID если player в радиусе атаки, второй способ
                // if(distance + 0.05 <= this.movementBehaviour.attackRadius) {
                //     this.targetUUID = player.uuid;
                // } else {
                //     this.targetUUID = undefined;
                // }
                this._timeOutSet = false;
            }, this.movementBehaviour.aggroTime * 1000);
        }
    }

    shootProjectileAtTarget(target: Player) {
        if(this.targetUUID == target.uuid) {
            if(!this.canShoot) return;

            gameServer.spacemaps[this.currentMap].projectileServer.createProjectile(
                "AlienProjectile",
                this,
                target,
            );

            this.canShoot = false;
            this.reload();
        }
    }

    receiveDamage(damage: number, attackerUUID?: string) {
        this.canRepair = false;
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

        if(!this.targetUUID) this.targetUUID = attackerUUID;
        if(attackerUUID) this.lastAttackedByUUID = attackerUUID;
        if(this.targetUUID) this._chasePlayer();

        const hitPointsAfterFirstHit = { ...this.hitPoints };

        setTimeout(() => {
            if (
                hitPointsAfterFirstHit.hullPoints <=
                    this.hitPoints.hullPoints &&
                hitPointsAfterFirstHit.shieldPoints <=
                    this.hitPoints.shieldPoints
            ) {
                this.canRepair = true;
            }
        }, 15000);

        console.log(
            `${this.name} got shot by ${damage} damage and now has ${this.hitPoints.hullPoints} HP and ${this.hitPoints.shieldPoints} SP`
        );
    }

    giveDamage() {
        const rawDamage =
            this.damage.maxDamage * (1 - Math.random() * this.damage.variance);
        const isCritical = Math.random() <= this.damage.criticalChance;
        const damageMultiplier = isCritical
            ? this.damage.criticalMultiplier
            : 1;
        const damage = rawDamage * damageMultiplier;
        console.log(`${this.uuid} tried to shoot and dealt ${damage} damage.`);
        return damage;
    }
    
    async reload() {
        if(this.canShoot) return;

        setTimeout(() => {
            this.canShoot = true;
        }, 1000);
    }

    roam(): Vector2D {
        let target = { x: 0, y: 0 };
        const currentPosition = this.position;
        if (this.movementBehaviour) {
            const ranX = 0.5 - Math.random();
            const ranY = 0.5 - Math.random();
            const adjustedSpeed = (this.movementBehaviour.speed * 1000) / tickrate;
            target = {
                x: currentPosition.x + (ranX * adjustedSpeed) / 1000,
                y: currentPosition.y + (ranY * adjustedSpeed) / 1000,
            };
        }
        return target;
    }

    async passiveRoam(mapWidth: number, mapHeight: number) {
        if(this.targetUUID) {
            await this._checkForCanAttack();
        } else {
            if (this.movementBehaviour?.behaviour === "passive") {
                if (this._roamDestination == null) {
                    const dx = (Math.random() - 0.5) * mapWidth;
                    const dy = (Math.random() - 0.5) * mapHeight;

                    this._roamDestination = { x: dx, y: dy };

                    this.flyToDestination();
                } else {
                    this.flyToDestination();
                }
            }
        }
    }

    flyToDestination() {
        if (this._roamDestination == null) return;
        if (this.movementBehaviour) {
            const travelledDistance = this.movementBehaviour.speed / tickrate / 100;
            const direction = {
                x: this._roamDestination.x - this.position.x,
                y: this._roamDestination.y - this.position.y,
            };
            const totalDistance = Math.sqrt(
                direction.x ** 2 + direction.y ** 2
            );

            if (travelledDistance - totalDistance < 0) {
                const dx = (travelledDistance / totalDistance) * direction.x;

                const dy = (travelledDistance / totalDistance) * direction.y;

                this.position = {
                    x: this.position.x + dx,
                    y: this.position.y + dy,
                };
            } else {
                this._roamDestination = null;
            }
        }
    }

    repair() {
        if (this.canRepair) {
            if (
                this.hitPoints.hullPoints < this._maxHP ||
                this.hitPoints.shieldPoints < this._maxSP
            ) {
                const dhp = this._maxHP / 80;
                const dsp = this._maxSP / 10;

                this.hitPoints.hullPoints += dhp;
                this.hitPoints.shieldPoints += dsp;

                if (this.hitPoints.hullPoints > this._maxHP) {
                    this.hitPoints.hullPoints = this._maxHP;
                }
                if (this.hitPoints.shieldPoints > this._maxSP) {
                    this.hitPoints.shieldPoints = this._maxSP;
                }
            }
        }
    }
}

export class AlienDTO {
    name: string;
    position: Vector2D;
    uuid: string;
    _type: string;
    maxHealth: number;
    maxShields: number;
    hitPoints: Durability;
    activeShipName: string;

    constructor(alien: Alien) {
        this.name = alien.name;
        this.position = alien.position;
        this.uuid = alien.uuid;
        this._type = alien._type;
        this.hitPoints = alien.hitPoints;
        this.maxHealth = alien._maxHP;
        this.maxShields = alien._maxSP;
        this.activeShipName = alien.activeShipName;
    }
}

export interface _KillReward {
    credits: number;
    thulium: number;
    experience: number;
    honor: number;
}

export interface Durability {
    hullPoints: number;
    shieldPoints: number;
    shieldAbsorbance: number;
}

export interface AlienDamageCharacteristic {
    maxDamage: number;
    variance: number;
    criticalChance: number;
    criticalMultiplier: number;
}

export interface MovementBehaviour {
    behaviour: AlienMovementBehaviour;
    speed: number;
    attackBehaviour: AttackBehaviour;
    aggroRadius: number;
    aggroTime: number;
    attackRadius: number;
}

export type AlienMovementBehaviour = "passive" | "circular";
export type AttackBehaviour = "passive" | "aggressive";

interface _OreDropData {
    oreName: PossibleOreNames;
    amount: number;
}
