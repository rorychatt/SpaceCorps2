import { io } from "socket.io-client";
export const socket = io!("http://localhost:3000");

// HTML Elements
let loginDiv = document.getElementById("loginDiv") as HTMLElement;
let spacemapDiv = document.getElementById("spacemapDiv") as HTMLElement;
let contentDiv = document.getElementById("content") as HTMLElement;
let uiDiv = document.querySelector(".ui") as HTMLElement;
let consoleBtn = document.querySelector(".console_button") as HTMLElement;
let gameVersionDiv = document.getElementById("gameversion") as HTMLElement;
let gamefpsDiv = document.getElementById("gamefps") as HTMLElement;
let gameupsDiv = document.getElementById("gameups") as HTMLElement;
let quests100qDiv = document.getElementById("quest_100q") as HTMLElement;
let entityLabelsDiv = document.getElementById("entityLabelsDiv");
const canvas = document.querySelector("#THREEJSScene") as HTMLCanvasElement;

// UI Elements
const creditsElement = document.getElementById("credits_value");
const thuliumElement = document.getElementById("thulium_value");
const experienceElement = document.getElementById("experience_value");
const honorElement = document.getElementById("honor_value");
const notificationContainer = document.getElementById("notification_container");
const prestigeElement = document.getElementById("prestige_value");
const levelElement = document.getElementById("player_level_div");
const simHPElement = document.getElementById("sim_hitpoints");
const simSPElement = document.getElementById("sim_speed");
const simSHElement = document.getElementById("sim_shieldpoints");
const simCargoElement = document.getElementById("sim_cargo");
const volumeLevelInput = document.getElementById(
    "volumeLevelInput"
) as HTMLInputElement | null;

// Settings Elements
const switchCheckbox: HTMLInputElement | null = document.querySelector(
    "#setting_switch_antialiasing .chk"
);
const volumeValue: HTMLInputElement | null =
    document.querySelector("#volumeLevelInput");
const saveSettingsBtn: HTMLElement | null =
    document.getElementById("save_settings_btn");

// Buttons
const refreshTop10HonorBtn = document.getElementById("getTop10HonorBtn") as
    | HTMLButtonElement
    | undefined;
const refreshTop10ExperienceBtn = document.getElementById(
    "getTop10ExperienceBtn"
) as HTMLButtonElement | undefined;

// Chat and Console
let sendChatMessageButton: HTMLElement | null;
let chatModalContent: HTMLElement | null;
let chatModalInput: HTMLInputElement | null;
let sendConsoleMessageButton: HTMLElement | null;
let consoleContent: HTMLElement | null;
let consoleInput: HTMLInputElement | null;

// Game Data
let shoppingData: any;
let playerInventory: any;
let playerName: string;
let playerEntity: any;
let currentMap: any;
let lockOnCircleParent: any;

// Hotbar

type HotbarMapping = {
    [key: string]: null | { itemName: string };
    "0": null;
    "1": null;
    "2": null;
    "3": null;
    "4": null;
    "5": null;
    "6": null;
    "7": null;
    "8": null;
    "9": null;
};

let hotbarMapping: HotbarMapping = {
    "0": null,
    "1": null,
    "2": null,
    "3": null,
    "4": null,
    "5": null,
    "6": null,
    "7": null,
    "8": null,
    "9": null,
};

// MISC

let gameLogicWorker: Worker;
let currentSelectedQuestKey = 0;
let upsCount = 0;
let lastTime = Date.now();
let token: string;

const mouseEventHandler = makeSendPropertiesHandler([
    "ctrlKey",
    "metaKey",
    "shiftKey",
    "button",
    "pointerType",
    "clientX",
    "clientY",
    "pageX",
    "pageY",
]);
const wheelEventHandlerImpl = makeSendPropertiesHandler(["deltaX", "deltaY"]);
const keydownEventHandler = makeSendPropertiesHandler([
    "ctrlKey",
    "metaKey",
    "shiftKey",
    "keyCode",
]);

function wheelEventHandler(event: any, sendFn: any) {
    event.preventDefault();
    wheelEventHandlerImpl(event, sendFn);
}

function preventDefaultHandler(event: any) {
    event.preventDefault();
}

function copyProperties(src: any, properties: any, dst: any) {
    for (const name of properties) {
        dst[name] = src[name];
    }
}

function makeSendPropertiesHandler(properties: any) {
    return function sendProperties(event: any, sendFn: any) {
        const data = { type: event.type };
        copyProperties(event, properties, data);
        sendFn(data);
    };
}

function touchEventHandler(event: any, sendFn: any) {
    const touches: any = [];
    const data = { type: event.type, touches };
    for (let i = 0; i < event.touches.length; ++i) {
        const touch = event.touches[i];
        touches.push({
            pageX: touch.pageX,
            pageY: touch.pageY,
        });
    }

    sendFn(data);
}

// The four arrow keys
const orbitKeys = {
    "37": true, // left
    "38": true, // up
    "39": true, // right
    "40": true, // down
};

function filteredKeydownEventHandler(event: any, sendFn: any) {
    const { keyCode } = event;
    //@ts-ignore
    if (orbitKeys[keyCode]) {
        event.preventDefault();
        keydownEventHandler(event, sendFn);
    }
}

let nextProxyId = 0;
class ElementProxy {
    id: any;
    worker: any;
    constructor(element: any, worker: any, eventHandlers: any) {
        this.id = nextProxyId++;
        this.worker = worker;
        const sendEvent = (data: any) => {
            this.worker.postMessage({
                type: "event",
                id: this.id,
                data,
            });
        };

        // register an id
        worker.postMessage({
            type: "makeProxy",
            id: this.id,
        });
        sendSize();
        for (const [eventName, handler] of Object.entries(eventHandlers)) {
            element.addEventListener(eventName, function (event: any) {
                //@ts-ignore
                handler(event, sendEvent);
            });
        }

        function sendSize() {
            const rect = element.getBoundingClientRect();
            sendEvent({
                type: "size",
                left: rect.left,
                top: rect.top,
                width: element.clientWidth,
                height: element.clientHeight,
            });
        }

        // really need to use ResizeObserver
        window.addEventListener("resize", sendSize);
    }
}

socket.on("connect", () => {
    console.log("Connected to the socket.io server");
});

