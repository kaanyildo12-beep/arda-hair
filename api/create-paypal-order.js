const SUPABASE_URL =
  'https://zehtftzxrjuoqcpcqmcs.supabase.co';

const SITE_URL =
  'https://arda-hair.vercel.app';

const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const PAYPAL_CLIENT_ID =
  process.env.PAYPAL_CLIENT_ID;

const PAYPAL_CLIENT_SECRET =
  process.env.PAYPAL_CLIENT_SECRET;

const PAYPAL_BASE_URL =
  process.env.PAYPAL_BASE_URL ||
  'https://api-m.sandbox.paypal.com';

const { getAuthenticatedUser } =
  require('../lib/auth-user');


async function deleteOrder(orderId) {

  if (!orderId) return;

  try {

    await fetch(
      `${SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`,
      {
        method: 'DELETE',

        headers: {
          apikey:
            SERVICE_KEY,

          Authorization:
            `Bearer ${SERVICE_KEY}`
        }
      }
    );

  } catch (error) {

    console.error(
      'PayPal order cleanup failed:',
      error
    );

  }

}


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

    console.error(
      'PayPal token error:',
      data
    );

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


  let createdOrderId = null;


  try {

    const body =
      typeof req.body === 'string'
        ? JSON.parse(req.body)
        : req.body;

    const authenticatedUser =
      await getAuthenticatedUser(req);


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
              'paypal',

            p_user_id:
              authenticatedUser?.id || null

          })

        }
      );


    const orderData =
      await orderResponse
        .json()
        .catch(() => ({}));


    if (!orderResponse.ok) {

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


    const accessToken =
      await getPayPalAccessToken();


    const itemTotal =
      Number(
        orderData.subtotalCents
      ) / 100;

    const shippingTotal =
      Number(
        orderData.shippingCents
      ) / 100;

    const grandTotal =
      Number(
        orderData.totalCents
      ) / 100;


    const paypalItems =
      trustedItems.map(item => {

        let name =
          String(
            item.product_name ||
            'ARDA HAIR Produkt'
          );

        if (item.variant_name) {

          name +=
            ` · ${item.variant_name}`;

        }


        return {
          name:
            name.slice(0, 120),

          quantity:
            String(
              Number(item.quantity)
            ),

          unit_amount: {
            currency_code:
              'EUR',

            value:
              (
                Number(
                  item.unit_price_cents
                ) / 100
              ).toFixed(2)
          }
        };

      });


    const paypalResponse =
      await fetch(
        `${PAYPAL_BASE_URL}/v2/checkout/orders`,
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${accessToken}`,

            'Content-Type':
              'application/json',

            'PayPal-Request-Id':
              createdOrderId
          },

          body: JSON.stringify({

            intent:
              'CAPTURE',

            purchase_units: [
              {
                reference_id:
                  createdOrderId,

                custom_id:
                  createdOrderId,

                invoice_id:
                  orderNumber,

                amount: {
                  currency_code:
                    'EUR',

                  value:
                    grandTotal
                      .toFixed(2)
                }
              }
            ],

            payment_source: {
              paypal: {
                experience_context: {

                  user_action:
                    'PAY_NOW',

                  return_url:
                    `${SITE_URL}/paypal-return.html`,

                  cancel_url:
                    `${SITE_URL}/checkout.html?paypal=cancelled`
                }
              }
            }

          })
        }
      );


    const paypalData =
      await paypalResponse
        .json()
        .catch(() => ({}));


    if (
      !paypalResponse.ok ||
      !paypalData?.id
    ) {

      console.error(
        'PayPal create order error:',
        paypalData
      );

      await deleteOrder(
        createdOrderId
      );

      createdOrderId = null;


      return res.status(502).json({
        error:
          'PAYPAL_ORDER_FAILED'
      });

    }


    const approveUrl =
      paypalData.links
        ?.find(
          link =>
            link.rel ===
            'payer-action' ||
            link.rel ===
            'approve'
        )
        ?.href;


    if (!approveUrl) {

      await deleteOrder(
        createdOrderId
      );

      createdOrderId = null;

      return res.status(502).json({
        error:
          'PAYPAL_APPROVAL_URL_MISSING'
      });

    }


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
              paypalData.id
          })
        }
      );


    if (!updateResponse.ok) {

      await deleteOrder(
        createdOrderId
      );

      createdOrderId = null;

      throw new Error(
        'PAYPAL_ORDER_LINK_FAILED'
      );

    }


    return res.status(200).json({
      ok: true,

      paypalOrderId:
        paypalData.id,

      approveUrl,

      orderNumber
    });


  } catch (error) {

    if (error?.code === 'INVALID_AUTH_TOKEN') {
      return res.status(401).json({
        error: 'INVALID_AUTH_TOKEN'
      });
    }

    console.error(
      'PayPal checkout API error:',
      error
    );


    if (createdOrderId) {

      await deleteOrder(
        createdOrderId
      );

    }


    return res.status(500).json({
      error:
        'SERVER_ERROR'
    });

  }

};




