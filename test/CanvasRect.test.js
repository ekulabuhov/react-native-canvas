import CanvasRenderingContext2D from '../src/CanvasRenderingContext2D';
const assert = require('chai').assert,
	fs = require('fs'),
	PNG = require('pngjs').PNG;

describe('2d.fillRect', function() {
  var gl, ctx;

  beforeEach(function() {
    ({ gl, ctx } = _initContext());
  });

  it('fillRect works', function() {
    ctx.fillStyle = '#0f0';
    ctx.fillRect(0, 0, 100, 50);

    _assertPixel(gl, 50, 25, 0, 255, 0, 255);
  });

  it('fillRect red-green gradient', function() {
    var options = { width: 150, height: 150, fileName: this.test.fullTitle() };
    ({ gl, ctx } = _initContext(options));

    for (var i = 0; i < 6; i++) {
      for (var j = 0; j < 6; j++) {
        ctx.fillStyle = 'rgb(' + Math.floor(255 - 42.5 * i) + ',' +
          Math.floor(255 - 42.5 * j) + ',0)';
        ctx.fillRect(j * 25, i * 25, 25, 25);
      }
    }

    _assertOutput(gl, options);
  })
});

describe('2d.strokeRect', function() {
  var gl, ctx;

  beforeEach(function() {
    ({ gl, ctx } = _initContext());
  });

  it('strokeRect works', function() {
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 50;
    ctx.strokeRect(25, 24, 50, 2);

    _assertPixel(gl, 50, 25, 0, 255, 0, 255);
  });
});

describe('2d.clearRect', function() {
  var gl, ctx;

  beforeEach(function() {
    ({ gl, ctx } = _initContext());
  });

  it('clearRect basic', function() {
    ctx.fillStyle = '#f00';
    ctx.fillRect(0, 0, 100, 50);
    ctx.clearRect(0, 0, 100, 50);

    _assertPixel(gl, 50, 25, 0, 0, 0, 0);
  });
});

