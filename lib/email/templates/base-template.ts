/**
 * Base Email Template
 *
 * Reusable HTML email template with consistent styling, mobile-responsive design,
 * dark mode support, and unsubscribe footer.
 *
 * Design tokens match the Strummy dashboard warm guitar-studio aesthetic:
 * - Primary: gold #f59e0b
 * - Dark bg: #0f0c0a (warm brownish-black)
 * - Dark card: #171412
 * - Borders: #e8e0d8 (warm) / #2e2926 (dark)
 */

import { generateUnsubscribeToken } from '@/lib/notifications/unsubscribe-token';
import { logger } from '@/lib/logger';

export interface BaseEmailTemplateOptions {
  subject: string;
  preheader?: string;
  bodyContent: string;
  footerNote?: string;
  recipientEmail?: string;
  recipientUserId?: string;
  notificationType?: string;
  ctaButton?: {
    text: string;
    url: string;
  };
}

/**
 * Get the base URL for links in emails
 */
function getBaseUrl(): string {
  let baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL_REMOTE ||
    'http://localhost:3000';

  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }

  return baseUrl;
}

/**
 * Generate a signed unsubscribe link using HMAC token (prevents IDOR).
 * Falls back to the settings page if token generation fails or params are missing.
 */
function getUnsubscribeLink(recipientUserId?: string, notificationType?: string): string {
  const baseUrl = getBaseUrl();

  if (recipientUserId && notificationType) {
    try {
      const token = generateUnsubscribeToken(recipientUserId, notificationType);
      return `${baseUrl}/api/notifications/unsubscribe?token=${encodeURIComponent(token)}`;
    } catch (err) {
      logger.warn('[base-template] Could not generate signed unsubscribe token', {
        error: String(err),
      });
    }
  }

  // Fallback to settings page
  return `${baseUrl}/dashboard/settings`;
}

/**
 * Generate the complete email HTML using the base template
 */
