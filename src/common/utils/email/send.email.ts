import nodemailer from 'nodemailer';
import { APP_EMAIL, APP_PASSWORD } from '../../../config.js';
export interface IEmailOptions { to: string | string[]; cc?: string | string[]; bcc?: string | string[]; subject: string; text?: string; html?: string; }
export async function sendEmail(options: IEmailOptions): Promise<void> {
  if (!APP_EMAIL || !APP_PASSWORD) throw new Error('Configure APP_EMAIL and APP_PASSWORD in .env.development before sending email');
  const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: APP_EMAIL, pass: APP_PASSWORD } });
  await transporter.sendMail({ from: APP_EMAIL, ...options });
}
