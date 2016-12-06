import Graphics from './Graphics'
import buildRectangle from './utils/buildRectangle';
import WebGLGraphicsData from './WebGLGraphicsData';
import PrimitiveShader from './PrimitiveShader';
import { SHAPES } from './const';
import * as utils from './utils';
import Matrix from './Matrix';
import Transform from './Transform';

export default class CanvasRenderingContext2D {
  constructor(gl, width, height) {
    this.primitiveShader = new PrimitiveShader(gl);
    this.gl = gl;

    // Begin Setup
    gl.enable(gl.BLEND)
    gl.disable(gl.DEPTH_TEST)
    gl.frontFace(gl.CCW)
    gl.disable(gl.CULL_FACE)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

    // calculate projection matrix
    let pm = new Matrix(),
      x = 0, y = 0;
    pm.identity();
    pm.a = 1 / width * 2;
    pm.d = -1 / height * 2;

    pm.tx = -1 - x * pm.a;
    pm.ty = 1 - y * pm.d;

    this.projectionMatrix = pm;

    gl.viewport(0, 0, width, height);
  }

  // interface CanvasRect
  fillRect(x, y, width, height) {
    var rectangle = new Graphics();
    rectangle.beginFill(0x66CCFF);
    rectangle.lineStyle(4, 0xFF3300, 1);
    rectangle.drawRect(x, y, width, height);
    rectangle.endFill();

    this._render(rectangle);
  }

  _render(graphics) {
    const gl = this.gl;
    const data = graphics.graphicsData[0];
    
    gl.clearColor(0, 0, 0, 1); // rgba - black
    gl.clear(gl.COLOR_BUFFER_BIT);

    let webGLData;

    if (data.type === SHAPES.RECT) {
      webGLData = new WebGLGraphicsData(gl, this.primitiveShader);
      buildRectangle(data, webGLData);
    }

    // upload vertices and indexes
    webGLData.upload();

    // bind shader
    gl.useProgram(this.primitiveShader.program);
    // this one is a bit wicked, they use setters to mask GL uniform calls
    //shader.uniforms.projectionMatrix = this._activeRenderTarget.projectionMatrix.toArray(true);

    var shaderTemp = webGLData.shader;

    //renderer.bindShader(shaderTemp);
    shaderTemp.bind();
    shaderTemp.uniforms.projectionMatrix = this.projectionMatrix.toArray(true);
    //shaderTemp.uniforms.projectionMatrix = new Float32Array([0.0078125,0,0,0,-0.0078125,0,-1,1,1]);
    graphics.transform.updateTransform(new Transform());
    shaderTemp.uniforms.translationMatrix = graphics.transform.worldTransform.toArray(true);
    //shaderTemp.uniforms.translationMatrix = new Float32Array([1,0,0,0,1,0,171,170,1]);
    shaderTemp.uniforms.tint = utils.hex2rgb(graphics.tint);
    shaderTemp.uniforms.alpha = 1; // graphics.worldAlpha;

    webGLData.vao.bind()
    .draw(gl.TRIANGLE_STRIP,  webGLData.indices.length)
    .unbind();
  }
}
