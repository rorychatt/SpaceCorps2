import { PlayerEntityInterface, getUserDataByUsername } from "../db/db";
import { Durability } from "./Alien";
import { Entity } from "./Entity";
import { tickrate } from "./GameServer";
import { Vector2D } from "./Spacemap";

export class Player extends Entity {
    _type: string = "Player";
    socketId: string;
    state: PlayerStateCharacteristic = "passive";
    hitPoints?: Durability;
    stats?: PlayerStats;
    damage?: PlayerDamageCharacteristic;
    company?: string = "MMF";
    destination?: Vector2D | null;
    speed: number = 360;

    public constructor(socketId: string, username: string) {
        super(username);
        this.socketId = socketId;
        this.hitPoints = {
            hullPoints: 10000,
            shieldPoints: 0,
            shieldAbsorbance: 0,
        };
        this._getDataFromSQL();
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

        console.log(this);
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
        } else {
            console.log(
                `Warning! ${this.name} has no hitPoints characteristic!!!`
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
}

export class PlayerDTO {
    name: string;
    position: Vector2D;
    _type: string;
    hitPoints?: Durability;
    stats?: PlayerStats;
    company?: string;
    uuid: string;

    constructor(player: Player) {
        this.name = player.name;
        this.position = player.position;
        this._type = player._type;
        this.hitPoints = player.hitPoints;
        this.stats = player.stats;
        this.company = player.company;
        this.uuid = player.uuid;
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