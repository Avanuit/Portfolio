import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020202); 

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 25); 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap; 
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

//luz
const hemiLight = new THREE.HemisphereLight(0x223344, 0x050505, 0.2); 
scene.add(hemiLight);

const steveTorchLight = new THREE.PointLight(0xffaa00, 50, 35); 
steveTorchLight.castShadow = true; 
steveTorchLight.shadow.bias = -0.005; 
steveTorchLight.shadow.mapSize.width = 1024; 
steveTorchLight.shadow.mapSize.height = 1024;

//materiales
const textureLoader = new THREE.TextureLoader();
const fbxLoader = new FBXLoader();
const objLoader = new OBJLoader();
const mtlLoader = new MTLLoader();

const configurarTextura = (path) => {
    const tex = textureLoader.load(path);
    tex.magFilter = THREE.NearestFilter; 
    tex.minFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
};

const steveTex = configurarTextura('src2/steve.png');
const creeperTex = configurarTextura('src2/creeper.png');
const antorchaTex = configurarTextura('src2/Diffuse.png');
const picoTex = configurarTextura('src2/pickaxe.jpg');

const aplicarMaterialMinecraft = (objeto, textura) => {
    objeto.traverse((child) => {
        if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({ 
                map: textura,
                transparent: true,
                alphaTest: 0.1,
                side: THREE.DoubleSide,
                roughness: 1,
                metalness: 0
            });
            child.castShadow = true;   
            child.receiveShadow = true; 
            child.material.shadowSide = THREE.FrontSide; 
        }
    });
};

//modelos
fbxLoader.load('src2/steve.fbx', (steve) => {
    steve.scale.set(0.3, 0.3, 0.3); 
    steve.position.set(0, 4.8, 0); 
    aplicarMaterialMinecraft(steve, steveTex);
    scene.add(steve);

    mtlLoader.load('src2/pickaxe.mtl', (materials) => {
        materials.preload();
        objLoader.setMaterials(materials);
        objLoader.load('src2/pickaxe.obj', (obj) => {
            obj.scale.set(0.15, 0.15, 0.15); 
            obj.position.set(-6, -6, 2); 
            obj.rotation.set(-0.6, 1.6, 1); 
            aplicarMaterialMinecraft(obj, picoTex);
            steve.add(obj);
        });
    });

    mtlLoader.load('src2/Torch.mtl', (materials) => {
        materials.preload();
        objLoader.setMaterials(materials);
        objLoader.load('src2/Torch.obj', (obj) => {
            obj.scale.set(7, 7, 7);
            obj.position.set(6, -1.2, 3);
            obj.rotation.set(1.2, 0, 0);
            aplicarMaterialMinecraft(obj, antorchaTex);
            
            obj.add(steveTorchLight); 
            steveTorchLight.position.set(1.5, 1, 0); 
            
            steve.add(obj);
        });
    });
});

fbxLoader.load('src2/creeper.fbx', (creeper) => {
    creeper.scale.set(0.3, 0.3, 0.3); 
    creeper.position.set(4, 3.85, -12); 
    aplicarMaterialMinecraft(creeper, creeperTex);
    scene.add(creeper);
});

//generacion de la cueva
const blockSize = 4;
const blockGeo = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
const blockMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 1 });

for (let x = -28; x <= 28; x += blockSize) {
    for (let y = 0; y <= 24; y += blockSize) { 
        for (let z = -28; z <= 20; z += blockSize) {
            
            //cueva
            let dx = x - 0;
            let dy = y - 5;
            let dz = z - (-4);
            let distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
            let radioCueva = 14 + (Math.random() * 5 - 2.5);

            //boca de la cueva
            let dxMouth = x - 0;
            let dyMouth = y - 10;
            let dzMouth = z - 18;
            let mouthDistance = Math.sqrt(dxMouth*dxMouth + dyMouth*dyMouth + dzMouth*dzMouth);
            let mouthRadio = 20; 

            if (distance > radioCueva && mouthDistance > mouthRadio) {
                //funcion que prohibe generar bloques en frente de steve
                if (Math.abs(x) < 20 && y < 20 && z > 6) continue;

                const block = new THREE.Mesh(blockGeo, blockMat);
                block.position.set(x, y, z);
                block.castShadow = true;
                block.receiveShadow = true;
                block.material.shadowSide = THREE.FrontSide;
                scene.add(block);
            }
        }
    }
}

//suelo
const groundGeo = new THREE.PlaneGeometry(100, 100);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0; 
ground.receiveShadow = true;
ground.material.shadowSide = THREE.FrontSide;
scene.add(ground);

//animacion
function animate() {
    requestAnimationFrame(animate);
    
    //efecto de luz de antorcha
    steveTorchLight.intensity = 40 + Math.random() * 10;
    
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});