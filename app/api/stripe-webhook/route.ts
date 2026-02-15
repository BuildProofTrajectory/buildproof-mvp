import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export async function POST(req: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  if (!stripeSecretKey || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET" },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  // Stripe requires the raw body to validate the signature
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook signature failed: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    /**
     * 1) Checkout completed -> activate the user.
     * We rely on client_reference_id (set to Supabase userId during checkout)
     */
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.client_reference_id;
      const customerId =
        typeof session.customer === "string" ? session.customer : session.customer?.id;

      if (!userId) {
        return NextResponse.json({ received: true, note: "No client_reference_id on session" });
      }

      const { error } = await supabaseAdmin
        .from("profiles")
        .update({
          subscription_status: "active",
          stripe_customer_id: customerId ?? null,
        })
        .eq("id", userId);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    /**
     * 2) Subscription updated -> set active/inactive based on Stripe subscription status
     * We match the profile by stripe_customer_id
     */
    if (event.type === "customer.subscription.updated") {
      const sub = event.data.object as Stripe.Subscription;

      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const isActive = sub.status === "active" || sub.status === "trialing";

      const { error } = await supabaseAdmin
        .from("profiles")
        .update({
          subscription_status: isActive ? "active" : "inactive",
        })
        .eq("stripe_customer_id", customerId);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    /**
     * 3) Subscription deleted -> mark inactive
     * We match the profile by stripe_customer_id
     */
    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;

      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

      const { error } = await supabaseAdmin
        .from("profiles")
        .update({
          subscription_status: "inactive",
        })
        .eq("stripe_customer_id", customerId);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Webhook handler error" }, { status: 500 });
  }
}
