import { gameServer } from "../main";
import {
    Laser,
    LaserAmmo,
    PossibleItems,
    RocketAmmo,
    ShieldGenerator,
    ShipItem,
    SpeedGenerator,
    generatorData,
    laserAmmoData,
    laserData,
    rocketAmmoData,
    shipData,
} from "./Inventory";
import { ItemReward } from "./Reward";

export class Shop {
    items: Record<string, PossibleItems>;

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
                const laserAmmoItem = new RocketAmmo(rocketAmmoName);
                this.addItem(rocketAmmoName, laserAmmoItem);
            }
        }
    }

    findItemByName(name: string): PossibleItems | undefined {
        return this.items[name];
    }

    addItem(name: string, item: PossibleItems) {
        this.items[name] = item;
    }

    async sellItem(playerName: string, itemName: string, amount?: number) {
        const player = await gameServer.getPlayerByUsername(playerName);
        const item = this.findItemByName(itemName);
        if (!player) {
            console.log(
                `Warning! Could not sell item to player ${playerName} because playerName not found`
            );
            return;
        }
        if (!item) {
            console.log(`Warning! Could not find item in shop: ${itemName}`);
            return;
        }

        if (amount) {
            const itemPrice = {...item.price};
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
                gameServer.rewardServer.registerItemReward(player.uuid, item, amount);
            } else if (
                itemPrice.thulium &&
                player.stats.thulium >= itemPrice.thulium
            ) {
                player.stats.thulium -= itemPrice.thulium;
                gameServer.rewardServer.registerItemReward(player.uuid, item, amount);
            }
        } else {
            const itemPrice = item.price;
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
