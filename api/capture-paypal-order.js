const SUPABASE_URL =
  'https://zehtftzxrjuoqcpcqmcs.supabase.co';

const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const PAYPAL_CLIENT_ID =
  process.env.PAYPAL_CLIENT_ID;

const PAYPAL_CLIENT_SECRET =
  process.env.PAYPAL_CLIENT_SECRET;

const PAYPAL_BASE_URL =
  process.env.PAYPAL_BASE_URL ||
  'https://api-m.sandbox.paypal.com';


async function getPayPalAccessToken() {

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


module.exports = async function handler(
  req,
  res
) {

  res.setHeader(
    'Cache-Control',
    'no-store'
  );


  if (req.method !== 'POST') {

    res.setHeader('Allow', 'POST');

    return res.status(405).json({
      error: 'METHOD_NOT_ALLOWED'
    });

  }


  if (
    !SERVICE_KEY ||
    !PAYPAL_CLIENT_ID ||
    !PAYPAL_CLIENT_SECRET
  ) {

    return res.status(500).json({
      error: 'SERVER_CONFIG_ERROR'
    });

  }


  try {

    const body =
      typeof req.body === 'string'
        ? JSON.parse(req.body)
        : req.body;


    const paypalOrderId =
      String(
        body?.paypalOrderId || ''
      ).trim();


    if (!paypalOrderId) {

      return res.status(400).json({
        error: 'INVALID_PAYPAL_ORDER'
      });

    }


    const existingResponse =
      await fetch(
        `${SUPABASE_URL}/rest/v1/orders?provider_session_id=eq.${encodeURIComponent(paypalOrderId)}&payment_provider=eq.paypal&select=order_number,currency,total_cents,payment_status`,
        {
          headers: {
            apikey:
              SERVICE_KEY,

            Authorization:
              `Bearer ${SERVICE_KEY}`
          }
        }
      );


    const existingOrders =
      await existingResponse
        .json()
        .catch(() => []);


    if (
      existingResponse.ok &&
      Array.isArray(existingOrders) &&
      existingOrders.length === 1 &&
      existingOrders[0].payment_status ===
        'paid'
    ) {

      return res.status(200).json({
        ok: true,

        orderNumber:
          existingOrders[0]
            .order_number,

        currency:
          existingOrders[0]
            .currency,

        totalCents:
          existingOrders[0]
            .total_cents,

        paymentStatus:
          'paid',

        alreadyPaid:
          true
      });

    }


    const accessToken =
      await getPayPalAccessToken();


    const captureResponse =
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


    const captureData =
      await captureResponse
        .json()
        .catch(() => ({}));


    if (
      !captureResponse.ok ||
      captureData.status !==
      'COMPLETED'
    ) {

      console.error(
        'PayPal capture error:',
        captureData
      );

      return res.status(409).json({
        error:
          'PAYPAL_CAPTURE_FAILED'
      });

    }


    const purchaseUnit =
      captureData
        ?.purchase_units
        ?.[0];


    const capture =
      purchaseUnit
        ?.payments
        ?.captures
        ?.[0];


    const orderId =
      purchaseUnit
        ?.reference_id;


    if (
      !orderId ||
      !capture?.id ||
      capture.status !==
        'COMPLETED'
    ) {

      return res.status(409).json({
        error:
          'INVALID_CAPTURE_RESPONSE'
      });

    }


    const amountValue =
      String(
        capture.amount?.value || ''
      );


    const currency =
      String(
        capture.amount?.currency_code ||
        ''
      );


    if (
      !/^\d+\.\d{2}$/
        .test(amountValue)
    ) {

      return res.status(409).json({
        error:
          'INVALID_CAPTURE_AMOUNT'
      });

    }


    const [
      euros,
      cents
    ] =
      amountValue.split('.');


    const amountCents =
      (
        Number(euros) * 100
      ) +
      Number(cents);


    const completeResponse =
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
              orderId,

            p_paypal_order_id:
              paypalOrderId,

            p_capture_id:
              capture.id,

            p_amount_total:
              amountCents,

            p_currency:
              currency

          })

        }
      );


    const completeData =
      await completeResponse
        .json()
        .catch(() => ({}));


    if (!completeResponse.ok) {

      console.error(
        'Complete PayPal order error:',
        completeData
      );

      return res.status(409).json({
        error:
          'ORDER_COMPLETE_FAILED'
      });

    }


    return res.status(200).json({
      ok: true,

      orderNumber:
        completeData.orderNumber,

      currency,

      totalCents:
        amountCents,

      paymentStatus:
        'paid'
    });


  } catch (error) {

    console.error(
      'Capture PayPal error:',
      error
    );


    return res.status(500).json({
      error: 'SERVER_ERROR'
    });

  }

};
