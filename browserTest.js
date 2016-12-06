import CanvasRenderingContext2D from './src/CanvasRenderingContext2D';

//Create context
var canvas = document.createElement('canvas');
canvas.width = canvas.height = 256;
document.body.appendChild(canvas);
var gl = canvas.getContext('webgl');

// Using script from KhronosGroup developer tools
function logGLCall(functionName, args) {
  console.log("gl." + functionName + "(" +
    WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ")");
}

gl = WebGLDebugUtils.makeDebugContext(gl, undefined, logGLCall);

var ctx = new CanvasRenderingContext2D(gl, canvas.width, canvas.height);

function gameLoop() {
  //requestAnimationFrame(gameLoop);
  ctx.fillRect(100, 100, 64, 64);
}

gameLoop();



