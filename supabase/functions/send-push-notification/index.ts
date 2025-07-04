import { serve } from 'https://deno.land/x/sift@0.6.0/mod.ts';

serve(async (req) => {
  try {
    const { token, message } = await req.json();

    if (!token || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing token or message in request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: token,
        sound: 'default',
        body: message,
      }),
    });

    const result = await response.json();

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Push notification error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
