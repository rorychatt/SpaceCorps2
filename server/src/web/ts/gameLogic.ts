// Import Statements
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import {
    CSS2DRenderer,
    CSS2DObject,
    // @ts-ignore
} from "./three/addons/renderers/CSS2DRenderer.js";
import * as TWEEN from "@tweenjs/tween.js";
// @ts-ignore
export const socket = io("http://localhost:3000");

// HTML Elements
let loginDiv = document.getElementById("loginDiv") as HTMLElement;
let spacemapDiv = document.getElementById("spacemapDiv") as HTMLElement;
let contentDiv = document.getElementById("content") as HTMLElement;
let uiDiv = document.querySelector(".ui") as HTMLElement;
let consoleBtn = document.querySelector(".console_button") as HTMLElement;
let gameVersionDiv = document.getElementById("gameversion") as HTMLElement;
let gamefpsDiv = document.getElementById("gamefps") as HTMLElement;
let quests100qDiv = document.getElementById("quest_100q") as HTMLElement;
let entityLabelsDiv = document.getElementById("entityLabelsDiv");

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

// Three.js Objects
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.Renderer;
let controls: OrbitControls;
let canvas: HTMLCanvasElement | null;
let audioListener: THREE.AudioListener;
let labelRenderer: CSS2DRenderer;
let lockOnCircle: THREE.Object3D | null;

// Player Data
let playerEntity: any;
let playerName: string;
let playerObject: THREE.Object3D | undefined = undefined;
let lastEntityPosition: THREE.Vector3 = new THREE.Vector3();
let isFirstUpdateForPlayer: boolean = true; // flag to identify the first update for the player

// Game Data
let shoppingData: any;
let playerInventory: any;
let currentMap: any;
const objectCache: Record<string, THREE.Group> = {};
const objectDataMap: Record<string, { data: any }> = {};
const labelMap: Record<string, CSS2DObject> = {};

// Chat and Console
let sendChatMessageButton: HTMLElement | null;
let chatModalContent: HTMLElement | null;
let chatModalInput: HTMLInputElement | null;
let sendConsoleMessageButton: HTMLElement | null;
let consoleContent: HTMLElement | null;
let consoleInput: HTMLInputElement | null;

// Audio
let mainThemeMusic: THREE.Audio;
let explosionSoundBuffer: AudioBuffer,
    laserShootSoundBuffer: AudioBuffer,
    rocketShootSoundBuffer: AudioBuffer,
    laserHitSoundBuffer: AudioBuffer,
    rocketHitSoundBuffer: AudioBuffer;

// Misc
const raycaster = new THREE.Raycaster();
const rayCastLayerNo = 1;
const particles: any[] = [];
const damageIndicators: any[] = [];
const maxConcurrentSounds = 6;
let currentSounds: number = 0;
let isUpdating: boolean = false;
let currentSelectedQuestKey = 0;
const tickrate = 20;
const frameTime = 1000 / (tickrate-1);
let lastTime = 0;
let frameCount = 0;

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

raycaster.layers.set(rayCastLayerNo);
setupSoundBuffers();

socket.on("connect", () => {
    console.log("Connected to the socket.io server");
});

socket.on("userisAdmin", () => {
    consoleBtn.hidden = false;
});

socket.on(
    "loginSuccessful",
    (data: { username: string; gameversion: string }) => {
        console.log(`Successful login as ${data.username}, starting game...`);
        playerName = data.username;
        initScene();
        rescaleOnWindowResize();
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

                    recreateRenderer(data.playerSettings[i].antiAliasing);
                    mainThemeMusic.setVolume(
                        parseInt(data.playerSettings[i].volume) / 100
                    );
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
    "mapData",
    async (data: {
        name: string;
        entities: any[];
        projectiles: any[];
        cargoboxes: any[];
        size: { width: number; height: number };
    }) => {
        if (isUpdating) {
            console.warn(`Skipping tick due to client performance issues`);
        }
        isUpdating = true;
        if (!currentMap || currentMap.name != data.name) {
            loadNewSpacemap(data);
        }
        Promise.resolve(
            updateObjects(
                data.entities.concat(data.projectiles, data.cargoboxes)
            )
        ).then(() => {
            //TODO: this needs to be updated
            playerObject = scene.getObjectByName(playerName);
            isUpdating = false;
        });
    }
);

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

async function loadNewSpacemap(data: any) {
    clearScene(scene);
    lockOnCircle?.removeFromParent();
    try {
        currentMap = data;
        await Promise.all([
            loadSpacemapPlane(data),
            createStars(),
            createLighting(),
            createSkybox(data.name),
            loadStaticEntities(data),
        ]);
    } catch (error) {
        console.log(`Got an error while loading new spacemap: ${data.name}`);
    }
}

async function loadSpacemapPlane(data: any) {
    const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        side: THREE.FrontSide,
        transparent: true,
        opacity: 0.03,
    });
    const geometry = new THREE.PlaneGeometry(data.size.width, data.size.height);
    const plane = new THREE.Mesh(geometry, material);
    plane.position.set(0, 0, 0);
    plane.rotation.x = -Math.PI / 2;
    plane.name = "movingPlane";
    plane.layers.enable(rayCastLayerNo);
    scene.add(plane);
}

