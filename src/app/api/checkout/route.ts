import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { priceId, email } = await req.json();

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
      { error: "Erreur création session", details: String(error) },
      { status: 500 }
    );
  }
}