describe('2d.path', function() {
  var gl, ctx;

  beforeEach(function() {
    ({ gl, ctx } = _initContext());
  });

  it('2d.path.rect.basic', function() {
    ctx.fillStyle = '#f00';
    ctx.fillRect(0, 0, 100, 50);
    ctx.fillStyle = '#0f0';
    ctx.rect(0, 0, 100, 50);
    ctx.fill();

    _assertPixel(gl, 50, 25, 0, 255, 0, 255)
  });

  // EK: The closePath() method, when invoked, must do nothing if the object's path has no subpaths. 
  // Basically a NOP.
  it('2d.path.initial', function() {
    ctx.fillStyle = '#0f0';
    ctx.fillRect(0, 0, 100, 50);
    ctx.closePath();
    ctx.fillStyle = '#f00';
    ctx.fill();

    _assertPixel(gl, 50, 25, 0, 255, 0, 255);
  });

  it('2d.path.beginPath', function() {
    ctx.fillStyle = '#0f0';
    ctx.fillRect(0, 0, 100, 50);
    ctx.rect(0, 0, 100, 50);
    ctx.beginPath();
    ctx.fillStyle = '#f00';
    ctx.fill();

    _assertPixel(gl, 50, 25, 0, 255, 0, 255);
  });

  it('2d.path.moveTo.basic', function() {
    ctx.fillStyle = '#f00';
    ctx.fillRect(0, 0, 100, 50);
    ctx.rect(0, 0, 10, 50);
    ctx.moveTo(100, 0);
    ctx.lineTo(10, 0);
    ctx.lineTo(10, 50);
    ctx.lineTo(100, 50);
    ctx.fillStyle = '#0f0';
    ctx.fill();

    _assertPixel(gl, 90, 25, 0, 255, 0, 255);
  });


  it('2d.path.moveTo.newsubpath', function() {
    ctx.fillStyle = '#0f0';
    ctx.fillRect(0, 0, 100, 50);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.moveTo(100, 0);
    ctx.moveTo(100, 50);
    ctx.moveTo(0, 50);
    ctx.fillStyle = '#f00';
    ctx.fill();
    _assertPixel(gl, 50, 25, 0, 255, 0, 255);
  });

  // arc() with an empty path does not draw a straight line to the start point
  it('2d.path.arc.empty', function() {
    ctx.fillStyle = '#0f0';
    ctx.fillRect(0, 0, 100, 50);
    ctx.lineWidth = 50;
    ctx.strokeStyle = '#f00';
    ctx.beginPath();
    ctx.arc(200, 25, 5, 0, 2 * Math.PI, true);
    ctx.stroke();
    _assertPixel(gl, 50, 25, 0, 255, 0, 255);
  })

  // arc() with a non-empty path does draw a straight line to the start point
  it('2d.path.arc.nonempty', function() {
    ctx.fillStyle = '#f00';
    ctx.fillRect(0, 0, 100, 50);
    ctx.lineWidth = 50;
    ctx.strokeStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(0, 25);
    ctx.arc(200, 25, 5, 0, 2 * Math.PI, true);
    ctx.stroke();

    _assertPixel(gl, 50, 25, 0, 255, 0, 255);
  })

  // arc() adds the end point of the arc to the subpath
  it('2d.path.arc.end', function() {
    ctx.fillStyle = '#f00';
    ctx.fillRect(0, 0, 100, 50);
    ctx.lineWidth = 50;
    ctx.strokeStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(-100, 0);
    ctx.arc(-100, 0, 25, -Math.PI / 2, Math.PI / 2, true);
    ctx.lineTo(100, 25);
    ctx.stroke();

    _assertPixel(gl, 50, 25, 0, 255, 0, 255);
  });

  // arc() with missing last argument defaults to clockwise
  it('2d.path.arc.default', function() {
    ctx.fillStyle = '#0f0';
    ctx.fillRect(0, 0, 100, 50);
    ctx.fillStyle = '#f00';
    ctx.beginPath();
    ctx.moveTo(100, 0);
    ctx.arc(100, 0, 150, -Math.PI, Math.PI / 2);
    ctx.fill();

    _assertPixel(gl, 50, 25, 0, 255, 0, 255);
  });

  // arc() draws pi/2 .. -pi anticlockwise correctly
  it('2d.path.arc.angle.1', function() {
    ctx.fillStyle = '#0f0';
    ctx.fillRect(0, 0, 100, 50);
    ctx.fillStyle = '#f00';
    ctx.beginPath();
    ctx.moveTo(100, 0);
    ctx.arc(100, 0, 150, Math.PI / 2, -Math.PI, true);
    ctx.fill();

    _assertPixel(gl, 50, 25, 0, 255, 0, 255);
  });

  // arc() draws -3pi/2 .. -pi anticlockwise correctly
  it('2d.path.arc.angle.2', function() {
    ctx.fillStyle = '#0f0';
    ctx.fillRect(0, 0, 100, 50);
    ctx.fillStyle = '#f00';
    ctx.beginPath();
    ctx.moveTo(100, 0);
    ctx.arc(100, 0, 150, -3 * Math.PI / 2, -Math.PI, true);
    ctx.fill();

    _assertPixel(gl, 50, 25, 0, 255, 0, 255);
  });

  // arc() wraps angles mod 2pi when anticlockwise and end > start+2pi
  it('2d.path.arc.angle.3', function() {
    ctx.fillStyle = '#0f0';
    ctx.fillRect(0, 0, 100, 50);
    ctx.fillStyle = '#f00';
    ctx.beginPath();
    ctx.moveTo(100, 0);
    ctx.arc(100, 0, 150, (512 + 1 / 2) * Math.PI, (1024 - 1) * Math.PI, true);
    ctx.fill();

    _assertPixel(gl, 50, 25, 0, 255, 0, 255);
  });

  // arc() draws a full circle when clockwise and end > start+2pi
  it('2d.path.arc.angle.4', function() {
    ctx.fillStyle = '#f00';
    ctx.fillRect(0, 0, 100, 50);
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(50, 25);
    ctx.arc(50, 25, 60, (512 + 1 / 2) * Math.PI, (1024 - 1) * Math.PI, false);
    ctx.fill();

    _assertPixel(gl, 1, 1, 0, 255, 0, 255);
    _assertPixel(gl, 98, 1, 0, 255, 0, 255);
    _assertPixel(gl, 1, 48, 0, 255, 0, 255);
    _assertPixel(gl, 98, 48, 0, 255, 0, 255);
  });

  // arc() wraps angles mod 2pi when clockwise and start > end+2pi
  it('2d.path.arc.angle.5', function() {
    ctx.fillStyle = '#0f0';
    ctx.fillRect(0, 0, 100, 50);
    ctx.fillStyle = '#f00';
    ctx.beginPath();
    ctx.moveTo(100, 0);
    ctx.arc(100, 0, 150, (1024 - 1) * Math.PI, (512 + 1 / 2) * Math.PI, false);
    ctx.fill();

    _assertPixel(gl, 50, 25, 0, 255, 0, 255);
  });

  // arc() draws a full circle when anticlockwise and start > end+2pi
  it('2d.path.arc.angle.6', function() {
    ctx.fillStyle = '#f00';
    ctx.fillRect(0, 0, 100, 50);
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(50, 25);
    ctx.arc(50, 25, 60, (1024 - 1) * Math.PI, (512 + 1 / 2) * Math.PI, true);
    ctx.fill();

    _assertPixel(gl, 1, 1, 0, 255, 0, 255);
    _assertPixel(gl, 98, 1, 0, 255, 0, 255);
    _assertPixel(gl, 1, 48, 0, 255, 0, 255);
    _assertPixel(gl, 98, 48, 0, 255, 0, 255);
  });

  // arc() draws nothing when startAngle = endAngle and anticlockwise
  it('2d.path.arc.zero.1', function() {
    ctx.fillStyle = '#0f0';
    ctx.fillRect(0, 0, 100, 50);
    ctx.strokeStyle = '#f00';
    ctx.lineWidth = 100;
    ctx.beginPath();
    ctx.arc(50, 25, 50, 0, 0, true);
    ctx.stroke();

    _assertPixel(gl, 50, 20, 0, 255, 0, 255);
  });

  // arc() draws nothing when startAngle = endAngle and clockwise
  it('2d.path.arc.zero.2', function() {
    ctx.fillStyle = '#0f0';
    ctx.fillRect(0, 0, 100, 50);
    ctx.strokeStyle = '#f00';
    ctx.lineWidth = 100;
    ctx.beginPath();
    ctx.arc(50, 25, 50, 0, 0, false);
    ctx.stroke();

    _assertPixel(gl, 50, 20, 0, 255, 0, 255);
  });

  // arc() draws nothing when end = start + 2pi-e and anticlockwise
  it('2d.path.arc.twopie.1', function() {
    ctx.fillStyle = '#0f0';
    ctx.fillRect(0, 0, 100, 50);
    ctx.strokeStyle = '#f00';
    ctx.lineWidth = 100;
    ctx.beginPath();
    ctx.arc(50, 25, 50, 0, 2 * Math.PI - 1e-4, true);
    ctx.stroke();

    _assertPixel(gl, 50, 20, 0, 255, 0, 255);
  });

  // arc() draws a full circle when end = start + 2pi-e and clockwise
  it('2d.path.arc.twopie.2', function() {
    ctx.fillStyle = '#f00';
    ctx.fillRect(0, 0, 100, 50);
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 100;
    ctx.beginPath();
    ctx.arc(50, 25, 50, 0, 2 * Math.PI - 1e-4, false);
    ctx.stroke();

    _assertPixel(gl, 50, 20, 0, 255, 0, 255);
  });

  // arc() draws a full circle when end = start + 2pi+e and anticlockwise
  it('2d.path.arc.twopie.3', function() {
    ctx.fillStyle = '#f00';
    ctx.fillRect(0, 0, 100, 50);
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 100;
    ctx.beginPath();
    ctx.arc(50, 25, 50, 0, 2 * Math.PI + 1e-4, true);
    ctx.stroke();

    _assertPixel(gl, 50, 20, 0, 255, 0, 255);
  });

  // arc() draws nothing when end = start + 2pi+e and clockwise
  it('2d.path.arc.twopie.4', function() {
    ctx.fillStyle = '#f00';
    ctx.fillRect(0, 0, 100, 50);
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 100;
    ctx.beginPath();
    ctx.arc(50, 25, 50, 0, 2 * Math.PI + 1e-4, false);
    ctx.stroke();

    _assertPixel(gl, 50, 20, 0, 255, 0, 255);
  });

  // arc() from 0 to pi does not draw anything in the wrong half
  it('2d.path.arc.shape.1', function() {
    ctx.fillStyle = '#0f0';
    ctx.fillRect(0, 0, 100, 50);
    ctx.lineWidth = 50;
    ctx.strokeStyle = '#f00';
    ctx.beginPath();
    ctx.arc(50, 50, 50, 0, Math.PI, false);
    ctx.stroke();

    _assertPixel(gl, 50, 25, 0, 255, 0, 255);
    _assertPixel(gl, 1, 1, 0, 255, 0, 255);
    _assertPixel(gl, 98, 1, 0, 255, 0, 255);
    _assertPixel(gl, 1, 48, 0, 255, 0, 255);
    _assertPixel(gl, 20, 48, 0, 255, 0, 255);
    _assertPixel(gl, 98, 48, 0, 255, 0, 255);
  });

  // arc() from 0 to pi draws stuff in the right half
  it('2d.path.arc.shape.2', function() {
    ctx.fillStyle = '#f00';
    ctx.fillRect(0, 0, 100, 50);
    ctx.lineWidth = 100;
    ctx.strokeStyle = '#0f0';
    ctx.beginPath();
    ctx.arc(50, 50, 50, 0, Math.PI, true);
    ctx.stroke();

    _assertPixel(gl, 50, 25, 0, 255, 0, 255);
    _assertPixel(gl, 1, 1, 0, 255, 0, 255);
    _assertPixel(gl, 98, 1, 0, 255, 0, 255);
    _assertPixel(gl, 1, 48, 0, 255, 0, 255);
    _assertPixel(gl, 20, 48, 0, 255, 0, 255);
    _assertPixel(gl, 98, 48, 0, 255, 0, 255);
  });

  // arc() from 0 to -pi/2 does not draw anything in the wrong quadrant
  it('2d.path.arc.shape.3', function() {
    ctx.fillStyle = '#0f0';
    ctx.fillRect(0, 0, 100, 50);
    ctx.lineWidth = 100;
    ctx.strokeStyle = '#f00';
    ctx.beginPath();
    ctx.arc(0, 50, 50, 0, -Math.PI / 2, false);
    ctx.stroke();

    _assertPixel(gl, 50, 25, 0, 255, 0, 255);
    _assertPixel(gl, 1, 1, 0, 255, 0, 255);
    _assertPixel(gl, 98, 1, 0, 255, 0, 255);
    _assertPixel(gl, 1, 48, 0, 255, 0, 255);
    _assertPixel(gl, 98, 48, 0, 255, 0, 255);
  });

  // arc() from 0 to -pi/2 draws stuff in the right quadrant
  it('2d.path.arc.shape.4', function() {
    ctx.fillStyle = '#f00';
    ctx.fillRect(0, 0, 100, 50);
    ctx.lineWidth = 150;
    ctx.strokeStyle = '#0f0';
    ctx.beginPath();
    ctx.arc(-50, 50, 100, 0, -Math.PI / 2, true);
    ctx.stroke();

    _assertPixel(gl, 50, 25, 0, 255, 0, 255);
    _assertPixel(gl, 1, 1, 0, 255, 0, 255);
    _assertPixel(gl, 98, 1, 0, 255, 0, 255);
    _assertPixel(gl, 1, 48, 0, 255, 0, 255);
    _assertPixel(gl, 98, 48, 0, 255, 0, 255);
  });

  // arc() from 0 to 5pi does not draw crazy things
  it('2d.path.arc.shape.5', function() {
    ctx.fillStyle = '#0f0';
    ctx.fillRect(0, 0, 100, 50);
    ctx.lineWidth = 200;
    ctx.strokeStyle = '#f00';
    ctx.beginPath();
    ctx.arc(300, 0, 100, 0, 5 * Math.PI, false);
    ctx.stroke();
    _assertPixel(gl, 50, 25, 0, 255, 0, 255);
    _assertPixel(gl, 1, 1, 0, 255, 0, 255);
    _assertPixel(gl, 98, 1, 0, 255, 0, 255);
    _assertPixel(gl, 1, 48, 0, 255, 0, 255);

    _assertPixel(gl, 98, 48, 0, 255, 0, 255);
  });

  // arc() with lineWidth > 2*radius is drawn sensibly
  it('2d.path.arc.selfintersect.1', function() {
    ctx.fillStyle = '#0f0';
    ctx.fillRect(0, 0, 100, 50);
    ctx.lineWidth = 200;
    ctx.strokeStyle = '#f00';
    ctx.beginPath();
    ctx.arc(100, 50, 25, 0, -Math.PI / 2, true);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, -Math.PI / 2, true);
    ctx.stroke();

    _assertPixel(gl, 1, 1, 0, 255, 0, 255);
    _assertPixel(gl, 50, 25, 0, 255, 0, 255);
  });

  // arc() with lineWidth > 2*radius is drawn sensibly
  it('2d.path.arc.selfintersect.2', function() {
    ctx.fillStyle = '#f00';
    ctx.fillRect(0, 0, 100, 50);
    ctx.lineWidth = 180;
    ctx.strokeStyle = '#0f0';
    ctx.beginPath();
    ctx.arc(-50, 50, 25, 0, -Math.PI / 2, true);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(100, 0, 25, 0, -Math.PI / 2, true);
    ctx.stroke();

    _assertPixel(gl, 50, 25, 0, 255, 0, 255);
    _assertPixel(gl, 90, 10, 0, 255, 0, 255);
    _assertPixel(gl, 97, 1, 0, 255, 0, 255);
    _assertPixel(gl, 97, 2, 0, 255, 0, 255);
    _assertPixel(gl, 97, 3, 0, 255, 0, 255);
    _assertPixel(gl, 2, 48, 0, 255, 0, 255);
  });

  // arc() with negative radius throws INDEX_SIZE_ERR
  it('2d.path.arc.negative', function() {
    let fn = () => ctx.arc(0, 0, -1, 0, 0, true);
    assert.throws(fn, /The radius provided (.*) is negative/);
  });

  // arc() with zero radius draws a line to the start point
  it('2d.path.arc.zeroradius', function() {
    ctx.fillStyle = '#f00'
    ctx.fillRect(0, 0, 100, 50);
    ctx.lineWidth = 50;
    ctx.strokeStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(0, 25);
    ctx.arc(200, 25, 0, 0, Math.PI, true);
    ctx.stroke();

    _assertPixel(gl, 50, 25, 0, 255, 0, 255);
  });

  // arc() with Infinity/NaN is ignored
  it('2d.path.arc.nonfinite', function() {
    ctx.fillStyle = '#f00';
    ctx.fillRect(0, 0, 100, 50);
    ctx.moveTo(0, 0);
    ctx.lineTo(100, 0);
    ctx.arc(Infinity, 0, 50, 0, 2*Math.PI, true);
    ctx.arc(-Infinity, 0, 50, 0, 2*Math.PI, true);
    ctx.arc(NaN, 0, 50, 0, 2*Math.PI, true);
    ctx.arc(0, Infinity, 50, 0, 2*Math.PI, true);
    ctx.arc(0, -Infinity, 50, 0, 2*Math.PI, true);
    ctx.arc(0, NaN, 50, 0, 2*Math.PI, true);
    ctx.arc(0, 0, Infinity, 0, 2*Math.PI, true);
    ctx.arc(0, 0, -Infinity, 0, 2*Math.PI, true);
    ctx.arc(0, 0, NaN, 0, 2*Math.PI, true);
    ctx.arc(0, 0, 50, Infinity, 2*Math.PI, true);
    ctx.arc(0, 0, 50, -Infinity, 2*Math.PI, true);
    ctx.arc(0, 0, 50, NaN, 2*Math.PI, true);
    ctx.arc(0, 0, 50, 0, Infinity, true);
    ctx.arc(0, 0, 50, 0, -Infinity, true);
    ctx.arc(0, 0, 50, 0, NaN, true);
    ctx.arc(Infinity, Infinity, 50, 0, 2*Math.PI, true);
    ctx.arc(Infinity, Infinity, Infinity, 0, 2*Math.PI, true);
    ctx.arc(Infinity, Infinity, Infinity, Infinity, 2*Math.PI, true);
    ctx.arc(Infinity, Infinity, Infinity, Infinity, Infinity, true);
    ctx.arc(Infinity, Infinity, Infinity, 0, Infinity, true);
    ctx.arc(Infinity, Infinity, 50, Infinity, 2*Math.PI, true);
    ctx.arc(Infinity, Infinity, 50, Infinity, Infinity, true);
    ctx.arc(Infinity, Infinity, 50, 0, Infinity, true);
    ctx.arc(Infinity, 0, Infinity, 0, 2*Math.PI, true);
    ctx.arc(Infinity, 0, Infinity, Infinity, 2*Math.PI, true);
    ctx.arc(Infinity, 0, Infinity, Infinity, Infinity, true);
    ctx.arc(Infinity, 0, Infinity, 0, Infinity, true);
    ctx.arc(Infinity, 0, 50, Infinity, 2*Math.PI, true);
    ctx.arc(Infinity, 0, 50, Infinity, Infinity, true);
    ctx.arc(Infinity, 0, 50, 0, Infinity, true);
    ctx.arc(0, Infinity, Infinity, 0, 2*Math.PI, true);
    ctx.arc(0, Infinity, Infinity, Infinity, 2*Math.PI, true);
    ctx.arc(0, Infinity, Infinity, Infinity, Infinity, true);
    ctx.arc(0, Infinity, Infinity, 0, Infinity, true);
    ctx.arc(0, Infinity, 50, Infinity, 2*Math.PI, true);
    ctx.arc(0, Infinity, 50, Infinity, Infinity, true);
    ctx.arc(0, Infinity, 50, 0, Infinity, true);
    ctx.arc(0, 0, Infinity, Infinity, 2*Math.PI, true);
    ctx.arc(0, 0, Infinity, Infinity, Infinity, true);
    ctx.arc(0, 0, Infinity, 0, Infinity, true);
    ctx.arc(0, 0, 50, Infinity, Infinity, true);
    ctx.lineTo(100, 50);
    ctx.lineTo(0, 50);
    ctx.fillStyle = '#0f0';
    ctx.fill();

    _assertPixel(gl, 50, 25, 0, 255, 0, 255);
    _assertPixel(gl, 90, 45, 0, 255, 0, 255);
  });

  it('MDN arc example', function() {
    var options = { width: 150, height: 200, fileName: this.test.fullTitle() };
    ({ gl, ctx } = _initContext(options));

    for (var i=0;i<4;i++) {
      for(var j=0;j<3;j++) {
        ctx.beginPath();
        var x              = 25+j*50;               // x coordinate
        var y              = 25+i*50;               // y coordinate
        var radius         = 20;                    // Arc radius
        var startAngle     = 0;                     // Starting point on circle
        var endAngle       = Math.PI+(Math.PI*j)/2; // End point on circle
        var anticlockwise  = i%2==1;                // Draw anticlockwise
       
        ctx.arc(x,y,radius,startAngle,endAngle, anticlockwise);
       
        if (i>1){
          ctx.fill();
        } else {
          ctx.stroke();
        }
      }
    }

    _assertOutput(gl, options);
  })
})