async function loadStaticEntities(data: any) {
    return;
}

function clearScene(scene: THREE.Scene) {
    for (const object in objectDataMap) {
        deleteObject(object);
    }

    while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
    }
}

function initScene(): void {
    contentDiv.hidden = true;
    loginDiv.hidden = true;
    spacemapDiv.hidden = false;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    renderer = new THREE.WebGLRenderer({ antialias: true });

    // Set the size of the renderer to match the window size
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Append the renderer to the HTML container
    renderer.domElement.id = "THREEJSScene";
    document.getElementById("spacemapDiv")?.appendChild(renderer.domElement);

    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = "absolute";
    labelRenderer.domElement.style.top = "0px";
    labelRenderer.domElement.style.pointerEvents = "none";
    labelRenderer.domElement.id = "entityLabelsDiv";

    canvas = document.getElementById(
        "THREEJSScene"
    ) as HTMLCanvasElement | null;

    if (!canvas) return;

    // const offscreen = canvas.transferControlToOffscreen();
    // const worker = new Worker("worker.js");

    // worker.postMessage({ type: "init", canvas: offscreen }, [offscreen]);

    spacemapDiv.appendChild(renderer.domElement);
    spacemapDiv.appendChild(labelRenderer.domElement);

    entityLabelsDiv = document.getElementById("entityLabelsDiv");

    createStars();

    loadEventListeners();

    // Position the camera
    camera.position.x = 4;
    camera.position.y = 5;
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    audioListener = new THREE.AudioListener();
    camera.add(audioListener);

    // Create an animation function to rotate the cube
    const animate = (time?: any) => {
        requestAnimationFrame(animate);
        TWEEN.update();

        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);

        particles.forEach((_particles) => {
            _particles.forEach(
                (particle: {
                    position: { add: (arg0: any) => void };
                    velocity: any;
                }) => {
                    particle.position.add(particle.velocity);
                }
            );
        });

        scene.children.forEach((child) => {
            if (child instanceof THREE.Mesh && child.name === "CargoDrop") {
                child.rotation.x += 0.001;
                child.rotation.y += 0.001;
                child.rotation.z += 0.001;
            }
        });

        damageIndicators.forEach((damageIndicator) => {
            damageIndicator.position.add(new THREE.Vector3(0, 0.01, 0));
        });

        frameCount++;
        let elapsed = (time - lastTime) / 1000;
        if (elapsed >= 1) {
            const fps = frameCount / elapsed;
            gamefpsDiv.innerHTML = `FPS: ${fps.toFixed(4)}, drawCalls: ${
                (renderer as any).info.render.calls
            }`;
            frameCount = 0;
            lastTime = time;
        }
    };

    controls = new OrbitControls(camera, renderer.domElement);
    updateControlsSettings();

    mainThemeMusic = new THREE.Audio(audioListener);

    const audioLoader = new THREE.AudioLoader();

    audioLoader.load("./assets/sounds/mainTheme.ogg", function (buffer) {
        mainThemeMusic.setBuffer(buffer);
        mainThemeMusic.setLoop(true);
        if (volumeLevelInput && volumeLevelInput.value) {
            mainThemeMusic.setVolume(parseInt(volumeLevelInput.value) / 100);
        } else {
            mainThemeMusic.setVolume(0.07);
        }
        mainThemeMusic.play();
    });

    const lockOnCircleGeometry = new THREE.RingGeometry(1.5, 1.55, 32);
    const lockOnCirleMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        side: THREE.DoubleSide,
    });
    lockOnCircle = new THREE.Mesh(lockOnCircleGeometry, lockOnCirleMaterial);
    lockOnCircle.rotation.x = 1.57079633;
    lockOnCircle.position.set(0, 0, 0);
    lockOnCircle.name = "lockOnCircle";

    // Call the animate function to start the animation loop
    animate();
}

