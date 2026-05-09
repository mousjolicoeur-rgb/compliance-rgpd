"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async () => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nom_societe: nom }
      }
    });
    if (error) {
      setError(error.message);
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2">Créer un compte</h1>
        <p className="text-gray-500 mb-6">Compliance RGPD — Sécurité Privée</p>
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
        <input
          type="text"
          placeholder="Nom de votre société"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="w-full border p-3 rounded mb-3 text-black"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-3 rounded mb-3 text-black"
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-3 rounded mb-6 text-black"
        />
        <button
          onClick={handleRegister}
          className="w-full bg-green-600 text-white py-3 rounded font-semibold"
        >
          {loading ? "Création..." : "Créer mon compte"}
        </button>
        <p className="text-center mt-4 text-sm text-gray-600">
          Déjà un compte ?{" "}
          <a href="/login" className="text-blue-600 font-semibold">
            Se connecter
          </a>
        </p>
      </div>
    </div>
  );
}