import { gameServer } from "../main";
import {
    ConsumableItems,
    CreditsItem,
    ExperienceItem,
    HonorItem,
    Laser,
    LaserAmmo,
    PossibleItems,
    RocketAmmo,
    ShieldGenerator,
    ShipItem,
    SpeedGenerator,
    ThuliumItem,
    consumableItemsData,
    generatorData,
    laserAmmoData,
    laserData,
    rocketAmmoData,
    shipData,
} from "./Inventory";

export class Shop {
    items: Record<string, (PossibleItems | ConsumableItems)>;

    constructor() { 
        this.items = {};

        for (const laserName in laserData) {
            const laser = new Laser(laserName);
            this.addItem(laserName, laser);
        }

        for (const generatorName in generatorData) {
            if (generatorData[generatorName].baseSpeed) {
                const generator = new SpeedGenerator(generatorName);
                this.addItem(generatorName, generator);
            } else {
                const generator = new ShieldGenerator(generatorName);
                this.addItem(generatorName, generator);
            }
        }

        for (const shipName in shipData) {
            if (shipData[shipName]) {
                const shipItem = new ShipItem(shipName);
                this.addItem(shipName, shipItem);
            }
        }

        for (const laserAmmoName in laserAmmoData) {
            if (laserAmmoData[laserAmmoName]) {
                const laserAmmoItem = new LaserAmmo(laserAmmoName);
                this.addItem(laserAmmoName, laserAmmoItem);
            }
        }

        for (const rocketAmmoName in rocketAmmoData) {
            if (rocketAmmoData[rocketAmmoName]) {
                const rocketAmmoItem = new RocketAmmo(rocketAmmoName);
                this.addItem(rocketAmmoName, rocketAmmoItem);
            }
        }

        for (const consumableName in consumableItemsData) {
            if (consumableItemsData[consumableName]) {
                switch (consumableItemsData[consumableName].type) {
                    case "ExperienceItem":
                        const experienceItem = new ExperienceItem(
                            consumableName
                        );
                        this.addItem(consumableName, experienceItem);
                        break;
                    case "HonorItem":
                        const honorItem = new HonorItem(consumableName);
                        this.addItem(consumableName, honorItem);
                        break;
                    case "CreditsItem":
                        const creditsItem = new CreditsItem(consumableName);
                        this.addItem(consumableName, creditsItem);
                        break;
                    case "ThuliumItem":
                        const thuliumItem = new ThuliumItem(consumableName);
                        this.addItem(consumableName, thuliumItem);
                        break;
                    default:
                        console.log(
                            `Could not create item in shop for ${consumableName}`
                        );
                }
            }
        }
    }

    findItemByName(name: string): PossibleItems | ConsumableItems | undefined {
        return this.items[name];
    }

    addItem(name: string, item: PossibleItems | ConsumableItems) {
        this.items[name] = item;
    }

    async sellItem(playerName: string, itemName: string, amount?: number) {
        const player = await gameServer.getPlayerByUsername(playerName);
        const _item = this.findItemByName(itemName);

        if (!player) {
            console.log(
                `Warning! Could not sell item to player ${playerName} because playerName not found`
            );
            return;
        }
        if (!_item) {
            console.log(`Warning! Could not find item in shop: ${itemName}`);
            return;
        }

        let item: PossibleItems;

        if (_item instanceof Laser) {
            item = new Laser(_item.name);
        } else if (_item instanceof SpeedGenerator) {
            item = new SpeedGenerator(_item.name);
        } else if (_item instanceof ShieldGenerator) {
            item = new ShieldGenerator(_item.name);
        } else if (_item instanceof ShipItem) {
            item = new ShipItem(_item.name, false);
        } else if (_item instanceof RocketAmmo) {
            item = new RocketAmmo(_item.name, _item.amount);
        } else if (_item instanceof LaserAmmo) {
            item = new LaserAmmo(_item.name, _item.amount);
        } else {
            console.log(`Unhandled item type!!!`);
            return;
        }

        if (item._type == "ShipItem") {
            for (const ship in player.inventory.ships) {
                if (player.inventory.ships[ship].name == itemName) return;
            }
        }

        if (amount) {
            const itemPrice = { ...item.price };
            if (item.price.credits) {
                itemPrice.credits = item.price.credits * amount;
            }
            if (item.price.thulium) {
                itemPrice.thulium = item.price.thulium * amount;
            }
            if (
                itemPrice.credits &&
                player.stats.credits >= itemPrice.credits
            ) {
                player.stats.credits -= itemPrice.credits;
                gameServer.rewardServer.registerItemReward(
                    player.uuid,
                    item,
                    amount
                );
            } else if (
                itemPrice.thulium &&
                player.stats.thulium >= itemPrice.thulium
            ) {
                player.stats.thulium -= itemPrice.thulium;
                gameServer.rewardServer.registerItemReward(
                    player.uuid,
                    item,
                    amount
                );
            }
        } else {
            const itemPrice = { ...item.price };
            if (
                itemPrice.credits &&
                player.stats.credits >= itemPrice.credits
            ) {
                player.stats.credits -= itemPrice.credits;
                gameServer.rewardServer.registerItemReward(player.uuid, item);
            } else if (
                itemPrice.thulium &&
                player.stats.thulium >= itemPrice.thulium
            ) {
                player.stats.thulium -= itemPrice.thulium;
                gameServer.rewardServer.registerItemReward(player.uuid, item);
            }
        }
    }
}
