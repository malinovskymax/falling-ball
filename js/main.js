'use strict';

const PIXELS_IN_METER = 100;

// meters (float or integer)
const MIN_DEBOUNCE_HEIGHT = 0.01;

const BALL_COLOR = '#00FF00';

addEventListener('DOMContentLoaded', () => {
    // canvas initialization
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    const benchmark = document.getElementById('benchmark');

    document.getElementById('startButton').onclick = () => {
        benchmark.style.visibility = 'hidden';

        // defines what fraction of initial speed is left after hitting the surface
        const speedConservationCoefficient = parseFloat(document.getElementById('speed-conservation-coefficient').value);
        // m/s^2
        const g = parseFloat(document.getElementById('g').value);
        // meters
        const height = parseFloat(document.getElementById('height').value);
        // px
        const radius = parseInt(document.getElementById('radius').value);
        const diameter = radius*2;

        // position surface
        document.getElementById('surface').style.top = `${diameter + (height * PIXELS_IN_METER)}px`;

        // clear
        canvas.height = canvas.width = diameter;
        context.clearRect(0, 0, diameter, diameter);
        // draw
        context.beginPath();
        context.arc(radius, radius, radius, 0, 2 * Math.PI);
        context.fillStyle = BALL_COLOR;
        context.fill();

        // move ball to the starting position
        canvas.style.top = '0';

        animate({
            canvas: canvas,
            speedConservationCoefficient: speedConservationCoefficient,
            g: g,
            height: height
        });
    };
});

addEventListener('ballStopped', (e) => {
    document.getElementById('benchmark').style.visibility = 'visible';
    document.getElementById('elapsed-time').innerText = `${Math.round(e.elapsedTime)} s elapsed`;
    document.getElementById('fps').innerText = `${Math.round(e.frameCount / e.elapsedTime)} fps`;
    document.getElementById('frame-count').innerText = `${e.frameCount} frame(s) rendered`;
});

const debounceHeight = (velocity, g) => { return Math.pow(velocity, 2) / (2 * g) };

const canDebounce = (velocity, g) => { return debounceHeight(velocity, g) > MIN_DEBOUNCE_HEIGHT };

const calculateBounceParams = (options) => {
    let bounceCount = 0;
    let bounceParams = [
        {
            // surface level
            targetPoint: options.height * PIXELS_IN_METER,
            // m/s (when falling first time)
            speedNearTheFloor: Math.sqrt(2 * options.g * options.height)
        }
    ];
    // while jump height greater than MIN_DEBOUNCE_HEIGHT - bouncing
    let deboundeInitialSpeed = bounceParams[bounceCount].speedNearTheFloor * options.speedConservationCoefficient;
    let bounceHeight, targetPoint, speedDown;
    while (canDebounce(deboundeInitialSpeed, options.g)) {
        // decrease the speed according to speed conservation coefficient
        deboundeInitialSpeed = bounceParams[bounceCount].speedNearTheFloor * options.speedConservationCoefficient;
        bounceHeight = Math.pow(deboundeInitialSpeed, 2) / (2 * options.g);
        targetPoint = Math.floor(bounceParams[0].targetPoint - (bounceHeight * PIXELS_IN_METER));
        speedDown = Math.sqrt(2 * options.g * bounceHeight);
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

const animationStep = (now, options) => {
    let h = 0;
    let pos = 0;

    // falling
    if (!(options.step % 2) || options.step === 0) {
        // path that the ball has passed in meters ( h = at^2 / 2 )
        h = (options.g * Math.pow((now - options.directionChangedTime) / 1000, 2)) / 2;
        pos = Math.floor(parseInt(options.canvas.style.top) + (h * PIXELS_IN_METER));
        // Correct possible passing surface layer because of low js ticker resolution
        if (pos > options.bounceParams[0].targetPoint) {
            pos = options.bounceParams[0].targetPoint;
        }
        // check if the ball has touched the surface
        if (pos === options.bounceParams[0].targetPoint) {
            options.changeDirection(now);
        }
    // debouncing
    } else {
        // initial ball debounce speed
        const v0 = options.bounceParams[options.step - 1].speedNearTheFloor;
        // time ball going up since last frame
        const t = (now - options.directionChangedTime) / 1000;
        // ball speed at the end of the current time frame
        const v1 = v0 - (options.g * t);
        // path that has passed the ball (meters)
        h = (v1 * t) - ((options.g * Math.pow(t, 2)) / 2);
        // ball position at the end of the current time frame
        pos = Math.floor(parseInt(options.canvas.style.top) - (h * PIXELS_IN_METER));
        // maybe the ball has already reached its targetPoint in the current debounce
        if (pos <= options.bounceParams[options.step].targetPoint) {
            pos = options.bounceParams[options.step].targetPoint;
            options.changeDirection(now);
        } else if (h < 0 && pos !== options.bounceParams[options.step].targetPoint) {
            // ball has already flyed over top point and is actually falling
            options.changeDirection(now);
            pos =  options.bounceParams[options.step].targetPoint;
        }
    }

    // animation end, place ball onto the surface
    if (options.step == options.bounceParams.length) {
        pos = options.bounceParams[0].targetPoint;
        options.changeDirection(now);
    }
    options.canvas.style.top = pos + 'px';
    ++options.frameCount;
};

const animate = (options) => {
    options.directionChangedTime = performance.now();
    options.changeDirection = (now) => {
        // switch ball moving direction
        ++options.step;
        // direction switching time
        options.directionChangedTime = now;
    };
    options.bounceParams = calculateBounceParams(options);
    options.step = 0;
    options.frameCount = 0;
    options.startTime = Math.trunc(performance.now() / 1000);

    const nextFrame = (now) => {
        animationStep(now, options);
        if (options.step <= options.bounceParams.length) {
            requestAnimationFrame(nextFrame);
        } else {
            const e = new Event('ballStopped');
            e.elapsedTime = Math.trunc(performance.now() / 1000) - options.startTime;
            e.frameCount = options.frameCount;
            window.dispatchEvent(e);
        }
    }

    requestAnimationFrame(nextFrame);
}
