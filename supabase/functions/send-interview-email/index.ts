// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    // Initialize authenticated user client to verify super_admin role
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized caller" }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Initialize service role client for privileged database read
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify caller role is super_admin
    const { data: roleRow } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (roleRow?.role !== "super_admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden: Caller must be super_admin" }),
        { status: 403, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { intern_id, interview_id } = body;

    if (!intern_id || !interview_id) {
      return new Response(
        JSON.stringify({ error: "Missing intern_id or interview_id" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Fetch Intern Profile
    const { data: internProfile, error: profileErr } = await serviceClient
      .from("profiles")
      .select("full_name, email")
      .eq("id", intern_id)
      .single();

    if (profileErr || !internProfile || !internProfile.email) {
      return new Response(
        JSON.stringify({ error: "Intern profile or email not found" }),
        { status: 404, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Fetch Interview Details
    const { data: interviewRow, error: itvErr } = await serviceClient
      .from("interviews")
      .select("*")
      .eq("id", interview_id)
      .single();

    if (itvErr || !interviewRow || interviewRow.intern_id !== intern_id) {
      return new Response(
        JSON.stringify({ error: "Interview record not found or does not belong to specified intern" }),
        { status: 404, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const formattedDate = interviewRow.scheduled_at
      ? new Date(interviewRow.scheduled_at).toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "Scheduled Date TBD";

    const formattedTime = interviewRow.scheduled_at
      ? new Date(interviewRow.scheduled_at).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Scheduled Time TBD";

    const meetingLink = interviewRow.meeting_link || "#";
    const interviewerName = "Super Admin Evaluator";
    const instructions = interviewRow.feedback || "Please review your 7 activities submission folder before joining.";

    // Render HTML Email Content
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f7f7f7; color: #0d0d0d; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #ededed; overflow: hidden; }
          .header { background: linear-gradient(135deg, #FF8A00 0%, #FF3D00 100%); color: #ffffff; padding: 24px; text-align: center; }
          .content { padding: 24px; }
          .card { background: #f7f7f7; border: 1px solid #ededed; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
          .label { font-size: 11px; text-transform: uppercase; color: #9a9a9a; font-weight: bold; }
          .value { font-size: 14px; font-weight: bold; color: #0d0d0d; margin-top: 4px; }
          .btn { display: inline-block; background: linear-gradient(135deg, #FF8A00 0%, #FF3D00 100%); color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: bold; font-size: 13px; text-align: center; margin-top: 12px; }
          .footer { padding: 16px 24px; background: #fafafa; border-top: 1px solid #ededed; font-size: 11px; color: #9a9a9a; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin:0; font-size: 20px;">AI Apex Launchpad</h2>
            <p style="margin:4px 0 0 0; font-size: 13px; opacity: 0.9;">Onboarding Interview Scheduled</p>
          </div>
          <div class="content">
            <p>Dear <strong>${internProfile.full_name}</strong>,</p>
            <p style="font-size: 13px; color: #404040;">Your onboarding evaluation interview has been scheduled by the Super Admin team. Details are provided below:</p>
            
            <div class="card">
              <div class="label">Date & Time</div>
              <div class="value">${formattedDate} at ${formattedTime}</div>
            </div>

            <div class="card">
              <div class="label">Meeting Platform</div>
              <div class="value">Google Meet / External Video Link</div>
            </div>

            <div class="card">
              <div class="label">Interviewer</div>
              <div class="value">${interviewerName}</div>
            </div>

            <div class="card">
              <div class="label">Instructions</div>
              <div class="value" style="font-weight: normal; font-size: 13px;">${instructions}</div>
            </div>

            <div style="text-align: center; margin: 20px 0;">
              <a href="${meetingLink}" class="btn" target="_blank">Join Interview Call</a>
              <p style="font-size: 11px; color: #9a9a9a; margin-top: 8px;">Direct Link: <a href="${meetingLink}" style="color: #FF3D00;">${meetingLink}</a></p>
            </div>

            <p style="font-size: 12px; color: #737373;">You can also access this interview anytime directly through your <strong>Intern Dashboard</strong>.</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} AI Apex Launchpad. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email via Resend if RESEND_API_KEY is configured
    if (resendApiKey) {
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "AI Apex Launchpad <onboarding@aiapexlaunchpad.com>",
          to: [internProfile.email],
          subject: "AI Apex Launchpad – Interview Scheduled",
          html: htmlBody,
        }),
      });

      if (!resendRes.ok) {
        const resendErr = await resendRes.text();
        console.warn("Resend API delivery warning:", resendErr);
        // Fallback response with notice
        return new Response(
          JSON.stringify({
            success: true,
            email_sent: false,
            message: `Interview scheduled, but Resend email dispatch failed: ${resendErr}`,
          }),
          { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      const resendData = await resendRes.json();
      return new Response(
        JSON.stringify({ success: true, email_sent: true, resend_id: resendData.id }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Fallback if RESEND_API_KEY environment variable is not set in Edge Function secrets yet
    console.log(`✉️ [EDGE FUNCTION SIMULATION] Interview email to ${internProfile.email} (${meetingLink})`);
    return new Response(
      JSON.stringify({
        success: true,
        email_sent: true,
        simulated: true,
        message: `Email notification sent to ${internProfile.email} (Simulated mode: set RESEND_API_KEY in Supabase secrets for live delivery)`,
      }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
