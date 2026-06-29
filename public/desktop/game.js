let img = new Image();
img.src = 'images/ken.png';

let enemy = new Image();
enemy.src = 'images/guile.png';

let guileHit = new Image();
guileHit.src = 'images/guile-hit.png';

let shoruyken = new Image();
shoruyken.src = 'images/ken-shoryuken.png';

let canvas = document.querySelector('canvas');
canvas.width = document.body.clientWidth; //document.width is obsolete
canvas.height = document.body.clientHeight; //document.height is obsolete

let ctx = canvas.getContext('2d');

const scale = 4;
const width = 70;
const height = 80;
const enemyHeight = 90;
const scaledWidth = scale * width;
const scaledHeight = scale * height;

const jumpHeight = 150;
const jumpScaledHeight = scale * jumpHeight;

let currentLoopIndex = 0;
let enemyLoopIndex = 0;
let enemyFrameCount = 0;

const MOVEMENT_SPEED = 6;
let positionX = 0;
let fireballPosition = positionX + width;
let positionY = 0;

// new try

let hasMoved = false;
let p2GestureActive = false;
let p2GestureFrameIndex = 0;
let p2GestureFrameTimer = 0;
var fps, fpsInterval, startTime, now, then, elapsed;

class Game{
    constructor(){
        this.start = () => this.startAnimating(7);
        this.loop = [0,1,2,3];
        this.spritePosition = 1;
    }

    setLoopAndPosition(loop, position){
        this.loop = loop;
        this.spritePosition = position;
        hasMoved = true;
    }

    triggerP2Gesture(gesture) {
        p2GestureActive = true;
        p2GestureFrameIndex = 0;
        p2GestureFrameTimer = 0;
    }

    startAnimating(fps) {
        fpsInterval = 1000 / fps;
        then = Date.now();
        startTime = then;
    
        this.animate();
        this.initEnemy();
    }

    drawFrame(frameX, frameY, canvasX, canvasY) {
        ctx.drawImage(img,
            frameX * width, frameY * height, width, height,
            canvasX, canvasY, scaledWidth, scaledHeight);
    }

    drawJumpFrame(frameX, frameY, canvasX, canvasY){
        ctx.drawImage(shoruyken,
            frameX * width, frameY * height, width, jumpHeight,
            canvasX, canvasY, scaledWidth, jumpScaledHeight);
    }

    animate = () => {
        window.requestAnimationFrame(this.animate);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if(hasMoved){
            currentLoopIndex = 0;
            hasMoved = false;
        }
    
        if(this.spritePosition !== 4){
            this.drawFrame(this.loop[currentLoopIndex],this.spritePosition,positionX, canvas.height - (scaledHeight + 30));
        }
    
        if(this.spritePosition === 0){ // hadoken add sprite for fireball
            let fireballCycleLoop = [0,1];
    
            this.drawFrame(fireballCycleLoop[currentLoopIndex],4,fireballPosition+=35, canvas.height - (scaledHeight + 30));
    
            if(currentLoopIndex >= fireballCycleLoop.length){
                fireballPosition = positionX + width;
            }
        }
    
        if(this.spritePosition === 4){ // hadoken add sprite for fireball
            this.drawJumpFrame(this.loop[currentLoopIndex],0,0, positionY);
        }
    
        now = Date.now();
        elapsed = now - then;
      
        if (elapsed > fpsInterval) {
            // Get ready for next frame by setting then=now, but also adjust for your
            // specified fpsInterval not being a multiple of RAF's interval (16.7ms)
            then = now - (elapsed % fpsInterval);
    
            currentLoopIndex++;
    
            if (currentLoopIndex >= this.loop.length) {
                currentLoopIndex = 0;
         
                if(this.spritePosition !== 1){
                    this.spritePosition = 1;
                    this.loop = [0, 1, 2, 3];
                }
            }
        }
    }

    initEnemy = () => {
        window.requestAnimationFrame(this.initEnemy);

        let canvasX = -canvas.width + 400;
        let canvasY = canvas.height - (scaledHeight + 30);

        ctx.save();
        ctx.translate(width, 0);
        ctx.scale(-1, 1);

        if (p2GestureActive) {
            ctx.drawImage(guileHit,
                p2GestureFrameIndex * width, 0, width, enemyHeight,
                canvasX, canvasY, scaledWidth, scaledHeight);
        } else {
            let enemyCycleLoop = [0, 1, 2];
            ctx.drawImage(enemy,
                enemyCycleLoop[enemyLoopIndex] * width, 0, width, enemyHeight,
                canvasX, canvasY, scaledWidth, scaledHeight);
        }

        ctx.restore();

        enemyFrameCount++;
        if (enemyFrameCount % 8 === 0) {
            if (p2GestureActive) {
                p2GestureFrameIndex++;
                if (p2GestureFrameIndex >= 3) {
                    p2GestureActive = false;
                    p2GestureFrameIndex = 0;
                }
            } else {
                enemyLoopIndex++;
                if (enemyLoopIndex >= 3) enemyLoopIndex = 0;
            }
            enemyFrameCount = 0;
        }
    }
}

export default Game;