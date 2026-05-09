"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
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
        <h1 className="text-2xl font-bold mb-2">Connexion</h1>
        <p className="text-gray-500 mb-6">Compliance RGPD — Sécurité Privée</p>
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
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
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-3 rounded font-semibold"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
        <p className="text-center mt-4 text-sm text-gray-600">
          Pas de compte ?{" "}
          <a href="/register" className="text-blue-600 font-semibold">
            S'inscrire
          </a>
        </p>
      </div>
    </div>
  );
}