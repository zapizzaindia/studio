
'use server';

import Razorpay from 'razorpay';

/**
 * Server Action to create a Razorpay Order.
 * This provides a secure order_id for the frontend to use.
 */
export async function createRazorpayOrder(amount: number) {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    // If keys aren't set, we'll return a mock for testing purposes
    // In a real environment, this should throw an error or return null
    console.warn("Razorpay Keys not found. Returning mock order.");
    return {
      id: `order_mock_${Math.random().toString(36).substring(7)}`,
      amount: amount * 100,
      currency: "INR",
      isMock: true
    };
  }

  const instance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  const options = {
    amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
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
