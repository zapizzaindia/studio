'use server';

import Razorpay from 'razorpay';

/**
 * Server Action to create a Razorpay Order.
 * Using provided live credentials.
 */
export async function createRazorpayOrder(amount: number) {
  // Using hardcoded live keys as requested
  const keyId = "rzp_live_SPtyccI9oY5o0h";
  const keySecret = "YEhDj0fk587ApO8A4R42YrzB";

  const instance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  const options = {
    amount: Math.round(amount * 100), // amount in paise
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  };

  try {
    const order = await instance.orders.create(options);
    return {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      isMock: false
    };
  } catch (error) {
    console.error("Razorpay Order Creation Error:", error);
    throw new Error("Could not initiate payment gateway.");
  }
}

/**
 * Server Action to process a refund for a cancelled order.
 */
export async function refundRazorpayOrder(paymentId: string, amount: number) {
  const keyId = "rzp_live_SPtyccI9oY5o0h";
  const keySecret = "YEhDj0fk587ApO8A4R42YrzB";

  const instance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  try {
    const refund = await instance.refunds.create({
      payment_id: paymentId,
      amount: Math.round(amount * 100), // in paise
    });
    
    return { 
      success: true, 
      refundId: refund.id,
      message: "Refund processed successfully." 
    };
  } catch (error: any) {
    console.error("Razorpay Refund Error:", error);
    throw new Error(error.message || "Could not process refund via gateway.");
  }
}
