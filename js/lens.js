/* Your $100: "Era Lens" for the cart only. The cart's 2D canvas goes through one WebGL shader
   that turns it into each era's display. All text on the page stays crisp HTML. */
(() => {
  const VS = `attribute vec2 p; varying vec2 vUv; void main(){ vUv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;
  const FS = `
precision mediump float;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform float uTime, w80, w90, w00, w20, wai, uGlitch;
uniform vec2 uMouse;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y); }
float b2(vec2 q) { q = floor(mod(q, 2.)); return mod(2. * q.x + 3. * q.y, 4.); }
float bayer(vec2 p) { return (4. * b2(p) + b2(floor(p / 2.))) / 16.; }
vec4 T(vec2 uv) { return texture2D(uTex, uv); }
void main() {
  vec2 uv = vUv;
  float ai = clamp(wai + uGlitch, 0., 1.6);
  float md = distance(vUv, uMouse);
  // AI: the cart starts to hallucinate (strongest near your cursor)
  vec2 flow = vec2(noise(uv * 4. + uTime * .15), noise(uv * 4. + 9. + uTime * .15)) - .5;
  uv += flow * (.012 * ai + .05 * ai * smoothstep(.3, 0., md));
  if (uGlitch > .01) {
    float row = floor(uv.y * 22.);
    if (hash(vec2(row, floor(uTime * 14.))) < uGlitch * .5) uv.x += (hash(vec2(row, 4.1)) - .5) * .16 * uGlitch;
  }
  // 1980s: curved glass
  vec2 c = uv - .5;
  uv = .5 + c * (1. + .22 * w80 * dot(c, c));
  // 1990s: chunky pixels
  float px = 1. + 2. * w90;
  if (w90 > .02) uv = mix(uv, (floor(uv * uRes / px) + .5) / (uRes / px), smoothstep(.02, .5, w90));
  float ca = .002 * w80 + .007 * ai;
  vec4 s = T(uv);
  vec3 col = vec3(T(uv + vec2(ca, 0.)).r, s.g, T(uv - vec2(ca, 0.)).b);
  float a = max(s.a, max(T(uv + vec2(ca, 0.)).a, T(uv - vec2(ca, 0.)).a));
  if (ai > .01) { // ghost copies
    vec4 g1 = T(uv + vec2(.02 * sin(uTime * .7), -.015));
    vec4 g2 = T(uv + vec2(-.025, .02 * cos(uTime * .55)));
    vec4 g = max(g1, g2);
    col = mix(col, max(col, g.rgb * vec3(1., .8, 1.2)), .35 * min(ai, 1.) * g.a);
    a = max(a, g.a * .35 * min(ai, 1.));
  }
  if (w80 > .01) { // phosphor bloom + scanlines
    vec4 bl = (T(uv + vec2(.004, 0.)) + T(uv - vec2(.004, 0.)) + T(uv + vec2(0., .005)) + T(uv - vec2(0., .005))) * .25;
    vec3 crt = col + bl.rgb * .8;
    crt *= (.7 + .3 * sin(vUv.y * uRes.y * 1.4)) * (.96 + .04 * sin(uTime * 50.));
    col = mix(col, crt, w80);
    a = max(a, bl.a * .6 * w80);
    a = max(a, .14 * w80); // faint phosphor glow over the whole tube
    col = mix(col, vec3(.02, .09, .03), (1. - s.a) * w80 * .9);
  }
  if (w90 > .01) { // ordered dither to a web-safe palette
    float d = bayer(gl_FragCoord.xy / px) - .5;
    col = mix(col, floor(col * 5. + d + .5) / 5., w90);
  }
  if (w00 > .01) { // glossy plastic
    float l = dot(col, vec3(.299, .587, .114));
    col = mix(col, mix(vec3(l), col, 1.3) + pow(max(0., 1. - vUv.y * 1.6), 3.) * .2, w00);
  }
  col += (hash(gl_FragCoord.xy + floor(uTime * 24.)) - .5) * .06 * (w20 + ai * .8) * a;
  if (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) { col = vec3(0.); a = w80; }
  gl_FragColor = vec4(col * a, a);
}`;

  class CartLens {
    constructor(source, target) {
      this.src = source;
      this.dst = target;
      const gl = target.getContext("webgl", { premultipliedAlpha: true, antialias: false, alpha: true });
      if (!gl) throw new Error("no webgl");
      this.gl = gl;
      const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
      const prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "p");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.u = {};
      for (const n of ["uTex", "uRes", "uTime", "w80", "w90", "w00", "w20", "wai", "uGlitch", "uMouse"]) this.u[n] = gl.getUniformLocation(prog, n);
      this.t0 = performance.now();
    }
    render(w, glitch, mouse) {
      const { gl, src, dst } = this;
      if (dst.width !== src.width || dst.height !== src.height) { dst.width = src.width; dst.height = src.height; }
      gl.viewport(0, 0, dst.width, dst.height);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.uniform1i(this.u.uTex, 0);
      gl.uniform2f(this.u.uRes, dst.width, dst.height);
      gl.uniform1f(this.u.uTime, (performance.now() - this.t0) / 1000);
      gl.uniform1f(this.u.w80, w["80s"] || 0);
      gl.uniform1f(this.u.w90, w["90s"] || 0);
      gl.uniform1f(this.u.w00, w["00s"] || 0);
      gl.uniform1f(this.u.w20, w["20s"] || 0);
      gl.uniform1f(this.u.wai, w.ai || 0);
      gl.uniform1f(this.u.uGlitch, glitch);
      gl.uniform2f(this.u.uMouse, mouse[0], mouse[1]);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  }
  TT.CartLens = CartLens;
})();
