// @ts-ignore
export const socket = io("http://localhost:3000");

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import {
    CSS2DRenderer,
    CSS2DObject,
    // @ts-ignore
} from "./three/addons/renderers/CSS2DRenderer.js";

let loginDiv = document.getElementById("loginDiv") as HTMLElement;
let spacemapDiv = document.getElementById("spacemapDiv") as HTMLElement;
let contentDiv = document.getElementById("content") as HTMLElement;
let uiDiv = document.querySelector(".ui") as HTMLElement;
let consoleBtn = document.querySelector(".console_button") as HTMLElement;

const creditsElement = document.getElementById("credits_value");
const thuliumElement = document.getElementById("thulium_value");
const experienceElement = document.getElementById("experience_value");
const honorElement = document.getElementById("honor_value");
const notificationContainer = document.getElementById("notification_container");

let shoppingData: any;
let playerInventory: any;

let playerName: string;

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.Renderer;
let currentMap: string;
let controls: OrbitControls;
let canvas: HTMLCanvasElement | null;

let playerObject: THREE.Object3D | undefined = undefined;
let audioListener: THREE.AudioListener;

let labelRenderer: CSS2DRenderer;

let sendChatMessageButton: HTMLElement | null;
let chatModalContent: HTMLElement | null;
let chatModalInput: HTMLInputElement | null;
let sendConsoleMessageButton: HTMLElement | null;
let consoleContent: HTMLElement | null;
let consoleInput: HTMLInputElement | null;
let lockOnCircle: THREE.Object3D | null;

const lerpFactor = 0.2;
const rayCastLayerNo = 1;
const particles: any[] = [];
const damageIndicators: any[] = [];

const objectDataMap: Record<string, { data: any }> = {};
const labelMap: Record<string, CSS2DObject> = {};

const raycaster = new THREE.Raycaster();
raycaster.layers.set(rayCastLayerNo);

socket.on("connect", () => {
    console.log("Connected to the socket.io server");
});

socket.on("userisAdmin", () => {
    consoleBtn.hidden = false;
});

socket.on("loginSuccessful", (data: { username: string }) => {
    console.log(`Successful login as ${data.username}, starting game...`);
    playerName = data.username;
    initScene();
    rescaleOnWindowResize();
    uiDiv.hidden = false;
    socket.emit("checkisAdmin", data.username);
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
    if (data.type == "chat") {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("chat_message");
        messageDiv.textContent = data.message;
        chatModalContent?.appendChild(messageDiv);
    } else if (data.type == "console") {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("console_message");
        messageDiv.textContent = data.message;
        consoleContent?.appendChild(messageDiv);
    }
});

socket.on("mapData", (data: any) => {
    if (currentMap != data.name) {
        loadNewSpacemap(data);
    }
    updateObjects(data.entities.concat(data.projectiles));
    playerObject = scene.getObjectByName(playerName);
});

socket.on(
    "shopData",
    (data: { lasers: any[]; ships: any[]; generators: any[] }) => {
        shoppingData = {
            weapons: data.lasers,
            ships: data.ships,
            generators: data.generators,
        };
        displayShoppingItems();
    }
);

socket.on("emitRewardInfoToUser", async (data: { reward: any }) => {
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
                        const messageContainer = document.createElement("div");
                        messageContainer.classList.add("notification");
                        messageContainer.textContent = `You received 1 ${data.reward[key].name} ${data.reward[key]._type}.`;
                        notificationContainer.appendChild(messageContainer);
                        setTimeout(() => {
                            try {
                                notificationContainer.removeChild(
                                    messageContainer
                                );
                            } catch (err) {}
                        }, 5000);
                    } else {
                        const messageContainer = document.createElement("div");
                        messageContainer.classList.add("notification");
                        messageContainer.textContent = `You received ${await beautifyNumberToUser(
                            data.reward[key]
                        )} ${key}.`;
                        notificationContainer.appendChild(messageContainer);
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
});

