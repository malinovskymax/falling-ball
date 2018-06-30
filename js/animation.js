'use strict';

window.frame = 0;
window.start = performance.now() / 1000;

const PIXELS_IN_METER = 100;

// meters (float or integer)
const MIN_DEBOUNCE_HEIGHT = 0.01;

function debounceHeight(velocity, acceleration) {
    // v^2/2a
    return Math.pow(velocity, 2) / (2 * acceleration);

}

function canDebounce (velocity, acceleration) {
    return debounceHeight(velocity, acceleration) > MIN_DEBOUNCE_HEIGHT;
}

function calculateBounceParams(options) {
    let tempHeight = options.height * PIXELS_IN_METER;
    let bounceCount = 0;
    let bounceParams = [
        {
            // floor level
            targetPoint: tempHeight,
            // m/s (in first falling)
            speedNearTheFloor: Math.sqrt(2 * options.acceleration * options.height)
        }
    ];
    // while jump height greater than MIN_DEBOUNCE_HEIGHT - bouncing (bounce count is limited to 1000 just in case)
    let speedUp = bounceParams[bounceCount].speedNearTheFloor * options.speedConservationCoefficient;
    let heightUp, targetPoint, speedDown;
    while (canDebounce(speedUp, options.acceleration)) {
        // decrease the speed according to speed conservation coefficient
        speedUp = bounceParams[bounceCount].speedNearTheFloor * options.speedConservationCoefficient;
        heightUp = Math.pow(speedUp, 2) / (2 * options.acceleration);
        targetPoint = Math.floor(bounceParams[0].targetPoint - heightUp * PIXELS_IN_METER);
        speedDown = Math.sqrt(2 * options.acceleration * heightUp);
        // every bounce after first drop is a jump and and subsequent fall
        bounceParams.push(
            {
                targetPoint: targetPoint
            }
        );
        bounceParams.push(
            {
                speedNearTheFloor: speedDown
            }
        );
        bounceCount = bounceParams.length - 1;
    }
    return bounceParams;
}

function animationStep(time) {
    let h = 0;
    let pos = 0;

    // falling
    if (!(this.pointer % 2) || this.pointer === 0) {
        // path that has passed the ball (meters) ( h = at^2 / 2 )
        h = (this.acceleration * Math.pow((time - this.directionChangedTime) / 1000, 2)) / 2;
        pos = Math.floor(parseFloat(this.canvas.style.top) + h * PIXELS_IN_METER);
        // maybe the ball already has reached floor in the current falling
        if (pos >= this.bounceParams[0].targetPoint) {
            this.changeDirection(time);
        }
        // jumping
    } else {
        // initial ball jump speed
        let v0 = this.bounceParams[this.pointer - 1].speedNearTheFloor;
        // time ball going up
        let t = (time - this.directionChangedTime) / 1000;
        // ball speed at the end of the current frame
        let v1 = v0 - (this.acceleration * t);
        // path that has passed the ball (meters)
        h = (v1 * t) - ((this.acceleration * Math.pow(t, 2)) / 2);
        // ball position at the end of the current frame
        pos = Math.floor(parseInt(this.canvas.style.top) - h * PIXELS_IN_METER);
        // maybe the ball already has reached his targetPoint in the current jump
        if (pos <= this.bounceParams[this.pointer].targetPoint) {
            pos =  this.bounceParams[this.pointer].targetPoint;
            this.changeDirection(time);
        } else if (h < 0 && pos !== this.bounceParams[this.pointer].targetPoint) {
            // ball has already flyed over top point and is actually falling
            this.changeDirection(time);
            pos =  this.bounceParams[this.pointer].targetPoint;
        }
    }

    // if bouncing ended
    if (this.pointer == this.bounceParams.length) {
        pos = this.bounceParams[0].targetPoint;
        this.changeDirection(time);
    }
    this.canvas.style.top = pos + 'px';
    window.frame++;
};

function animate(options) {
    options.directionChangedTime = performance.now();
    options.changeDirection = (time) => {
        // switch ball moving direction
        ++options.pointer;
        // direction switching time
        options.directionChangedTime = time;
    };
    options.animationStep = animationStep;
    options.bounceParams = calculateBounceParams.call(this, options);
    options.pointer = 0;

    requestAnimationFrame(function nextFrame(time) {
        options.animationStep(time);
        if (options.pointer <= options.bounceParams.length) {
            requestAnimationFrame(nextFrame);
        } else {
            window.elapsedTime = performance.now() / 1000 - window.start;
            window.fps = window.frame / elapsedTime;
            $(window).trigger('ballStopped');
        }
    });
}
