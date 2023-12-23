import { Alien } from "./Alien";
import {
    CargoDrop,
    OreResource,
    OreSpawn,
    PossibleOreNames,
    OreSpawnsAmount,
} from "./CargoDrop.js";
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
    type = "Spacemap";
    entities: PossibleSpacemapEntities[];
    cargoboxes: CargoDrop[] = [];
    oreSpawns: OreSpawn[] = [];
    oreSpawnsAmount: OreSpawnsAmount[] = [];
    _config: SpacemapConfig;
    projectileServer: ProjectileServer;
    safeZones: SafeZone[] = [];

    public constructor(config: SpacemapConfig) {
        this.entities = [];
        this._config = config;
        this.name = config.name;
        this.size = config.size;
        this.projectileServer = new ProjectileServer(this);
        this.generateSafeZones();
    }

    getMapSize(): { mapSize: SpacemapSize } {
        const mapSize: SpacemapSize = this._config.size;
        return { mapSize };
    }

    spawnAlien(name: string, position: Vector2D) {
        const alien = new Alien(this, name, position);
        this.entities.push(alien);
    }

    spawnOre(ores: OreResource[], position: Vector2D, qualityLevel?: number) {
        const oreSpawn = new OreSpawn(this.name, position, ores, qualityLevel);
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
        for (const spawnableAlien in this._config.spawnableAliens) {
            const alienConfig = this._config.spawnableAliens[spawnableAlien];
            if (alienConfig.spawnLimit) {
                let alienCount = 0;
                for (const entity of this.entities) {
                    if (
                        alienCount < alienConfig.spawnLimit &&
                        entity instanceof Alien &&
                        entity.name == spawnableAlien
                    ) {
                        alienCount++;
                    }
                }
                if (alienCount < alienConfig.spawnLimit) {
                    const spawnPosition = attemptGetSpawnPosition(this);
                    this.spawnAlien(spawnableAlien, spawnPosition);
                }
            }
        }
    }

    randomSpawnOreSpawn() {
        if (!this._config.oreSpawns) return;
        this._config.oreSpawns.forEach((data) => {
            let spawnPosition: Vector2D;
            const oreResource = new OreResource(data.oreName, data.amount);

            if (this.oreSpawnsAmount.length === 0) {
                for (let i = 0; i < data.maxAmountPerMap; i++) {
                    spawnPosition = attemptGetSpawnPosition(this);
                    const oreSpawn: OreSpawn = new OreSpawn(this.name, spawnPosition, [oreResource], data.qualityLevel);
                    this.oreSpawns.push(oreSpawn);
                    this.oreSpawnsAmount.push({ oreSpawnName: data.oreName, amount: +1 });
                }

                this.oreSpawns = this.oreSpawns.filter((el) => el.position !== spawnPosition);
                return;
            }

            for (const ore of this.oreSpawnsAmount) {
                if (ore.amount < data.maxAmountPerMap) {
                    spawnPosition = attemptGetSpawnPosition(this);
                    const oreSpawn: OreSpawn = new OreSpawn(this.name, spawnPosition, [oreResource], data.qualityLevel);
                    this.oreSpawns.push(oreSpawn);
                    ore.amount++;
                    if (ore.amount === data.maxAmountPerMap) break;
                }
            }

            this.oreSpawns = this.oreSpawns.filter((el) => el.position !== spawnPosition);
        });
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

    generateSafeZones() {
        for (const _portal in this._config.staticEntities.portals) {
            const portal = this._config.staticEntities.portals[_portal];
            this.safeZones.push(
                new SafeZone(
                    calculateEntityPosition(portal.location, this._config.size),
                    portal.safeZoneRadii
                )
            );
        }

        if (this._config.staticEntities.base) {
            const base = this._config.staticEntities.base;
            this.safeZones.push(
                new SafeZone(
                    calculateEntityPosition(base.location, this._config.size),
                    base.safeZoneRadii
                )
            );
        }
    }
}

function attemptGetSpawnPosition(spacemap: Spacemap): Vector2D {
    let spawnAttempt = 0;
    let position: Vector2D | undefined;
    while (spawnAttempt < 5) {
        const newPosition = {
            x: Math.floor(
                Math.random() * (spacemap._config.size.width + 1) -
                    spacemap._config.size.width / 2
            ),
            y: Math.floor(
                Math.random() * (spacemap._config.size.height + 1) -
                    spacemap._config.size.height / 2
            ),
        };

        if (spacemap.safeZones) {
            for (const safeZone of spacemap.safeZones) {
                if (safeZone.isInSafeZone(newPosition)) {
                    spawnAttempt++;
                    continue;
                }
            }
        }
        position = newPosition;
        break;
    }
    if (!position) {
        position = {
            x: (0.5 - Math.random()) * 10,
            y: (0.5 - Math.random()) * 10,
        };
    }
    return position;
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
    oreSpawns?: SpawnableOreSpawn[];
}

export interface SpawnableOreSpawn {
    oreName: PossibleOreNames;
    qualityLevel: number;
    amount: number;
    maxAmountPerMap: number;
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
