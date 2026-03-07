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

  const ambientLight = new THREE.AmbientLight(0x404040, 1.5); 
  scene.add(ambientLight);
  const sunLight = new THREE.PointLight(0xff0040, 3, 500);
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);

  const cameraLight = new THREE.PointLight(0xffffff, 1.2, 200);
  camera.add(cameraLight);
  scene.add(camera); 

  // Funciones creadoras
  const createPlanet = (radius, color, distanceX, orbitalSpeed, cameraOffset) => {
    const group = new THREE.Group();
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.7, metalness: 0.2, emissive: color, emissiveIntensity: 0.1 });
    const mesh = new THREE.Mesh(geometry, material);
    const wireframe = new THREE.Mesh(new THREE.SphereGeometry(radius + 0.1, 16, 16), new THREE.MeshBasicMaterial({ color: color, wireframe: true, transparent: true, opacity: 0.15 }));
    mesh.add(wireframe);
    group.add(mesh);
    scene.add(group);
    return { mesh: group, distanceX, orbitalSpeed, angle: Math.random() * Math.PI * 2, cameraOffset };
  };

  const createRingedPlanet = (radius, color, distanceX, orbitalSpeed, cameraOffset) => {
    const group = new THREE.Group();
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.7, metalness: 0.2, emissive: color, emissiveIntensity: 0.1 });
    const planet = new THREE.Mesh(geometry, material);
    const wireframe = new THREE.Mesh(new THREE.SphereGeometry(radius + 0.1, 16, 16), new THREE.MeshBasicMaterial({ color: color, wireframe: true, transparent: true, opacity: 0.15 }));
    planet.add(wireframe);
    group.add(planet);

    const innerRadius = radius + 1.5;
    const outerRadius = radius + 6;
    const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
    const ringMaterial = new THREE.MeshStandardMaterial({ color: color, side: THREE.DoubleSide, transparent: true, opacity: 0.4, roughness: 0.8 });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    const ringWireframe = new THREE.Mesh(new THREE.RingGeometry(innerRadius, outerRadius, 64, 8), new THREE.MeshBasicMaterial({ color: color, wireframe: true, transparent: true, opacity: 0.3 }));
    ring.add(ringWireframe);
    ring.rotation.x = Math.PI / 1.7;
    ring.rotation.y = Math.PI / 8;
    group.add(ring);
    scene.add(group);
    return { mesh: group, distanceX, orbitalSpeed, angle: Math.random() * Math.PI * 2, cameraOffset };
  };

  const createBlackHole = (radius, distanceX, orbitalSpeed, cameraOffset) => {
    const group = new THREE.Group();
    const core = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    group.add(core);
    const disk = new THREE.Mesh(new THREE.RingGeometry(radius + 1, radius + 12, 64), new THREE.MeshBasicMaterial({ color: 0x9333ea, side: THREE.DoubleSide, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending }));
    disk.rotation.x = Math.PI / 2;
    group.add(disk);
    scene.add(group);
    return { mesh: group, distanceX, orbitalSpeed, angle: Math.random() * Math.PI * 2, cameraOffset };
  };

  // Creación del Sistema Solar
  const sun = createPlanet(15, 0xffaa00, 0, 0, new THREE.Vector3(0, 5, 55)); 
  sun.mesh.children[0].material.emissiveIntensity = 1; 
  
  const mercury = createPlanet(2, 0x888888, 35, 0.01, new THREE.Vector3(0, 2, 16));
  const venus = createPlanet(4, 0xe3bb76, 60, 0.008, new THREE.Vector3(0, 3, 24));
  const earth = createPlanet(4.2, 0x4a80f5, 90, 0.005, new THREE.Vector3(0, 3, 25));
  const mars = createPlanet(3.5, 0xff4400, 120, 0.004, new THREE.Vector3(0, 2.5, 22));
  const jupiter = createPlanet(8, 0xe3a857, 170, 0.002, new THREE.Vector3(0, 5, 35));
  const saturn = createRingedPlanet(7, 0xeadaa6, 220, 0.0015, new THREE.Vector3(0, 4, 35));
  const uranus = createPlanet(5, 0x4fd0e7, 270, 0.001, new THREE.Vector3(0, 3, 28));
  const neptune = createPlanet(4.8, 0x4f46e5, 310, 0.0008, new THREE.Vector3(0, 3, 28));
  const blackHole = createBlackHole(10, 400, 0.0005, new THREE.Vector3(0, 15, 50));

  const planetObjects = [sun, mercury, venus, earth, mars, jupiter, saturn, uranus, neptune, blackHole];

  // ==========================================
  // LA MAGIA: SATÉLITES DE HABILIDADES AMPLIADAS
  // ==========================================
  const skillData = [
    { name: 'Flutter & Dart', color: '#00d2ff', dist: 3.5, speed: 0.022, size: 0.15 },
    { name: 'Front-End', color: '#e34f26', dist: 4.2, speed: 0.018, size: 0.15 },
    { name: 'Back-End', color: '#43853d', dist: 4.9, speed: 0.025, size: 0.15 },
    { name: 'Three.js', color: '#ffffff', dist: 5.6, speed: 0.015, size: 0.15 },
    { name: 'Maya & Blender', color: '#0db8d3', dist: 6.3, speed: 0.02, size: 0.15 },
    { name: 'Adobe Suite', color: '#ff0040', dist: 7.0, speed: 0.012, size: 0.15 },
    { name: 'Git & GitHub', color: '#f34f29', dist: 7.7, speed: 0.028, size: 0.15 }
  ];

  const skillMoons = [];
  const labelsContainer = document.getElementById('labels-container');

  skillData.forEach((data, index) => {
    const geo = new THREE.SphereGeometry(data.size, 16, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: data.color, emissive: data.color, emissiveIntensity: 0.8
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.set(0, 0, 0);
    mercury.mesh.add(mesh);

    const label = document.createElement('div');
    label.className = 'absolute text-[9px] md:text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-black/80 border opacity-0 transition-opacity duration-300 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none';
    label.style.borderColor = data.color;
    label.style.color = data.color;
    label.style.boxShadow = `0 0 10px ${data.color}40`;
    label.textContent = data.name;
    labelsContainer.appendChild(label);

    skillMoons.push({
      index: index,
      mesh,
      label,
      angle: Math.random() * Math.PI * 2,
      dist: data.dist,
      speed: data.speed,
      isVisible: false
    });
  });

  let scrollData = { progress: 0 }; 
  let zoomFactor = { value: 1 }; 
  let isTransitioning = false;   
  let viewOffset = { x: 0, z: 0 };

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

    // Animación de los 7 Satélites (Más orgánica y distribuida)
    skillMoons.forEach(moon => {
      moon.angle += moon.speed;
      moon.mesh.position.x = Math.cos(moon.angle) * moon.dist;
      moon.mesh.position.z = Math.sin(moon.angle) * moon.dist;
      // Esto hace que cada luna oscile verticalmente en patrones y alturas diferentes
      moon.mesh.position.y = Math.sin(moon.angle * (1.5 + moon.index * 0.3)) * (0.8 + moon.index * 0.2); 

      if (moon.isVisible) {
        const vector = new THREE.Vector3();
        moon.mesh.getWorldPosition(vector);
        vector.project(camera); 

        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (vector.y * -0.5 + 0.5) * window.innerHeight;

        if (vector.z > 1) {
          moon.label.style.display = 'none';
        } else {
          moon.label.style.display = 'block';
          moon.label.style.left = `${x}px`;
          moon.label.style.top = `${y - 25}px`; 
        }
      }
    });

    // Lógica de la Cámara Cinemática
    const currentIndex = Math.floor(scrollData.progress);
    const nextIndex = Math.min(currentIndex + 1, planetObjects.length - 1);
    const fraction = scrollData.progress - currentIndex; 

    let easedFraction = 0;
    if (fraction < 0.25) { easedFraction = 0; } 
    else if (fraction > 0.75) { easedFraction = 1; } 
    else {
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

    const baseTargetLookAt = currentPlanetPos.clone().lerp(nextPlanetPos, easedFraction);
    const baseTargetOffset = currentWorldOffset.lerp(nextWorldOffset, easedFraction).multiplyScalar(zoomFactor.value);
    const baseCameraPos = baseTargetLookAt.clone().add(baseTargetOffset);

    const directionToPlanet = baseTargetLookAt.clone().sub(baseCameraPos).normalize();
    const rightVector = directionToPlanet.clone().cross(new THREE.Vector3(0, 1, 0)).normalize();

    const finalTargetLookAt = baseTargetLookAt.clone().add(rightVector.clone().multiplyScalar(viewOffset.x));
    const finalCameraPos = baseCameraPos.clone()
      .add(rightVector.clone().multiplyScalar(viewOffset.x))
      .add(directionToPlanet.clone().multiplyScalar(viewOffset.z));

    const cameraSpeed = isTransitioning ? 0.08 : 0.05;
    camera.position.lerp(finalCameraPos, cameraSpeed);
    camera.lookAt(finalTargetLookAt);

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
    scrollTrigger: { trigger: "body", start: "top top", end: "bottom bottom", scrub: 1.5 }
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
      gsap.to(section, { scrollTrigger: { trigger: section, start: "top top", end: "bottom 50%", scrub: true }, opacity: 0, y: -50 });
    } else {
      gsap.set(section, { opacity: 0, y: 50 }); 
      const tl = gsap.timeline({ scrollTrigger: { trigger: section, start: "top 85%", end: "bottom 15%", scrub: true } });
      tl.to(section, { opacity: 1, y: 0, duration: 0.3 })
        .to(section, { opacity: 1, y: 0, duration: 0.4 })
        .to(section, { opacity: 0, y: -50, duration: 0.3 });
    }
  });

  // ==========================================
  // 4. ANIMACIONES ESPECÍFICAS Y BOTONES
  // ==========================================

  // Evento para "Acerca de Mí" (Planeta 1)
  const btnAboutMe = document.getElementById('btn-about-me');
  const btnCloseAbout = document.getElementById('btn-close-about');
  
  if(btnAboutMe) {
    btnAboutMe.addEventListener('click', () => {
      isTransitioning = true;
      document.body.style.overflow = 'hidden'; 
      
      gsap.to('.content-overlay', { opacity: 0, duration: 0.5, pointerEvents: 'none' });
      gsap.to(viewOffset, { x: 8, z: -6, duration: 1.5, ease: "power3.inOut" });
      gsap.to('#about-panel', { x: 0, duration: 1.2, ease: "power3.out", delay: 0.5 });

      // ESTALLIDO DE LAS 7 LUNAS DE HABILIDADES
      skillMoons.forEach((moon, index) => {
        moon.isVisible = true;
        gsap.to(moon.mesh.scale, { x: 1, y: 1, z: 1, duration: 1, delay: 0.8 + (index * 0.1), ease: "back.out(1.7)" });
        setTimeout(() => { moon.label.style.opacity = '1'; }, 900 + (index * 100));
      });
    });
  }

  if(btnCloseAbout) {
    btnCloseAbout.addEventListener('click', () => {
      gsap.to('#about-panel', { x: '100%', duration: 0.8, ease: "power3.in" });
      gsap.to(viewOffset, { x: 0, z: 0, duration: 1.5, ease: "power3.inOut" });
      
      skillMoons.forEach((moon) => {
        gsap.to(moon.mesh.scale, { x: 0, y: 0, z: 0, duration: 0.5, ease: "power2.in" });
        moon.label.style.opacity = '0';
        setTimeout(() => { moon.isVisible = false; }, 500);
      });

      gsap.to('.content-overlay', { opacity: 1, duration: 0.5, delay: 0.8, pointerEvents: 'auto', onComplete: () => {
        document.body.style.overflow = '';
        isTransitioning = false;
      }});
    });
  }

  // Evento para los demás proyectos (Efecto Warp)
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