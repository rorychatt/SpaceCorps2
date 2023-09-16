import { Entity } from "./Entity";
import * as fs from "fs";
import { tickrate } from "./GameServer";

export class Alien extends Entity {
    _type: string = "Alien"
    hitPoints?: Durability;
    killReward?: KillReward;
    oreDrop?: OreDrop;
    damage?: AlienDamageCharacteristic;
    movement?: AlienMovementCharacteristic;
    _roamDestination: { x: number; y: number } | null = null;

    public constructor(name: string, position?: { x: number; y: number }) {
        super(name, position);

        this._getData();
    }

    _getData() {
        try {
            const rawData = fs.readFileSync("./src/server/data/aliens.json");
            const aliensData = JSON.parse(rawData.toString("utf-8"));
            this.hitPoints = aliensData[this.name].hitPoints;
            this.killReward = aliensData[this.name].killReward;
            this.oreDrop = aliensData[this.name].oreDrop;
            this.damage = aliensData[this.name].damage;
            this.movement = aliensData[this.name].movement;
        } catch (error) {
            console.error("Error reading the file:", error);
        }
    }

    receiveDamage(damage: number) {
        if (this.hitPoints) {
            let shieldDamage: number = damage * this.hitPoints.shieldAbsorbance;
            let hullDamage: number = damage - shieldDamage;
            if (shieldDamage > this.hitPoints.shieldPoints) {
                let excessDamage = shieldDamage - this.hitPoints.shieldPoints;
                hullDamage = hullDamage + excessDamage;
                this.hitPoints.shieldPoints = 0;
            }
            this.hitPoints.hullPoints = this.hitPoints.hullPoints - hullDamage;
        }
    }

    giveDamage() {
        if (this.damage) {
            const rawDamage =
                this.damage.maxDamage *
                (1 - Math.random() * this.damage.variance);
            const isCritical = Math.random() <= this.damage.criticalChance;
            const damageMultiplier = isCritical
                ? this.damage.criticalChance
                : 1;
            const damage = rawDamage * damageMultiplier;
            return damage;
        }
    }

    roam(): { x: number; y: number } {
        let target = { x: 0, y: 0 };
        const currentPosition = this.position;
        if (this.movement) {
            const ranX = 0.5 - Math.random();
            const ranY = 0.5 - Math.random();
            const adjustedSpeed = (this.movement.speed * 1000) / tickrate;
            target = {
                x: currentPosition.x + (ranX * this.movement.speed) / 1000,
                y: currentPosition.y + (ranY * this.movement.speed) / 1000,
            };
        }
        return target;
    }

    passiveRoam() {
        if (this.movement?.behaviour === "passive") {
            if (this._roamDestination == null) {

                // TODO: add boundaries here
                // const maxX = mapsProperties[`${this.currentMap}`].width;
                // const maxY = mapsProperties[`${this.currentMap}`].height;

                // const dx = (Math.random() - 0.5) * maxX;
                // const dy = (Math.random() - 0.5) * maxY;

                const dx = (Math.random() - 0.5) * 160;
                const dy = (Math.random() - 0.5) * 90;

                this._roamDestination = { x: dx, y: dy };

                this.flyToDestination();
            } else {
                this.flyToDestination();
            }
        }
    }

    flyToDestination() {
        if (this._roamDestination == null) return;

        if (this.movement) {
            const travelledDistance = this.movement.speed / tickrate / 100;

            let direction = {
                x: this._roamDestination.x - this.position.x,
                y: this._roamDestination.y - this.position.y,
            };

            let totalDistance = Math.sqrt(direction.x ** 2 + direction.y ** 2);

            if (travelledDistance - totalDistance < 0) {
                let dx = (travelledDistance / totalDistance) * direction.x;

                let dy = (travelledDistance / totalDistance) * direction.y;

                this.position = {
                    x: this.position.x + dx,
                    y: this.position.y + dy,
                };
            } else {
                this._roamDestination = null;
            }
        }
    }
}

export interface KillReward {
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

export interface OreDrop {
    // Oredrop
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
}

export type AlienMovementBehaviour = "passive" | "circular";
