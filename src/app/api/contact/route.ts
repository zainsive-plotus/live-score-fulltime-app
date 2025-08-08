// src/app/api/contact/route.ts
import { NextResponse } from "next/server";

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function POST(request: Request) {
  try {
    const { name, email, subject, message }: ContactFormData =
      await request.json();

    // Basic validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }
    if (!email.includes("@") || !email.includes(".")) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // console.log("[Contact API] New contact form submission:");
    // console.log(`- Name: ${name}`);
    // console.log(`- Email: ${email}`);
    // console.log(`- Subject: ${subject}`);
    // console.log(`- Message: ${message}`);

    // --- Placeholder for actual email sending logic ---
    // In a real application, you would integrate with an email sending service here, e.g.:
    // - Nodemailer (for SMTP)
    // - SendGrid, Mailgun, Resend, AWS SES (for transactional emails)
    // - Saving to a database for CRM integration
    // Example:
    /*
    const sendEmailResult = await sendEmailService.send({
      to: 'your-support-email@fanskor.com',
      from: 'noreply@fanskor.com',
      subject: `Fanskor Contact Form: ${subject}`,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });
    if (!sendEmailResult.success) {
        console.error('[Contact API] Failed to send email:', sendEmailResult.error);
        return NextResponse.json({ error: 'Failed to send message. Please try again later.' }, { status: 500 });
    }
    */
    // --- End Placeholder ---

    return NextResponse.json(
      { message: "Your message has been sent successfully!" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(
      "[Contact API] Error processing contact form submission:",
      error.message
    );
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
