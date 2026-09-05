const SUPABASE_URL =
  'https://zehtftzxrjuoqcpcqmcs.supabase.co';

const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const PAYPAL_CLIENT_ID =
  process.env.PAYPAL_CLIENT_ID;

const PAYPAL_CLIENT_SECRET =
  process.env.PAYPAL_CLIENT_SECRET;

const PAYPAL_WEBHOOK_ID =
  process.env.PAYPAL_WEBHOOK_ID;

const PAYPAL_BASE_URL =
  process.env.PAYPAL_BASE_URL ||
  'https://api-m.sandbox.paypal.com';


async function getAccessToken() {

  const auth =
    Buffer
      .from(
        `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
      )
      .toString('base64');


  const response =
    await fetch(
      `${PAYPAL_BASE_URL}/v1/oauth2/token`,
      {
        method: 'POST',

        headers: {
          Authorization:
            `Basic ${auth}`,

          'Content-Type':
            'application/x-www-form-urlencoded'
        },

        body:
          'grant_type=client_credentials'
      }
    );


  const data =
    await response
      .json()
      .catch(() => ({}));


  if (
    !response.ok ||
    !data.access_token
  ) {

    throw new Error(
      'PAYPAL_AUTH_FAILED'
    );

  }


  return data.access_token;

}


async function verifyWebhook(
  req,
  event,
  accessToken
) {

  const response =
    await fetch(
      `${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`,
      {
        method: 'POST',

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          'Content-Type':
            'application/json'
        },

        body: JSON.stringify({

          auth_algo:
            req.headers[
              'paypal-auth-algo'
            ],

          cert_url:
            req.headers[
              'paypal-cert-url'
            ],

          transmission_id:
            req.headers[
              'paypal-transmission-id'
            ],

          transmission_sig:
            req.headers[
              'paypal-transmission-sig'
            ],

          transmission_time:
            req.headers[
              'paypal-transmission-time'
            ],

          webhook_id:
            PAYPAL_WEBHOOK_ID,

          webhook_event:
            event

        })
      }
    );


  const data =
    await response
      .json()
      .catch(() => ({}));


  return (
    response.ok &&
    data.verification_status ===
      'SUCCESS'
  );

}


async function findLocalOrder(
  paypalOrderId
) {

  const response =
    await fetch(
      `${SUPABASE_URL}/rest/v1/orders` +
      `?provider_session_id=eq.${encodeURIComponent(paypalOrderId)}` +
      `&payment_provider=eq.paypal` +
      `&select=id,order_number,payment_status`,
      {
        headers: {
          apikey:
            SERVICE_KEY,

          Authorization:
            `Bearer ${SERVICE_KEY}`
        }
      }
    );


  const rows =
    await response
      .json()
      .catch(() => []);


  if (
    !response.ok ||
    !Array.isArray(rows) ||
    rows.length !== 1
  ) {

    return null;

  }


  return rows[0];

}


async function completeLocalOrder(
  paypalOrderId,
  captureId,
  amountValue,
  currency
) {

  const localOrder =
    await findLocalOrder(
      paypalOrderId
    );


  if (!localOrder) {

    throw new Error(
      'LOCAL_ORDER_NOT_FOUND'
    );

  }


  if (
    localOrder.payment_status ===
    'paid'
  ) {

    return;

  }


  const match =
    String(amountValue || '')
      .match(
        /^(\d+)\.(\d{2})$/
      );


  if (!match) {

    throw new Error(
      'INVALID_AMOUNT'
    );

  }


  const amountCents =
    Number(match[1]) * 100 +
    Number(match[2]);


  const response =
    await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/complete_paypal_order`,
      {
        method: 'POST',

        headers: {
          apikey:
            SERVICE_KEY,

          Authorization:
            `Bearer ${SERVICE_KEY}`,

          'Content-Type':
            'application/json'
        },

        body: JSON.stringify({

          p_order_id:
            localOrder.id,

          p_paypal_order_id:
            paypalOrderId,

          p_capture_id:
            captureId,

          p_amount_total:
            amountCents,

          p_currency:
            currency

        })
      }
    );


  if (!response.ok) {

    const data =
      await response
        .json()
        .catch(() => ({}));

    console.error(
      'Complete PayPal webhook order:',
      data
    );

    throw new Error(
      'COMPLETE_ORDER_FAILED'
    );

  }

}


async function captureApprovedOrder(
  paypalOrderId,
  accessToken
) {

  const response =
    await fetch(
      `${PAYPAL_BASE_URL}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`,
      {
        method: 'POST',

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          'Content-Type':
            'application/json',

          'PayPal-Request-Id':
            `capture-${paypalOrderId}`
        }
      }
    );


  const data =
    await response
      .json()
      .catch(() => ({}));


  if (
    response.ok &&
    data.status === 'COMPLETED'
  ) {

    const capture =
      data
        ?.purchase_units
        ?.[0]
        ?.payments
        ?.captures
        ?.[0];


    if (
      capture?.id &&
      capture?.status ===
        'COMPLETED'
    ) {

      await completeLocalOrder(
        paypalOrderId,
        capture.id,
        capture.amount?.value,
        capture.amount?.currency_code
      );

    }

  }

}


