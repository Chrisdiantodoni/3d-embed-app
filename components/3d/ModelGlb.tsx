import { useGLTF } from "@react-three/drei";

export default function ModelGlb({ url }: { url: string }) {
  // Masukkan path folder 'public/draco' sebagai argumen kedua
  // Next.js akan otomatis membaca dari folder public
  const { scene } = useGLTF(url, "/draco/");
  return <primitive object={scene} />;
}
