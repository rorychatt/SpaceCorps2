import { PlayerEntityInterface, getAllUserStats } from "../db/db";
import { Player, PlayerStateCharacteristic } from "./Player";
class ExperiencePointServer {
    expLevels: ExperienceLevelDetail[];

    constructor() {
        this.expLevels = [
            {
                level: 1,
                requiredExp: 0,
                access: [AccessLevel.COMPANY_HOME],
                accessToQuests: 10,
                accessToEventQuests: false,
                accessToCompanyQuests: false,
                accessToEvents: false,
                accessToRevengeQuests: false,
            },
            {
                level: 2,
                requiredExp: 20000,
                access: [],
                accessToQuests: 10,
                accessToEventQuests: false,
                accessToCompanyQuests: false,
                accessToEvents: false,
                accessToRevengeQuests: false,
            },
            {
                level: 3,
                requiredExp: 40000,
                access: [AccessLevel.COMPANY_2ND_MAP],
                accessToQuests: 20,
                accessToEventQuests: false,
                accessToCompanyQuests: false,
                accessToEvents: false,
                accessToRevengeQuests: false,
            },
            {
                level: 4,
                requiredExp: 80000,
                access: [],
                accessToQuests: 30,
                accessToEventQuests: false,
                accessToCompanyQuests: false,
                accessToEvents: false,
                accessToRevengeQuests: false,
            },
            {
                level: 5,
                requiredExp: 160000,
                access: [AccessLevel.COMPANY_3RD_MAP],
                accessToQuests: 40,
                accessToEventQuests: false,
                accessToCompanyQuests: false,
                accessToEvents: false,
                accessToRevengeQuests: false,
            },
            {
                level: 6,
                requiredExp: 320000,
                access: [AccessLevel.EVENT_MAP],
                accessToQuests: 50,
                accessToEventQuests: true,
                accessToCompanyQuests: false,
                accessToEvents: false,
                accessToRevengeQuests: false,
            },
            {
                level: 7,
                requiredExp: 640000,
                access: [AccessLevel.ASSEMBLY],
                accessToQuests: 60,
                accessToEventQuests: true,
                accessToCompanyQuests: false,
                accessToEvents: false,
                accessToRevengeQuests: false,
            },
            {
                level: 8,
                requiredExp: 1280000,
                access: [AccessLevel.SPACE_5],
                accessToQuests: 70,
                accessToEventQuests: true,
                accessToCompanyQuests: true,
                accessToEvents: false,
                accessToRevengeQuests: false,
            },
            {
                level: 9,
                requiredExp: 2560000,
                access: [],
                accessToQuests: 80,
                accessToEventQuests: true,
                accessToCompanyQuests: true,
                accessToEvents: false,
                accessToRevengeQuests: false,
            },
            {
                level: 10,
                requiredExp: 5120000,
                access: [AccessLevel.ENEMY_COMPANY_2ND_AND_3RD],
                accessToQuests: 90,
                accessToEventQuests: true,
                accessToCompanyQuests: true,
                accessToEvents: false,
                accessToRevengeQuests: false,
            },
            {
                level: 11,
                requiredExp: 10240000,
                access: [],
                accessToQuests: 100,
                accessToEventQuests: true,
                accessToCompanyQuests: true,
                accessToEvents: false,
                accessToRevengeQuests: false,
            },
            {
                level: 12,
                requiredExp: 20480000,
                access: [],
                accessToQuests: 100,
                accessToEventQuests: true,
                accessToCompanyQuests: true,
                accessToEvents: false,
                accessToRevengeQuests: false,
            },
            {
                level: 13,
                requiredExp: 40960000,
                access: [AccessLevel.ENEMY_COMPANY_HOME],
                accessToQuests: 100,
                accessToEventQuests: true,
                accessToCompanyQuests: true,
                accessToEvents: true,
                accessToRevengeQuests: true,
            },
            {
                level: 14,
                requiredExp: 81920000,
                access: [],
                accessToQuests: 100,
                accessToEventQuests: true,
                accessToCompanyQuests: true,
                accessToEvents: true,
                accessToRevengeQuests: true,
            },
            {
                level: 15,
                requiredExp: 163840000,
                access: [],
                accessToQuests: 100,
                accessToEventQuests: true,
                accessToCompanyQuests: true,
                accessToEvents: true,
                accessToRevengeQuests: true,
            },
            {
                level: 16,
                requiredExp: 327680000,
                access: [],
                accessToQuests: 100,
                accessToEventQuests: true,
                accessToCompanyQuests: true,
                accessToEvents: true,
                accessToRevengeQuests: true,
            },
            {
                level: 17,
                requiredExp: 655360000,
                access: [],
                accessToQuests: 100,
                accessToEventQuests: true,
                accessToCompanyQuests: true,
                accessToEvents: true,
                accessToRevengeQuests: true,
            },
            {
                level: 18,
                requiredExp: 1310720000,
                access: [],
                accessToQuests: 100,
                accessToEventQuests: true,
                accessToCompanyQuests: true,
                accessToEvents: true,
                accessToRevengeQuests: true,
            },
            {
                level: 19,
                requiredExp: 2621440000,
                access: [],
                accessToQuests: 100,
                accessToEventQuests: true,
                accessToCompanyQuests: true,
                accessToEvents: true,
                accessToRevengeQuests: true,
            },
            {
                level: 20,
                requiredExp: 5242880000,
                access: [],
                accessToQuests: 100,
                accessToEventQuests: true,
                accessToCompanyQuests: true,
                accessToEvents: true,
                accessToRevengeQuests: true,
            },
            {
                level: 21,
                requiredExp: 10485760000,
                access: [],
                accessToQuests: 100,
                accessToEventQuests: true,
                accessToCompanyQuests: true,
                accessToEvents: true,
                accessToRevengeQuests: true,
            },
        ];
    }

