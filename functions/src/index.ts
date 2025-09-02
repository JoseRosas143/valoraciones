
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {
  onCall,
  onRequest,
  HttpsError,
  CallableRequest,
} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import {buffer} from "micro";

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// Set global options for functions if needed.
setGlobalOptions({maxInstances: 10});

// Lazily initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

/**
 * Creates a Stripe Checkout session for a user to subscribe.
 * This function is flexible and can receive a priceId from the client.
 */
export const createStripeCheckout = onCall(
  {cors: true},
  async (request: CallableRequest<{priceId?: string}>) => {
    const context = request;
    // Check if the user is authenticated.
    if (!context.auth) {
      throw new HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }

    const userId = context.auth.uid;
    const userEmail = context.auth.token.email;

    if (!userEmail) {
      throw new HttpsError(
        "invalid-argument",
        "User email is not available."
      );
    }

    // Use the priceId from the request, or a default one as a fallback.
    const priceId = request.data.priceId || "price_1S2sicKQEealPn90L3nZW4Ep";

    try {
      // Create a checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        // Set a success and cancel URL.
        // These are the pages the user will be redirected to after payment.
        success_url:
        `${process.env.APP_URL}/forms?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL}/pricing`,
        // Pass the user's UID and email to the checkout session metadata
        // so we can identify the user in the webhook handler.
        metadata: {
          userId: userId,
        },
        customer_email: userEmail,
      });

      if (!session.url) {
        throw new HttpsError(
          "internal",
          "Could not create a Stripe checkout session."
        );
      }

      // Return the session URL to the client.
      return {url: session.url};
    } catch (error) {
      console.error("Stripe error:", error);
      throw new HttpsError(
        "internal",
        "An error occurred while creating the checkout session."
      );
    }
  }
);


/**
 * Stripe Webhook handler to update user subscription status in Firestore.
 */
export const stripeWebhook = onRequest(
  {cors: true},
  async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    const buf = await buffer(req);

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(buf, sig, stripeWebhookSecret);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Webhook signature verification failed.", message);
      res.status(400).send(`Webhook Error: ${message}`);
      return;
    }

    // Handle the event
    switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const sub = await stripe.subscriptions
        .retrieve(session.subscription as string);

      if (userId) {
        const userRef = db.collection("users").doc(userId);
        await userRef.set({
          subscription: {
            status: sub.status,
            priceId: sub.items.data[0].price.id,
            current_period_end: sub.current_period_end,
          },
        }, {merge: true});
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscriptionUpdate = event.data.object as Stripe.Subscription;
      const customerId = subscriptionUpdate.customer as string;
      const customer = await stripe.customers
        .retrieve(customerId) as Stripe.Customer;
      const userIdUpdate = customer.metadata.userId;

      if (userIdUpdate) {
        const userRef = db.collection("users").doc(userIdUpdate);
        await userRef.set({
          subscription: {
            status: subscriptionUpdate.status,
            priceId: subscriptionUpdate.items.data[0].price.id,
            current_period_end: subscriptionUpdate.current_period_end,
          },
        }, {merge: true});
      }
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).send();
  }
);
