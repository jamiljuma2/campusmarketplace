type CallbackResponse = {
  Amount?: number | string;
  ExternalReference?: string;
  CheckoutRequestID?: string;
  MerchantRequestID?: string;
  MpesaReceiptNumber?: string;
  ResultCode?: number | string;
  ResultDesc?: string;
  Status?: string;
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

Deno.serve(async (request) => {
  if (request.method !== "POST") return json(405, { error: "Method not allowed" });

  let payload: { response?: CallbackResponse };
  try {
    const raw = await request.text();
    if (raw.length > 64 * 1024) return json(413, { error: "Callback payload is too large" });
    payload = JSON.parse(raw);
  } catch {
    return json(400, { error: "Invalid callback payload" });
  }
  if (!payload || typeof payload !== "object") return json(400, { error: "Invalid callback payload" });

  const callback = payload.response;
  const externalReference = callback?.ExternalReference;
  if (!externalReference || !/^CM-[0-9a-f-]{36}$/i.test(externalReference)) {
    return json(200, { received: true });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const payheroUsername = Deno.env.get("PAYHERO_API_USERNAME");
  const payheroPassword = Deno.env.get("PAYHERO_API_PASSWORD");
  if (!supabaseUrl || !serviceRoleKey || !payheroUsername || !payheroPassword) {
    return json(503, { error: "Payment callback is not configured" });
  }

  const supabaseHeaders = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  };

  try {
    const query = new URLSearchParams({
      select: "id,payhero_reference,amount_kes,status,internal_reference",
      internal_reference: `eq.${externalReference}`,
      limit: "1",
    });
    const paymentResponse = await fetch(`${supabaseUrl}/rest/v1/payments?${query}`, {
      headers: supabaseHeaders,
    });
    if (!paymentResponse.ok) throw new Error("Payment lookup failed");
    const [payment] = await paymentResponse.json();
    if (!payment) return json(200, { received: true });

    const eventPayload = {
      Status: callback?.Status,
      ResultCode: callback?.ResultCode,
      ResultDesc: callback?.ResultDesc,
      Amount: callback?.Amount,
      CheckoutRequestID: callback?.CheckoutRequestID,
      MerchantRequestID: callback?.MerchantRequestID,
      MpesaReceiptNumber: callback?.MpesaReceiptNumber,
    };
    await fetch(`${supabaseUrl}/rest/v1/payment_events`, {
      method: "POST",
      headers: { ...supabaseHeaders, Prefer: "return=minimal" },
      body: JSON.stringify({ payment_id: payment.id, event_type: "payhero_callback_received", payload: eventPayload }),
    });

    if (payment.status === "successful" || !payment.payhero_reference) {
      return json(200, { received: true });
    }

    const credentials = btoa(`${payheroUsername}:${payheroPassword}`);
    const verificationUrl = new URL("https://backend.payhero.co.ke/api/v2/transaction-status");
    verificationUrl.searchParams.set("reference", payment.payhero_reference);
    const verificationResponse = await fetch(verificationUrl, {
      headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!verificationResponse.ok) throw new Error("PayHero verification failed");
    const verified = await verificationResponse.json();

    if (verified.status === "SUCCESS" && verified.success === true) {
      const amount = Number(callback?.Amount);
      if (!Number.isFinite(amount) || amount !== Number(payment.amount_kes)) {
        return json(409, { received: true, verification_error: "amount_mismatch" });
      }
      const activation = await fetch(`${supabaseUrl}/rest/v1/rpc/activate_payment`, {
        method: "POST",
        headers: { ...supabaseHeaders, Prefer: "return=minimal" },
        body: JSON.stringify({
          p_payment: payment.id,
          p_payhero_reference: verified.provider_reference || verified.third_party_reference || payment.payhero_reference,
          p_amount: Number(payment.amount_kes),
        }),
      });
      if (!activation.ok) throw new Error("Payment activation failed");
      await fetch(`${supabaseUrl}/rest/v1/payment_events`, {
        method: "POST",
        headers: { ...supabaseHeaders, Prefer: "return=minimal" },
        body: JSON.stringify({ payment_id: payment.id, event_type: "payment_activated", payload: { verified_status: verified.status } }),
      });
    } else if (verified.status === "FAILED") {
      const failed = await fetch(`${supabaseUrl}/rest/v1/payments?id=eq.${payment.id}&status=eq.pending`, {
        method: "PATCH",
        headers: { ...supabaseHeaders, Prefer: "return=minimal" },
        body: JSON.stringify({ status: "failed", verification_status: "verified_failure", completed_at: new Date().toISOString() }),
      });
      if (!failed.ok) throw new Error("Payment update failed");
      await fetch(`${supabaseUrl}/rest/v1/payment_events`, {
        method: "POST",
        headers: { ...supabaseHeaders, Prefer: "return=minimal" },
        body: JSON.stringify({ payment_id: payment.id, event_type: "payment_failed", payload: { verified_status: verified.status } }),
      });
    }

    return json(200, { received: true });
  } catch {
    return json(202, { received: true, verification_pending: true });
  }
});
