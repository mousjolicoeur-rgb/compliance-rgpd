import Stripe from "stripe";
import { NextResponse } from "next/server";

const PRICE_MAP: Record<string, string | undefined> = {
  Starter:    process.env.STRIPE_PRICE_STARTER,
  Business:   process.env.STRIPE_PRICE_BUSINESS,
  Enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
};

export async function POST(req: Request) {
  // Vérification clé Stripe
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Configuration Stripe manquante (STRIPE_SECRET_KEY)" },
      { status: 500 }
    );
  }

  let planName: string;
  let email: string;

  try {
    ({ planName, email } = await req.json());
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  // Vérification du plan et du Price ID
  const priceId = PRICE_MAP[planName];
  if (!planName || !(planName in PRICE_MAP)) {
    return NextResponse.json(
      { error: `Plan inconnu : "${planName}". Plans valides : Starter, Business, Enterprise.` },
      { status: 400 }
    );
  }
  if (!priceId) {
    return NextResponse.json(
      { error: `Price ID manquant pour le plan "${planName}". Configurez STRIPE_PRICE_${planName.toUpperCase()} dans les variables d'environnement.` },
      { status: 500 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email || undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?success=true&plan=${planName.toLowerCase()}`,
      cancel_url:  `${appUrl}/abonnement?cancelled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Erreur Stripe : ${message}` },
      { status: 500 }
    );
  }
}
