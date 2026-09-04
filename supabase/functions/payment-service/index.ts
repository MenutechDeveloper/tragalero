// Supabase Edge Function: payment-service
// Handles online payment session creation and webhooks for Stripe & Mercado Pago

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { action, user_id, order_id, provider, items, total, success_url, cancel_url } = body;

    // Fetch restaurant's payment configuration privately from DB
    const { data: payConfig, error: configError } = await supabase
      .from("tragalero_payment_config")
      .select("*")
      .eq("user_id", user_id)
      .single();

    if (configError || !payConfig) {
      return new Response(
        JSON.stringify({ success: false, message: "El restaurante no tiene configurada esta pasarela de pago." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (action === "create_checkout_session") {
      if (provider === "stripe") {
        if (!payConfig.stripe_enabled || !payConfig.stripe_secret_key) {
          return new Response(
            JSON.stringify({ success: false, message: "Stripe no está activo en este restaurante." }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }

        // Call Stripe API using restaurant's secret key
        const lineItems = (items || []).map((i: any) => ({
          price_data: {
            currency: "mxn",
            product_data: { name: i.name || "Pedido Tragalero" },
            unit_amount: Math.round((i.price || i.total || total) * 100),
          },
          quantity: i.quantity || 1,
        }));

        const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${payConfig.stripe_secret_key}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            "mode": "payment",
            "success_url": success_url || "https://tragalero.com",
            "cancel_url": cancel_url || "https://tragalero.com",
            "client_reference_id": String(order_id),
            "line_items[0][price_data][currency]": "mxn",
            "line_items[0][price_data][product_data][name]": `Orden #${order_id}`,
            "line_items[0][price_data][unit_amount]": String(Math.round((total || 0) * 100)),
            "line_items[0][quantity]": "1",
          }),
        });

        const stripeData = await stripeResponse.json();
        if (stripeData.error) {
          throw new Error(stripeData.error.message);
        }

        return new Response(
          JSON.stringify({ success: true, checkout_url: stripeData.url, session_id: stripeData.id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (provider === "mercadopago") {
        if (!payConfig.mercadopago_enabled || !payConfig.mercadopago_access_token) {
          return new Response(
            JSON.stringify({ success: false, message: "Mercado Pago no está activo en este restaurante." }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }

        // Call Mercado Pago Preference API using restaurant's access token
        const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${payConfig.mercadopago_access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: [
              {
                title: `Pedido Tragalero #${order_id}`,
                unit_price: Number(total),
                quantity: 1,
                currency_id: "MXN",
              },
            ],
            external_reference: String(order_id),
            back_urls: {
              success: success_url || "https://tragalero.com",
              failure: cancel_url || "https://tragalero.com",
              pending: success_url || "https://tragalero.com",
            },
            auto_return: "approved",
          }),
        });

        const mpData = await mpResponse.json();
        if (mpData.error) {
          throw new Error(mpData.message || "Error al crear preferencia de Mercado Pago");
        }

        return new Response(
          JSON.stringify({
            success: true,
            checkout_url: mpData.init_point,
            sandbox_checkout_url: mpData.sandbox_init_point,
            preference_id: mpData.id,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Webhook event handling to update order payment_status
    if (action === "handle_webhook") {
      const { payment_id, status: newStatus, external_reference } = body;

      if (external_reference && newStatus) {
        let mappedStatus = "pending";
        if (["approved", "paid", "succeeded"].includes(newStatus)) mappedStatus = "approved";
        if (["rejected", "failed", "declined"].includes(newStatus)) mappedStatus = "rejected";
        if (["cancelled", "canceled"].includes(newStatus)) mappedStatus = "cancelled";

        await supabase
          .from("tragalero_orders")
          .update({
            payment_status: mappedStatus,
            payment_id: payment_id || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", external_reference);

        return new Response(
          JSON.stringify({ success: true, message: `Estado de pago actualizado a ${mappedStatus}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: false, message: "Acción no reconocida." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, message: err.message || "Error interno de pago" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