describe('2d.lineWidth', function() {
  var gl, ctx;

  beforeEach(function() {
    ({ gl, ctx } = _initContext());
  });

  it('2d.line.width.basic', function() {
    ctx.fillStyle = '#0f0';
    ctx.fillRect(0, 0, 100, 50);
    ctx.lineWidth = 20;
    // Draw a green line over a red box, to check the line is not too small
    ctx.fillStyle = '#f00';
    ctx.strokeStyle = '#0f0';
    ctx.fillRect(15, 15, 20, 20);
    ctx.beginPath();
    ctx.moveTo(25, 15);
    ctx.lineTo(25, 35);
    ctx.stroke();
    // Draw a green box over a red line, to check the line is not too large
    ctx.fillStyle = '#0f0';
    ctx.strokeStyle = '#f00';
    ctx.beginPath();
    ctx.moveTo(75, 15);
    ctx.lineTo(75, 35);
    ctx.stroke();
    ctx.fillRect(65, 15, 20, 20);

    _assertPixel(gl, 14, 25, 0, 255, 0, 255);
    _assertPixel(gl, 15, 25, 0, 255, 0, 255);
    _assertPixel(gl, 16, 25, 0, 255, 0, 255);
    _assertPixel(gl, 25, 25, 0, 255, 0, 255);
    _assertPixel(gl, 34, 25, 0, 255, 0, 255);
    _assertPixel(gl, 35, 25, 0, 255, 0, 255);
    _assertPixel(gl, 36, 25, 0, 255, 0, 255);
    _assertPixel(gl, 64, 25, 0, 255, 0, 255);
    _assertPixel(gl, 65, 25, 0, 255, 0, 255);
    _assertPixel(gl, 66, 25, 0, 255, 0, 255);
    _assertPixel(gl, 75, 25, 0, 255, 0, 255);
    _assertPixel(gl, 84, 25, 0, 255, 0, 255);
    _assertPixel(gl, 85, 25, 0, 255, 0, 255);
    _assertPixel(gl, 86, 25, 0, 255, 0, 255);
  })
})

