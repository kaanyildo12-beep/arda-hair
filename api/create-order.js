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

    res.setHeader('Allow', 'POST');

    return res.status(405).json({
      error: 'METHOD_NOT_ALLOWED'
    });

  }


  if (!SERVICE_KEY) {

    console.error(
      'SUPABASE_SERVICE_ROLE_KEY missing'
    );

    return res.status(500).json({
      error: 'SERVER_CONFIG_ERROR'
    });

  }


  try {

    const body =
      typeof req.body === 'string'
        ? JSON.parse(req.body)
        : req.body;


    const customer =
      body?.customer;

    const items =
      body?.items;

    const country =
      String(
        body?.country || ''
      )
        .trim()
        .toUpperCase();

    const paymentProvider =
      String(
        body?.paymentProvider || ''
      )
        .trim()
        .toLowerCase();


    if (
      !customer ||
      typeof customer !== 'object'
    ) {

      return res.status(400).json({
        error: 'INVALID_CUSTOMER'
      });

    }


    if (
      !Array.isArray(items) ||
      items.length < 1 ||
      items.length > 50
    ) {

      return res.status(400).json({
        error: 'INVALID_CART'
      });

    }


    if (
      !['stripe', 'paypal']
        .includes(paymentProvider)
    ) {

      return res.status(400).json({
        error: 'INVALID_PAYMENT_PROVIDER'
      });

    }


    const cleanItems =
      items.map(item => ({

        productId:
          String(
            item?.productId || ''
          ),

        variantId:
          item?.variantId
            ? String(item.variantId)
            : null,

        quantity:
          Number(
            item?.quantity || 0
          )

      }));


    for (const item of cleanItems) {

      if (
        !item.productId ||
        !Number.isInteger(
          item.quantity
        ) ||
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
        `${SUPABASE_URL}/rest/v1/rpc/create_pending_order`,
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

            p_customer: {
              email:
                customer.email,

              firstName:
                customer.firstName,

              lastName:
                customer.lastName,

              phone:
                customer.phone || null,

              company:
                customer.company || null,

              street:
                customer.street,

              postalCode:
                customer.postalCode,

              city:
                customer.city
            },

            p_items:
              cleanItems,

            p_country:
              country,

            p_payment_provider:
              paymentProvider,

            p_user_id:
              null

          })

        }
      );


    const data =
      await response
        .json()
        .catch(() => ({}));


    if (!response.ok) {

      console.error(
        'Create order error:',
        data
      );


      const message =
        String(
          data?.message ||
          data?.error ||
          ''
        );


      const knownErrors = [
        'INVALID_CUSTOMER',
        'INVALID_EMAIL',
        'INVALID_ADDRESS',
        'INVALID_PHONE',
        'INVALID_COMPANY',
        'INVALID_CART',
        'INVALID_CART_ITEM',
        'INVALID_QUANTITY',
        'PRODUCT_UNAVAILABLE',
        'VARIANT_UNAVAILABLE',
        'INSUFFICIENT_STOCK',
        'SHIPPING_RATE_UNAVAILABLE',
        'INVALID_PAYMENT_PROVIDER'
      ];


      const found =
        knownErrors.find(code =>
          message.includes(code)
        );


      return res
        .status(
          found ===
          'INSUFFICIENT_STOCK'
            ? 409
            : found ===
              'PRODUCT_UNAVAILABLE' ||
              found ===
              'VARIANT_UNAVAILABLE'
              ? 409
              : found ===
                'SHIPPING_RATE_UNAVAILABLE'
                ? 422
                : 400
        )
        .json({
          error:
            found ||
            'ORDER_CREATE_FAILED'
        });

    }


    return res.status(200).json({
      ok: true,
      order: data
    });


  } catch (error) {

    console.error(
      'Create order API error:',
      error
    );


    return res.status(500).json({
      error: 'SERVER_ERROR'
    });

  }

};
