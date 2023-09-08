import { Durability } from "./Alien";
import { Entity } from "./Entity";

export class Player extends Entity {
    currentMap: string;
    socketId: string;
    hitpoints?: Durability;
    stats?: PlayerStats;
    damage?: PlayerDamageCharacteristic;

    public constructor(socketId: string, username: string) {
        super(username);
        this.name = username;
        this.currentMap = "M-1";
        this.socketId = socketId;
        this.hitpoints = {
            hullPoints: 10000,
            shieldPoints: 0,
            shieldAbsorbance: 0,
        };
    }

    receiveDamage(damage: number) {
        if (this.hitpoints) {
            let shieldDamage: number = damage * this.hitpoints.shieldAbsorbance;
            let hullDamage: number = damage - shieldDamage;

            if (shieldDamage > this.hitpoints.shieldPoints) {
                let excessDamage = shieldDamage - this.hitpoints.shieldPoints;
                hullDamage = hullDamage + excessDamage;
                this.hitpoints.shieldPoints = 0;
            }

            this.hitpoints.hullPoints = this.hitpoints.hullPoints - hullDamage;
        } else {
            console.log(
                `Warning! ${this.name} has no hitpoints characteristic!!!`
            );
        }
    }

    giveDamage() {
        if (this.damage) {
            const damage =
                this.damage.maxDamage *
                (1 - Math.random() * this.damage.variance);
            return damage
        } else {
            console.log(`Warning! ${this.name} has no damage characteristic!!!`)
        }
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
