import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

const vertexShader = `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normal;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;

  void main() {
    // Création de plusieurs couches de points mobiles
    vec2 uv1 = vUv * 30.0 + vec2(uTime * 0.2, uTime * 0.1);
    vec2 uv2 = vUv * 20.0 + vec2(-uTime * 0.1, uTime * 0.3);
    
    float dots1 = length(fract(uv1) - 0.5);
    float dots2 = length(fract(uv2) - 0.5);
    
    // Création de points nets
    float pattern1 = smoothstep(0.4, 0.2, dots1);
    float pattern2 = smoothstep(0.4, 0.2, dots2);
    
    // Combinaison des motifs
    float finalPattern = max(pattern1, pattern2);
    
    // Couleur bleue avec variation d'intensité
    vec3 dotColor = vec3(0.0, 0.5, 1.0); // Bleu
    vec3 finalColor = dotColor * finalPattern;
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`

function Patatoide() {
  const meshRef = useRef<THREE.Mesh>(null)
  const [uniforms] = useState({
    uTime: { value: 0 }
  })
  
  const originalPositions = useMemo(() => {
    const geometry = new THREE.SphereGeometry(1, 32, 32)
    return geometry.attributes.position.array.slice()
  }, [])

  // useFrame((state, delta) => {
  //   if (!meshRef.current) return
    
  //   // Mise à jour du temps pour le shader
  //   uniforms.uTime.value = state.clock.elapsedTime
    
  //   // Garder la déformation originale
  //   const positions = meshRef.current.geometry.attributes.position.array
  //   for (let i = 0; i < positions.length; i += 3) {
  //     const time = state.clock.elapsedTime
  //     const noise = Math.sin(time + i) * 0.2
  //     positions[i] = originalPositions[i] + noise
  //     positions[i + 1] = originalPositions[i + 1] + noise
  //     positions[i + 2] = originalPositions[i + 2] + noise
  //   }
    
  //   meshRef.current.geometry.attributes.position.needsUpdate = true
  // })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 32, 32]} />
      <shaderMaterial 
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  )
}

export default function TestThree() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Patatoide />
        <OrbitControls />
      </Canvas>
    </div>
  )
}
