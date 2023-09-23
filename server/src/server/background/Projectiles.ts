import { Alien } from "./Alien";
import { Entity } from "./Entity";
import { tickrate } from "./GameServer";
import { Player } from "./Player";
import { Vector2D } from "./Spacemap";

export class Projectile extends Entity {
    target: Entity | Alien | Player;
    attacker: Entity | Alien | Player;
    speed: number = 10;

    constructor(
        name: string,
        target: Entity | Alien | Player,
        attacker: Entity | Alien | Player
    ) {
        super(name, attacker.position);
        this.target = target;
        this.attacker = attacker;
    }

    moveToTarget() {
        console.log(`Old position: ${JSON.stringify(this.position)}`);
        const dx = this.target.position.x - this.position.x;
        const dy = this.target.position.y - this.position.y;
        const distanceToMove = this.speed / tickrate;
        const distanceToTarget = this.getDistanceToTarget();
        console.log(distanceToTarget);
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
        console.log(`New position: ${JSON.stringify(this.position)}`);
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

    constructor(
        target: Entity | Alien | Player,
        attacker: Entity | Alien | Player,
        color?: LaserColors
    ) {
        super("laserProjectile", target, attacker);
        this._type = "LaserProjectile";
        this.color = color ? color : "blue";
        this.speed = 10;
    }
}

export class RocketProjectile extends Projectile {
    _type: ProjectileTypes;
    speed: number;

    // TODO: Discuss!

    constructor(
        target: Entity | Alien | Player,
        attacker: Entity | Alien | Player
    ) {
        super("rocketProjectile", target, attacker);
        this._type = "RocketProjectile";
        this.speed = 1;
    }
}

export type ProjectileTypes = "LaserProjectile" | "RocketProjectile";
export type PossibleProjectiles = LaserProjectile | RocketProjectile;
export type LaserColors = "red" | "green" | "blue" | "yellow";
