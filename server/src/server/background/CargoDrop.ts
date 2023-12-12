import { Entity } from "./Entity";
import { PossibleItems } from "./Inventory";
import { Spacemap, Vector2D } from "./Spacemap";

export class CargoDrop extends Entity {
    readonly _type: string = "CargoDrop";
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
    readonly _type: string = "OreSpawn";
    ores: OreResource[] = [];
    qualityLevel: number = 1;
    currentAmount: number = 0;
    maxAmount: number = 10;

    constructor(
        currentMap: string,
        position: Vector2D,
        ores: OreResource[],
        qualityLevel?: number,
        currentAmount?: number,
        maxAmount?: number
    ) {
        super(currentMap, "OreSpawn", position);
        this.ores = ores;
        if (qualityLevel) {
            this.qualityLevel = qualityLevel;
            this._recalculateOres();
        }

        if(maxAmount) 
            this.maxAmount = maxAmount;

        if(currentAmount) 
            this.currentAmount = currentAmount;
    }

    _recalculateOres() {
        if (this.qualityLevel >= 2)
            this.ores.forEach((ore) => {
                ore.amount = Math.floor(
                    Math.pow(ore.amount, this.qualityLevel - 0.75)
                );
            });
    }
}

export class OreResource {
    readonly _type: string = "Ore";
    name: PossibleOreNames;
    amount: number = 1;

    constructor(name: PossibleOreNames, amount?: number) {
        this.name = name;
        if (amount) this.amount = amount;
    }
}

export class OreResourceDTO {
    name: string;
    amount: number;

    constructor(oreResource: OreResource) {
        this.name = oreResource.name;
        this.amount = oreResource.amount;
    }
}

export class OreSpawnDTO {
    ores: OreResourceDTO[] = [];
    qualityLevel: number;
    position: Vector2D;

    constructor(oreSpawn: OreSpawn) {
        for (const _oreResource in oreSpawn.ores) {
            const oreResource = oreSpawn.ores[_oreResource];
            this.ores.push(new OreResourceDTO(oreResource));
        }
        this.qualityLevel = oreSpawn.qualityLevel;
        this.position = oreSpawn.position;
    }
}

export type PossibleOreNames = "radium" | "agronite";
