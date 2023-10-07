import { Entity } from "./Entity";
import { PossibleItems } from "./Inventory";
import { Spacemap, Vector2D } from "./Spacemap";

export class CargoDrop extends Entity {
    _type: string = "CargoDrop";
    ores: OreResource[] = [];
    items: PossibleItems[] = [];

    constructor(
        currentMap: string,
        position: Vector2D,
        ores?: OreResource[],
        items?: PossibleItems[]
    ) {
        super(currentMap, "CargoDrop", position);
        if (ores) this.ores = ores;
        if (items) this.items = items;
    }
}

export class OreSpawn extends Entity {
    _type: string = "OreSpawn";
    ores: OreResource[] = [];

    constructor(map: Spacemap, position: Vector2D, ores: OreResource[]) {
        super(map.name, "OreSpawn", position);
        this.ores = ores;
    }
}

export class OreResource {
    _type: string = "Ore";
    name: PossibleOreNames;
    amount: number;

    constructor(name: PossibleOreNames, amount: number) {
        this.name = name;
        this.amount = amount;
    }
}

export type PossibleOreNames = "radium" | "agronite";
