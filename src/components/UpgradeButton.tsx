import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getPaddle } from "@/lib/paddle";

const PRO_PRICE_ID = import.meta.env.VITE_PADDLE_PRICE_PRO as string;

export default function UpgradeButton() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    const user = session?.user;
    if (!user?.email) {
      toast.error("Sign in to upgrade your plan.");
      return;
    }

    setLoading(true);
    try {
      const paddle = await getPaddle();
      if (!paddle) {
        toast.error("Checkout is unavailable right now — please try again shortly.");
        return;
      }

      paddle.Checkout.open({
        items: [{ priceId: PRO_PRICE_ID, quantity: 1 }],
        customer: { email: user.email },
        customData: { user_id: user.id },
      });
    } finally {
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
