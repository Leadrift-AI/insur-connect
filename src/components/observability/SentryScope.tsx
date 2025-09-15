import { useEffect } from "react";
import * as Sentry from "@sentry/react";
import { useAuth } from "@/hooks/useAuth";
import { useAgency } from "@/hooks/useAgency";
import { usePlanGating } from "@/hooks/usePlanGating";

const SentryScope: React.FC = () => {
  const { user } = useAuth();
  const { agency } = useAgency();
  const { planLimits } = usePlanGating();

  useEffect(() => {
    if (!import.meta.env.VITE_SENTRY_DSN) return;

    if (user?.id) {
      Sentry.setUser({ id: user.id });
    } else {
      Sentry.setUser(null);
    }

    Sentry.setTag("agency_id", agency?.id ?? "none");
    Sentry.setTag("plan", planLimits?.currentPlan ?? "unknown");
  }, [user?.id, agency?.id, planLimits?.currentPlan]);

  return null;
};

export default SentryScope;

