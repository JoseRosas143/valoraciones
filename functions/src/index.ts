
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {https, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import Stripe from "stripe";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Set global options for functions if needed.
setGlobalOptions({maxInstances: 10});

// Lazily initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

/**
 * Creates a Stripe Checkout session for a user to subscribe.
 */
export const createStripeCheckout = https.onCall(
  {cors: true},
  async (request) => {
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
        success_url: `${process.env.APP_URL}/forms?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL}/forms`,
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
