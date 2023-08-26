import * as THREE from './three.module.js'
// Set up the scene
const scene = new THREE.Scene();
    
// Set up the camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Set up the renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create a geometry
const geometry = new THREE.BoxGeometry();

// Create a material
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

// Create a mesh and add it to the scene
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Set up animation
const animate = () => {
  requestAnimationFrame(animate);
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
};

// Start the animation
animate();