socket.on("userisAdmin", () => {
    consoleBtn.hidden = false;
});

socket.on(
    "loginSuccessful",
    (data: { username: string; gameversion: string; token: string }) => {
        console.log(`Successful login as ${data.username}, starting game...`);
        playerName = data.username;
        token = data.token;
        // rescaleOnWindowResize();
        uiDiv.hidden = false;
        gameVersionDiv.innerHTML = data.gameversion;
        socket.emit("checkisAdmin", data.username);
    }
);

socket.on(
    "loadPlayerSettings",
    (data: { username: string; playerSettings: any }) => {
        for (let i = 0; i < data.playerSettings.length; i++) {
            if (data.username == data.playerSettings[i].username) {
                if (volumeValue && switchCheckbox && saveSettingsBtn) {
                    volumeValue.value = data.playerSettings[i].volume;

                    switchCheckbox.checked =
                        data.playerSettings[i].antiAliasing;

                    // gameLogicWorker.postMessage({
                    //     type: "recreateRenderer",
                    //     antiAliasing: data.playerSettings[i].antiAliasing,
                    // });

                    initScene(data.playerSettings[i].antiAliasing, token);

                    // mainThemeMusic.setVolume(
                    //     parseInt(data.playerSettings[i].volume) / 100
                    // );
                }
            }
        }
    }
);

socket.on("userAlreadyLogined", (data: { username: string }) => {
    alert(`The user ${data.username} is already authorized`);
});

socket.on("loginUnsuccessful", (data: { username: string }) => {
    alert(`Incorrect password for user: ${data.username}`);
});

socket.on("registerSuccessful", (data: { username: string }) => {
    alert(`Successfully registered user: ${data.username}`);
});

socket.on("registerUnsuccessful", (data: { username: string }) => {
    alert(`Could not register user: ${data.username}`);
});

socket.on("serverMessage", (data: { type: string; message: string }) => {
    const messageDiv = document.createElement("div");
    messageDiv.textContent = data.message;

    if (data.type == "chat") {
        messageDiv.classList.add("chat_message");
        if (chatModalContent) {
            if (chatModalContent.childNodes.length >= 20) {
                chatModalContent.removeChild(
                    chatModalContent.lastChild as Node
                );
            }
            chatModalContent.insertBefore(
                messageDiv,
                chatModalContent.firstChild
            );
        }
    } else if (data.type == "console") {
        messageDiv.classList.add("console_message");
        consoleContent?.appendChild(messageDiv);
    }
});

socket.on(
    "shopData",
    (data: {
        lasers: any[];
        ships: any[];
        generators: any[];
        ammunition: { laserAmmo: any[]; rocketAmmo: any[] };
    }) => {
        shoppingData = {
            weapons: data.lasers,
            ships: data.ships,
            generators: data.generators,
            ammunition: {
                laserAmmo: data.ammunition.laserAmmo,
                rocketAmmo: data.ammunition.rocketAmmo,
            },
        };
        displayShoppingItems();
        displayHotbarItems();
    }
);

socket.on(
    "mapData",
    async (data: {
        name: string;
        entities: any[];
        projectiles: any[];
        cargoboxes: any[];
        size: { width: number; height: number };
    }) => {
        // gameLogicWorker.postMessage({
        //     type: "mapData",
        //     mapData: data,
        //     playerName: playerName,
        // });
        upsCount++;

        const time = Date.now();
        const elapsed = (time - lastTime) / 1000;

        if (elapsed >= 1) {
            const ups = upsCount / elapsed;
            gameupsDiv.innerHTML = `Client UPS: ${ups.toFixed(4)}`;

            upsCount = 0;
            lastTime = time;
        }
    }
);

socket.on("questsData", (data: { username: string; quests: any[] }) => {
    if (!quests100qDiv || !Array.isArray(data.quests)) return;

    while (quests100qDiv.firstChild) {
        quests100qDiv.removeChild(quests100qDiv.firstChild);
    }

    console.log(data.quests);

    data.quests.forEach((quest) => {
        const _questName = quest.questName;
        const { completed } = quest;

        const questContainer = document.createElement("div");
        questContainer.classList.add("quest_cont");

        const questNumber = document.createElement("div");
        questNumber.classList.add("quest_number");
        questNumber.textContent = quest.questNo;

        const questNameDiv = document.createElement("div");
        questNameDiv.classList.add("quest_name");
        questNameDiv.textContent = `${_questName}: ${quest.description}`;

        const acceptButton = document.createElement("button");
        acceptButton.classList.add("quest_accept");
        acceptButton.textContent = "Accept";

        acceptButton.addEventListener("click", () => {
            socket.emit("acceptQuest", {
                username: data.username,
                questName: _questName,
            });
        });

        questContainer.appendChild(questNumber);
        questContainer.appendChild(questNameDiv);
        questContainer.appendChild(acceptButton);
        quests100qDiv.appendChild(questContainer);

        if (!completed) {
            questContainer.hidden = true;
        }
    });
});

socket.on(
    "serverTop10Honor",
    async (data: { top10: { playerName: string; honor: number }[] }) => {
        const top10HonorDiv = document.getElementById("top10honor");
        if (top10HonorDiv) {
            while (top10HonorDiv.firstChild !== null) {
                top10HonorDiv.firstChild.remove();
            }
            for (const top in data.top10) {
                const div = document.createElement("div");
                div.classList.add("ranking_line");
                div.textContent = `${
                    parseInt(top) + 1
                }. ${await beautifyNumberToUser(data.top10[top].honor)}, ${
                    data.top10[top].playerName
                }`;
                top10HonorDiv.appendChild(div);
            }
        }
    }
);

socket.on(
    "serverTop10Experience",
    async (data: { top10: { playerName: string; experience: number }[] }) => {
        console.log(data);
        const top10ExperienceDiv = document.getElementById("top10experience");
        if (top10ExperienceDiv) {
            while (top10ExperienceDiv.firstChild !== null) {
                top10ExperienceDiv.firstChild.remove();
            }
            for (const top in data.top10) {
                const div = document.createElement("div");
                div.classList.add("ranking_line");
                div.textContent += `${
                    parseInt(top) + 1
                }. ${await beautifyNumberToUser(data.top10[top].experience)}, ${
                    data.top10[top].playerName
                }`;
                top10ExperienceDiv.appendChild(div);
            }
        }
    }
);

