"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { Loader2, CheckCircle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation"; // <-- Import hook

const ContactFormClient: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const { t } = useTranslation(); // <-- Use hook

  const contactMutation = useMutation({
    mutationFn: (formData: {
      name: string;
      email: string;
      subject: string;
      message: string;
    }) => axios.post("/api/contact", formData),
    onSuccess: () => {
      toast.success(t("contact_form_success_message"));
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || t("contact_form_error_message"));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    contactMutation.mutate({ name, email, subject, message });
  };

  return (
    <div className="bg-brand-secondary p-8 rounded-lg shadow-xl">
      <h2 className="text-3xl font-bold text-white mb-6">
        {t("contact_us_form_title")}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-brand-light mb-1"
          >
            {t("your_name_label")}
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
            required
            disabled={contactMutation.isPending}
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-brand-light mb-1"
          >
            {t("your_email_label")}
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
            required
            disabled={contactMutation.isPending}
          />
        </div>
        <div>
          <label
            htmlFor="subject"
            className="block text-sm font-medium text-brand-light mb-1"
          >
            {t("subject_label")}
          </label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
            required
            disabled={contactMutation.isPending}
          />
        </div>
        <div>
          <label
            htmlFor="message"
            className="block text-sm font-medium text-brand-light mb-1"
          >
            {t("your_message_label")}
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple resize-y"
            required
            disabled={contactMutation.isPending}
          ></textarea>
        </div>
        <button
          type="submit"
          className="w-full bg-[#ea5a1e] text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={contactMutation.isPending}
        >
          {contactMutation.isPending ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <CheckCircle size={20} />
          )}
          {contactMutation.isPending
            ? t("sending_button_text")
            : t("send_message_button_text")}
        </button>
      </form>
    </div>
  );
};

export default ContactFormClient;
