/* Full-bleed paper background: warm washes plus thin contour "ribbons" that
   fade out toward the copy. Plain WebGL1, no library, drawn at reduced
   resolution because it is all soft gradients. */

const NOISE =
  "float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}" +
  "float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}" +
  "float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*n(p);p*=2.02;a*=.5;}return s;}";

const HEAD = "precision mediump float;uniform vec2 r;uniform float t;uniform vec2 m;uniform float s;";

const FRAGMENT =
  HEAD +
  NOISE +
  "void main(){vec2 uv=gl_FragCoord.xy/r;vec2 p=uv*vec2(r.x/r.y,1.)*1.3;" +
  "float q=fbm(p+t*.03);float w=fbm(p*1.4+2.*q+m*.5-t*.02);" +
  "vec3 paper=vec3(.953,.929,.890);vec3 apricot=vec3(.949,.725,.561);vec3 tealw=vec3(.62,.84,.88);" +
  "vec3 c=paper;c=mix(c,apricot,smoothstep(.42,.78,w)*.4);c=mix(c,tealw,smoothstep(.45,.85,q)*.4*smoothstep(.2,.9,uv.x));" +
  "float s=sin(w*24.+t*.3);float line=clamp(.02/(abs(s)+.025),0.,1.);" +
  "vec3 lc=mix(vec3(.04,.42,.5),vec3(.82,.42,.2),smoothstep(.15,.95,uv.x*.7+w*.7));" +
  "c=mix(c,lc,line*.4*smoothstep(.05,.7,uv.x+.05));" +
  "c=mix(c,paper,smoothstep(.0,.6,1.-uv.x)*.7);gl_FragColor=vec4(c,1.);}";

/* Site-wide variant: the same contours, much fainter and strongest at the left
   and right edges so copy in the middle stays calm. `s` is the scroll offset in
   px, so the ribbons drift as you scroll. */
const SITE_FRAGMENT =
  HEAD +
  NOISE +
  "void main(){vec2 uv=gl_FragCoord.xy/r;vec2 p=uv*vec2(r.x/r.y,1.)*1.3;p.y+=s*.00035;" +
  "float q=fbm(p+t*.03);float w=fbm(p*1.4+2.*q+m*.3-t*.02);" +
  "vec3 paper=vec3(.953,.929,.890);vec3 apricot=vec3(.949,.725,.561);vec3 tealw=vec3(.62,.84,.88);" +
  "vec3 c=paper;c=mix(c,apricot,smoothstep(.45,.8,w)*.16);c=mix(c,tealw,smoothstep(.45,.85,q)*.16);" +
  "float sn=sin(w*24.+t*.3);float line=clamp(.02/(abs(sn)+.025),0.,1.);" +
  "vec3 lc=mix(vec3(.04,.42,.5),vec3(.82,.42,.2),smoothstep(.15,.95,uv.x*.7+w*.7));" +
  "float edge=smoothstep(.12,.55,abs(uv.x-.5));" +
  "c=mix(c,lc,line*(.07+.25*edge));gl_FragColor=vec4(c,1.);}";

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

/** Returns { resize, render(time, mx, my), destroy } or null without WebGL. */
export function createRibbonBackdrop(canvas, scale = 0.5, variant = "hero") {
  let gl = null;
  try {
    gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: false,
      powerPreference: "low-power",
    });
  } catch {
    gl = null;
  }
  if (!gl) return null;

  const vertex = compile(
    gl,
    gl.VERTEX_SHADER,
    "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}",
  );
  const fragment = compile(gl, gl.FRAGMENT_SHADER, variant === "site" ? SITE_FRAGMENT : FRAGMENT);
  if (!vertex || !fragment) return null;

  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(program, "r");
  const uTime = gl.getUniformLocation(program, "t");
  const uMouse = gl.getUniformLocation(program, "m");
  const uScroll = gl.getUniformLocation(program, "s");

  return {
    resize() {
      canvas.width = Math.max(2, Math.round(canvas.clientWidth * scale));
      canvas.height = Math.max(2, Math.round(canvas.clientHeight * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
    },
    render(time, mx, my) {
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, time + 8);
      gl.uniform2f(uMouse, mx, my);
      gl.uniform1f(uScroll, window.scrollY || 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    destroy() {
      const ext = gl.getExtension("WEBGL_lose_context");
      if (ext) ext.loseContext();
    },
  };
}
