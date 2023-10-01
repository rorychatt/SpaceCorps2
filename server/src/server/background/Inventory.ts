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

    async putLaserToShip(
        laserName: string,
        shipName: string,
        ignoreInventoryCheck: boolean = false
    ) {
        const laser = this.findLaserByName(laserName);
        if (!ignoreInventoryCheck) {
            if (!laser) {
                console.log(`Laser '${laserName}' not found in the inventory.`);
                return;
            }
        }
        const ship = this.ships.find((s) => s.name === shipName);
        if (!ship) {
            console.log(`Ship '${shipName}' not found.`);
            return;
        }
        if (ship.currentLasers.length >= ship.maxLasers) {
            console.log(`Can not equip item, ship already full`);
        } else {
            await ship.equipLaser(laserName);
            console.log(`Equipped '${laserName}' to '${shipName}'.`);
            this.removeFirstItemByProperty(this.lasers, "name", laserName);
        }
    }

    async putSpeedGeneratorToShip(
        generatorName: string,
        shipName: string,
        ignoreInventoryCheck: boolean = false
    ) {
        const speedGenerator = this.findSpeedGeneratorByName(generatorName);
        if (!ignoreInventoryCheck) {
            if (!speedGenerator) {
                console.log(
                    `Speed Generator '${generatorName}' not found in the inventory.`
                );
                return;
            }
        }
        const ship = this.ships.find((s) => s.name === shipName);
        if (!ship) {
            console.log(`Ship '${shipName}' not found.`);
            return;
        }
        if (ship.currentGenerators.length >= ship.maxGenerators) {
            console.log(`Can not equip item, ship already full`);
        } else {
            await ship.equipSpeedGenerator(generatorName);
            console.log(`Equipped '${generatorName}' to '${shipName}'.`);
            this.removeFirstItemByProperty(
                this.shieldGenerators,
                "name",
                generatorName
            );
        }
    }

    async putShieldGeneratorToShip(
        generatorName: string,
        shipName: string,
        ignoreInventoryCheck: boolean = false
    ) {
        const shieldGenerator = this.findShieldGeneratorByName(generatorName);
        if (!ignoreInventoryCheck) {
            if (!shieldGenerator) {
                console.log(
                    `Shield Generator '${generatorName}' not found in the inventory.`
                );
                return;
            }
        }
        const ship = this.ships.find((s) => s.name === shipName);
        if (!ship) {
            console.log(`Ship '${shipName}' not found.`);
            return;
        }
        if (ship.currentGenerators.length >= ship.maxGenerators) {
            console.log(`Can not equip item, ship already full`);
        } else {
            await ship.equipShieldGenerator(generatorName);
            console.log(`Equipped '${generatorName}' to '${shipName}'.`);
            this.removeFirstItemByProperty(
                this.shieldGenerators,
                "name",
                generatorName
            );
        }
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

    async equipItem(itemName: string, shipName?: string) {
        let itemToEquip: PossibleItems | undefined;

        if (this.lasers.some((laser) => laser.name === itemName)) {
            itemToEquip = this.findLaserByName(itemName);
        } else if (
            this.shieldGenerators.some(
                (generator) => generator.name === itemName
            )
        ) {
            itemToEquip = this.findShieldGeneratorByName(itemName);
        } else if (
            this.speedGenerators.some(
                (generator) => generator.name === itemName
            )
        ) {
            itemToEquip = this.findSpeedGeneratorByName(itemName);
        }

        if (!itemToEquip) {
            console.log(`Item '${itemName}' not found in the inventory.`);
            return;
        }

        const activeShip = await this.getActiveShip();

        if (activeShip) {
            if (itemToEquip instanceof Laser) {
                await this.putLaserToShip(itemName, activeShip.name);
            } else if (itemToEquip instanceof ShieldGenerator) {
                await this.putShieldGeneratorToShip(itemName, activeShip.name);
            } else if (itemToEquip instanceof SpeedGenerator) {
                await this.putSpeedGeneratorToShip(itemName, activeShip.name);
            }
        } else {
            console.log(`Could not find active ship.`);
        }
    }

    async unequipItem(itemName: string) {
        const activeShip = await this.getActiveShip();

        if (!activeShip) {
            console.log("No active ship found. Cannot remove item.");
            return;
        }

        let itemToRemove: PossibleItems | undefined;

        // Find the item by name in the active ship
        if (activeShip.currentLasers.some((laser) => laser.name === itemName)) {
            itemToRemove = activeShip.currentLasers.find(
                (laser) => laser.name == itemName
            );
        } else if (
            activeShip.currentGenerators.some(
                (generator) => generator.name == itemName
            )
        ) {
            itemToRemove = activeShip.currentGenerators.find(
                (generator) => generator.name == itemName
            );
        }

        if (!itemToRemove) {
            console.log(`Item '${itemName}' not found in active ship.`);
            return;
        }

        if (itemToRemove instanceof Laser) {
            await this.removeLaserFromShip(itemToRemove.name, activeShip.name);
        } else if (itemToRemove instanceof ShieldGenerator) {
            await this.removeShieldGeneratorFromShip(
                itemToRemove.name,
                activeShip.name
            );
        } else if (itemToRemove instanceof SpeedGenerator) {
            await this.removeShieldGeneratorFromShip(
                itemToRemove.name,
                activeShip.name
            );
        } else {
            console.log(
                `Unhandled item type in removing items from active ship`
            );
        }
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

export class InventoryDataDTO {
    lasers: LaserDTO[] = [];
    shieldGenerators: ShieldGeneratorDTO[] = [];
    speedGenerators: SpeedGeneratorDTO[] = [];
    ships: ShipItemDTO[] = [];

    async convertInventory(inventory: Inventory): Promise<void> {
        await Promise.all([
            this.convertLasers(inventory.lasers),
            this.convertShieldGenerators(inventory.shieldGenerators),
            this.convertSpeedGenerators(inventory.speedGenerators),
            this.convertShips(inventory.ships),
        ]);
    }

    private async convertLasers(lasers: Laser[]): Promise<void> {
        this.lasers = await Promise.all(
            lasers.map(async (laser) => new LaserDTO(laser))
        );
    }

    private async convertShieldGenerators(shieldGenerators: ShieldGenerator[]): Promise<void> {
        this.shieldGenerators = await Promise.all(
            shieldGenerators.map(async (shieldGenerator) => new ShieldGeneratorDTO(shieldGenerator))
        );
    }

    private async convertSpeedGenerators(speedGenerators: SpeedGenerator[]): Promise<void> {
        this.speedGenerators = await Promise.all(
            speedGenerators.map(async (speedGenerator) => new SpeedGeneratorDTO(speedGenerator))
        );
    }

    private async convertShips(ships: ShipItem[]): Promise<void> {
        this.ships = await Promise.all(
            ships.map(async (shipItem) => new ShipItemDTO(shipItem))
        );
    }
}

export class LaserDTO {
    name: string;
    constructor(laser: Laser) {
        this.name = laser.name;
    }
}

export class ShieldGeneratorDTO {
    name: string;
    _type: string = "ShieldGenerator"
    constructor(shieldGenerator: ShieldGenerator) {
        this.name = shieldGenerator.name;
    }
}

export class SpeedGeneratorDTO {
    name: string;
    _type: string = "SpeedGenerator"
    constructor(speedGenerator: SpeedGenerator) {
        this.name = speedGenerator.name;
    }
}

export class ShipItemDTO {
    name: string;
    isActive: boolean;
    currentLasers: LaserDTO[] = [];
    currentGenerators: (ShieldGeneratorDTO | SpeedGeneratorDTO)[] = [];

    constructor(shipItem: ShipItem) {
        this.name = shipItem.name;
        this.isActive = shipItem.isActive;
        shipItem.currentLasers.forEach((laser) => {
            this.currentLasers.push(new LaserDTO(laser));
        });
        shipItem.currentGenerators.forEach((generator) => {
            if (generator instanceof ShieldGenerator) {
                this.currentGenerators.push(new ShieldGeneratorDTO(generator));
            } else if (generator instanceof SpeedGenerator) {
                this.currentGenerators.push(new SpeedGeneratorDTO(generator));
            }
        });
    }
}

export type ItemPrice = { credits?: number; thulium?: number };

export type PossibleItems = Laser | ShieldGenerator | SpeedGenerator | ShipItem;
