// @ts-ignore
export const socket = io("http://localhost:3000");

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import pako from "pako";

let loginDiv = document.getElementById("loginDiv") as HTMLElement;
let spacemapDiv = document.getElementById("spacemapDiv") as HTMLElement;
let contentDiv = document.getElementById("content") as HTMLElement;

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.Renderer;
let currentMap: string;
let controls: OrbitControls;
let canvas: HTMLElement | null;

const lerpFactor = 0.01;

const objectDataMap: Record<string, { data: any }> = {};

const raycaster = new THREE.Raycaster();

socket.on("connect", () => {
    console.log("Connected to the socket.io server");
});

socket.on("loginSuccessful", (data: { username: string }) => {
    console.log(`Successful login as ${data.username}, starting game...`);
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

socket.on("mapData", (compressedData: any) => {
    const uint8Array = new Uint8Array(compressedData);
    const inflatedData = JSON.parse(pako.inflate(uint8Array, { to: "string" }));
    console.log(inflatedData);
    if (currentMap != inflatedData.name) {
        loadNewSpacemap(inflatedData);
    }
    updateObjects(inflatedData.entities);
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

    canvas = document.getElementById("THREEJSScene") as HTMLElement;
    spacemapDiv.appendChild(renderer.domElement);

    createStars();

    canvas.addEventListener("click", raycastFromCamera, false);

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
    };

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.minPolarAngle = Math.PI * 0.05;
    controls.maxPolarAngle = Math.PI / 2;

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
    });
}

async function createObject(data: any) {
    return new Promise(async (resolve) => {
        const geometry: THREE.BoxGeometry = new THREE.BoxGeometry();
        const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
        });
        const cube: THREE.Mesh = new THREE.Mesh(geometry, material);
        cube.uuid = data.uuid;
        cube.position.set(data.position.x, 0, data.position.y);
        cube.name = data.name;
        scene.add(cube);
        objectDataMap[data.uuid] = { data: cube };
        resolve(cube);
    });
}

async function updateObject(object: THREE.Object3D, entity: any) {
    object.position.lerp(
        new THREE.Vector3(entity.position.x, 0, entity.position.y),
        lerpFactor
    );
}

async function deleteObject(uuid: string) {
    const object = getObjectByUUID(uuid);
    if (object) {
        scene.remove(object);
        //TODO: deleteobject ?
        console.log(`Deleted object with uuid: ${uuid}`);
    } else {
        console.log(
            `WARNING: tried to delete object but could not find it: ${uuid}`
        );
    }
}

async function updateObjects(_data: any[]) {
    let existingUUIDs: string[] = [];

    _data.forEach((entity) => {
        if (objectDataMap.hasOwnProperty(entity.uuid)) {
            const object = getObjectByUUID(entity.uuid);
            if (object) {
                updateObject(object, entity);
            } else {
                console.log(
                    `WARNING: Could not find object for uuid: ${entity.uuid}`
                );
            }
        } else {
            createObject(entity);
        }
        existingUUIDs.push(entity.uuid);
    });

    for (const uuid in objectDataMap) {
        if (!existingUUIDs.includes(uuid)) {
            deleteObject(uuid);
        }
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

    const points = new THREE.Points(geometry, material) as any;

    points.uuid = Math.random();

    scene.add(points);
    points.layers.enable(0);
}
