'use strict';

// Fundamental parameter of the Universe
const PIXELS_PER_METER = 100;

// Analogue of Planck length, meters
const MIN_DEBOUNCE_HEIGHT = 0.01;

// Upper bound for speed conservation coefficient, otherwise the ball never stops
const MAX_SPEED_CONSERVATION_COEFFICIENT = 0.99;

let animationFrameId = null;

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

// Splits the whole motion into ballistic segments. Each segment starts at `startTime` (seconds)
// at height `startHeight` (meters above the surface) with vertical speed `startSpeed` (m/s, up is positive)
// and lasts until the ball hits the surface again.
const calculateSegments = (height, g, speedConservationCoefficient) => {
  // initial drop: from rest at `height`
  const segments = [{
    startTime: 0,
    startHeight: height,
    startSpeed: 0,
    duration: Math.sqrt(2 * height / g)
  }];
  // the ball hits the surface with the same speed it was launched (no air resistance)
  let impactSpeed = Math.sqrt(2 * g * height);
  let debounceSpeed = impactSpeed * speedConservationCoefficient;

  while (canDebounce(debounceSpeed, g)) {
    const previous = segments[segments.length - 1];
    segments.push({
      startTime: previous.startTime + previous.duration,
      startHeight: 0,
      startSpeed: debounceSpeed,
      // time to go up and fall back down
      duration: 2 * debounceSpeed / g
    });
    impactSpeed = debounceSpeed;
    debounceSpeed = impactSpeed * speedConservationCoefficient;
  }
  return segments;
};

// Height of the ball above the surface (meters) within a segment, t is seconds since segment start
// h = h0 + v0 * t - g * t^2 / 2
const heightAt = (segment, t, g) => Math.max(0, segment.startHeight + segment.startSpeed * t - g * Math.pow(t, 2) / 2);

const animate = (ball, speedConservationCoefficient, g, height) => {
  const segments = calculateSegments(height, g, speedConservationCoefficient);
  const lastSegment = segments[segments.length - 1];
  const totalDuration = lastSegment.startTime + lastSegment.duration;
  // ball's top position (px) when it lies on the surface
  const surfacePosition = height * PIXELS_PER_METER;

  const setPosition = (heightAboveSurface) => {
    // transform is composited by the browser and does not trigger layout, unlike `top`
    ball.style.transform = `translateY(${surfacePosition - heightAboveSurface * PIXELS_PER_METER}px)`;
  };

  let segmentIndex = 0;
  let frameCount = 0;
  let startTime = null;

  const nextFrame = (time) => {
    // use the first frame's timestamp as the origin so elapsed time is never negative
    if (startTime === null) {
      startTime = time;
    }
    const elapsed = (time - startTime) / 1000;
    frameCount++;

    if (elapsed >= totalDuration) {
      setPosition(0);
      animationFrameId = null;
      showStatistics(elapsed, frameCount);
      return;
    }

    // segments are sorted by time, so only move forward
    while (elapsed >= segments[segmentIndex].startTime + segments[segmentIndex].duration) {
      segmentIndex++;
    }
    const segment = segments[segmentIndex];
    setPosition(heightAt(segment, elapsed - segment.startTime, g));

    animationFrameId = requestAnimationFrame(nextFrame);
  };

  setPosition(height);
  animationFrameId = requestAnimationFrame(nextFrame);
};

addEventListener('DOMContentLoaded', () => {
  const ball = document.getElementById('ball');

  document.getElementById('startButton').onclick = () => {
    // stop the previous animation if the button was pressed before it finished
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    hideStatistics();

    // defines what fraction of initial speed is left after hitting the surface
    const speedConservationCoefficient = Math.min(
      Math.max(parseFloat(document.getElementById('speedConservationCoefficient').value) || 0, 0),
      MAX_SPEED_CONSERVATION_COEFFICIENT
    );
    // m/s^2
    const g = parseFloat(document.getElementById('g').value);
    // meters
    const height = parseFloat(document.getElementById('height').value);
    // px
    const diameter = parseInt(document.getElementById('radius').value) * 2;

    if (!(g > 0) || !(height > 0) || !(diameter > 0)) {
      return;
    }

    document.getElementById('surface').style.top = `${diameter + height * PIXELS_PER_METER}px`;

    ball.style.height = `${diameter}px`;
    ball.style.width = `${diameter}px`;
    ball.style.top = '0';
    ball.style.display = 'block';

    animate(ball, speedConservationCoefficient, g, height);
  };
});
