## README

[Demo video](https://youtu.be/QkeTCYBJYy8) (youtube, low fps)

It's a ball, that bounces accordingly to (almost) real-life physics, or to your own parameters.

The main parameter of the ball's bouncing is a speed conservation coefficient.

## How does work this coefficient?

Consider falling ball, that touches the floor.

In that case, in real life, the ball a little deformed, respectively its elasticity, and other parameters.
The surface on which it has fallen, is also have a little deformed.
Part of the kinetic energy of the ball would be transformed into heat energy,
some would reject a sound (if it is not a vacuum), then there would be a partial recovery
of the original shape of the ball and the surface beneath it, causing the ball to bounce.

Instead of doing this over-complicated calculations, I use a single coefficient.
When ball hits the floor, I just multiply its speed near the floor by that coefficient,
and use the resulting value as the initial vertical velocity of the ball.
