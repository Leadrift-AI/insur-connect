import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

interface GoogleTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GOOGLE-CALENDAR-OAUTH] ${step}${detailsStr}`);
};

serve(async (req) => {
  try {
    logStep("OAuth callback received");

    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      logStep("OAuth error", { error });
      return new Response(
        `<!DOCTYPE html>
         <html>
           <head>
             <title>Calendar Authorization Failed</title>
             <script>
               if (window.opener) {
                 window.opener.postMessage({
                   type: 'GOOGLE_CALENDAR_ERROR',
                   error: '${error}'
                 }, '*');
                 window.close();
               } else {
                 window.location.href = '/calendar-settings?error=${encodeURIComponent(error)}';
               }
             </script>
           </head>
           <body>
             <p>Authorization failed. This window will close automatically.</p>
           </body>
         </html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (!code) {
      throw new Error('No authorization code received');
    }

    logStep("Authorization code received", { codeLength: code.length });

    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get Google OAuth credentials
    const clientId = Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CALENDAR_CLIENT_SECRET');
    const redirectUri = `${req.headers.get('origin')}/functions/v1/google-calendar-oauth`;

    if (!clientId || !clientSecret) {
      throw new Error('Missing Google OAuth credentials');
    }

    logStep("Exchanging code for tokens");

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    const tokenData: GoogleTokenResponse = await tokenResponse.json();
    logStep("Tokens received", { hasAccessToken: !!tokenData.access_token, expiresIn: tokenData.expires_in });

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to fetch user info from Google');
    }

    const userInfo: GoogleUserInfo = await userInfoResponse.json();
    logStep("User info fetched", { userId: userInfo.id, email: userInfo.email });

    // Get current user from session (this would be passed via state parameter in real implementation)
    // For now, we'll find user by email
    const { data: user, error: userError } = await supabaseClient.auth.admin.listUsers();
    
    if (userError) {
      throw new Error('Failed to get user list');
    }

    const currentUser = user.users.find(u => u.email === userInfo.email);
    if (!currentUser) {
      throw new Error('User not found in system');
    }

    logStep("Current user found", { userId: currentUser.id });

    // Store/update calendar integration
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));
    
    const { error: upsertError } = await supabaseClient
      .from('calendar_integrations')
      .upsert({
        user_id: currentUser.id,
        provider: 'google',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt.toISOString(),
        calendar_id: userInfo.id,
        is_active: true,
      }, {
        onConflict: 'user_id,provider'
      });

    if (upsertError) {
      logStep("Failed to store integration", { error: upsertError });
      throw new Error('Failed to store calendar integration');
    }

    logStep("Calendar integration stored successfully");

    // Return success page
    return new Response(
      `<!DOCTYPE html>
       <html>
         <head>
           <title>Calendar Connected Successfully</title>
           <style>
             body { font-family: system-ui, sans-serif; max-width: 400px; margin: 100px auto; padding: 20px; text-align: center; }
             .success { color: #16a34a; font-size: 24px; margin-bottom: 16px; }
             .message { color: #64748b; margin-bottom: 20px; }
           </style>
           <script>
             if (window.opener) {
               window.opener.postMessage({
                 type: 'GOOGLE_CALENDAR_SUCCESS'
               }, '*');
               window.close();
             } else {
               setTimeout(() => {
                 window.location.href = '/calendar-settings?connected=true';
               }, 3000);
             }
           </script>
         </head>
         <body>
           <div class="success">✓ Google Calendar Connected!</div>
           <div class="message">
             Your Google Calendar has been successfully connected to Leadrift AI. 
             This window will close automatically.
           </div>
         </body>
       </html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in google-calendar-oauth", { message: errorMessage });
    
    return new Response(
      `<!DOCTYPE html>
       <html>
         <head>
           <title>Calendar Authorization Error</title>
           <script>
             if (window.opener) {
               window.opener.postMessage({
                 type: 'GOOGLE_CALENDAR_ERROR',
                 error: '${errorMessage}'
               }, '*');
               window.close();
             } else {
               window.location.href = '/calendar-settings?error=${encodeURIComponent(errorMessage)}';
             }
           </script>
         </head>
         <body>
           <p>Authorization failed: ${errorMessage}</p>
           <p>This window will close automatically.</p>
         </body>
       </html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
});