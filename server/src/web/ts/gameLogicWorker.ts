import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import {
    CSS2DRenderer,
    CSS2DObject,
    // @ts-ignore
} from "./three/addons/renderers/CSS2DRenderer.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { io } from "socket.io-client";
import * as TWEEN from "@tweenjs/tween.js";

// Three.js Objects
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.Renderer;
let controls: OrbitControls;
let canvas: HTMLCanvasElement | null;
// let audioListener: THREE.AudioListener;
// let labelRenderer: CSS2DRenderer;
let lockOnCircle: THREE.Object3D | null;
const state = { width: 300, height: 150 };

// Player Data
let playerEntity: any;
let playerName: string;
let playerObject: THREE.Object3D | undefined = undefined;
let lastEntityPosition: THREE.Vector3 | null = null;
let isFirstUpdateForPlayer: boolean = true;

// Game Data
let shoppingData: any;
let playerInventory: any;
let currentMap: any;
const instanceMeshMap: Record<string, THREE.Group> = {};

const objectDataMap: Record<string, { data: any }> = {};
const labelMap: Map<string, LabelObject> = new Map();
const particles: any[] = [];
const damageIndicators: any[] = [];
let globalInputElement: any;

const raycaster = new THREE.Raycaster();
const rayCastLayerNo = 1;

const tickrate = 20;
const frameTime = 1000 / (tickrate + 1);
let lastTime = 0;
let frameCount = 0;

let globalFont: any = null;

const serverIp = "localhost:3000";

raycaster.layers.set(rayCastLayerNo);
function noop() {}

class ElementProxyReceiver extends THREE.EventDispatcher {
    style: any;
    width: any;
    height: any;
    top: any;
    left: any;

    constructor() {
        super();
        // because OrbitControls try to set style.touchAction;
        this.style = {};
    }
    get clientWidth() {
        return this.width;
    }
    get clientHeight() {
        return this.height;
    }
    // OrbitControls call these as of r132. Maybe we should implement them
    setPointerCapture() {}
    releasePointerCapture() {}
    getBoundingClientRect() {
        return {
            left: this.left,
            top: this.top,
            width: this.width,
            height: this.height,
            right: this.left + this.width,
            bottom: this.top + this.height,
        };
    }
    handleEvent(data: any) {
        if (data.type === "size") {
            this.left = data.left;
            this.top = data.top;
            this.width = data.width;
            this.height = data.height;
            return;
        }

        data.preventDefault = noop;
        data.stopPropagation = noop;
        this.dispatchEvent(data);
    }
    focus() {
        // no-op
    }
}

class ProxyManager {
    targets: any;

    constructor() {
        this.targets = {};
        this.handleEvent = this.handleEvent.bind(this);
    }
    makeProxy(data: any) {
        const { id } = data;
        const proxy = new ElementProxyReceiver();
        this.targets[id] = proxy;
    }
    getProxy(id: any) {
        return this.targets[id];
    }
    handleEvent(data: any) {
        this.targets[data.id].handleEvent(data.data);
    }
}

interface LabelObject {
    uuid: string;
    group: THREE.Group;
    updateHealth: (currentHealth: number) => void;
    updateShields: (currentShields: number) => void;
}

async function loadGlobalFont() {
    return new Promise((resolve, reject) => {
        const loader = new FontLoader();
        loader.load(
            "./assets/fonts/optimer_regular.json",
            (font: any) => {
                globalFont = font;
                resolve(font);
            },
            undefined,
            reject
        );
    });
}

