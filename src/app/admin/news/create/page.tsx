// src/app/admin/news/create/page.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from '@/components/StyledLink'; 
import Image from 'next/image';
import { UploadCloud, XCircle } from 'lucide-react';

import RichTextEditor from '@/components/admin/RichTextEditor';

export default function CreateNewsPostPage() {
  const router = useRouter();
  // --- STATE FOR NEW FIELDS ---
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageTitle, setImageTitle] = useState('');
  const [imageAltText, setImageAltText] = useState('');
  const [sport, setSport] = useState('football');

  // --- IMAGE UPLOAD HANDLER ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await axios.post('/api/upload', formData);
      setFeaturedImage(data.url);
      toast.success('Image uploaded!');
    } catch (error) {
      toast.error('Image upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  // --- MUTATION TO CREATE POST (NOW INCLUDES NEW FIELDS) ---
  const createPostMutation = useMutation({
    mutationFn: (newPost: {
      title: string;
      content: string;
      status: string;
      metaTitle?: string;
      metaDescription?: string;
      featuredImage?: string | null;
      featuredImageTitle?: string;
      featuredImageAltText?: string;
      sport: string,

    }) => {
      return axios.post('/api/posts', newPost);
    },
    onSuccess: () => {
      toast.success('Post created successfully!');
      router.push('/admin/news');
      router.refresh();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create post.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
        toast.error('Title and content cannot be empty.');
        return;
    }
    createPostMutation.mutate({
      title,
      content,
      status,
      featuredImage,
      metaTitle,
      metaDescription,
      featuredImageTitle: imageTitle,
      featuredImageAltText: imageAltText,
      sport,
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Create New Post</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-brand-secondary p-6 rounded-lg space-y-6">
        
        {/* --- ENHANCED: FEATURED IMAGE SECTION --- */}
        <div className="p-4 border border-gray-600 rounded-lg">
          <label className="block text-sm font-medium text-brand-light mb-2">Featured Image</label>
          <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-600 px-6 py-10">
            {featuredImage ? (
              <div className="relative group w-full h-64">
                <Image src={featuredImage} alt={imageAltText || 'Featured preview'} layout="fill" objectFit="contain" />
                <button
                  type="button"
                  onClick={() => setFeaturedImage(null)}
                  className="absolute top-2 right-2 bg-red-600 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <XCircle size={20} />
                </button>
              </div>
            ) : (
              <div className="text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-gray-500" />
                <div className="mt-4 flex text-sm leading-6 text-gray-400">
                  <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-semibold text-brand-purple focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-purple focus-within:ring-offset-2 focus-within:ring-offset-brand-dark hover:text-brand-purple/80">
                    <span>{isUploading ? 'Uploading...' : 'Upload a file'}</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageUpload} disabled={isUploading} accept="image/*" />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs leading-5 text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
            )}
          </div>
        </div>

        {featuredImage && (
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="imageTitle" className="block text-sm font-medium text-brand-light mb-2">Image Title (Tooltip)</label>
                <input id="imageTitle" type="text" value={imageTitle} onChange={(e) => setImageTitle(e.target.value)} placeholder="e.g., Team celebrating a goal" className="w-full p-3 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple" />
              </div>
              <div>
                <label htmlFor="imageAltText" className="block text-sm font-medium text-brand-light mb-2">Image Alt Text (Accessibility & SEO)</label>
                <input id="imageAltText" type="text" value={imageAltText} onChange={(e) => setImageAltText(e.target.value)} placeholder="e.g., Player in red jersey kicking a football" className="w-full p-3 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple" />
                 <p className="text-xs text-brand-muted mt-1">Describe the image for screen readers and search engines.</p>
              </div>
            </div>
          )}

        {/* Title Field (No change) */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-brand-light mb-2">Title</label>
          <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple" />
        </div>

        {/* Content Field (No change) */}
        <div>
          <label className="block text-sm font-medium text-brand-light mb-2">Content</label>
          <RichTextEditor value={content} onChange={setContent} />
        </div>

        {/* --- SEO & META FIELDS SECTION --- */}
        <div className="space-y-4 p-4 border border-gray-600 rounded-lg">
            <h3 className="text-lg font-semibold text-white">SEO Settings</h3>
            <div>
              <label htmlFor="metaTitle" className="block text-sm font-medium text-brand-light mb-2">Meta Title</label>
              <input id="metaTitle" type="text" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="e.g., Ultimate Guide to Sunday's Match" className="w-full p-3 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple" />
              <p className="text-xs text-brand-muted mt-1">Recommended: 50-60 characters.</p>
            </div>
            <div>
              <label htmlFor="metaDescription" className="block text-sm font-medium text-brand-light mb-2">Meta Description</label>
              <textarea id="metaDescription" rows={3} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} placeholder="A brief summary for search engines..." className="w-full p-3 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple" />
              <p className="text-xs text-brand-muted mt-1">Recommended: 150-160 characters.</p>
            </div>
        </div>

        {/* Status Field (No change) */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-brand-light mb-2">Status</label>
          <select id="status" value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'published')} className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

                  <div>
            <label htmlFor="sport" className="block text-sm font-medium text-brand-light mb-2">Sport Category</label>
            <select 
              id="sport" 
              value={sport} 
              onChange={(e) => setSport(e.target.value)} 
              className="w-full p-3 rounded bg-gray-700 text-white ..."
            >
              <option value="football">Football</option>
              <option value="basketball">Basketball</option>
              <option value="tennis">Tennis</option>
              <option value="general">General</option>
            </select>
          </div>

        {/* Action Buttons (No change) */}
        <div className="flex justify-end gap-4 pt-4 border-t border-gray-600">
          <Link href="/admin/news" className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:opacity-90">Cancel</Link>
          <button type="submit" disabled={createPostMutation.isPending || isUploading} className="bg-brand-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
            {createPostMutation.isPending ? 'Saving...' : 'Save Post'}
          </button>
        </div>
      </form>
    </div>
  );
}