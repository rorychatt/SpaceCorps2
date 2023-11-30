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
    targetUUID: string;

    constructor(alien: any) {
        this.name = alien.name;
        this.position = alien.position;
        this.uuid = alien.uuid;
        this._type = alien._type;
        this.hitPoints = alien.hitPoints;
        this.maxHealth = alien._maxHP;
        this.maxShields = alien._maxSP;
        this.activeShipName = alien.activeShipName;
        this.targetUUID = alien.targetUUID;
    }
}

class PlayerDTO {
    name: string;
    position: any;
    _type: string;
    hitPoints: any;
    stats: any;
    company: string;
    targetUUID: string;
    activeShipName: string;
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

export class AlienProjectileDTO {
    name: string;
    position: any;
    targetPosition: any;
    uuid: string;
    _type: string;

    constructor(alienProjectile: any) {
        this.name = alienProjectile.name;
        this.position = alienProjectile.position;
        this.targetPosition = alienProjectile.target.position;
        this.uuid = alienProjectile.uuid;
        this._type = alienProjectile._type;
    }
}

interface _OreResource {
    name: string;
    amount: number;
}
interface _OreSpawn {
    _type: string;
    uuid: string;
    ores: _OreResource[];
    qualityLevel: number;
    position: { x: number; y: number };
}
class OreResourceDTO {
    name: string;
    amount: number;

    constructor(oreResource: _OreResource) {
        this.name = oreResource.name;
        this.amount = oreResource.amount;
    }
}
class OreSpawnDTO {
    readonly _type = "OreSpawn";

    uuid: string;
    ores: OreResourceDTO[] = [];
    qualityLevel: number;
    position: { x: number; y: number };

    constructor(oreSpawn: _OreSpawn) {
        for (const _oreResource in oreSpawn.ores) {
            const oreResource = oreSpawn.ores[_oreResource];
            this.ores.push(new OreResourceDTO(oreResource));
        }
        this.qualityLevel = oreSpawn.qualityLevel;
        this.position = oreSpawn.position;
        this.uuid = oreSpawn.uuid;
    }
}

const renderRadius = Math.pow(28, 2);

if (parentPort) {
    parentPort.on(
        "message",
        async (data: { players: any[]; spacemaps: any }) => {
            let result: {
                player: any;
                entitiesDTO: any[];
                projectilesDTO: any[];
                cargoboxes: any[];
                oreSpawnDTO: any[];
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
                                Math.pow(e.position.y - player.position.y, 2) <=
                                renderRadius ||
                            e._type == "Portal" ||
                            e._type == "CompanyBase"
                        );
                    });

                const projectilesDTO = mapData.projectileServer.projectiles
                    .map((projectile: any) => {
                        if (
                            projectile._type &&
                            projectile._type == "LaserProjectile"
                        ) {
                            return new LaserProjectileDTO(projectile);
                        } else if (
                            projectile._type &&
                            projectile._type == "RocketProjectile"
                        ) {
                            return new RocketProjectileDTO(projectile);
                        } else if (
                            projectile._type &&
                            projectile._type == "AlienProjectile"
                        ) {
                            return new AlienProjectileDTO(projectile);
                        }
                        return projectile;
                    })
                    .filter((e: any) => {
                        return (
                            Math.pow(e.position.x - player.position.x, 2) +
                                Math.pow(e.position.y - player.position.y, 2) <=
                            renderRadius
                        );
                    });

                const oreSpawns = mapData.oreSpawns
                    .map((oreSpawn: _OreSpawn) => {
                        if (oreSpawn._type && oreSpawn._type == "OreSpawn") {
                            return new OreSpawnDTO(oreSpawn);
                        }
                    })
                    .filter((e: any) => {
                        return (
                            Math.pow(e.position.x - player.position.x, 2) +
                                Math.pow(e.position.y - player.position.y, 2) <=
                            renderRadius
                        );
                    });

                const cargoboxes = mapData.cargoboxes.filter((e: any) => {
                    return (
                        Math.pow(e.position.x - player.position.x, 2) +
                            Math.pow(e.position.y - player.position.y, 2) <=
                        renderRadius
                    );
                });

                result.push({
                    player: player,
                    entitiesDTO: entitiesDTO,
                    projectilesDTO: projectilesDTO,
                    cargoboxes: cargoboxes,
                    oreSpawnDTO: oreSpawns,
                    size: mapData.size,
                });
            });
            if (parentPort) {
                parentPort.postMessage(result);
            }
        }
    );
}
