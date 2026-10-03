var back = document.getElementById("back");
back.style.position = "fixed";
back.style.zIndex = 0;
back.style.imageRendering = 'pixelated';

var sprite = document.createElement("canvas");
sprite.style.imageRendering = 'pixelated';
var img = new Image();
img.imageRendering = 'pixelated';

var frame = 0;
var face = true;
var position = { x: 0, y: 0 };
var vect = { x: 0, y: 0 };
var destination = null;
var lastTime = 0;

var animationTimer = 0; 
var frameDuration = 120;

var isRed = false;
var clickSound = new Audio("https://cdn.wranklehia.cn:6343/resources/sounds/hurt.mp3");
img.crossOrigin = "anonymous";
img.src = "https://cdn.wranklehia.cn:6343/resources/images/arusprite.png";


var frameWidth = 16; 
var frameHeight = 34;

var renderWidth = 50;
var renderHeight = 106; 


function resizeCanvas(resetPosition) {
    var oldWidth = back.width;
    var oldHeight = back.height;
    var nextWidth = document.documentElement.clientWidth || window.innerWidth;
    var nextHeight = document.documentElement.clientHeight || window.innerHeight;

    // Mobile browser chrome changes only the viewport height while scrolling.
    // Keep the backing store stable during that transient resize.
    if (!resetPosition && oldWidth === nextWidth) return false;

    back.width = nextWidth;
    back.height = nextHeight;

    var bctx = back.getContext("2d");
    if (bctx) {
        bctx.imageSmoothingEnabled = false; 
    }

    if (resetPosition || !oldWidth || !oldHeight) {
        position.x = back.width / 2 - (renderWidth / 2);
        position.y = back.height / 2 - (renderHeight / 2);
    } else {
        // Preserve the character's visual position when mobile browser chrome
        // changes the viewport height during scrolling.
        if (oldWidth !== nextWidth) position.x *= nextWidth / oldWidth;
        position.x = Math.max(0, Math.min(position.x, back.width - renderWidth));
        position.y = Math.max(0, Math.min(position.y, back.height - renderHeight));
    }

    return true;
}

resizeCanvas(true);

function isModalOpen() {
    var articleModal = document.getElementById('article-modal');
    var msgModal = document.getElementById('msg-modal');
    var colModal = document.getElementById('collections-modal');
    return (articleModal && articleModal.classList.contains('active')) ||
           (msgModal && msgModal.classList.contains('active')) || 
           (colModal && colModal.classList.contains('active'));
}

