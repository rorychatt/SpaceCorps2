import { Alien } from "./Alien";
import { Entity } from "./Entity";
import { Player } from "./Player";
import {
    LaserProjectile,
    PossibleProjectiles,
    ProjectileTypes,
} from "./Projectiles";
import { Vector2D } from "./Spacemap";

export class ProjectileServer {
    projectiles: PossibleProjectiles[] = [];

    createProjectile(
        type: ProjectileTypes,
        attackerEntity: Player | Alien | Entity,
        targetEntity: Player | Alien | Entity
    ) {
        if (type == "LaserProjectile") {
            this.projectiles.push(
                new LaserProjectile(targetEntity, attackerEntity)
            );
        }
    }
}
