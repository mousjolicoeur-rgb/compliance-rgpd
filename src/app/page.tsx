"use client";
import { useEffect, useRef, useState } from "react";

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const refs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setVisible((v) => ({ ...v, [e.target.id]: true }));
        });
      },
      { threshold: 0.15 }
    );
    Object.values(refs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const setRef = (id: string) => (el: HTMLElement | null) => {
    refs.current[id] = el;
  };

  const steps = [
    { n: "01", title: "Uploadez", desc: "Déposez vos rapports d'incidents, mains courantes, contrats ou fiches agents en PDF ou TXT." },
    { n: "02", title: "Analysez", desc: "Notre IA scanne chaque document selon le RGPD, la loi du 12 juillet 1983 et les directives CNAPS." },
    { n: "03", title: "Agissez", desc: "Recevez un score de conformité, les risques identifiés et les actions correctives prioritaires." },
  ];

  const risks = [
    { icon: "📋", label: "Rapports d'incidents", detail: "Données personnelles exposées" },
    { icon: "📹", label: "Vidéosurveillance", detail: "Stockage non conforme" },
    { icon: "🪪", label: "Fiches agents", detail: "Données sensibles non protégées" },
    { icon: "📝", label: "Mains courantes", detail: "Collecte excessive" },
  ];

  const plans = [
    { name: "Starter", price: "49", period: "/ mois", features: ["5 analyses / mois", "PDF & TXT", "Score RGPD", "Email support"], cta: "Démarrer", highlight: false },
    { name: "Business", price: "99", period: "/ mois", features: ["30 analyses / mois", "Rapport détaillé PDF", "Historique 12 mois", "Support prioritaire"], cta: "Essai 14 jours", highlight: true },
    { name: "Enterprise", price: "199", period: "/ mois", features: ["Analyses illimitées", "Multi-sites", "API dédiée", "Accompagnement DPO"], cta: "Nous contacter", highlight: false },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        :root {
          --navy: #080d1a;
          --navy2: #0e1628;
          --blue: #1d4ed8;
          --blue-light: #3b82f6;
          --gold: #d4a853;
          --white: #f8f9ff;
          --gray: #94a3b8;
          --border: rgba(255,255,255,0.07);
        }

        body { background: var(--navy); color: var(--white); font-family: 'DM Sans', sans-serif; overflow-x: hidden; }

        .fade-up { opacity: 0; transform: translateY(40px); transition: opacity 0.8s ease, transform 0.8s ease; }
        .fade-up.visible { opacity: 1; transform: translateY(0); }
        .fade-up.d1 { transition-delay: 0.1s; }
        .fade-up.d2 { transition-delay: 0.25s; }
        .fade-up.d3 { transition-delay: 0.4s; }

        nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 20px 60px;
          display: flex; justify-content: space-between; align-items: center;
          background: rgba(8,13,26,0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
          transition: padding 0.3s;
        }

        .nav-logo {
          font-family: 'Fraunces', serif;
          font-size: 22px;
          font-weight: 900;
          letter-spacing: -0.5px;
        }
        .nav-logo span { color: var(--blue-light); }

        .nav-links { display: flex; gap: 40px; }
        .nav-links a { color: var(--gray); text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; }
        .nav-links a:hover { color: var(--white); }

        .btn-primary {
          background: var(--blue);
          color: white;
          padding: 12px 28px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          display: inline-block;
        }
        .btn-primary:hover { background: var(--blue-light); transform: translateY(-1px); }

        .btn-outline {
          background: transparent;
          color: var(--white);
          padding: 12px 28px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          text-decoration: none;
          border: 1px solid rgba(255,255,255,0.2);
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
          display: inline-block;
        }
        .btn-outline:hover { border-color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.05); }

        /* HERO */
        .hero {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          text-align: center;
          padding: 120px 20px 80px;
          position: relative;
          overflow: hidden;
        }

        .hero::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 80% 60% at 50% 30%, rgba(29,78,216,0.15) 0%, transparent 70%);
          pointer-events: none;
        }

        .hero-grid {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse 70% 50% at 50% 50%, black 30%, transparent 100%);
        }

        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(29,78,216,0.15);
          border: 1px solid rgba(29,78,216,0.3);
          color: var(--blue-light);
          padding: 8px 18px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 32px;
        }

        .hero h1 {
          font-family: 'Fraunces', serif;
          font-size: clamp(42px, 7vw, 88px);
          font-weight: 900;
          line-height: 1.0;
          letter-spacing: -2px;
          margin-bottom: 28px;
          max-width: 900px;
          margin-left: auto; margin-right: auto;
        }

        .hero h1 .accent { color: var(--blue-light); }
        .hero h1 .gold { color: var(--gold); }

        .hero p {
          font-size: clamp(16px, 2vw, 20px);
          color: var(--gray);
          max-width: 580px;
          margin: 0 auto 48px;
          line-height: 1.7;
          font-weight: 300;
        }

        .hero-ctas { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin-bottom: 64px; }

        .hero-stats {
          display: flex; gap: 48px; justify-content: center;
          border-top: 1px solid var(--border);
          padding-top: 48px;
          flex-wrap: wrap;
        }

        .stat { text-align: center; }
        .stat-num {
          font-family: 'Fraunces', serif;
          font-size: 36px;
          font-weight: 900;
          color: var(--white);
          display: block;
        }
        .stat-label { font-size: 13px; color: var(--gray); font-weight: 400; }

        /* SECTIONS */
        section { padding: 100px 20px; max-width: 1100px; margin: 0 auto; }

        .section-label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--blue-light);
          margin-bottom: 16px;
        }

        .section-title {
          font-family: 'Fraunces', serif;
          font-size: clamp(32px, 4vw, 52px);
          font-weight: 900;
          letter-spacing: -1px;
          line-height: 1.1;
          margin-bottom: 20px;
        }

        .section-sub {
          font-size: 18px;
          color: var(--gray);
          font-weight: 300;
          line-height: 1.7;
          max-width: 560px;
        }

        /* PROBLEM */
        .problem-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 2px;
          margin-top: 64px;
          background: var(--border);
          border-radius: 12px;
          overflow: hidden;
        }

        .problem-card {
          background: var(--navy2);
          padding: 36px 32px;
          transition: background 0.2s;
        }
        .problem-card:hover { background: rgba(29,78,216,0.1); }

        .problem-icon { font-size: 32px; margin-bottom: 16px; }
        .problem-card h3 { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
        .problem-card p { font-size: 14px; color: var(--gray); line-height: 1.6; }

        /* STEPS */
        .steps-wrap { margin-top: 64px; }
        .step {
          display: grid; grid-template-columns: 80px 1fr;
          gap: 32px; align-items: start;
          padding: 40px 0;
          border-bottom: 1px solid var(--border);
        }
        .step:last-child { border-bottom: none; }

        .step-num {
          font-family: 'Fraunces', serif;
          font-size: 48px;
          font-weight: 900;
          color: rgba(255,255,255,0.08);
          line-height: 1;
        }

        .step h3 { font-size: 22px; font-weight: 600; margin-bottom: 10px; }
        .step p { font-size: 16px; color: var(--gray); line-height: 1.7; font-weight: 300; }

        /* PRICING */
        .pricing-section { background: var(--navy2); padding: 100px 20px; }
        .pricing-inner { max-width: 1100px; margin: 0 auto; }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-top: 64px;
        }

        .pricing-card {
          border-radius: 12px;
          padding: 40px 36px;
          border: 1px solid var(--border);
          background: var(--navy);
          position: relative;
          transition: transform 0.2s, border-color 0.2s;
        }
        .pricing-card:hover { transform: translateY(-4px); border-color: rgba(255,255,255,0.15); }

        .pricing-card.highlight {
          border-color: var(--blue);
          background: linear-gradient(135deg, rgba(29,78,216,0.15), var(--navy));
        }

        .popular-badge {
          position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
          background: var(--blue);
          color: white;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          padding: 5px 16px;
          border-radius: 100px;
          text-transform: uppercase;
        }

        .plan-name { font-size: 14px; font-weight: 600; color: var(--gray); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px; }

        .plan-price {
          font-family: 'Fraunces', serif;
          font-size: 56px;
          font-weight: 900;
          line-height: 1;
          margin-bottom: 4px;
        }
        .plan-price sup { font-size: 22px; vertical-align: super; }
        .plan-period { font-size: 14px; color: var(--gray); margin-bottom: 32px; }

        .plan-features { list-style: none; margin-bottom: 36px; }
        .plan-features li {
          padding: 10px 0;
          border-bottom: 1px solid var(--border);
          font-size: 15px;
          color: var(--gray);
          display: flex; align-items: center; gap: 10px;
        }
        .plan-features li::before { content: '✓'; color: var(--blue-light); font-weight: 700; }

        /* CTA FINAL */
        .cta-section {
          text-align: center;
          padding: 120px 20px;
          background: radial-gradient(ellipse 60% 80% at 50% 50%, rgba(29,78,216,0.12) 0%, transparent 70%);
        }

        .cta-section h2 {
          font-family: 'Fraunces', serif;
          font-size: clamp(36px, 5vw, 64px);
          font-weight: 900;
          letter-spacing: -1.5px;
          margin-bottom: 20px;
          line-height: 1.1;
        }

        .cta-section p { color: var(--gray); font-size: 18px; margin-bottom: 48px; font-weight: 300; }

        footer {
          border-top: 1px solid var(--border);
          padding: 40px 60px;
          display: flex; justify-content: space-between; align-items: center;
          max-width: 100%; flex-wrap: wrap; gap: 16px;
        }

        .footer-logo {
          font-family: 'Fraunces', serif;
          font-weight: 900;
          font-size: 18px;
        }
        .footer-logo span { color: var(--blue-light); }

        footer p { font-size: 13px; color: var(--gray); }

        @media (max-width: 768px) {
          nav { padding: 16px 24px; }
          .nav-links { display: none; }
          section { padding: 70px 20px; }
          .step { grid-template-columns: 1fr; gap: 12px; }
          footer { padding: 32px 24px; flex-direction: column; text-align: center; }
        }
      `}</style>

      {/* NAV */}
      <nav>
        <div className="nav-logo">Compliance<span>IA</span></div>
        <div className="nav-links">
          <a href="#comment">Comment ça marche</a>
          <a href="#tarifs">Tarifs</a>
          <a href="/login">Connexion</a>
        </div>
        <a href="/register" className="btn-primary">Essai gratuit</a>
      </nav>

      {/* HERO */}
      <div className="hero">
        <div className="hero-grid" />
        <div style={{ position: "relative", zIndex: 1, width: "100%" }}>
          <div className="fade-up visible">
            <div className="hero-badge">
              🔒 Spécialisé sécurité privée — RGPD & CNAPS
            </div>
          </div>
          <div className="fade-up visible d1">
            <h1>
              Vos documents<br />
              <span className="accent">conformes RGPD</span><br />
              en <span className="gold">30 secondes</span>
            </h1>
          </div>
          <div className="fade-up visible d2">
            <p>
              L'IA qui analyse vos rapports d'incidents, mains courantes et fiches agents selon la réglementation en vigueur. Conçu pour les sociétés de sécurité privée.
            </p>
          </div>
          <div className="fade-up visible d3">
            <div className="hero-ctas">
              <a href="/register" className="btn-primary">Analyser mon premier document →</a>
              <a href="#comment" className="btn-outline">Voir comment ça marche</a>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-num">300k</span>
                <span className="stat-label">personnes autorisées en France</span>
              </div>
              <div className="stat">
                <span className="stat-num">5,3M€</span>
                <span className="stat-label">pénalités CNAPS 2025 — record</span>
              </div>
              <div className="stat">
                <span className="stat-num">1 820</span>
                <span className="stat-label">contrôles menés sur le territoire</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PROBLÈME */}
      <section
        id="probleme"
        ref={setRef("probleme")}
        className={`fade-up${visible["probleme"] ? " visible" : ""}`}
      >
        <div className="section-label">Le problème</div>
        <h2 className="section-title">Vos documents exposent<br />votre société au risque</h2>
        <p className="section-sub">
          En 2025, le CNAPS a mené 1 820 contrôles et infligé un record de 5,3M€ de pénalités. 70 621 cartes professionnelles délivrées — chaque dossier agent contient des données personnelles sensibles exposées aux sanctions CNIL.
        </p>
        <div className="problem-grid">
          {risks.map((r, i) => (
            <div className="problem-card" key={i}>
              <div className="problem-icon">{r.icon}</div>
              <h3>{r.label}</h3>
              <p>{r.detail} — risque de sanction CNIL</p>
            </div>
          ))}
        </div>
      </section>

      {/* COMMENT */}
      <section
        id="comment"
        ref={setRef("comment")}
        style={{ borderTop: "1px solid var(--border)", paddingTop: "100px" }}
        className={`fade-up${visible["comment"] ? " visible" : ""}`}
      >
        <div className="section-label">Comment ça marche</div>
        <h2 className="section-title">Trois étapes.<br />Zéro complexité.</h2>
        <div className="steps-wrap">
          {steps.map((s, i) => (
            <div className="step" key={i}>
              <div className="step-num">{s.n}</div>
              <div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TARIFS */}
      <div className="pricing-section">
        <div
          className="pricing-inner"
          id="tarifs"
          ref={setRef("tarifs")}
        >
          <div className={`fade-up${visible["tarifs"] ? " visible" : ""}`}>
            <div className="section-label">Tarifs</div>
            <h2 className="section-title">Simple et transparent</h2>
            <p className="section-sub">Sans engagement. Résiliable à tout moment.</p>
          </div>
          <div className="pricing-grid">
            {plans.map((p, i) => (
              <div className={`pricing-card${p.highlight ? " highlight" : ""}`} key={i}>
                {p.highlight && <span className="popular-badge">Populaire</span>}
                <div className="plan-name">{p.name}</div>
                <div className="plan-price"><sup>€</sup>{p.price}</div>
                <div className="plan-period">{p.period} HT</div>
                <ul className="plan-features">
                  {p.features.map((f, j) => <li key={j}>{f}</li>)}
                </ul>
                <a href="/register" className={p.highlight ? "btn-primary" : "btn-outline"} style={{ width: "100%", textAlign: "center" }}>
                  {p.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA FINAL */}
      <div
        className="cta-section"
        id="cta"
        ref={setRef("cta")}
      >
        <div className={`fade-up${visible["cta"] ? " visible" : ""}`}>
          <h2>Prêt à sécuriser<br />vos documents ?</h2>
          <p>Première analyse gratuite. Aucune carte bancaire requise.</p>
          <a href="/register" className="btn-primary" style={{ fontSize: "16px", padding: "16px 40px" }}>
            Commencer maintenant →
          </a>
        </div>
      </div>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">Compliance<span>IA</span></div>
        <p>Spécialisé sécurité privée · RGPD · CNAPS · IDCC 1351</p>
        <p>© 2026 ComplianceIA — Lyon, France</p>
      </footer>
    </>
  );
}
