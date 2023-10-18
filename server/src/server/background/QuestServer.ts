import * as fs from "fs";
import { Player, PlayerStats } from "./Player";
import { gameServer } from "../main";
import { CargoDrop } from "./CargoDrop";

const maxQuestsPerPlayer = 3;

export const questData = JSON.parse(
    fs.readFileSync("./src/server/data/quests.json").toString("utf-8")
);

export type PossibleQuestType = "completeWithoutOrder" | "completeInOrder";

interface TaskFly {
    distance: number;
    map: string;
    completed: boolean;
}

interface TaskKill {
    targetName: string;
    map: string;
    completed: boolean;
}

interface TaskCollect {
    oreName: string;
    mapName: string;
    amount: number;
    completed: boolean;
}

interface QuestTask {
    fly: TaskFly[];
    kill: TaskKill[];
    collect: TaskCollect[];
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

    async issueQuest(username: string, questName: string) {
        const player = await gameServer.getPlayerByUsername(username);

        if(!player) return console.log(`Can't find player: ${player}`);

        for(let i = 0; i < gameServer.questServer.quests.length; i++) {
            for(let j = 0; j < player.currentActiveQuests.length; j++) if(player.currentActiveQuests[j].name == questName) return console.log(`Quest: ${questName} already active`);
            if(player.currentActiveQuests.length >= maxQuestsPerPlayer) return console.log(`Max amount of quests per player: ${maxQuestsPerPlayer}`);
            if(gameServer.questServer.quests[i].name == questName) player.addQuest(gameServer.questServer.quests[i]);
        }
    }

    async registerOreCollection (data: { playerUUID: string, cargoDrop: CargoDrop }){
        let player = await gameServer.getPlayerByUUID(data.playerUUID);

        if(!player) return console.log(`Can't find player: ${player}`);
        if(player.currentActiveQuests.length <= 0) return;

        for(let i = 0; i < player.currentActiveQuests.length; i++) {
            for(let j = 0; j < data.cargoDrop.ores.length; j++) {
                for(let k = 0; k < player.currentActiveQuests[i].task.collect.length; k++) {
                    if(data.cargoDrop.ores[i].name == player.currentActiveQuests[i].task.collect[k].oreName) {
                        if(data.cargoDrop.ores[i].amount >= player.currentActiveQuests[i].task.collect[k].amount) {
                            player.currentActiveQuests[i].task.collect[k].completed = true;
                        }
                    }
                }
            }

            this.checkForQuestComplete(player, player.currentActiveQuests[i].name);
        }
    }

    async registerAlienKill(data: { playerUUID: string, entityName: string }){
        const player = await gameServer.getPlayerByUUID(data.playerUUID);

        if(!player) return console.log(`Can't find player: ${player}`);
        if(player.currentActiveQuests.length <= 0) return;

        for(let i = 0; i < player.currentActiveQuests.length; i++) {
            for(let j = 0; j < player.currentActiveQuests[i].task.kill.length; j++) {
                if(!player.currentActiveQuests[i].task.kill) return;
                if(player.currentActiveQuests[i].task.kill[j].targetName !== data.entityName) return;

                player.currentActiveQuests[i].task.kill[j].completed = true;
            }
            
            this.checkForQuestComplete(player, player.currentActiveQuests[i].name);
        }   
    }

    // доделать
    async flyDistance() {

    }

    async checkForQuestComplete(player: Player, questName: string){
        for(let i = 0; i < player.completedQuests.length; i++) if(player.completedQuests[i].questName == questName) return console.log(`Quest: ${questName} already completed!`);

        for(let i = 0; i < player.currentActiveQuests.length; i++) {
            if(player.currentActiveQuests[i].name == questName) {
                if(player.currentActiveQuests[i].task.collect[0].completed == true && player.currentActiveQuests[i].task.kill[0].completed == true && player.currentActiveQuests[i].task.fly[0].completed == true) { 
                    player.completeQuest(player.currentActiveQuests[i]);
                    player.currentActiveQuests.splice(i, 1);

                    if(player.currentActiveQuests[i].reward.stats.credits) gameServer.rewardServer.registerCreditsReward(player.uuid, player.currentActiveQuests[i].reward.stats.credits);
                    if(player.currentActiveQuests[i].reward.stats.thulium) gameServer.rewardServer.registerThuliumReward(player.uuid, player.currentActiveQuests[i].reward.stats.thulium);
                    if(player.currentActiveQuests[i].reward.stats.experience) gameServer.rewardServer.registerExperienceReward(player.uuid, player.currentActiveQuests[i].reward.stats.experience);     
                    if(player.currentActiveQuests[i].reward.stats.honor) gameServer.rewardServer.registerHonorReward(player.uuid, player.currentActiveQuests[i].reward.stats.honor);
                }
            }
        }
    }
}