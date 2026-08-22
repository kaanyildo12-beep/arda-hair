const crypto = require('crypto');

const SUPABASE_URL =
  'https://zehtftzxrjuoqcpcqmcs.supabase.co';

const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const WEBHOOK_SECRET =
  process.env.STRIPE_WEBHOOK_SECRET;


async function getRawBody(req) {

  const chunks = [];

  for await (const chunk of req) {

    chunks.push(
      Buffer.isBuffer(chunk)
        ? chunk
        : Buffer.from(chunk)
    );

  }

  return Buffer.concat(chunks);

}


function safeEqualHex(a, b) {

  try {

    const first =
      Buffer.from(a, 'hex');

    const second =
      Buffer.from(b, 'hex');

    return (
      first.length === second.length &&
      crypto.timingSafeEqual(
        first,
        second
      )
    );

  } catch {

    return false;

  }

}


function verifyStripeSignature(
  rawBody,
  header
) {

  if (
    !WEBHOOK_SECRET ||
    !header
  ) {
    return false;
  }


  const parts =
    String(header)
      .split(',')
      .map(part =>
        part.trim()
      );


  const timestampPart =
    parts.find(part =>
      part.startsWith('t=')
    );


  const signatures =
    parts
      .filter(part =>
        part.startsWith('v1=')
      )
      .map(part =>
        part.slice(3)
      );


  if (
    !timestampPart ||
    !signatures.length
  ) {
    return false;
  }


  const timestamp =
    Number(
      timestampPart.slice(2)
    );


  if (
    !Number.isFinite(timestamp)
  ) {
    return false;
  }


  const now =
    Math.floor(
      Date.now() / 1000
    );


  if (
    Math.abs(now - timestamp) > 300
  ) {
    return false;
  }


  const signedPayload =
    Buffer.concat([
      Buffer.from(
        `${timestamp}.`,
        'utf8'
      ),
      rawBody
    ]);


  const expected =
    crypto
      .createHmac(
        'sha256',
        WEBHOOK_SECRET
      )
      .update(signedPayload)
      .digest('hex');


  return signatures.some(
    signature =>
      safeEqualHex(
        signature,
        expected
      )
  );

}


async function completeOrder(
  session
) {

  const orderId =
    session.client_reference_id ||
    session.metadata?.order_id;


  if (!orderId) {
    throw new Error(
      'ORDER_ID_MISSING'
    );
  }


  const paymentIntentId =
    typeof session.payment_intent ===
    'string'
      ? session.payment_intent
      : session.payment_intent?.id ||
        null;


  const response =
    await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/complete_stripe_order`,
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

          p_session_id:
            session.id,

          p_payment_intent_id:
            paymentIntentId,

          p_amount_total:
            Number(
              session.amount_total
            ),

          p_currency:
            String(
              session.currency || ''
            )

        })

      }
    );


  const data =
    await response
      .json()
      .catch(() => ({}));


  if (!response.ok) {

    console.error(
      'Complete order failed:',
      data
    );

    throw new Error(
      'COMPLETE_ORDER_FAILED'
    );

  }


  return data;

}


async function cancelExpiredOrder(
  session
) {

  if (!session?.id) {
    return;
  }


  const response =
    await fetch(
      `${SUPABASE_URL}/rest/v1/orders` +
      `?provider_session_id=eq.${encodeURIComponent(session.id)}` +
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
            'cancelled',

          order_status:
            'cancelled',

          updated_at:
            new Date()
              .toISOString()
        })

      }
    );


  if (!response.ok) {

    throw new Error(
      'CANCEL_ORDER_FAILED'
    );

  }

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
    !WEBHOOK_SECRET
  ) {

    console.error(
      'Webhook server secret missing'
    );

    return res.status(500).json({
      error:
        'SERVER_CONFIG_ERROR'
    });

  }


  try {

    const rawBody =
      await getRawBody(req);


    const signature =
      req.headers[
        'stripe-signature'
      ];


    if (
      !verifyStripeSignature(
        rawBody,
        signature
      )
    ) {

      return res.status(400).json({
        error:
          'INVALID_SIGNATURE'
      });

    }


    const event =
      JSON.parse(
        rawBody.toString('utf8')
      );


    if (
      event.type ===
      'checkout.session.completed'
    ) {

      const session =
        event.data?.object;


      if (
        session?.payment_status ===
        'paid'
      ) {

        await completeOrder(
          session
        );

      }

    }


    if (
      event.type ===
      'checkout.session.expired'
    ) {

      await cancelExpiredOrder(
        event.data?.object
      );

    }


    return res.status(200).json({
      received: true
    });


  } catch (error) {

    console.error(
      'Stripe webhook error:',
      error
    );


    return res.status(500).json({
      error:
        'WEBHOOK_FAILED'
    });

  }

};


module.exports.config = {
  api: {
    bodyParser: false
  }
};
