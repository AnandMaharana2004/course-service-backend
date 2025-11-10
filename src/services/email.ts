export type EmailType =
  | 'otp'
  | 'login'
  | 'marketing'
  | 'passwordReset'
  | 'setNewPasswordLink'
  | 'custom';

interface EmailOptions {
  sendTo: string;
  type: EmailType;
  subject?: string;
  message?: string;
  otp?: string | number; // ✅ user-provided OTP
  url?: string;
}

export const sendEmail = async ({
  sendTo,
  type,
  subject,
  message,
  otp,
  url,
}: EmailOptions) => {
  try {
    // 📩 Define email templates using object mapping
    const templates: Record<
      EmailType,
      () => { subject: string; body: string }
    > = {
      otp: () => ({
        subject: 'Your OTP Code',
        body: `Your One-Time Password (OTP) is: ${otp ?? 'N/A'}`,
      }),
      login: () => ({
        subject: 'New Login Detected',
        body: `A new login was detected on your account. If this wasn't you, please secure your account immediately.`,
      }),
      marketing: () => ({
        subject: subject || 'Exciting News from SnapHob!',
        body: message || 'Check out our latest updates and offers!',
      }),
      passwordReset: () => ({
        subject: 'Password Reset Request',
        body: 'We received a request to reset your password. Please click the link below to continue.',
      }),
      setNewPasswordLink: () => ({
        subject: 'Set Your New Password',
        body: url
          ? `Hello 👋,\n\nClick the link below to set your new password:\n\n${url}\n\nIf you didn't request this, please ignore this message.`
          : 'A password setup link was generated, but no URL was provided.',
      }),
      custom: () => {
        if (!subject || !message) {
          throw new Error('Custom emails require both subject and message.');
        }
        return { subject, body: message };
      },
    };

    // 🧩 Select template handler
    const selectedTemplate = templates[type];
    if (!selectedTemplate) throw new Error('Invalid email type provided.');

    const { subject: emailSubject, body: emailBody } = selectedTemplate();

    // 📨 Simulated email sending (you can replace with Nodemailer later)
    console.log(`
      To: ${sendTo}
      Subject: ${emailSubject}
      Message: ${emailBody}
    `);

    return {
      message: `Email sent successfully to ${sendTo}`,
      status: true,
      ...(otp && { otp }), // include user-provided OTP if available
    };
  } catch (error) {
    console.error('Something went wrong while sending email:', error);
    return { message: 'Failed to send email', status: false };
  }
};
