import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  try {
    logStep("Webhook received");

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get the signature from headers
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('Missing stripe-signature header');
    }

    // Get raw body
    const body = await req.text();
    
    // Verify webhook signature
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('Missing STRIPE_WEBHOOK_SECRET');
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err.message });
      return new Response(`Webhook signature verification failed: ${err.message}`, {
        status: 400,
      });
    }

    logStep("Webhook event received", { type: event.type, id: event.id });

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout session completed", { sessionId: session.id });

        // Get subscription details
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const customer = await stripe.customers.retrieve(subscription.customer as string);
          
          if (customer.deleted) {
            logStep("Customer was deleted", { customerId: subscription.customer });
            break;
          }

          const customerEmail = (customer as Stripe.Customer).email;
          if (!customerEmail) {
            logStep("No email found for customer", { customerId: subscription.customer });
            break;
          }

          // Find the agency by stripe customer ID or email
          const { data: agency, error: agencyError } = await supabaseClient
            .from('agencies')
            .select('*')
            .or(`stripe_customer_id.eq.${subscription.customer},owner_user_id.in.(select id from auth.users where email = '${customerEmail}')`)
            .limit(1)
            .single();

          if (agencyError || !agency) {
            logStep("Could not find agency", { customerId: subscription.customer, email: customerEmail });
            break;
          }

          // Determine plan based on price
          const priceId = subscription.items.data[0]?.price.id;
          let plan = 'free';
          let seats = 1;

          if (priceId === 'price_starter_monthly') {
            plan = 'starter';
            seats = 5;
          } else if (priceId === 'price_professional_monthly') {
            plan = 'professional';
            seats = 15;
          } else if (priceId === 'price_enterprise_monthly') {
            plan = 'enterprise';
            seats = 999; // "unlimited"
          }

          // Update agency with subscription details
          const { error: updateError } = await supabaseClient
            .from('agencies')
            .update({
              stripe_customer_id: subscription.customer as string,
              stripe_subscription_id: subscription.id,
              plan,
              seats
            })
            .eq('id', agency.id);

          if (updateError) {
            logStep("Failed to update agency", { error: updateError, agencyId: agency.id });
          } else {
            logStep("Agency updated successfully", { agencyId: agency.id, plan, seats });
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription updated", { subscriptionId: subscription.id });

        // Find agency by subscription ID
        const { data: agency, error: agencyError } = await supabaseClient
          .from('agencies')
          .select('*')
          .eq('stripe_subscription_id', subscription.id)
          .limit(1)
          .single();

        if (agencyError || !agency) {
          logStep("Could not find agency by subscription ID", { subscriptionId: subscription.id });
          break;
        }

        // Determine plan based on price
        const priceId = subscription.items.data[0]?.price.id;
        let plan = 'free';
        let seats = 1;

        if (subscription.status === 'active') {
          if (priceId === 'price_starter_monthly') {
            plan = 'starter';
            seats = 5;
          } else if (priceId === 'price_professional_monthly') {
            plan = 'professional';
            seats = 15;
          } else if (priceId === 'price_enterprise_monthly') {
            plan = 'enterprise';
            seats = 999;
          }
        }

        // Update agency
        const { error: updateError } = await supabaseClient
          .from('agencies')
          .update({ plan, seats })
          .eq('id', agency.id);

        if (updateError) {
          logStep("Failed to update agency plan", { error: updateError });
        } else {
          logStep("Agency plan updated", { agencyId: agency.id, plan, seats });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", { subscriptionId: subscription.id });

        // Find agency and reset to free plan
        const { data: agency, error: agencyError } = await supabaseClient
          .from('agencies')
          .select('*')
          .eq('stripe_subscription_id', subscription.id)
          .limit(1)
          .single();

        if (agencyError || !agency) {
          logStep("Could not find agency by subscription ID", { subscriptionId: subscription.id });
          break;
        }

        // Reset to free plan
        const { error: updateError } = await supabaseClient
          .from('agencies')
          .update({ 
            plan: 'free', 
            seats: 1,
            stripe_subscription_id: null
          })
          .eq('id', agency.id);

        if (updateError) {
          logStep("Failed to reset agency to free plan", { error: updateError });
        } else {
          logStep("Agency reset to free plan", { agencyId: agency.id });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Invoice payment succeeded", { invoiceId: invoice.id });
        
        // You could store invoice data in your database here
        // For now, we'll just log it
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Invoice payment failed", { invoiceId: invoice.id });
        
        // You could implement retry logic or notifications here
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response('OK', { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    
    return new Response(`Webhook error: ${errorMessage}`, {
      status: 500,
    });
  }
});