var PImage = require('pureimage');

export default class Text {
  constructor(gl, textureWidth, textureHeight, canvasWidth, canvasHeight, fontSize) {
    this.gl = gl;
    this.textureWidth = textureWidth;
    this.textureHeight = textureHeight;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.fontSize = fontSize;
  }

  generateFontTexture(callback) {
    let fnt = PImage.registerFont('node_modules/pureimage/tests/fonts/SourceSansPro-Regular.ttf', 'Source Sans Pro');

    this.fontLoading = true;

    fnt.load(() => {
      this.font = fnt.font;
      this.fontScale = 1 / this.font.unitsPerEm * this.fontSize;

      var img = PImage.make(this.textureWidth, this.textureHeight);
      var ctx = img.getContext('2d');
      //ctx.fillStyle = 'black';
      //ctx.fillRect(0, 0, width, height);
      ctx.clearRect(0, 0, this.textureWidth, this.textureHeight);
      ctx.mode = 'REPLACE'; // replace is used to disable alpha blending
      ctx.setFont('Source Sans Pro', 20);
      ctx.fillStyle = 'red';

      ctx.USE_FONT_GLYPH_CACHING = false;

      var charHeight = 20,
        charWidth = 20,
        leftPadding = 0;
      // Creating the ASCII pixelmap
      // Let's start with first drawable char (!) and finish with the last (~)
      // https://en.wikipedia.org/wiki/ASCII
      for (var i = 33, x = leftPadding, y = charHeight; i <= 126; i++) {
        // While drawing a glyph - lift it up from it's baseline so it doesn't overflow it's bounding box
        var glyph = this.font.charToGlyph(String.fromCodePoint(i)),
          yOffsetFromBaseline = glyph.getMetrics().yMin * this.fontScale;

        ctx.fillText(String.fromCodePoint(i), x, y + yOffsetFromBaseline);
        x += charWidth;
        if ((this.textureWidth - x) < charWidth) {
          y += charHeight;
          x = leftPadding;
        }
      }

      // let text = new Text(gl, textureWidth, textureHeight, canvas.width, canvas.height, fontSize);
      this.initGL();
      // console.log(fnt);
      this.uploadTexture(img._buffer);
      this.setupTextShaders();
      this.fontLoaded = true;
      this.fontLoading = false;
      callback();
    })
  }

  initGL() {
    let gl = this.gl;

    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);
    // Near things obscure far things
    gl.depthFunc(gl.LEQUAL);