export function createLabelObject(
    nickname: string,
    uuid: string,
    maxHealth: number,
    maxShields: number,
    currentHealth: number,
    currentShields: number
): LabelObject {
    const group = new THREE.Group();

    const maxBarLength = 0.5;

    group.name = "label";

    // Create Nickname Text
    const geometry = new TextGeometry(nickname, {
        font: globalFont,
        size: 0.1,
        height: 0.02,
    });

    geometry.computeBoundingBox();
    const widthOffset =
        -0.5 * (geometry.boundingBox!.max.x - geometry.boundingBox!.min.x);

    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const text = new THREE.Mesh(geometry, material);
    text.position.set(widthOffset || 0, -0.7, 0);
    group.add(text);

    // Create Health Bar
    const healthBarGeometry = new THREE.PlaneGeometry(maxBarLength, 0.01);
    const healthBarMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const healthBar = new THREE.Mesh(healthBarGeometry, healthBarMaterial);
    healthBar.position.set(0, -0.8, 0);
    group.add(healthBar);

    // Create Shields Bar
    const shieldBarGeometry = new THREE.PlaneGeometry(maxBarLength, 0.01);
    const shieldBarMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const shieldBar = new THREE.Mesh(shieldBarGeometry, shieldBarMaterial);
    shieldBar.position.set(0, -0.82, 0);
    group.add(shieldBar);

    // Function to update health
    const updateHealth = (currentHealth: number) => {
        const scale = currentHealth / maxHealth;
        healthBar.scale.setX(scale);
    };

    // Function to update shields
    const updateShields = (currentShields: number) => {
        const scale = currentShields / maxShields;
        shieldBar.scale.setX(scale);
    };

    // Initial length set based on current health and shields
    updateHealth(currentHealth);
    updateShields(currentShields);

    return {
        group,
        uuid,
        updateHealth,
        updateShields,
    };
}

const proxyManager = new ProxyManager();

function makeProxy(data: any) {
    proxyManager.makeProxy(data);
}

const handlers = {
    main,
    size,
    makeProxy,
    event: proxyManager.handleEvent,
    recreateRenderer,
    raycastFromCamera,
};

async function mapData(data: {
    name: string;
    entities: any[];
    projectiles: any[];
    cargoboxes: any[];
    size: { width: number; height: number };
}) {
    if (!currentMap || currentMap.name !== data.name) {
        await loadNewSpacemap(data); // Assuming loadNewSpacemap returns a Promise
    }

    await updateObjects(
        data.entities.concat(data.projectiles, data.cargoboxes)
    );

    if (!playerObject) {
        playerObject = getObjectByUUID(playerEntity.uuid);
    }
}

async function updateObjects(_data: any[]) {
    const existingUUIDs = new Set<string>();
    const updatePromises: Promise<any>[] = [];

    for (const entity of _data) {
        if (entity.name === playerName) {
            playerEntity = entity;
            self.postMessage({ type: "updatePlayerInfo", data: entity });
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

    await Promise.all(updatePromises).then(() => {
        const deleteUUIDs = new Set(Object.keys(objectDataMap));
        for (const existingUUID of existingUUIDs) {
            deleteUUIDs.delete(existingUUID);
        }

        const deletePromises = Array.from(deleteUUIDs).map((uuid) =>
            deleteObject(uuid)
        );
    });
}

async function fetchGLBModel(modelUrl: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        fetch(modelUrl)
            .then((response) => response.arrayBuffer())
            .then((buffer) => {
                const loader = new GLTFLoader();
                loader.parse(
                    buffer,
                    "",
                    (glb) => {
                        resolve(glb.scene); // glb.scene is a Group
                    },
                    (error) => {
                        console.error(
                            "An error occurred while parsing the GLB",
                            error
                        );
                        reject(error);
                    }
                );
            })
            .catch((error) => {
                console.error(
                    "An error occurred while fetching the GLB",
                    error
                );
                reject(error);
            });
    });
}

function initInstancedMesh(model: THREE.Object3D, type: string, count: number) {
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];

    model.children[0].traverse((child) => {
        if (child.type == "Mesh") {
            const mesh = child as THREE.Mesh;
            const geometryClone = mesh.geometry.clone() as THREE.BufferGeometry;
            geometryClone.groups.forEach((group) => {
                group.materialIndex = materials.length;
            });

            geometries.push(geometryClone);
            materials.push(mesh.material as THREE.Material);
        }
    });

    const mergedGeometry = mergeGeometries(
        geometries,
        false
    );

    const instancedMesh = new THREE.InstancedMesh(
        mergedGeometry,
        materials,
        count
    );
    
    const instancedMeshesGroup = new THREE.Group();
    instancedMeshesGroup.add(instancedMesh);
    instanceMeshMap[type] = instancedMeshesGroup;
}

