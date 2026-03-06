document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. THREE.JS SCENE SETUP
  // ==========================================
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  document.getElementById('canvas-container').appendChild(renderer.domElement);

  // Estrellas
  const starGeometry = new THREE.BufferGeometry();
  const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
  const starVertices = [];
  for (let i = 0; i < 20000; i++) {
    const x = (Math.random() - 0.5) * 3000;
    const y = (Math.random() - 0.5) * 3000;
    const z = (Math.random() - 0.5) * 3000;
    starVertices.push(x, y, z);
  }
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  // Luces
  const ambientLight = new THREE.AmbientLight(0x404040, 1.5); 
  scene.add(ambientLight);
  const sunLight = new THREE.PointLight(0xff0040, 3, 500);
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);

  const cameraLight = new THREE.PointLight(0xffffff, 1.2, 200);
  camera.add(cameraLight);
  scene.add(camera); 

  // Función: Planetas Estándar
  const createPlanet = (radius, color, distanceX, orbitalSpeed, cameraOffset) => {
    const group = new THREE.Group();
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({ 
      color: color, roughness: 0.7, metalness: 0.2, emissive: color, emissiveIntensity: 0.1
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    const wireframe = new THREE.Mesh(
      new THREE.SphereGeometry(radius + 0.1, 16, 16),
      new THREE.MeshBasicMaterial({ color: color, wireframe: true, transparent: true, opacity: 0.15 })
    );
    mesh.add(wireframe);
    group.add(mesh);
    scene.add(group);
    
    return { mesh: group, distanceX, orbitalSpeed, angle: Math.random() * Math.PI * 2, cameraOffset };
  };

  // Función: Planeta con Anillos (Saturno)
  const createRingedPlanet = (radius, color, distanceX, orbitalSpeed, cameraOffset) => {
    const group = new THREE.Group();
    
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({ 
      color: color, roughness: 0.7, metalness: 0.2, emissive: color, emissiveIntensity: 0.1
    });
    const planet = new THREE.Mesh(geometry, material);
    
    const wireframe = new THREE.Mesh(
      new THREE.SphereGeometry(radius + 0.1, 16, 16),
      new THREE.MeshBasicMaterial({ color: color, wireframe: true, transparent: true, opacity: 0.15 })
    );
    planet.add(wireframe);
    group.add(planet);

    // Sistema de Anillos
    const innerRadius = radius + 1.5;
    const outerRadius = radius + 6;
    
    const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: color, side: THREE.DoubleSide, transparent: true, opacity: 0.4, roughness: 0.8
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    
    const ringWireframe = new THREE.Mesh(
      new THREE.RingGeometry(innerRadius, outerRadius, 64, 8),
      new THREE.MeshBasicMaterial({ color: color, wireframe: true, transparent: true, opacity: 0.3 })
    );
    ring.add(ringWireframe);

    ring.rotation.x = Math.PI / 1.7;
    ring.rotation.y = Math.PI / 8;
    group.add(ring);

    scene.add(group);
    return { mesh: group, distanceX, orbitalSpeed, angle: Math.random() * Math.PI * 2, cameraOffset };
  };

  // Función: Agujero Negro
  const createBlackHole = (radius, distanceX, orbitalSpeed, cameraOffset) => {
    const group = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    group.add(core);

    const disk = new THREE.Mesh(
      new THREE.RingGeometry(radius + 1, radius + 12, 64),
      new THREE.MeshBasicMaterial({ 
        color: 0x9333ea, side: THREE.DoubleSide, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending
      })
    );
    disk.rotation.x = Math.PI / 2;
    group.add(disk);

    scene.add(group);
    return { mesh: group, distanceX, orbitalSpeed, angle: Math.random() * Math.PI * 2, cameraOffset };
  };

  // ==========================================
  // Creación del Sistema Solar (CON ZOOM CORREGIDO)
  // ==========================================
  const sun = createPlanet(15, 0xffaa00, 0, 0, new THREE.Vector3(0, 5, 55)); 
  sun.mesh.children[0].material.emissiveIntensity = 1; 
  
  // Aumentamos los valores en el eje Z (el último número de Vector3) para alejar la cámara
  const mercury = createPlanet(2, 0x888888, 35, 0.01, new THREE.Vector3(0, 2, 16)); // Antes 8
  const venus = createPlanet(4, 0xe3bb76, 60, 0.008, new THREE.Vector3(0, 3, 24)); // Antes 14
  const earth = createPlanet(4.2, 0x2233ff, 90, 0.005, new THREE.Vector3(0, 3, 25)); // Antes 15
  const mars = createPlanet(3.5, 0xff3300, 120, 0.004, new THREE.Vector3(0, 2.5, 22)); // Antes 20
  
  // Gigantes gaseosos también reajustados para verse imponentes pero no recortados
  const jupiter = createPlanet(8, 0xd8ca9d, 170, 0.002, new THREE.Vector3(0, 5, 35)); 
  const saturn = createRingedPlanet(7, 0xeadaa6, 220, 0.0015, new THREE.Vector3(0, 4, 35)); 
  const uranus = createPlanet(5, 0x4fd0e7, 270, 0.001, new THREE.Vector3(0, 3, 28)); 
  const neptune = createPlanet(4.8, 0x274687, 310, 0.0008, new THREE.Vector3(0, 3, 28)); 
  
  const blackHole = createBlackHole(10, 400, 0.0005, new THREE.Vector3(0, 15, 50)); 

  const planetObjects = [sun, mercury, venus, earth, mars, jupiter, saturn, uranus, neptune, blackHole];

  let scrollData = { progress: 0 }; 
  let zoomFactor = { value: 1 }; 
  let isTransitioning = false;   

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ==========================================
  // 2. ANIMATION LOOP 
  // ==========================================
  function animate() {
    requestAnimationFrame(animate);
    
    planetObjects.forEach(p => {
      if (p.orbitalSpeed > 0) {
        p.angle += p.orbitalSpeed;
        p.mesh.position.x = Math.cos(p.angle) * p.distanceX;
        p.mesh.position.z = Math.sin(p.angle) * p.distanceX;
      }
      p.mesh.rotation.y += 0.005; 
    });

    stars.rotation.y += 0.0002;

    const currentIndex = Math.floor(scrollData.progress);
    const nextIndex = Math.min(currentIndex + 1, planetObjects.length - 1);
    const fraction = scrollData.progress - currentIndex; 

    // La "Zona Magnética"
    let easedFraction = 0;
    if (fraction < 0.25) {
      easedFraction = 0; 
    } else if (fraction > 0.75) {
      easedFraction = 1; 
    } else {
      let t = (fraction - 0.25) / 0.5;
      easedFraction = t * t * (3 - 2 * t);
    }

    const currentPlanetPos = new THREE.Vector3();
    planetObjects[currentIndex].mesh.getWorldPosition(currentPlanetPos);
    
    const nextPlanetPos = new THREE.Vector3();
    planetObjects[nextIndex].mesh.getWorldPosition(nextPlanetPos);

    const currentWorldOffset = planetObjects[currentIndex].cameraOffset.clone();
    if (planetObjects[currentIndex].orbitalSpeed > 0) {
      currentWorldOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), -planetObjects[currentIndex].angle);
    }

    const nextWorldOffset = planetObjects[nextIndex].cameraOffset.clone();
    if (planetObjects[nextIndex].orbitalSpeed > 0) {
      nextWorldOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), -planetObjects[nextIndex].angle);
    }

    const targetLookAt = currentPlanetPos.clone().lerp(nextPlanetPos, easedFraction);
    const targetOffset = currentWorldOffset.lerp(nextWorldOffset, easedFraction).multiplyScalar(zoomFactor.value);
    const desiredCameraPos = targetLookAt.clone().add(targetOffset);

    const cameraSpeed = isTransitioning ? 0.2 : 0.05;
    camera.position.lerp(desiredCameraPos, cameraSpeed);
    
    camera.lookAt(targetLookAt);

    renderer.render(scene, camera);
  }
  animate();

  // ==========================================
  // 3. GSAP SCROLL ANIMATIONS
  // ==========================================
  gsap.registerPlugin(ScrollTrigger);

  gsap.set('#section-sun', { opacity: 1, y: 0 });

  gsap.to(scrollData, {
    progress: planetObjects.length - 1,
    ease: "none",
    scrollTrigger: {
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      scrub: 1.5 
    }
  });

  const sections = [
    '#section-sun', '#section-mercury', '#section-venus', '#section-earth', 
    '#section-mars', '#section-jupiter', '#section-saturn', '#section-uranus', 
    '#section-neptune', '#section-blackhole'
  ];

  sections.forEach((id, index) => {
    const section = document.querySelector(id);
    if (!section) return; 

    if (index === 0) {
      gsap.to(section, {
        scrollTrigger: { trigger: section, start: "top top", end: "bottom 50%", scrub: true },
        opacity: 0, y: -50
      });
    } else {
      gsap.set(section, { opacity: 0, y: 50 }); 
      const tl = gsap.timeline({
        scrollTrigger: { trigger: section, start: "top 85%", end: "bottom 15%", scrub: true }
      });
      tl.to(section, { opacity: 1, y: 0, duration: 0.3 })
        .to(section, { opacity: 1, y: 0, duration: 0.4 })
        .to(section, { opacity: 0, y: -50, duration: 0.3 });
    }
  });

  // ==========================================
  // 4. EVENTOS DE LOS BOTONES (Efecto Warp)
  // ==========================================
  const buttons = document.querySelectorAll('.project-btn');
  
  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (isTransitioning) return;
      isTransitioning = true;
      
      const url = e.target.getAttribute('data-url');
      
      document.body.style.overflow = 'hidden';
      gsap.to('.content-overlay', { opacity: 0, duration: 0.4 });
      
      gsap.to(zoomFactor, {
        value: 0.02, 
        duration: 1.2,
        ease: "power3.in",
        onComplete: () => {
          window.location.href = url;
          
          setTimeout(() => {
            zoomFactor.value = 1;
            gsap.to('.content-overlay', { opacity: 1, duration: 0.5 });
            document.body.style.overflow = '';
            isTransitioning = false;
          }, 800);
        }
      });
    });
  });
});