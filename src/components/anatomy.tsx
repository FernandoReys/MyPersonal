"use client";

import { Canvas, ThreeEvent, useThree } from "@react-three/fiber";
import { ContactShadows, Html, OrbitControls, useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { Mesh, MeshStandardMaterial } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { muscles } from "@/lib/catalog";

type View = "front" | "back" | "side";
type Group = (typeof muscles)[number]["id"];

function muscleGroup(name: string): Group | null {
  const n = name.toLowerCase();
  if (/pectoral/.test(n)) return "chest";
  if (/deltoid|supraspinatus|infraspinatus|teres minor|subscapularis/.test(n)) return "shoulders";
  if (/latissimus|trapezius|rhomboid|teres major|erector spinae|serratus posterior|multifidus/.test(n)) return "back";
  if (/rectus abdominis|oblique|transversus abdominis|serratus anterior/.test(n)) return "core";
  if (/biceps|triceps|brachial|pronator|supinator|flexor|extensor|anconeus/.test(n)) return "arms";
  if (/glute|femor|vastus|adductor|abductor|gracilis|sartorius|gastrocnemius|soleus|tibialis|fibularis|peroneus|popliteus|hamstring|semimembranosus|semitendinosus|iliacus|psoas/.test(n)) return "legs";
  return null;
}

function Model({ selected, onSelect }: { selected: string; onSelect: (group: string) => void }) {
  const { scene: source } = useGLTF("/anatomy/ecorche.meshopt.glb", false, true);
  const scene = useMemo(() => source.clone(true), [source]);
  const original = useRef(new WeakMap<Mesh, MeshStandardMaterial>());

  useEffect(() => {
    scene.traverse((object) => {
      const mesh = object as Mesh;
      if (!mesh.isMesh) return;
      const layer = String(mesh.userData.layer ?? "");
      mesh.visible = layer !== "deep muscles";
      const base = original.current.get(mesh) ?? (mesh.material as MeshStandardMaterial);
      original.current.set(mesh, base);
      if (mesh.material !== base) (mesh.material as MeshStandardMaterial).dispose();
      const group = muscleGroup(String(mesh.userData.name ?? mesh.name));
      if (layer === "superficial muscles" && group === selected) {
        const highlighted = base.clone();
        highlighted.emissive.set("#5ebf8a");
        highlighted.emissiveIntensity = 0.48;
        mesh.material = highlighted;
      } else {
        mesh.material = base;
      }
    });
    return () => {
      scene.traverse((object) => {
        const mesh = object as Mesh;
        if (!mesh.isMesh) return;
        const base = original.current.get(mesh);
        if (base && mesh.material !== base) {
          (mesh.material as MeshStandardMaterial).dispose();
          mesh.material = base;
        }
      });
    };
  }, [scene, selected]);

  function pick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    const object = event.object;
    if (object.userData.layer !== "superficial muscles") return;
    const group = muscleGroup(String(object.userData.name ?? object.name));
    if (group) onSelect(group);
  }

  return <primitive object={scene} onClick={pick} />;
}

function CameraView({ view }: { view: View }) {
  const camera = useThree((s) => s.camera);
  const controls = useRef<OrbitControlsImpl>(null);
  useEffect(() => {
    const angle = view === "back" ? Math.PI : view === "side" ? Math.PI / 2 : 0;
    camera.position.set(Math.sin(angle) * 3.45, 0.94, Math.cos(angle) * 3.45);
    camera.lookAt(0, 0.94, 0);
    controls.current?.target.set(0, 0.94, 0);
    controls.current?.update();
  }, [camera, view]);
  return (
    <OrbitControls
      ref={controls}
      target={[0, 0.94, 0]}
      enablePan={false}
      minDistance={1.8}
      maxDistance={6}
      minPolarAngle={Math.PI / 5}
      maxPolarAngle={Math.PI - Math.PI / 5}
    />
  );
}

export default function Anatomy({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  const [view, setView] = useState<View>("front");
  const select = (group: string) => {
    onSelect(group);
    if (group === "back") setView("back");
  };

  return (
    <div className="anatomy anatomy-3d">
      <div className="anatomy-tabs" role="group" aria-label="Vista anatômica">
        {([ ["front", "Frente"], ["back", "Costas"], ["side", "Lateral"] ] as const).map(([id, label]) => (
          <button key={id} className={view === id ? "active" : ""} aria-pressed={view === id} onClick={() => setView(id)}>{label}</button>
        ))}
      </div>
      <div className="anatomy-stage">
        <Canvas
          camera={{ position: [0, 0.94, 3.45], fov: 34, near: 0.1, far: 30 }}
          dpr={[1, 1.75]}
          fallback={<p className="anatomy-fallback">O navegador precisa de WebGL para exibir o modelo 3D. Use a lista de músculos abaixo.</p>}
        >
          <color attach="background" args={["#ffffff"]} />
          <ambientLight intensity={1.7} />
          <hemisphereLight args={["#ffffff", "#dde9e1", 1.2]} />
          <directionalLight position={[2, 4, 5]} intensity={2.2} />
          <directionalLight position={[-3, 2, -4]} intensity={1.2} />
          <Suspense fallback={<Html center><div className="anatomy-loading">Carregando modelo 3D…</div></Html>}>
            <Model selected={selected} onSelect={select} />
            <ContactShadows position={[0, -0.02, 0]} scale={2.5} opacity={0.15} blur={2.5} far={3} />
          </Suspense>
          <CameraView view={view} />
        </Canvas>
      </div>
      <div className="musclechips" aria-label="Grupos musculares">
        {muscles.map((m) => (
          <button key={m.id} aria-pressed={selected === m.id} className={selected === m.id ? "selected" : ""} onClick={() => select(m.id)}>{m.name}</button>
        ))}
      </div>
      <small>Arraste para girar · role para aproximar · clique em um músculo para explorar. <a href="https://github.com/Charleeh/ecorche" target="_blank" rel="noopener noreferrer">Modelo Écorché, CC BY-SA 4.0</a>.</small>
    </div>
  );
}