    // We need to enable blending because our texture is transparent
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  uploadTexture(imageBuffer) {
    let gl = this.gl,
      textureWidth = this.textureWidth,
      textureHeight = this.textureHeight;

    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, textureWidth, textureHeight, 0 /*border*/ , gl.RGBA, gl.UNSIGNED_BYTE, imageBuffer);
    // gl.NEAREST is also allowed, instead of gl.LINEAR, as neither mipmap.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // Prevents s-coordinate wrapping (repeating).
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    // Prevents t-coordinate wrapping (repeating).
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    this.fontAtlasTexture = texture;
  }

  compileShader(type, source) {
    let gl = this.gl,
      shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.log("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  render(text, x, y) {
    if (!this.fontLoaded && !this.fontLoading) {
      this.generateFontTexture(() => { 
        this.pendingRenders.forEach((pr) => { pr() });
      });
    }

    if (this.fontLoading) {
      if (!this.pendingRenders) {
        this.pendingRenders = [];
      }
      this.pendingRenders.push(() => { this._render(text, x, y); });
    } else {
      this._render(text, x, y);
    }
  }

  setupTextShaders() {
    let gl = this.gl;

    var fragmentShader = this.compileShader(gl.FRAGMENT_SHADER,
      `varying highp vec2 vTextureCoord;
	    uniform sampler2D fontAtlas;

	    void main(void) {
		    gl_FragColor = texture2D(fontAtlas, vec2(vTextureCoord.s, vTextureCoord.t));
		    // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
		  }`);

    var vertexShader = this.compileShader(gl.VERTEX_SHADER,
      `attribute vec4 aVertexPosition;

	    uniform mat4 projection;

	    varying highp vec2 vTextureCoord;

	    void main(void) {
	    	gl_Position = projection * vec4(aVertexPosition.xy, 0.0, 1.0);
	    	vTextureCoord = aVertexPosition.zw;
	  	}`)

    let shaderProgram = this.shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      console.log("Unable to initialize the shader program: " + gl.getProgramInfoLog(shaderProgram));
    }

    gl.useProgram(shaderProgram);

    this.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(this.vertexPositionAttribute);

    var pUniform = gl.getUniformLocation(shaderProgram, "projection");
    var projection = this.make2dOrtho(0.0, this.canvasWidth, 0.0, this.canvasHeight);
    gl.uniformMatrix4fv(pUniform, false, new Float32Array(this.flatten(projection)));
  }

  // @param {string} str - The text string to render
  // @param {int} x - Specifies where to render text on X coordinate
  // @param {int} y - Specifies where to render text on Y coordinate
  _render(str, x, y) {
    let gl = this.gl;

    this.squareVerticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.squareVerticesBuffer);

    var xpos = x,
      startYpos = this.canvasHeight - this.fontSize - y,
      w = 20,
      h = 20,
      vertices = [];

    for (var i = 0; i < str.length; i++) {
      let atlasCode = str.charCodeAt(i) - 33, // 33 is an offset into ASCII table because we've skipped few codes
        xTexPos = atlasCode % 12, // 12 glyphs per line
        yTexPos = Math.floor(atlasCode / 12),
        charTexWidth = w / this.textureWidth,
        charTexHeight = h / this.textureHeight,
        glyph = this.font.charToGlyph(str[i]),
        yOffsetFromBaseline = glyph.getMetrics().yMin * this.fontScale,
        ypos = startYpos + yOffsetFromBaseline;

      // 6 vertices, describing 2 triangles
      // First 2 params are X/Y for each vertex, last 2 are offsets into font atlas texture
      vertices = vertices.concat([
        xpos, ypos + h, xTexPos * charTexWidth, yTexPos * charTexHeight, // top left
        xpos, ypos, xTexPos * charTexWidth, yTexPos * charTexHeight + charTexHeight, // bottom left
        xpos + w, ypos, xTexPos * charTexWidth + charTexWidth, yTexPos * charTexHeight + charTexHeight, // bottom right

        xpos, ypos + h, xTexPos * charTexWidth, yTexPos * charTexHeight, // top left
        xpos + w, ypos, xTexPos * charTexWidth + charTexWidth, yTexPos * charTexHeight + charTexHeight, // bottom right
        xpos + w, ypos + h, xTexPos * charTexWidth + charTexWidth, yTexPos * charTexHeight // top right
      ])

      console.log('advancing:', glyph.advanceWidth * this.fontScale);
      xpos += glyph.advanceWidth * this.fontScale;
    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    this.drawScene(str.length * 6);
  }

  drawScene(vertexCount) {
    let gl = this.gl;

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.fontAtlasTexture);
    gl.uniform1i(gl.getUniformLocation(this.shaderProgram, "fontAtlas"), 0);


    gl.bindBuffer(gl.ARRAY_BUFFER, this.squareVerticesBuffer);
    gl.vertexAttribPointer(this.vertexPositionAttribute, 4, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
  }

  // https://github.com/mdn/webgl-examples/blob/gh-pages/tutorial/glUtils.js
  // https://github.com/g-truc/glm/blob/e8962dda2a2652a6a97432449681a4366876fc84/glm/gtc/matrix_transform.inl#L164
  //
  make2dOrtho(left, right, bottom, top) {
    var tx = -(right + left) / (right - left);
    var ty = -(top + bottom) / (top - bottom);

    return [
      [2 / (right - left), 0, 0, tx],
      [0, 2 / (top - bottom), 0, ty],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ];
  }

  flatten(elements) {
    var result = [];
    if (elements.length == 0)
      return [];


    for (var j = 0; j < elements[0].length; j++)
      for (var i = 0; i < elements.length; i++)
        result.push(elements[i][j]);
    return result;
  }
}
