export async function deliverTransactionalEmail(input: {
  to: string;
  subject: string;
  text: string;
}): Promise<{ delivered: boolean; provider: string }> {
  const deliveryUrl = process.env.EMAIL_DELIVERY_URL?.trim();
  const deliveryToken = process.env.EMAIL_DELIVERY_TOKEN?.trim();
  if (!deliveryUrl || !deliveryToken) {
    return { delivered: false, provider: 'none' };
  }

  try {
    const response = await fetch(deliveryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${deliveryToken}`,
      },
      body: JSON.stringify(input),
    });
    return { delivered: response.ok, provider: 'webhook' };
  } catch {
    return { delivered: false, provider: 'webhook' };
  }
}
