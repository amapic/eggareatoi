import { OrbitControls, MeshTransmissionMaterial } from "@react-three/drei";
import { Canvas, useFrame, extend } from "@react-three/fiber";
import { useMemo, useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { useControls } from 'leva'
import { EffectComposer, Bloom } from '@react-three/postprocessing';
// import './scene.css';

extend({ Bloom });
const CustomGeometryParticles = (props) => {
  const { count } = props;
  const points = useRef();
  const referencePoints = useRef(); // Points de référence non affichés
  const sphereRefs = useRef([]);
  const lastResetTime = useRef(0);
  const [uniforms] = useState({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) }
  });

  const leaderFrequency = 10000;
  // Tableau pour stocker les temps de dernière interaction pour chaque point
  const lastInteractionTimes = useRef(new Float32Array(count).fill(-1));

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

  const mix = (a: number, b: number, t: number) => a * (1 - t) + b * t;

  useFrame((state) => {
    const { clock, camera, mouse } = state;
    const currentTime = clock.elapsedTime;
    uniforms.uTime.value = currentTime;
    
    // Paramètres de Halvorsen
    const a = -5.5;
    const b = 3.5;
    const d = -1;
    let normalTimestep = 0.01;
    let leaderTimestep = 0.01; // Timestep plus élevé pour les leaders
     // Une particule sur 1000 sera un leader
    
    if (currentTime > 10) {
      normalTimestep = 0.001;
      // leaderTimestep = 0.01;
    }
    // Paramètres de dilatation et retour
    const dilationStrength = 0.3;
    const dilationRadius = 1.0;
    const returnSpeed = 0.5;

    // Setup raycaster
    const planeNormal = new THREE.Vector3(0, 0, 1);
    const planeConstant = 0;
    const plane = new THREE.Plane(planeNormal, planeConstant);
    const raycaster = new THREE.Raycaster();
    const mousePosition = new THREE.Vector3();

    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(plane, mousePosition);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Déterminer si c'est une particule leader
      const isLeader = i % leaderFrequency === 0;
      const timestep = isLeader ? leaderTimestep : normalTimestep;

      // Position actuelle du point
      const pos = {
        x: points.current.geometry.attributes.position.array[i3],
        y: points.current.geometry.attributes.position.array[i3 + 1],
        z: points.current.geometry.attributes.position.array[i3 + 2]
      };

      // Position de référence
      const refPos = {
        x: referencePoints.current.geometry.attributes.position.array[i3],
        y: referencePoints.current.geometry.attributes.position.array[i3 + 1],
        z: referencePoints.current.geometry.attributes.position.array[i3 + 2]
      };

      // Équations de Halvorsen avec le timestep variable
      const dx = refPos.y * timestep;
      const dy = refPos.z * timestep;
      const dz = (-a*refPos.x -b*refPos.y -refPos.z + (d* (Math.pow(refPos.x, 3)))) * timestep;

      // Mise à jour des positions de référence
      referencePoints.current.geometry.attributes.position.array[i3] += dx;
      referencePoints.current.geometry.attributes.position.array[i3 + 1] += dy;
      referencePoints.current.geometry.attributes.position.array[i3 + 2] += dz;

      // Distance au curseur
      const distToMouse = Math.sqrt(
        Math.pow(pos.x - mousePosition.x, 2) + 
        Math.pow(pos.y - mousePosition.y, 2)
      );

      // Effet de dilatation
      const dilation = Math.max(0, 1 - distToMouse / dilationRadius) * dilationStrength;

      // Si le point est affecté par la souris, mettre à jour son temps d'interaction
      if (dilation > 0) {
        lastInteractionTimes.current[i] = currentTime;
      }

      // Calculer le facteur de mélange avec la vitesse de retour
      const timeSinceInteraction = currentTime - lastInteractionTimes.current[i];
      const t = Math.max(0, Math.min(1, timeSinceInteraction * returnSpeed));
      const mixFactor = t * t * t; // Garde la progression cubique pour la douceur

      if (distToMouse > 0 && 1==0) {
        // Calculer la distance à l'origine
        const distToOrigin = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
        
        // Direction depuis l'origine vers la particule (normalisée)
        const dirFromOrigin = {
          x: distToOrigin > 0 ? pos.x / distToOrigin : 0,
          y: distToOrigin > 0 ? pos.y / distToOrigin : 0,
          z: distToOrigin > 0 ? pos.z / distToOrigin : 0
        };

        // Position avec effet de dilatation radiale
        const dilatedPos = {
          x: pos.x + dirFromOrigin.x * dilation,
          y: pos.y + dirFromOrigin.y * dilation,
          z: pos.z + dirFromOrigin.z * dilation
        };

        // Mélange entre position dilatée et position de référence
        points.current.geometry.attributes.position.array[i3] = 
          dilatedPos.x * (1 - mixFactor) + referencePoints.current.geometry.attributes.position.array[i3] * mixFactor;
        points.current.geometry.attributes.position.array[i3 + 1] = 
          dilatedPos.y * (1 - mixFactor) + referencePoints.current.geometry.attributes.position.array[i3 + 1] * mixFactor;
        points.current.geometry.attributes.position.array[i3 + 2] = 
          dilatedPos.z * (1 - mixFactor) + referencePoints.current.geometry.attributes.position.array[i3 + 2] * mixFactor;
      } else {
        // Si pas d'effet de dilatation, suivre directement la position de référence
        points.current.geometry.attributes.position.array[i3] = referencePoints.current.geometry.attributes.position.array[i3];
        points.current.geometry.attributes.position.array[i3 + 1] = referencePoints.current.geometry.attributes.position.array[i3 + 1];
        points.current.geometry.attributes.position.array[i3 + 2] = referencePoints.current.geometry.attributes.position.array[i3 + 2];
      }
    }

    // Mise à jour des positions des sphères leaders
    sphereRefs.current.forEach((sphere, index) => {
      if (sphere) {
        sphere.position.set(
          points.current.geometry.attributes.position.array[index * leaderFrequency * 3],
          points.current.geometry.attributes.position.array[index * leaderFrequency * 3 + 1],
          points.current.geometry.attributes.position.array[index * leaderFrequency * 3 + 2]
        );
      }
    });

    points.current.geometry.attributes.position.needsUpdate = true;
    referencePoints.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <>
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particlesPosition.length / 3}
            array={particlesPosition}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={particlesPosition.length / 3}
            array={new Float32Array(particlesPosition.length / 3).map((_, i) => 
              i % leaderFrequency === 0 ? 50.0 : 20.0
            )}
            itemSize={1}
          />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={`
            attribute float size;
            uniform float uTime;
            uniform vec2 uMouse;
            varying float vDistance;

            void main() {
              vec4 modelPosition = modelMatrix * vec4(position, 1.0);
              vec4 viewPosition = viewMatrix * modelPosition;
              vec4 projectedPosition = projectionMatrix * viewPosition;

              vec2 screenPosition = projectedPosition.xy / projectedPosition.w;
              vDistance = length(screenPosition - uMouse);

              gl_Position = projectedPosition;
              gl_PointSize = size * (1.0 / -viewPosition.z);
            }
          `}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent={true}
          depthWrite={false}
        />
      </points>
      <points ref={referencePoints} visible={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particlesPosition.length / 3}
            array={particlesPosition.slice()}
            itemSize={3}
          />
        </bufferGeometry>
      </points>
      <group>
        {Array(Math.floor(count/leaderFrequency)).fill(null).map((_, index) => (
          <mesh
            key={index}
            ref={el => sphereRefs.current[index] = el}
            position={[
              points.current?.geometry.attributes.position.array[index * leaderFrequency * 3] || 0,
              points.current?.geometry.attributes.position.array[index * leaderFrequency * 3 + 1] || 0,
              points.current?.geometry.attributes.position.array[index * leaderFrequency * 3 + 2] || 0
            ]}
          >
            <sphereGeometry args={[0.01, 16, 16]} />
            <meshBasicMaterial
             color={[0, 127, 255]}
              // emissive="#0000ff"
              // emissiveIntensity={2}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
    </>
  );
};

const Scene2 = () => {
  const sphere = new THREE.SphereGeometry(0.01, 32, 32);

  const transmissionProps = useControls('Transmission Material', {
    transmission: { value: 1, min: 0, max: 1 },
    thickness: { value: 0.5, min: 0, max: 10 },
    roughness: { value: 0, min: 0, max: 1 },
    ior: { value: 2.5, min: 1, max: 3 },
    chromaticAberration: { value: 0.0, min: 0, max: 1 },
    backside: false,
    samples: { value: 6, min: 1, max: 32, step: 1 },
    resolution: { value: 256, min: 64, max: 2048, step: 64 },
    transmissionSampler: false,
    color: '#ffffff',
    distortion: { value: 0.1, min: 0, max: 1 },
    distortionScale: { value: 0.1, min: 0.01, max: 1 },
    temporalDistortion: { value: 0.1, min: 0, max: 1 },
  })

  return (
    <div className="bg-black" style={{ width: '100%', height: '100vh' }}>
      <Canvas camera={{ position: [-10, -4, 1.5] }}>
        <ambientLight intensity={0.5} />
        <CustomGeometryParticles count={20000} />
        <EffectComposer>
          <Bloom 
            threshold={0.1}
            strength={0.1}
            radius={0.01}
            luminanceThreshold={0.1}
            luminanceSmoothing={0.1}
          />
        </EffectComposer>
        <OrbitControls />
        {/* <axesHelper args={[1]} /> */}
      </Canvas>
    </div>
  );
};


export default Scene2;
