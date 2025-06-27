"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';


export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(searchParams.get('error') || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setError(t('invalid_credentials'));
    } else if (result?.ok) {
      router.push('/admin/dashboard');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-brand-dark">
      <form onSubmit={handleSubmit} className="p-8 rounded-lg shadow-lg bg-brand-secondary w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center text-white">{t('admin_login')}</h1>
        {error && <p className="bg-red-500/20 text-red-400 p-3 rounded mb-4 text-sm">{error}</p>}
        <div className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('email')}
            required
            className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('password')}
            required
            className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
          />
        </div>
        <button type="submit" className="w-full mt-6 bg-brand-purple text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity">
          {t('sign_in')}
        </button>
      </form>
    </div>
  );
}