async function loadNewSpacemap(data: any) {
    clearScene(scene);
    try {
        currentMap = data.name;
        await Promise.all([
            loadSpacemapPlane(data),
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
        opacity: 0.05,
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
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    renderer = new THREE.WebGLRenderer();

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
    spacemapDiv.appendChild(renderer.domElement);
    spacemapDiv.appendChild(labelRenderer.domElement);

    createStars();

    loadEventListeners();

    // Position the camera
    camera.position.x = 4;
    camera.position.y = 5;
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    // Create an animation function to rotate the cube
    const animate = () => {
        requestAnimationFrame(animate);

        // Render the scene
        controls.update();
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

        damageIndicators.forEach((damageIndicator) => {
            damageIndicator.position.add(new THREE.Vector3(0, 0.01, 0));
        });
    };

    controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.minPolarAngle = 0.3490658504;
    controls.maxPolarAngle = 1.0471975512;
    controls.enablePan = false;
    controls.mouseButtons = {
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE,
    };
    controls.update();

    audioListener = new THREE.AudioListener();
    camera.add(audioListener);

    const sound = new THREE.Audio(audioListener);

    const audioLoader = new THREE.AudioLoader();

    audioLoader.load("./assets/sounds/mainTheme.ogg", function (buffer) {
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(0.15);
        sound.play();
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

        console.log(`Got following intersects: ${JSON.stringify(_names)}`);
        console.log(intersects);

        if (
            intersects.length == 1 &&
            intersects[0].object.name == "movingPlane"
        ) {
            socket.emit("playerMoveToDestination", {
                targetPosition: {
                    x: intersects[0].point.x,
                    y: intersects[0].point.z,
                },
            });
        } else {
            let object = intersects[0].object;
            if (object.name != playerName && lockOnCircle) {
                lockOnCircle?.removeFromParent();
                object.parent?.add(lockOnCircle);
            }
        }
    }
}

function handleKeyboardButton(e: KeyboardEvent) {
    if (playerName) {
        switch (e.key) {
            case "1":
                if (lockOnCircle?.parent != undefined) {
                    socket.emit("shootEvent", {
                        playerName: playerName,
                        targetUUID: lockOnCircle.parent.uuid,
                    });
                }
                break;
            case "Enter":
                if (chatModalDiv.style.display == "block") {
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
                    if (consoleMessageText && consoleInput && consoleContent) {
                        socket.emit("sendConsoleMessageToServer", {
                            username: playerName,
                            message: consoleMessageText,
                        });
                        consoleInput.value = "";
                    }
                }
                break;
            case "j":
                socket.emit("attemptTeleport", {
                    playerName: playerName,
                });
                break;

            case "o":
                console.log(scene);
                break;
        }
    }
}

function createLighting() {
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1); // Adjust the light's position
    scene.add(directionalLight);
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

async function createObject(data: any) {
    return new Promise(async (resolve) => {
        console.log(`Spawning new object: ${data.name}`);
        const loader = new GLTFLoader();
        objectDataMap[data.uuid] = { data: null };
        switch (data._type) {
            case "Alien":
                loader.load(
                    `./assets/models/ships/orion/orion.glb`,
                    async (glb) => {
                        const model = glb.scene;
                        model.uuid = data.uuid;
                        model.position.set(data.position.x, 0, data.position.y);
                        setNameRecursivelly(
                            model,
                            data.name,
                            data.uuid,
                            rayCastLayerNo
                        );
                        const text = document.createElement("div");
                        text.className = "nicknameLabel";
                        text.style.color = "rgb(255,255,255)";
                        text.style.fontSize = "12";
                        // text.textContent = `${data.name}\nHP: ${data.health}`;
                        text.textContent = `${data.name}`;
                        const label = new CSS2DObject(text);
                        labelMap[data.uuid] = label;
                        label.position.y = -0.75;
                        (model as any).hitPoints = data.hitPoints;
                        model.add(label);
                        scene.add(model);
                        objectDataMap[data.uuid] = { data: model };
                        resolve(model);
                    }
                );
                break;
            case "Player":
                loader.load(
                    `./assets/models/ships/ship008/Hercules.glb`,
                    async (glb) => {
                        const model = glb.scene;
                        model.uuid = data.uuid;
                        model.position.set(data.position.x, 0, data.position.y);
                        setNameRecursivelly(
                            model,
                            data.name,
                            data.uuid,
                            rayCastLayerNo
                        );
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
                        resolve(model);
                    }
                );
                break;
            case "Portal":
                loader.load(
                    `./assets/models/portals/portal.glb`,
                    async (glb) => {
                        const model = glb.scene;
                        model.uuid = data.uuid;
                        model.position.set(data.position.x, 0, data.position.y);
                        setNameRecursivelly(model, data.name, data.uuid);
                        scene.add(model);
                        model.lookAt(new THREE.Vector3(0, 0, 0));
                        objectDataMap[data.uuid] = { data: model };
                        resolve(model);
                    }
                );
                break;
            case "LaserProjectile":
                const lineMaterial = new THREE.LineBasicMaterial({
                    color: "green",
                    linewidth: 4,
                });
                const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(0, 0, 0),
                    new THREE.Vector3(0, 0, 1),
                ]);
                const line = new THREE.Line(lineGeometry, lineMaterial);
                line.uuid = data.uuid;
                line.name = data.name;
                line.position.set(data.position.x, 0, data.position.y);
                line.lookAt(data.targetPosition.x, 0, data.targetPosition.y);
                scene.add(line);
                objectDataMap[data.uuid] = { data: line };

                const sound = new THREE.PositionalAudio(audioListener);

                const audioLoader = new THREE.AudioLoader();

                let ref = "../assets/sounds/laser01.ogg";

                // ref = "../assets/sounds/laser02.ogg"
                audioLoader.load(ref, function (buffer) {
                    sound.setBuffer(buffer);
                    sound.setRefDistance(20);
                    sound.play();
                });

                break;
            default:
                console.log(data._type);
                const geometry = new THREE.BoxGeometry();
                const material = new THREE.MeshBasicMaterial({
                    color: 0x00ff00,
                });
                const cube = new THREE.Mesh(geometry, material);
                cube.uuid = data.uuid;
                cube.position.set(data.position.x, 0, data.position.y);
                cube.name = data.name;
                objectDataMap[data.uuid] = { data: cube };
                scene.add(cube);
                resolve(cube);
                break;
        }
    });
}

async function updateObject(object: THREE.Object3D, entity: any) {
    const target = new THREE.Vector3(entity.position.x, 0, entity.position.y);
    object.lookAt(target);

    if (object.name == playerName) {
        const dx = entity.position.x - object.position.x;
        const dz = entity.position.y - object.position.z;

        camera.position.lerp(
            new THREE.Vector3(
                camera.position.x + dx,
                camera.position.y,
                camera.position.z + dz
            ),
            0.01
        );
        controls.target.lerp(
            new THREE.Vector3(entity.position.x, 0, entity.position.y),
            0.1
        );
        controls.update();
    }

    if ((object as any).hitPoints) {
        const dhp =
            (object as any).hitPoints.hullPoints - entity.hitPoints.hullPoints;
        const dsp =
            (object as any).hitPoints.shieldPoints -
            entity.hitPoints.shieldPoints;

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

                const entityLabelsDiv =
                    document.getElementById("entityLabelsDiv");
                if (entityLabelsDiv) {
                    for (let i = 0; i < entityLabelsDiv.children.length; i++) {
                        const child = entityLabelsDiv.children[i];
                        if (child.textContent === text.textContent) {
                            entityLabelsDiv.removeChild(child);
                            break;
                        }
                    }
                }
                const index = damageIndicators.indexOf(damageLabel);
                if (index !== -1) {
                    damageIndicators.splice(index, 1);
                }
            }, 1000);
        }
    }

    (object as any).hitPoints = entity.hitPoints;

    object.position.lerp(target, lerpFactor);
}

