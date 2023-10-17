import { parentPort } from "worker_threads";
class AlienDTO {
    name: string;
    position: any;
    uuid: string;
    _type: string;
    maxHealth: number;
    maxShields: number;
    hitPoints: any;
    activeShipName: string;

    constructor(alien: any) {
        this.name = alien.name;
        this.position = alien.position;
        this.uuid = alien.uuid;
        this._type = alien._type;
        this.hitPoints = alien.hitPoints;
        this.maxHealth = alien._maxHP;
        this.maxShields = alien._maxSP;
        this.activeShipName = alien.activeShipName;
    }
}

class PlayerDTO {
    name: string;
    position: any;
    _type: string;
    hitPoints?: any;
    stats?: any;
    company?: string;
    targetUUID?: string;
    activeShipName?: string;
    uuid: string;

    constructor(player: any) {
        this.name = player.name;
        this.position = player.position;
        this._type = player._type;
        this.hitPoints = player.hitPoints;
        this.stats = player.stats;
        this.company = player.company;
        this.uuid = player.uuid;
        this.targetUUID = player.targetUUID;
        this.activeShipName = player.activeShipName;
    }
}

class LaserProjectileDTO {
    name: string;
    position: any;
    targetPosition: any;
    color: any;
    uuid: string;
    _type: string;

    constructor(laserProjectile: any) {
        this.name = laserProjectile.name;
        this.position = laserProjectile.position;
        this.targetPosition = laserProjectile.target.position;
        this.color = laserProjectile.color;
        this.uuid = laserProjectile.uuid;
        this._type = laserProjectile._type;
    }
}

class RocketProjectileDTO {
    name: string;
    position: any;
    targetPosition: any;
    uuid: string;
    _type: string;

    constructor(rocketProjectile: any) {
        this.name = rocketProjectile.name;
        this.position = rocketProjectile.position;
        this.targetPosition = rocketProjectile.target.position;
        this.uuid = rocketProjectile.uuid;
        this._type = rocketProjectile._type;
    }
}

const renderRadius = Math.pow(35, 2)

if (parentPort) {
    parentPort.on(
        "message",
        async (data: { players: any[]; spacemaps: any }) => {
            let result: {
                player: any;
                entitiesDTO: any[];
                projectilesDTO: any[];
                cargoboxes: any[];
                size: any;
            }[] = [];
            data.players.forEach((player) => {
                const mapData: any = data.spacemaps[player.currentMap];

                let entitiesDTO = mapData.entities
                    .map((entity: any) => {
                        if (entity._type && entity._type == "Alien") {
                            return new AlienDTO(entity);
                        } else if (entity._type && entity._type == "Player") {
                            if (entity.name == player.name) {
                                return entity;
                            } else {
                                return new PlayerDTO(entity);
                            }
                        } else {
                            return entity;
                        }
                    })
                    .filter((e: any) => {
                        return (
                            Math.pow(e.position.x - player.position.x, 2) +
                                (e.position.y - player.position.y, 2) <=
                            renderRadius || e._type == "Portal" || e._type == "Base"
                        );
                    });

                const projectilesDTO = mapData.projectileServer.projectiles
                    .map((projectile: any) => {
                        if (projectile._type && projectile._type == "LaserProjectile") {
                            return new LaserProjectileDTO(projectile);
                        } else if (projectile._type && projectile._type == "RocketProjectile") {
                            return new RocketProjectileDTO(projectile);
                        }
                        return projectile;
                    })
                    .filter((e: any) => {
                        return (
                            Math.pow(e.position.x - player.position.x, 2) +
                                (e.position.y - player.position.y, 2) <=
                            renderRadius
                        );
                    });
                const cargoboxes = mapData.cargoboxes.filter((e: any) => {
                    return (
                        Math.pow(e.position.x - player.position.x, 2) +
                            (e.position.y - player.position.y, 2) <=
                        renderRadius
                    );
                });

                result.push({
                    player: player,
                    entitiesDTO: entitiesDTO,
                    projectilesDTO: projectilesDTO,
                    cargoboxes: cargoboxes,
                    size: mapData.size,
                });
            });
            if (parentPort) {
                parentPort.postMessage(result);
            }
        }
    );
}
