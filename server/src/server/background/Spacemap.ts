import { Alien } from "./Alien";
import { CargoDrop, OreResource, OreSpawn } from "./CargoDrop";
import {
    CompanyBase,
    Entity,
    SafeZone,
    Portal,
    calculateEntityPosition,
} from "./Entity.js";
import { Item, PossibleItems } from "./Inventory";
import { Player } from "./Player";
import { ProjectileServer } from "./ProjectileServer";

export class Spacemap {
    readonly name: string;
    readonly size: SpacemapSize;
    entities: PossibleSpacemapEntities[];
    cargoboxes: CargoDrop[] = [];
    oreSpawns: OreSpawn[] = [];
    _config: SpacemapConfig;
    _maxAliens?: number;
    _allowedAliens?: string[];
    projectileServer: ProjectileServer;
    safezones?: SafeZone[];

    public constructor(config: SpacemapConfig) {
        this.entities = [];
        this._config = config;
        this.name = config.name;
        this.size = config.size;
        this.projectileServer = new ProjectileServer(this);

        this._maxAliens = 0;
        if (this._config.spawnableAliens) {
            const alienNames = Object.keys(this._config.spawnableAliens);
            for (const alienName of alienNames) {
                this._maxAliens +=
                    this._config.spawnableAliens[alienName].spawnLimit;
            }
            this._allowedAliens = alienNames;
        }
    }

    spawnAlien(name: string, position: Vector2D) {
        const alien = new Alien(this, name, position);
        this.entities.push(alien);
    }

    spawnOre(ores: OreResource[], position: Vector2D) {
        const oreSpawn = new OreSpawn(this.name, position, ores);
        this.oreSpawns.push(oreSpawn);
    }

    spawnCargoBoxFromAlien(cargoContents: {
        currentMap: string;
        position: Vector2D;
        ores: OreResource[];
        items: PossibleItems[];
    }) {
        const cargoDrop = new CargoDrop(
            cargoContents.currentMap,
            cargoContents.position,
            cargoContents.ores,
            cargoContents.items
        );
        this.cargoboxes.push(cargoDrop);

        // Delete cargobox after some time...
        setTimeout(() => {
            this._deleteCargoBoxByUuid(cargoDrop.uuid);
        }, 60000);
    }

    deleteEntityByUuid(uuid: string) {
        this.entities = this.entities.filter((el) => el.uuid !== uuid);

        // TODO: delete cargobox here too??
    }

    _deleteCargoBoxByUuid(uuid: string) {
        this.cargoboxes = this.cargoboxes.filter((el) => el.uuid !== uuid);
    }

    randomSpawnAlien() {
        // Defenition of map size
        let width = this._config.size.width;
        let height = this._config.size.height;
        // Defentition of the safe zones array
        let safeZones: SafeZone[] = [];

        // Considering all the portals as the safe zone
        for (const _portal in this._config.staticEntities.portals) {
            const portal = this._config.staticEntities.portals[_portal];
            safeZones.push(
                new SafeZone(
                    calculateEntityPosition(portal.location, this._config.size),
                    portal.safeZoneRadii
                )
            );
        }
        // Considering base as a safe zone
        if (this._config.staticEntities.base) {
            const base = this._config.staticEntities.base;
            safeZones.push(
                new SafeZone(
                    calculateEntityPosition(base.location, this._config.size),
                    base.safeZoneRadii
                )
            );
        }
        // Iterating over every alien
        for (const spawnableAlien in this._config.spawnableAliens) {
            const alienConfig = this._config.spawnableAliens[spawnableAlien];
            if (alienConfig.spawnLimit) {
                let alienCount = 0;
                for (const entity of this.entities) {
                    if (
                        entity instanceof Alien &&
                        entity.name == spawnableAlien &&
                        alienCount < alienConfig.spawnLimit
                    ) {
                        alienCount++;
                    }
                }
                // If allowed - spawn an alien
                if (alienCount < alienConfig.spawnLimit) {
                    let spawnAttempt = 0; // if exceede maximum value alien will spawn aroun the center of map, exluding safe zones
                    let position: Vector2D | undefined; // position for alien spawn
                    while (spawnAttempt < 5) {
                        // Trying to generate new position
                        const newPosition = {
                            x: Math.floor(
                                Math.random() * (width + 1) - width / 2
                            ),
                            y: Math.floor(
                                Math.random() * (height + 1) - height / 2
                            ),
                        };
                        // Checking whether new position is in safe zone, if it is, then increments spawnAtempt and goes to the new iteration
                        for (const safeZone of safeZones) {
                            if (safeZone.isInSafeZone(newPosition)) {
                                spawnAttempt++;
                                continue;
                            }
                        }
                        // Break the cycle if position is not in any of the safe zones
                        position = newPosition;
                        break;
                    }

                    if (!position) {
                        // If failed to generate spawn position(position undefined), then spaw occures around the map center
                        this.spawnAlien(spawnableAlien, {
                            x: (0.5 - Math.random()) * 10,
                            y: (0.5 - Math.random()) * 10,
                        });
                    } else {
                        this.spawnAlien(spawnableAlien, position);
                    }
                }
            }
        }
    }

    loadStaticEntities() {
        for (const portal in this._config.staticEntities.portals) {
            const _cfg = this._config.staticEntities.portals[portal];
            this.entities.push(
                new Portal(
                    this,
                    _cfg.location,
                    _cfg.destination,
                    _cfg.safeZoneRadii
                )
            );
        }
        if (this._config.staticEntities.base) {
            this.entities.push(
                new CompanyBase(
                    this,
                    this._config.staticEntities.base.location,
                    this._config.staticEntities.base.name,
                    this._config.staticEntities.base.safeZoneRadii
                )
            );
        }
    }
}

export interface Spacemaps {
    [key: string]: Spacemap;
}

export interface Vector2D {
    x: number;
    y: number;
}

export interface PortalConfig {
    safeZoneRadii: number;
    readonly location: StaticEntityLocations;
    readonly destination: string;
}

export interface StaticEntitiesConfig {
    portals: PortalConfig[];
    base?: {
        safeZoneRadii: number;
        readonly location: StaticEntityLocations;
        readonly name: string;
    };
}

export interface SpacemapSize {
    width: number;
    height: number;
}

export interface SpacemapConfig {
    name: string;
    size: SpacemapSize;
    staticEntities: StaticEntitiesConfig;
    spawnableAliens?: SpawnableAliens;
}

export interface SpawnableAliens {
    [alienName: string]: {
        spawnLimit: number;
    };
}

export type StaticEntityLocations =
    | "top-left"
    | "top"
    | "top-right"
    | "right"
    | "bottom-right"
    | "bottom"
    | "bottom-left"
    | "left"
    | "middle";

export type PossibleSpacemapEntities =
    | Player
    | Alien
    | Entity
    | Portal
    | CompanyBase;