async function failPendingOrder(
  paypalOrderId
) {

  await fetch(
    `${SUPABASE_URL}/rest/v1/orders` +
    `?provider_session_id=eq.${encodeURIComponent(paypalOrderId)}` +
    `&payment_provider=eq.paypal` +
    `&payment_status=eq.pending`,
    {
      method: 'PATCH',

      headers: {
        apikey:
          SERVICE_KEY,

        Authorization:
          `Bearer ${SERVICE_KEY}`,

        'Content-Type':
          'application/json',

        Prefer:
          'return=minimal'
      },

      body: JSON.stringify({
        payment_status:
          'failed',

        order_status:
          'cancelled',

        updated_at:
          new Date().toISOString()
      })
    }
  );

}


module.exports =
async function handler(
  req,
  res
) {

  if (req.method !== 'POST') {

    return res.status(405).json({
      error:
        'METHOD_NOT_ALLOWED'
    });

  }


  if (
    !SERVICE_KEY ||
    !PAYPAL_CLIENT_ID ||
    !PAYPAL_CLIENT_SECRET ||
    !PAYPAL_WEBHOOK_ID
  ) {

    return res.status(500).json({
      error:
        'SERVER_CONFIG_ERROR'
    });

  }


  try {

    const event =
      typeof req.body === 'string'
        ? JSON.parse(req.body)
        : req.body;


    const accessToken =
      await getAccessToken();


    const valid =
      await verifyWebhook(
        req,
        event,
        accessToken
      );


    if (!valid) {

      return res.status(400).json({
        error:
          'INVALID_SIGNATURE'
      });

    }


    if (
      event.type ===
      'CHECKOUT.ORDER.APPROVED'
    ) {

      const paypalOrderId =
        event.resource?.id;


      if (paypalOrderId) {

        await captureApprovedOrder(
          paypalOrderId,
          accessToken
        );

      }

    }


    if (
      event.type ===
      'PAYMENT.CAPTURE.COMPLETED'
    ) {

      const capture =
        event.resource;


      const paypalOrderId =
        capture
          ?.supplementary_data
          ?.related_ids
          ?.order_id;


      if (
        paypalOrderId &&
        capture?.id
      ) {

        await completeLocalOrder(
          paypalOrderId,
          capture.id,
          capture.amount?.value,
          capture.amount?.currency_code
        );

      }

    }


    if (
      event.type ===
        'PAYMENT.CAPTURE.DENIED' ||
      event.type ===
        'CHECKOUT.PAYMENT-APPROVAL.REVERSED'
    ) {

      const paypalOrderId =
        event.resource
          ?.supplementary_data
          ?.related_ids
          ?.order_id ||
        event.resource?.id;


      if (paypalOrderId) {

        await failPendingOrder(
          paypalOrderId
        );

      }

    }


    return res.status(200).json({
      received: true
    });


  } catch (error) {

    console.error(
      'PayPal webhook error:',
      error
    );


    return res.status(500).json({
      error:
        'WEBHOOK_FAILED'
    });

  }

};
