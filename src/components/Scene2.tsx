import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useEffect, useState } from "react";
import * as THREE from "three";
// import './scene.css';

const CustomGeometryParticles = (props) => {
  const { count } = props;
  const points = useRef();
  const [uniforms] = useState({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) }
  });

  const vertexShader = `
    uniform float uTime;
    uniform vec2 uMouse;
    varying float vDistance;

    void main() {
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      vec4 viewPosition = viewMatrix * modelPosition;
      vec4 projectedPosition = projectionMatrix * viewPosition;

      // Calculer la distance avec la souris dans l'espace de projection
      vec2 screenPosition = projectedPosition.xy / projectedPosition.w;
      vDistance = length(screenPosition - uMouse);

      gl_Position = projectedPosition;
      // La taille de base est multipliée par l'inverse de la distance à la caméra
      gl_PointSize = 20.0 * (1.0 / -viewPosition.z);
      // gl_PointSize = 10.0;
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    varying float vDistance;

    void main() {
      // Créer un point rond
      vec2 center = gl_PointCoord - 0.5;
      float dot = 1.0 - smoothstep(0.0, 0.5, length(center));

      // Couleur basée sur la distance à la souris
      vec3 blueColor = vec3(0.0, 0.5, 1.0);
      vec3 pinkColor = vec3(1.0, 0.2, 0.8);
      float colorMix = smoothstep(0.5, 0.0, vDistance);
      vec3 finalColor = mix(blueColor, pinkColor, colorMix);

      gl_FragColor = vec4(finalColor, dot);
    }
  `;

  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mousePos.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1
      };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Generate our positions attributes array
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const distance = 1;
    
    for (let i = 0; i < count; i++) {
      const golden_ratio = (1 + Math.sqrt(5)) / 2;
      const theta = 2 * Math.PI * i / golden_ratio;
      const phi = Math.acos(1 - 2 * (i + 0.5) / count);

      let sphereX = distance * Math.sin(phi) * Math.cos(theta);
      let sphereY = distance * Math.sin(phi) * Math.sin(theta);
      let sphereZ = distance * Math.cos(phi);

      positions.set([sphereX, sphereY, sphereZ], i * 3);
    }
    
    return positions;
  }, [count]);

  const mix = (a:number, b:number, t:number) => a * (1 - t) + b * t;

  useFrame((state) => {
    const { clock } = state;
    uniforms.uTime.value = clock.elapsedTime;
    
    // Paramètres de Halvorsen
    const a = 1.4;
    let timestep = 0.01;
    
    // Paramètres de dilatation
    const dilationStrength = 3.0;
    const dilationRadius = 3.0;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const pos = {
        x: points.current.geometry.attributes.position.array[i3],
        y: points.current.geometry.attributes.position.array[i3 + 1],
        z: points.current.geometry.attributes.position.array[i3 + 2]
      };

      // Calculer la distance au curseur
      const distToMouse = Math.sqrt(
        Math.pow(pos.x - mousePos.current.x, 2) + 
        Math.pow(pos.y - mousePos.current.y, 2)
      );

      // Calculer l'effet de dilatation
      const dilation = Math.max(0, 1 - distToMouse / dilationRadius) * dilationStrength;

      // Direction de dilatation

      if (clock.elapsedTime>5){
        timestep=0.001
      }

      let a = -5.5;
      let b = 3.5;
      let d = -1;

      let dx = pos.y * timestep;
      let dy = pos.z * timestep;
      let dz = (-a*pos.x -b*pos.y -pos.z + (d* (Math.pow(pos.x, 3)))) * timestep;

      // Équations de Halvorsen
      // const dx = (-a * pos.x - 4 * pos.y - 4 * pos.z - pos.y * pos.y) * timestep;
      // const dy = (-a * pos.y - 4 * pos.z - 4 * pos.x - pos.z * pos.z) * timestep;
      // const dz = (-a * pos.z - 4 * pos.x - 4 * pos.y - pos.x * pos.x) * timestep;

      
      // Application du mouvement de Halvorsen
      points.current.geometry.attributes.position.array[i3] += dx;
      points.current.geometry.attributes.position.array[i3 + 1] += dy;
      points.current.geometry.attributes.position.array[i3 + 2] += dz;
    
      // if (distToMouse > 0) {
      //   const dilationDir = {
      //     x: (pos.x - mousePos.current.x) / distToMouse,
      //     y: (pos.y - mousePos.current.y) / distToMouse
      //   };

      //   // Appliquer la dilatation
      //   points.current.geometry.attributes.position.array[i3] += dilationDir.x * dilation;
      //   points.current.geometry.attributes.position.array[i3 + 1] += dilationDir.y * dilation;
      // }
    
    }

    points.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesPosition.length / 3}
          array={particlesPosition}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
      />
    </points>
  );
};

const Scene2 = () => {
  return (
    <div className="bg-black" style={{ width: '100%', height: '100vh' }}>
    <Canvas camera={{ position: [1.5, 1.5, 1.5] }}>
      <ambientLight intensity={0.5} />
      <CustomGeometryParticles count={2000} />
      <OrbitControls />
      <axesHelper args={[1]} />
    </Canvas>
    </div>
  );
};


export default Scene2;
