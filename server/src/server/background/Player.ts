import { PlayerEntityInterface, getUserDataByUsername } from "../db/db";
import { gameServer } from "../main";
import { Alien, Durability } from "./Alien";
import { Entity } from "./Entity";
import { tickrate } from "./GameServer";
import { Vector2D } from "./Spacemap";

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
    speed: number = 2000;

    public constructor(socketId: string, username: string) {
        super(username);
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

        this._initializePlayerData().then(()=>{
            gameServer.players.push(this);
            gameServer.spacemaps[this.currentMap].entities.push(this);    
        })
    }

    private async _initializePlayerData() {
        await this._getDataFromSQL();
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
        return (
            this.damage.maxDamage * (1 - Math.random() * this.damage.variance)
        );
    }

    async _reload() {
        setTimeout(() => {
            this.reloadState = "canShoot";
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
export type ReloadStateCharacteristic = "canShoot" | "reloading";
