import { Entity } from "./Entity";
import * as fs from "fs";

export class Alien extends Entity {
    hitPoints?: Durability;
    killReward?: KillReward;
    oreDrop?: OreDrop;
    damage?: AlienDamageCharacteristic;

    public constructor(name: string, position?: { x: number; y: number }) {
        super(name, position);

        this._getData();
    }

    _getData() {
        try {
            const rawData = fs.readFileSync(
                "./src/server/data/aliens.json"
            );
            const aliensData = JSON.parse(rawData.toString("utf-8"));
            this.hitPoints = aliensData[this.name].hitPoints;
            this.killReward = aliensData[this.name].killReward;
            this.oreDrop = aliensData[this.name].oreDrop;
            this.damage = aliensData[this.name].damage;
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
