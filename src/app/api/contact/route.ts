// ===== src/app/api/contact/route.ts =====

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function POST(request: Request) {
  const {
    NEXT_PUBLIC_SMTP_HOST,
    NEXT_PUBLIC_SMTP_PORT,
    NEXT_PUBLIC_SMTP_USER,
    NEXT_PUBLIC_SMTP_PASS,
    NEXT_PUBLIC_CONTACT_FORM_RECIPIENT,
  } = process.env;

  // Initial Check (remains the same)
  if (
    !NEXT_PUBLIC_SMTP_HOST ||
    !NEXT_PUBLIC_SMTP_PORT ||
    !NEXT_PUBLIC_SMTP_USER ||
    !NEXT_PUBLIC_SMTP_PASS ||
    !NEXT_PUBLIC_CONTACT_FORM_RECIPIENT
  ) {
    console.error("CRITICAL: Missing required SMTP environment variables.");
    return NextResponse.json(
      { error: "Server configuration error." },
      { status: 500 }
    );
  }

  try {
    const { name, email, subject, message }: ContactFormData =
      await request.json();

    // Server-Side Validation (remains the same)
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // --- THIS IS THE ROBUST FIX ---
    // 1. Create a more secure and compatible transporter configuration.
    const transporter = nodemailer.createTransport({
      host: NEXT_PUBLIC_SMTP_HOST,
      port: Number(NEXT_PUBLIC_SMTP_PORT),
      secure: true, // Explicitly true for port 465 with SSL/TLS
      auth: {
        user: NEXT_PUBLIC_SMTP_USER,
        pass: NEXT_PUBLIC_SMTP_PASS,
      },
      // Stricter TLS options for modern security compliance
      tls: {
        ciphers: "SSLv3",
        rejectUnauthorized: true,
      },
    });

    // 2. Define more robust mail options.
    const mailOptions = {
      // The "from" field should ideally be a static, trusted address.
      // We use the user's name but our own email to improve deliverability.
      from: `"${name} via Fanskor" <${NEXT_PUBLIC_SMTP_USER}>`,
      to: NEXT_PUBLIC_CONTACT_FORM_RECIPIENT,
      replyTo: email, // This ensures hitting "Reply" goes to the user.
      subject: `New Fanskor Contact: ${subject}`,
      text: `
        New Contact Form Submission
        -----------------------------
        Name: ${name}
        Email: ${email}
        Subject: ${subject}
        -----------------------------
        Message:
        ${message}
      `,
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
          <h2 style="color: #1a1a1a;">New Contact Form Submission</h2>
          <p style="margin-bottom: 20px;">You have a new message from the Fanskor website.</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 8px; width: 100px;"><strong>Name:</strong></td>
              <td style="padding: 8px;">${name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 8px;"><strong>Email:</strong></td>
              <td style="padding: 8px;"><a href="mailto:${email}">${email}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 8px;"><strong>Subject:</strong></td>
              <td style="padding: 8px;">${subject}</td>
            </tr>
          </table>
          <h3 style="color: #1a1a1a; margin-top: 20px;">Message:</h3>
          <div style="background-color: #f5f5f5; border: 1px solid #ddd; padding: 15px; border-radius: 5px; white-space: pre-wrap; line-height: 1.5;">${message}</div>
        </div>
      `,
    };

    // 3. Send the email and provide detailed success/error feedback.
    console.log("Attempting to send email with Nodemailer...");
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully! Message ID:", info.messageId);
    // --- END OF FIX ---

    return NextResponse.json(
      { message: "Your message has been sent successfully!" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(
      "[Contact API] A detailed error occurred during email sending:",
      error
    );
    // Provide a more specific error message if available
    const errorMessage =
      error.response || error.message || "An unknown error occurred.";
    return NextResponse.json(
      { error: `Failed to send email. Server responded with: ${errorMessage}` },
      { status: 500 }
    );
  }
}
