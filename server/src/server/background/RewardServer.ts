import { updateInventoryData } from "../db/db";
import { gameServer } from "../main";
import { CargoDrop } from "./CargoDrop";
import {
    ConsumableItems,
    PossibleItems,
    consumableItemsData,
} from "./Inventory";
import { Player } from "./Player";
import {
    AlienKillReward,
    CargoDropReward,
    ConsumableItemReward,
    CreditsReward,
    CreditsSetReward,
    ExperienceReward,
    HonorReward,
    ItemReward,
    PlayerKillReward,
    PossibleRewards,
    ThuliumReward,
    ThuliumSetReward,
} from "./Reward";

export class RewardServer {
    pendingRewards: PossibleRewards[] = [];

    constructor() {}

    registerHonorReward(recipientUUID: string, honor: number) {
        this.pendingRewards.push(new HonorReward(recipientUUID, honor));
    }

    registerExperienceReward(recipientUUID: string, experience: number) {
        this.pendingRewards.push(
            new ExperienceReward(recipientUUID, experience)
        );
    }

    registerThuliumReward(recipientUUID: string, thulium: number) {
        this.pendingRewards.push(new ThuliumReward(recipientUUID, thulium));
    }

    registerThuliumSetReward(recipientUUID: string, thulium: number) {
        this.pendingRewards.push(new ThuliumSetReward(recipientUUID, thulium));
    }

    registerCreditsReward(recipientUUID: string, credits: number) {
        this.pendingRewards.push(new CreditsReward(recipientUUID, credits));
    }

    registerCreditsSetReward(recipientUUID: string, credits: number) {
        this.pendingRewards.push(new CreditsSetReward(recipientUUID, credits));
    }

    registerPlayerKillReward(
        recipientUUID: string,
        killReward: {
            credits: number;
            thulium: number;
            experience: number;
            honor: number;
        }
    ) {
        this.pendingRewards.push(
            new PlayerKillReward(recipientUUID, killReward)
        );
    }

    registerAlienKillReward(
        recipientUUID: string,
        killReward: {
            credits: number;
            thulium: number;
            experience: number;
            honor: number;
        }
    ) {
        this.pendingRewards.push(
            new AlienKillReward(recipientUUID, killReward)
        );
    }

    registerItemReward(
        recipientUUID: string,
        reward: PossibleItems | ConsumableItems,
        amount?: number
    ) {
        if (amount) {
            this.pendingRewards.push(
                new ItemReward(recipientUUID, reward, amount)
            );
        } else {
            this.pendingRewards.push(new ItemReward(recipientUUID, reward));
        }
    }

    registerCargoDropReward(recipientUUID: string, cargoDrop: CargoDrop) {
        this.pendingRewards.push(new CargoDropReward(recipientUUID, cargoDrop));
    }

    registerConsumableItemReward(
        recipientUUID: string,
        consumable: ConsumableItems
    ) {
        this.pendingRewards.push(
            new ConsumableItemReward(recipientUUID, consumable)
        );
    }

    async issueReward(player: Player, reward: PossibleRewards) {
        if (reward instanceof HonorReward) {
            player.addHonor(reward.honor);
        } else if (reward instanceof ExperienceReward) {
            player.addExperience(reward.experience);
            player.level =
                await gameServer.rankingServer.experienceServer.calculatePlayerLevel(
                    player
                );
        } else if (reward instanceof ThuliumReward) {
            player.addThulium(reward.thulium);
        } else if (reward instanceof ThuliumSetReward) {
            player.setThulium(reward.thulium);
        } else if (reward instanceof CreditsReward) {
            player.addCredits(reward.credits);
        } else if (reward instanceof CreditsSetReward) {
            player.setCredits(reward.credits);
        } else if (reward instanceof PlayerKillReward) {
            player.addCredits(reward.credits);
            player.addThulium(reward.thulium);
            player.addExperience(reward.experience);
            player.addHonor(reward.honor);
            player.level =
                await gameServer.rankingServer.experienceServer.calculatePlayerLevel(
                    player
                );
        } else if (reward instanceof AlienKillReward) {
            player.addCredits(reward.credits);
            player.addThulium(reward.thulium);
            player.addExperience(reward.experience);
            player.addHonor(reward.honor);
            player.level =
                await gameServer.rankingServer.experienceServer.calculatePlayerLevel(
                    player
                );
        } else if (reward instanceof ItemReward) {
            player.inventory.addItem(reward.item, reward.amount);
        } else if (reward instanceof CargoDropReward) {
            for (const item in reward.items) {
                player.inventory.addItem(reward.items[item]);
            }
            for (const ore in reward.ores) {
                player.inventory.cargoBay.addOre(reward.ores[ore]);
            }
        } else if (reward instanceof ConsumableItemReward) {
            if (reward.consumable._type == "ExperienceItem") {
                player.addExperience(
                    consumableItemsData[reward.consumable.name].amount
                );
            } else if (reward.consumable._type == "HonorItem") {
                player.addHonor(
                    consumableItemsData[reward.consumable.name].amount
                );
            } else if (reward.consumable._type == "ThuliumItem") {
                player.addThulium(
                    consumableItemsData[reward.consumable.name].amount
                );
            } else if (reward.consumable._type == "CreditsItem") {
                player.addCredits(
                    consumableItemsData[reward.consumable.name].amount
                );
            }
        }

        // updateInventoryData(player.name, player.inventory)
    }
}
