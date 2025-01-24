import * as THREE from "three";
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

const getRandomData = (width, height) => {
  const length = width * height * 4;
  const data = new Float32Array(length);
    
  for (let i = 0; i < length; i++) {
    const stride = i * 4;
    const distance = Math.sqrt(Math.random()) * 2.0;
    const theta = THREE.MathUtils.randFloatSpread(360); 
    const phi = THREE.MathUtils.randFloatSpread(360); 

    data[stride] = distance * Math.sin(theta) * Math.cos(phi);
    data[stride + 1] = distance * Math.sin(theta) * Math.sin(phi);
    data[stride + 2] = distance * Math.cos(theta);
    data[stride + 3] = 1.0;
  }
  
  return data;
}

// Simulation Material
const SimulationMaterialImpl = shaderMaterial(
  {
    positions: null,
    uFrequency: 0.25,
    uTime: 0,
  },
  // Vertex Shader
  /*glsl*/`
  varying vec2 vUv; 
    void main() {
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      vec4 viewPosition = viewMatrix * modelPosition;
      vec4 projectedPosition = projectionMatrix * viewPosition;

      gl_Position = projectedPosition;
    }
  `,
  // Fragment Shader
  /*glsl*/`
    uniform sampler2D positions;
    uniform float uTime;
    uniform float uFrequency;

    varying vec2 vUv;

    vec3 mod289(vec3 x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec4 mod289(vec4 x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec4 permute(vec4 x) {
      return mod289(((x*34.0)+1.0)*x);
    }

    vec4 taylorInvSqrt(vec4 r) {
      return 1.79284291400159 - 0.85373472095314 * r;
    }

    float snoise(vec3 v) {
      const vec2  C = vec2(1.0/6.0, 1.0/3.0);
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 =   v - i + dot(i, C.xxx);

      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);

      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;

      i = mod289(i);
      vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));

      float n_ = 0.142857142857;
      vec3  ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);

      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);

      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);

      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    vec3 snoiseVec3(vec3 x) {
      float s  = snoise(vec3(x));
      float s1 = snoise(vec3(x.y - 19.1, x.z + 33.4, x.x + 47.2));
      float s2 = snoise(vec3(x.z + 74.2, x.x - 124.5, x.y + 99.4));
      vec3 c = vec3(s, s1, s2);
      return c;
    }

    vec3 curlNoise(vec3 p) {
      const float e = .1;
      vec3 dx = vec3(e, 0.0, 0.0);
      vec3 dy = vec3(0.0, e, 0.0);
      vec3 dz = vec3(0.0, 0.0, e);

      vec3 p_x0 = snoiseVec3(p - dx);
      vec3 p_x1 = snoiseVec3(p + dx);
      vec3 p_y0 = snoiseVec3(p - dy);
      vec3 p_y1 = snoiseVec3(p + dy);
      vec3 p_z0 = snoiseVec3(p - dz);
      vec3 p_z1 = snoiseVec3(p + dz);

      float x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
      float y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
      float z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;

      const float divisor = 1.0 / (2.0 * e);
      return normalize(vec3(x, y, z) * divisor);
    }

    void main() {
      vec3 pos = texture2D(positions, vUv).rgb;
      vec3 curlPos = texture2D(positions, vUv).rgb;

      pos = curlNoise(pos * uFrequency + uTime * 0.1);
      curlPos = curlNoise(curlPos * uFrequency + uTime * 0.1);
      curlPos += curlNoise(curlPos * uFrequency * 2.0) * 0.5;

      gl_FragColor = vec4(mix(pos, curlPos, sin(uTime)), 1.0);
    }
  `
);

// Points Material
const PointsMaterialImpl = shaderMaterial(
  {
    uPositions: null,
    uTime: 0
  },
  /*glsl*/`
    uniform sampler2D uPositions;
    uniform float uTime;

    void main() {
      vec3 pos = texture2D(uPositions, position.xy).xyz;

      vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
      vec4 viewPosition = viewMatrix * modelPosition;
      vec4 projectedPosition = projectionMatrix * viewPosition;

      gl_Position = projectedPosition;

      gl_PointSize = 3.0;
      gl_PointSize *= step(1.0 - (1.0/64.0), position.x) + 0.5;
    }
  `,
  /*glsl*/`
    void main() {
      gl_FragColor = vec4(1.0,0.0,0.0,1.0);
    }
  `
);

extend({ SimulationMaterialImpl, PointsMaterialImpl });

class SimulationMaterial extends SimulationMaterialImpl {
  constructor(size) {
    const positionsTexture = new THREE.DataTexture(
      getRandomData(size, size),
      size,
      size,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    positionsTexture.needsUpdate = true;

    super({
      positions: positionsTexture,
      uFrequency: 0.25,
      uTime: 0,
    });
  }
}

export default SimulationMaterial;
export { PointsMaterialImpl as PointsMaterial };
