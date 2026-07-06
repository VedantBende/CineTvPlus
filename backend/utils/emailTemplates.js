const APP_URL = process.env.FRONTEND_URL || 'https://cinetvplus.vercel.app';

/**
 * Returns the email subject and HTML body for a given status change.
 * @param {'approved'|'rejected'|'revoked'} status
 * @param {string} userName
 * @returns {{ subject: string, html: string }}
 */
export function getStatusEmailContent(status, userName, user = null) {
  const name = userName || 'User';

const DURATION_LABELS = {
  '12h': '12 Hours',
  '24h': '24 Hours',
  '3d': '3 Days',
  '7d': '7 Days',
  '15d': '15 Days',
  '30d': '30 Days',
  '3m': '3 Months',
  '6m': '6 Months',
  '1y': '1 Year',
  'permanent': 'Permanent'
};

  let accessDetailsHtml = '';
  if (user && status === 'approved') {
    if (user.isPermanent || !user.expiresAt) {
      accessDetailsHtml = `
        <div style="background:#222;padding:16px;border-radius:8px;margin:20px 0;">
          <p style="margin:0 0 8px;font-size:15px;color:#ccc;"><strong>Access Duration:</strong> Permanent</p>
          <p style="margin:0;font-size:15px;color:#ccc;"><strong>Access Expiry:</strong> Never</p>
        </div>
      `;
    } else {
      const dateObj = new Date(user.expiresAt);
      const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      const formattedDate = formatter.format(dateObj).replace(',', ' at').replace(/\//g, '-');
      
      const rawDuration = user.accessDuration || 'temporary';
      const durationText = DURATION_LABELS[rawDuration] || rawDuration;
      accessDetailsHtml = `
        <div style="background:#222;padding:16px;border-radius:8px;margin:20px 0;">
          <p style="margin:0 0 8px;font-size:15px;color:#ccc;"><strong>Access Duration:</strong> ${durationText}</p>
          <p style="margin:0 0 12px;font-size:15px;color:#ccc;"><strong>Access Ends:</strong> ${formattedDate}</p>
          <p style="margin:0;font-size:13px;color:#f87171;">After this date & time, your account access will automatically be revoked.</p>
        </div>
      `;
    }
  }

  const templates = {
    approved: {
      subject: 'Your CineTv+ Access Has Been Approved 🎉',
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#141414;border-radius:12px;overflow:hidden;color:#fff;">
          <div style="background:linear-gradient(135deg,#e50914,#b20710);padding:32px 24px;text-align:center;">
            <h1 style="margin:0;font-size:28px;letter-spacing:1px;">CineTv+</h1>
          </div>
          <div style="padding:32px 24px;">
            <h2 style="margin:0 0 16px;color:#e50914;">Welcome, ${name}!</h2>
            <p style="font-size:16px;line-height:1.6;color:#ccc;">
              Great news! Your CineTv+ access request has been <strong style="color:#4ade80;">approved</strong>. 
              You now have full access to our premium streaming content.
            </p>
            ${accessDetailsHtml}
            <div style="text-align:center;margin:28px 0;">
              <a href="${APP_URL}" style="background:#e50914;color:#fff;text-decoration:none;padding:14px 36px;border-radius:6px;font-weight:bold;font-size:16px;display:inline-block;">
                Start Watching Now
              </a>
            </div>
            <p style="font-size:13px;color:#888;text-align:center;">Enjoy your streaming experience!</p>
          </div>
        </div>
      `,
    },

    rejected: {
      subject: 'Your CineTv+ Access Request Update',
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#141414;border-radius:12px;overflow:hidden;color:#fff;">
          <div style="background:linear-gradient(135deg,#e50914,#b20710);padding:32px 24px;text-align:center;">
            <h1 style="margin:0;font-size:28px;letter-spacing:1px;">CineTv+</h1>
          </div>
          <div style="padding:32px 24px;">
            <h2 style="margin:0 0 16px;color:#f59e0b;">Hello, ${name}</h2>
            <p style="font-size:16px;line-height:1.6;color:#ccc;">
              Thank you for your interest in CineTv+. Unfortunately, your access request has <strong style="color:#f87171;">not been approved</strong> at this time.
            </p>
            <p style="font-size:16px;line-height:1.6;color:#ccc;">
              If you believe this is a mistake, please contact our support team for assistance.
            </p>
            <p style="font-size:13px;color:#888;text-align:center;margin-top:28px;">We appreciate your understanding.</p>
          </div>
        </div>
      `,
    },

    revoked: {
      subject: 'Your CineTv+ Access Has Been Revoked',
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#141414;border-radius:12px;overflow:hidden;color:#fff;">
          <div style="background:linear-gradient(135deg,#e50914,#b20710);padding:32px 24px;text-align:center;">
            <h1 style="margin:0;font-size:28px;letter-spacing:1px;">CineTv+</h1>
          </div>
          <div style="padding:32px 24px;">
            <h2 style="margin:0 0 16px;color:#f87171;">Hello, ${name}</h2>
            <p style="font-size:16px;line-height:1.6;color:#ccc;">
              ${
                user && user.revokedReason === 'auto-expired' 
                  ? `We're writing to inform you that your <strong>${user.accessDuration ? DURATION_LABELS[user.accessDuration] || user.accessDuration : 'temporary'}</strong> access to CineTv+ has <strong style="color:#f87171;">ended.</strong>` 
                  : `We're writing to inform you that your access to CineTv+ has been <strong style="color:#f87171;">revoked</strong>.`
              }
            </p>
            <p style="font-size:16px;line-height:1.6;color:#ccc;">
              If you have any questions, please reach out to our support team.
            </p>
            <p style="font-size:13px;color:#888;text-align:center;margin-top:28px;">Thank you for being part of CineTv+.</p>
          </div>
        </div>
      `,
    },
  };

  return templates[status] || null;
}
