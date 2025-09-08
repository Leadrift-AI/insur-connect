-- Clear existing plans and insert new Leadrift AI pricing tiers
DELETE FROM subscription_plans;

-- Insert new Leadrift AI pricing plans
INSERT INTO subscription_plans (
  name, 
  description, 
  price_monthly, 
  price_yearly, 
  features, 
  max_agents, 
  max_leads_per_month,
  is_active
) VALUES 
(
  'Starter',
  'Best for: small agencies wanting to offload admin work and prove ROI fast.',
  3000.00,
  32400.00, -- 10% discount for yearly
  '["Full automation platform (lead nurture, booking, reminders)", "Prebuilt drip campaigns (Final Expense, IUL, Medicare)", "1–5 agents included", "Basic KPI dashboard"]'::jsonb,
  5,
  NULL,
  true
),
(
  'Growth',
  'Best for: mid-size agencies scaling appointment flow and tracking performance.',
  5000.00,
  54000.00, -- 10% discount for yearly
  '["Everything in Starter", "Unlimited agents", "Advanced KPI dashboard (track by agent + campaign)", "No-show & post-call automation", "Quarterly strategy session"]'::jsonb,
  NULL, -- unlimited
  NULL,
  true
),
(
  'Scale',
  'Best for: growth-focused agencies ready to dominate their market.',
  7000.00,
  75600.00, -- 10% discount for yearly
  '["Everything in Growth", "Ad creative vault (tested video scripts + templates)", "Dedicated success manager", "Bi-weekly optimization calls", "Priority support + feature access"]'::jsonb,
  NULL, -- unlimited
  NULL,
  true
);