socket.on(
    "emitRewardInfoToUser",
    async (data: { reward: any; consumed: boolean }) => {
        if (notificationContainer) {
            for (const key in data.reward) {
                if (data.reward.hasOwnProperty(key)) {
                    if (key != "recipientUUID") {
                        const maxEventCount = 8;
                        let currentEventCount =
                            notificationContainer.children.length;

                        while (maxEventCount < currentEventCount) {
                            notificationContainer.firstChild?.remove();
                            currentEventCount--;
                        }

                        if (data.reward[key]._type) {
                            console.log(data.reward[key]);
                            const messageContainer =
                                document.createElement("div");
                            messageContainer.classList.add("notification");
                            if (!data.reward[key].amount)
                                data.reward[key].amount = 1;
                            if (data.reward[key].amount == 0)
                                data.reward[key].amount = 1;
                            if (data.consumed) {
                                messageContainer.textContent = `You used ${await beautifyNumberToUser(
                                    data.reward[key].amount
                                )} ${data.reward[key].name} ${
                                    data.reward[key]._type
                                }.`;
                            } else {
                                messageContainer.textContent = `You received ${await beautifyNumberToUser(
                                    data.reward[key].amount
                                )} ${data.reward[key].name} ${
                                    data.reward[key]._type
                                }.`;
                            }
                            notificationContainer.appendChild(messageContainer);
                            setTimeout(() => {
                                try {
                                    notificationContainer.removeChild(
                                        messageContainer
                                    );
                                } catch (err) {}
                            }, 5000);
                        } else {
                            if (
                                data.reward[key] !== "items" ||
                                data.reward[key] !== "amount"
                            ) {
                                if (data.reward[key].length) {
                                    data.reward[key].forEach(
                                        async (dat: any) => {
                                            if (dat.amount == 0) dat.amount = 1;
                                            const messageContainer =
                                                document.createElement("div");
                                            messageContainer.classList.add(
                                                "notification"
                                            );
                                            messageContainer.textContent = `You received ${await beautifyNumberToUser(
                                                dat.amount
                                            )} ${dat.name}.`;
                                            notificationContainer.appendChild(
                                                messageContainer
                                            );
                                            setTimeout(() => {
                                                try {
                                                    notificationContainer.removeChild(
                                                        messageContainer
                                                    );
                                                } catch (err) {}
                                            }, 5000);
                                        }
                                    );
                                } else {
                                    if (
                                        (await beautifyNumberToUser(
                                            data.reward[key]
                                        )) == "" ||
                                        key == "amount"
                                    ) {
                                        return;
                                    }
                                    const messageContainer =
                                        document.createElement("div");
                                    messageContainer.classList.add(
                                        "notification"
                                    );
                                    messageContainer.textContent = `You received ${await beautifyNumberToUser(
                                        data.reward[key]
                                    )} ${key}.`;
                                    notificationContainer.appendChild(
                                        messageContainer
                                    );
                                    // console.log(messageContainer.textContent);

                                    setTimeout(() => {
                                        try {
                                            notificationContainer.removeChild(
                                                messageContainer
                                            );
                                        } catch (err) {}
                                    }, 5000);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
);

socket.on(
    "hotbarMappingData",
    (data: { username: string; hotbarMapping: HotbarMapping }) => {
        hotbarMapping = data.hotbarMapping;
        updateHotbarItems(data.hotbarMapping);
    }
);

socket.on("universeData", (data: { maps: any }) => {
    console.log("Universe data", data.maps);
});

async function updatePlayerInfo(entity: any) {
    playerEntity = entity;

    if (
        creditsElement &&
        thuliumElement &&
        experienceElement &&
        honorElement &&
        prestigeElement &&
        levelElement &&
        simCargoElement &&
        simHPElement &&
        simSHElement &&
        simSPElement
    ) {
        let totalOres = 0;
        entity.inventory.cargoBay.ores.forEach((ore: any) => {
            totalOres += ore.amount;
        });

        const [
            credits,
            thulium,
            experience,
            honor,
            level,
            hullPoints,
            shieldPoints,
            speed,
            cargo,
        ] = await Promise.all([
            beautifyNumberToUser(entity.stats.credits),
            beautifyNumberToUser(entity.stats.thulium),
            beautifyNumberToUser(entity.stats.experience),
            beautifyNumberToUser(entity.stats.honor),
            beautifyNumberToUser(entity.level),
            beautifyNumberToUser(entity.hitPoints.hullPoints),
            beautifyNumberToUser(entity.hitPoints.shieldPoints),
            beautifyNumberToUser(entity.speed),
            beautifyNumberToUser(totalOres),
        ]);

        levelElement.textContent = level;
        creditsElement.textContent = credits;
        thuliumElement.textContent = thulium;
        experienceElement.textContent = experience;
        honorElement.textContent = honor;
        // prestigeElement.textContent = level;

        simHPElement.textContent = hullPoints;
        simSHElement.textContent = shieldPoints;
        simSPElement.textContent = speed;
        simCargoElement.textContent = cargo;
    }

    async function arraysAreDifferentAsync<T>(
        arr1: T[],
        arr2: T[],
        prop: keyof T
    ): Promise<boolean> {
        return new Promise((resolve) => {
            if (arr1.length !== arr2.length) resolve(true);

            const names1 = arr1.map((item) => item[prop]);
            const names2 = arr2.map((item) => item[prop]);

            resolve(!names1.every((name, index) => name === names2[index]));
        });
    }

    if (!playerInventory) {
        playerInventory = entity.inventory;

        Promise.all([
            displayShipsInHangar(),
            displayItemsInWorkroom(),
            displayActiveItems(),
        ])
            .then(() => {
                console.log("UI updated successfully");
            })
            .catch((error) => {
                console.error(
                    "An error occurred while updating the UI:",
                    error
                );
            });
    } else {
        const shouldUpdateUI = await Promise.all([
            arraysAreDifferentAsync(
                playerInventory.lasers,
                entity.inventory.lasers,
                "name"
            ),
            arraysAreDifferentAsync(
                playerInventory.shieldGenerators,
                entity.inventory.shieldGenerators,
                "name"
            ),
            arraysAreDifferentAsync(
                playerInventory.speedGenerators,
                entity.inventory.speedGenerators,
                "name"
            ),
            arraysAreDifferentAsync(
                playerInventory.ammunition,
                entity.inventory.ammunition,
                "name"
            ),
            arraysAreDifferentAsync(
                playerInventory.ships,
                entity.inventory.ships,
                "name"
            ),
            arraysAreDifferentAsync(
                playerInventory.consumables,
                entity.inventory.consumables,
                "name"
            ),
        ]).then((results) => results.some((result) => result === true));

        if (shouldUpdateUI) {
            playerInventory = entity.inventory;

            Promise.all([
                displayShipsInHangar(),
                displayItemsInWorkroom(),
                displayActiveItems(),
            ])
                .then(() => {
                    console.log("UI updated successfully");
                })
                .catch((error) => {
                    console.error(
                        "An error occurred while updating the UI:",
                        error
                    );
                });
        }
    }
}

function savePlayerHotbarSettings(data: {
    username: string;
    hotbarMapping: HotbarMapping;
}) {
    if (data.hotbarMapping) {
        socket.emit("savePlayerHotbarSettings", {
            username: data.username,
            hotbarMapping: JSON.stringify(data.hotbarMapping),
        });
    }
}

async function beautifyNumberToUser(number: number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function savePlayerSettings(data: {
    username: string;
    volume: string;
    antiAliasing: boolean;
}) {
    if (data.antiAliasing) {
        socket.emit("saveSettings", {
            username: data.username,
            volume: parseInt(data.volume),
            antiAliasing: 1,
        });
    } else {
        socket.emit("saveSettings", {
            username: data.username,
            volume: parseInt(data.volume),
            antiAliasing: 0,
        });
    }
}

function createNewIcon(itemName: string) {
    const itemPng = document.createElement("img");
    itemPng.classList.add("item_icon_png");
    itemPng.src = `../assets/icons/${itemName}.png`;
    itemPng.onerror = () => {
        itemPng.src = `../assets/icons/defaultIcon.png`;
        console.log(`Icon ../assets/icons/${itemName}.png not found`);
    };

    return itemPng;
}

async function loadEventListeners() {
    canvas?.addEventListener(
        "mouseup",
        function (event) {
            if (event.button === 0) {
                // Check if the left mouse button (button 0) was released
                gameLogicWorker.postMessage({
                    type: "raycastFromCamera",
                    event: {
                        clientX: event.clientX,
                        clientY: event.clientY,
                    },
                });
            }
        },
        false
    );

    sendChatMessageButton = document.getElementById("sendChatMessageButton");
    chatModalContent = document.getElementById("chat_modal_content");
    chatModalInput = document.getElementById(
        "chat_modal_input"
    ) as HTMLInputElement | null;

    sendConsoleMessageButton = document.getElementById(
        "sendConsoleMessageButton"
    );
    consoleContent = document.getElementById("console_output");
    consoleInput = document.getElementById(
        "console_input"
    ) as HTMLInputElement | null;

    sendChatMessageButton?.addEventListener("click", function (event) {
        const messageText = chatModalInput?.value.trim();
        if (messageText && chatModalInput && chatModalContent) {
            socket.emit("sendChatMessageToServer", {
                username: playerName,
                message: messageText,
            });
            chatModalInput.value = "";
        }
    });

    sendConsoleMessageButton?.addEventListener("click", function (event) {
        const consoleMessageText = consoleInput?.value.trim();
        if (consoleMessageText && consoleInput && consoleContent) {
            socket.emit("sendConsoleMessageToServer", {
                username: playerName,
                message: consoleMessageText,
            });
            consoleInput.value = "";
        }
    });

    window.addEventListener("keypress", handleKeyboardButton);

    switchCheckbox?.addEventListener("change", (event: any) => {
        const isChecked = event.target.checked;
        if (isChecked) {
            gameLogicWorker.postMessage({
                type: "recreateRenderer",
                antiAliasing: true,
            });
        } else {
            gameLogicWorker.postMessage({
                type: "recreateRenderer",
                antiAliasing: false,
            });
        }
    });

    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener("click", () => {
            if (volumeValue && switchCheckbox) {
                savePlayerSettings({
                    username: playerName,
                    volume: volumeValue.value,
                    antiAliasing: switchCheckbox.checked,
                });
            }
        });
    }

    // if (volumeLevelInput) {
    //     volumeLevelInput.addEventListener("change", () => {
    //         mainThemeMusic.setVolume(parseInt(volumeLevelInput.value) / 100);
    //     });
    // }

    if (refreshTop10ExperienceBtn && refreshTop10HonorBtn) {
        refreshTop10ExperienceBtn.addEventListener("click", () => {
            socket.emit("getTop10Experience", playerName);
        });
        refreshTop10HonorBtn.addEventListener("click", () => {
            socket.emit("getTop10Honor", playerName);
        });
    }

    document.querySelectorAll(".item").forEach((item: any) => {
        item.draggable = true;

        item.addEventListener("dragstart", (e: any) => {
            e.dataTransfer.setData("text/plain", e.target.id);
        });
    });

    document.querySelectorAll(".control-slot").forEach((slot) => {
        slot.addEventListener("dragover", (e) => {
            e.preventDefault();
        });

        slot.addEventListener("drop", (e: any) => {
            e.preventDefault();
            const itemName = JSON.parse(
                e.dataTransfer.getData("text/plain")
            ).itemName;
            const key = slot.getAttribute("data-key");
            slot.innerHTML = "";

            slot.appendChild(createNewIcon(itemName));
            if (key && key in hotbarMapping) {
                hotbarMapping[key] = {
                    itemName: itemName as string,
                };
                savePlayerHotbarSettings({
                    username: playerName,
                    hotbarMapping: hotbarMapping,
                });
            }
        });
    });

    // Add event listeners to dots in questbook
    for (let i = 0; i <= 4; i++) {
        const dot = document.getElementById(`dot_${i}`);
        dot?.addEventListener("click", () => {
            displayQuest(playerEntity.currentActiveQuests[i]);
            currentSelectedQuestKey = i;
        });
    }

    setInterval(() => {
        displayQuest(playerEntity.currentActiveQuests[currentSelectedQuestKey]);
    }, 1000);

    window.addEventListener("resize", sendSize);
    sendSize();

    window.addEventListener("keypress", handleKeyboardButton);
}

function handleKeyboardButton(e: KeyboardEvent) {
    if (playerName) {
        const validKeys = new Set([
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "0",
        ]);
        console.log(playerEntity);
        if (validKeys.has(e.key) && lockOnCircleParent) {
            socket.emit("shootEvent", {
                playerName: playerName,
                targetUUID: lockOnCircleParent,
                weapons: "lasers",
                ammo: hotbarMapping[e.key]?.itemName,
            });
        } else {
            switch (e.key) {
                case "Enter":
                    if (chatModelDivClass?.classList.contains("shown")) {
                        const messageText = chatModalInput?.value.trim();
                        if (messageText && chatModalInput && chatModalContent) {
                            socket.emit("sendChatMessageToServer", {
                                username: playerName,
                                message: messageText,
                            });
                            chatModalInput.value = "";
                        }
                    } else if (consoleDiv.style.display == "block") {
                        const consoleMessageText = consoleInput?.value.trim();
                        if (
                            consoleMessageText &&
                            consoleInput &&
                            consoleContent
                        ) {
                            socket.emit("sendConsoleMessageToServer", {
                                username: playerName,
                                message: consoleMessageText,
                            });
                            consoleInput.value = "";
                        }
                    }
                    break;
                case "j":
                    // const portals = currentMap.entities.filter(
                    //     (entity: { _type: string }) => entity._type === "Portal"
                    // );
                    // const closestPortal = findClosestPortal(
                    //     playerEntity.position,
                    //     portals
                    // );
                    // console.log(portals);
                    // console.log(closestPortal);
                    // if (closestPortal) {
                    //     if (
                    //         Math.sqrt(
                    //             Math.pow(
                    //                 closestPortal.position.x -
                    //                     playerEntity.position.x,
                    //                 2
                    //             ) +
                    //                 Math.pow(
                    //                     closestPortal.position.y -
                    //                         playerEntity.position.y,
                    //                     2
                    //                 )
                    //         ) < 5
                    //     ) {
                    socket.emit("attemptTeleport", {
                        playerName: playerName,
                    });
                    //     }
                    // }
                    break;
                // case "o":
                //     console.log(scene);
                //     break;
                // case "s":
                //     console.log(currentSounds);
                //     break;
                // case " ":
                //     if (lockOnCircle?.parent != undefined) {
                //         socket.emit("shootEvent", {
                //             playerName: playerName,
                //             targetUUID: lockOnCircle.parent.uuid,
                //             weapons: "rockets",
                //             ammo: "PRP-2023",
                //         });
                //     }
                //     break;
            }
        }
    }
}

async function displayHotbarItems(
    data = shoppingData.ammunition,
    parentCategory = null
) {
    const categoryRow = document.querySelector(".category-row");
    if (categoryRow) {
        for (const category in data) {
            if (typeof data[category] === "object" && !data[category].name) {
                const categoryDiv = document.createElement("div");
                categoryDiv.className = "category";
                categoryDiv.innerText = parentCategory
                    ? `${parentCategory} > ${category}`
                    : category;
                categoryRow.appendChild(categoryDiv);
                categoryDiv.addEventListener("click", function () {
                    displayItems(data[category], category);
                });
            } else if (parentCategory) {
                displayItems(data, parentCategory);
            }
        }
        function displayItems(data: any, category: string) {
            const itemsRow = document.querySelector(".items-row");
            if (!itemsRow) return;
            itemsRow.innerHTML = "";
            for (const item in data) {
                const itemDiv = document.createElement("div");
                itemDiv.className = "item";
                itemDiv.innerText = data[item].name;
                itemsRow.appendChild(itemDiv);

                // Enable drag-and-drop
                itemDiv.draggable = true;
                itemDiv.addEventListener("dragstart", function (event: any) {
                    const dragData = {
                        itemName: item,
                        category: category, // Include the category in drag data
                    };
                    event.dataTransfer.setData(
                        "text/plain",
                        JSON.stringify(dragData)
                    );
                });
            }
        }
    }
}

function updateHotbarItems(hotbarMapping: HotbarMapping) {
    const hotbarSlots = document.querySelectorAll(".control-slot");

    hotbarSlots.forEach((slot) => {
        const key = slot.getAttribute("data-key");

        if (key && key in hotbarMapping) {
            const hotbarItem = hotbarMapping[key];

            // Clear existing item
            slot.innerHTML = "";

            if (hotbarItem) {
                // If the slot has an item, create a new icon and append it
                const newIcon = createNewIcon(hotbarItem.itemName);
                slot.appendChild(newIcon);
            }
        }
    });
}

async function displayShoppingItems() {
    // console.log(shoppingData);

    for (const category in shoppingData) {
        if (
            !shoppingData.hasOwnProperty(category) ||
            category === "ammunition"
        ) {
            continue;
        }

        const categoryItems = shoppingData[category];
        const categoryContainer = document.getElementById(
            `shopping_${category}`
        );

        if (!categoryContainer) {
            console.error(`Category container not found for '${category}'`);
            continue;
        }

        categoryContainer.innerHTML = "";

        for (const itemName in categoryItems) {
            if (!categoryItems.hasOwnProperty(itemName)) {
                continue;
            }

            const item = categoryItems[itemName];
            const itemContainer = createShopItem(itemName, item.price);

            categoryContainer.appendChild(await itemContainer);

            const buyButton = (await itemContainer).querySelector(
                ".buy_button"
            );

            if (buyButton) {
                buyButton.addEventListener("click", async () => {
                    handleBuyButtonClick(itemName, item.price);
                });
            }
        }
    }

    // Handle ammunition category separately
    const ammoCategoryContainer = document.getElementById(
        "shopping_ammunition"
    );
    if (ammoCategoryContainer) {
        ammoCategoryContainer.innerHTML = "";

        for (const ammoType in shoppingData.ammunition) {
            for (const name in shoppingData.ammunition[ammoType]) {
                const item = shoppingData.ammunition[ammoType][name];
                const itemContainer = createShopItem(name, item.price);

                const itemAmountInput = createItemAmountInput();

                const lastChild = (await itemContainer).lastChild;
                if (!lastChild) return;
                const secondToLastChild = lastChild.previousSibling;
                if (!secondToLastChild) return;

                (await itemContainer).insertBefore(
                    itemAmountInput,
                    secondToLastChild.nextSibling
                );

                ammoCategoryContainer.appendChild(await itemContainer);

                const buyButton = (await itemContainer).querySelector(
                    ".buy_button"
                );

                if (buyButton) {
                    buyButton.addEventListener("click", async () => {
                        const amount = parseInt(itemAmountInput.value) || 1;
                        handleBuyButtonClick(name, item.price, amount);
                    });
                }

                itemAmountInput.addEventListener("change", async () => {
                    handleItemAmountChange(
                        itemAmountInput,
                        item.price,
                        await itemContainer
                    );
                });
            }
        }
    }
}

async function createShopItem(itemName: string, itemPrice: any) {
    const itemContainer = document.createElement("div");
    itemContainer.classList.add("shop_item");

    const itemNameElement = createItemNameElement(itemName);
    const itemIcon = createItemIcon(itemName);
    const itemPriceElement = await createItemPriceElement(itemPrice);
    const buyButton = createBuyButton();

    itemContainer.appendChild(itemNameElement);
    itemContainer.appendChild(itemIcon);
    itemContainer.appendChild(itemPriceElement);
    itemContainer.appendChild(buyButton);

    return itemContainer;
}

function createItemNameElement(itemName: string) {
    const itemNameElement = document.createElement("div");
    itemNameElement.classList.add("item_name");
    itemNameElement.textContent = itemName;
    return itemNameElement;
}

function createItemIcon(itemName: string) {
    const itemIcon = document.createElement("div");
    itemIcon.classList.add("item_icon");
    const itemPng = createNewIcon(itemName);
    itemIcon.appendChild(itemPng);
    return itemIcon;
}

async function createItemPriceElement(itemPrice: any) {
    const itemPriceElement = document.createElement("div");
    itemPriceElement.classList.add("item_price");
    itemPriceElement.textContent = `Price: ${await beautifyNumberToUser(
        itemPrice.credits || itemPrice.thulium || 0
    )} ${itemPrice.credits ? "credits" : "thulium"}`;
    return itemPriceElement;
}

function createBuyButton() {
    const buyButton = document.createElement("button");
    buyButton.classList.add("buy_button");
    buyButton.textContent = "BUY";
    return buyButton;
}

function createItemAmountInput() {
    const itemAmountInput = document.createElement("input");
    itemAmountInput.type = "number";
    itemAmountInput.classList.add("item_amount_input");
    itemAmountInput.placeholder = "Amount";
    return itemAmountInput;
}

async function handleBuyButtonClick(
    itemName: string,
    itemPrice: any,
    amount = 1
) {
    // console.log(`You clicked BUY for ${itemName}`);

    for (let i = 0; i < playerInventory.ships.length; i++) {
        if (playerInventory.ships[i].name === itemName) {
            showErrorMessage(
                "Cannot buy ship",
                `Ship ${itemName} already owned`
            );
            return;
        }
    }

    if (!(await checkPlayerCurrency(itemPrice))) {
        return;
    }

    socket.emit(`playerPurchaseEvent`, {
        playerName: playerName,
        itemName: itemName,
        amount: amount,
    });
}

async function handleItemAmountChange(
    itemAmountInput: HTMLInputElement,
    itemPrice: any,
    itemContainer: HTMLElement
) {
    if (itemAmountInput.value && parseInt(itemAmountInput.value) > 0) {
        if (itemPrice.credits) {
            const totalPrice =
                itemPrice.credits * parseInt(itemAmountInput.value);
            const itemPriceElement = itemContainer.querySelector(".item_price");

            if (itemPriceElement) {
                itemPriceElement.textContent = `Price: ${await beautifyNumberToUser(
                    totalPrice
                )} credits`;
            }
        } else {
            const totalPrice =
                itemPrice.thulium * parseInt(itemAmountInput.value);
            const itemPriceElement = itemContainer.querySelector(".item_price");

            if (itemPriceElement) {
                itemPriceElement.textContent = `Price: ${await beautifyNumberToUser(
                    totalPrice
                )} thulium`;
            }
        }
    }
}

function displayShipsInHangar(): Promise<void> {
    return new Promise((resolve, reject) => {
        const categoryContainer = document.getElementById("hangar_storage");

        if (!categoryContainer) {
            console.error("Category container 'hangar_storage' not found.");
            reject(new Error("Category container 'hangar_storage' not found."));
            return;
        }

        categoryContainer.innerHTML = "";

        try {
            for (const ship of playerInventory.ships) {
                const hangarItemContainer = createShopItemContainer(
                    ship.name,
                    ship.name
                );
                const equipButton = createEquipButton();

                hangarItemContainer.appendChild(equipButton);
                categoryContainer.appendChild(hangarItemContainer);

                equipButton.addEventListener("click", () => {
                    handleEquipButtonClick(ship.name);
                });
            }
            resolve();
        } catch (error) {
            console.error(
                "An error occurred while displaying ships in hangar:",
                error
            );
            reject(error);
        }
    });
}

function createShopItemContainer(itemName: string, iconName: string) {
    const itemContainer = document.createElement("div");
    itemContainer.classList.add("hangar_item");

    const itemNameElement = createItemNameElement(itemName);
    const shipIcon = createItemIcon(iconName);
    // const equipButton = createEquipButton();

    itemContainer.appendChild(itemNameElement);
    itemContainer.appendChild(shipIcon);
    // itemContainer.appendChild(equipButton);

    return itemContainer;
}

function createEquipButton() {
    const equipButton = document.createElement("button");
    equipButton.classList.add("profile_btn");
    equipButton.classList.add("profile_equip_btn");
    equipButton.textContent = "EQUIP";
    return equipButton;
}

function createUseButton() {
    const useButton = document.createElement("button");
    useButton.classList.add("profile_btn");
    useButton.classList.add("profile_use_btn");
    useButton.textContent = "USE";
    return useButton;
}

async function handleEquipButtonClick(itemName: string) {
    // console.log(`You clicked equip button for ship ${itemName}`);
    socket.emit(`equipItemEvent`, {
        playerName: playerName,
        itemName: itemName,
    });
}

async function handleUseButtonClick(itemName: string) {
    socket.emit(`useItemEvent`, {
        playerName: playerName,
        itemName: itemName,
    });
}

async function checkPlayerCurrency(price: {
    credits?: number;
    thulium?: number;
}): Promise<boolean> {
    const { stats } = playerEntity;

    if (!stats) {
        return false;
    }

    const { credits, thulium } = price;

    if (credits && stats.credits < credits) {
        showErrorMessage(
            `Not enough credits`,
            `You have: ${await beautifyNumberToUser(
                stats.credits
            )} and need ${await beautifyNumberToUser(
                credits
            )} credits to buy this item.`
        );
        return false;
    }

    if (thulium && stats.thulium < thulium) {
        showErrorMessage(
            `Not enough thulium`,
            `You have: ${await beautifyNumberToUser(
                stats.thulium
            )} and need ${await beautifyNumberToUser(
                thulium
            )} thulium to buy this item.`
        );
        return false;
    }

    return true;
}

async function showErrorMessage(
    errorTitle: string,
    errorMessage: string
): Promise<void> {
    const errorContainer = document.getElementById("error_container");

    const errorTitleElement = document.getElementById("error_title");
    const errorMessageElement = document.getElementById("error_message");

    if (errorContainer && errorTitleElement && errorMessageElement) {
        errorTitleElement.textContent = errorTitle;
        errorMessageElement.textContent = errorMessage;

        errorContainer.style.display = "block";
    } else {
        console.error("Error: Required HTML elements not found.");
    }
}

function displayItemsInWorkroom(): Promise<void> {
    return new Promise((resolve, reject) => {
        const categoryContainer = document.getElementById("workroom_storage");

        if (!categoryContainer) {
            console.error("Category container 'workroom_storage' not found.");
            reject(
                new Error("Category container 'workroom_storage' not found.")
            );
            return;
        }

        categoryContainer.innerHTML = "";

        try {
            function addItemToContainer(item: any, consumable = false) {
                // console.log(item);
                if (!consumable) {
                    const workroomItemContainer = createShopItemContainer(
                        item.name,
                        item.name
                    );
                    const equipButton = createEquipButton();

                    workroomItemContainer.appendChild(equipButton);
                    if (!categoryContainer) {
                        console.error(
                            "Category container 'workroom_storage' not found."
                        );
                        reject(
                            new Error(
                                "Category container 'workroom_storage' not found."
                            )
                        );
                        return;
                    }

                    categoryContainer.appendChild(workroomItemContainer);

                    equipButton.addEventListener("click", () => {
                        handleEquipButtonClick(item.name);
                    });
                } else {
                    const workroomItemContainer = createShopItemContainer(
                        item.name,
                        item.name
                    );
                    const useButton = createUseButton();

                    workroomItemContainer.appendChild(useButton);
                    if (!categoryContainer) {
                        console.error(
                            "Category container 'workroom_storage' not found."
                        );
                        reject(
                            new Error(
                                "Category container 'workroom_storage' not found."
                            )
                        );
                        return;
                    }

                    categoryContainer.appendChild(workroomItemContainer);

                    useButton.addEventListener("click", () => {
                        handleUseButtonClick(item.name);
                    });
                }
            }

            for (const laser of playerInventory.lasers) {
                addItemToContainer(laser);
            }

            for (const shieldGenerator of playerInventory.shieldGenerators) {
                addItemToContainer(shieldGenerator);
            }

            for (const speedGenerator of playerInventory.speedGenerators) {
                addItemToContainer(speedGenerator);
            }

            for (const consumableItem of playerInventory.consumables) {
                addItemToContainer(consumableItem, true);
            }

            resolve();
        } catch (error) {
            console.error(
                "An error occurred while displaying items in workroom:",
                error
            );
            reject(error);
        }
    });
}

function displayActiveItems(): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            for (const ship of playerInventory.ships) {
                if (ship.isActive) {
                    const categoryContainers = [
                        "workroom_active_lasers",
                        "workroom_active_generators",
                        "workroom_active_extras",
                    ];

                    for (const categoryContainerId of categoryContainers) {
                        const categoryContainer =
                            document.getElementById(categoryContainerId);

                        if (categoryContainer) {
                            categoryContainer.innerHTML = "";
                            const items = getCategoryItems(
                                ship,
                                categoryContainerId
                            );
                            items.forEach((item: any) =>
                                addItemToContainer(item, categoryContainer)
                            );
                        }
                    }
                }
            }

            const categoryContainer4 = document.getElementById("ammo_lasers");
            const categoryContainer5 = document.getElementById("ammo_rockets");

            if (!categoryContainer4 || !categoryContainer5) {
                reject(new Error("Ammo category containers not found."));
                return;
            }

            clearCategoryContainer(categoryContainer4);
            clearCategoryContainer(categoryContainer5);

            displayAmmunition(categoryContainer4, "LaserAmmo");
            displayAmmunition(categoryContainer5, "RocketAmmo");

            resolve();
        } catch (error) {
            console.error(
                "An error occurred while displaying active items:",
                error
            );
            reject(error);
        }
    });
}

function clearCategoryContainer(categoryContainer: HTMLElement) {
    if (categoryContainer) {
        while (categoryContainer.firstChild) {
            categoryContainer.removeChild(categoryContainer.firstChild);
        }
    }
}

function getCategoryItems(
    ship: {
        currentLasers: any[];
        currentGenerators: any[];
        // Add type annotations for other ship properties as needed
    },
    categoryContainerId: string
) {
    const categoryMap: Record<string, any[]> = {
        workroom_active_lasers: ship.currentLasers,
        workroom_active_generators: ship.currentGenerators,
        // Add other category mappings here
    };

    return categoryMap[categoryContainerId] || [];
}

function addItemToContainer(item: any, categoryContainer: HTMLElement) {
    const workroomItemContainer = createShopItemContainer(item.name, item.name);
    const unequipButton = createUnequipButton();

    workroomItemContainer.appendChild(unequipButton);
    categoryContainer.appendChild(workroomItemContainer);

    unequipButton.addEventListener("click", () => {
        handleUnequipButtonClick(item.name);
    });
}

function displayAmmunition(categoryContainer: HTMLElement, ammoType: string) {
    for (const ammunition in playerInventory.ammunition) {
        if (playerInventory.ammunition[ammunition]._type === ammoType) {
            const ammoName = playerInventory.ammunition[ammunition].name;
            const ammoAmount = playerInventory.ammunition[ammunition].amount;

            if (ammoName && ammoAmount) {
                const ammoNameDiv = createAmmoNameDiv(ammoName, ammoAmount);
                categoryContainer.appendChild(ammoNameDiv);
            }
        }
    }
}

function createUnequipButton() {
    const unequipButton = document.createElement("button");
    unequipButton.classList.add("profile_btn");
    unequipButton.classList.add("profile_equip_btn");
    unequipButton.textContent = "UNEQUIP";
    return unequipButton;
}

function handleUnequipButtonClick(itemName: string) {
    // (`Tried to unequip item: ${itemName}`);
    socket.emit(`unequipItemEvent`, {
        playerName: playerName,
        itemName: itemName,
    });
}

function createAmmoNameDiv(ammoName: string, ammoAmount: number) {
    const ammoNameDiv = document.createElement("p");
    ammoNameDiv.classList.add("ammo_text");
    ammoNameDiv.textContent = `${ammoName} : ${ammoAmount}`;
    return ammoNameDiv;
}

function initScene(antialiasing: boolean, token: string): void {
    const eventHandlers = {
        contextmenu: preventDefaultHandler,
        mousedown: mouseEventHandler,
        mousemove: mouseEventHandler,
        mouseup: mouseEventHandler,
        pointerdown: mouseEventHandler,
        pointermove: mouseEventHandler,
        pointerup: mouseEventHandler,
        touchstart: touchEventHandler,
        touchmove: touchEventHandler,
        touchend: touchEventHandler,
        wheel: wheelEventHandler,
        keydown: filteredKeydownEventHandler,
    };

    if (!canvas.transferControlToOffscreen) {
        canvas.style.display = "none";
        alert("UNSUPPORTED BROWSER, BOOO");
        return;
    }
    const offscreenCanvas = canvas.transferControlToOffscreen();
    contentDiv.hidden = true;
    loginDiv.hidden = true;
    spacemapDiv.hidden = false;
    gameLogicWorker = new Worker("./gameLogicWorker.js", { type: "module" });
    gameLogicWorker.onerror = function (event) {
        console.log(event.message, event);
    };

    const proxy = new ElementProxy(canvas, gameLogicWorker, eventHandlers);
    gameLogicWorker.postMessage(
        {
            type: "main",
            canvas: offscreenCanvas,
            canvasId: proxy.id,
            antialias: antialiasing,
            playerName: playerName,
            token: token,
        },
        [offscreenCanvas]
    );

    gameLogicWorker.onmessage = function (event) {
        if (event.data.type == "updatePlayerInfo") {
            updatePlayerInfo(event.data.data);
        } else if (event.data.type == "playerCollectCargoBox") {
            socket.emit("playerCollectCargoBox", {
                playerName: event.data.data.playerName,
                cargoDropUUID: event.data.data.cargoDropUUID,
            });
        } else if (event.data.type == "playerMoveToDestination") {
            socket.emit("playerMoveToDestination", {
                targetPosition: event.data.data.targetPosition,
            });
        } else if (event.data.type == "newLockOnCircleParent") {
            lockOnCircleParent = event.data.data;
        } else if (event.data.type == "fps") {
            gamefpsDiv.innerHTML = `Renderer FPS: ${event.data.fps.toFixed(
                4
            )}, drawCalls:  ${event.data.drawCalls}`;
        }
    };

    loadEventListeners();
}

function sendSize() {
    gameLogicWorker.postMessage({
        type: "size",
        width: canvas.clientWidth,
        height: canvas.clientHeight,
    });
}

function displayQuest(quest: any) {
    // Show the quest name
    if (quest == undefined) {
        document.getElementById("activeQuestName")!.innerHTML = "";
        document.getElementById("activeQuestTask")!.innerHTML = "";
        document.getElementById("activeQuestReward")!.innerHTML = "";
        return;
    }
    document.getElementById("activeQuestName")!.innerText = quest.questName;

    // Show the quest tasks
    const taskDiv = document.getElementById("activeQuestTask")!;
    taskDiv.innerHTML = `Tasks: ${quest.type}`;
    quest.tasks.forEach((task: any) => {
        const taskElement = document.createElement("div");
        taskElement.className = `quest_task_${task._type}`;
        taskElement.innerText = `${task._type}: ${
            task.targetName || task.oreName || ""
        } ( ${parseInt(task.currentAmount)} / ${
            task.amount || parseInt(task.distance)
        } ) map: ${task.map}`;
        taskDiv.appendChild(taskElement);
    });

    // Show the quest rewards
    const rewardDiv = document.getElementById("activeQuestReward")!;
    rewardDiv.innerHTML = "Rewards:";
    const statsDiv = document.createElement("div");
    statsDiv.className = "quest_reward_stats";
    let statsTexts = [];

    if (
        quest.reward.stats.experience !== undefined &&
        quest.reward.stats.experience !== 0
    ) {
        statsTexts.push(`Experience: ${quest.reward.stats.experience}`);
    }

    if (
        quest.reward.stats.credits !== undefined &&
        quest.reward.stats.credits !== 0
    ) {
        statsTexts.push(`Credits: ${quest.reward.stats.credits}`);
    }

    if (
        quest.reward.stats.honor !== undefined &&
        quest.reward.stats.honor !== 0
    ) {
        statsTexts.push(`Honor: ${quest.reward.stats.honor}`);
    }

    if (
        quest.reward.stats.thulium !== undefined &&
        quest.reward.stats.thulium !== 0
    ) {
        statsTexts.push(`Thulium: ${quest.reward.stats.thulium}`);
    }

    // Join the array using '<br>' as the separator to create the final string.
    statsDiv.innerHTML = statsTexts.join("<br>");

    rewardDiv.appendChild(statsDiv);

    // Create a container for the quest items
    const itemsDiv = document.createElement("div");
    itemsDiv.className = "quest_reward_items";

    // Create a title for the items section
    const itemsTitle = document.createElement("div");
    itemsTitle.innerText = "Items:";
    itemsDiv.appendChild(itemsTitle);

    // Loop through each item to create individual item elements and append them to the itemsDiv
    quest.reward.items.forEach((item: any) => {
        const individualItemDiv = document.createElement("div");
        individualItemDiv.innerText = `${item.itemName} (${item.amount})`;
        itemsDiv.appendChild(individualItemDiv);
    });

    // Append the itemsDiv to the rewardDiv
    rewardDiv.appendChild(itemsDiv);
}
