"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

const plans = [
  {
    name: "Starter",
    price: "49",
    features: ["5 analyses / mois", "PDF & TXT", "Score RGPD", "Email support"],
    highlight: false,
  },
  {
    name: "Business",
    price: "99",
    features: ["30 analyses / mois", "Rapport detaille PDF", "Historique 12 mois", "Support prioritaire"],
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "199",
    features: ["Analyses illimitees", "Multi-sites", "API dediee", "Accompagnement DPO"],
    highlight: false,
  },
];

export default function AbonnementPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const supabase = createClient();

  const handleSubscribe = async (planName: string) => {
    setLoading(planName);
    const { data: { user } } = await supabase.auth.getUser();

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planName,
        email: user?.email || "",
      }),
    });

    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert(data.error ?? "Erreur lors de la redirection vers le paiement.");
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex justify-between items-center">
        <a href="/" className="text-xl font-bold text-blue-600">Compliance RGPD</a>
        <a href="/dashboard" className="text-sm text-gray-600">Mon dashboard</a>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choisissez votre plan</h1>
          <p className="text-gray-500 text-lg">Sans engagement. Resiliable a tout moment.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div key={plan.name} className={`bg-white rounded-xl p-8 shadow-sm border-2 ${
              plan.highlight ? "border-blue-500" : "border-gray-100"
            }`}>
              {plan.highlight && (
                <div className="text-center mb-4">
                  <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                    Populaire
                  </span>
                </div>
              )}
              <h2 className="text-xl font-bold mb-2">{plan.name}</h2>
              <div className="text-4xl font-bold mb-1">€{plan.price}</div>
              <p className="text-gray-400 text-sm mb-6">/ mois HT</p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="text-blue-500">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan.name)}
                disabled={loading === plan.name}
                className={`w-full py-3 rounded-lg font-semibold text-sm transition ${
                  plan.highlight
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                {loading === plan.name ? "Redirection..." : "Choisir ce plan"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}