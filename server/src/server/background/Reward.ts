import { PossibleItems } from "./Inventory";

export class Reward {
    recipientUUID: string;
    constructor(recipientUUID: string) {
        this.recipientUUID = recipientUUID;
    }
}

export class AlienKillReward extends Reward {
    credits: number;
    thulium: number;
    experience: number;
    honor: number;

    constructor(
        recipientUUID: string,
        reward: {
            credits: number;
            thulium: number;
            experience: number;
            honor: number;
        }
    ) {
        super(recipientUUID);
        this.credits = reward.credits;
        this.thulium = reward.thulium;
        this.experience = reward.experience;
        this.honor = reward.honor;
    }
}

export class PlayerKillReward extends Reward {
    credits: number;
    thulium: number;
    experience: number;
    honor: number;

    constructor(
        recipientUUID: string,
        reward: {
            credits: number;
            thulium: number;
            experience: number;
            honor: number;
        }
    ) {
        super(recipientUUID);
        this.credits = reward.credits;
        this.thulium = reward.thulium;
        this.experience = reward.experience;
        this.honor = reward.honor;
    }
}

export class CreditsReward extends Reward {
    credits: number;

    constructor(recipientUUID: string, credits: number) {
        super(recipientUUID);
        this.credits = credits;
    }
}

export class ThulimReward extends Reward {
    thulium: number;

    constructor(recipientUUID: string, thulium: number) {
        super(recipientUUID);
        this.thulium = thulium;
    }
}

export class ExperienceReward extends Reward {
    experience: number;

    constructor(recipientUUID: string, experience: number) {
        super(recipientUUID);
        this.experience = experience;
    }
}

export class HonorReward extends Reward {
    honor: number;

    constructor(recipientUUID: string, honor: number) {
        super(recipientUUID);
        this.honor = honor;
    }
}

export class ItemReward extends Reward {
    item: PossibleItems;
    amount?: number;

    constructor(recipientUUID: string, item: PossibleItems, amount?: number) {
        super(recipientUUID);
        this.item = item;
        if (amount) {
            this.amount = amount;
        }
    }
}

export type PossibleRewards =
    | HonorReward
    | ExperienceReward
    | ThulimReward
    | CreditsReward
    | PlayerKillReward
    | AlienKillReward
    | ItemReward;
