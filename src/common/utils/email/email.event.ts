import { EventEmitter } from 'node:events';
import { sendEmail } from './send.email.js';
import { verifyEmailTemplate } from './email.template.js';
export const emailEvent = new EventEmitter();
emailEvent.on('sendEmail', async (payload: { recipients: { to: string }; subject: string; data: { code: string } }) => {
  try { await sendEmail({ to: payload.recipients.to, subject: payload.subject, html: verifyEmailTemplate({ subject: payload.subject, title: payload.subject, code: payload.data.code }) }); }
  catch (error) { console.error('Email send failed:', error instanceof Error ? error.message : error); }
});
