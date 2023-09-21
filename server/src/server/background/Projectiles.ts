import { Entity } from "./Entity";
import { Vector2D } from "./Spacemap";

export class Projectile extends Entity {
    constructor(name: string, position?: Vector2D) {
        super(name, position);
    }
}

export class LaserProjectile extends Projectile {
    _type: ProjectileTypes;
    color: LaserColors;
    speed: number;

    constructor(name: string, position?: Vector2D, color?: LaserColors) {
        super(name, position);
        this._type = "LaserProjectile";
        this.color = color ? color : "blue";
        this.speed = 100;
    }
}

export class RocketProjectile extends Projectile {
    _type: ProjectileTypes;

    // TODO: Discuss!

    constructor(name: string, position?: Vector2D) {
        super(name, position);
        this._type = "RocketProjectile";
    }
}

export type ProjectileTypes = "LaserProjectile" | "RocketProjectile";
export type LaserColors = "red" | "green" | "blue" | "yellow";
