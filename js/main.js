'use strict';

$(function(){
    const BALL_COLOR = '#00FF00';
    // canvas initialization
    let canvas = $('#canvas')[0];
    let context = canvas.getContext('2d');

    $('#startButton').click(function() {
        $('#benchmark').hide();
        // coefficient, how many speed saves the ball, when hitting the floor
        let speedConservationCoefficient = parseFloat($('#speed-conservation-coefficient').val());
        // m/s^2
        let acceleration = parseFloat($('#g').val());
        // m
        let height = parseFloat($('#height').val());
        // px
        let radius = parseInt($('#radius').val());
        let diameter = radius*2;

        // clear
        canvas.height = canvas.width = diameter;
        context.clearRect(0, 0, diameter, diameter);
        // draw
        context.beginPath();
        context.arc(radius, radius, radius, 0, 2 * Math.PI);
        context.fillStyle = BALL_COLOR;
        context.fill();

        // move ball to starting position
        canvas.style.top = '0';

        animate.call(this, {
            canvas: canvas,
            speedConservationCoefficient: speedConservationCoefficient,
            acceleration: acceleration,
            height: height
        });
    }.bind(this));

    $(this).on('ballStopped', function() {
        $('#benchmark').show();
        $('#elapsed-time').text(Math.round(window.elapsedTime) + ' s elapsed');
        $('#fps').text(Math.round(window.fps) + ' FPS');
    });
}.bind(this));