async function deleteObject(uuid: string) {
    const object = getObjectByUUID(uuid);
    if (object) {
        const label = getLabelByUUID(uuid);

        if (label) {
            labelRenderer.domElement.removeChild(label.element);
            delete labelMap[uuid];
        }

        const entityLabelsDiv = document.getElementById("entityLabelsDiv");

        if (entityLabelsDiv) {
            while (entityLabelsDiv.firstChild) {
                entityLabelsDiv.removeChild(entityLabelsDiv.firstChild);
            }
        } else {
            console.log("The element with id 'entityLabelsDiv' was not found.");
        }

        if (object.name != "laserProjectile") {
            createAndTriggerExplosion(object.position);
        }

        delete objectDataMap[uuid];
        scene.remove(object);

        console.log(`Deleted object with uuid: ${uuid}`);
    } else {
        console.log(
            `WARNING: tried to delete object but could not find it: ${uuid}`
        );
        console.log(objectDataMap);
    }
}

async function updateObjects(_data: any[]) {
    let existingUUIDs: string[] = [];

    await Promise.all(
        _data.map(async (entity) => {
            if (entity.name == playerName) {
                updatePlayerInfo(entity);
            }
            if (objectDataMap.hasOwnProperty(entity.uuid)) {
                const object = getObjectByUUID(entity.uuid);
                if (object) {
                    updateObject(object, entity);
                } else {
                    // FIXME: better asyncronous code: we are actually getting errors here
                    // console.log(
                    //     `WARNING: Could not find object for uuid: ${entity.uuid}`
                    // );
                }
            } else {
                createObject(entity);
            }
            existingUUIDs.push(entity.uuid);
        })
    );

    await Promise.all(
        Object.keys(objectDataMap)
            .filter((uuid) => !existingUUIDs.includes(uuid))
            .map((uuid) => deleteObject(uuid))
    );
}

