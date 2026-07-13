import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { toast } from "sonner";

let paddleInstance: Paddle | undefined;
let paddlePromise: Promise<Paddle | undefined> | null = null;

// Singleton: Paddle.js should only be initialized once per page load.
export function getPaddle(): Promise<Paddle | undefined> {
  if (paddleInstance) return Promise.resolve(paddleInstance);

  if (!paddlePromise) {
    const token = import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string;
    const environment =
      (import.meta.env.VITE_PADDLE_ENV as string) === "production" ? "production" : "sandbox";

    paddlePromise = initializePaddle({
      token,
      environment,
      eventCallback(event) {
        // Client-side signal only — the webhook is the source of truth for plan changes.
        if (event.name === "checkout.completed") {
          toast.success("Processing — your plan updates shortly.");
        }
      },
    }).then((paddle) => {
      paddleInstance = paddle;
      return paddle;
    });
  }

  return paddlePromise;
}
