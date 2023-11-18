import { CargoDrop, OreResource, OreSpawn } from "./CargoDrop";
import { ConsumableItems, PossibleItems } from "./Inventory";

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

export class CreditsSetReward extends Reward {
    credits: number;

    constructor(recipientUUID: string, credits: number) {
        super(recipientUUID);
        this.credits = credits;
    }
}

export class ThuliumReward extends Reward {
    thulium: number;

    constructor(recipientUUID: string, thulium: number) {
        super(recipientUUID);
        this.thulium = thulium;
    }
}

export class ThuliumSetReward extends Reward {
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
    item: PossibleItems | ConsumableItems;
    amount?: number;

    constructor(
        recipientUUID: string,
        item: PossibleItems | ConsumableItems,
        amount?: number
    ) {
        super(recipientUUID);
        this.item = item;
        if (amount) {
            if ((item as ConsumableItems).amount) {
                (this.item as ConsumableItems).amount = amount;
            }
            this.amount = amount;
        }
    }
}

export class CargoDropReward extends Reward {
    ores: OreResource[];
    items: PossibleItems[];

    constructor(recipientUUID: string, cargoDrop: CargoDrop) {
        super(recipientUUID);
        this.ores = cargoDrop.ores;
        this.items = cargoDrop.items;
    }
}

export class OreSpawnReward extends Reward {
    ores: OreResource[];

    constructor(recipientUUID: string, oreSpawn: OreSpawn) {
        super(recipientUUID);
        this.ores = oreSpawn.ores;
    }
}



export class ConsumableItemReward extends Reward {
    consumable: ConsumableItems;

    constructor(recipientUUID: string, consumable: ConsumableItems) {
        super(recipientUUID);
        this.consumable = consumable;
    }
}

export type PossibleRewards =
    | HonorReward
    | ExperienceReward
    | ThuliumReward
    | ThuliumSetReward
    | CreditsReward
    | CreditsSetReward
    | PlayerKillReward
    | AlienKillReward
    | ItemReward
    | CargoDropReward
    | OreSpawnReward
    | ConsumableItemReward;
