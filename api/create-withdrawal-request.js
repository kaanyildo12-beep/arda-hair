const SUPABASE_URL =
  'https://zehtftzxrjuoqcpcqmcs.supabase.co';

const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;


module.exports = async function handler(req, res) {

  res.setHeader(
    'Cache-Control',
    'no-store'
  );


  if (req.method !== 'POST') {

    res.setHeader(
      'Allow',
      'POST'
    );

    return res.status(405).json({
      error: 'METHOD_NOT_ALLOWED'
    });

  }


  if (!SERVICE_KEY) {

    return res.status(500).json({
      error: 'SERVER_CONFIG_ERROR'
    });

  }


  try {

    const {
      name,
      orderNumber,
      email,
      message
    } = req.body || {};


    const cleanName =
      String(name || '')
        .trim()
        .slice(0, 160);

    const cleanOrderNumber =
      String(orderNumber || '')
        .trim()
        .slice(0, 100);

    const cleanEmail =
      String(email || '')
        .trim()
        .toLowerCase()
        .slice(0, 254);

    const cleanMessage =
      String(message || '')
        .trim()
        .slice(0, 3000);


    if (
      !cleanName ||
      !cleanOrderNumber ||
      !cleanEmail
    ) {

      return res.status(400).json({
        error: 'MISSING_REQUIRED_FIELDS'
      });

    }


    const orderResponse =
      await fetch(
        `${SUPABASE_URL}/rest/v1/orders` +
        `?order_number=eq.${encodeURIComponent(cleanOrderNumber)}` +
        `&email=eq.${encodeURIComponent(cleanEmail)}` +
        `&select=id` +
        `&limit=1`,
        {
          headers: {
            apikey: SERVICE_KEY,
            Authorization:
              `Bearer ${SERVICE_KEY}`
          }
        }
      );


    if (!orderResponse.ok) {

      throw new Error(
        'ORDER_LOOKUP_FAILED'
      );

    }


    const matchingOrders =
      await orderResponse.json();


    if (
      !Array.isArray(matchingOrders) ||
      matchingOrders.length === 0
    ) {

      return res.status(400).json({
        error: 'ORDER_NOT_FOUND'
      });

    }


    const insertResponse =
      await fetch(
        `${SUPABASE_URL}/rest/v1/withdrawal_requests`,
        {
          method: 'POST',

          headers: {
            apikey: SERVICE_KEY,
            Authorization:
              `Bearer ${SERVICE_KEY}`,
            'Content-Type':
              'application/json',
            Prefer:
              'return=representation'
          },

          body: JSON.stringify({
            name: cleanName,
            order_number:
              cleanOrderNumber,
            email:
              cleanEmail,
            message:
              cleanMessage || null
          })
        }
      );


    if (!insertResponse.ok) {

      throw new Error(
        'WITHDRAWAL_INSERT_FAILED'
      );

    }


    const rows =
      await insertResponse.json();

    const request =
      Array.isArray(rows)
        ? rows[0]
        : null;


    return res.status(200).json({
      ok: true,
      requestId:
        request?.id || null,
      receivedAt:
        request?.created_at || null
    });

  } catch (error) {

    console.error(
      'Withdrawal request error:',
      error
    );

    return res.status(500).json({
      error: 'INTERNAL_ERROR'
    });

  }

};
