import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { createCheckoutSession } from "@/lib/api";

export default function UpgradeButton() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!session?.user) {
      toast.error("Sign in to upgrade your plan.");
      return;
    }

    setLoading(true);
    try {
      const { checkout_url } = await createCheckoutSession();
      window.location.href = checkout_url;
    } catch {
      toast.error("Checkout is unavailable right now — please try again shortly.");
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleUpgrade}
      disabled={loading}
      title="Upgrade to Pro"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
      <span className="ml-1.5">Upgrade</span>
    </Button>
  );
}