function raycastFromCamera(event: any) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children, true);

    let _names: string[] = [];

    if (intersects.length > 0) {
        intersects.forEach((intersect) => {
            _names.push(intersect.object.name);
        });

        // console.log(`Got following intersects: ${JSON.stringify(_names)}`);
        // console.log(intersects);

        const isOnlyPlaneAndCargo = _names.every(
            (name) =>
                name === "movingPlane" ||
                name === "CargoDrop" ||
                name === playerName
        );
        const firstCargoDrop = intersects.find(
            (intersect) => intersect.object.name === "CargoDrop"
        );

        if (isOnlyPlaneAndCargo && firstCargoDrop) {
            socket.emit("playerCollectCargoBox", {
                playerName: playerName,
                cargoDropUUID: firstCargoDrop.object.uuid,
            });
        } else if (
            intersects.length === 1 &&
            intersects[0].object.name === "movingPlane"
        ) {
            socket.emit("playerMoveToDestination", {
                targetPosition: {
                    x: intersects[0].point.x,
                    y: intersects[0].point.z,
                },
            });
        } else {
            let object = intersects[0].object;
            if (
                object.name !== playerName &&
                object.name !== "CargoDrop" &&
                lockOnCircle &&
                object.name !== "movingPlane"
            ) {
                lockOnCircle?.removeFromParent();
                object.parent?.add(lockOnCircle);
            } else {
                let object = intersects[1].object;
                if (
                    object.name !== playerName &&
                    object.name !== "CargoDrop" &&
                    lockOnCircle &&
                    object.name !== "movingPlane"
                ) {
                    lockOnCircle?.removeFromParent();
                    object.parent?.add(lockOnCircle);
                }
            }
        }
    }
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

        if (validKeys.has(e.key) && lockOnCircle?.parent) {
            socket.emit("shootEvent", {
                playerName: playerName,
                targetUUID: lockOnCircle.parent.uuid,
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
                    const portals = currentMap.entities.filter(
                        (entity: { _type: string }) => entity._type === "Portal"
                    );
                    const closestPortal = findClosestPortal(
                        playerEntity.position,
                        portals
                    );
                    console.log(portals);
                    console.log(closestPortal);
                    if (closestPortal) {
                        if (
                            Math.sqrt(
                                Math.pow(
                                    closestPortal.position.x -
                                        playerEntity.position.x,
                                    2
                                ) +
                                    Math.pow(
                                        closestPortal.position.y -
                                            playerEntity.position.y,
                                        2
                                    )
                            ) < 5
                        ) {
                            socket.emit("attemptTeleport", {
                                playerName: playerName,
                            });
                        }
                    }
                    break;

                case "o":
                    console.log(scene);
                    break;

                case "s":
                    console.log(currentSounds);
                    break;

                case " ":
                    if (lockOnCircle?.parent != undefined) {
                        socket.emit("shootEvent", {
                            playerName: playerName,
                            targetUUID: lockOnCircle.parent.uuid,
                            weapons: "rockets",
                            ammo: "PRP-2023",
                        });
                    }
                    break;
            }
        }
    }
}

const findClosestPortal = (
    playerPosition: { x: number; y: number },
    portals: any[]
): any | null => {
    let closestPortal: any | null = null;
    let closestDistance: number = Infinity;

    for (const portal of portals) {
        const distance = Math.sqrt(
            Math.pow(portal.position.x - playerPosition.x, 2) +
                Math.pow(portal.position.y - playerPosition.y, 2)
        );
        if (distance < closestDistance) {
            closestDistance = distance;
            closestPortal = portal;
        }
    }
    return closestPortal;
};

function createLighting() {
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    const ambientLight = new THREE.AmbientLight(0x404040, 0.25);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    scene.add(ambientLight);
}

function createSkybox(mapname: string) {
    const loader = new THREE.CubeTextureLoader();

    const texture = loader.load([
        `./assets/spacemaps/${mapname}/right.png`,
        `./assets/spacemaps/${mapname}/left.png`,
        `./assets/spacemaps/${mapname}/top.png`,
        `./assets/spacemaps/${mapname}/bottom.png`,
        `./assets/spacemaps/${mapname}/front.png`,
        `./assets/spacemaps/${mapname}/back.png`,
    ]);

    scene.background = texture;
}

function rescaleOnWindowResize(): void {
    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
    });
}

function createDefaultObject(data: any): THREE.Object3D {
    const boxgeometry = new THREE.BoxGeometry();
    const boxmaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
    });
    const defcube = new THREE.Mesh(boxgeometry, boxmaterial);
    defcube.uuid = data.uuid;
    defcube.position.set(data.position.x, 0, data.position.y);
    defcube.name = data.name;
    objectDataMap[data.uuid] = { data: defcube };
    scene.add(defcube);
    return defcube;
}