async function updatePlayerInfo(entity: any) {
    if (creditsElement && thuliumElement && experienceElement && honorElement) {
        const [credits, thulium, experience, honor] = await Promise.all([
            beautifyNumberToUser(entity.stats.credits),
            beautifyNumberToUser(entity.stats.thulium),
            beautifyNumberToUser(entity.stats.experience),
            beautifyNumberToUser(entity.stats.honor),
        ]);

        creditsElement.textContent = credits;
        thuliumElement.textContent = thulium;
        experienceElement.textContent = experience;
        honorElement.textContent = honor;
    }
    if (JSON.stringify(playerInventory) != JSON.stringify(entity.inventory)) {
        playerInventory = entity.inventory;
        displayShipsInHangar();
        displayItemsInWorkroom();
        displayActiveItems();
    }
}

function getObjectByUUID(uuid: string) {
    const objects = scene.children;

    for (let i = 0, l = objects.length; i < l; i++) {
        const object = objects[i];

        if (object.uuid === uuid) {
            return object;
        }
    }

    return null;
}

async function createStars() {
    const vertices: any = [];

    for (let i = 0; i < 4096; i++) {
        const x = (Math.random() - 0.5) * 180;
        const y = (Math.random() - 0.8) * 60;
        const z = (Math.random() - 0.5) * 180;
    }

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(vertices, 3)
    );

    const material = new THREE.PointsMaterial({ color: 0x888888, size: 0.08 });

    const points = new THREE.Points(geometry, material) as any;

    points.uuid = Math.random();

    scene.add(points);
    points.layers.enable(0);
}

function getLabelByUUID(uuid: string): CSS2DObject | undefined {
    const labels = scene.children.filter(
        (child) => child instanceof CSS2DObject
    ) as CSS2DObject[];
    return labels.find((label) => label.uuid === uuid);
}

function setNameRecursivelly(
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

    for (let i = 0; i < object.children.length; i++) {
        if (layerNo) {
            setNameRecursivelly(object.children[i], name, uuid, layerNo);
        } else {
            setNameRecursivelly(object.children[i], name, uuid);
        }
    }
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
}

async function displayShoppingItems() {
    for (const category in shoppingData) {
        if (shoppingData.hasOwnProperty(category)) {
            const categoryItems = shoppingData[category];

            const categoryContainer = document.getElementById(
                `shopping_${category}`
            );

            if (!categoryContainer) {
                console.error(`Category container not found for '${category}'`);
                continue;
            }

            while (categoryContainer?.firstChild) {
                categoryContainer.removeChild(categoryContainer.firstChild);
            }

            for (const itemName in categoryItems) {
                if (categoryItems.hasOwnProperty(itemName)) {
                    const item = categoryItems[itemName];
                    const itemContainer = document.createElement("div");
                    itemContainer.classList.add("shop_item");

                    // Create an element for the item name
                    const itemNameElement = document.createElement("div");
                    itemNameElement.classList.add("item_name");
                    itemNameElement.textContent = itemName;

                    const itemIcon = document.createElement("div");
                    itemIcon.classList.add("item_icon");
                    const itemPrice = document.createElement("div");
                    itemPrice.classList.add("item_price");
                    itemPrice.textContent = `Price: ${await beautifyNumberToUser(
                        item.price.credits
                    )} credits`;
                    const buyButton = document.createElement("button");
                    buyButton.classList.add("buy_button");
                    buyButton.textContent = "BUY";

                    // Append the item name element before the item icon
                    itemContainer.appendChild(itemNameElement);
                    itemContainer.appendChild(itemIcon);
                    itemContainer.appendChild(itemPrice);
                    itemContainer.appendChild(buyButton);
                    categoryContainer.appendChild(itemContainer);

                    buyButton.addEventListener("click", () => {
                        console.log(
                            `You clicked BUY for ${category} - ${itemName}`
                        );
                        socket.emit(`playerPurchaseEvent`, {
                            playerName: playerName,
                            itemName: itemName,
                        });
                    });
                }
            }
        }
    }
}

