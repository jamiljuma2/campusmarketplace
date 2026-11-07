import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPayHeroReference } from "@/lib/payhero";

const payloadSchema = z.object({
  status: z.boolean().optional(),
  response: z.object({
    Amount: z.union([z.number(), z.string()]).optional(),
    CheckoutRequestID: z.string().optional(),
    ExternalReference: z.string().optional(),
    MerchantRequestID: z.string().optional(),
    MpesaReceiptNumber: z.string().optional(),
    ResultCode: z.union([z.number(), z.string()]).optional(),
    ResultDesc: z.string().optional(),
    Status: z.string().optional(),
  }).passthrough().optional(),
}).passthrough();

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid callback payload" }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Invalid callback payload" }, { status: 400 });
  const callback = parsed.data.response;
  if (!callback?.ExternalReference) return NextResponse.json({ received: true });

  try {
    const db = createAdminClient();
    const { data: payment } = await db.from("payments")
      .select("id,payhero_reference,amount_kes,status,internal_reference")
      .eq("internal_reference", callback.ExternalReference)
      .maybeSingle();
    if (!payment) return NextResponse.json({ received: true });

    const { error: eventError } = await db.from("payment_events").insert({
      payment_id: payment.id,
      event_type: "payhero_callback_received",
      payload: {
        Status: callback.Status,
        ResultCode: callback.ResultCode,
        ResultDesc: callback.ResultDesc,
        Amount: callback.Amount,
        CheckoutRequestID: callback.CheckoutRequestID,
        MerchantRequestID: callback.MerchantRequestID,
        MpesaReceiptNumber: callback.MpesaReceiptNumber,
      },
    });
    if (eventError) throw eventError;

    if (payment.status === "successful") return NextResponse.json({ received: true });
    if (!payment.payhero_reference) return NextResponse.json({ received: true, pending_verification: true });

    const verified = await verifyPayHeroReference(payment.payhero_reference);
    if (verified.status === "SUCCESS" && verified.success === true) {
      const amount = Number(callback.Amount);
      if (!Number.isFinite(amount) || amount !== Number(payment.amount_kes)) {
        return NextResponse.json({ received: true, verification_error: "amount_mismatch" }, { status: 409 });
      }
      const { error } = await db.rpc("activate_payment", {
        p_payment: payment.id,
        p_payhero_reference: verified.provider_reference || verified.third_party_reference || payment.payhero_reference,
        p_amount: Number(payment.amount_kes),
      });
      if (error) throw error;
      await db.from("payment_events").insert({
        payment_id: payment.id,
        event_type: "payment_activated",
        payload: { verified_status: verified.status },
      });
    } else if (verified.status === "FAILED") {
      const { error } = await db.from("payments").update({
        status: "failed",
        verification_status: "verified_failure",
        completed_at: new Date().toISOString(),
      }).eq("id", payment.id).eq("status", "pending");
      if (error) throw error;
      await db.from("payment_events").insert({
        payment_id: payment.id,
        event_type: "payment_failed",
        payload: { verified_status: verified.status },
      });
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ received: true, verification_pending: true }, { status: 202 });
  }
}