function setupAlienObject(model: THREE.Object3D, data: any) {
    model.uuid = data.uuid;
    model.position.set(data.position.x, 0, data.position.y);
    setNameRecursively(model, data.name, data.uuid, rayCastLayerNo);

    const nickBarContainer = document.createElement("div");
    const nickname = document.createElement("div");
    nickname.className = "nicknameLabel";
    nickname.textContent = `${data.name}`;

    const healthBar = document.createElement("div");
    healthBar.className = "health_bar";

    const hpBar = document.createElement("div");
    hpBar.className = "hp_health_bar";

    const spBar = document.createElement("div");
    spBar.className = "sp_health_bar";

    const maxHP = data.maxHealth;
    const maxSP = data.maxShields;

    hpBar.style.width = `${data.hitPoints.hullPoints / maxHP}`;

    spBar.style.width = `${data.hitPoints.shieldPoints / maxSP}`;

    healthBar.appendChild(hpBar);
    healthBar.appendChild(spBar);

    nickBarContainer.appendChild(nickname);
    nickBarContainer.appendChild(healthBar);
    nickBarContainer.setAttribute("uuid", data.uuid);
    nickBarContainer.classList.add("nickBarContainer");

    const label = new CSS2DObject(nickBarContainer);

    labelMap[data.uuid] = label;
    label.position.y = -0.75;
    (model as any).hitPoints = data.hitPoints;
    model.add(label);
    scene.add(model);
    objectDataMap[data.uuid] = { data: model };
}

function setupPlayerObject(model: THREE.Object3D, data: any) {
    model.uuid = data.uuid;
    model.position.set(data.position.x, 0, data.position.y);
    setNameRecursively(model, data.name, data.uuid, rayCastLayerNo);
    if (data.name == playerName) {
        controls.update();
    }

    const text = document.createElement("div");
    text.className = "nicknameLabel";
    text.style.color = "rgb(255,255,255)";
    text.style.fontSize = "12";
    text.textContent = `${data.name}`;
    const label = new CSS2DObject(text);
    labelMap[data.uuid] = label;
    label.position.y = -0.75;
    label.uuid = data.uuid;
    (model as any).hitPoints = data.hitPoints;
    model.add(label);
    scene.add(model);
    objectDataMap[data.uuid] = { data: model };
}

function setupPortalObject(model: THREE.Object3D, data: any) {
    model.uuid = data.uuid;
    model.position.set(data.position.x, 0, data.position.y);
    model.add(createSafeZoneRing(5));
    setNameRecursively(model, data.name, data.uuid);
    scene.add(model);
    model.lookAt(new THREE.Vector3(0, 0, 0));
    objectDataMap[data.uuid] = { data: model };
}

function removeCSSChildrenOfObject(object: THREE.Object3D) {
    let childrenToRemove: THREE.Object3D[] = [];
    object.traverse((child) => {
        if (child instanceof CSS2DObject || child.name == "lockOnCirle") {
            childrenToRemove.push(child);
        }
    });
    for (const child of childrenToRemove) {
        if (child.parent) {
            child.parent.remove(child);
        }
    }
}

