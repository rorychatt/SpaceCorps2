// Shopping/Shop
// Div constants
const shoppingShipsDiv = document.getElementById(
    "shopping_ships"
) as HTMLElement;
const shoppingWeaponsDiv = document.getElementById(
    "shopping_weapons"
) as HTMLElement;
const shoppingAmmoDiv = document.getElementById(
    "shopping_ammunition"
) as HTMLElement;
const shoppingGeneratorDiv = document.getElementById(
    "shopping_generators"
) as HTMLElement;
const shoppingExtrasDiv = document.getElementById(
    "shopping_extras"
) as HTMLElement;
const shoppingDesignDiv = document.getElementById(
    "shopping_design"
) as HTMLElement;
const shoppingDonateDiv = document.getElementById(
    "shopping_donate"
) as HTMLElement;

// Button constants
const shoppingShipsButton = document.getElementById(
    "shop_ships"
) as HTMLElement;
const shoppingWeaponsButton = document.getElementById(
    "shop_weapons"
) as HTMLElement;
const shoppingAmmoButton = document.getElementById("shop_ammo") as HTMLElement;
const shoppingGeneratorButton = document.getElementById(
    "shop_generators"
) as HTMLElement;
const shoppingExtrasButton = document.getElementById(
    "shop_extras"
) as HTMLElement;
const shoppingDesignButton = document.getElementById(
    "shop_design"
) as HTMLElement;
const shoppingDonateButton = document.getElementById(
    "shop_donate"
) as HTMLElement;

const errorButton = document.getElementById("error_button");

shoppingShipsButton.addEventListener("click", function (): void {
    shoppingShipsDiv.style.display = "flex";
    shoppingWeaponsDiv.style.display = "none";
    shoppingAmmoDiv.style.display = "none";
    shoppingGeneratorDiv.style.display = "none";
    shoppingExtrasDiv.style.display = "none";
    shoppingDesignDiv.style.display = "none";
    shoppingDonateDiv.style.display = "none";
});

shoppingWeaponsButton.addEventListener("click", function (): void {
    shoppingShipsDiv.style.display = "none";
    shoppingWeaponsDiv.style.display = "flex";
    shoppingAmmoDiv.style.display = "none";
    shoppingGeneratorDiv.style.display = "none";
    shoppingExtrasDiv.style.display = "none";
    shoppingDesignDiv.style.display = "none";
    shoppingDonateDiv.style.display = "none";
});

shoppingAmmoButton.addEventListener("click", function (): void {
    shoppingShipsDiv.style.display = "none";
    shoppingWeaponsDiv.style.display = "none";
    shoppingAmmoDiv.style.display = "flex";
    shoppingGeneratorDiv.style.display = "none";
    shoppingExtrasDiv.style.display = "none";
    shoppingDesignDiv.style.display = "none";
    shoppingDonateDiv.style.display = "none";
});

shoppingGeneratorButton.addEventListener("click", function (): void {
    shoppingShipsDiv.style.display = "none";
    shoppingWeaponsDiv.style.display = "none";
    shoppingAmmoDiv.style.display = "none";
    shoppingGeneratorDiv.style.display = "flex";
    shoppingExtrasDiv.style.display = "none";
    shoppingDesignDiv.style.display = "none";
    shoppingDonateDiv.style.display = "none";
});

shoppingExtrasButton.addEventListener("click", function (): void {
    shoppingShipsDiv.style.display = "none";
    shoppingWeaponsDiv.style.display = "none";
    shoppingAmmoDiv.style.display = "none";
    shoppingGeneratorDiv.style.display = "none";
    shoppingExtrasDiv.style.display = "flex";
    shoppingDesignDiv.style.display = "none";
    shoppingDonateDiv.style.display = "none";
});

shoppingDesignButton.addEventListener("click", function (): void {
    shoppingShipsDiv.style.display = "none";
    shoppingWeaponsDiv.style.display = "none";
    shoppingAmmoDiv.style.display = "none";
    shoppingGeneratorDiv.style.display = "none";
    shoppingExtrasDiv.style.display = "none";
    shoppingDesignDiv.style.display = "flex";
    shoppingDonateDiv.style.display = "none";
});

shoppingDonateButton.addEventListener("click", function (): void {
    shoppingShipsDiv.style.display = "none";
    shoppingWeaponsDiv.style.display = "none";
    shoppingAmmoDiv.style.display = "none";
    shoppingGeneratorDiv.style.display = "none";
    shoppingExtrasDiv.style.display = "none";
    shoppingDesignDiv.style.display = "none";
    shoppingDonateDiv.style.display = "flex";
});

// Auction (Hourly Daily Weekly Monthly)
// Button constants
const aucHourlyButton = document.getElementById("auc_hour_btn") as HTMLElement;
const aucDailyButton = document.getElementById("auc_day_btn") as HTMLElement;
const aucWeeklyButton = document.getElementById("auc_week_btn") as HTMLElement;
const aucMonthlyButton = document.getElementById(
    "auc_month_btn"
) as HTMLElement;

