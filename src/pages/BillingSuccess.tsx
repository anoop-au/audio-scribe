import { Sparkles } from "lucide-react";

const BillingSuccess = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center px-6">
        <Sparkles className="w-10 h-10 mx-auto mb-4 text-primary" />
        <h1 className="mb-2 text-2xl font-bold">You're upgraded!</h1>
        <p className="mb-4 text-muted-foreground">
          Your Pro plan is being activated. Refresh the app in a few moments
          to see it reflected on your account.
        </p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default BillingSuccess;