async function createObject(data: any): Promise<THREE.Object3D> {
    // console.log(`Creating new Object ${data.name}`);
    return new Promise(async (resolve) => {
        if (data._type == "Player") {
            if (objectCache[data.activeShipName]) {
                const clonedObject =
                    objectCache[data.activeShipName].clone(true);
                removeCSSChildrenOfObject(clonedObject);
            } else {
                const loader = new GLTFLoader();
                const modelUrl = `./assets/models/ships/${data.activeShipName}/${data.activeShipName}.glb`;
                objectDataMap[data.uuid] = { data: null };
                loader.load(modelUrl, async (glb) => {
                    const model = glb.scene;
                    objectCache[data.name] = model;
                    setupPlayerObject(model, data);
                    resolve(model);
                });
            }
        } else {
            if (objectCache[data.name]) {
                const clonedObject = objectCache[data.name].clone(true);
                let childrenToRemove: THREE.Object3D[] = [];
                clonedObject.traverse((child) => {
                    if (
                        child instanceof CSS2DObject ||
                        child.name == "lockOnCircle"
                    ) {
                        childrenToRemove.push(child);
                    }
                });
                for (const child of childrenToRemove) {
                    if (child.parent) {
                        child.parent.remove(child);
                    }
                }
                switch (data._type) {
                    case "Alien":
                        const alien = clonedObject;
                        setupAlienObject(alien, data);
                        resolve(alien);
                        break;
                    case "Portal":
                        const portal = clonedObject;
                        objectCache[data.name] = portal;
                        setupPortalObject(portal, data);
                        resolve(portal);
                        break;
                    default:
                        console.log("Unknown data", data);
                        return;
                }
                resolve(clonedObject);
                return;
            }

            const loader = new GLTFLoader();
            objectDataMap[data.uuid] = { data: null };

            let modelUrl = "";
            switch (data._type) {
                case "Alien":
                    modelUrl = `./assets/models/aliens/${data.name}/${data.name}.glb`;
                    loader.load(modelUrl, async (glb) => {
                        const model = glb.scene;
                        objectCache[data.name] = model;
                        setupAlienObject(model, data);
                        resolve(model);
                    });
                    break;
                case "Portal":
                    modelUrl = "./assets/models/portals/portal.glb";
                    loader.load(modelUrl, async (glb) => {
                        const model = glb.scene;
                        objectCache[data.name] = model;
                        setupPortalObject(model, data);
                        resolve(model);
                    });
                    break;
                case "LaserProjectile":
                    const lineMaterial = new THREE.LineBasicMaterial({
                        color: data.color,
                        linewidth: 4,
                    });
                    const lineGeometry =
                        new THREE.BufferGeometry().setFromPoints([
                            new THREE.Vector3(0, 0, 0),
                            new THREE.Vector3(0, 0, 1),
                        ]);
                    const line = new THREE.Line(lineGeometry, lineMaterial);
                    line.uuid = data.uuid;
                    line.name = data.name;
                    line.position.set(data.position.x, 0, data.position.y);
                    line.lookAt(
                        data.targetPosition.x,
                        0,
                        data.targetPosition.y
                    );
                    scene.add(line);
                    objectDataMap[data.uuid] = { data: line };

                    const pointLight = new THREE.PointLight(
                        data.color,
                        0.5,
                        10
                    );
                    pointLight.position.set(0, 0, 0);

                    line.add(pointLight);

                    if (currentSounds <= maxConcurrentSounds) {
                        currentSounds++;
                        const sound = new THREE.PositionalAudio(audioListener);
                        sound.setBuffer(laserShootSoundBuffer);
                        sound.setRefDistance(20);
                        sound.setVolume(0.3);
                        sound.onEnded = () => {
                            currentSounds--;
                        };
                        line.add(sound);
                        sound.play();
                    }
                    break;
                case "RocketProjectile":
                    const rocketMaterial = new THREE.LineBasicMaterial({
                        color: "red",
                        linewidth: 16,
                    });
                    const rocketGeometry =
                        new THREE.BufferGeometry().setFromPoints([
                            new THREE.Vector3(0, 0, 0),
                            new THREE.Vector3(0, 0, 0.5),
                        ]);
                    const rocket = new THREE.Line(
                        rocketGeometry,
                        rocketMaterial
                    );
                    rocket.uuid = data.uuid;
                    rocket.name = data.name;
                    rocket.position.set(data.position.x, 0, data.position.y);
                    rocket.lookAt(
                        data.targetPosition.x,
                        0,
                        data.targetPosition.y
                    );
                    scene.add(rocket);
                    objectDataMap[data.uuid] = { data: rocket };

                    const rocketSound = new THREE.PositionalAudio(
                        audioListener
                    );

                    if (currentSounds <= maxConcurrentSounds) {
                        currentSounds++;
                        rocketSound.setBuffer(rocketShootSoundBuffer);
                        rocketSound.setRefDistance(20);
                        rocketSound.setVolume(0.15);
                        rocketSound.onEnded = function () {
                            currentSounds--;
                        };
                        rocket.add(rocketSound);
                        rocketSound.play();
                    }

                    break;
                case "CargoDrop":
                    const cargoDropGeometry = new THREE.BoxGeometry(
                        0.25,
                        0.25,
                        0.25
                    );
                    const cargoDropMaterial = new THREE.MeshStandardMaterial({
                        color: 0xffff00,
                    });
                    const cargoDrop = new THREE.Mesh(
                        cargoDropGeometry,
                        cargoDropMaterial
                    );
                    cargoDrop.uuid = data.uuid;
                    cargoDrop.position.set(
                        data.position.x,
                        -1,
                        data.position.y
                    );
                    objectDataMap[data.uuid] = { data: cargoDrop };
                    cargoDrop.layers.enable(rayCastLayerNo);
                    setNameRecursively(cargoDrop, "CargoDrop", data.uuid);
                    scene.add(cargoDrop);
                    resolve(cargoDrop);
                    break;
                case "Portal":
                    modelUrl = "./assets/models/portals/portal.glb";
                    loader.load(modelUrl, async (glb) => {
                        const model = glb.scene;
                        // Save to cache for later use
                        objectCache["Portal"] = model;
                        // Perform setup steps for Portal
                        setupPortalObject(model, data);
                        resolve(model);
                    });
                    break;
                case "CompanyBase":
                    loader.load(
                        `./assets/models/base/base.glb`,
                        async (glb) => {
                            const model = glb.scene;
                            model.uuid = data.uuid;
                            model.position.set(
                                data.position.x,
                                0,
                                data.position.y
                            );
                            model.add(createSafeZoneRing(10));
                            setNameRecursively(model, data.name, data.uuid);
                            scene.add(model);
                            model.lookAt(new THREE.Vector3(0, 0, 0));
                            objectDataMap[data.uuid] = { data: model };
                            resolve(model);
                        }
                    );
                    break;
                default:
                    const defaultObject = createDefaultObject(data);
                    resolve(defaultObject);
                    break;
            }
        }
    });
}

