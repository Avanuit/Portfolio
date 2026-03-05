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
  for (let i = 0; i < 15000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
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

  // Constructor de Planetas
  const createPlanet = (radius, color, distanceX, orbitalSpeed, cameraOffset) => {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({ 
      color: color,
      roughness: 0.7,
      metalness: 0.2,
      emissive: color,
      emissiveIntensity: 0.1
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    const wireframe = new THREE.Mesh(
      new THREE.SphereGeometry(radius + 0.1, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xff0040, wireframe: true, transparent: true, opacity: 0.15 })
    );
    mesh.add(wireframe);
    scene.add(mesh);
    
    return { mesh, distanceX, orbitalSpeed, angle: Math.random() * Math.PI * 2, cameraOffset };
  };

  const sun = createPlanet(15, 0xffaa00, 0, 0, new THREE.Vector3(0, 5, 50)); 
  sun.mesh.material.emissiveIntensity = 1;
  const mercury = createPlanet(2, 0x888888, 35, 0.01, new THREE.Vector3(0, 2, 8));
  const venus = createPlanet(4, 0xe3bb76, 60, 0.008, new THREE.Vector3(0, 3, 14));
  const earth = createPlanet(4.2, 0x2233ff, 90, 0.005, new THREE.Vector3(0, 3, 15));
  const mars = createPlanet(3.5, 0xff3300, 120, 0.004, new THREE.Vector3(0, 2.5, 12));

  const planetObjects = [sun, mercury, venus, earth, mars];

  // Variables dinámicas de cámara y transición
  let currentLookAt = new THREE.Vector3(0, 0, 0); 
  let scrollData = { progress: 0 }; 
  let zoomFactor = { value: 1 }; // Controla el efecto Warp
  let isTransitioning = false;   // Previene clicks múltiples

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

    const currentPlanetPos = new THREE.Vector3();
    planetObjects[currentIndex].mesh.getWorldPosition(currentPlanetPos);
    
    const nextPlanetPos = new THREE.Vector3();
    planetObjects[nextIndex].mesh.getWorldPosition(nextPlanetPos);

    const targetLookAt = currentPlanetPos.clone().lerp(nextPlanetPos, fraction);
    const currentOffset = planetObjects[currentIndex].cameraOffset;
    const nextOffset = planetObjects[nextIndex].cameraOffset;
    
    // Multiplicamos por zoomFactor para el efecto Warp
    const targetOffset = currentOffset.clone().lerp(nextOffset, fraction).multiplyScalar(zoomFactor.value);
    const desiredCameraPos = targetLookAt.clone().add(targetOffset);

    camera.position.lerp(desiredCameraPos, 0.05);
    currentLookAt.lerp(targetLookAt, 0.05);
    camera.lookAt(currentLookAt);

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

  const sections = ['#section-sun', '#section-mercury', '#section-venus', '#section-earth', '#section-mars'];

  sections.forEach((id, index) => {
    const section = document.querySelector(id);
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
  // 4. EVENTOS DE LOS BOTONES (Efecto Warp Interno)
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
      
      // Acercamiento extremo al núcleo del planeta
      gsap.to(zoomFactor, {
        value: 0.02, 
        duration: 1.2,
        ease: "power3.in",
        onComplete: () => {
          // Navegar a la página interna local
          window.location.href = url;
          
          // Reset en caso de usar el botón "Atrás" del navegador
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