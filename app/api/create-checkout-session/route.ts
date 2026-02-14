import Stripe from "stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const secret = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_PRICE_ID;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (!secret) {
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    }
    if (!priceId) {
      return NextResponse.json({ error: "Missing STRIPE_PRICE_ID" }, { status: 500 });
    }
    if (!baseUrl) {
      return NextResponse.json({ error: "Missing NEXT_PUBLIC_BASE_URL" }, { status: 500 });
    }

    const { userId, email } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId in request body" }, { status: 400 });
    }

    const stripe = new Stripe(secret, { apiVersion: "2023-10-16" });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],

      // This is how we match Stripe -> Supabase user in the webhook
      client_reference_id: userId,

      // Optional but nice for Stripe receipts / prefill
      customer_email: email || undefined,

      success_url: `${baseUrl}/builder?success=true`,
      cancel_url: `${baseUrl}/subscribe?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unknown server error", type: error?.type, code: error?.code },
      { status: 500 }
    );
  }
}
