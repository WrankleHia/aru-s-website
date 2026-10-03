(function() { 
    if (typeof THREE === 'undefined') return; 

    let mesh, helper, effect; 
    let isRotating = 0; 
    let rotatingSPD = 0;
    const clock = new THREE.Clock(); 
    let prevCameraRotationY = 0;
    let blinkTimer = Math.random() * 3 + 2; 
    let isBlinking = false;
    let blinkWeight = 0;

    const container = document.getElementById('aru-avatar'); 
    if (!container) return; 

    container.style.position = 'relative';

    const loadingOverlay = document.createElement('div');
    loadingOverlay.style.position = 'absolute';
    loadingOverlay.style.top = '20px'; 
    loadingOverlay.style.left = '0';
    loadingOverlay.style.width = '100%';
    loadingOverlay.style.height = 'calc(100% - 20px)';
    loadingOverlay.style.borderRadius = '50%'; 
    loadingOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.45)'; 
    loadingOverlay.style.backdropFilter = 'blur(10px)'; 
    loadingOverlay.style.webkitBackdropFilter = 'blur(12px)';
    loadingOverlay.style.display = 'flex';
    loadingOverlay.style.flexDirection = 'column';
    loadingOverlay.style.justifyContent = 'center';
    loadingOverlay.style.alignItems = 'center';
    loadingOverlay.style.color = '#fff';
    loadingOverlay.style.fontSize = '14px';
    loadingOverlay.style.zIndex = '10'; 
    loadingOverlay.style.transition = 'opacity 0.5s ease-out';
    
    loadingOverlay.innerHTML = `
        <div style="position: relative; top: 15px; display: flex; flex-direction: column; align-items: center;">
            <span style="margin-bottom: 6px; letter-spacing: 1px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 0 8px rgba(255, 255, 255, 0.5);">3D阿噜(Beta)加载中</span>
            <span id="aru-load-progress" style="font-weight: bold; font-size: 18px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 0 8px rgba(255, 255, 255, 0.5);">0%</span>
            
            <div style="width: 120px; height: 6px; background-color: rgba(255, 255, 255, 0.2); border-radius: 4px; margin-top: 8px; overflow: hidden; box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);">
                <div id="aru-load-progress-bar" style="width: 0%; height: 100%; background-color: rgba(255, 255, 255, 0.9); border-radius: 4px; transition: width 0.3s ease-out; box-shadow: 0 0 8px rgba(255,255,255,0.6);"></div>
            </div>
        </div>
    `;
    container.appendChild(loadingOverlay);

    const manager = new THREE.LoadingManager();
    
    manager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
        const percent = Math.floor((itemsLoaded / itemsTotal) * 100);
        const progressEl = document.getElementById('aru-load-progress');
        const progressBarEl = document.getElementById('aru-load-progress-bar');
        
        if (progressEl) progressEl.innerText = percent + '%';
        if (progressBarEl) progressBarEl.style.width = percent + '%';
    };

    manager.onLoad = function () {
        const progressEl = document.getElementById('aru-load-progress');
        const progressBarEl = document.getElementById('aru-load-progress-bar');
        
        if (progressEl) progressEl.innerText = '100%';
        if (progressBarEl) progressBarEl.style.width = '100%';
        
        if (mesh) {
            mesh.visible = true; 
        }

        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
        }, 500);
    };

    const scene = new THREE.Scene(); 
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000); 
    camera.position.set(0, 0, 0.8); 

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); 
    renderer.setSize(200, 200); 
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 
    container.appendChild(renderer.domElement); 

    effect = new THREE.OutlineEffect(renderer, { 
        defaultThickness: 0.001, 
        defaultColor: [0, 0, 0], 
        defaultAlpha: 0.08
    }); 

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.05); 
    scene.add(ambientLight); 

    new THREE.TextureLoader().load('https://cdn.wranklehia.cn:6343/resources/images/aru-avatar-bg.webp', (tex) => { 
        scene.background = tex; 
    }); 

    const controls = new THREE.OrbitControls(camera, renderer.domElement); 
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minPolarAngle = Math.PI / 2.5;
    controls.maxPolarAngle = Math.PI / 1.8;
    
    controls.enableZoom = false;

    helper = new THREE.MMDAnimationHelper({ 
        afterglow: 2.0,
        physics: true,
        unitStep: 1 / 60 
    }); 

    const loader = new THREE.MMDLoader(manager); 
    loader.setCrossOrigin('anonymous');
    
    let modelLoadStarted = false;
    const sidebar = document.getElementById('profile-sidebar');

    function startModelLoad() {
        if (modelLoadStarted || typeof Ammo === 'undefined') return;
        modelLoadStarted = true;
        Ammo().then(function(AmmoLib) {
            window.Ammo = AmmoLib;
            loadMMD();
        });
    }

    function scheduleModelLoad() {
        const compactSidebarHidden = window.matchMedia('(max-width: 900px)').matches &&
            sidebar && !sidebar.classList.contains('show-sidebar');
        if (compactSidebarHidden) return;
        if ('requestIdleCallback' in window) requestIdleCallback(startModelLoad, { timeout: 1400 });
        else setTimeout(startModelLoad, 350);
    }

    scheduleModelLoad();
    if (sidebar) new MutationObserver(scheduleModelLoad).observe(sidebar, { attributes: true, attributeFilter: ['class'] });

