// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { attachment_id } = await req.json()

    if (!attachment_id) {
      return new Response(JSON.stringify({ error: 'Missing attachment_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Initialize regular client with user's JWT to verify RLS
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // 1. Authenticate user & Verify RLS access using user client
    // We call the existing secure RPC 'get_announcement_attachment_url' which validates target scopes/admin roles
    const { data: attachmentMeta, error: rpcError } = await userClient.rpc('get_announcement_attachment_url', {
      p_attachment_id: attachment_id
    })

    if (rpcError || !attachmentMeta || !attachmentMeta.storage_path) {
      return new Response(JSON.stringify({ error: 'Unauthorized or attachment not found' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Since RLS verified access, use Service Role to generate the short-lived signed URL for the private bucket
    const adminClient = createClient(supabaseUrl, supabaseServiceRole)

    const { data: signedUrlData, error: signError } = await adminClient.storage
      .from('announcement-assets')
      .createSignedUrl(attachmentMeta.storage_path, 900) // 15 minutes (900 seconds)

    if (signError || !signedUrlData?.signedUrl) {
      throw signError || new Error('Failed to generate signed URL')
    }

    return new Response(
      JSON.stringify({
        signed_url: signedUrlData.signedUrl,
        expires_in: 900,
        file_name: attachmentMeta.file_name,
        mime_type: attachmentMeta.mime_type
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
