(function() {
    if (typeof THREE === 'undefined') return;

    const container = document.getElementById("bg1");
    if (!container) return;

    const lowPowerDevice = (navigator.hardwareConcurrency || 4) <= 4;
    // The canvas is blurred by CSS, so a lower internal resolution is visually
    // equivalent while substantially reducing fragment processing and memory.
    const renderScale = lowPowerDevice ? 0.44 : 0.55;
    container.dataset.renderScale = String(renderScale);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
        preserveDrawingBuffer: false,
        powerPreference: 'low-power'
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(1);
    renderer.setSize(
        Math.ceil(window.innerWidth * renderScale),
        Math.ceil(window.innerHeight * renderScale),
        false
    );
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    const material = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
    const isMobile = window.matchMedia('(max-width: 560px)').matches;
    const isTablet = window.matchMedia('(max-width: 900px)').matches;
    const count = Math.round((isMobile ? 140 : isTablet ? 210 : 150) * (lowPowerDevice ? 0.78 : 1));
    const targetFps = lowPowerDevice ? 20 : (isTablet ? 24 : 30);
    const frameInterval = 1000 / targetFps;

    // LOD
    const geometries = [
        new THREE.CircleGeometry(0.01, 10),
        new THREE.CircleGeometry(0.01, 5),
        new THREE.CircleGeometry(0.01, 3)
    ];
    const meshes = geometries.map((geometry, index) => {
        const mesh = new THREE.InstancedMesh(geometry, material, count);
        mesh.count = 0;
        mesh.frustumCulled = false;
        mesh.userData.lod = ['near', 'middle', 'far'][index];
        return mesh;
    });
    const particleField = new THREE.Group();
    meshes.forEach(mesh => particleField.add(mesh));
    scene.add(particleField);

    const rotations = [];
    const positions = [];
    for (let i = 0; i < count; i++) {
        // 保持分布范围
        positions.push(new THREE.Vector3(1 - Math.random() * 2.5, 1 - Math.random() * 2.5, 1 - Math.random() * 2.5));
        rotations.push(new THREE.Euler(Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI));
    }

    const dummyMatrix = new THREE.Matrix4();
    const dummyQuat = new THREE.Quaternion();
    const dummyScale = new THREE.Vector3(1, 1, 1);
    const worldPosition = new THREE.Vector3();
    const clock = new THREE.Clock();
    let animationFrameId = 0;
    let resizeFrameId = 0;
    let lastFrame = 0;
    let lastLodUpdate = -Infinity;

    function updateLodBuckets() {
        const bucketCounts = [0, 0, 0];
        particleField.updateMatrixWorld(true);

        for (let i = 0; i < count; i++) {
            worldPosition.copy(positions[i]).applyMatrix4(particleField.matrixWorld);
            const distance = worldPosition.distanceTo(camera.position);
            const bucket = distance < 1.35 ? 0 : distance < 2.25 ? 1 : 2;
            dummyQuat.setFromEuler(rotations[i]);
            dummyMatrix.compose(positions[i], dummyQuat, dummyScale);
            meshes[bucket].setMatrixAt(bucketCounts[bucket]++, dummyMatrix);
        }

        meshes.forEach((mesh, index) => {
            mesh.count = bucketCounts[index];
            mesh.instanceMatrix.needsUpdate = true;
        });
        container.dataset.lodCounts = bucketCounts.join(',');
        container.dataset.particleCount = String(count);
        container.dataset.targetFps = String(targetFps);
    }
    updateLodBuckets();

    function animate(timestamp) {
        animationFrameId = requestAnimationFrame(animate);

        if (timestamp - lastFrame < frameInterval) return;
        lastFrame = timestamp;

        let delta = clock.getDelta();
        
        if (delta > 0.1) delta = 0.1;

        particleField.rotation.y += 0.06 * delta;
        particleField.rotation.z += 0.02 * delta;

        if (timestamp - lastLodUpdate > 4000) {
            updateLodBuckets();
            lastLodUpdate = timestamp;
        }
        renderer.render(scene, camera);
    }
    animationFrameId = requestAnimationFrame(animate);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = 0;
        } else if (!animationFrameId) {
            clock.getDelta();
            lastFrame = 0;
            animationFrameId = requestAnimationFrame(animate);
        }
    });

    function resizeRenderer() {
        resizeFrameId = 0;
        const width = window.innerWidth;
        const height = window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(
            Math.ceil(width * renderScale),
            Math.ceil(height * renderScale),
            false
        );
        renderer.render(scene, camera);
    }

    window.addEventListener('resize', () => {
        if (resizeFrameId) cancelAnimationFrame(resizeFrameId);
        resizeFrameId = requestAnimationFrame(resizeRenderer);
    }, { passive: true });
})();
