// @ts-ignore
export const socket = io("http://localhost:3000");

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

let loginDiv = document.getElementById("loginDiv") as HTMLElement;
let spacemapDiv = document.getElementById("spacemapDiv") as HTMLElement;

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.Renderer;
let currentMap: string;
let controls: OrbitControls;

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

socket.on("mapData", (data: any) => {
    console.log(data);
    if (currentMap != data.name) {
        loadNewSpacemap(data);
    }
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
    scene.add(plane);
}

async function loadStaticEntities(data: any) {
    return;
}

function initScene(): void {
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
    document.getElementById("spacemapDiv")?.appendChild(renderer.domElement);
    spacemapDiv.appendChild(renderer.domElement)

    // Create a cube and add it to the scene
    const geometry: THREE.BoxGeometry = new THREE.BoxGeometry();
    const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
    });
    const cube: THREE.Mesh = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // Position the camera
    camera.position.x = 4;
    camera.position.y = 5;
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    // Create an animation function to rotate the cube
    const animate = () => {
        requestAnimationFrame(animate);

        // Rotate the cube
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;

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
