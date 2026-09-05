const crypto = require('crypto');

const SUPABASE_URL =
  'https://zehtftzxrjuoqcpcqmcs.supabase.co';

const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;


function getClientIp(req) {

  const forwarded =
    String(
      req.headers?.['x-forwarded-for'] || ''
    )
      .split(',')[0]
      .trim();

  const realIp =
    String(
      req.headers?.['x-real-ip'] || ''
    ).trim();

  return forwarded || realIp || 'unknown';

}


function hashValue(value) {

  return crypto
    .createHash('sha256')
    .update(String(value))
    .digest('hex');

}


async function checkRateLimit(
  req,
  {
    scope,
    limit,
    windowSeconds,
    identifier = ''
  }
) {

  if (
    !SERVICE_KEY ||
    !scope ||
    !Number.isInteger(limit) ||
    !Number.isInteger(windowSeconds)
  ) {

    throw new Error(
      'RATE_LIMIT_CONFIG_ERROR'
    );

  }


  const ipHash =
    hashValue(
      getClientIp(req)
    );

  const identifierHash =
    identifier
      ? hashValue(
          String(identifier)
            .trim()
            .toLowerCase()
        )
      : 'none';


  const rateKey =
    `${scope}:${ipHash}:${identifierHash}`;


  const response =
    await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/check_api_rate_limit`,
      {
        method: 'POST',

        headers: {
          apikey: SERVICE_KEY,
          Authorization:
            `Bearer ${SERVICE_KEY}`,
          'Content-Type':
            'application/json'
        },

        body: JSON.stringify({
          p_key: rateKey,
          p_limit: limit,
          p_window_seconds:
            windowSeconds
        })
      }
    );


  const data =
    await response
      .json()
      .catch(() => ({}));


  if (!response.ok) {

    throw new Error(
      'RATE_LIMIT_CHECK_FAILED'
    );

  }


  return {
    allowed:
      data?.allowed === true,

    retryAfter:
      Number(
        data?.retryAfter || 60
      )
  };

}


module.exports = {
  checkRateLimit
};
