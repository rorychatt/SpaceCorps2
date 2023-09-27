import { updateInventoryData } from "../db/db";
import { PossibleItems } from "./Inventory";
import { Player } from "./Player";
import {
    AlienKillReward,
    CreditsReward,
    ExperienceReward,
    HonorReward,
    ItemReward,
    PlayerKillReward,
    PossibleRewards,
    ThulimReward,
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
        this.pendingRewards.push(new ThulimReward(recipientUUID, thulium));
    }

    registerCreditsReward(recipientUUID: string, credits: number) {
        this.pendingRewards.push(new CreditsReward(recipientUUID, credits));
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

    registerItemReward(recipientUUID: string, reward: PossibleItems) {
        this.pendingRewards.push(new ItemReward(recipientUUID, reward));
    }

    issueReward(player: Player, reward: PossibleRewards) {
        if (reward instanceof HonorReward) {
            player.addHonor(reward.honor);
        } else if (reward instanceof ExperienceReward) {
            player.addExperience(reward.experience);
        } else if (reward instanceof ThulimReward) {
            player.addThulium(reward.thulium);
        } else if (reward instanceof CreditsReward) {
            player.addCredits(reward.credits);
        } else if (reward instanceof PlayerKillReward) {
            player.addCredits(reward.credits);
            player.addThulium(reward.thulium);
            player.addExperience(reward.experience);
            player.addHonor(reward.honor);
        } else if (reward instanceof AlienKillReward) {
            player.addCredits(reward.credits);
            player.addThulium(reward.thulium);
            player.addExperience(reward.experience);
            player.addHonor(reward.honor);
        } else if (reward instanceof ItemReward) {
            player.inventory.addItem(reward.item);
            updateInventoryData(player.name, player.inventory)
        }
    }
}