async function createObject(data: any): Promise<THREE.Object3D> {
    // console.log(`Creating new Object ${data.name}`);
    return new Promise(async (resolve) => {
        if (data._type == "Player") {
            const cachedInstance = instanceMeshMap[data.activeShipName];
            if (cachedInstance) {
                const clonedObject = cachedInstance.clone(true);
                removeCSSChildrenOfObject(clonedObject);
                resolve(clonedObject);
            } else {
                const model = await fetchGLBModel(
                    `./assets/models/ships/${data.activeShipName}/${data.activeShipName}.glb`
                );
                initInstancedMesh(model, data.activeShipName, 1);
                objectDataMap[data.uuid] = { data: null };
                setupPlayerObject(model, data);
                resolve(model);
            }
        } else {
            const cachedInstance = instanceMeshMap[data.name];
            if (cachedInstance) {
                const clonedObject = cachedInstance.clone(true);
                removeCSSChildrenOfObject(clonedObject);
                switch (data._type) {
                    case "Alien":
                        const alien = clonedObject;
                        setupAlienObject(alien, data);
                        resolve(alien);
                        break;
                    case "Portal":
                        //TODO: Needs model rework here!
                        const portal = clonedObject;
                        instanceMeshMap[data.name] = portal;
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
                        initInstancedMesh(model, data.name, 1);
                        setupAlienObject(model, data);
                        resolve(model);
                    });
                    break;
                case "Portal":
                    modelUrl = "./assets/models/portals/portal.glb";
                    loader.load(modelUrl, async (glb) => {
                        const model = glb.scene;
                        instanceMeshMap[data.name] = model;
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

                    // if (currentSounds <= maxConcurrentSounds) {
                    //     currentSounds++;
                    //     const sound = new THREE.PositionalAudio(audioListener);
                    //     sound.setBuffer(laserShootSoundBuffer);
                    //     sound.setRefDistance(20);
                    //     sound.setVolume(0.3);
                    //     sound.onEnded = () => {
                    //         currentSounds--;
                    //     };
                    //     line.add(sound);
                    //     sound.play();
                    // }
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

                    // const rocketSound = new THREE.PositionalAudio(
                    //     audioListener
                    // );

                    // if (currentSounds <= maxConcurrentSounds) {
                    //     currentSounds++;
                    //     rocketSound.setBuffer(rocketShootSoundBuffer);
                    //     rocketSound.setRefDistance(20);
                    //     rocketSound.setVolume(0.15);
                    //     rocketSound.onEnded = function () {
                    //         currentSounds--;
                    //     };
                    //     rocket.add(rocketSound);
                    //     rocketSound.play();
                    // }

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
                        //TODO:: NEEDS UPDATING TOOO models for isntancemap
                        const model = glb.scene;
                        instanceMeshMap["Portal"] = model;
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

function setupAlienObject(model: THREE.Object3D, data: any) {
    model.uuid = data.uuid;
    model.position.set(data.position.x, 0, data.position.y);
    setNameRecursively(model, data.name, data.uuid, rayCastLayerNo);

    const labelObject = createLabelObject(
        data.name,
        data.uuid,
        data.maxHealth,
        data.maxShields,
        data.hitPoints.hullPoints,
        data.hitPoints.shieldPoints
    );

    labelMap.set(data.uuid, labelObject);

    model.add(labelObject.group);

    // const nickBarContainer = document.createElement("div");
    // const nickname = document.createElement("div");
    // nickname.className = "nicknameLabel";
    // nickname.textContent = `${data.name}`;

    // const healthBar = document.createElement("div");
    // healthBar.className = "health_bar";

    // const hpBar = document.createElement("div");
    // hpBar.className = "hp_health_bar";

    // const spBar = document.createElement("div");
    // spBar.className = "sp_health_bar";

    // const maxHP = data.maxHealth;
    // const maxSP = data.maxShields;

    // hpBar.style.width = `${data.hitPoints.hullPoints / maxHP}`;

    // spBar.style.width = `${data.hitPoints.shieldPoints / maxSP}`;

    // healthBar.appendChild(hpBar);
    // healthBar.appendChild(spBar);

    // nickBarContainer.appendChild(nickname);
    // nickBarContainer.appendChild(healthBar);
    // nickBarContainer.setAttribute("uuid", data.uuid);
    // nickBarContainer.classList.add("nickBarContainer");

    // const label = new CSS2DObject(nickBarContainer);

    // labelMap[data.uuid] = label;
    // label.position.y = -0.75;
    (model as any).hitPoints = data.hitPoints;
    // model.add(label);
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
    // const text = document.createElement("div");
    // text.className = "nicknameLabel";
    // text.style.color = "rgb(255,255,255)";
    // text.style.fontSize = "12";
    // text.textContent = `${data.name}`;
    // const label = new CSS2DObject(text);
    // labelMap[data.uuid] = label;
    // label.position.y = -0.75;
    // label.uuid = data.uuid;
    (model as any).hitPoints = data.hitPoints;
    // model.add(label);
    scene.add(model);
    console.log(model);
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
        //TODO: remove CSS2D check here
        if (
            child instanceof CSS2DObject ||
            child.name == "lockOnCirle" ||
            child.name == "label"
        ) {
            childrenToRemove.push(child);
        }
    });
    for (const child of childrenToRemove) {
        if (child.parent) {
            child.parent.remove(child);
        }
    }
}

async function updateObject(object: THREE.Object3D, entity: any) {
    const { position, targetUUID, name, hitPoints, _type, activeShipName } =
        entity;
    const { x: posX, y: posY } = position;

    const targetDirection = new THREE.Vector3(posX, 0, posY);

    if (hitPoints) {
        if (hitPoints.hullPoints < 0) {
            createAndTriggerExplosion(object);
            deleteObject(object.uuid);
            return;
        }
    }

    const label = object.children.find((child) => child.name === "label");
    if (label) label.lookAt(camera.position);

    const targetObject = getObjectByUUID(targetUUID);
    const targetQuaternion = new THREE.Quaternion();
    const axisAngleQuaternion = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        Math.PI
    );
    function _tween(object: any, targetPos: THREE.Vector3) {
        let originalPosition = object.position.clone();
        new TWEEN.Tween(object.position)
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
                const deltaVector = object.position
                    .clone()
                    .sub(originalPosition);
                const lookAtDirection = originalPosition
                    .clone()
                    .add(deltaVector);
                if (targetObject) {
                    object.lookAt(targetObject.position);
                } else {
                    if (deltaVector.lengthSq() > 0.00001) {
                        const lookTarget = lookAtDirection
                            .clone()
                            .add(deltaVector);
                        targetQuaternion.setFromRotationMatrix(
                            new THREE.Matrix4().lookAt(
                                object.position,
                                lookTarget,
                                object.up
                            )
                        );
                        targetQuaternion.multiply(axisAngleQuaternion);
                        object.quaternion.slerp(targetQuaternion, 0.35);
                    }
                }
                if (object.name === playerName) {
                    if (isFirstUpdateForPlayer) {
                        lastEntityPosition = targetDirection;
                        camera.position.set(posX, camera.position.y, posY);
                        controls.target.copy(targetDirection);
                        // object.add(audioListener);
                        isFirstUpdateForPlayer = false;
                    } else if (lastEntityPosition !== null) {
                        lastEntityPosition.add(deltaVector);
                        object.position.copy(lastEntityPosition);
                        camera.position.add(deltaVector);
                        controls.target.add(deltaVector);
                        originalPosition = lastEntityPosition.clone();
                    }
                    controls.update();
                }
            })
            .start();
    }

    if (hitPoints) {
        const { hullPoints, shieldPoints } = hitPoints;
        const dhp = (object as any).hitPoints.hullPoints - hullPoints;
        const dsp = (object as any).hitPoints.shieldPoints - shieldPoints;

        if (dhp + dsp > 0) {
            // const text = document.createElement("div");
            // text.className = "damageIndicator";
            // text.style.color = "rgb(255,0,0)";
            // text.style.fontSize = "12";
            // text.textContent = `-${await beautifyNumberToUser(
            //     Math.round(dhp + dsp)
            // )}`;
            // const damageLabel = new CSS2DObject(text);
            // damageLabel.position.copy(object.position);
            // damageIndicators.push(damageLabel);
            // scene.add(damageLabel);
            // setTimeout(() => {
            //     scene.remove(damageLabel);
            // if (entityLabelsDiv) {
            //     const child = Array.from(entityLabelsDiv.children).find(
            //         (child) => child.textContent === text.textContent
            //     );
            //     if (child) {
            //         entityLabelsDiv.removeChild(child);
            //     }
            // }
            //     const index = damageIndicators.indexOf(damageLabel);
            //     if (index !== -1) {
            //         damageIndicators.splice(index, 1);
            //     }
            // }, 1000);
        }
        if (dhp !== 0 || dsp !== 0) {
            // if (entityLabelsDiv) {
            //     const label = Array.from(entityLabelsDiv.children).find(
            //         (child) => child.getAttribute("uuid") === object.uuid
            //     );
            //     if (label) {
            //         const hpBar = label.children[1].children[0] as HTMLElement;
            //         const spBar = label.children[1].children[1] as HTMLElement;
            //         const maxHp = entity.maxHealth || 100;
            //         const maxSp = entity.maxShields || 100;
            //         hpBar.style.width = `${(hullPoints / maxHp) * 100}%`;
            //         spBar.style.width = `${(shieldPoints / maxSp) * 100}%`;
            //     }
            // }
        }
    }

    if (_type && (_type === "Alien" || _type === "Player")) {
        if ((object as any).activeShipName) {
            if ((object as any).activeShipName !== activeShipName) {
                deleteObject(object.uuid);
                return;
            }
        } else {
            (object as any).activeShipName = activeShipName;
            // console.log(activeShipName);
        }
    }

    if (name !== "CargoDrop") {
        _tween(object, targetDirection);
    }
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

    // if (currentSounds <= maxConcurrentSounds) {
    //     const sound = new THREE.PositionalAudio(audioListener);
    //     currentSounds++;
    //     sound.setBuffer(explosionSoundBuffer);
    //     sound.setVolume(1);
    //     sound.onEnded = function () {
    //         currentSounds--;
    //     };
    //     scene.add(sound);
    //     sound.play();
    //     sound.position.copy(object.position);
    //     setTimeout(() => {
    //         scene.remove(sound);
    //     }, 150);
    // }

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

function getObjectByUUID(uuid: string) {
    if (objectDataMap[uuid]) {
        return objectDataMap[uuid].data || null;
    }
    return null;
}

async function loadNewSpacemap(data: any) {
    clearScene(scene);
    lockOnCircle?.removeFromParent();
    self.postMessage({
        type: "newLockOnCircleParent",
        data: undefined,
    });
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
        console.log(
            `Got an error while loading new spacemap: ${data.name}`,
            error
        );
    }
}

async function loadStaticEntities(data: any) {
    return;
}

function createLighting() {
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    const ambientLight = new THREE.AmbientLight(0x404040, 0.25);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    scene.add(ambientLight);
}

async function loadImage(url: string) {
    const response = await fetch(url);
    const blob = await response.blob();
    return createImageBitmap(blob);
}

async function createSkybox(mapname: string) {
    const imageBitmaps = await Promise.all([
        loadImage(`./assets/spacemaps/${mapname}/right.png`),
        loadImage(`./assets/spacemaps/${mapname}/left.png`),
        loadImage(`./assets/spacemaps/${mapname}/top.png`),
        loadImage(`./assets/spacemaps/${mapname}/bottom.png`),
        loadImage(`./assets/spacemaps/${mapname}/front.png`),
        loadImage(`./assets/spacemaps/${mapname}/back.png`),
    ]);

    const cubeTexture = new THREE.CubeTexture(imageBitmaps);
    cubeTexture.colorSpace = "srgb";

    cubeTexture.needsUpdate = true;
    scene.background = cubeTexture;
}

function clearScene(scene: THREE.Scene) {
    for (const object in objectDataMap) {
        deleteObject(object);
    }

    while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
    }
}