export function generateBaseEmailHtml(options: BaseEmailTemplateOptions): string {
  const {
    subject,
    preheader,
    bodyContent,
    footerNote,
    recipientUserId,
    notificationType,
    ctaButton,
  } = options;

  const baseUrl = getBaseUrl();
  const unsubscribeLink = getUnsubscribeLink(recipientUserId, notificationType);
  const currentYear = new Date().getFullYear();

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="x-apple-disable-message-reformatting">
      <meta name="color-scheme" content="light dark">
      <meta name="supported-color-schemes" content="light dark">
      <title>${subject}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&display=swap" rel="stylesheet">
      <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
      <![endif]-->
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&display=swap');

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .email-container {
            background-color: #0f0c0a !important;
          }
          .email-content {
            background-color: #171412 !important;
            color: #f5f2ec !important;
          }
          .email-header {
            background-color: #0a0908 !important;
          }
          .email-footer {
            background-color: #131110 !important;
            border-color: #2e2926 !important;
          }
          .text-primary {
            color: #f5f2ec !important;
          }
          .text-secondary {
            color: #d6d0c8 !important;
          }
          .text-muted {
            color: #978e82 !important;
          }
          .card {
            background-color: #1e1a17 !important;
            border-color: #2e2926 !important;
          }
          .button-primary {
            background-color: #f59e0b !important;
            color: #0f0c0a !important;
          }
          .badge-success {
            background-color: #052e16 !important;
            color: #4ade80 !important;
          }
          .badge-warning {
            background-color: #422006 !important;
            color: #fbbf24 !important;
          }
          .badge-info {
            background-color: #422006 !important;
            color: #fbbf24 !important;
          }
          .badge-default {
            background-color: #292524 !important;
            color: #a8a29e !important;
          }
        }

        /* Mobile responsive */
        @media only screen and (max-width: 600px) {
          .email-container {
            width: 100% !important;
            margin: 0 !important;
          }
          .email-content {
            padding: 24px 16px !important;
          }
          .email-header {
            padding: 24px 16px !important;
          }
          h1 {
            font-size: 20px !important;
          }
          h2 {
            font-size: 18px !important;
          }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #faf8f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">

      <!-- Preheader text (hidden but shows in email preview) -->
      ${
        preheader
          ? `
      <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
        ${preheader}
      </div>
      `
          : ''
      }

      <!-- Email Container -->
      <div class="email-container" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(120, 80, 40, 0.08), 0 2px 4px -1px rgba(120, 80, 40, 0.04);">

        <!-- Gold accent bar -->
        <div style="height: 4px; background: linear-gradient(135deg, #f59e0b, #d97706);"></div>

        <!-- Header -->
        <div class="email-header" style="background-color: #0f0c0a; padding: 32px 24px; text-align: center;">
          <h1 style="color: #f59e0b; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">
            Strummy
          </h1>
          <p style="color: #a8a29e; margin: 8px 0 0 0; font-size: 14px; font-weight: 400;">
            Guitar Student Management
          </p>
        </div>

        <!-- Content -->
        <div class="email-content" style="padding: 32px 24px;">
          ${bodyContent}

          ${
            ctaButton
              ? `
          <!-- Call to Action Button -->
          <div style="margin-top: 32px; text-align: center;">
            <a href="${ctaButton.url}" class="button-primary" style="display: inline-block; padding: 14px 32px; background-color: #f59e0b; color: #0f0c0a; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 1px 3px 0 rgba(120, 80, 40, 0.15);">
              ${ctaButton.text}
            </a>
          </div>
          `
              : ''
          }
        </div>

        <!-- Footer -->
        <div class="email-footer" style="background-color: #f5f0eb; padding: 24px; text-align: center; border-top: 1px solid #e8e0d8;">
          ${
            footerNote
              ? `
          <p style="margin: 0 0 16px 0; font-size: 14px; color: #78716c; font-weight: 500;">
            ${footerNote}
          </p>
          `
              : ''
          }

          <p style="margin: 0 0 12px 0; font-size: 14px; color: #78716c;">
            <a href="${baseUrl}/dashboard" style="color: #b45309; text-decoration: none; font-weight: 500;">
              View Dashboard
            </a>
            <span style="color: #d6cfc6; margin: 0 8px;">•</span>
            <a href="${unsubscribeLink}" style="color: #78716c; text-decoration: none;">
              Notification Settings
            </a>
          </p>

          <p style="margin: 0 0 8px 0; font-size: 12px; color: #a8a29e;">
            You're receiving this email because you have an account with Strummy Guitar CRM.
          </p>

          <p style="margin: 0; font-size: 12px; color: #a8a29e;">
            &copy; ${currentYear} Strummy. All rights reserved.
          </p>
        </div>
      </div>

      <!-- Spacer for email clients -->
      <div style="height: 40px;"></div>
    </body>
    </html>
  `;
}

/**
 * Helper function to create a card section (commonly used in emails)
 */
export function createCardSection(content: string): string {
  return `
    <div class="card" style="margin-bottom: 24px; background-color: #faf5f0; border-radius: 10px; border: 1px solid #e8e0d8; overflow: hidden; padding: 20px;">
      ${content}
    </div>
  `;
}

/**
 * Helper function to create a detail row (label + value)
 */
export function createDetailRow(label: string, value: string): string {
  return `
    <div style="margin-bottom: 16px;">
      <p style="margin: 0 0 4px 0; font-size: 12px; color: #78716c; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">
        ${label}
      </p>
      <p style="margin: 0; color: #1c1917; font-size: 16px; font-weight: 500;">
        ${value}
      </p>
    </div>
  `;
}

/**
 * Helper function to create a status badge (translucent style matching dashboard)
 */
export function createStatusBadge(
  text: string,
  color: 'success' | 'warning' | 'info' | 'default' = 'default'
): string {
  const colorMap = {
    success: { bg: '#dcfce7', text: '#15803d' },
    warning: { bg: '#fef3c7', text: '#b45309' },
    info: { bg: '#fef3c7', text: '#b45309' },
    default: { bg: '#f5f0eb', text: '#78716c' },
  };

  const colors = colorMap[color] || colorMap.default;

  return `
    <span class="badge-${color}" style="display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; background-color: ${colors.bg}; color: ${colors.text}; white-space: nowrap;">
      ${text}
    </span>
  `;
}

/**
 * Helper function to create a divider
 */
export function createDivider(): string {
  return `
    <hr style="border: none; border-top: 1px solid #e8e0d8; margin: 24px 0;">
  `;
}

/**
 * Helper function to format greeting with recipient name
 */
export function createGreeting(name: string): string {
  return `
    <p style="color: #57534e; margin: 0 0 24px 0; line-height: 1.6; font-size: 16px;">
      Hi ${name},
    </p>
  `;
}

/**
 * Helper function to create a section heading
 */
export function createSectionHeading(heading: string): string {
  return `
    <h2 class="text-primary" style="color: #1c1917; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">
      ${heading}
    </h2>
  `;
}

/**
 * Helper function to create a subsection heading
 */
export function createSubsectionHeading(heading: string): string {
  return `
    <h3 class="text-primary" style="color: #1c1917; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">
      ${heading}
    </h3>
  `;
}

/**
 * Helper function to create body text paragraph
 */
export function createParagraph(text: string): string {
  return `
    <p class="text-secondary" style="color: #57534e; margin: 0 0 16px 0; line-height: 1.6; font-size: 15px;">
      ${text}
    </p>
  `;
}