async function displayShipsInHangar() {
    const categoryContainer = document.getElementById("hangar_storage");
    while (categoryContainer?.firstChild) {
        categoryContainer.removeChild(categoryContainer.firstChild);
    }

    if (categoryContainer) {
        for (const _ship in playerInventory.ships) {
            const ship = playerInventory.ships[_ship];
            const hangarItemContainer = document.createElement("div");
            hangarItemContainer.classList.add("hangar_item");

            const shipNameElement = document.createElement("div");
            shipNameElement.classList.add("item_name");
            shipNameElement.textContent = ship.name;

            const shipIcon = document.createElement("div");
            shipIcon.classList.add("item_icon");
            const equipButton = document.createElement("button");
            equipButton.classList.add("profile_btn");
            equipButton.classList.add("profile_equip_btn");
            equipButton.textContent = "EQUIP";

            hangarItemContainer.appendChild(shipNameElement);
            hangarItemContainer.appendChild(shipIcon);
            hangarItemContainer.appendChild(equipButton);

            categoryContainer.appendChild(hangarItemContainer);

            equipButton.addEventListener("click", () => {
                console.log(`You clicked equip button for ship ${ship.name}`);
            });
        }
    }
}

async function displayItemsInWorkroom() {
    const categoryContainer = document.getElementById("workroom_storage");
    while (categoryContainer?.firstChild) {
        categoryContainer.removeChild(categoryContainer.firstChild);
    }
    console.log(playerInventory);
    if (categoryContainer) {
        for (const _laser in playerInventory.lasers) {
            const laser = playerInventory.lasers[_laser];
            const workroomItemContainer = document.createElement("div");
            workroomItemContainer.classList.add("workroom_item");

            const itemNameElement = document.createElement("div");
            itemNameElement.classList.add("item_name");
            itemNameElement.textContent = laser.name;

            const itemIcon = document.createElement("div");
            itemIcon.classList.add("item_icon");

            const equipButton = document.createElement("button");
            equipButton.classList.add("profile_btn");
            equipButton.classList.add("profile_equip_btn");
            equipButton.textContent = "EQUIP";

            workroomItemContainer.appendChild(itemNameElement);
            workroomItemContainer.appendChild(itemIcon);
            workroomItemContainer.appendChild(equipButton);

            categoryContainer.appendChild(workroomItemContainer);

            equipButton.addEventListener("click", () => {
                console.log(`Tried to equip item: ${laser.name}`);
                socket.emit(`equipItemEvent`, {
                    playerName: playerName,
                    itemName: laser.name,
                });
            });
        }
        for (const _shieldGenerator in playerInventory.shieldGenerators) {
            const shieldGenerator =
                playerInventory.shieldGenerators[_shieldGenerator];
            const workroomItemContainer = document.createElement("div");
            workroomItemContainer.classList.add("workroom_item");

            const itemNameElement = document.createElement("div");
            itemNameElement.classList.add("item_name");
            itemNameElement.textContent = shieldGenerator.name;

            const itemIcon = document.createElement("div");
            itemIcon.classList.add("item_icon");

            const equipButton = document.createElement("button");
            equipButton.classList.add("profile_btn");
            equipButton.classList.add("profile_equip_btn");
            equipButton.textContent = "EQUIP";

            workroomItemContainer.appendChild(itemNameElement);
            workroomItemContainer.appendChild(itemIcon);
            workroomItemContainer.appendChild(equipButton);

            categoryContainer.appendChild(workroomItemContainer);

            equipButton.addEventListener("click", () => {
                console.log(`Tried to equip item: ${shieldGenerator.name}`);
                socket.emit(`equipItemEvent`, {
                    playerName: playerName,
                    itemName: shieldGenerator.name,
                });
            });
        }

        for (const _speedGenerator in playerInventory.speedGenerators) {
            const speedGenerator =
                playerInventory.speedGenerators[_speedGenerator];
            const workroomItemContainer = document.createElement("div");
            workroomItemContainer.classList.add("workroom_item");

            const itemNameElement = document.createElement("div");
            itemNameElement.classList.add("item_name");
            itemNameElement.textContent = speedGenerator.name;

            const itemIcon = document.createElement("div");
            itemIcon.classList.add("item_icon");

            const equipButton = document.createElement("button");
            equipButton.classList.add("profile_btn");
            equipButton.classList.add("profile_equip_btn");
            equipButton.textContent = "EQUIP";

            workroomItemContainer.appendChild(itemNameElement);
            workroomItemContainer.appendChild(itemIcon);
            workroomItemContainer.appendChild(equipButton);

            categoryContainer.appendChild(workroomItemContainer);

            equipButton.addEventListener("click", () => {
                console.log(`Tried to equip item: ${speedGenerator.name}`);
                socket.emit(`equipItemEvent`, {
                    playerName: playerName,
                    itemName: speedGenerator.name,
                });
            });
        }
    }
}

