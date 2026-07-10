/* ============================================================
   ORBITAL PANEL CO. — main.js
   Three.js rotating Earth + satellite orbit animations
   ============================================================ */

(function () {

  /* ── THREE.JS GLOBE ─────────────────────────────────────── */
  const canvas  = document.getElementById('globe-canvas');
  if (!canvas) return;

  const W = canvas.parentElement.clientWidth;
  const H = canvas.parentElement.clientHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 1000);
  camera.position.z = 2.8;

  /* Stars */
  const starGeo = new THREE.BufferGeometry();
  const starCount = 2000;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i++) {
    starPos[i] = (Math.random() - 0.5) * 200;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.18, transparent: true, opacity: 0.7 });
  scene.add(new THREE.Points(starGeo, starMat));

  /* Earth texture — uses NASA Blue Marble (public domain).
     For fully offline hosting, download this image and reference it locally:
     https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg  */
  const texLoader = new THREE.TextureLoader();

  const EARTH_TEX = 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg';
  const BUMP_TEX  = 'https://unpkg.com/three-globe/example/img/earth-topology.png';
  const CLOUDS_TEX = 'https://unpkg.com/three-globe/example/img/earth-water.png';

  let earthMesh, cloudMesh;

  texLoader.load(EARTH_TEX, function (earthMap) {
    texLoader.load(BUMP_TEX, function (bumpMap) {

      /* Earth sphere */
      const geo = new THREE.SphereGeometry(1, 64, 64);
      const mat = new THREE.MeshPhongMaterial({
        map:         earthMap,
        bumpMap:     bumpMap,
        bumpScale:   0.04,
        specularMap: bumpMap,
        specular:    new THREE.Color(0x1a3a5c),
        shininess:   8,
      });
      earthMesh = new THREE.Mesh(geo, mat);
      scene.add(earthMesh);

      /* Atmosphere glow */
      const atmGeo = new THREE.SphereGeometry(1.015, 64, 64);
      const atmMat = new THREE.MeshPhongMaterial({
        color:       0x0066cc,
        transparent: true,
        opacity:     0.10,
        side:        THREE.FrontSide,
      });
      scene.add(new THREE.Mesh(atmGeo, atmMat));

      /* Outer glow halo */
      const haloGeo = new THREE.SphereGeometry(1.08, 64, 64);
      const haloMat = new THREE.MeshPhongMaterial({
        color:       0x0044aa,
        transparent: true,
        opacity:     0.05,
        side:        THREE.BackSide,
      });
      scene.add(new THREE.Mesh(haloGeo, haloMat));

      /* Cloud layer */
      texLoader.load(CLOUDS_TEX, function (cloudMap) {
        const cloudGeo = new THREE.SphereGeometry(1.008, 64, 64);
        const cloudMat = new THREE.MeshPhongMaterial({
          map:         cloudMap,
          transparent: true,
          opacity:     0.20,
        });
        cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
        scene.add(cloudMesh);
      });

    });
  });

  /* Lighting */
  const ambient  = new THREE.AmbientLight(0xffffff, 0.25);
  scene.add(ambient);

  const sunLight = new THREE.DirectionalLight(0xfff5e0, 1.2);
  sunLight.position.set(5, 3, 5);
  scene.add(sunLight);

  const rimLight = new THREE.DirectionalLight(0x0066ff, 0.25);
  rimLight.position.set(-4, -1, -3);
  scene.add(rimLight);

  /* Resize handler */
  window.addEventListener('resize', () => {
    const pw = canvas.parentElement.clientWidth;
    const ph = canvas.parentElement.clientHeight;
    renderer.setSize(pw, ph);
    camera.aspect = pw / ph;
    camera.updateProjectionMatrix();
  });

  /* Animate */
  let frame = 0;
  function animate() {
    requestAnimationFrame(animate);
    frame++;
    if (earthMesh)  earthMesh.rotation.y  += 0.0012;
    if (cloudMesh)  cloudMesh.rotation.y  += 0.0008;
    renderer.render(scene, camera);
  }
  animate();


  /* ── CSS SATELLITE PATHS ─────────────────────────────────── */
  /* Satellites are CSS-animated via the orbit divs in HTML.
     Here we add a subtle pulsing glow to each satellite dot. */

  const sats = document.querySelectorAll('.sat-dot');
  sats.forEach((dot, i) => {
    dot.style.animationDelay = `${i * 1.3}s`;
  });


  /* ── SCROLL-TRIGGERED COUNTERS ───────────────────────────── */
  function animateCounter(el, target, suffix, duration) {
    const start = performance.now();
    const update = (now) => {
      const elapsed = Math.min((now - start) / duration, 1);
      const eased   = 1 - Math.pow(1 - elapsed, 3);
      const val     = Math.round(eased * target);
      el.textContent = (target >= 1000 ? val.toLocaleString() : val) + suffix;
      if (elapsed < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  const counterEls = document.querySelectorAll('[data-count]');
  const observer   = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.counted) {
        entry.target.dataset.counted = '1';
        const target   = parseFloat(entry.target.dataset.count);
        const suffix   = entry.target.dataset.suffix || '';
        const duration = parseInt(entry.target.dataset.dur || '1800');
        animateCounter(entry.target, target, suffix, duration);
      }
    });
  }, { threshold: 0.5 });

  counterEls.forEach(el => observer.observe(el));


  /* ── HEADER SCROLL OPACITY ───────────────────────────────── */
  const header = document.querySelector('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      header.style.background = 'rgba(0,0,0,0.92)';
    } else {
      header.style.background = 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)';
    }
  }, { passive: true });


  /* ── SECTION FADE IN ─────────────────────────────────────── */
  const fadeEls = document.querySelectorAll('.fade-in');
  const fadeObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        fadeObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  fadeEls.forEach(el => fadeObs.observe(el));

})();
