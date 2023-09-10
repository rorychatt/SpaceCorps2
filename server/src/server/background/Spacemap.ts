import { Alien } from "./Alien";
import { Entity } from "./Entity";

export class Spacemap {
    name: string;
    size: SpacemapSize;
    entities: Entity[];
    _config: SpacemapConfig;
    _maxAliens?: number;
    _allowedAliens?: string[];

    public constructor(config: SpacemapConfig) {
        this.entities = [];
        this._config = config;
        this.name = config.name;
        this.size = config.size;

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

    spawnAlien(name: string, position?: { x: number; y: number }) {
        const alien = new Alien(name, position)
        this.entities.push(alien)
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
                    x: (0.5 - Math.random()) * 10,
                    y: (0.5 - Math.random()) * 10,
                });
            }
        }
    }
}

export interface Spacemaps {
    [key: string]: Spacemap;
}

export interface PortalConfig {
    location: string;
    destination: string;
}

export interface StaticEntitiesConfig {
    portals: PortalConfig[];
    base?: {
        location: string;
        name: string;
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
