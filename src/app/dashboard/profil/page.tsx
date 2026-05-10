"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

const ACCOUNTS = [
  { id: "1", initials: "MJ", name: "Mustapha J.", email: "mustapha@compliance-rgpd.fr", plan: "Business", color: "#B07D2A", bg: "#B07D2A22", active: true },
  { id: "2", initials: "AC", name: "Acme Corp", email: "admin@acmecorp.fr", plan: "Starter", color: "#185FA5", bg: "#E6F1FB", active: false },
  { id: "3", initials: "DG", name: "DPO Groupe", email: "dpo@groupe-legal.fr", plan: "Enterprise", color: "#0F6E56", bg: "#E1F5EE", active: false },
];

export default function ProfilPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<{ email: string; id: string } | null>(null);
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [societe, setSociete] = useState("");
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [accounts, setAccounts] = useState(ACCOUNTS);
  const [newAccountEmail, setNewAccountEmail] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [pwdOk, setPwdOk] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [switchOk, setSwitchOk] = useState(false);
  const [addOk, setAddOk] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser({ email: user.email ?? "", id: user.id });
      const meta = user.user_metadata;
      setPrenom(meta?.prenom ?? "");
      setNom(meta?.nom ?? "");
      setSociete(meta?.societe ?? "");
    };
    loadUser();
  }, []);

  const initials = (prenom.charAt(0) + nom.charAt(0)).toUpperCase() || "?";

  const handleSaveProfil = async () => {
    await supabase.auth.updateUser({ data: { prenom, nom, societe } });
    setSaveOk(true);
    setTimeout(() => setSaveOk(false), 2500);
  };

  const handleChangePwd = async () => {
    setPwdError("");
    if (newPwd.length < 8) { setPwdError("8 caractères minimum."); return; }
    if (newPwd !== confirmPwd) { setPwdError("Les mots de passe ne correspondent pas."); return; }
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    if (error) { setPwdError(error.message); return; }
    setPwdOk(true);
    setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    setTimeout(() => setPwdOk(false), 2500);
  };

  const handleSwitchAccount = (id: string) => {
    setAccounts(prev => prev.map(a => ({ ...a, active: a.id === id })));
    setSwitchOk(true);
    setTimeout(() => setSwitchOk(false), 2500);
  };

  const handleAddAccount = async () => {
    if (!newAccountEmail.trim()) return;
    const { error } = await supabase.auth.signInWithOtp({ email: newAccountEmail });
    if (!error) {
      setAddOk(true);
      setNewAccountEmail("");
      setShowAddForm(false);
      setTimeout(() => setAddOk(false), 3000);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("Supprimer définitivement votre compte ? Cette action est irréversible.");
    if (!confirmed) return;
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #F8F7F4; color: #1a1a1a; }
        .p-page { max-width: 680px; margin: 0 auto; padding: 32px 24px; }
        .p-back { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #888; cursor: pointer; margin-bottom: 20px; background: none; border: none; font-family: 'DM Sans', sans-serif; }
        .p-back:hover { color: #B07D2A; }
        .p-title { font-family: 'DM Serif Display', serif; font-size: 24px; margin-bottom: 4px; }
        .p-sub { font-size: 13px; color: #888; margin-bottom: 28px; }
        .card { background: #fff; border: 0.5px solid #E0DDD6; border-radius: 12px; padding: 20px 24px; margin-bottom: 16px; }
        .card-title { font-size: 13px; font-weight: 500; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; color: #1a1a1a; }
        .card-title i { font-size: 16px; color: #B07D2A; }
        .avatar { width: 64px; height: 64px; border-radius: 50%; background: #B07D2A22; border: 2px solid #B07D2A55; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 600; color: #B07D2A; flex-shrink: 0; }
        .avatar-sm { width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; flex-shrink: 0; }
        .field { margin-bottom: 14px; }
        .label { font-size: 11px; font-weight: 500; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
        .input { width: 100%; font-size: 13px; padding: 8px 12px; border-radius: 8px; border: 0.5px solid #D3D1C7; background: #F8F7F4; color: #1a1a1a; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.15s; }
        .input:focus { border-color: #B07D2A; }
        .input:disabled { opacity: 0.5; cursor: not-allowed; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .btn { font-size: 13px; font-weight: 500; padding: 8px 18px; border-radius: 8px; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: opacity 0.15s; }
        .btn-primary { background: #B07D2A; color: #fff; }
        .btn-primary:hover { opacity: 0.85; }
        .btn-outline { background: none; border: 0.5px solid #D3D1C7; color: #1a1a1a; }
        .btn-outline:hover { background: #F1EFE8; }
        .btn-danger { background: none; border: 0.5px solid #E24B4A; color: #A32D2D; }
        .btn-danger:hover { background: #FCEBEB; }
        .btn-sm { font-size: 12px; padding: 6px 14px; }
        .badge { font-size: 11px; padding: 3px 10px; border-radius: 100px; background: #EAF3DE; color: #3B6D11; font-weight: 500; }
        .hint { font-size: 11px; color: #bbb; margin-top: 4px; }
        .alert-ok { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #3B6D11; background: #EAF3DE; padding: 7px 12px; border-radius: 8px; margin-top: 10px; }
        .alert-err { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #A32D2D; background: #FCEBEB; padding: 7px 12px; border-radius: 8px; margin-top: 10px; }
        .plan-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 0.5px solid #F1EFE8; }
        .plan-row:last-child { border-bottom: none; }
        .account-row { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 8px; border: 0.5px solid #E0DDD6; margin-bottom: 8px; cursor: pointer; transition: all 0.15s; }
        .account-row:hover { border-color: #B07D2A55; background: #F8F7F4; }
        .account-row.active { border-color: #B07D2A; background: #B07D2A08; }
        .active-dot { width: 8px; height: 8px; border-radius: 50%; background: #B07D2A; flex-shrink: 0; }
        .add-btn { display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 12px; border-radius: 8px; border: 0.5px dashed #D3D1C7; background: none; cursor: pointer; font-size: 13px; color: #888; font-family: 'DM Sans', sans-serif; transition: all 0.15s; margin-top: 4px; }
        .add-btn:hover { border-color: #B07D2A55; color: #B07D2A; background: #F8F7F4; }
        .add-form { margin-top: 12px; padding: 14px; background: #F8F7F4; border-radius: 8px; }
        .add-form-row { display: flex; gap: 8px; margin-top: 8px; }
        .danger-card { border-color: #F09595 !important; }
        .danger-title { color: #A32D2D !important; }
      `}</style>

      <div className="p-page">
        <button className="p-back" onClick={() => router.push("/dashboard")}>
          <i className="ti ti-arrow-left" aria-hidden="true" /> Retour au dashboard
        </button>

        <div className="p-title">Mon profil</div>
        <div className="p-sub">Gérez vos informations personnelles et la sécurité de votre compte</div>

        {/* IDENTITÉ */}
        <div className="card">
          <div className="card-title"><i className="ti ti-user-circle" aria-hidden="true" /> Informations du compte</div>
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 20 }}>
            <div className="avatar">{initials}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 2 }}>{prenom} {nom}</div>
              <div style={{ fontSize: 12, color: "#888" }}>{user?.email}</div>
              <span className="badge" style={{ marginTop: 6, display: "inline-block" }}>Plan Business</span>
            </div>
          </div>
          <div className="grid2">
            <div className="field">
              <div className="label">Prénom</div>
              <input className="input" type="text" value={prenom} onChange={e => setPrenom(e.target.value)} />
            </div>
            <div className="field">
              <div className="label">Nom</div>
              <input className="input" type="text" value={nom} onChange={e => setNom(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <div className="label">Email</div>
            <input className="input" type="email" value={user?.email ?? ""} disabled />
            <div className="hint">L'email ne peut pas être modifié directement — contactez le support.</div>
          </div>
          <div className="field">
            <div className="label">Société (optionnel)</div>
            <input className="input" type="text" placeholder="Nom de votre entreprise" value={societe} onChange={e => setSociete(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button className="btn btn-primary" onClick={handleSaveProfil}>Enregistrer les modifications</button>
            <button className="btn btn-outline" onClick={() => router.push("/dashboard")}>Annuler</button>
          </div>
          {saveOk && <div className="alert-ok"><i className="ti ti-circle-check" aria-hidden="true" /> Profil mis à jour avec succès</div>}
        </div>

        {/* MOT DE PASSE */}
        <div className="card">
          <div className="card-title"><i className="ti ti-lock" aria-hidden="true" /> Changer le mot de passe</div>
          <div className="field">
            <div className="label">Mot de passe actuel</div>
            <input className="input" type="password" placeholder="••••••••" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} />
          </div>
          <div className="grid2">
            <div className="field">
              <div className="label">Nouveau mot de passe</div>
              <input className="input" type="password" placeholder="••••••••" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
              <div className="hint">8 caractères minimum</div>
            </div>
            <div className="field">
              <div className="label">Confirmer</div>
              <input className="input" type="password" placeholder="••••••••" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleChangePwd}>Mettre à jour le mot de passe</button>
          {pwdOk && <div className="alert-ok"><i className="ti ti-circle-check" aria-hidden="true" /> Mot de passe mis à jour</div>}
          {pwdError && <div className="alert-err"><i className="ti ti-alert-circle" aria-hidden="true" /> {pwdError}</div>}
        </div>

        {/* MULTI-COMPTES */}
        <div className="card">
          <div className="card-title"><i className="ti ti-switch-horizontal" aria-hidden="true" /> Changer de compte</div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 14 }}>Basculez entre vos différents comptes sans vous déconnecter.</div>
          {accounts.map(a => (
            <div key={a.id} className={`account-row${a.active ? " active" : ""}`} onClick={() => handleSwitchAccount(a.id)}>
              <div className="avatar-sm" style={{ background: a.bg, color: a.color }}>{a.initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>
                  {a.name}
                  {a.active && <span className="badge" style={{ marginLeft: 8, fontSize: 10 }}>Actif</span>}
                </div>
                <div style={{ fontSize: 11, color: "#aaa" }}>{a.email} · Plan {a.plan}</div>
              </div>
              {a.active && <div className="active-dot" />}
            </div>
          ))}
          {switchOk && <div className="alert-ok"><i className="ti ti-switch-horizontal" aria-hidden="true" /> Compte changé avec succès</div>}
          {addOk && <div className="alert-ok"><i className="ti ti-mail" aria-hidden="true" /> Lien de connexion envoyé !</div>}
          <button className="add-btn" onClick={() => setShowAddForm(v => !v)}>
            <i className="ti ti-plus" style={{ fontSize: 16 }} aria-hidden="true" />
            Ajouter un compte
          </button>
          {showAddForm && (
            <div className="add-form">
              <div className="label">Email du compte à ajouter</div>
              <div className="add-form-row">
                <input
                  className="input"
                  type="email"
                  placeholder="email@exemple.fr"
                  value={newAccountEmail}
                  onChange={e => setNewAccountEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAddAccount()}
                />
                <button className="btn btn-primary btn-sm" onClick={handleAddAccount}>Connecter</button>
              </div>
              <div className="hint" style={{ marginTop: 8 }}>Un lien de connexion sera envoyé à cette adresse.</div>
            </div>
          )}
        </div>

        {/* ABONNEMENT */}
        <div className="card">
          <div className="card-title"><i className="ti ti-credit-card" aria-hidden="true" /> Mon abonnement</div>
          <div className="plan-row"><span style={{ color: "#888" }}>Plan actuel</span><span className="badge">Business — 99€/mois</span></div>
          <div className="plan-row"><span style={{ color: "#888" }}>Prochain renouvellement</span><span style={{ fontWeight: 500 }}>10 juin 2026</span></div>
          <div className="plan-row"><span style={{ color: "#888" }}>Analyses utilisées</span><span style={{ fontWeight: 500 }}>32 / 50</span></div>
          <div style={{ height: 6, background: "#F1EFE8", borderRadius: 3, overflow: "hidden", margin: "12px 0 16px" }}>
            <div style={{ width: "64%", height: "100%", background: "#B07D2A", borderRadius: 3 }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-outline" onClick={() => window.open("https://billing.stripe.com", "_blank")}>
              <i className="ti ti-external-link" style={{ fontSize: 13, verticalAlign: -1, marginRight: 4 }} aria-hidden="true" />
              Gérer sur Stripe
            </button>
            <button className="btn btn-danger">Résilier l'abonnement</button>
          </div>
        </div>

        {/* DANGER ZONE */}
        <div className="card danger-card">
          <div className="card-title danger-title"><i className="ti ti-alert-triangle" aria-hidden="true" /> Zone dangereuse</div>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 14 }}>La suppression de votre compte est irréversible. Toutes vos analyses seront définitivement effacées.</div>
          <button className="btn btn-danger" onClick={handleDeleteAccount}>Supprimer mon compte</button>
        </div>
      </div>
    </>
  );
}
