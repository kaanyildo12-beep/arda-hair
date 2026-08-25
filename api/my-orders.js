const SUPABASE_URL =
  'https://zehtftzxrjuoqcpcqmcs.supabase.co';

const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const { getAuthenticatedUser } =
  require('../lib/auth-user');


module.exports = async function handler(req, res) {

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


  if (!SERVICE_KEY) {

    return res.status(500).json({
      error: 'SERVER_CONFIG_ERROR'
    });

  }


  try {

    const user =
      await getAuthenticatedUser(req);


    if (!user?.id) {

      return res.status(401).json({
        error: 'AUTH_REQUIRED'
      });

    }


    const ordersResponse =
      await fetch(
        `${SUPABASE_URL}/rest/v1/orders?user_id=eq.${encodeURIComponent(user.id)}&select=id,order_number,currency,total_cents,payment_status,order_status,created_at&order=created_at.desc&limit=100`,
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
      await ordersResponse
        .json()
        .catch(() => []);


    if (!ordersResponse.ok) {

      throw new Error(
        'ORDERS_FETCH_FAILED'
      );

    }


    if (
      !Array.isArray(orders) ||
      orders.length === 0
    ) {

      return res.status(200).json({
        ok: true,
        orders: []
      });

    }


    const orderIds =
      orders
        .map(order => order.id)
        .filter(Boolean);


    const itemsResponse =
      await fetch(
        `${SUPABASE_URL}/rest/v1/order_items?order_id=in.(${orderIds.join(',')})&select=order_id,product_id,variant_id,product_name,variant_name,unit_price_cents,quantity,line_total_cents,image_url&order=created_at.asc`,
        {
          headers: {
            apikey:
              SERVICE_KEY,

            Authorization:
              `Bearer ${SERVICE_KEY}`
          }
        }
      );


    const items =
      await itemsResponse
        .json()
        .catch(() => []);


    if (!itemsResponse.ok) {

      throw new Error(
        'ORDER_ITEMS_FETCH_FAILED'
      );

    }


    const finalOrders =
      orders.map(order => ({

        orderNumber:
          order.order_number,

        currency:
          order.currency,

        totalCents:
          order.total_cents,

        paymentStatus:
          order.payment_status,

        orderStatus:
          order.order_status,

        createdAt:
          order.created_at,

        items:
          items.filter(
            item =>
              item.order_id === order.id
          )

      }));


    return res.status(200).json({
      ok: true,
      orders: finalOrders
    });


  } catch (error) {

    if (
      error?.code ===
      'INVALID_AUTH_TOKEN'
    ) {

      return res.status(401).json({
        error: 'INVALID_AUTH_TOKEN'
      });

    }


    console.error(
      'My orders API error:',
      error
    );


    return res.status(500).json({
      error: 'SERVER_ERROR'
    });

  }

};
