-- Create billing and subscription management tables

-- Subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  features JSONB DEFAULT '[]'::jsonb,
  max_agents INTEGER,
  max_leads_per_month INTEGER,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Agency subscriptions table
CREATE TABLE public.agency_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT DEFAULT 'active', -- active, canceled, past_due, etc.
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  billing_cycle TEXT DEFAULT 'monthly', -- monthly, yearly
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Usage tracking for billing
CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- format: YYYY-MM
  agents_count INTEGER DEFAULT 0,
  leads_count INTEGER DEFAULT 0,
  appointments_count INTEGER DEFAULT 0,
  extra_agent_charges DECIMAL(10,2) DEFAULT 0,
  extra_lead_charges DECIMAL(10,2) DEFAULT 0,
  total_usage_charges DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agency_id, month_year)
);

-- Invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.agency_subscriptions(id),
  invoice_number TEXT UNIQUE NOT NULL,
  stripe_invoice_id TEXT UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending', -- pending, paid, failed, refunded
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  invoice_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Payment methods table
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- card, bank_account, etc.
  is_default BOOLEAN DEFAULT false,
  card_last4 TEXT,
  card_brand TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscription_plans (public read, admin manage)
CREATE POLICY "Public can view active plans" ON public.subscription_plans
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role can manage plans" ON public.subscription_plans
  FOR ALL
  USING (true);

-- RLS policies for agency_subscriptions
CREATE POLICY "Agency members can view own subscription" ON public.agency_subscriptions
  FOR SELECT
  USING (is_agency_member(agency_id));

CREATE POLICY "Service role can manage subscriptions" ON public.agency_subscriptions
  FOR ALL
  USING (true);

-- RLS policies for usage_tracking
CREATE POLICY "Agency members can view own usage" ON public.usage_tracking
  FOR SELECT
  USING (is_agency_member(agency_id));

CREATE POLICY "Service role can manage usage" ON public.usage_tracking
  FOR ALL
  USING (true);

-- RLS policies for invoices
CREATE POLICY "Agency members can view own invoices" ON public.invoices
  FOR SELECT
  USING (is_agency_member(agency_id));

CREATE POLICY "Service role can manage invoices" ON public.invoices
  FOR ALL
  USING (true);

-- RLS policies for payment_methods
CREATE POLICY "Agency members can view own payment methods" ON public.payment_methods
  FOR SELECT
  USING (is_agency_member(agency_id));

CREATE POLICY "Service role can manage payment methods" ON public.payment_methods
  FOR ALL
  USING (true);

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, price_monthly, price_yearly, max_agents, max_leads_per_month, features) VALUES
('Starter', 'Perfect for small agencies', 29.00, 290.00, 3, 500, '["Up to 3 agents", "500 leads/month", "Basic reporting", "Email support"]'::jsonb),
('Professional', 'For growing agencies', 99.00, 990.00, 10, 2000, '["Up to 10 agents", "2000 leads/month", "Advanced analytics", "Priority support", "API access"]'::jsonb),
('Enterprise', 'For large agencies', 299.00, 2990.00, null, null, '["Unlimited agents", "Unlimited leads", "Custom integrations", "Dedicated support", "White-label options"]'::jsonb);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agency_subscriptions_updated_at
  BEFORE UPDATE ON public.agency_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON public.usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();