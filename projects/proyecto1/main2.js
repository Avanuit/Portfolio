import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

// configuracion inicial de herramientas
const listaGraffitis = [
    { name: 'Eraser', file: '🧽', isEraser: true, scale: 1 },
    { name: 'Ava', file: 'src/textures/graffiti/ava.png', isEraser: false, scale: 1 },
    { name: 'Bomb', file: 'src/textures/graffiti/bomb1.png', isEraser: false, scale: 2.5 },
    { name: 'Bomb 2', file: 'src/textures/graffiti/bomb2.png', isEraser: false, scale: 2.5 },
    { name: 'Piece', file: 'src/textures/graffiti/piece1.png', isEraser: false, scale: 5 },
    { name: 'Piece 2', file: 'src/textures/graffiti/piece2.png', isEraser: false, scale: 5 }
];

let currentGraffitiIdx = 1;
let graffitiSize = 40;
let isEraserMode = false;

// loading manager y precarga de texturas
const loadingManager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(loadingManager);

// pinche jpeg
loadingManager.setURLModifier((url) => {
    if (url.toLowerCase().endsWith('.jpg')) {
        return url.replace(/\.jpg$/i, '.jpeg');
    }
    return url;
});

// precargar texturas para calcular el aspecto real de la imagen
listaGraffitis.forEach(graf => {
    if (!graf.isEraser) {
        graf.texture = textureLoader.load(graf.file);
        graf.texture.magFilter = THREE.NearestFilter;
    }
});

loadingManager.onProgress = (url, loaded, total) => {
    const progress = (loaded / total) * 100;
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) progressBar.style.width = progress + '%';
};

loadingManager.onLoad = () => {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => loadingScreen.remove(), 500);
    }
};

// escena y controles
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 20000);
camera.position.set(300, 150, 300);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// luces
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(200, 300, 200);
directionalLight.castShadow = true;
scene.add(directionalLight);

// cargar modelo
const fbxLoader = new FBXLoader(loadingManager);
fbxLoader.setPath('src/textures/');
fbxLoader.setResourcePath('src/textures/');

fbxLoader.load('Metro.fbx', (object) => {
    object.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
                child.material.needsUpdate = true;
            }
        }
    });
    scene.add(object);
});

//ui de la ruleta
const wheel = document.getElementById('graffiti-wheel');
const wheelContainer = document.querySelector('.wheel-container');
const selectedNameLabel = document.getElementById('selected-name');

if (wheelContainer && selectedNameLabel) {
    listaGraffitis.forEach((graf, i) => {
        const btn = document.createElement('div');
        btn.className = graf.isEraser ? 'wheel-item eraser-item' : 'wheel-item';
        
        const angle = (i / listaGraffitis.length) * Math.PI * 2 - (Math.PI / 2);
        const radius = 180;
        btn.style.left = (250 + radius * Math.cos(angle) - 45) + 'px';
        btn.style.top = (250 + radius * Math.sin(angle) - 45) + 'px';
        
        if (graf.isEraser) {
            btn.innerHTML = `<div style="font-size:2.5rem;">${graf.file}</div>`;
        } else {
            btn.innerHTML = `<img src="${graf.file}" style="max-width:100%; max-height:100%;">`;
        }
        
        btn.onmouseover = () => selectedNameLabel.innerText = graf.name;
        
        btn.onclick = () => {
            currentGraffitiIdx = i;
            isEraserMode = graf.isEraser;
            
            if (isEraserMode) {
                document.body.classList.add('eraser-mode');
                previewMesh.visible = false;
            } else {
                document.body.classList.remove('eraser-mode');
            }
            
            wheel.classList.add('hidden');
        };
        wheelContainer.appendChild(btn);
    });
}

// controles del html
window.addEventListener('keydown', (e) => { 
    if (e.key.toLowerCase() === 'q' && wheel) wheel.classList.remove('hidden'); 
});
window.addEventListener('keyup', (e) => { 
    if (e.key.toLowerCase() === 'q' && wheel) wheel.classList.add('hidden'); 
});

const sizeInput = document.getElementById('graffiti-size');
if (sizeInput) {
    sizeInput.oninput = (e) => graffitiSize = e.target.value;
}

// logica principal de pintar, borrar y previsualizar
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let clickStart = 0;
let startPos = new THREE.Vector2();

