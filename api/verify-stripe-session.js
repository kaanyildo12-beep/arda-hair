const SUPABASE_URL =
  'https://zehtftzxrjuoqcpcqmcs.supabase.co';

const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const STRIPE_SECRET_KEY =
  process.env.STRIPE_SECRET_KEY;


module.exports = async function handler(
  req,
  res
) {

  res.setHeader(
    'Cache-Control',
    'no-store'
  );


  if (req.method !== 'GET') {

    res.setHeader('Allow', 'GET');

    return res.status(405).json({
      error: 'METHOD_NOT_ALLOWED'
    });

  }


  if (
    !SERVICE_KEY ||
    !STRIPE_SECRET_KEY
  ) {

    return res.status(500).json({
      error: 'SERVER_CONFIG_ERROR'
    });

  }


  try {

    const sessionId =
      String(
        req.query?.session_id || ''
      ).trim();


    if (
      !sessionId.startsWith(
        'cs_'
      )
    ) {

      return res.status(400).json({
        error: 'INVALID_SESSION'
      });

    }


    const stripeResponse =
      await fetch(
        `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
        {
          headers: {
            Authorization:
              `Bearer ${STRIPE_SECRET_KEY}`
          }
        }
      );


    const session =
      await stripeResponse
        .json()
        .catch(() => ({}));


    if (
      !stripeResponse.ok ||
      !session?.id
    ) {

      return res.status(404).json({
        error: 'SESSION_NOT_FOUND'
      });

    }


    if (
      session.payment_status !==
      'paid'
    ) {

      return res.status(409).json({
        error: 'PAYMENT_NOT_COMPLETED'
      });

    }


    const orderId =
      session.client_reference_id ||
      session.metadata?.order_id;


    if (!orderId) {

      return res.status(400).json({
        error: 'ORDER_NOT_FOUND'
      });

    }


    const orderResponse =
      await fetch(
        `${SUPABASE_URL}/rest/v1/orders` +
        `?id=eq.${encodeURIComponent(orderId)}` +
        `&provider_session_id=eq.${encodeURIComponent(sessionId)}` +
        `&select=id,order_number,currency,total_cents,payment_status,order_status`,
        {
          headers: {
            apikey:
              SERVICE_KEY,

            Authorization:
              `Bearer ${SERVICE_KEY}`
          }
        }
      );


    const orders =
      await orderResponse
        .json()
        .catch(() => []);


    if (
      !orderResponse.ok ||
      !Array.isArray(orders) ||
      orders.length !== 1
    ) {

      return res.status(404).json({
        error: 'ORDER_NOT_FOUND'
      });

    }


    const order =
      orders[0];


    if (
      String(
        session.currency || ''
      ).toUpperCase() !==
        String(
          order.currency || ''
        ).toUpperCase() ||
      Number(
        session.amount_total
      ) !==
        Number(
          order.total_cents
        )
    ) {

      console.error(
        'Stripe amount/order mismatch',
        {
          orderId:
            order.id,

          sessionId:
            session.id
        }
      );

      return res.status(409).json({
        error: 'ORDER_MISMATCH'
      });

    }


    return res.status(200).json({
      ok: true,

      paymentStatus:
        'paid',

      order: {
        orderNumber:
          order.order_number,

        currency:
          order.currency,

        totalCents:
          order.total_cents,

        orderStatus:
          order.order_status
      }
    });


  } catch (error) {

    console.error(
      'Verify Stripe session error:',
      error
    );


    return res.status(500).json({
      error: 'SERVER_ERROR'
    });

  }

};
