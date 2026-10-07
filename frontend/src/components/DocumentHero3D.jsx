import { Canvas, useFrame } from "@react-three/fiber";
import {
    Float,
    Environment,
    RoundedBox,
    Text,
    ContactShadows,
} from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function DocumentPage({
    position,
    rotation,
    scale = 1,
    opacity = 1,
}) {
    const groupRef = useRef(null);

    useFrame((state) => {
        if (!groupRef.current) return;

        const time = state.clock.elapsedTime;

        groupRef.current.rotation.z =
            rotation[2] +
            Math.sin(time * 0.45) * 0.025;

        groupRef.current.rotation.x =
            rotation[0] +
            Math.sin(time * 0.35) * 0.015;
    });

    return (
        <group
            ref={groupRef}
            position={position}
            rotation={rotation}
            scale={scale}
        >
            {/* Paper */}
            <RoundedBox
                args={[3.4, 4.5, 0.12]}
                radius={0.08}
                smoothness={5}
            >
                <meshPhysicalMaterial
                    color="#f5f5f7"
                    roughness={0.32}
                    metalness={0.02}
                    transparent
                    opacity={opacity}
                />
            </RoundedBox>

            {/* Header */}
            <mesh position={[-0.8, 1.65, 0.09]}>
                <boxGeometry args={[1.25, 0.12, 0.025]} />
                <meshStandardMaterial
                    color="#171722"
                />
            </mesh>

            {/* AI indicator */}
            <mesh position={[1.05, 1.65, 0.09]}>
                <boxGeometry args={[0.38, 0.38, 0.025]} />
                <meshStandardMaterial
                    color="#7c5cff"
                    emissive="#5b3fd4"
                    emissiveIntensity={1.5}
                />
            </mesh>

            {/* Text lines */}
            {[1.15, 0.82, 0.49, 0.16, -0.17].map(
                (y, index) => (
                    <mesh
                        key={y}
                        position={[
                            -0.35,
                            y,
                            0.09,
                        ]}
                    >
                        <boxGeometry
                            args={[
                                index === 0
                                    ? 2.1
                                    : 2.55 -
                                      index * 0.22,
                                0.075,
                                0.02,
                            ]}
                        />

                        <meshStandardMaterial
                            color="#a6a6b4"
                        />
                    </mesh>
                )
            )}

            {/* Paragraph */}
            {[[-0.45, -0.58], [0.1, -0.58], [0.65, -0.58]].map(
                ([x, y], index) => (
                    <mesh
                        key={index}
                        position={[x, y, 0.09]}
                    >
                        <boxGeometry
                            args={[0.75, 0.055, 0.02]}
                        />

                        <meshStandardMaterial
                            color="#c4c4ce"
                        />
                    </mesh>
                )
            )}
        </group>
    );
}

function AIOrb() {
    const orbRef = useRef(null);

    useFrame((state) => {
        if (!orbRef.current) return;

        const time = state.clock.elapsedTime;

        orbRef.current.rotation.x =
            time * 0.35;

        orbRef.current.rotation.y =
            time * 0.5;

        orbRef.current.position.y =
            0.1 +
            Math.sin(time * 1.2) * 0.18;
    });

    return (
        <group ref={orbRef}>
            <mesh>
                <icosahedronGeometry
                    args={[0.24, 2]}
                />

                <meshPhysicalMaterial
                    color="#8b5cf6"
                    emissive="#6d28d9"
                    emissiveIntensity={2}
                    roughness={0.18}
                    metalness={0.35}
                />
            </mesh>

            <mesh scale={1.7}>
                <icosahedronGeometry
                    args={[0.24, 2]}
                />

                <meshBasicMaterial
                    color="#8b5cf6"
                    transparent
                    opacity={0.08}
                    side={THREE.BackSide}
                />
            </mesh>
        </group>
    );
}

function OrbitRing({
    radius,
    rotation,
    speed,
}) {
    const ringRef = useRef(null);

    useFrame(() => {
        if (!ringRef.current) return;

        ringRef.current.rotation.z +=
            speed;
    });

    return (
        <mesh
            ref={ringRef}
            rotation={rotation}
        >
            <torusGeometry
                args={[
                    radius,
                    0.008,
                    16,
                    100,
                ]}
            />

            <meshBasicMaterial
                color="#8b5cf6"
                transparent
                opacity={0.35}
            />
        </mesh>
    );
}

function Scene() {
    return (
        <>
            <ambientLight intensity={1.2} />

            <directionalLight
                position={[5, 6, 5]}
                intensity={3}
            />

            <pointLight
                position={[-4, 1, 3]}
                intensity={8}
                color="#7c3aed"
            />

            <pointLight
                position={[4, -2, 2]}
                intensity={5}
                color="#2563eb"
            />

            <Float
                speed={1.1}
                rotationIntensity={0.18}
                floatIntensity={0.35}
            >
                <DocumentPage
                    position={[0, 0, 0]}
                    rotation={[
                        -0.08,
                        0.12,
                        -0.08,
                    ]}
                    scale={1.08}
                />

                <DocumentPage
                    position={[
                        0.38,
                        -0.12,
                        -0.35,
                    ]}
                    rotation={[
                        -0.05,
                        0.17,
                        0.08,
                    ]}
                    scale={1.02}
                    opacity={0.92}
                />

                <DocumentPage
                    position={[
                        -0.35,
                        -0.18,
                        -0.7,
                    ]}
                    rotation={[
                        -0.03,
                        0.08,
                        -0.13,
                    ]}
                    scale={0.96}
                    opacity={0.82}
                />

                <AIOrb />

                <OrbitRing
                    radius={0.95}
                    rotation={[
                        1.1,
                        0.4,
                        0,
                    ]}
                    speed={0.004}
                />

                <OrbitRing
                    radius={1.25}
                    rotation={[
                        0.4,
                        1.0,
                        0.3,
                    ]}
                    speed={-0.003}
                />
            </Float>

            <ContactShadows
                position={[0, -2.8, 0]}
                opacity={0.35}
                scale={8}
                blur={3}
            />

            <Environment preset="city" />
        </>
    );
}

export default function DocumentHero3D() {
    return (
        <div className="h-[520px] w-full">
            <Canvas
                camera={{
                    position: [
                        0,
                        0,
                        7.5,
                    ],
                    fov: 38,
                }}
                dpr={[1, 1.7]}
                gl={{
                    antialias: true,
                    alpha: true,
                }}
            >
                <Scene />
            </Canvas>
        </div>
    );
}