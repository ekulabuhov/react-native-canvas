import CanvasRenderingContext2D from '../src/CanvasRenderingContext2D';
let assert = require('chai').assert;

describe('2d.fillRect', function() {
	var gl, ctx;

	beforeEach(function() {
    ({ gl, ctx } = _initContext());
  });

  it('fillRect works', function() {
		ctx.fillStyle = '#0f0';
		ctx.fillRect(0,0, 100,50);

		_assertPixel(gl, 50,25, 0,255,0,255);
  });
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
    
    _assertPixel(gl, 50,25, 0,255,0,255);
	});
});

function _getPixel(gl, x, y) {
	const width = 1,
		height = 1;

	var pixels = new Uint8Array(width * height * 4);
	gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

	return pixels;
}

function _assertPixel(gl, x,y, r,g,b,a) {
  var c = _getPixel(gl, x,y);
  assert.equal(c[0], r, 'Red channel of the pixel at (' + x + ', ' + y + ')');
  assert.equal(c[1], g, 'Green channel of the pixel at (' + x + ', ' + y + ')');
  assert.equal(c[2], b, 'Blue channel of the pixel at (' + x + ', ' + y + ')');
  assert.equal(c[3], a, 'Alpha channel of the pixel at (' + x + ', ' + y + ')');
}

function _initContext() {
	//Create context
	var width   = 100;
	var height  = 50;
	var gl = require('gl')(width, height, { preserveDrawingBuffer: true });
	var ctx = new CanvasRenderingContext2D(gl, width, height);

	return { gl, ctx };
}