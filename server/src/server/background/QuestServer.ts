import * as fs from "fs";
import { Player, PlayerStats } from "./Player";
import { gameServer } from "../main";

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
    completed: boolean;

    constructor(
        name: string,
        type: PossibleQuestType,
        reward: any,
        task: QuestTask,
        requiredLevel: number,
        completed: boolean
    ) {
        this.name = name;
        this.type = type;
        this.reward = reward;
        this.task = task;
        this.requiredLevel = requiredLevel;
        this.completed = false;
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
                questInfo.requiredLevel,
                questInfo.completed
            );
            this.quests.push(quest);
        }
    }


    async registerOreCollection (...{}){
        // const player = gameServer.getPlayerByUUID(data.uuid)

        // checkForQuestComplete(player, quest)..
    }

    async registerAlienKill(...{}){
        // const player = gameServer.getPlayerByUUID(data.uuid)

        // checkForQuestComplete(player, quest)..
    }

    async issueQuest(username: string, questName: string) { //выдать квест игроку
        let player = gameServer.getPlayerByUsername(username);

        player.then((player) => {
            for(let i = 0; i < gameServer.questServer.quests.length; i++) {
                if(gameServer.questServer.quests[i].name == questName) {
                    player?.currentActiveQuests.push(gameServer.questServer.quests[i]);

                    // console.log("currentActiveQuests", player?.currentActiveQuests); // to delete
                }
            }
        })
        .catch((error) => {
            return;
        });     
    }

    async checkForQuestComplete(player: Player, questName: string){
        // Logic for checking if the quest had been completed
    }
}