function _assertOutput(gl, { width = 100, height = 50, fileName } = {}) {
  var pixels = new Uint8Array(width * height * 4)
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
  
  fileName += '.png';
  var pngData = fs.readFileSync(fileName);
  var expectedData = PNG.sync.read(pngData).data;

  var compResult = expectedData.compare(Buffer.from(pixels));

  assert(compResult == 0, 'Output does not match the expected file');
}

function _getPixel(gl, x, y) {
  const width = 1,
    height = 1;

  var pixels = new Uint8Array(width * height * 4);
  gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

  return pixels;
}

function _assertPixel(gl, x, y, r, g, b, a) {
  var c = _getPixel(gl, x, y);
  assert.equal(c[0], r, 'Red channel of the pixel at (' + x + ', ' + y + ')');
  assert.equal(c[1], g, 'Green channel of the pixel at (' + x + ', ' + y + ')');
  assert.equal(c[2], b, 'Blue channel of the pixel at (' + x + ', ' + y + ')');
  assert.equal(c[3], a, 'Alpha channel of the pixel at (' + x + ', ' + y + ')');
}

function _initContext(options) {
  var options = options || {};
  //Create context
  var width = options.width || 100;
  var height = options.height || 50;
  var gl = require('gl')(width, height, { preserveDrawingBuffer: true });
  var ctx = new CanvasRenderingContext2D(gl, width, height);

  return { gl, ctx };
}

function _dumpAsPNG(gl, { width = 100, height = 50, fileName } = {}) {
  var data = [];
  var pixels = new Uint8Array(width * height * 4)
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
  
  var png = new PNG({
    width,
    height,
    filterType: -1
  });

  for (var i = 0; i < pixels.length; i += 4) {
    for (var j = 0; j < 4; ++j) {
      png.data[i + j] = pixels[i + j];
    }
  }

  png.pack().pipe(fs.createWriteStream(fileName + '.png'));
}
