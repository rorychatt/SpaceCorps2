import { PlayerEntityInterface, getUserDataByUsername } from "../db/db";
import { Durability } from "./Alien";
import { Entity } from "./Entity";

export class Player extends Entity {
    socketId: string;
    hitpoints?: Durability;
    stats?: PlayerStats;
    damage?: PlayerDamageCharacteristic;

    public constructor(socketId: string, username: string) {
        super(username);
        this.socketId = socketId;
        this.hitpoints = {
            hullPoints: 10000,
            shieldPoints: 0,
            shieldAbsorbance: 0,
        };
        this._getDataFromSQL()
    }

    async _getDataFromSQL() {
        let templateData = {
            currentMap: "M-1",
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

        if (res && res.length > 0) {
            const data = res[0];
            templateData = {
                currentMap: data.mapName,
                positionX: data.positionX,
                positionY: data.positionY,
                credits: data.credits,
                thulium: data.thulium,
                experience: data.experience,
                honor: data.honor,
            };
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

        console.log(this)
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
            return damage;
        } else {
            console.log(
                `Warning! ${this.name} has no damage characteristic!!!`
            );
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