    async getLevelDetail(level: number): Promise<ExperienceLevelDetail | null> {
        return this.expLevels.find((lvl) => lvl.level === level) || null;
    }

    async getNextLevelDetail(
        currentExp: number
    ): Promise<ExperienceLevelDetail | null> {
        return (
            this.expLevels.find((lvl) => lvl.requiredExp > currentExp) || null
        );
    }

    async calculatePlayerLevel(player: Player): Promise<number> {
        let playerExperience = player.stats.experience;
        let playerLevel = 0;

        for (let i = 0; i < this.expLevels.length; i++) {
            if (playerExperience >= this.expLevels[i].requiredExp) {
                playerLevel = this.expLevels[i].level;
            } else {
                break;
            }
        }
        return playerLevel;
    }
}

class RankingPointsServer {}

export class RankingServer {
    experienceServer: ExperiencePointServer;
    rankingPointsServer: RankingPointsServer;
    userStats: PlayerEntityInterface[] = [];

    topHonorList: { playerName: string; honor: number }[];
    topExperienceList: { playerName: string; experience: number }[];

    constructor() {
        this.experienceServer = new ExperiencePointServer();
        this.rankingPointsServer = new RankingPointsServer();

        this.topHonorList = [];
        this.topExperienceList = [];
    }

    async start() {
        await this.fetchDataFromSQL();
        await this.getAllUpdates();
        setInterval(async () => {
            await this.getAllUpdates();
        }, 1000 * 60 * 5);
    }

    async getAllUpdates() {
        const [topHonorList, topExperienceList] = await Promise.all([
            this.getTopHonorList(),
            this.getTopExperienceList(),
        ]);
        this.topHonorList = topHonorList;
        this.topExperienceList = topExperienceList;
    }

    async fetchDataFromSQL() {
        this.userStats = [];
        const _res = await getAllUserStats();
        for (const res in _res) {
            this.userStats.push(_res[res] as PlayerEntityInterface);
        }
    }

    private async getTopHonorList(): Promise<
        { playerName: string; honor: number }[]
    > {
        const sortedUsers = [...this.userStats].sort(
            (a, b) => b.honor - a.honor
        );
        const top10Users = sortedUsers.slice(0, 10);
        const topHonorList = top10Users.map((user) => ({
            playerName: user.username,
            honor: user.honor,
        }));
        return topHonorList;
    }

    private async getTopExperienceList(): Promise<
        { playerName: string; experience: number }[]
    > {
        const sortedUsers = [...this.userStats].sort(
            (a, b) => b.experience - a.experience
        );
        const top10Users = sortedUsers.slice(0, 10);
        const topExperienceList = top10Users.map((user) => ({
            playerName: user.username,
            experience: user.experience,
        }));

        return topExperienceList;
    }

    getUserRanking(username: string): PlayerEntityInterface | undefined {
        const user = this.userStats.find((user) => user.username === username);
        if (user) {
            return user;
        }
        return undefined;
    }
}

enum AccessLevel {
    COMPANY_HOME,
    COMPANY_2ND_MAP,
    COMPANY_3RD_MAP,
    EVENT_MAP,
    ASSEMBLY,
    SPACE_5,
    ENEMY_COMPANY_2ND_AND_3RD,
    ENEMY_COMPANY_HOME,
}

interface ExperienceLevelDetail {
    level: number;
    requiredExp: number;
    access: AccessLevel[];
    accessToQuests: number;
    accessToEventQuests: boolean;
    accessToCompanyQuests: boolean;
    accessToEvents: boolean;
    accessToRevengeQuests: boolean;
}
