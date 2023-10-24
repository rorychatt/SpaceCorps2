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
    currentAmount: number;

    constructor(completed: boolean, currentAmount: number) {
        this.completed = completed;
        this.currentAmount = currentAmount;
    }
}

class TaskFly extends Task {
    readonly _questType: string = "fly";
    distance: number;
    map: string;

    constructor(distance: number, map: string, completed: boolean, currentAmount: number) {
        super(completed, currentAmount);

        this.distance = distance;
        this.map = map;
    }
}

class TaskKill extends Task {
    readonly _questType: string = "kill";
    targetName: string;
    amount: number;
    map: string;

    constructor(
        targetName: string,
        amount: number,
        map: string,
        completed: boolean,
        currentAmount: number
    ) {
        super(completed, currentAmount);

        this.targetName = targetName;
        this.amount = amount;
        this.currentAmount = 0;
        this.map = map;
    }
}

class TaskCollect extends Task {
    readonly _questType: string = "collect";
    oreName: string;
    map: string;
    amount: number;

    constructor(
        oreName: string,
        map: string,
        amount: number,
        completed: boolean,
        currentAmount: number
    ) {
        super(completed, currentAmount);

        this.oreName = oreName;
        this.map = map;
        this.amount = amount;
        this.currentAmount = 0;
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

        if (!player) return console.log(`Can't find player: ${player}`);

        for (let i = 0; i < gameServer.questServer.quests.length; i++) {
            if (player.currentActiveQuests.length >= maxQuestsPerPlayer)
                return console.log(
                    `Max amount of quests per player: ${maxQuestsPerPlayer}`
                );
            for (let j = 0; j < player.currentActiveQuests.length; j++)
                if (player.currentActiveQuests[j].name == questName)
                    return console.log(`Quest: ${questName} already active`);
            if (gameServer.questServer.quests[i].name == questName)
                player.addQuest(gameServer.questServer.quests[i]);
        }
    }

    async removeQuest(username: string, questName: string) {
        const player = await gameServer.getPlayerByUsername(username);

        if(!player) return console.log(`Can't find player: ${player}`);
        if(player.currentActiveQuests.length <= 0) return console.log(`No active quests, player: ${player.name}`);

        for(let i = 0; i < player.currentActiveQuests.length; i++) {
            if(player.currentActiveQuests[i].name == questName) {
                player.currentActiveQuests.splice(i, 1);

                console.log(`Quest: ${questName} has been removed, player: ${player.name}`);
                console.log(`Current active quests: ${player.currentActiveQuests}, player: ${player.name}`);
            }
        }
    }

