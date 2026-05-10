import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

type Analyse = {
  id: string;
  nom_document: string;
  created_at: string;
  score: number | null;
};

function scoreLabel(score: number | null): string {
  if (score === null) return "En traitement";
  if (score >= 75) return `✅ Conforme (${score}%)`;
  if (score >= 50) return `⚠️ Attention (${score}%)`;
  return `🔴 Risque élevé (${score}%)`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, format, options, user_email, score_moyen, total_analyses, analyses } = body as {
      to: string;
      format: string;
      options: string[];
      user_email: string;
      score_moyen: number;
      total_analyses: number;
      analyses: Analyse[];
    };

    if (!to) {
      return NextResponse.json({ error: "Destinataire manquant" }, { status: 400 });
    }

    const analyseRows = (analyses ?? [])
      .slice(0, 5)
      .map(
        (a) =>
          `<tr style="border-bottom:1px solid #F1EFE8;">
            <td style="padding:8px 12px;font-size:13px;">${a.nom_document}</td>
            <td style="padding:8px 12px;font-size:13px;color:#888;">${new Date(a.created_at).toLocaleDateString("fr-FR")}</td>
            <td style="padding:8px 12px;font-size:13px;">${scoreLabel(a.score)}</td>
          </tr>`
      )
      .join("");

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8F7F4;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;border:0.5px solid #E0DDD6;overflow:hidden;">

    <div style="background:#fff;padding:24px 32px;border-bottom:0.5px solid #E0DDD6;">
      <p style="font-size:20px;font-weight:700;margin:0;">Compliance<span style="color:#B07D2A;">RGPD</span></p>
      <p style="font-size:13px;color:#888;margin:4px 0 0;">Rapport de conformité — ${format}</p>
    </div>

    <div style="padding:28px 32px;">
      <p style="font-size:15px;font-weight:600;margin:0 0 6px;">Bonjour,</p>
      <p style="font-size:13px;color:#555;margin:0 0 24px;">
        Voici votre rapport de conformité RGPD généré depuis le compte <strong>${user_email}</strong>.
      </p>

      ${options.includes("Score global de conformité") ? `
      <div style="background:#F1EFE8;border-radius:10px;padding:20px;margin-bottom:20px;text-align:center;">
        <p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 6px;">Score moyen de conformité</p>
        <p style="font-size:40px;font-weight:700;margin:0;color:${score_moyen >= 75 ? "#3B6D11" : score_moyen >= 50 ? "#B07D2A" : "#A32D2D"};">${score_moyen}%</p>
        <p style="font-size:12px;color:#888;margin:4px 0 0;">${total_analyses} document${total_analyses > 1 ? "s" : ""} analysé${total_analyses > 1 ? "s" : ""}</p>
      </div>
      ` : ""}

      ${options.includes("Liste des analyses récentes") && analyseRows ? `
      <p style="font-size:13px;font-weight:600;margin:0 0 10px;">Analyses récentes</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr style="background:#F8F7F4;">
            <th style="padding:8px 12px;font-size:11px;text-align:left;color:#888;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;">Document</th>
            <th style="padding:8px 12px;font-size:11px;text-align:left;color:#888;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;">Date</th>
            <th style="padding:8px 12px;font-size:11px;text-align:left;color:#888;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;">Statut</th>
          </tr>
        </thead>
        <tbody>${analyseRows}</tbody>
      </table>
      ` : ""}

      <p style="font-size:12px;color:#aaa;margin:24px 0 0;padding-top:16px;border-top:0.5px solid #F1EFE8;">
        Ce rapport a été généré automatiquement par ComplianceRGPD ·
        <a href="https://compliance-rgpd.fr" style="color:#B07D2A;text-decoration:none;">compliance-rgpd.fr</a>
      </p>
    </div>
  </div>
</body>
</html>`;

    const { error } = await resend.emails.send({
      from: "ComplianceRGPD <noreply@resend.dev>",
      to: [to],
      subject: `Rapport de conformité RGPD — Score ${score_moyen}% (${format})`,
      html,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
