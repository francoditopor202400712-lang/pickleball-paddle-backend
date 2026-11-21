import crypto from 'node:crypto';

const baseUrl = process.env.MAYA_BASE_URL || 'https://pg-sandbox.paymaya.com';

function basicAuth(key) {
  return `Basic ${Buffer.from(`${key}:`).toString('base64')}`;
}

export async function createMayaCheckout({ order, items, buyer }) {
  const publicKey = process.env.MAYA_PUBLIC_KEY;
  if (!publicKey) throw new Error('MAYA_PUBLIC_KEY is not configured.');

  const requestReferenceNumber = `PADDLE-${order.id}-${crypto.randomUUID().slice(0, 8)}`;

  const payload = {
    totalAmount: {
      value: Number(order.total_amount).toFixed(2),
      currency: 'PHP'
    },
    buyer: {
      firstName: buyer?.first_name || 'Customer',
      lastName: buyer?.last_name || ' ',
      contact: {
        email: buyer?.email || ''
      }
    },
    items: items.map((item) => ({
      name: item.product_name,
      quantity: Number(item.quantity),
      amount: { value: Number(item.unit_price).toFixed(2) },
      totalAmount: {
        value: (Number(item.unit_price) * Number(item.quantity)).toFixed(2)
      }
    })),
    redirectUrl: {
      success: process.env.PAYMENT_SUCCESS_URL,
      failure: process.env.PAYMENT_FAILURE_URL,
      cancel: process.env.PAYMENT_CANCEL_URL
    },
    requestReferenceNumber
  };

  const response = await fetch(`${baseUrl}/checkout/v1/checkouts`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: basicAuth(publicKey)
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = result?.message || result?.error || 'Maya checkout request failed.';
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }

  return {
    checkout_id: result.checkoutId || result.id,
    redirect_url: result.redirectUrl,
    request_reference_number: requestReferenceNumber,
    raw_response: result
  };
}

export async function getMayaPaymentStatus(paymentId) {
  const publicKey = process.env.MAYA_PUBLIC_KEY;
  if (!publicKey) throw new Error('MAYA_PUBLIC_KEY is not configured.');

  const response = await fetch(`${baseUrl}/payments/v1/payments/${encodeURIComponent(paymentId)}/status`, {
    headers: {
      Accept: 'application/json',
      Authorization: basicAuth(publicKey)
    }
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error('Unable to retrieve Maya payment status.');
  return result;
}
