import { Entity } from "./Entity";

export class Spacemap {
    name: string;
    size: SpacemapSize;
    entities: Entity[];

    public constructor(config: SpacemapConfig) {
        this.entities = [];
        this.name = "test";
        this.size = { width: 160, height: 90 };
        if (config) {
            this.name = config.name;
            this.size = config.size;
        } else {
            console.log(`Warning! Tried to load a map without a config file!`);
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
    height: number
}

export interface SpacemapConfig {
    name: string;
    size: SpacemapSize;
    staticEntities: StaticEntitiesConfig;
}



