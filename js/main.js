'use strict';

$('document').ready(function(){
    // canvas initialization
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');

    var startButton = document.getElementById('startButton');

    startButton.onclick = function() {
        // coefficient, how many speed saves the ball, when hitting the floor
        var speedConservationCoefficient = parseFloat(document.getElementById('speed-conservation-coefficient').value);
        // m/s^2
        var acceleration = parseFloat(document.getElementById('g').value);
        // m
        var height = parseFloat(document.getElementById('height').value);
        // px
        var radius = parseInt(document.getElementById('radius').value);

        // TODO params validation

        // clear before redraw
        context.clearRect(0, 0, canvas.width, canvas.height);
        var centerX = canvas.width / 2;
        var centerY = canvas.height / 2;

        context.beginPath();
        context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        context.fillStyle = '#00FF00';
        context.fill();

        // move ball to starting position
        canvas.style.top = '0px';

        // run animation
        animate({
            // moving object
            canvas: canvas,
            speedConservationCoefficient: speedConservationCoefficient,
            acceleration: acceleration,
            height: height
        });
    };
});
