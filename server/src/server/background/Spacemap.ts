import { Alien } from "./Alien";
import { CargoDrop, OreResource } from "./CargoDrop";
import { CompanyBase, Entity, SafeZone, Portal, calculateEntityPosition} from "./Entity";
import { Item, PossibleItems } from "./Inventory";
import { Player } from "./Player";
import { ProjectileServer } from "./ProjectileServer";

export class Spacemap {
    readonly name: string;
    readonly size: SpacemapSize;
    entities: PossibleSpacemapEntities[];
    cargoboxes: CargoDrop[] = [];
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
        let safeZones: SafeZone[] = [];

        for (const portal in this._config.staticEntities.portals) {
            let location = this._config.staticEntities.portals[portal].location;
            let postion = calculateEntityPosition(location, this._config.size);
            let radii = this._config.staticEntities.portals[portal].safeZoneRadii;
            safeZones.push(new SafeZone(postion, radii))
        }
        if (this._config.staticEntities.base) {
            let location = this._config.staticEntities.base.location;
            let postion = calculateEntityPosition(location, this._config.size);
            let radii = this._config.staticEntities.base.safeZoneRadii;
            safeZones.push(new SafeZone(postion, radii))
        }
        


        for (const spawnableAlien in this._config.spawnableAliens) {
            const alienConfig = this._config.spawnableAliens[spawnableAlien];
            if (alienConfig.spawnLimit) {
                let alienCount = 0;

                for (const entity of this.entities) {
                    if (entity instanceof Alien && entity.name && alienCount < alienConfig.spawnLimit) {
                        alienCount++;
                    }
                }
                if (alienCount < alienConfig.spawnLimit) {
                    let spawnAttempt = 0;
                    while (spawnAttempt < 10) {
                        let x = (0.5 - Math.random()) * 10;
                        let y = (0.5 - Math.random()) * 10;
                    }
                    this.spawnAlien(spawnableAlien, {
                        x: (0.5 - Math.random()) * 10,
                        y: (0.5 - Math.random()) * 10,
                    });
                }
            }   
        }        
    }

    loadStaticEntities() {
        for (const portal in this._config.staticEntities.portals) {
            const _cfg = this._config.staticEntities.portals[portal];
            this.entities.push(
                new Portal(this, _cfg.location, _cfg.destination, _cfg.safeZoneRadii)
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