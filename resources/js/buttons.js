window.addEventListener('DOMContentLoaded', function() {
    const totopbtn = document.getElementById('totop-btn');
    const totopbtnimg = document.getElementById('totop-btn-arrow');
    const progres = document.getElementById('progress-bar');
    const upperbar = document.getElementById("upper-bar");
    const upperbarcont = document.getElementById("upper-bar-contents");
    let navWasHidden = false;
    let returnTimer;
    let scrollFrame = 0;
    let maxScroll = 1;

    if (!totopbtn || !totopbtnimg || !progres || !upperbar || !upperbarcont) return;

    const updateScrollRange = function() {
        maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    };

    const updateScrollUI = function() {
        scrollFrame = 0;
        const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
        progres.style.transform = `scaleX(${progress})`;
        progres.classList.toggle('is-visible', progress > 0.0001);
        const isScrolled = document.documentElement.scrollTop > 200;
        totopbtn.style.scale = isScrolled ? 1 : 0;
        upperbar.classList.toggle('nav-hidden', isScrolled);
        if (navWasHidden && !isScrolled) {
            upperbar.classList.remove('nav-returning');
            void upperbar.offsetWidth;
            upperbar.classList.add('nav-returning');
            clearTimeout(returnTimer);
            returnTimer = setTimeout(() => upperbar.classList.remove('nav-returning'), 950);
        }
        navWasHidden = isScrolled;
    };

    const requestScrollUIUpdate = function() {
        if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollUI);
    };

    totopbtn.addEventListener("mouseenter", function() {
        totopbtnimg.style.opacity = 0.8;
    });
    totopbtn.addEventListener("mouseleave", function() {
        totopbtnimg.style.opacity = 0.4;
    });
    totopbtn.addEventListener("click", function() {
        window.scrollTo({
            left: 0,
            top: 0,
            behavior: 'smooth'
        });
        totopbtnimg.style.opacity = 0.4;
    });

    window.addEventListener('scroll', requestScrollUIUpdate, { passive: true });
    window.addEventListener('resize', () => {
        updateScrollRange();
        requestScrollUIUpdate();
    }, { passive: true });
    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(() => {
            updateScrollRange();
            requestScrollUIUpdate();
        }).observe(document.documentElement);
    }
    updateScrollRange();
    updateScrollUI();
    requestAnimationFrame(() => upperbar.classList.add('nav-ready'));
});