async function updateObject(object: THREE.Object3D, entity: any) {
    const { position, targetUUID } = entity;
    const { x: posX, y: posY } = position;
    const targetDirection = new THREE.Vector3(posX, 0, posY);

    const reusedVector = new THREE.Vector3();
    const reusedQuaternion = new THREE.Quaternion();

    function _tween(object: any, targetPos: THREE.Vector3) {
        const originalPosition = object.position.clone();
        const deltaVector = new THREE.Vector3();
        const lookAtDirection = new THREE.Vector3();
        const targetObject = getObjectByUUID(targetUUID);

        const isPlayer = object.name === playerName;

        const positionTween = new TWEEN.Tween(object.position)
            .to(
                {
                    x: targetPos.x,
                    y: 0,
                    z: targetPos.z,
                },
                frameTime
            )
            .easing(TWEEN.Easing.Linear.None)
            .onUpdate(function () {
                deltaVector.copy(object.position).sub(originalPosition);
                lookAtDirection.copy(originalPosition).add(deltaVector);

                if (targetObject) {
                    object.lookAt(targetObject.position);
                } else if (
                    deltaVector.x * deltaVector.x +
                        deltaVector.z * deltaVector.z >
                    0.001
                ) {
                    const lookTarget = lookAtDirection.add(deltaVector);
                    reusedQuaternion.setFromRotationMatrix(
                        new THREE.Matrix4().lookAt(
                            object.position,
                            lookTarget,
                            object.up
                        )
                    );
                    const axisQuaternion =
                        new THREE.Quaternion().setFromAxisAngle(
                            new THREE.Vector3(0, 1, 0),
                            Math.PI
                        );
                    reusedQuaternion.multiply(axisQuaternion);
                    object.quaternion.slerp(reusedQuaternion, 0.35);
                }

                if (isPlayer) {
                    if (isFirstUpdateForPlayer) {
                        lastEntityPosition.copy(targetDirection);
                        camera.position.set(posX, camera.position.y, posY);
                        controls.target.copy(targetDirection);
                        object.add(audioListener);
                        isFirstUpdateForPlayer = false;
                    } else if (lastEntityPosition) {
                        lastEntityPosition.add(deltaVector);
                        object.position.copy(lastEntityPosition);
                        camera.position.add(deltaVector);
                        controls.target.add(deltaVector);
                        originalPosition.copy(lastEntityPosition);
                    }
                    controls.update();
                }
            });

        positionTween.start();
    }
    if (entity.hitPoints) {
        const { hullPoints, shieldPoints } = entity.hitPoints;
        const dhp = (object as any).hitPoints.hullPoints - hullPoints;
        const dsp = (object as any).hitPoints.shieldPoints - shieldPoints;

        if (dhp + dsp > 0) {
            const text = document.createElement("div");
            text.className = "damageIndicator";
            text.style.color = "rgb(255,0,0)";
            text.style.fontSize = "12";
            text.textContent = `-${await beautifyNumberToUser(
                Math.round(dhp + dsp)
            )}`;

            const damageLabel = new CSS2DObject(text);
            damageLabel.position.copy(object.position);
            damageIndicators.push(damageLabel);
            scene.add(damageLabel);

            setTimeout(() => {
                scene.remove(damageLabel);
                if (entityLabelsDiv) {
                    const child = Array.from(entityLabelsDiv.children).find(
                        (child) => child.textContent === text.textContent
                    );
                    if (child) {
                        entityLabelsDiv.removeChild(child);
                    }
                }
                const index = damageIndicators.indexOf(damageLabel);
                if (index !== -1) {
                    damageIndicators.splice(index, 1);
                }
            }, 1000);
        }
        if (dhp !== 0 || dsp !== 0) {
            if (entityLabelsDiv) {
                const label = Array.from(entityLabelsDiv.children).find(
                    (child) => child.getAttribute("uuid") === object.uuid
                );
                if (label) {
                    const hpBar = label.children[1].children[0] as HTMLElement;
                    const spBar = label.children[1].children[1] as HTMLElement;
                    const maxHp = entity.maxHealth || 100;
                    const maxSp = entity.maxShields || 100;
                    hpBar.style.width = `${(hullPoints / maxHp) * 100}%`;
                    spBar.style.width = `${(shieldPoints / maxSp) * 100}%`;
                }
            }
        }
    }

    (object as any).hitPoints = entity.hitPoints;
    if ((object as any).hitPoints && (object as any).hitPoints.hullPoints < 0) {
        createAndTriggerExplosion(object);
        deleteObject(object.uuid);
        return;
    }

    if (
        entity._type &&
        (entity._type === "Alien" || entity._type === "Player")
    ) {
        if ((object as any).activeShipName) {
            if ((object as any).activeShipName !== entity.activeShipName) {
                deleteObject(object.uuid);
                return;
            }
        } else {
            (object as any).activeShipName = entity.activeShipName;
            // console.log(activeShipName);
        }
    }

    if (entity.name !== "CargoDrop") {
        _tween(object, targetDirection);
    }
}