function loadMMD() { 
        const pmxUrl = 'https://cdn.wranklehia.cn:6343/resources/models/arupmx/aru.pmx';
        const baseUrl = 'https://cdn.wranklehia.cn:6343/resources/models/arupmx/anims/idle/';

        const vmdFiles = [
            'breathe.vmd',
            'idle3.vmd'
        ];

        loader.load(pmxUrl, function(object) { 
            mesh = object; 
            mesh.visible = false; 

            mesh.traverse(function(child) { 
                if (child.isMesh && child.material) { 
                    const materials = Array.isArray(child.material) ? child.material : [child.material]; 
                    materials.forEach(m => { if(m.emissive) m.emissive.setScalar(0); }); 
                } 
            });
            mesh.position.set(0, -1.45, 0); 
            mesh.scale.set(0.1, 0.1, 0.1);
            scene.add(mesh); 
            mesh.visible = true;

            const loadPromises = vmdFiles.map(filename => {
                return new Promise((resolve) => {
                    loader.loadAnimation(baseUrl + filename, mesh, (anim) => resolve(anim));
                });
            });

            Promise.all(loadPromises).then((anims) => {
                helper.add(mesh, { animation: anims, physics: true }); 
                const mixer = helper.objects.get(mesh).mixer;
                const actions = anims.map(anim => mixer.clipAction(anim));

                const breatheAction = actions[0];
                breatheAction.setLoop(THREE.LoopRepeat);
                breatheAction.play(); 

                const randomActions = actions.slice(1);
                randomActions.forEach(action => {
                    action.setLoop(THREE.LoopOnce, 1);
                    action.clampWhenFinished = true;
                });
                
                let currentRandomAction = null;

                function triggerRandomAction() {
                    if (randomActions.length === 0) return; 

                    const randomIndex = Math.floor(Math.random() * randomActions.length);
                    currentRandomAction = randomActions[randomIndex];
                    
                    currentRandomAction.reset().play();
                    breatheAction.crossFadeTo(currentRandomAction, 0.5, false);
                }

                mixer.addEventListener('finished', (e) => {
                    if (e.action === currentRandomAction) {

                        currentRandomAction.crossFadeTo(breatheAction, 0.5, false);
                        breatheAction.play(); 
                        currentRandomAction = null;
                        
                        const randomDelay = Math.random() * 4000 + 3000;
                        setTimeout(triggerRandomAction, randomDelay);
                    }
                });

                setTimeout(triggerRandomAction, Math.random() * 2000 + 2000);
                prevCameraRotationY = controls.getAzimuthalAngle();
            });
        }); 
    }

    let animationFrameId = 0;

    function shouldRender() {
        return !document.hidden && !(window.matchMedia('(max-width: 900px)').matches && sidebar && !sidebar.classList.contains('show-sidebar'));
    }

function animate() {
        animationFrameId = 0;
        if (!shouldRender()) return;
        animationFrameId = requestAnimationFrame(animate);
        let delta = clock.getDelta(); 
        if (delta > 0.05) delta = 0.05; 

        controls.update(); 

        if (mesh && helper) {
            const currentCameraRotationY = controls.getAzimuthalAngle();
            let deltaRotationY = currentCameraRotationY - prevCameraRotationY;
            if (deltaRotationY > 0.2) deltaRotationY = 0.2;
            if (deltaRotationY < -0.2) deltaRotationY = -0.2;
            
            const acceleration = 0.005;
            const maxSpeed = 0.005;

            if (isRotating == 1) { 
                if (rotatingSPD < maxSpeed) rotatingSPD += acceleration * delta;
            } else { 
                if (rotatingSPD > 0) { 
                    rotatingSPD -= acceleration * delta; 
                    if (rotatingSPD < 0) rotatingSPD = 0; 
                } 
            }

            mesh.rotation.y -= (rotatingSPD + deltaRotationY * 0.3);
            prevCameraRotationY = currentCameraRotationY;
            
            helper.update(delta); 
            const blinkIndex = mesh.morphTargetDictionary['まばたき'];
            if (blinkIndex !== undefined) {
                if (!isBlinking) {
                    blinkTimer -= delta;
                    if (blinkTimer <= 0) {
                        isBlinking = true;
                        blinkTimer = Math.random() * 3 + 2; 
                    }
                } else {
                    blinkWeight += delta * 15; 
                    if (blinkWeight >= 1.5) isBlinking = false; 
                    
                    let actualWeight = Math.sin(Math.min(blinkWeight, 1) * Math.PI);
                    mesh.morphTargetInfluences[blinkIndex] = Math.max(0, actualWeight);
                }
                
                if (!isBlinking && blinkWeight > 0) {
                     blinkWeight = 0;
                     mesh.morphTargetInfluences[blinkIndex] = 0;
                }
            }
        } 
        effect.render(scene, camera); 
    }
    function syncRendering() {
        if (shouldRender()) {
            if (!animationFrameId) {
                clock.getDelta();
                animationFrameId = requestAnimationFrame(animate);
            }
        } else if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = 0;
        }
    }

    syncRendering();
    document.addEventListener('visibilitychange', syncRendering);
    window.addEventListener('resize', () => {
        scheduleModelLoad();
        syncRendering();
    }, { passive: true });
    if (sidebar) new MutationObserver(syncRendering).observe(sidebar, { attributes: true, attributeFilter: ['class'] });

    window.addEventListener('DOMContentLoaded', () => { 
        const btn = document.getElementById("avatar-rotating-btn"); 
        if (btn) btn.onclick = () => isRotating = (isRotating === 1 ? 0 : 1); 
    }); 
})();
