import * as fs from "fs";
import { Player, PlayerStats } from "./Player";
import { gameServer } from "../main";
import { CargoDrop } from "./CargoDrop";

const maxQuestsPerPlayer = 3;

export const questData = JSON.parse(
    fs.readFileSync("./src/server/data/quests.json").toString("utf-8")
);

export type PossibleQuestType = "completeWithoutOrder" | "completeInOrder";

class Task {
    completed: boolean;

    constructor(completed: boolean) {
        this.completed = completed;
    }
}

class TaskFly extends Task {
    readonly _type: string = "fly";
    distance: number;
    map: string;

    constructor(distance: number, map: string, completed: boolean) {
        super(completed);

        this.distance = distance;
        this.map = map;
    }
}

class TaskKill extends Task {
    readonly _type: string = "kill";
    targetName: string;
    amount: number;
    map: string;

    constructor(
        targetName: string,
        amount: number,
        map: string,
        completed: boolean
    ) {
        super(completed);

        this.targetName = targetName;
        this.amount = amount;
        this.map = map;
    }
}

class TaskCollect extends Task {
    readonly _type: string = "collect";
    oreName: string;
    map: string;
    amount: number;

    constructor(
        oreName: string,
        map: string,
        amount: number,
        completed: boolean
    ) {
        super(completed);

        this.oreName = oreName;
        this.map = map;
        this.amount = amount;
    }
}

type QuestTask = TaskCollect | TaskFly | TaskKill;

export class Quest {
    name: string;
    type: PossibleQuestType;
    reward: {
        stats: PlayerStats;
        items: { itemName: string; amount: number }[];
    };
    tasks: QuestTask[] = [];
    requiredLevel: number;
    completed: boolean;

    constructor(
        name: string,
        type: PossibleQuestType,
        reward: any,
        tasks: QuestTask[],
        requiredLevel: number,
        completed: boolean
    ) {
        this.name = name;
        this.type = type;
        this.reward = reward;
        this.tasks = tasks;
        this.requiredLevel = requiredLevel;
        this.completed = completed;
    }
}

export class QuestServer {
    quests: Quest[] = [];

    constructor() {
        for (const questName in questData) {
            const questInfo = questData[questName];
            const quest = new Quest(
                questInfo.name,
                questInfo.type,
                questInfo.reward,
                questInfo.tasks,
                questInfo.requiredLevel,
                questInfo.completed
            );
            this.quests.push(quest);
        }
    }

    async issueQuest(username: string, questName: string) {
        const player = await gameServer.getPlayerByUsername(username);

        if (!player) return console.log(`Can't find player: ${username}`);

        if (player.currentActiveQuests.length >= maxQuestsPerPlayer) {
            return console.log("Max quests reached for player");
        }

        const quest = this.quests.find((q) => q.name === questName);

        if (!quest) return console.log("Quest not found");

        if (player.level < quest.requiredLevel) {
            return console.log("Player level not sufficient for this quest");
        }

        player.currentActiveQuests.push({ ...quest });
    }

    async registerOreCollection(data: {
        playerUUID: string;
        cargoDrop: CargoDrop;
        map: string;
    }) {
        const player = await gameServer.getPlayerByUUID(data.playerUUID);

        if (!player)
            return console.log(`Can't find player: ${data.playerUUID}`);
        if (player.currentActiveQuests.length <= 0) return;

        // Loop through each active quest
        for (const quest of player.currentActiveQuests) {
            if (
                quest.type === "completeInOrder" &&
                !(quest.tasks[0]._type === "collect")
            )
                continue;

            for (const task of quest.tasks) {
                if (task instanceof TaskCollect) {
                    for (const ore of data.cargoDrop.ores) {
                        // Looping through the ores in cargoDrop
                        if (
                            task._type === "collect" &&
                            task.map === data.map &&
                            task.oreName === ore.name // Accessing the name property of OreResource
                        ) {
                            task.amount -= ore.amount; // Subtracting the amount of ore collected
                            if (task.amount <= 0) task.completed = true;
                        }
                    }
                }
            }
        }
    }

    async registerAlienKill(data: {
        playerUUID: string;
        entityName: string;
        map: string;
    }) {
        const player = await gameServer.getPlayerByUUID(data.playerUUID);

        if (!player)
            return console.log(`Can't find player: ${data.playerUUID}`);
        if (player.currentActiveQuests.length <= 0) return;

        // Loop through each active quest
        for (const quest of player.currentActiveQuests) {
            if (
                quest.type === "completeInOrder" &&
                !(quest.tasks[0]._type === "kill")
            )
                continue;

            for (const task of quest.tasks) {
                if (task instanceof TaskKill) {
                    if (
                        task._type === "kill" &&
                        task.map === data.map &&
                        task.targetName === data.entityName
                    ) {
                        task.amount--;
                        if (task.amount <= 0) task.completed = true;
                    }
                }
            }
        }
    }

    async registerFlyDistance(data: {
        playerUUID: string;
        mapName: string;
        distanceTravelled: number;
    }) {
        const player = await gameServer.getPlayerByUUID(data.playerUUID);

        if (!player)
            return console.log(`Can't find player: ${data.playerUUID}`);
        if (player.currentActiveQuests.length <= 0) return;

        for (const quest of player.currentActiveQuests) {
            if (
                quest.type === "completeInOrder" &&
                !(quest.tasks[0]._type === "fly")
            )
                continue;

            for (const task of quest.tasks) {
                if (task instanceof TaskFly) {
                    if (task._type === "fly" && task.map === data.mapName) {
                        task.distance -= data.distanceTravelled;
                        if (task.distance <= 0) task.completed = true;
                    }
                }
            }
        }
    }

    async checkForQuestComplete(player: Player, questName: string) {
        const quest = player.currentActiveQuests.find(
            (q) => q.name === questName
        );

        if (!quest)
            return console.log("Quest not found in player's active quests");

        if (quest.type === "completeInOrder") {
            for (let i = 0; i < quest.tasks.length; i++) {
                if (!quest.tasks[i].completed) return;
                if (i > 0 && !quest.tasks[i - 1].completed) return;
            }
        } else {
            for (const task of quest.tasks) {
                if (!task.completed) return;
            }
        }

        // Quest is completed
        quest.completed = true;
        // TODO: give rewards to player and move the quest to completedQuests
    }
}
