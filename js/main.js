'use strict';

// Fundamental parameter of the Universe
const PIXELS_PER_METER = 100;

// Analogue of Planck length, meters
const MIN_DEBOUNCE_HEIGHT = 0.01;

const hideStatistics = () => {
  document.getElementById('statistics').style.visibility = 'hidden';
};

const showStatistics = (elapsedTime, frameCount) => {
  const statistics = document.getElementById('statistics');
  statistics.style.visibility = 'visible';
  statistics.innerText = `
    Animation took ${elapsedTime.toFixed(1)} second(s),
    ${frameCount} frame(s) were rendered (${Math.round(frameCount / elapsedTime)} fps).
  `;
};

const canDebounce = (velocity, g) => {
  const debounceHeight = Math.pow(velocity, 2) / (2 * g);
  return debounceHeight >= MIN_DEBOUNCE_HEIGHT;
};

const calculateAnimationSteps = (height, g, speedConservationCoefficient) => {
  let step = 0;
  const animationSteps = [{
    targetPoint: height * PIXELS_PER_METER,
    impactSpeed: Math.sqrt(2 * g * height) // when hitting the surface
  }];
  let debounceSpeed = animationSteps[step].impactSpeed * speedConservationCoefficient;
  let bounceHeight;
  while (canDebounce(debounceSpeed, g)) {
    // decrease the speed according to speed conservation coefficient
    debounceSpeed = animationSteps[step].impactSpeed * speedConservationCoefficient;
    bounceHeight = Math.pow(debounceSpeed, 2) / (2 * g);
    animationSteps.push({
      targetPoint: Math.floor(animationSteps[0].targetPoint - bounceHeight * PIXELS_PER_METER)
    });
    animationSteps.push({
      impactSpeed: Math.sqrt(2 * g * bounceHeight)
    });
    step = animationSteps.length - 1;
  }
  return animationSteps;
};

const renderAnimationFrame = (time, step, directionChangedAt, g, ball, animationSteps, changeDirection) => {
  let h;
  let pos;

  // Falling
  if (step === 0 || !(step % 2)) {
    // path that the ball has passed in meters ( h = at^2 / 2 )
    h = g * Math.pow((time - directionChangedAt) / 1000, 2) / 2;
    pos = Math.floor(parseInt(ball.style.top) + h * PIXELS_PER_METER);
    // Correct possible surface layer overpassing because of low fps
    pos = pos > animationSteps[0].targetPoint ? animationSteps[0].targetPoint : pos;
    // check if the ball has touched the surface
    if (pos === animationSteps[0].targetPoint) {
      changeDirection(time);
    }
    ball.style.top = `${pos}px`;
    return;
  }

  // Bouncing
  // initial ball bounce speed
  const v0 = animationSteps[step - 1].impactSpeed;
  // time ball going up since last frame
  const t = (time - directionChangedAt) / 1000;
  // ball speed at the end of the current time frame
  const v1 = v0 - g * t;
  // path that has passed the ball (meters)
  h = v1 * t - g * Math.pow(t, 2) / 2;
  // ball position at the end of the current time frame
  pos = Math.floor(parseInt(ball.style.top) - h * PIXELS_PER_METER);
  if (h <= 0 || pos <= animationSteps[step].targetPoint) {
    // Ball has reached targetPoint, normalize position for low FPS
    pos = animationSteps[step].targetPoint;
    changeDirection(time);
  }
  ball.style.top = `${pos}px`;
};

addEventListener('DOMContentLoaded', () => {
  const ball = document.getElementById('ball');

  document.getElementById('startButton').onclick = () => {
    hideStatistics();

    // defines what fraction of initial speed is left after hitting the surface
    const speedConservationCoefficient = parseFloat(document.getElementById('speedConservationCoefficient').value);
    // m/s^2
    const g = parseFloat(document.getElementById('g').value);
    // meters
    const height = parseFloat(document.getElementById('height').value);
    // px
    const diameter = parseInt(document.getElementById('radius').value) * 2;

    document.getElementById('surface').style.top = `${diameter + height * PIXELS_PER_METER}px`;

    ball.style.height = `${diameter}px`;
    ball.style.width = `${diameter}px`;
    ball.style.top = '0';
    ball.style.display = 'block';

    animate(ball, speedConservationCoefficient, g, height);
  };
});

const animate = (ball, speedConservationCoefficient, g, height) => {
  let directionChangedAt = performance.now();
  let step = 0;

  const changeDirection = (time) => {
    step++;
    directionChangedAt = time;
  };

  const animationSteps = calculateAnimationSteps(height, g, speedConservationCoefficient);
  let frameCount = 0;
  const startTime = performance.now() / 1000;

  const nextFrame = (time) => {
    renderAnimationFrame(time, step, directionChangedAt, g, ball, animationSteps, changeDirection);
    frameCount++;

    if (step < animationSteps.length) {
      return requestAnimationFrame(nextFrame);
    }

    showStatistics(performance.now() / 1000 - startTime, frameCount);
  };

  requestAnimationFrame(nextFrame);
};
