import { Alien } from "./Alien.js";
import { Entity } from "./Entity";
import { LaserAmmo } from "./Inventory";
import { Player } from "./Player.js";
import {
    AlienProjectile,
    LaserProjectile,
    PossibleProjectiles,
    ProjectileTypes,
    RocketProjectile,
} from "./Projectiles.js";
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
        ammoName?: string,
        damageAmount?: number
    ) {
        if (attackerEntity.currentMap != targetEntity.currentMap) {
            console.log(
                `${attackerEntity.name} tried to shoot ${targetEntity.name} from a different map!`
            );
            return;
        }
        if (type == "LaserProjectile" && damageAmount) {
            if(!ammoName) return;
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
        } else if(type == "AlienProjectile") {
            if(targetEntity instanceof Player && attackerEntity instanceof Alien) {
                damageAmount = attackerEntity.giveDamage();
                this.projectiles.push(
                    new AlienProjectile(
                        this.spacemap,
                        targetEntity,
                        attackerEntity,
                        damageAmount
                    )
                );
            }
        }
    }
}
