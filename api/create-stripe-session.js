const SUPABASE_URL =
  'https://zehtftzxrjuoqcpcqmcs.supabase.co';

const SITE_URL =
  'https://arda-hair.vercel.app';

const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const STRIPE_SECRET_KEY =
  process.env.STRIPE_SECRET_KEY;


async function deleteOrder(orderId) {

  if (!orderId) return;

  try {

    await fetch(
      `${SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`,
      {
        method: 'DELETE',

        headers: {
          apikey: SERVICE_KEY,
          Authorization:
            `Bearer ${SERVICE_KEY}`
        }
      }
    );

  } catch (error) {

    console.error(
      'Order cleanup failed:',
      error
    );

  }

}


async function expireStripeSession(
  sessionId
) {

  if (!sessionId) return;

  try {

    await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}/expire`,
      {
        method: 'POST',

        headers: {
          Authorization:
            `Bearer ${STRIPE_SECRET_KEY}`
        }
      }
    );

  } catch (error) {

    console.error(
      'Stripe session expire failed:',
      error
    );

  }

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

    res.setHeader(
      'Allow',
      'POST'
    );

    return res.status(405).json({
      error: 'METHOD_NOT_ALLOWED'
    });

  }


  if (
    !SERVICE_KEY ||
    !STRIPE_SECRET_KEY
  ) {

    console.error(
      'Required server secret missing'
    );

    return res.status(500).json({
      error: 'SERVER_CONFIG_ERROR'
    });

  }


  let createdOrderId = null;
  let stripeSessionId = null;


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


    const orderResponse =
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
              'stripe',

            p_user_id:
              null

          })

        }
      );


    const orderData =
      await orderResponse
        .json()
        .catch(() => ({}));


    if (!orderResponse.ok) {

      console.error(
        'Pending order error:',
        orderData
      );

      const message =
        String(
          orderData?.message ||
          orderData?.error ||
          ''
        );


      if (
        message.includes(
          'INSUFFICIENT_STOCK'
        )
      ) {

        return res.status(409).json({
          error:
            'INSUFFICIENT_STOCK'
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
          error:
            'PRODUCT_UNAVAILABLE'
        });

      }


      if (
        message.includes(
          'SHIPPING_RATE_UNAVAILABLE'
        )
      ) {

        return res.status(422).json({
          error:
            'SHIPPING_RATE_UNAVAILABLE'
        });

      }


      return res.status(400).json({
        error:
          'ORDER_CREATE_FAILED'
      });

    }


    createdOrderId =
      orderData?.orderId;

    const orderNumber =
      orderData?.orderNumber;


    if (
      !createdOrderId ||
      !orderNumber
    ) {

      throw new Error(
        'INVALID_ORDER_RESPONSE'
      );

    }


    const itemsResponse =
      await fetch(
        `${SUPABASE_URL}/rest/v1/order_items?order_id=eq.${encodeURIComponent(createdOrderId)}&select=product_name,variant_name,unit_price_cents,quantity&order=created_at.asc`,
        {
          headers: {
            apikey:
              SERVICE_KEY,

            Authorization:
              `Bearer ${SERVICE_KEY}`
          }
        }
      );


    const trustedItems =
      await itemsResponse
        .json()
        .catch(() => []);


    if (
      !itemsResponse.ok ||
      !Array.isArray(trustedItems) ||
      !trustedItems.length
    ) {

      throw new Error(
        'ORDER_ITEMS_FAILED'
      );

    }


    const params =
      new URLSearchParams();


    params.set(
      'mode',
      'payment'
    );

    params.set(
      'locale',
      'de'
    );

    params.set(
      'payment_method_types[0]',
      'card'
    );

    params.set(
      'customer_email',
      String(
        customer.email || ''
      ).trim()
    );

    params.set(
      'client_reference_id',
      createdOrderId
    );

    params.set(
      'metadata[order_id]',
      createdOrderId
    );

    params.set(
      'metadata[order_number]',
      String(orderNumber)
    );

    params.set(
      'payment_intent_data[metadata][order_id]',
      createdOrderId
    );

    params.set(
      'payment_intent_data[metadata][order_number]',
      String(orderNumber)
    );

    params.set(
      'success_url',
      `${SITE_URL}/checkout-success.html?session_id={CHECKOUT_SESSION_ID}`
    );

    params.set(
      'cancel_url',
      `${SITE_URL}/checkout.html?stripe=cancelled`
    );


    trustedItems.forEach(
      (item, index) => {

        let name =
          String(
            item.product_name ||
            'ARDA HAIR Produkt'
          );

        if (item.variant_name) {

          name +=
            ` · ${item.variant_name}`;

        }


        params.set(
          `line_items[${index}][price_data][currency]`,
          'eur'
        );

        params.set(
          `line_items[${index}][price_data][unit_amount]`,
          String(
            Number(
              item.unit_price_cents
            )
          )
        );

        params.set(
          `line_items[${index}][price_data][product_data][name]`,
          name.slice(0, 120)
        );

        params.set(
          `line_items[${index}][quantity]`,
          String(
            Number(item.quantity)
          )
        );

      }
    );


    const shippingIndex =
      trustedItems.length;


    params.set(
      `line_items[${shippingIndex}][price_data][currency]`,
      'eur'
    );

    params.set(
      `line_items[${shippingIndex}][price_data][unit_amount]`,
      String(
        Number(
          orderData.shippingCents
        )
      )
    );

    params.set(
      `line_items[${shippingIndex}][price_data][product_data][name]`,
      'DHL Paket Versand'
    );

    params.set(
      `line_items[${shippingIndex}][quantity]`,
      '1'
    );


    const stripeResponse =
      await fetch(
        'https://api.stripe.com/v1/checkout/sessions',
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${STRIPE_SECRET_KEY}`,

            'Content-Type':
              'application/x-www-form-urlencoded'
          },

          body:
            params.toString()
        }
      );


    const stripeData =
      await stripeResponse
        .json()
        .catch(() => ({}));


    if (
      !stripeResponse.ok ||
      !stripeData?.id ||
      !stripeData?.url
    ) {

      console.error(
        'Stripe session error:',
        stripeData
      );

      await deleteOrder(
        createdOrderId
      );

      createdOrderId = null;

      return res.status(502).json({
        error:
          'STRIPE_SESSION_FAILED'
      });

    }


    stripeSessionId =
      stripeData.id;


    const updateResponse =
      await fetch(
        `${SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(createdOrderId)}`,
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
            provider_session_id:
              stripeSessionId
          })
        }
      );


    if (!updateResponse.ok) {

      await expireStripeSession(
        stripeSessionId
      );

      await deleteOrder(
        createdOrderId
      );

      createdOrderId = null;

      throw new Error(
        'ORDER_SESSION_LINK_FAILED'
      );

    }


    return res.status(200).json({
      ok: true,

      checkoutUrl:
        stripeData.url,

      sessionId:
        stripeSessionId,

      orderNumber:
        orderNumber
    });


  } catch (error) {

    console.error(
      'Stripe checkout API error:',
      error
    );


    if (stripeSessionId) {

      await expireStripeSession(
        stripeSessionId
      );

    }


    if (createdOrderId) {

      await deleteOrder(
        createdOrderId
      );

    }


    return res.status(500).json({
      error: 'SERVER_ERROR'
    });

  }

};
