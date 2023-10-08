import * as fs from "fs";
import { PlayerStats } from "./Player";

export const questData = JSON.parse(
    fs.readFileSync("./src/server/data/quests.json").toString("utf-8")
);

export type PossibleQuestType = "completeWithoutOrder" | "completeInOrder";

interface TaskFly {
    distance: number;
    map: string;
}

interface TaskKill {
    targetName: string;
    map: string;
}

interface TaskCollect {
    oreName: string;
    mapName: string;
    amount: number;
}

interface QuestTask {
    fly?: TaskFly[];
    kill?: TaskKill[];
    collect?: TaskCollect[];
}

export class Quest {
    name: string;
    type: PossibleQuestType;
    reward: {
        stats: PlayerStats;
        items: { itemName: string; amount: number }[];
    };
    task: QuestTask;
    requiredLevel: number;

    constructor(
        name: string,
        type: PossibleQuestType,
        reward: any,
        task: QuestTask,
        requiredLevel: number
    ) {
        this.name = name;
        this.type = type;
        this.reward = reward;
        this.task = task;
        this.requiredLevel = requiredLevel;
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
                questInfo.task,
                questInfo.requiredLevel
            );
            this.quests.push(quest);
        }
    }
}