// DIV constants
const aucHourlyDiv = document.getElementById("auc_hour") as HTMLElement;
const aucDailyDiv = document.getElementById("auc_day") as HTMLElement;
const aucWeeklyDiv = document.getElementById("auc_week") as HTMLElement;
const aucMonthlyDiv = document.getElementById("auc_month") as HTMLElement;

// Button eventListeners
aucHourlyButton.addEventListener("click", function (): void {
    aucHourlyDiv.style.display = "block";
    aucDailyDiv.style.display = "none";
    aucWeeklyDiv.style.display = "none";
    aucMonthlyDiv.style.display = "none";
});

aucDailyButton.addEventListener("click", function (): void {
    aucHourlyDiv.style.display = "none";
    aucDailyDiv.style.display = "block";
    aucWeeklyDiv.style.display = "none";
    aucMonthlyDiv.style.display = "none";
});

aucWeeklyButton.addEventListener("click", function (): void {
    aucHourlyDiv.style.display = "none";
    aucDailyDiv.style.display = "none";
    aucWeeklyDiv.style.display = "block";
    aucMonthlyDiv.style.display = "none";
});

aucMonthlyButton.addEventListener("click", function (): void {
    aucHourlyDiv.style.display = "none";
    aucDailyDiv.style.display = "none";
    aucWeeklyDiv.style.display = "none";
    aucMonthlyDiv.style.display = "block";
});

// Clan Info (Clan Members Politics Economics)
// Clan Buttons
const clanInformationBtn = document.getElementById(
    "clan_info_button"
) as HTMLElement;
const clanMembersBtn = document.getElementById(
    "clan_members_btn"
) as HTMLElement;
const clanPoliticsBtn = document.getElementById(
    "clan_politics_btn"
) as HTMLElement;
const clanEconomicsBtn = document.getElementById(
    "clan_economics_btn"
) as HTMLElement;

// Clan DIV
const clanInformationDiv = document.getElementById("clan_info") as HTMLElement;
const clanMembersDiv = document.getElementById("clan_members") as HTMLElement;
const clanPoliticsDiv = document.getElementById("clan_politics") as HTMLElement;
const clanEconomicsDiv = document.getElementById(
    "clan_economics"
) as HTMLElement;

// Button eventListeners
clanInformationBtn.addEventListener("click", function (): void {
    clanInformationDiv.style.display = "block";
    clanMembersDiv.style.display = "none";
    clanPoliticsDiv.style.display = "none";
    clanEconomicsDiv.style.display = "none";
});

clanMembersBtn.addEventListener("click", function (): void {
    clanInformationDiv.style.display = "none";
    clanMembersDiv.style.display = "block";
    clanPoliticsDiv.style.display = "none";
    clanEconomicsDiv.style.display = "none";
});

clanPoliticsBtn.addEventListener("click", function (): void {
    clanInformationDiv.style.display = "none";
    clanMembersDiv.style.display = "none";
    clanPoliticsDiv.style.display = "block";
    clanEconomicsDiv.style.display = "none";
});

clanEconomicsBtn.addEventListener("click", function (): void {
    clanInformationDiv.style.display = "none";
    clanMembersDiv.style.display = "none";
    clanPoliticsDiv.style.display = "none";
    clanEconomicsDiv.style.display = "block";
});

// Player Info (Pilot Ranking Studio Workroom)
// Player Buttons
const playerPilotBtn = document.getElementById(
    "profile_pilot_button"
) as HTMLElement;
const playerRankingBtn = document.getElementById(
    "profile_ranking_button"
) as HTMLElement;
const playerHangarBtn = document.getElementById(
    "profile_hangar_button"
) as HTMLElement;
const playerWorkroomBtn = document.getElementById(
    "profile_workroom_button"
) as HTMLElement;

// Player DIV
const playerPilotDiv = document.getElementById("profile_pilot") as HTMLElement;
const playerRankingDiv = document.getElementById(
    "profile_ranking"
) as HTMLElement;
const playerHangarDiv = document.getElementById(
    "profile_hangar"
) as HTMLElement;
const playerWorkroomDiv = document.getElementById(
    "profile_workroom"
) as HTMLElement;

// Button eventListeners
playerPilotBtn.addEventListener("click", function (): void {
    playerPilotDiv.style.display = "block";
    playerRankingDiv.style.display = "none";
    playerHangarDiv.style.display = "none";
    playerWorkroomDiv.style.display = "none";
});

playerRankingBtn.addEventListener("click", function (): void {
    playerPilotDiv.style.display = "none";
    playerRankingDiv.style.display = "block";
    playerHangarDiv.style.display = "none";
    playerWorkroomDiv.style.display = "none";
});

playerHangarBtn.addEventListener("click", function (): void {
    playerPilotDiv.style.display = "none";
    playerRankingDiv.style.display = "none";
    playerHangarDiv.style.display = "block";
    playerWorkroomDiv.style.display = "none";
});

