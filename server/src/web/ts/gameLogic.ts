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

const lerpFactor = 0.2;

const objectDataMap: Record<string, { data: any }> = {};
const labelMap: Record<string, CSS2DObject> = {};

const raycaster = new THREE.Raycaster();

socket.on("connect", () => {
    console.log("Connected to the socket.io server");
});

socket.on("loginSuccessful", (data: { username: string }) => {
    console.log(`Successful login as ${data.username}, starting game...`);
    playerName = data.username;
    initScene();
    rescaleOnWindowResize();
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
        const messageDiv = document.createElement('div')
        messageDiv.textContent = data.message
        chatModalContent?.appendChild(messageDiv);
    } else if (data.type == "console") {
        const messageDiv = document.createElement('div')
        messageDiv.textContent = data.message;
        consoleContent?.appendChild(messageDiv)
    }
});

socket.on("mapData", (data: any) => {
    if (currentMap != data.name) {
        loadNewSpacemap(data);
    }

    updateObjects(data.entities);
    playerObject = scene.getObjectByName(playerName);
});

async function loadNewSpacemap(data: any) {
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
    scene.add(plane);
}

async function loadStaticEntities(data: any) {
    return;
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
        sound.setVolume(0.25);
        sound.play();
    });
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
                        model.name = data.name;

                        const text = document.createElement("div");
                        text.className = "label";
                        text.style.color = "rgb(255,255,255)";
                        text.style.fontSize = "12";
                        // text.textContent = `${data.name}\nHP: ${data.health}`;
                        text.textContent = `${data.name}`;
                        const label = new CSS2DObject(text);
                        labelMap[data.uuid] = label;
                        label.position.y = -0.75;
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
                        model.name = data.name;
                        if (data.name == playerName) {
                            controls.update();
                        }

                        const text = document.createElement("div");
                        text.className = "label";
                        text.style.color = "rgb(255,255,255)";
                        text.style.fontSize = "12";
                        text.textContent = `${data.name}`;
                        const label = new CSS2DObject(text);
                        labelMap[data.uuid] = label;
                        label.position.y = -0.75;
                        label.uuid = data.uuid;
                        model.add(label);
                        scene.add(model);
                        objectDataMap[data.uuid] = { data: model };
                        resolve(model);
                    }
                );
                break;
            default:
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

        scene.remove(object);
        delete objectDataMap[uuid];
        console.log(`Deleted object with uuid: ${uuid}`);
    } else {
        console.log(
            `WARNING: tried to delete object but could not find it: ${uuid}`
        );
    }
}

async function updateObjects(_data: any[]) {
    let existingUUIDs: string[] = [];

    await Promise.all(
        _data.map(async (entity) => {
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