// function getLabelByUUID(uuid: string): CSS2DObject | undefined {
//     return scene.children.find(
//         (child) => child instanceof CSS2DObject && child.uuid === uuid
//     ) as CSS2DObject | undefined;
// }

async function deleteObject(uuid: string) {
    const object = getObjectByUUID(uuid);
    if (!object) {
        console.warn(
            `WARNING: Tried to delete object but could not find it: ${uuid}`
        );
        // console.log(objectDataMap);
        return;
    }

    labelMap.delete(uuid);

    // const label = getLabelByUUID(uuid);
    // if (label) {
    //     labelRenderer.domElement.removeChild(label.element);
    //     delete labelMap[uuid];
    // }

    // const entityLabelsDiv = document.getElementById("entityLabelsDiv");
    // if (entityLabelsDiv) {
    //     entityLabelsDiv.innerHTML = ""; // Clear all child elements
    // } else {
    //     console.log("The element with id 'entityLabelsDiv' was not found.");
    // }

    // if (
    //     object.name === "laserProjectile" &&
    //     currentSounds <= maxConcurrentSounds
    // ) {
    //     currentSounds++;
    //     const sound = new THREE.PositionalAudio(audioListener);
    //     sound.setRefDistance(20);
    //     sound.setBuffer(laserHitSoundBuffer);
    //     sound.setVolume(0.7);
    //     scene.add(sound);
    //     sound.position.copy(object.position);
    //     sound.onEnded = function () {
    //         currentSounds--;
    //         scene.remove(sound);
    //     };
    //     sound.play();
    // } else if (object.name === "rocketProjectile") {
    //     if (currentSounds <= maxConcurrentSounds) {
    //         currentSounds++;
    //         const sound = new THREE.PositionalAudio(audioListener);
    //         sound.position.copy(object.position);
    //         sound.setRefDistance(20);
    //         sound.setBuffer(rocketHitSoundBuffer);
    //         sound.setVolume(0.1);
    //         scene.add(sound);
    //         sound.position.copy(object.position);
    //         sound.onEnded = function () {
    //             currentSounds--;
    //             scene.remove(sound);
    //         };
    //         sound.play();
    //     }
    // }

    delete objectDataMap[uuid];
    scene.remove(object);

    // console.log(`Deleted object with uuid: ${uuid}`);
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

function recreateRenderer(data: any) {
    alert("Unsupported for now!");
    return;
    const antialias = data.antiAliasing;

    // const container = document.getElementById("spacemapDiv");
    // if (!container) return;
    // const existingRendererElement = container.querySelector("#THREEJSScene");
    // if (existingRendererElement) {
    //     container.removeChild(existingRendererElement);
    // }
    renderer = new THREE.WebGLRenderer({
        canvas: canvas! as unknown as OffscreenCanvas,
        antialias: antialias,
    });
    renderer.setSize(state.width, state.height);
    // renderer.domElement.id = "THREEJSScene";
    // if (container.firstChild) {
    //     container.insertBefore(renderer.domElement, container.firstChild);
    // } else {
    //     container.appendChild(renderer.domElement);
    // }
    controls = new OrbitControls(camera, globalInputElement);
    isFirstUpdateForPlayer = true;
    // renderer.domElement.addEventListener("click", (event) => {
    //     raycastFromCamera(event);
    // });

    updateControlsSettings();
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

function initSocketConnection(data: { token: string }) {
    const socketWorker = io("http://localhost:3000");
    console.log(data.token);
    socketWorker.emit("verifyToken", { token: data.token });

    socketWorker.on(
        "mapData",
        (data: {
            name: string;
            entities: any[];
            projectiles: any[];
            cargoboxes: any[];
            size: { width: number; height: number };
        }) => {
            mapData(data);
        }
    );
}

async function main(data: any) {
    const { canvas, antialias, token } = data;

    await loadGlobalFont();

    playerName = data.playerName;

    console.log(data);
    initSocketConnection({ token: token });

    const proxy = proxyManager.getProxy(data.canvasId);
    proxy.ownerDocument = proxy; // HACK!
    //@ts-ignore
    self.document = {}; // HACK!

    globalInputElement = proxy;
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: antialias,
        powerPreference: "high-performance",
    });

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
        60,
        state.width / state.height,
        0.1,
        1000
    );

    state.width = canvas.width;
    state.height = canvas.height;

    // Position the camera
    camera.position.x = 4;
    camera.position.y = 5;
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    controls = new OrbitControls(camera, globalInputElement);

    updateControlsSettings();

    // audioListener = new THREE.AudioListener();
    // camera.add(audioListener);

    const lockOnCircleGeometry = new THREE.RingGeometry(1.5, 1.55, 32);
    const lockOnCirleMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        side: THREE.DoubleSide,
    });
    lockOnCircle = new THREE.Mesh(lockOnCircleGeometry, lockOnCirleMaterial);
    lockOnCircle.rotation.x = 1.57079633;
    lockOnCircle.position.set(0, 0, 0);
    lockOnCircle.name = "lockOnCircle";

    render();
}

