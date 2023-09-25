import { Alien } from "./Alien";
import { Entity } from "./Entity";
import { Player } from "./Player";
import {
    LaserProjectile,
    PossibleProjectiles,
    ProjectileTypes,
} from "./Projectiles";
import { Spacemap } from "./Spacemap";

export class ProjectileServer {
    projectiles: PossibleProjectiles[] = [];
    spacemap: Spacemap;

    constructor(spacemap: Spacemap) {
        this.spacemap = spacemap;
    }

    createProjectile(
        type: ProjectileTypes,
        attackerEntity: Player | Alien | Entity,
        targetEntity: Player | Alien | Entity
    ) {
        if (type == "LaserProjectile") {
            this.projectiles.push(
                new LaserProjectile(this.spacemap, targetEntity, attackerEntity)
            );
        }
    }
}
