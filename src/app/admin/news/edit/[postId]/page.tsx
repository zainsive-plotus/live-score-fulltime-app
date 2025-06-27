// src/app/admin/news/edit/[postId]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from '@/components/StyledLink'; 
import RichTextEditor from '@/components/admin/RichTextEditor';
import { IPost } from '@/models/Post';

// Fetcher function for a single post
const fetchPost = async (postId: string): Promise<IPost> => {
    const { data } = await axios.get(`/api/posts/${postId}`);
    return data;
};

export default function EditNewsPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.postId as string;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  // 1. Fetch the existing post data
  const { data: postData, isLoading, isError } = useQuery<IPost>({
    queryKey: ['post', postId],
    queryFn: () => fetchPost(postId),
    enabled: !!postId, // Only run query if postId exists
  });

  // 2. Pre-fill the form once data is fetched
  useEffect(() => {
    if (postData) {
      setTitle(postData.title);
      setContent(postData.content);
      setStatus(postData.status);
    }
  }, [postData]);

  // 3. Mutation to update the post
  const updatePostMutation = useMutation({
    mutationFn: (updatedPost: { title: string; content: string; status: string; }) => {
      return axios.put(`/api/posts/${postId}`, updatedPost);
    },
    onSuccess: () => {
      toast.success('Post updated successfully!');
      router.push('/admin/news');
      router.refresh();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Failed to update post.';
      toast.error(errorMessage);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
        toast.error('Title and content cannot be empty.');
        return;
    }
    updatePostMutation.mutate({ title, content, status });
  };
  
  if (isLoading) return <p className="text-brand-muted">Loading post data...</p>;
  if (isError) return <p className="text-red-400">Failed to load post data.</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Edit Post</h1>
        <Link href="/admin/news" className="text-sm text-brand-muted hover:text-white">
          ← Back to News List
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-brand-secondary p-6 rounded-lg space-y-6">
        {/* Title Field */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-brand-light mb-2">Title</label>
          <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple" required/>
        </div>
        
        {/* Content Field (Rich Text Editor) */}
        <div>
          <label className="block text-sm font-medium text-brand-light mb-2">Content</label>
          {/* We must wait for content to be loaded before rendering the editor */}
          {content && <RichTextEditor value={content} onChange={setContent} />}
        </div>

        {/* Status Field */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-brand-light mb-2">Status</label>
          <select id="status" value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'published')} className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Link href="/admin/news" className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">Cancel</Link>
          <button type="submit" disabled={updatePostMutation.isPending} className="bg-brand-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
            {updatePostMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}