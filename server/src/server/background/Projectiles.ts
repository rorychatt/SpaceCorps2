import { Alien } from "./Alien";
import { Entity } from "./Entity";
import { tickrate } from "./GameServer";
import { RocketAmmo, laserAmmoData, laserData } from "./Inventory";
import { Player } from "./Player";
import { Spacemap, Vector2D } from "./Spacemap";

export class Projectile extends Entity {
    target: Entity | Alien | Player;
    attacker: Entity | Alien | Player;
    speed: number = 10;

    constructor(
        map: Spacemap,
        name: string,
        target: Entity | Alien | Player,
        attacker: Entity | Alien | Player
    ) {
        super(map.name, name, attacker.position);
        this.target = target;
        this.attacker = attacker;
    }

    moveToTarget() {
        const dx = this.target.position.x - this.position.x;
        const dy = this.target.position.y - this.position.y;
        const distanceToMove = this.speed / tickrate;
        const distanceToTarget = this.getDistanceToTarget();
        if (distanceToTarget <= distanceToMove) {
            this.position = {
                x: this.target.position.x,
                y: this.target.position.y,
            };
        } else {
            const ratio = distanceToMove / Math.sqrt(dx * dx + dy * dy);
            this.position = {
                x: this.position.x + dx * ratio,
                y: this.position.y + dy * ratio,
            };
        }
    }
    getDistanceToTarget() {
        return Math.sqrt(
            (this.target.position.x - this.position.x) ** 2 +
                (this.target.position.y - this.position.y) ** 2
        );
    }
}

export class LaserProjectile extends Projectile {
    _type: ProjectileTypes;
    color: LaserColors;
    speed: number;
    ammoName: string;
    damageAmount: number;

    constructor(
        map: Spacemap,
        target: Entity | Alien | Player,
        attacker: Entity | Alien | Player,
        ammoName: string,
        damageAmount: number
    ) {
        super(map, "laserProjectile", target, attacker);
        this._type = "LaserProjectile";
        this.ammoName = ammoName;
        this.color = laserAmmoData[ammoName].color;
        this.speed = 75;
        this.damageAmount = damageAmount;
    }
}

export class RocketProjectile extends Projectile {
    _type: ProjectileTypes;
    speed: number;
    maxDamage: number;
    damageRadius: number;
    damageVariance: number;
    criticalChance: number;
    criticalMultiplier: number;

    // TODO: Discuss!

    constructor(
        map: Spacemap,
        target: Entity | Alien | Player,
        attacker: Entity | Alien | Player,
        rocketAmmo: RocketAmmo
    ) {
        super(map, "rocketProjectile", target, attacker);
        this._type = "RocketProjectile";
        this.maxDamage = 100;
        this.damageRadius = 10;
        this.damageVariance = 0.1;
        this.criticalChance = 0.1;
        this.criticalMultiplier = 2;
        this.speed = 15;
        this._getData(rocketAmmo);
    }

    _getData(rocketAmmo: RocketAmmo) {
        this.maxDamage = rocketAmmo.maxDamage;
        this.damageRadius = rocketAmmo.damageRadius;
        this.damageVariance = rocketAmmo.damageVariance;
        this.criticalChance = rocketAmmo.criticalChance;
        this.criticalMultiplier = rocketAmmo.criticalMultiplier;
        this.speed = rocketAmmo.speed;
    }

    getDamage(): number {
        const isCritical = Math.random() <= this.criticalChance;
        const damageMultiplier = isCritical ? this.criticalMultiplier : 1;
        return (
            this.maxDamage *
            (1 - Math.random() * this.damageVariance) *
            damageMultiplier
        );
    }
}

export class LaserProjectileDTO {
    name: string;
    position: Vector2D;
    targetPosition: Vector2D;
    color: LaserColors;
    uuid: string;
    _type: string;

    constructor(laserProjectile: LaserProjectile) {
        this.name = laserProjectile.name;
        this.position = laserProjectile.position;
        this.targetPosition = laserProjectile.target.position;
        this.color = laserProjectile.color;
        this.uuid = laserProjectile.uuid;
        this._type = laserProjectile._type;
    }
}

export class RocketProjectileDTO {
    name: string;
    position: Vector2D;
    targetPosition: Vector2D;
    uuid: string;
    _type: string;

    constructor(rocketProjectile: RocketProjectile) {
        this.name = rocketProjectile.name;
        this.position = rocketProjectile.position;
        this.targetPosition = rocketProjectile.target.position;
        this.uuid = rocketProjectile.uuid;
        this._type = rocketProjectile._type;
    }
}

export type ProjectileTypes = "LaserProjectile" | "RocketProjectile";
export type PossibleProjectiles = LaserProjectile | RocketProjectile;
export type LaserColors = "red" | "green" | "blue" | "yellow";
