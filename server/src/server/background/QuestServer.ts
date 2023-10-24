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
    currentAmount: number = 0;

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

    addTask(task: QuestTask) {
        this.tasks.push(task);
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
                [],
                questInfo.requiredLevel,
                questInfo.completed
            );
            for (const task of questData[questName].tasks) {
                if (task._type == "kill") {
                    quest.addTask(
                        new TaskKill(
                            task.targetName,
                            task.amount,
                            task.map,
                            task.completed
                        )
                    );
                } else if (task._type == "fly") {
                    quest.addTask(
                        new TaskFly(task.distance, task.map, task.completed)
                    );
                } else if (task._type == "collect") {
                    quest.addTask(
                        new TaskCollect(
                            task.oreName,
                            task.map,
                            task.amount,
                            task.completed
                        )
                    );
                }
            }
            this.quests.push(quest);
        }
    }

    async issueQuest(username: string, questName: string) {
        const player = await gameServer.getPlayerByUsername(username);

        if (!player) return console.log(`Can't find player: ${username}`);

        // Check if player already has the maximum number of quests
        if (player.currentActiveQuests.length >= maxQuestsPerPlayer) {
            return console.log("Max quests reached for player");
        }

        // Find the quest in available quests
        const quest = this.quests.find((q) => q.name === questName);

        if (!quest) return console.log("Quest not found");

        // Check player level
        if (player.level < quest.requiredLevel) {
            return console.log("Player level not sufficient for this quest");
        }

        // Check if player already has this quest
        if (player.currentActiveQuests.some((q) => q.name === quest.name)) {
            return console.log("Player already has this quest");
        }

        // Add the quest to player's active quests
        player.currentActiveQuests.push(quest);
        return console.log(`Issued quest ${questName} to player: ${username}`);
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

        for (const quest of player.currentActiveQuests) {
            let previousCompleted = true;
            for (const task of quest.tasks) {
                if (task instanceof TaskCollect && !task.completed) {
                    for (const ore of data.cargoDrop.ores) {
                        if (
                            task._type === "collect" &&
                            (task.map === "any" || task.map === data.map) &&
                            task.oreName === ore.name
                        ) {
                            if (
                                quest.type === "completeInOrder" &&
                                previousCompleted
                            ) {
                                task.currentAmount += ore.amount;
                                if (task.currentAmount >= task.amount) {
                                    task.completed = true;
                                    previousCompleted = true;
                                }
                            } else if (quest.type === "completeWithoutOrder") {
                                task.currentAmount += ore.amount;
                                if (task.currentAmount >= task.amount) {
                                    task.completed = true;
                                    previousCompleted = true;
                                }
                            } else {
                                previousCompleted = false;
                            }
                        }
                    }
                }
                if (!task.completed) {
                    previousCompleted = false;
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

        console.log(
            `Registering ${data.entityName} kill for user ${player.name}`
        );

        // Loop through each active quest
        for (const quest of player.currentActiveQuests) {

            let previousCompleted = true;
            for (const task of quest.tasks) {
                if (task instanceof TaskKill && !task.completed) {
                    if (
                        task._type === "kill" &&
                        (task.map === "any" || task.map === data.map) &&
                        task.targetName === data.entityName
                    ) {
                        if (
                            quest.type === "completeInOrder" &&
                            previousCompleted
                        ) {
                            task.currentAmount++;
                            if (task.currentAmount >= task.amount) {
                                task.completed = true;
                                previousCompleted = true;
                            }
                        } else if (quest.type === "completeWithoutOrder") {
                            task.currentAmount++;
                            if (task.currentAmount >= task.amount) {
                                task.completed = true;
                                previousCompleted = true;
                            }
                        }
                    }
                }
                if (!task.completed) {
                    previousCompleted = false;
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
            let previousCompleted = true;
            for (const task of quest.tasks) {
                if (task instanceof TaskFly && !task.completed) {
                    if (
                        task._type === "fly" &&
                        (task.map === "any" || task.map === data.mapName)
                    ) {
                        if (
                            quest.type === "completeInOrder" &&
                            previousCompleted
                        ) {
                            task.currentAmount += data.distanceTravelled;
                            if (task.currentAmount >= task.distance) {
                                task.completed = true;
                                previousCompleted = true;
                            }
                        } else if (quest.type === "completeWithoutOrder") {
                            task.currentAmount += data.distanceTravelled;
                            if (task.currentAmount >= task.distance) {
                                task.completed = true;
                                previousCompleted = true;
                            }
                        } else {
                            previousCompleted = false;
                        }
                    }
                }
                if (!task.completed) {
                    previousCompleted = false;
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
