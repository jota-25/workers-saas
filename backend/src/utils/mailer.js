/*import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendEmail = async ({ to, subject, html }) => {

  // NO enviar emails en tests
  if (process.env.NODE_ENV === "test") {
    return;
  }

  return transporter.sendMail({
    from: `"Workers SaaS" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
};*/

// lo de arriba es para enviar emails con gmail que al usar vercel en producción no es recomendable, lo que se hace es usar un servicio de email como sendgrid, mailgun, etc. y configurar el transporter con sus datos usaremos render para enviar emails

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({ to, subject, html }) => {

  // No enviar emails en tests
  if (process.env.NODE_ENV === "test") {
    return;
  }

  await resend.emails.send({
    from: process.env.RESEND_FROM,
    to,
    subject,
    html
  });
};