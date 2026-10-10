import { Resend } from "resend";
import { findUserById } from "../models/User.js";
import { findCampaignById } from "../models/Campaign.js";
import { SIGNING_SECRET } from "../config/secret.js";
import { createUnsubscribeToken } from "../utils/unsubscribeToken.js";
import { escapeHtml } from "../utils/escapeHtml.js";

const API_KEY = process.env.EMAIL_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || "TrustBridge <onboarding@resend.dev>";
const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173").split(",")[0].trim().replace(/\/+$/, "");
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000";

let resend = null;
if (API_KEY) {
  resend = new Resend(API_KEY);
}

function formatMoney(amount) {
  return Number(amount || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

function baseLayout({ title, bodyHtml, unsubscribeUrl }) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <tr>
            <td style="background:linear-gradient(135deg,#0ea5e9,#6366f1);padding:32px 40px;">
              <div style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:0.5px;">TrustBridge</div>
              <div style="font-size:12px;color:#e0e7ff;margin-top:2px;">Humanitarian Aid Platform</div>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;background-color:#fafbfc;border-top:1px solid #eef2f5;text-align:center;">
              <div style="font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} TrustBridge. All rights reserved.</div>
              <div style="font-size:12px;color:#94a3b8;margin-top:6px;">You received this email because you're a TrustBridge user with preferences for email notifications.</div>
              <div style="margin-top:14px;">
                <a href="${unsubscribeUrl}" style="font-size:12px;color:#0ea5e9;text-decoration:underline;">Unsubscribe from email notifications</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function isEmailEnabled() {
  return Boolean(API_KEY && resend);
}

/**
 * Send an email to a user. Respects the user's emailNotifications opt-out.
 * Returns { sent: boolean, reason?: string }
 */
export async function sendUserEmail({ userId, subject, html }) {
  if (!isEmailEnabled()) {
    console.warn("[email] EMAIL_API_KEY not configured; skipping email");
    return { sent: false, reason: "email_not_configured" };
  }
  const user = await findUserById(userId);
  if (!user) {
    return { sent: false, reason: "user_not_found" };
  }
  if (user.emailNotifications === 0) {
    return { sent: false, reason: "opted_out" };
  }
  const unsubscribeUrl = `${API_BASE_URL}/api/auth/unsubscribe?user=${user.id}&token=${createUnsubscribeToken(SIGNING_SECRET, user.id)}`;
  const htmlWithUnsubscribe = baseLayout({
    title: subject,
    bodyHtml: html,
    unsubscribeUrl,
  });
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [user.email],
      subject,
      html: htmlWithUnsubscribe,
    });
    if (error) {
      console.error("[email] Resend error:", error);
      return { sent: false, reason: "resend_error" };
    }
    console.log(`[email] Sent "${subject}" to ${user.email} (id: ${data?.id})`);
    return { sent: true, id: data?.id };
  } catch (err) {
    console.error("[email] Failed to send email:", err.message);
    return { sent: false, reason: "send_failed" };
  }
}

export async function sendDonationConfirmation({ donorId, campaignId, amount, hash }) {
  const campaign = findCampaignById(campaignId);
  if (!campaign) return { sent: false, reason: "campaign_not_found" };
  const donor = await findUserById(donorId);
  if (!donor) return { sent: false, reason: "donor_not_found" };
  const donorName = `${donor.firstName || ""} ${donor.lastName || ""}`.trim() || "there";
  const subject = `Your donation to ${campaign.title} is confirmed`;
  const html = donationConfirmationHtml({
    donorName: escapeHtml(donorName),
    campaignTitle: escapeHtml(campaign.title),
    amount,
    hash,
    campaignUrl: `${FRONTEND_URL}/campaigns/${campaign.id}`,
  });
  return sendUserEmail({ userId: donorId, subject, html });
}

export async function sendFundingMilestone({ creatorId, campaignId }) {
  const campaign = findCampaignById(campaignId);
  if (!campaign) return { sent: false, reason: "campaign_not_found" };
  const creator = await findUserById(creatorId);
  if (!creator) return { sent: false, reason: "creator_not_found" };
  const creatorName = `${creator.firstName || ""} ${creator.lastName || ""}`.trim() || "there";
  const subject = `🎉 ${campaign.title} reached its funding goal!`;
  const html = fundingMilestoneHtml({
    creatorName: escapeHtml(creatorName),
    campaignTitle: escapeHtml(campaign.title),
    goal: campaign.goal,
    raised: campaign.raised,
    campaignUrl: `${FRONTEND_URL}/campaigns/${campaign.id}`,
  });
  return sendUserEmail({ userId: creatorId, subject, html });
}

function donationConfirmationHtml({ donorName, campaignTitle, amount, hash, campaignUrl }) {
  return `<h1 style="font-size:22px;color:#0f172a;margin:0 0 8px;">Donation confirmed 🎉</h1>
<p style="font-size:15px;color:#475569;line-height:1.6;margin:0 0 24px;">Hi ${donorName}, thank you for your generosity. Your donation to <strong>${campaignTitle}</strong> has been confirmed on the Stellar network.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:24px;">
  <tr>
    <td style="padding:16px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:13px;color:#94a3b8;padding-bottom:6px;">Amount Donated</td>
          <td align="right" style="font-size:18px;font-weight:700;color:#0f172a;padding-bottom:6px;">${formatMoney(amount)}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#94a3b8;padding-bottom:6px;">Campaign</td>
          <td align="right" style="font-size:14px;color:#0f172a;padding-bottom:6px;">${campaignTitle}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#94a3b8;">Transaction Hash</td>
          <td align="right" style="font-size:12px;color:#64748b;font-family:monospace;word-break:break-all;">${hash}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>
<a href="${campaignUrl}" style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#6366f1);color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:10px;">View Campaign</a>`;
}

function fundingMilestoneHtml({ creatorName, campaignTitle, goal, raised, campaignUrl }) {
  const percent = Math.min(100, Math.round(((raised || 0) / goal) * 100));
  return `<h1 style="font-size:22px;color:#0f172a;margin:0 0 8px;">🎉 Your campaign reached its funding goal!</h1>
<p style="font-size:15px;color:#475569;line-height:1.6;margin:0 0 24px;">Hi ${creatorName}, congratulations! Your campaign <strong>${campaignTitle}</strong> has been fully funded.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:24px;">
  <tr>
    <td style="padding:16px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:13px;color:#94a3b8;padding-bottom:6px;">Funding Goal</td>
          <td align="right" style="font-size:16px;font-weight:700;color:#0f172a;padding-bottom:6px;">${formatMoney(goal)}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#94a3b8;padding-bottom:6px;">Total Raised</td>
          <td align="right" style="font-size:16px;font-weight:700;color:#059669;padding-bottom:6px;">${formatMoney(raised)}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#94a3b8;">Progress</td>
          <td align="right" style="font-size:14px;color:#0f172a;">${percent}%</td>
        </tr>
      </table>
    </td>
  </tr>
</table>
<a href="${campaignUrl}" style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#6366f1);color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:10px;">View Campaign</a>`;
}