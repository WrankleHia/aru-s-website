document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('toggle-sidebar-btn');
    const sidebar = document.querySelector('.right');
    const rotateBtn = document.getElementById('avatar-rotating-btn');
    const toTopBtn = document.getElementById('totop-btn');

    const revealSidebarElements = () => {
        sidebar.classList.remove('sidebar-elements-ready');
        requestAnimationFrame(() => {
            requestAnimationFrame(() => sidebar.classList.add('sidebar-elements-ready'));
        });
    };

    const setSidebarState = (open) => {
        sidebar.classList.toggle('show-sidebar', open);
        toggleBtn.classList.toggle('sidebar-opened', open);
        document.body.classList.toggle('sidebar-visible', open);
        toggleBtn.setAttribute('aria-expanded', String(open));
        toggleBtn.setAttribute('aria-label', open ? '收起侧栏' : '展开侧栏');
        if (open) revealSidebarElements();
        else if (window.matchMedia('(max-width: 900px)').matches) sidebar.classList.remove('sidebar-elements-ready');
    };

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            setSidebarState(!sidebar.classList.contains('show-sidebar'));
        });

        document.addEventListener('click', (e) => {
            if (window.matchMedia('(max-width: 900px)').matches && sidebar.classList.contains('show-sidebar')) {
                const clickedRotateButton = rotateBtn && rotateBtn.contains(e.target);
                const clickedToTopButton = toTopBtn && toTopBtn.contains(e.target);
                if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target) && !clickedRotateButton && !clickedToTopButton) {
                    setSidebarState(false);
                }
            }
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar.classList.contains('show-sidebar')) setSidebarState(false);
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 900) {
                setSidebarState(false);
                sidebar.classList.add('sidebar-elements-ready');
            }
        }, { passive: true });
    }

    window.setTimeout(revealSidebarElements, 70);

    if (rotateBtn) {
        const rotateIcon = rotateBtn.querySelector('.aimg');
        window.setTimeout(() => rotateBtn.classList.remove('is-entry-pending'), 150);
        rotateBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            rotateBtn.classList.remove('is-clicked');
            void rotateBtn.offsetWidth;
            rotateBtn.classList.add('is-clicked');
            const active = rotateBtn.getAttribute('aria-pressed') !== 'true';
            rotateBtn.setAttribute('aria-pressed', String(active));
            if (active) {
                rotateBtn.classList.remove('is-returning');
                rotateBtn.classList.add('is-rotating');
            } else {
                let currentAngle = 0;
                if (rotateIcon) {
                    const transform = window.getComputedStyle(rotateIcon).transform;
                    if (transform && transform !== 'none') {
                        const matrix = new DOMMatrixReadOnly(transform);
                        currentAngle = Math.atan2(matrix.b, matrix.a) * 180 / Math.PI;
                    }
                }
                rotateBtn.style.setProperty('--rotate-return-from', `${currentAngle}deg`);
                rotateBtn.classList.remove('is-rotating');
                rotateBtn.classList.remove('is-returning');
                void rotateBtn.offsetWidth;
                rotateBtn.classList.add('is-returning');
            }
        });
        rotateBtn.addEventListener('animationend', () => rotateBtn.classList.remove('is-clicked'));
        if (rotateIcon) {
            rotateIcon.addEventListener('animationend', (event) => {
                if (event.animationName === 'rotate-control-return') rotateBtn.classList.remove('is-returning');
            });
        }
    }
});