async function deleteObject(uuid: string) {
    const object = getObjectByUUID(uuid);
    if (!object) {
        console.warn(
            `WARNING: Tried to delete object but could not find it: ${uuid}`
        );
        // console.log(objectDataMap);
        return;
    }

    const label = getLabelByUUID(uuid);
    if (label) {
        labelRenderer.domElement.removeChild(label.element);
        delete labelMap[uuid];
    }

    const entityLabelsDiv = document.getElementById("entityLabelsDiv");
    if (entityLabelsDiv) {
        entityLabelsDiv.innerHTML = ""; // Clear all child elements
    } else {
        console.log("The element with id 'entityLabelsDiv' was not found.");
    }

    if (
        object.name === "laserProjectile" &&
        currentSounds <= maxConcurrentSounds
    ) {
        currentSounds++;
        const sound = new THREE.PositionalAudio(audioListener);
        sound.setRefDistance(20);
        sound.setBuffer(laserHitSoundBuffer);
        sound.setVolume(0.7);
        scene.add(sound);
        sound.position.copy(object.position);
        sound.onEnded = function () {
            currentSounds--;
            scene.remove(sound);
        };
        sound.play();
    } else if (object.name === "rocketProjectile") {
        if (currentSounds <= maxConcurrentSounds) {
            currentSounds++;
            const sound = new THREE.PositionalAudio(audioListener);
            sound.position.copy(object.position);
            sound.setRefDistance(20);
            sound.setBuffer(rocketHitSoundBuffer);
            sound.setVolume(0.1);
            scene.add(sound);
            sound.position.copy(object.position);
            sound.onEnded = function () {
                currentSounds--;
                scene.remove(sound);
            };
            sound.play();
        }
    }

    delete objectDataMap[uuid];
    scene.remove(object);

    // console.log(`Deleted object with uuid: ${uuid}`);
}

async function updateObjects(_data: any[]) {
    const existingUUIDs = new Set<string>();
    const updatePromises: Promise<any>[] = [];

    for (const entity of _data) {
        if (entity.name === playerName) {
            updatePromises.push(updatePlayerInfo(entity));
        }

        if (objectDataMap[entity.uuid]) {
            const object = getObjectByUUID(entity.uuid);
            if (object) {
                updatePromises.push(updateObject(object, entity));
            }
        } else {
            updatePromises.push(createObject(entity));
        }

        existingUUIDs.add(entity.uuid);
    }

    await Promise.all(updatePromises);

    const deleteUUIDs = new Set(Object.keys(objectDataMap));
    for (const existingUUID of existingUUIDs) {
        deleteUUIDs.delete(existingUUID);
    }

    const deletePromises = Array.from(deleteUUIDs).map((uuid) =>
        deleteObject(uuid)
    );

    await Promise.all(deletePromises);
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

        // Directly update the UI if playerInventory was undefined
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
            playerInventory = entity.inventory; // Update playerInventory after the check

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

function getObjectByUUID(uuid: string) {
    if (objectDataMap[uuid]) {
        return objectDataMap[uuid].data || null;
    }
    return null;
}

async function createStars() {
    const vertices = [];

    for (let i = 0; i < 4096; i++) {
        const x = (Math.random() - 0.5) * 180;
        const y = (Math.random() - 0.8) * 60;
        const z = (Math.random() - 0.5) * 180;

        vertices.push(x, y, z);
    }

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(vertices, 3)
    );

    const material = new THREE.PointsMaterial({ color: 0x888888, size: 0.08 });

    const points = new THREE.Points(geometry, material);

    (points as any).uuid = Math.random();
    points.name = "stars";

    scene.add(points);
    points.layers.enable(0);
}

function getLabelByUUID(uuid: string): CSS2DObject | undefined {
    return scene.children.find(
        (child) => child instanceof CSS2DObject && child.uuid === uuid
    ) as CSS2DObject | undefined;
}

function setNameRecursively(
    object: THREE.Object3D,
    name: string,
    uuid: string,
    layerNo?: number
) {
    object.name = name;
    object.uuid = uuid;

    if (layerNo) {
        object.layers.enable(layerNo);
    }

    object.children.forEach((child) => {
        setNameRecursively(child, name, uuid, layerNo);
    });
}

