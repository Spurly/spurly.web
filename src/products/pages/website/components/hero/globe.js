/* The hero globe: real continents as dots, live day/night from the UTC clock,
   and arcs from "You" to sample leads, colored by whether it is working hours
   where they are. Lives in the lazy hero chunk, so `three` never reaches the
   main bundle or the prerender. */

import {
  BufferAttribute,
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Points,
  QuadraticBezierCurve3,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from "three";
import { landAt } from "./landMask.js";
import { LEADS, ORIGIN, isAwake, localTime } from "./leads.js";
import { latLonToVec, smoothstep, subSolarPoint } from "./sun.js";

const RADIUS = 2;
const DOT_STEP = 1.6;
const REFRESH_MS = 20000;

const DOT_VERTEX =
  "attribute vec3 color;uniform float size;uniform float scale;varying vec3 vC;varying float vF;" +
  "void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vec3 nv=normalize(normalMatrix*normalize(position));" +
  "vF=smoothstep(.04,.42,nv.z);vC=color;gl_PointSize=max(1.,size*scale/(-mv.z)*(.45+.55*vF));gl_Position=projectionMatrix*mv;}";

const DOT_FRAGMENT =
  "varying vec3 vC;varying float vF;" +
  "void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(vC,vF*.96);}";

const SPHERE_VERTEX =
  "varying vec3 vN;varying vec3 vV;void main(){vN=normalize(position);vV=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}";

const SPHERE_FRAGMENT =
  "uniform vec3 sun;varying vec3 vN;varying vec3 vV;void main(){float d=dot(normalize(vN),normalize(sun));float day=smoothstep(-.1,.22,d);" +
  "vec3 dayC=vec3(.953,.918,.855);vec3 nightC=vec3(.74,.79,.81);vec3 c=mix(nightC,dayC,day);" +
  "float rim=pow(1.-abs(vV.z),2.6);c=mix(c,vec3(.58,.64,.68),rim*.3);gl_FragColor=vec4(c,1.);}";

function vec3(lat, lon, radius) {
  const [x, y, z] = latLonToVec(lat, lon, radius);
  return new Vector3(x, y, z);
}

function landDots() {
  const positions = [];
  for (let lat = -84; lat <= 84; lat += DOT_STEP) {
    const count = Math.max(8, Math.round((Math.cos((lat * Math.PI) / 180) * 360) / DOT_STEP));
    const offset = (Math.round((lat + 84) / DOT_STEP) % 2) * 0.5;
    for (let k = 0; k < count; k += 1) {
      const lon = -180 + ((k + offset) * 360) / count;
      if (landAt(lat, lon)) {
        const v = vec3(lat, lon, RADIUS + 0.004);
        positions.push(v.x, v.y, v.z);
      }
    }
  }
  return positions;
}

function makePin(labelsEl, className, name, extra) {
  const el = document.createElement("div");
  el.className = "gpin " + className;
  const dot = document.createElement("i");
  const label = document.createTextNode(name + " ");
  const em = document.createElement("em");
  em.textContent = extra;
  el.append(dot, label, em);
  labelsEl.appendChild(el);
  return { el, em };
}

/** Returns { resize, render(time, mx, my), destroy } or null without WebGL. */
export function createGlobe({ canvas, labelsEl, utcEl }) {
  let renderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 8.6);
  const globe = new Group();
  scene.add(globe);
  let width = 1;
  let height = 1;

  // land dots
  const positions = landDots();
  const count = positions.length / 3;
  const colors = new Float32Array(count * 3);
  const dotGeometry = new BufferGeometry();
  dotGeometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  const colorAttr = new BufferAttribute(colors, 3);
  dotGeometry.setAttribute("color", colorAttr);
  const dotUniforms = { size: { value: 0.038 }, scale: { value: 300 } };
  globe.add(
    new Points(
      dotGeometry,
      new ShaderMaterial({
        uniforms: dotUniforms,
        transparent: true,
        depthWrite: false,
        vertexShader: DOT_VERTEX,
        fragmentShader: DOT_FRAGMENT,
      }),
    ),
  );

  // sphere with live day/night
  const sun = new Vector3(1, 0, 0);
  const sunUniform = { value: sun };
  globe.add(
    new Mesh(
      new SphereGeometry(RADIUS - 0.012, 64, 48),
      new ShaderMaterial({
        uniforms: { sun: sunUniform },
        vertexShader: SPHERE_VERTEX,
        fragmentShader: SPHERE_FRAGMENT,
      }),
    ),
  );

  function updateSun(now) {
    const point = subSolarPoint(now);
    const s = vec3(point.lat, point.lon, 1).normalize();
    sun.copy(s);
    const rr = RADIUS + 0.004;
    for (let i = 0; i < count; i += 1) {
      const d = (positions[i * 3] * s.x + positions[i * 3 + 1] * s.y + positions[i * 3 + 2] * s.z) / rr;
      const t = smoothstep(-0.1, 0.22, d);
      colors[i * 3] = 0.4 + (0.12 - 0.4) * t;
      colors[i * 3 + 1] = 0.47 + (0.1 - 0.47) * t;
      colors[i * 3 + 2] = 0.52 + (0.09 - 0.52) * t;
    }
    colorAttr.needsUpdate = true;
  }

  // origin, leads, arcs
  const originPos = vec3(ORIGIN.ll[0], ORIGIN.ll[1], RADIUS + 0.01);
  const originMark = new Mesh(
    new SphereGeometry(0.07, 14, 14),
    new MeshBasicMaterial({ color: 0x1e1a16 }),
  );
  originMark.position.copy(originPos);
  globe.add(originMark);
  const originPin = makePin(labelsEl, "you", ORIGIN.name, ORIGIN.place);

  const leads = LEADS.map((lead, i) => {
    const p = vec3(lead.ll[0], lead.ll[1], RADIUS + 0.01);
    const a = originPos.clone().normalize().multiplyScalar(RADIUS);
    const b = vec3(lead.ll[0], lead.ll[1], RADIUS);
    const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(RADIUS + a.distanceTo(b) * 0.4);
    const curve = new QuadraticBezierCurve3(a, mid, b);
    const line = new Line(
      new BufferGeometry().setFromPoints(curve.getPoints(60)),
      new LineBasicMaterial({ color: 0x0a6f82, transparent: true, opacity: 0.3 }),
    );
    globe.add(line);
    const marker = new Mesh(new SphereGeometry(0.055, 12, 12), new MeshBasicMaterial({ color: 0x0d9bb5 }));
    marker.position.copy(p);
    globe.add(marker);
    const traveller = new Mesh(new SphereGeometry(0.05, 10, 10), new MeshBasicMaterial({ color: 0xf2a46b }));
    globe.add(traveller);
    return {
      lead,
      p,
      curve,
      line,
      marker,
      traveller,
      offset: i * 0.31,
      awake: false,
      pin: makePin(labelsEl, "off", lead.name, ""),
    };
  });

  let lastRefresh = 0;
  function refresh() {
    const nowMs = Date.now();
    if (nowMs - lastRefresh < REFRESH_MS) return;
    lastRefresh = nowMs;
    const now = new Date(nowMs);
    updateSun(now);
    if (utcEl) {
      utcEl.textContent =
        "UTC " + String(now.getUTCHours()).padStart(2, "0") + ":" + String(now.getUTCMinutes()).padStart(2, "0");
    }
    leads.forEach((x) => {
      const t = localTime(x.lead.tz, now);
      x.awake = isAwake(t.hour);
      x.pin.el.className = "gpin" + (x.awake ? "" : " off");
      x.pin.em.textContent = t.text + (x.awake ? "" : " · queued");
      x.marker.material.color.setHex(x.awake ? 0x0d9bb5 : 0x8f9ba1);
      x.line.material.opacity = x.awake ? 0.85 : 0.22;
    });
  }
  refresh();

  globe.rotation.x = 0.32;
  globe.position.set(0.1, 0, 0);

  const tmp = new Vector3();
  const camDir = new Vector3();
  const unit = new Vector3();
  function placeLabel(el, local) {
    tmp.copy(local);
    globe.localToWorld(tmp);
    camDir.copy(camera.position).normalize();
    const facing = unit.copy(tmp).normalize().dot(camDir);
    tmp.project(camera);
    el.style.opacity = facing > 0.12 ? "1" : "0";
    el.style.transform =
      "translate(" + ((tmp.x * 0.5 + 0.5) * width + 9).toFixed(1) + "px," + ((-tmp.y * 0.5 + 0.5) * height).toFixed(1) + "px) translateY(-50%)";
  }

  return {
    resize() {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.z = Math.max(8.6, 4.5 / (2 * Math.tan((16 * Math.PI) / 180) * camera.aspect));
      camera.updateProjectionMatrix();
      dotUniforms.scale.value = (height * renderer.getPixelRatio()) / 2;
    },
    render(time, mx, my) {
      refresh();
      globe.rotation.y = -2.35 + time * 0.03 + (mx - 0.5) * 0.7;
      globe.rotation.x = 0.32 + (0.5 - my) * 0.3;
      globe.updateMatrixWorld(true);
      leads.forEach((x) => {
        const u = (time * 0.2 + x.offset) % 1.6;
        const progress = Math.min(1, u);
        x.traveller.visible = x.awake && u < 1.05;
        x.traveller.position.copy(x.curve.getPoint(progress));
        x.marker.scale.setScalar(x.awake ? 1 + 0.3 * Math.sin(time * 2.4 + x.offset * 5) : 0.8);
        placeLabel(x.pin.el, x.p);
      });
      placeLabel(originPin.el, originPos);
      renderer.render(scene, camera);
    },
    destroy() {
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
      labelsEl.replaceChildren();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