// malla de previsualizacion (holograma)
const previewMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ 
        transparent: true, opacity: 0.5, 
        polygonOffset: true, polygonOffsetFactor: -2, side: THREE.DoubleSide 
    })
);
previewMesh.userData.isPreview = true;
previewMesh.visible = false;
scene.add(previewMesh);

// movimiento del raton para la previsualizacion
window.addEventListener('mousemove', (e) => {
    // ocultar si estamos en UI, borrador, o con la ruleta abierta
    if (e.target !== renderer.domElement || (wheel && !wheel.classList.contains('hidden')) || isEraserMode) {
        previewMesh.visible = false;
        return;
    }

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    // ignorar graffitis ya puestos y el propio preview para no detectarlos como pared
    const stationObjects = scene.children.filter(child => !child.userData.isGraffiti && !child.userData.isPreview);
    const intersects = raycaster.intersectObjects(stationObjects, true);

    if (intersects.length > 0) {
        const inter = intersects[0];
        const normal = inter.face.normal.clone();
        const normalMatrix = new THREE.Matrix3().getNormalMatrix(inter.object.matrixWorld);
        normal.applyMatrix3(normalMatrix).normalize();

        const tool = listaGraffitis[currentGraffitiIdx];
        
        // calcular el ancho basado en la proporcion original de la imagen
        const aspect = tool.texture.image ? (tool.texture.image.width / tool.texture.image.height) : 1;
        const finalHeight = graffitiSize * tool.scale;
        const finalWidth = finalHeight * aspect;

        previewMesh.geometry.dispose();
        previewMesh.geometry = new THREE.PlaneGeometry(finalWidth, finalHeight);
        previewMesh.material.map = tool.texture;
        previewMesh.material.needsUpdate = true;

        previewMesh.position.copy(inter.point).add(normal.multiplyScalar(0.6));
        previewMesh.lookAt(previewMesh.position.clone().add(normal));
        previewMesh.visible = true;
    } else {
        previewMesh.visible = false;
    }
});

// clicks de raton
window.addEventListener('mousedown', (e) => {
    if (e.target !== renderer.domElement) return;
    clickStart = Date.now();
    startPos.set(e.clientX, e.clientY);
});

window.addEventListener('mouseup', (e) => {
    if (e.target !== renderer.domElement) return;
    if (wheel && !wheel.classList.contains('hidden')) return;

    const duration = Date.now() - clickStart;
    const distance = startPos.distanceTo(new THREE.Vector2(e.clientX, e.clientY));

    if (duration < 200 && distance < 5) {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        const stationObjects = scene.children.filter(child => !child.userData.isPreview);
        const intersects = raycaster.intersectObjects(stationObjects, true);
        
        if (intersects.length > 0) {
            if (isEraserMode) {
                const hit = intersects.find(i => i.object.userData.isGraffiti);
                if (hit) {
                    const graffitiToErase = hit.object;
                    scene.remove(graffitiToErase);
                    graffitiToErase.geometry.dispose();
                    graffitiToErase.material.dispose();
                }
            } else {
                const hit = intersects.find(i => !i.object.userData.isGraffiti);
                if (hit) {
                    const inter = hit;
                    const normal = inter.face.normal.clone();
                    const normalMatrix = new THREE.Matrix3().getNormalMatrix(inter.object.matrixWorld);
                    normal.applyMatrix3(normalMatrix).normalize();

                    const tool = listaGraffitis[currentGraffitiIdx];
                    
                    const aspect = tool.texture.image ? (tool.texture.image.width / tool.texture.image.height) : 1;
                    const finalHeight = graffitiSize * tool.scale;
                    const finalWidth = finalHeight * aspect;

                    const graffiti = new THREE.Mesh(
                        new THREE.PlaneGeometry(finalWidth, finalHeight),
                        new THREE.MeshBasicMaterial({ 
                            map: tool.texture, transparent: true, polygonOffset: true, 
                            polygonOffsetFactor: -1, side: THREE.DoubleSide 
                        })
                    );
                    
                    graffiti.userData.isGraffiti = true; 

                    graffiti.position.copy(inter.point).add(normal.multiplyScalar(0.5));
                    graffiti.lookAt(graffiti.position.clone().add(normal));
                    graffiti.rotateZ(Math.random() * 0.2 - 0.1); 
                    
                    scene.add(graffiti);
                }
            }
        }
    }
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();