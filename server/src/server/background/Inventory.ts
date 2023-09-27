import * as fs from "fs";

export const shipData = JSON.parse(
    fs.readFileSync("./src/server/data/ships.json").toString("utf-8")
);
export const laserData = JSON.parse(
    fs.readFileSync("./src/server/data/lasers.json").toString("utf-8")
);
export const generatorData = JSON.parse(
    fs.readFileSync("./src/server/data/generators.json").toString("utf-8")
);

export class Inventory {
    lasers: Laser[];
    shieldGenerators: ShieldGenerator[];
    speedGenerators: SpeedGenerator[];
    ships: ShipItem[];

    constructor() {
        this.lasers = [];
        this.shieldGenerators = [];
        this.speedGenerators = [];
        this.ships = [];
    }

    async addItem(item: PossibleItems) {
        if (item instanceof Laser) {
            this.lasers.push(item);
        } else if (item instanceof ShieldGenerator) {
            this.shieldGenerators.push(item);
        } else if (item instanceof SpeedGenerator) {
            this.speedGenerators.push(item);
        } else if (item instanceof ShipItem) {
            this.ships.push(item);
        }
    }

    async putLaserToShip(laserName: string, shipName: string) {
        const laser = this.findLaserByName(laserName);
        if (!laser) {
            console.log(`Laser '${laserName}' not found in the inventory.`);
            return;
        }
        const ship = this.ships.find((s) => s.name === shipName);
        if (!ship) {
            console.log(`Ship '${shipName}' not found.`);
            return;
        }
        await ship.equipLaser(laserName);
        console.log(`Equipped '${laserName}' to '${shipName}'.`);
        this.removeFirstItemByProperty(this.lasers, "name", laserName);
    }

    async putSpeedGeneratorToShip(generatorName: string, shipName: string) {
        const speedGenerator = this.findSpeedGeneratorByName(generatorName);
        if (!speedGenerator) {
            console.log(
                `Speed Generator '${generatorName}' not found in the inventory.`
            );
            return;
        }
        const ship = this.ships.find((s) => s.name === shipName);
        if (!ship) {
            console.log(`Ship '${shipName}' not found.`);
            return;
        }
        await ship.equipSpeedGenerator(generatorName);
        console.log(`Equipped '${generatorName}' to '${shipName}'.`);
        this.removeFirstItemByProperty(
            this.shieldGenerators,
            "name",
            generatorName
        );
    }

    async putShieldGeneratorToShip(generatorName: string, shipName: string) {
        const shieldGenerator = this.findShieldGeneratorByName(generatorName);
        if (!shieldGenerator) {
            console.log(
                `Shield Generator '${generatorName}' not found in the inventory.`
            );
            return;
        }
        const ship = this.ships.find((s) => s.name === shipName);
        if (!ship) {
            console.log(`Ship '${shipName}' not found.`);
            return;
        }
        await ship.equipShieldGenerator(generatorName);
        console.log(`Equipped '${generatorName}' to '${shipName}'.`);
        this.removeFirstItemByProperty(
            this.shieldGenerators,
            "name",
            generatorName
        );
    }

    async removeLaserFromShip(laserName: string, shipName: string) {
        const ship = this.ships.find((s) => s.name === shipName);

        if (!ship) {
            console.log(`Ship '${shipName}' not found.`);
            return;
        }
        const removedLaser = await ship.removeLaser(laserName);
        if (removedLaser) {
            this.lasers.push(removedLaser);
            console.log(
                `Removed '${laserName}' from '${shipName}' and added it back to the inventory.`
            );
        } else {
            console.log(`Laser '${laserName}' not found on '${shipName}'.`);
        }
    }

    async removeSpeedGeneratorFromShip(
        generatorName: string,
        shipName: string
    ) {
        const ship = this.ships.find((s) => s.name === shipName);
        if (!ship) {
            console.log(`Ship '${shipName}' not found.`);
            return;
        }
        const removedGenerator = await ship.removeSpeedGenerator(generatorName);
        if (removedGenerator) {
            this.speedGenerators.push(removedGenerator);
            console.log(
                `Removed '${generatorName}' from '${shipName}' and added it back to the inventory.`
            );
        } else {
            console.log(
                `Speed Generator '${generatorName}' not found on '${shipName}'.`
            );
        }
    }

    async removeShieldGeneratorFromShip(
        generatorName: string,
        shipName: string
    ) {
        const ship = this.ships.find((s) => s.name === shipName);
        if (!ship) {
            console.log(`Ship '${shipName}' not found.`);
            return;
        }
        const removedGenerator = await ship.removeShieldGenerator(
            generatorName
        );
        if (removedGenerator) {
            this.shieldGenerators.push(removedGenerator);
            console.log(
                `Removed '${generatorName}' from '${shipName}' and added it back to the inventory.`
            );
        } else {
            console.log(
                `Shield Generator '${generatorName}' not found on '${shipName}'.`
            );
        }
    }

    async getActiveShip() {
        return this.ships.find((s) => s.isActive == true);
    }

    private findLaserByName(name: string): Laser | undefined {
        return this.lasers.find((laser) => laser.name === name);
    }

    private findSpeedGeneratorByName(name: string): SpeedGenerator | undefined {
        return this.speedGenerators.find(
            (generator) => generator.name === name
        );
    }

