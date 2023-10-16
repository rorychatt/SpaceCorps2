import { Alien } from "./Alien";
import { Entity } from "./Entity";
import { LaserAmmo } from "./Inventory";
import { Player } from "./Player";
import {
    LaserProjectile,
    PossibleProjectiles,
    ProjectileTypes,
    RocketProjectile,
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
        attackerEntity: Player | Alien,
        targetEntity: Player | Alien,
        ammoName: string,
        damageAmount?: number
    ) {
        if (attackerEntity.currentMap == targetEntity.currentMap) {
            console.log(
                `${attackerEntity.name} tried to shoot ${targetEntity.name} from a different map!`
            );
            return;
        }
        if (type == "LaserProjectile" && damageAmount) {
            this.projectiles.push(
                new LaserProjectile(
                    this.spacemap,
                    targetEntity,
                    attackerEntity,
                    ammoName,
                    damageAmount
                )
            );
        } else if (type == "RocketProjectile") {
            const ammo = (
                attackerEntity as Player
            ).inventory.getCurrentRocketAmmo();
            if (ammo) {
                this.projectiles.push(
                    new RocketProjectile(
                        this.spacemap,
                        targetEntity,
                        attackerEntity,
                        ammo
                    )
                );
            }
        }
    }
}
