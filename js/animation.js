'use strict';

// it is good parameters, but, if you want, you can change them like you prefer
// integer value
const PIXELS_IN_METER = 100;

// meters (float or integer)
const MIN_BOUNCE_HEIGHT = 0.1;

function calculateBounceParams() {
    var tempHeight = this.height * PIXELS_IN_METER;
    var bounceCount = 0;
    var bounceParams = [
        {
            // floor level
            targetPoint: tempHeight,
            // m/s (in first falling)
            speedNearTheFloor: Math.sqrt(2 * this.acceleration * this.height)
        }
    ];
    // while jump height greater than MIN_BOUNCE_HEIGHT - bouncing (bounce count is limited to 1000 just in case)
    while (Math.pow(bounceParams[bounceCount].speedNearTheFloor * this.speedConservationCoefficient, 2) / (2 * this.acceleration) > MIN_BOUNCE_HEIGHT) {
        // decrease the speed according to speed conservation coefficient
        var speedUp = bounceParams[bounceCount].speedNearTheFloor * this.speedConservationCoefficient;
        var heightUp = Math.pow(speedUp, 2) / (2 * this.acceleration);
        var targetPoint = Math.floor(bounceParams[0].targetPoint - heightUp * PIXELS_IN_METER);
        var speedDown = Math.sqrt(2 * this.acceleration * heightUp);
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

function animationStep() {
    return function(time) {
        var h = 0;
        var pos = 0;
        // if bouncing ended
        if (this.pointer == this.bounceParams.length) {
            this.canvas.style.top = this.bounceParams[0].targetPoint + 'px';
            return;
        }

        // falling
        if (!(this.pointer % 2) || this.pointer == 0) {
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
            var v0 = this.bounceParams[this.pointer - 1].speedNearTheFloor;
            // time ball going up
            var t = (time - this.directionChangedTime) / 1000;
            // ball speed at the end of the current frame
            var v1 = v0 - (this.acceleration * t);
            // path that has passed the ball (meters)
            h = (v1 * t) - ((this.acceleration * Math.pow(t, 2)) / 2);
            // ball position at the end of the current frame
            pos = Math.floor(parseInt(this.canvas.style.top) - h * PIXELS_IN_METER);
            // maybe the ball already has reached his targetPoint in the current jump
            if (pos <= this.bounceParams[this.pointer].targetPoint) {
                this.changeDirection(time);
            }
        }
        this.canvas.style.top = pos + 'px';
    };
}

function animate(options) {
    options.directionChangedTime = performance.now();
    options.changeDirection = function changeDirection(time) {
        // switch ball moving direction
        this.pointer++;
        // direction switching time
        this.directionChangedTime = time;
    };
    options.animationStep = animationStep();
    options.bounceParams = calculateBounceParams.call(options);
    options.pointer = 0;

    requestAnimationFrame(function nextFrame(time) {
        options.animationStep(time);
        if (options.pointer != options.bounceParams.length) {
            requestAnimationFrame(nextFrame);
        }
    });
}