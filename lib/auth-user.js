const SUPABASE_URL =
  'https://zehtftzxrjuoqcpcqmcs.supabase.co';

const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;


function createAuthError(
  code,
  statusCode
) {

  const error =
    new Error(code);

  error.code =
    code;

  error.statusCode =
    statusCode;

  return error;

}


async function getAuthenticatedUser(req) {

  const authorization =
    String(
      req.headers?.authorization || ''
    ).trim();


  if (!authorization) {
    return null;
  }


  const match =
    authorization.match(
      /^Bearer\s+(.+)$/i
    );


  if (
    !match ||
    !match[1]?.trim()
  ) {

    throw createAuthError(
      'INVALID_AUTH_TOKEN',
      401
    );

  }


  if (!SERVICE_KEY) {

    throw createAuthError(
      'SERVER_CONFIG_ERROR',
      500
    );

  }


  const accessToken =
    match[1].trim();


  const response =
    await fetch(
      `${SUPABASE_URL}/auth/v1/user`,
      {
        method: 'GET',

        headers: {
          apikey:
            SERVICE_KEY,

          Authorization:
            `Bearer ${accessToken}`
        }
      }
    );


  const user =
    await response
      .json()
      .catch(() => ({}));


  if (
    !response.ok ||
    !user?.id
  ) {

    throw createAuthError(
      'INVALID_AUTH_TOKEN',
      401
    );

  }


  return user;

}


module.exports = {
  getAuthenticatedUser
};