playerWorkroomBtn.addEventListener("click", function (): void {
    playerPilotDiv.style.display = "none";
    playerRankingDiv.style.display = "none";
    playerHangarDiv.style.display = "none";
    playerWorkroomDiv.style.display = "block";
});

// Close buttons
const aucCloseBtn = document.getElementById("auc_close_btn") as HTMLElement;
const clanCloseBtn = document.getElementById("clan_close_btn") as HTMLElement;
const profileCloseBtn = document.getElementById(
    "profile_close_btn"
) as HTMLElement;

const questCloseBtn = document.getElementById("quest_close_btn") as HTMLElement;
const questDiv = document.getElementById("questbook") as HTMLElement;

aucCloseBtn.addEventListener("click", function (): void {
    containerDiv.style.display = "none";
    playerInfoDiv.style.display = "none";
    clanInfoDiv.style.display = "none";
    shopDiv.style.display = "none";
    auctionDiv.style.display = "none";
    assemblyDiv.style.display = "none";
    questDiv.style.display = "none";
});

clanCloseBtn.addEventListener("click", function (): void {
    containerDiv.style.display = "none";
    playerInfoDiv.style.display = "none";
    clanInfoDiv.style.display = "none";
    shopDiv.style.display = "none";
    auctionDiv.style.display = "none";
    assemblyDiv.style.display = "none";
    questDiv.style.display = "none";
});

profileCloseBtn.addEventListener("click", function (): void {
    containerDiv.style.display = "none";
    playerInfoDiv.style.display = "none";
    clanInfoDiv.style.display = "none";
    shopDiv.style.display = "none";
    auctionDiv.style.display = "none";
    assemblyDiv.style.display = "none";
    questDiv.style.display = "none";
});

questCloseBtn.addEventListener("click", function(): void {
    containerDiv.style.display = "none";
    playerInfoDiv.style.display = "none";
    clanInfoDiv.style.display = "none";
    shopDiv.style.display = "none";
    auctionDiv.style.display = "none";
    assemblyDiv.style.display = "none";
    questDiv.style.display = "none";
})

// Console
const consoleButton = document.getElementById("console_btn") as HTMLElement;
const consoleDiv = document.getElementById("console_container") as HTMLElement;
const consoleQuitButton = document.getElementById(
    "console_quit_btn"
) as HTMLElement;

consoleQuitButton.addEventListener("click", function (): void {
    consoleDiv.style.display = "none";
});

consoleButton.addEventListener("click", function (): void {
    if (
        consoleDiv.style.display === "none" ||
        consoleDiv.style.display === ""
    ) {
        consoleDiv.style.display = "block";
    } else {
        consoleDiv.style.display = "none";
    }
});

if (errorButton) {
    errorButton.addEventListener("click", () => {
        const errorContainer = document.getElementById("error_container");
        if (errorContainer) {
            errorContainer.style.display = "none";
        }
    });
} else {
    console.error("Error: error_button element not found.");
}

// Questbook
const questDailyButton = document.getElementById("quest_daily_btn") as HTMLElement;
const quest100qButton = document.getElementById("quest_100q_btn") as HTMLElement;
const questEventButton = document.getElementById("quest_event_btn") as HTMLElement;
const questLegacyButton = document.getElementById("quest_legacy_btn") as HTMLElement;
const questRevengeButton = document.getElementById("quest_revenge_btn") as HTMLElement;


const questDailyDiv = document.getElementById("quest_daily") as HTMLElement;
const quest100qDiv = document.getElementById("quest_100q") as HTMLElement;
const questEventDiv = document.getElementById("quest_event") as HTMLElement;
const questLegacyDiv = document.getElementById("quest_legacy") as HTMLElement;
const questRevengeDiv = document.getElementById("quest_revenge") as HTMLElement;

questDailyButton.addEventListener("click", function(): void {
    questDailyDiv.style.display = "block";
    quest100qDiv.style.display = "none";
    questEventDiv.style.display = "none";
    questLegacyDiv.style.display = "none";
    questRevengeDiv.style.display = "none";
})

quest100qButton.addEventListener("click", function(): void {
    questDailyDiv.style.display = "none";
    quest100qDiv.style.display = "block";
    questEventDiv.style.display = "none";
    questLegacyDiv.style.display = "none";
    questRevengeDiv.style.display = "none";
})

questEventButton.addEventListener("click", function(): void {
    questDailyDiv.style.display = "none";
    quest100qDiv.style.display = "none";
    questEventDiv.style.display = "block";
    questLegacyDiv.style.display = "none";
    questRevengeDiv.style.display = "none";
})

questLegacyButton.addEventListener("click", function(): void {
    questDailyDiv.style.display = "none";
    quest100qDiv.style.display = "none";
    questEventDiv.style.display = "none";
    questLegacyDiv.style.display = "block";
    questRevengeDiv.style.display = "none";
})

questRevengeButton.addEventListener("click", function(): void {
    questDailyDiv.style.display = "none";
    quest100qDiv.style.display = "none";
    questEventDiv.style.display = "none";
    questLegacyDiv.style.display = "none";
    questRevengeDiv.style.display = "block";
})