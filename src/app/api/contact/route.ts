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
  // --- THIS IS THE FIX ---
  // Updated to use environment variables with the NEXT_PUBLIC_ prefix
  const {
    NEXT_PUBLIC_SMTP_HOST,
    NEXT_PUBLIC_SMTP_PORT,
    NEXT_PUBLIC_SMTP_USER,
    NEXT_PUBLIC_SMTP_PASS,
    NEXT_PUBLIC_CONTACT_FORM_RECIPIENT,
  } = process.env;

  if (
    !NEXT_PUBLIC_SMTP_HOST ||
    !NEXT_PUBLIC_SMTP_PORT ||
    !NEXT_PUBLIC_SMTP_USER ||
    !NEXT_PUBLIC_SMTP_PASS ||
    !NEXT_PUBLIC_CONTACT_FORM_RECIPIENT
  ) {
    console.error("Missing required NEXT_PUBLIC_ SMTP environment variables.");
    return NextResponse.json(
      { error: "Server configuration error. Please contact support." },
      { status: 500 }
    );
  }
  // --- END OF FIX ---

  try {
    const { name, email, subject, message }: ContactFormData =
      await request.json();

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

    const transporter = nodemailer.createTransport({
      host: NEXT_PUBLIC_SMTP_HOST,
      port: Number(NEXT_PUBLIC_SMTP_PORT),
      secure: Number(NEXT_PUBLIC_SMTP_PORT) === 465,
      auth: {
        user: NEXT_PUBLIC_SMTP_USER,
        pass: NEXT_PUBLIC_SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"${name}" <${NEXT_PUBLIC_SMTP_USER}>`,
      to: NEXT_PUBLIC_CONTACT_FORM_RECIPIENT,
      replyTo: email,
      subject: `New FanSkor Contact Form Submission: ${subject}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6;">
          <h2 style="color: #333;">New Contact Form Submission</h2>
          <p>You have received a new message from your website's contact form.</p>
          <hr style="border: none; border-top: 1px solid #eee;" />
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Subject:</strong> ${subject}</p>
          <h3 style="color: #333;">Message:</h3>
          <div style="background-color: #f9f9f9; border: 1px solid #ddd; padding: 15px; border-radius: 5px;">
            <p style="white-space: pre-wrap; margin: 0;">${message}</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: "Your message has been sent successfully!" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(
      "[Contact API] Error processing contact form submission:",
      error
    );
    return NextResponse.json(
      { error: "An unexpected error occurred while sending your message." },
      { status: 500 }
    );
  }
}
