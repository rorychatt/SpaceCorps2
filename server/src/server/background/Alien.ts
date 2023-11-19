import { Entity } from "./Entity";
import * as fs from "fs";
import { tickrate } from "./GameServer";
import { Spacemap, Vector2D } from "./Spacemap";
import { CargoDrop, OreResource, PossibleOreNames } from "./CargoDrop";
import { Player } from "./Player";

export class Alien extends Entity {
    _type: string = "Alien";
    hitPoints: Durability;
    killReward: _KillReward;
    cargoDrop: CargoDrop;
    damage: AlienDamageCharacteristic;
    movement: AlienMovementCharacteristic;
    canRepair: boolean = false;
    _roamDestination: Vector2D | null = null;
    _maxHP: number;
    _maxSP: number;
    activeShipName: string;
    lastAttackedByUUID?: string;
    targetUUID: string | null;

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
        this.movement = {
            behaviour: "circular",
            speed: 360,
            attackBehaviour: "passive",
            aggroRadius: 5,
            maxAggroTime: 10,
            maxAttackRadius: 10,
        };
        this._maxHP = 1000;
        this._maxSP = 1000;
        this.targetUUID = "";
        this._getData();
        // console.log(this.movement);
    }

    _getData() {
        try {
            const rawData = fs.readFileSync("./src/server/data/aliens.json");
            const aliensData = JSON.parse(rawData.toString("utf-8"));
            this.hitPoints = aliensData[this.name].hitPoints;
            this.killReward = aliensData[this.name].killReward;
            this.damage = aliensData[this.name].damage;
            this.movement = aliensData[this.name].movement;
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

    countAgroRadius(player: Player) {
        let dx = Math.sqrt(((this.position.x ** 2) - (player.position.x ** 2)) - this.movement.aggroRadius ** 2);
        let dy = Math.sqrt(((this.position.y ** 2) - (player.position.y ** 2)) - this.movement.aggroRadius ** 2);

        console.log(`POSITIONS: dx: ${dx}, dy: ${dy}`);

        this._roamDestination = { x: dx, y: dy };
        this.flyToDestination();
    }

    attackBehavior(player: Player) {
        if(player) {
            // this.targetUUID = player.uuid;
            // this.countAgroRadius(player);
            // this.flyToDestination();

            // const dx = Math.sqrt((this.position.x ** 2) + (player.position.x ** 2)) - this.movement.maxAttackRadius;
            // const dy = Math.sqrt((this.position.y ** 2) + (player.position.y ** 2)) - this.movement.maxAttackRadius;

            if(((Math.sqrt(this.position.x ** 2) - (player.position.x ** 2)) < this.movement.maxAttackRadius ** 2) && 
              (Math.sqrt((this.position.y ** 2) - (player.position.y ** 2)) < this.movement.maxAttackRadius ** 2)) {
                console.log(`PLAYER: ${player.name} GOT DAMAGE!`);
                player.giveDamage();
            }

            console.log(`PENISMEN: ${(Math.sqrt(this.position.x ** 2) - (player.position.x ** 2))}`);
            console.log(`PENISMEN1: ${(Math.sqrt(this.position.y ** 2) - (player.position.y ** 2))}`);

            setTimeout(() => this.targetUUID = null, 5000); // this.movement.maxAggroTime * 1000
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

        if (attackerUUID) {
            this.lastAttackedByUUID = attackerUUID;
        }

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

    // тут
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

    roam(): Vector2D {
        let target = { x: 0, y: 0 };
        const currentPosition = this.position;
        if (this.movement) {
            const ranX = 0.5 - Math.random();
            const ranY = 0.5 - Math.random();
            const adjustedSpeed = (this.movement.speed * 1000) / tickrate;
            target = {
                x: currentPosition.x + (ranX * adjustedSpeed) / 1000,
                y: currentPosition.y + (ranY * adjustedSpeed) / 1000,
            };
        }
        return target;
    }

    passiveRoam(mapWidth: number, mapHeight: number) {
        if(this.lastAttackedByUUID) {
            this.flyToDestination();
        } else {
            if (this.movement?.behaviour === "passive") {
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

        if (this.movement) {
            const travelledDistance = this.movement.speed / tickrate / 100;

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

export interface AlienMovementCharacteristic {
    behaviour: AlienMovementBehaviour;
    speed: number;
    attackBehaviour: AttackBehaviour;
    aggroRadius: number;
    maxAggroTime: number;
    maxAttackRadius: number;
}

export type AlienMovementBehaviour = "passive" | "circular";
export type AttackBehaviour = "passive" | "aggressive";

interface _OreDropData {
    oreName: PossibleOreNames;
    amount: number;
}
