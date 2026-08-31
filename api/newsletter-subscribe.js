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
      email,
      language,
      consentText
    } = req.body || {};


    const cleanEmail =
      String(email || '')
        .trim()
        .toLowerCase()
        .slice(0, 254);


    const cleanLanguage =
      ['de', 'tr', 'en']
        .includes(language)
          ? language
          : 'de';


    const cleanConsentText =
      String(consentText || '')
        .trim()
        .slice(0, 1000);


    if (
      !cleanEmail ||
      !cleanConsentText ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {

      return res.status(400).json({
        error: 'INVALID_INPUT'
      });

    }


    const response =
      await fetch(
        `${SUPABASE_URL}/rest/v1/newsletter_subscribers?on_conflict=email`,
        {
          method: 'POST',

          headers: {
            apikey: SERVICE_KEY,
            Authorization:
              `Bearer ${SERVICE_KEY}`,
            'Content-Type':
              'application/json',
            Prefer:
              'resolution=merge-duplicates,return=representation'
          },

          body: JSON.stringify({
            email:
              cleanEmail,
            status:
              'pending',
            language:
              cleanLanguage,
            consent_text:
              cleanConsentText,
            consent_version:
              '2026-08',
            source:
              'homepage',
            requested_at:
              new Date().toISOString(),
            confirmed_at:
              null,
            unsubscribed_at:
              null,
            updated_at:
              new Date().toISOString()
          })
        }
      );


    if (!response.ok) {

      const details =
        await response.text();

      console.error(
        'Newsletter insert failed:',
        details
      );

      throw new Error(
        'NEWSLETTER_INSERT_FAILED'
      );

    }


    return res.status(200).json({
      ok: true,
      status: 'pending'
    });

  } catch (error) {

    console.error(
      'Newsletter signup error:',
      error
    );

    return res.status(500).json({
      error: 'INTERNAL_ERROR'
    });

  }

};
