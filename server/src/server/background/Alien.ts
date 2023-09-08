import { Entity } from "./Entity";

export class Alien extends Entity {
    hitPoints: Durability;
    killReward: KillReward;
    oreDrop: OreDrop;
    damage: AlienDamageCharacteristic;

    public constructor() {
        super("AlienTEST");

        this.hitPoints = {
            hullPoints: 1000,
            shieldPoints: 1000,
            shieldAbsorbance: 100,
        };
        this.killReward = {
            credits: 1000,
            thulium: 1000,
            experience: 1000,
            honor: 1000,
        };
        this.oreDrop = {};
        this.damage = {
            maxDamage: 1000,
            variance: 0.2,
            criticalChance: 0.01,
            criticalMultiplier: 2,
        };
    }

    receiveDamage(damage: number) {
        let shieldDamage: number = damage * this.hitPoints.shieldAbsorbance;
        let hullDamage: number = damage - shieldDamage;

        if (shieldDamage > this.hitPoints.shieldPoints) {
            let excessDamage = shieldDamage - this.hitPoints.shieldPoints;
            hullDamage = hullDamage + excessDamage;
            this.hitPoints.shieldPoints = 0;
        }

        this.hitPoints.hullPoints = this.hitPoints.hullPoints - hullDamage;
    }

    giveDamage() {
        const rawDamage =
            this.damage.maxDamage * (1 - Math.random() * this.damage.variance);
        const isCritical = Math.random() <= this.damage.criticalChance;
        const damageMultiplier = isCritical ? this.damage.criticalChance : 1;
        const damage = rawDamage * damageMultiplier;
        return damage;
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
