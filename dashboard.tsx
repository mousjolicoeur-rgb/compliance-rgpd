"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      await loadAnalyses(user.id);
      setLoading(false);
    };
    loadData();
  }, []);

  const loadAnalyses = async (userId: string) => {
    const { data } = await supabase
      .from("analyses")
      .select("*")
      .order("created_at", { ascending: false });
    setAnalyses(data || []);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    setResult(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", user.id);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    setResult(data);
    await loadAnalyses(user.id);
    setUploading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Chargement...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">Compliance RGPD</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.email}</span>
          <button onClick={handleLogout} className="text-sm text-red-500">Deconnexion</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-8">

        {/* UPLOAD */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <h2 className="text-lg font-bold mb-4">Analyser un document</h2>
          <label className="block w-full border-2 border-dashed border-blue-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition">
            <input type="file" accept=".pdf,.txt" onChange={handleUpload} className="hidden" />
            {uploading ? (
              <p className="text-blue-600 font-semibold">Analyse en cours...</p>
            ) : (
              <>
                <p className="text-2xl mb-2">📁</p>
                <p className="text-gray-600">Glissez ou cliquez pour uploader</p>
                <p className="text-sm text-gray-400 mt-1">PDF ou TXT — Rapport d incident, main courante...</p>
              </>
            )}
          </label>

          {/* RESULTAT */}
          {result && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border">

              {/* SCORE */}
              <div className="flex items-center gap-3 mb-4">
                <span className={`text-2xl font-bold ${
                  result.score < 30 ? "text-red-600" :
                  result.score < 70 ? "text-yellow-600" : "text-green-600"
                }`}>
                  Score : {result.score}/100
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                  result.niveau === "CRITIQUE" ? "bg-red-100 text-red-700" :
                  result.niveau === "ELEVE" ? "bg-orange-100 text-orange-700" :
                  result.niveau === "MODERE" ? "bg-yellow-100 text-yellow-700" :
                  "bg-green-100 text-green-700"
                }`}>
                  {result.niveau}
                </span>
              </div>

              {result.type_document && (
                <p className="text-sm text-gray-500 mb-4">
                  Type de document detecte : <strong>{result.type_document}</strong>
                </p>
              )}

              {/* RISQUES */}
              {result.risques?.length > 0 && (
                <div className="mb-4">
                  <p className="font-semibold text-red-600 mb-2">Risques detectes :</p>
                  <ul className="space-y-2">
                    {result.risques.map((r: any, i: number) => (
                      <li key={i} className="text-sm bg-red-50 border border-red-100 p-3 rounded">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-semibold text-red-700">[{r.article}]</span>
                            <span className="ml-2 text-gray-700">{r.description}</span>
                          </div>
                          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold ${
                            r.gravite === "CRITIQUE" ? "bg-red-200 text-red-700" :
                            r.gravite === "ELEVE" ? "bg-orange-200 text-orange-700" :
                            "bg-yellow-200 text-yellow-700"
                          }`}>{r.gravite}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ACTIONS */}
              {result.actions?.length > 0 && (
                <div className="mb-4">
                  <p className="font-semibold text-green-600 mb-2">Actions recommandees :</p>
                  <ul className="space-y-2">
                    {result.actions.map((a: any, i: number) => (
                      <li key={i} className="text-sm bg-green-50 border border-green-100 p-3 rounded">
                        <span className={`font-semibold mr-2 ${
                          a.priorite === 1 ? "text-red-600" :
                          a.priorite === 2 ? "text-orange-600" : "text-blue-600"
                        }`}>
                          P{a.priorite} — {a.delai} :
                        </span>
                        <span className="text-gray-700">{a.action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* POINTS CONFORMES */}
              {result.points_conformes?.length > 0 && (
                <div>
                  <p className="font-semibold text-blue-600 mb-2">Points conformes :</p>
                  <ul className="space-y-1">
                    {result.points_conformes.map((p: string, i: number) => (
                      <li key={i} className="text-sm text-gray-600">✓ {p}</li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          )}
        </div>

        {/* HISTORIQUE */}
        <h2 className="text-2xl font-bold mb-6">Historique des analyses</h2>
        {analyses.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center text-gray-500">
            Aucune analyse pour le moment.
          </div>
        ) : (
          <div className="space-y-4">
            {analyses.map((a) => (
              <div key={a.id} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">{a.nom_document}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    a.score < 30 ? "bg-red-100 text-red-600" :
                    a.score < 70 ? "bg-yellow-100 text-yellow-600" :
                    "bg-green-100 text-green-600"
                  }`}>
                    {a.score}/100
                  </span>
                </div>
                <p className="text-sm text-gray-400">
                  {new Date(a.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