async function loadEventListeners() {
    canvas?.addEventListener(
        "mouseup",
        function (event) {
            if (event.button === 0) {
                // Check if the left mouse button (button 0) was released
                raycastFromCamera(event);
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
            recreateRenderer(true);
        } else {
            recreateRenderer(false);
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

    if (volumeLevelInput) {
        volumeLevelInput.addEventListener("change", () => {
            mainThemeMusic.setVolume(parseInt(volumeLevelInput.value) / 100);
        });
    }

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

async function createAndTriggerExplosion(object: THREE.Object3D) {
    const particleGeometry = new THREE.SphereGeometry(0.02, 16, 16);
    const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    const _particles: any = [];

    for (let i = 0; i < 100; i++) {
        const particle = new THREE.Mesh(
            particleGeometry,
            particleMaterial
        ) as any;
        const randomDirection = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
        ).normalize();
        particle.position.copy(object.position);
        particle.velocity = randomDirection.multiplyScalar(0.01);
        _particles.push(particle);

        scene.add(particle);
    }

    if (currentSounds <= maxConcurrentSounds) {
        const sound = new THREE.PositionalAudio(audioListener);
        currentSounds++;
        sound.setBuffer(explosionSoundBuffer);
        sound.setVolume(1);
        sound.onEnded = function () {
            currentSounds--;
        };
        scene.add(sound);
        sound.play();
        sound.position.copy(object.position);
        setTimeout(() => {
            scene.remove(sound);
        }, 150);
    }

    particles.push(_particles);

    setTimeout(() => {
        _particles.forEach((particle: any) => scene.remove(particle));

        const index = particles.indexOf(_particles);
        if (index !== -1) {
            particles.splice(index, 1);
        }

        _particles.length = 0;
    }, 500);
}

async function beautifyNumberToUser(number: number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
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

function setupSoundBuffers() {
    const explosionSoundAudioLoader = new THREE.AudioLoader();
    explosionSoundAudioLoader.load(
        "../assets/sounds/explosion.ogg",
        function (buffer) {
            explosionSoundBuffer = buffer;
        }
    );

    const laserShootSoundAudioLoader = new THREE.AudioLoader();
    laserShootSoundAudioLoader.load(
        "../assets/sounds/laser01.ogg",
        function (buffer) {
            laserShootSoundBuffer = buffer;
        }
    );

    const rocketShootSoundLoader = new THREE.AudioLoader();
    rocketShootSoundLoader.load(
        "../assets/sounds/OLDrocketLaunch.ogg",
        function (buffer) {
            rocketShootSoundBuffer = buffer;
        }
    );

    const laserHitSoundAudioLoader = new THREE.AudioLoader();
    laserHitSoundAudioLoader.load(
        "../assets/sounds/laserHit.ogg",
        function (buffer) {
            laserHitSoundBuffer = buffer;
        }
    );

    const rocketHitSoundLoader = new THREE.AudioLoader();
    rocketHitSoundLoader.load(
        "../assets/sounds/OLDrocketHit.ogg",
        function (buffer) {
            rocketHitSoundBuffer = buffer;
        }
    );
}

function recreateRenderer(antialias: boolean) {
    const container = document.getElementById("spacemapDiv");
    if (!container) return;
    const existingRendererElement = container.querySelector("#THREEJSScene");
    if (existingRendererElement) {
        container.removeChild(existingRendererElement);
    }
    renderer = new THREE.WebGLRenderer({ antialias: antialias });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.id = "THREEJSScene";
    if (container.firstChild) {
        container.insertBefore(renderer.domElement, container.firstChild);
    } else {
        container.appendChild(renderer.domElement);
    }
    controls = new OrbitControls(camera, renderer.domElement);
    isFirstUpdateForPlayer = true;
    renderer.domElement.addEventListener("click", (event) => {
        raycastFromCamera(event);
    });

    updateControlsSettings();
}

function updateControlsSettings() {
    controls.minDistance = 2;
    controls.maxDistance = 12;
    controls.minPolarAngle = 0.3490658504;
    controls.maxPolarAngle = 1.0471975512;
    controls.enablePan = false;
    controls.mouseButtons = {
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE,
    };
    controls.update();
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

function createSafeZoneRing(
    radius: number,
    lineWidth: number = 0.05,
    segments: number = 64
) {
    let safeZoneGeometry = new THREE.RingGeometry(
        radius - lineWidth,
        radius,
        segments
    );
    let safeZoneMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
    });
    let safeZoneCircle = new THREE.Mesh(safeZoneGeometry, safeZoneMaterial);
    safeZoneCircle.rotation.x = 1.57079633;
    safeZoneCircle.position.set(0, 0.01, 0);
    safeZoneCircle.name = "portalSafeZone";
    return safeZoneCircle;
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
