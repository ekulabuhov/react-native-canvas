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
  // Draw shapes
  for (var i=0;i<4;i++){
    for(var j=0;j<3;j++){
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
}

gameLoop();
ctx.fontUrl = 'node_modules/pureimage/tests/fonts/SourceSansPro-Regular.ttf';
ctx.fillText('Hello World!', 0, 0)
ctx.fillText('Quick brown fox jumps over lazy dog', 0, 40);