function updateControlsSettings() {
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
}

const render = (time?: any) => {
    requestAnimationFrame(render);
    if (resizeRendererToDisplaySize()) {
        camera.aspect = state.width / state.height;
        camera.updateProjectionMatrix();
    }
    TWEEN.update();
    renderer.render(scene, camera);

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

    frameCount++;
    let elapsed = (time - lastTime) / 1000;
    if (elapsed >= 1) {
        const fps = frameCount / elapsed;
        // gamefpsDiv.innerHTML = `FPS: ${fps.toFixed(4)}`;
        self.postMessage({
            type: "fps",
            fps: fps,
            drawCalls: (renderer as any).info.render.calls,
        });
        frameCount = 0;
        lastTime = time;
    }

    // console.log(scene);
};

function resizeRendererToDisplaySize() {
    const canvas = renderer.domElement;
    const width = state.width;
    const height = state.height;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
    }
    return needResize;
}

function size(data: { width: number; height: number }) {
    state.width = data.width;
    state.height = data.height;
}

self.onmessage = function (e) {
    //@ts-ignore
    const fn = handlers[e.data.type];
    if (typeof fn !== "function") {
        throw new Error("no handler for type: " + e.data.type);
    }
    fn(e.data);
};

globalInputElement.addEventListener("click", (event: any) => {
    raycastFromCamera(event);
});

