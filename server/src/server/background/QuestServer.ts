import * as fs from "fs";
import { Player, PlayerStats } from "./Player";
import { gameServer } from "../main";
import { CargoDrop, OreSpawn } from "./CargoDrop";

const maxQuestsPerPlayer = 3;

export const questData = JSON.parse(
    fs.readFileSync("./src/server/data/quests.json").toString("utf-8")
);

export type PossibleQuestType = "completeWithoutOrder" | "completeInOrder";

class Task {
    completed: boolean;
    currentAmount: number = 0;
    _id: number;

    constructor(completed: boolean, _id: number) {
        this.completed = completed;
        this._id = _id;
    }
}

class TaskFly extends Task {
    readonly _type: string = "fly";
    distance: number;
    map: string;

    constructor(
        distance: number,
        map: string,
        completed: boolean,
        _id: number
    ) {
        super(completed, _id);

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
        completed: boolean,
        _id: number
    ) {
        super(completed, _id);

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
    currentAmount: number;

    constructor(
        oreName: string,
        map: string,
        amount: number,
        currentAmount: number,
        completed: boolean,
        _id: number
    ) {
        super(completed, _id);
        this.currentAmount = currentAmount;
        this.oreName = oreName;
        this.map = map;
        this.amount = amount;

        if (!currentAmount) this.currentAmount = 0;
    }
}

type QuestTask = TaskCollect | TaskFly | TaskKill;

export class QuestTaskDTO {
    taskId: number;
    currentAmount: number;
    completed: boolean;

    constructor(taskId: number, currentAmount: number, completed: boolean) {
        this.taskId = taskId;
        this.currentAmount = currentAmount;
        this.completed = completed;
    }
}

export class Quest {
    questName: string;
    description: string;
    questNo: number;
    type: PossibleQuestType;
    reward: {
        stats: PlayerStats;
        items: { itemName: string; amount: number }[];
    };
    tasks: QuestTask[] = [];
    requiredLevel: number;
    completed: boolean;

    constructor(questName: string) {
        this.questName = questName;
        this.type = questData[questName].type;
        this.reward = questData[questName].reward;
        this.requiredLevel = questData[questName].requiredLevel;
        this.completed = questData[questName].completed;
        this.description = questData[questName].description;
        this.questNo = questData[questName].questNo;

        for (const task of questData[questName].tasks) {
            if (task._type == "kill") {
                this.addTask(
                    new TaskKill(
                        task.targetName,
                        task.amount,
                        task.map,
                        task.completed,
                        task._id
                    )
                );
            } else if (task._type == "fly") {
                this.addTask(
                    new TaskFly(
                        task.distance,
                        task.map,
                        task.completed,
                        task._id
                    )
                );
            } else if (task._type == "collect") {
                this.addTask(
                    new TaskCollect(
                        task.oreName,
                        task.map,
                        task.amount,
                        task.currentAmount,
                        task.completed,
                        task._id
                    )
                );
            }
        }
    }

    addTask(task: QuestTask) {
        this.tasks.push(task);
    }

    setTaskProgress(progress: QuestTaskDTO) {
        try {
            this.tasks[progress.taskId].currentAmount = progress.currentAmount;
            this.tasks[progress.taskId].completed = progress.completed;
        } catch (err) {
            return console.log(`TaskProgress Error: ${err}`, progress, this.tasks);
        }
    }

    setAllTasksProgress(progress: QuestTaskDTO[]) {
        for (const key in progress) {
            this.setTaskProgress(progress[key]);
        }
    }
}

export class QuestDTO {
    questName: string;
    tasksProgress: QuestTaskDTO[];

    constructor(questName: string, tasksProgress: QuestTaskDTO[]) {
        this.questName = questName;
        this.tasksProgress = tasksProgress;
    }
}

export class CompletedQuestDTO {
    questName: string;

    constructor(questName: string) {
        this.questName = questName;
    }
}

export class QuestServer {
    quests: Quest[] = [];

    constructor() {
        for (const _questName in questData) {
            const questInfo = questData[_questName];
            const quest = new Quest(questInfo.questName);
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
        const quest = this.quests.find((q) => q.questName === questName);

        if (!quest)
            return console.log(
                `Quest: ${questName} not found! Player: ${username}`
            );

        // Check player level
        if (player.level < quest.requiredLevel) {
            return console.log("Player level not sufficient for this quest");
        }

        // Check if player already has this quest
        if (
            player.currentActiveQuests.some(
                (q) => q.questName === quest.questName
            )
        ) {
            return console.log("Player already has this quest");
        }

        // Check if player already completed this quest

        if (
            player.completedQuests.some((q) => q.questName === quest.questName)
        ) {
            return console.log("Player already completed this quest");
        }

        // Add the quest to player's active quests
        player.currentActiveQuests.push(quest);
        // console.log(`QUESTTASKS: ${JSON.stringify(quest.tasks)}`);
        return console.log(`Issued quest ${questName} to player: ${username}`);
    }

    async removeQuest(username: string, questName: string) {
        const player = await gameServer.getPlayerByUsername(username);

        if (!player) return console.log(`Can't find player: ${username}`);

        if (player.currentActiveQuests.length <= 0)
            return console.log(`Player: ${username} has no active quests`);

        const quest = player.currentActiveQuests.find(
            (q) => q.questName === questName
        );

        if (!quest)
            return console.log(
                `Quest: ${questName} not found! Player: ${username}`
            );

        // Remove the quest
        player.currentActiveQuests = player.currentActiveQuests.filter(
            (q) => q.questName !== questName
        );

        console.log(`Removed quest: ${questName}, player: ${username}`);
    }

    async registerOreCollection(data: {
        playerUUID: string;
        collectable: CargoDrop | OreSpawn;
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
                    for (const ore of data.collectable.ores) {
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
            this.checkForQuestComplete(player, quest);
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
            this.checkForQuestComplete(player, quest);
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
            this.checkForQuestComplete(player, quest);
        }
    }

    async checkForQuestComplete(player: Player, quest: Quest) {
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
        quest.completed = true;

        for (let i = 0; i < quest.reward.items.length; i++) {
            const item = gameServer.shop.findItemByName(
                quest.reward.items[i].itemName
            );

            if (!item) {
                console.log(
                    `Can't find item: ${quest.reward.items[i].itemName}`
                );
                continue;
            }

            gameServer.rewardServer.registerItemReward(
                player.uuid,
                item,
                quest.reward.items[i].amount
            );
        }

        if (quest.reward.stats) {
            if (quest.reward.stats.thulium) {
                gameServer.rewardServer.registerThuliumReward(
                    player.uuid,
                    quest.reward.stats.thulium
                );
            }
            if (quest.reward.stats.credits) {
                gameServer.rewardServer.registerCreditsReward(
                    player.uuid,
                    quest.reward.stats.credits
                );
            }
            if (quest.reward.stats.experience) {
                gameServer.rewardServer.registerExperienceReward(
                    player.uuid,
                    quest.reward.stats.experience
                );
            }
            if (quest.reward.stats.honor) {
                gameServer.rewardServer.registerHonorReward(
                    player.uuid,
                    quest.reward.stats.honor
                );
            }
        }

        player.completedQuests.push({ questName: quest.questName });
        player.currentActiveQuests = player.currentActiveQuests.filter(
            (q) => q.questName !== quest.questName
        );

        console.log(
            `Successfully rewards for quest: ${quest.questName}, player: ${player.name}`
        );
    }
}