    private findShieldGeneratorByName(
        name: string
    ): ShieldGenerator | undefined {
        return this.shieldGenerators.find(
            (generator) => generator.name === name
        );
    }

    private removeFirstItemByProperty<T>(
        list: T[],
        propertyName: string,
        propertyValue: any
    ): boolean {
        const index = list.findIndex(
            (item: any) => item[propertyName] === propertyValue
        );
        if (index !== -1) {
            list.splice(index, 1);
            return true; // Item removed successfully
        }
        return false; // Item not found
    }
}

export class Item {
    name: string;
    constructor(name: string) {
        this.name = name;
    }
}

export class Laser extends Item {
    _type: string;
    maxDamage: number;
    damageVariance: number;
    criticalChance: number;
    criticalMultiplier: number;
    price: ItemPrice;

    constructor(name: string) {
        super(name);
        this._type = "Laser";
        this.maxDamage = laserData[name].maxDamage;
        this.damageVariance = laserData[name].damageVariance;
        this.criticalChance = laserData[name].criticalChance;
        this.criticalMultiplier = laserData[name].criticalMultiplier;
        this.price = {
            credits: laserData[name].price.credits,
            thulium: laserData[name].price.thulium,
        };
    }
}

export class ShieldGenerator extends Item {
    _type: string;
    shieldPoints: number;
    shieldAbsorbance: number;
    price: ItemPrice;

    constructor(name: string) {
        super(name);
        this._type = "ShieldGenerator";
        this.shieldPoints = generatorData[name].shieldPoints;
        this.shieldAbsorbance = generatorData[name].shieldAbsorbance;
        this.price = {
            credits: generatorData[name].price.credits,
            thulium: generatorData[name].price.thulium,
        };
    }
}

export class SpeedGenerator extends Item {
    _type: string;
    baseSpeed: number;
    price: ItemPrice;

    constructor(name: string) {
        super(name);
        this._type = "SpeedGenerator";
        this.baseSpeed = generatorData[name].baseSpeed;
        this.price = {
            credits: generatorData[name].price.credits,
            thulium: generatorData[name].price.thulium,
        };
    }
}

export class ShipItem extends Item {
    maxHealth: number;
    baseSpeed: number;
    maxLasers: number;
    maxGenerators: number;
    price: { credits?: number; thulium?: number };

    currentLasers: Laser[] = [];
    currentGenerators: (ShieldGenerator | SpeedGenerator)[] = [];
    isActive: boolean;

    constructor(shipName: string, activeShip?: boolean) {
        super(shipName);
        this.maxHealth = shipData[shipName].maxHealth;
        this.baseSpeed = shipData[shipName].baseSpeed;
        this.maxLasers = shipData[shipName].maxLasers;
        this.maxGenerators = shipData[shipName].maxGenerators;
        this.price = {
            credits: shipData[shipName].price.credits,
            thulium: shipData[shipName].price.thulium,
        };
        this.isActive = false;
        if (activeShip) {
            this.isActive = activeShip;
        }
    }

    async equipLaser(laserName: string) {
        try {
            if (this.currentLasers.length < this.maxLasers) {
                this.currentLasers.push(new Laser(laserName));
            }
        } catch (err) {
            console.log(`Tried to equip laser but failed: ${laserName}`);
        }
    }

    async equipShieldGenerator(generatorName: string) {
        try {
            if (this.currentGenerators.length < this.maxGenerators) {
                this.currentGenerators.push(new ShieldGenerator(generatorName));
            }
        } catch (err) {
            console.log(
                `Tried to equip shield generator but failed: ${generatorName}`
            );
        }
    }

    async equipSpeedGenerator(generatorName: string) {
        try {
            if (this.currentGenerators.length < this.maxGenerators) {
                this.currentGenerators.push(new SpeedGenerator(generatorName));
            }
        } catch (err) {
            console.log(
                `Tried to equip speed generator but failed: ${generatorName}`
            );
        }
    }

    async removeLaser(laserName: string): Promise<Laser | undefined> {
        const index = this.currentLasers.findIndex(
            (laser) => laser.name === laserName
        );

        if (index !== -1) {
            const removedLaser = this.currentLasers.splice(index, 1)[0];
            return removedLaser;
        }

        return undefined; // Laser not found on the ship
    }

    async removeSpeedGenerator(
        generatorName: string
    ): Promise<SpeedGenerator | undefined> {
        const index = this.currentGenerators.findIndex(
            (generator) =>
                generator.name === generatorName &&
                generator._type === "SpeedGenerator"
        );

        if (index !== -1) {
            const removedGenerator = this.currentGenerators.splice(index, 1)[0];
            return removedGenerator as SpeedGenerator;
        }

        return undefined; // Speed Generator not found on the ship
    }

    async removeShieldGenerator(
        generatorName: string
    ): Promise<ShieldGenerator | undefined> {
        const index = this.currentGenerators.findIndex(
            (generator) =>
                generator.name === generatorName &&
                generator._type === "ShieldGenerator"
        );

        if (index !== -1) {
            const removedGenerator = this.currentGenerators.splice(index, 1)[0];
            return removedGenerator as ShieldGenerator;
        }

        return undefined; // Shield Generator not found on the ship
    }
}

export type ItemPrice = { credits?: number; thulium?: number };

export type PossibleItems = Laser | ShieldGenerator | SpeedGenerator | ShipItem;