    async registerOreCollection(data: {
        playerUUID: string;
        cargoDrop: CargoDrop;
        map: string;
    }) {
        const player = await gameServer.getPlayerByUUID(data.playerUUID);

        if(!player) return console.log(`Can't find player: ${player}`);
        if(player.currentActiveQuests.length <= 0) return;
        
        for(const key in player.currentActiveQuests) {
            if(player.currentActiveQuests[key].completed) return;

            const questType = player.currentActiveQuests[key].type as PossibleQuestType;

            if(questType == "completeWithoutOrder") {
                for(let _task = 0; _task < player.currentActiveQuests[key].tasks.length; _task++) {
                    if(!player.currentActiveQuests[key].tasks[_task].completed) {
                        if(player.currentActiveQuests[key].tasks[_task]._questType == "collect") {
                            const task = player.currentActiveQuests[key].tasks[_task] as TaskCollect;

                            for(const _cargoDrop in data.cargoDrop.ores) {
                                if(data.map == task.map || task.map == "any") {
                                    if(data.cargoDrop.ores[_cargoDrop].name == task.oreName) {
                                        (player.currentActiveQuests[key].tasks[_task] as TaskCollect).currentAmount += data.cargoDrop.ores[_cargoDrop].amount;

                                        if((player.currentActiveQuests[key].tasks[_task] as TaskCollect).currentAmount >= task.amount) {
                                            player.currentActiveQuests[key].tasks[_task].completed = true;

                                            this.checkForQuestComplete(
                                                player,
                                                player.currentActiveQuests[key].name
                                            );
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } else if(questType == "completeInOrder") {
                for (let _task = 0; _task < player.currentActiveQuests[key].tasks.length; _task++) {
                    if (_task == 0 && !player.currentActiveQuests[key].tasks[_task].completed) {
                        if (player.currentActiveQuests[key].tasks[_task]._questType == "collect") {
                            const task = player.currentActiveQuests[key].tasks[_task] as TaskCollect;

                            for(const _cargoDrop in data.cargoDrop.ores) {
                                if(data.map == task.map || task.map == "any") {
                                    if(data.cargoDrop.ores[_cargoDrop].name == task.oreName) {
                                        return;
                                    }
                                }
                            }
                        }
                    } else if (!player.currentActiveQuests[key].tasks[_task].completed) {
                        if (!player.currentActiveQuests[key].tasks[_task - 1].completed) console.log("prev quest not completed");
                        if (player.currentActiveQuests[key].tasks[_task]._questType == "collect") {
                            const task = player.currentActiveQuests[key].tasks[_task] as TaskCollect;

                            for(const _cargoDrop in data.cargoDrop.ores) {
                                if(data.map == task.map || task.map == "any") {
                                    if(data.cargoDrop.ores[_cargoDrop].name == task.oreName) {
                                        return;
                                    }
                                }
                            }
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

        if (!player) return console.log(`Can't find player: ${player}`);
        if (player.currentActiveQuests.length <= 0) return;

        for (const key in player.currentActiveQuests) {
            if (player.currentActiveQuests[key].completed) return;

            const questType = player.currentActiveQuests[key].type as PossibleQuestType;
                if (questType == "completeWithoutOrder") {
                    for (const _task in player.currentActiveQuests[key].tasks) {
                        if(!player.currentActiveQuests[key].tasks[_task].completed) {
                            if (player.currentActiveQuests[key].tasks[_task]._questType == "kill") {
                                const task = player.currentActiveQuests[key].tasks[_task] as TaskKill;

                                if (task.targetName == data.entityName) {
                                    if (task.map == data.map || task.map == "any") {
                                        // тут



                                        // player.currentActiveQuests[key].tasks[_task].currentAmount += 1;

                                        // if(task.currentAmount >= task.amount) {
                                        //     this.checkForQuestComplete(
                                        //         player,
                                        //         player.currentActiveQuests[key].name
                                        //     );
                                        // }
                                    }
                                }
                            }
                        }
                    }
                } else if (questType == "completeInOrder") {
                    for (let _task = 0; _task < player.currentActiveQuests[key].tasks.length; _task++) {
                        if (_task == 0 && !player.currentActiveQuests[key].tasks[_task].completed) {
                            if (player.currentActiveQuests[key].tasks[_task]._questType == "kill") {
                                const task = player.currentActiveQuests[key].tasks[_task] as TaskKill;

                                if (task.targetName == data.entityName) {
                                    if (data.map == task.map || task.map == "any") {
                                        

                                        // return this.checkForQuestComplete(
                                        //     player,
                                        //     player.currentActiveQuests[key].name
                                        // );
                                    }
                                }
                            }
                        } else if (!player.currentActiveQuests[key].tasks[_task].completed) {
                            if (!player.currentActiveQuests[key].tasks[_task - 1].completed) console.log("prev quest not completed");
                            
                            if (player.currentActiveQuests[key].tasks[_task]._questType == "kill") {
                                const task = player.currentActiveQuests[key].tasks[_task] as TaskKill;

                                if (task.targetName == data.entityName) {
                                    if (data.map == task.map || task.map == "any") {
                                        

                                        // return this.checkForQuestComplete(
                                        //     player,
                                        //     player.currentActiveQuests[key].name
                                        // );
                                    }
                                }
                            }
                        }
                    }
                }
        }
    }

    // доделать
    async registerFlyDistance(data: {
        playerUUID: string;
        mapName: string;
        distanceTravelled: number;
    }) {

    }

    async checkForQuestComplete(player: Player, questName: string) {
        console.log(`Player: ${player.name}, completed quest: ${questName}`);

        for(let i = 0; i < player.currentActiveQuests.length; i++) {
            const quest = player.currentActiveQuests[i];

            console.log(`Quest: ${quest.name}, completed: ${quest.completed}`);
        }

        //     for (let i = 0; i < player.completedQuests.length; i++)
        //         if (player.completedQuests[i].questName == questName)
        //             return console.log(`Quest: ${questName} already completed!`);

        //     for (let i = 0; i < player.currentActiveQuests.length; i++) {
        //         if (player.currentActiveQuests[i].name == questName) {
        //             if (
        //                 player.currentActiveQuests[i].task.collect[0].completed ==
        //                     true &&
        //                 player.currentActiveQuests[i].task.kill[0].completed ==
        //                     true &&
        //                 player.currentActiveQuests[i].task.fly[0].completed == true
        //             ) {
        //                 player.completeQuest(player.currentActiveQuests[i]);
        //                 player.currentActiveQuests.splice(i, 1);

        //                 if (player.currentActiveQuests[i].reward.stats.credits)
        //                     gameServer.rewardServer.registerCreditsReward(
        //                         player.uuid,
        //                         player.currentActiveQuests[i].reward.stats.credits
        //                     );
        //                 if (player.currentActiveQuests[i].reward.stats.thulium)
        //                     gameServer.rewardServer.registerThuliumReward(
        //                         player.uuid,
        //                         player.currentActiveQuests[i].reward.stats.thulium
        //                     );
        //                 if (player.currentActiveQuests[i].reward.stats.experience)
        //                     gameServer.rewardServer.registerExperienceReward(
        //                         player.uuid,
        //                         player.currentActiveQuests[i].reward.stats
        //                             .experience
        //                     );
        //                 if (player.currentActiveQuests[i].reward.stats.honor)
        //                     gameServer.rewardServer.registerHonorReward(
        //                         player.uuid,
        //                         player.currentActiveQuests[i].reward.stats.honor
        //                     );
        //             }
        //         }
        //     }
    }
}
