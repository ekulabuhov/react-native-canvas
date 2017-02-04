import Graphics from './Graphics'
import buildRectangle from './utils/buildRectangle';
import buildPoly from './utils/buildPoly';
import WebGLGraphicsData from './WebGLGraphicsData';
import PrimitiveShader from './PrimitiveShader';
import { SHAPES } from './const';
import * as utils from './utils';
import Matrix from './Matrix';
import Transform from './Transform';
import Text from './Text';

export default class CanvasRenderingContext2D {
  constructor(gl, width, height, scale = 1) {
    this.primitiveShader = new PrimitiveShader(gl);
    this.gl = gl;

    this.fillStyle = '#000'; // default black
    this.strokeStyle = '#000'; // default black

    // CanvasPathDrawingStyles
    this.lineWidth = 1; // default 1

    this._children = [];

    this.subpaths = [];

    // Setup text renderer
    let textureWidth = 256,
      textureHeight = 256,
      fontSize = 20;
    this.text = new Text(gl, textureWidth, textureHeight, width, height, fontSize);    

    Object.defineProperty(this, "fontUrl", { set: (val) => { this.text.fontUrl = val; } });

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

    gl.viewport(0, 0, width * scale, height * scale);
    requestAnimationFrame(() => { this._render() });
  }

  fillText(text, x, y) {
    this.text.render(text, x, y);
  }

  // interface CanvasRect
  fillRect(x, y, width, height) {
    var rectangle = new Graphics();
    rectangle.beginFill(this.fillStyle);
    rectangle.drawRect(x, y, width, height);
    rectangle.endFill();

    this._uploadData(rectangle);
  }

  strokeRect(x, y, width, height) {
    var rectangle = new Graphics();
    rectangle.lineStyle(this.lineWidth, this.strokeStyle);
    rectangle.drawRect(x, y, width, height);
    
    this._uploadData(rectangle);
    this._render();
  }

  clearRect(x, y, width, height) {
    const gl = this.gl;

    //gl.scissor(x, y, width, height);

    gl.clear( gl.COLOR_BUFFER_BIT );
  }

  rect(x, y, width, height) {
    this.subpaths.push([x,y, x+width,y, x+width,y+height, x,y+height])
  }

  _fillOrStroke(op) {
    if (this.subpaths.length == 0) {
      return;
    }

    var graphics = new Graphics();

    if (op == 'fill') {
      graphics.beginFill(this.fillStyle);
    } else {
      graphics.lineStyle(this.lineWidth, this.strokeStyle);
    }

    this.subpaths.forEach((subpath) => {
      graphics.drawPolygon(subpath);
    })

    graphics.endFill();

    this._uploadData(graphics);
  }

  fill() {
    this._fillOrStroke('fill');
  }

  stroke() {
    this._fillOrStroke('stroke');
  }

  closePath() {

  }

  beginPath() {
    this.subpaths = [];
  }

  moveTo(x, y) {
    this.subpaths.push([x, y]);
  }

  lineTo(x, y) {
    this.subpaths[this.subpaths.length-1].push(x, y);
  }

  arc(x, y, radius, startAngle, endAngle, anticlockwise) {
    if (!(isFinite(x) && isFinite(y) && isFinite(radius) && isFinite(startAngle) && isFinite(endAngle))) {
      return;
    }

    if (radius < 0) {
      throw new Error("Failed to execute 'arc' on 'CanvasRenderingContext2D': The radius provided (" + radius + ") is negative.", 'IndexSizeError');
    }

    if (startAngle == endAngle) {
      return;
    }

    let totalSegs = Math.floor(30 * Math.sqrt(radius));
    let fullCircle = Math.abs(startAngle - endAngle) >= 2 * Math.PI;

    // make sure parameters are in range
    startAngle = startAngle % (Math.PI * 2);
    endAngle = endAngle % (Math.PI * 2);

    if (fullCircle) {
      if (anticlockwise) {
        startAngle += 2 * Math.PI;
      } else {
        endAngle += 2 * Math.PI;
      }
    }

    // I don't like to work with negative values
    if (startAngle < 0 || endAngle < 0) {
      startAngle += 2 * Math.PI;
      endAngle += 2 * Math.PI;
    }

    if (anticlockwise && endAngle > startAngle) {
      endAngle = 2 * Math.PI - endAngle;
    }

    var delta = Math.abs(endAngle - startAngle) / (totalSegs || 1);

    if (anticlockwise) {
      delta = -delta;
    }

    if (!this.subpaths.length) {
      this.subpaths.push([]);
    }

    if (delta == 0) {
      totalSegs = 0;
    }

    for(var i = 0; i <= totalSegs; i++)
    {
      var f = startAngle + i * delta;
      this.lineTo(x + Math.cos(f) * radius, y + Math.sin(f) * radius);
    }
  }

  _uploadData(graphics) {
    let webGLData = new WebGLGraphicsData(this.gl, this.primitiveShader);

    // loop through the graphics datas and construct each one..
    graphics.graphicsData.forEach((data) => {
      if (data.type === SHAPES.POLY) {
        buildPoly(data, webGLData);
      }
      if (data.type === SHAPES.RECT) {
        buildRectangle(data, webGLData);
      }
    })

    // upload vertices and indexes
    webGLData.upload();
    // pixi provides this weird untyped object
    graphics._webGL = { data: [webGLData] };
    this._children.push(graphics);
  }

  _render() {
    const gl = this.gl;

    this.primitiveShader.bind();
    this.primitiveShader.uniforms.projectionMatrix = this.projectionMatrix.toArray(true);

    this._children.forEach((graphics) => {
      let webGLData = graphics._webGL.data[0];

      this.primitiveShader.uniforms.translationMatrix = graphics.transform.worldTransform.toArray(true);
      this.primitiveShader.uniforms.tint = utils.hex2rgb(graphics.tint);
      this.primitiveShader.uniforms.alpha = 1; // graphics.worldAlpha;

      webGLData.vao.bind()
      .draw(gl.TRIANGLE_STRIP,  webGLData.indices.length)
      .unbind();
    })
  }
}