function raycastFromCamera(data: any) {
    const event = data.event;
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / state.width) * 2 - 1;
    mouse.y = -(event.clientY / state.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children, true);

    let _names: string[] = [];

    console.log(intersects);

    if (intersects.length > 0) {
        intersects.forEach((intersect) => {
            _names.push(intersect.object.name);
        });

        console.log(`Got following intersects: ${JSON.stringify(_names)}`);
        console.log(intersects);

        const isOnlyPlaneAndCargo = _names.every(
            (name) =>
                name === "movingPlane" ||
                name === "CargoDrop" ||
                name === playerName
        );
        const firstCargoDrop = intersects.find(
            (intersect: any) => intersect.object.name === "CargoDrop"
        );

        if (isOnlyPlaneAndCargo && firstCargoDrop) {
            self.postMessage({
                type: "playerCollectCargoBox",
                data: {
                    playerName: playerName,
                    cargoDropUUID: firstCargoDrop.object.uuid,
                },
            });
        } else if (
            intersects.length === 1 &&
            intersects[0].object.name === "movingPlane"
        ) {
            self.postMessage({
                type: "playerMoveToDestination",
                data: {
                    targetPosition: {
                        x: intersects[0].point.x,
                        y: intersects[0].point.z,
                    },
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
                self.postMessage({
                    type: "newLockOnCircleParent",
                    data: object.uuid,
                });
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
                    self.postMessage({
                        type: "newLockOnCircleParent",
                        data: object.uuid,
                    });
                }
            }
        }
    }
}
