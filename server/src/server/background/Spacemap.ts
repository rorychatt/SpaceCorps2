import { Alien } from "./Alien";
import { CargoDrop, OreResource } from "./CargoDrop";
import { Entity, Portal } from "./Entity";
import { Item, PossibleItems } from "./Inventory";
import { Player } from "./Player";
import { ProjectileServer } from "./ProjectileServer";

export class Spacemap {
    readonly name: string;
    readonly size: SpacemapSize;
    entities: (Player | Alien | Entity | Portal)[];
    cargoboxes: CargoDrop[] = [];
    _config: SpacemapConfig;
    _maxAliens?: number;
    _allowedAliens?: string[];
    projectileServer: ProjectileServer;

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
        // TODO: maybe implement better storing of what entities are spawned, for loop is slow
        // BUG: this suggests there is a single type of aliens
        if (this._config.spawnableAliens) {
            let alienCount = 0;
            for (const entity of this.entities) {
                if (entity instanceof Alien) {
                    alienCount++;
                }
            }
            if (
                this._maxAliens &&
                this._allowedAliens &&
                alienCount < this._maxAliens
            ) {
                this.spawnAlien(this._allowedAliens[0], {
                    // TODO: Tweak parameters so aliens spawn accross the map, avoiding areas where there are portals

                    x: (0.5 - Math.random()) * 10,
                    y: (0.5 - Math.random()) * 10,
                });
            }
        }
    }

    loadStaticEntities() {
        for (const portal in this._config.staticEntities.portals) {
            const _cfg = this._config.staticEntities.portals[portal];
            this.entities.push(
                new Portal(this, _cfg.location, _cfg.destination)
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
    readonly location: PortalLocations;
    readonly destination: string;
}

export interface StaticEntitiesConfig {
    portals: PortalConfig[];
    base?: {
        location: string;
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

export type PortalLocations =
    | "top-left"
    | "top"
    | "top-right"
    | "right"
    | "bottom-right"
    | "bottom"
    | "bottom-left"
    | "left"
    | "middle";
