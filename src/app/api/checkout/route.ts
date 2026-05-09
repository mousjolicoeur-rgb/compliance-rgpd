import Stripe from "stripe";

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(key);
}

const PRICE_IDS: Record<string, string> = {
  Starter: process.env.STRIPE_PRICE_STARTER!,
  Business: process.env.STRIPE_PRICE_BUSINESS!,
  Enterprise: process.env.STRIPE_PRICE_ENTERPRISE!,
};

export async function POST(req: Request) {
  try {
    const stripe = stripeClient();
    const { planName, email } = await req.json();

    const priceId = PRICE_IDS[planName];

    if (!priceId) {
      return Response.json(
        { error: `Plan inconnu : ${planName}` },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/abonnement?cancelled=true`,
    });

    return Response.json({ url: session.url });
  } catch (error) {
    return Response.json(
      { error: "Erreur creation session", details: String(error) },
      { status: 500 }
    );
  }
}