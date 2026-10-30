export function verifyEmailTemplate({ subject, title, code }: { subject: string; title: string; code: string }): string {
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#222"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(subject)}</p><p style="font-size:28px;font-weight:bold;letter-spacing:8px">${escapeHtml(code)}</p><p>This code expires in 2 minutes.</p></body></html>`;
}
function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char); }