img.addEventListener("load", function () {
    var bctx = back.getContext("2d");
    bctx.imageSmoothingEnabled = false;

    var ctx = sprite.getContext("2d");
    
    sprite.width = renderWidth;
    sprite.height = renderHeight;
    ctx.imageSmoothingEnabled = false;

    function turn() {
        ctx.translate(sprite.width, 0);
        ctx.scale(-1, 1);
    }

    function updatePosition(deltaTime) {
        vect.x = 0;
        vect.y = 0;

        if (isModalOpen()) {
            destination = null;
            return; 
        }

        if (!destination) return;

        const dx = destination.x - position.x;
        const dy = destination.y - position.y;
        const distance = Math.hypot(dx, dy);
        const moveSpeed = 0.18;
        const step = moveSpeed * deltaTime;

        if (distance <= Math.max(step, 2)) {
            position.x = destination.x;
            position.y = destination.y;
            destination = null;
            return;
        }

        vect.x = dx / distance * moveSpeed;
        vect.y = dy / distance * moveSpeed;
    
        position.x += vect.x * deltaTime;
        position.y += vect.y * deltaTime;
    
        position.x = Math.max(0, Math.min(position.x, back.width - sprite.width));
        position.y = Math.max(0, Math.min(position.y, back.height - sprite.height));
    }

    function updateAnimation(deltaTime) {
        if (vect.x !== 0 || vect.y !== 0) {
            animationTimer += deltaTime;
            if (animationTimer >= frameDuration) {
                frame = (frame + 1) % 5;
                animationTimer = 0;
            }
        } else {
            frame = 0; 
            animationTimer = 0;
        }
    }

    function drawSprite() {
        ctx.clearRect(0, 0, sprite.width, sprite.height);
        
        ctx.drawImage(img, frame * frameWidth, 0, frameWidth, frameHeight, 0, 0, renderWidth, renderHeight);

        if (isRed) {
            ctx.globalCompositeOperation = "source-in";
            ctx.fillStyle = "red";
            ctx.fillRect(0, 0, sprite.width, sprite.height);
            ctx.globalCompositeOperation = "source-over";
        }
    }

    function loop(timestamp) {
        animationFrameId = 0;
        if (!lastTime) lastTime = timestamp;
        let deltaTime = timestamp - lastTime;
        lastTime = timestamp;

        if (deltaTime > 100) deltaTime = 16; 

        updatePosition(deltaTime);
        updateAnimation(deltaTime);
        
        drawSprite();

        bctx.clearRect(0, 0, back.width, back.height);
        
        bctx.drawImage(sprite, Math.round(position.x), Math.round(position.y));

        if (destination || isRed) animationFrameId = requestAnimationFrame(loop);
    }

    var animationFrameId = requestAnimationFrame(loop);

    function startLoop() {
        if (animationFrameId) return;
        lastTime = 0;
        animationFrameId = requestAnimationFrame(loop);
    }
  
    var resizeTimerId = 0;
    window.addEventListener("resize", function () {
        clearTimeout(resizeTimerId);
        resizeTimerId = setTimeout(function () {
            resizeTimerId = 0;
            if (!resizeCanvas(false)) return;

            // Resizing clears canvas pixels, so redraw before the next frame.
            drawSprite();
            bctx.clearRect(0, 0, back.width, back.height);
            bctx.drawImage(sprite, Math.round(position.x), Math.round(position.y));
            startLoop();
        }, 120);
    }, { passive: true });

    var isHoveringSprite = false;

    document.addEventListener("mousemove", function (evt) {
        if (isModalOpen()) {
            if (isHoveringSprite) {
                document.body.style.cursor = '';
                isHoveringSprite = false;
            }
            return;
        }

        var mouseX = evt.clientX;
        var mouseY = evt.clientY;

        var currentlyHovering = mouseX >= position.x && mouseX <= position.x + sprite.width &&
                                mouseY >= position.y && mouseY <= position.y + sprite.height;

        if (currentlyHovering && !isHoveringSprite) {
            document.body.style.cursor = 'pointer';
            isHoveringSprite = true;
        } else if (!currentlyHovering && isHoveringSprite) {
            document.body.style.cursor = '';
            isHoveringSprite = false;
        }
    });

    document.addEventListener("click", function (evt) {
        if (isModalOpen()) return;

        var mouseX = evt.clientX;
        var mouseY = evt.clientY;

        if (mouseX >= position.x && mouseX <= position.x + sprite.width &&
            mouseY >= position.y && mouseY <= position.y + sprite.height) {
            destination = null;
            isRed = true;
            var soundInstance = clickSound.cloneNode();
            soundInstance.play().catch(function(error) {
                console.log("声音播放被浏览器策略拦截", error);
            });
            setTimeout(function() {
                isRed = false;
                startLoop();
            }, 100);
            startLoop();
            return;
        }

        const blockedSelector = 'a, button, input, textarea, select, label, p, h1, h2, h3, h4, span, [role="button"], [contenteditable="true"], .upper-bar, .right, .msg-modal-overlay';
        const clickedContent = evt.target instanceof Element && Boolean(evt.target.closest(blockedSelector));
        if (clickedContent) return;

        destination = {
            x: Math.max(0, Math.min(mouseX - renderWidth / 2, back.width - renderWidth)),
            y: Math.max(0, Math.min(mouseY - renderHeight / 2, back.height - renderHeight))
        };
        startLoop();

        const movingRight = destination.x > position.x;
        if (movingRight && !face) { turn(); face = true; }
        if (!movingRight && face) { turn(); face = false; }
    });
});