async function displayActiveItems() {
    for (const ship in playerInventory.ships) {
        if (playerInventory.ships[ship].isActive) {
            const categoryContainer1 = document.getElementById(
                "workroom_active_lasers"
            );
            const categoryContainer2 = document.getElementById(
                "workroom_active_generators"
            );
            const categoryContainer3 = document.getElementById(
                "workroom_active_extras"
            );

            while (categoryContainer1?.firstChild) {
                categoryContainer1.removeChild(categoryContainer1.firstChild);
            }
            while (categoryContainer2?.firstChild) {
                categoryContainer2.removeChild(categoryContainer2.firstChild);
            }
            while (categoryContainer3?.firstChild) {
                categoryContainer3.removeChild(categoryContainer3.firstChild);
            }
            if (categoryContainer1) {
                for (const _laser in playerInventory.ships[ship]
                    .currentLasers) {
                    const laser =
                        playerInventory.ships[ship].currentLasers[_laser];
                    const workroomItemContainer = document.createElement("div");
                    workroomItemContainer.classList.add("workroom_item");

                    const itemNameElement = document.createElement("div");
                    itemNameElement.classList.add("item_name");
                    itemNameElement.textContent = laser.name;

                    const itemIcon = document.createElement("div");
                    itemIcon.classList.add("item_icon");

                    const unequipButton = document.createElement("button");
                    unequipButton.classList.add("profile_btn");
                    unequipButton.classList.add("profile_equip_btn");
                    unequipButton.textContent = "UNEQUIP";

                    workroomItemContainer.appendChild(itemNameElement);
                    workroomItemContainer.appendChild(itemIcon);
                    workroomItemContainer.appendChild(unequipButton);

                    categoryContainer1.appendChild(workroomItemContainer);

                    unequipButton.addEventListener("click", () => {
                        console.log(`Tried to unequip item: ${laser.name}`);
                        socket.emit(`unequipItemEvent`, {
                            playerName: playerName,
                            itemName: laser.name,
                        });
                    });
                }
            }
            if (categoryContainer2) {
                for (const _shieldGenerator in playerInventory.ships[ship]
                    .currentGenerators) {
                    const shieldGenerator =
                        playerInventory.ships[ship].currentGenerators[
                            _shieldGenerator
                        ];
                    const workroomItemContainer = document.createElement("div");
                    workroomItemContainer.classList.add("workroom_item");

                    const itemNameElement = document.createElement("div");
                    itemNameElement.classList.add("item_name");
                    itemNameElement.textContent = shieldGenerator.name;

                    const itemIcon = document.createElement("div");
                    itemIcon.classList.add("item_icon");

                    const unequipButton = document.createElement("button");
                    unequipButton.classList.add("profile_btn");
                    unequipButton.classList.add("profile_equip_btn");
                    unequipButton.textContent = "UNEQUIP";

                    workroomItemContainer.appendChild(itemNameElement);
                    workroomItemContainer.appendChild(itemIcon);
                    workroomItemContainer.appendChild(unequipButton);

                    categoryContainer2.appendChild(workroomItemContainer);

                    unequipButton.addEventListener("click", () => {
                        console.log(
                            `Tried to unequip item: ${shieldGenerator.name}`
                        );
                        socket.emit(`unequipItemEvent`, {
                            playerName: playerName,
                            itemName: shieldGenerator.name,
                        });
                    });
                }
            }
            if (categoryContainer3) {
                // TODO: Complete logic here later when extras are done
            }
        }
    }
}

async function createAndTriggerExplosion(position: THREE.Vector3) {
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
        particle.position.copy(position);
        particle.velocity = randomDirection.multiplyScalar(0.01);
        _particles.push(particle);

        const sound = new THREE.PositionalAudio(audioListener);

        const audioLoader = new THREE.AudioLoader();

        let ref = "../assets/sounds/explosion.ogg";

        audioLoader.load(ref, function (buffer) {
            sound.setBuffer(buffer);
            sound.setRefDistance(30);
            sound.play();
        });

        scene.add(particle);
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
