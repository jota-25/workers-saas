import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
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
};