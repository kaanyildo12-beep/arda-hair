const SUPABASE_URL =
  'https://zehtftzxrjuoqcpcqmcs.supabase.co';

const SUPABASE_KEY =
  'sb_publishable_wUwY1wDw05gblt9WVOMT6Q_xxIcGKvF';


module.exports = async function handler(req, res) {

  if (req.method !== 'POST') {

    res.setHeader('Allow', 'POST');

    return res.status(405).json({
      error: 'METHOD_NOT_ALLOWED'
    });

  }


  try {

    const body =
      typeof req.body === 'string'
        ? JSON.parse(req.body)
        : req.body;


    const items =
      body?.items;


    if (
      !Array.isArray(items) ||
      items.length < 1 ||
      items.length > 50
    ) {

      return res.status(400).json({
        error: 'INVALID_CART'
      });

    }


    const cleanItems =
      items.map(item => ({

        productId:
          String(item.productId || ''),

        variantId:
          item.variantId
            ? String(item.variantId)
            : null,

        quantity:
          Number(item.quantity || 0)

      }));


    for (const item of cleanItems) {

      if (
        !item.productId ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 20
      ) {

        return res.status(400).json({
          error: 'INVALID_CART_ITEM'
        });

      }

    }


    const response =
      await fetch(
        `${SUPABASE_URL}/rest/v1/rpc/checkout_quote`,
        {
          method: 'POST',

          headers: {
            apikey: SUPABASE_KEY,
            Authorization:
              `Bearer ${SUPABASE_KEY}`,
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({
            p_items: cleanItems
          })
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      console.error(
        'Checkout quote error:',
        data
      );

      const message =
        String(
          data?.message ||
          data?.error ||
          ''
        );


      if (
        message.includes(
          'INSUFFICIENT_STOCK'
        )
      ) {

        return res.status(409).json({
          error: 'INSUFFICIENT_STOCK'
        });

      }


      if (
        message.includes(
          'PRODUCT_UNAVAILABLE'
        ) ||
        message.includes(
          'VARIANT_UNAVAILABLE'
        )
      ) {

        return res.status(409).json({
          error: 'PRODUCT_UNAVAILABLE'
        });

      }


      return res.status(400).json({
        error: 'QUOTE_FAILED'
      });

    }


    res.setHeader(
      'Cache-Control',
      'no-store'
    );


    return res.status(200).json({
      ok: true,
      quote: data
    });


  } catch (error) {

    console.error(
      'Checkout API error:',
      error
    );


    return res.status(500).json({
      error: 'SERVER_ERROR'
    });

  }

};
