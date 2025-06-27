// src/app/api/posts/[postId]/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Post, { IPost } from '@/models/Post';

interface Params {
  params: { postId: string };
}

// --- GET a Single Post (by ID) ---
// Publicly accessible for the edit page pre-fill and potentially public view.
export async function GET(request: Request, { params }: Params) {
  const { postId } = params;
  try {
    await dbConnect();
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// --- PUT (Update) a Post ---
// Protected: Only admins can update.
export async function PUT(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { postId } = params;
  try {
    const body: Partial<IPost> = await request.json();
    const { title, content, status, featuredImage, metaTitle, metaDescription, featuredImageTitle, featuredImageAltText } = body;
    
    await dbConnect();
    
    const updatedPost = await Post.findByIdAndUpdate(
        postId,
        { title, content, status },
        { new: true, runValidators: true }
    );
    
    if (!updatedPost) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    return NextResponse.json(updatedPost);
  } catch (error) {
    return NextResponse.json({ error: 'Server error updating post' }, { status: 500 });
  }
}

// --- DELETE a Post ---
// Protected: Only admins can delete.
export async function DELETE(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { postId } = params;
  try {
    await dbConnect();
    const deletedPost = await Post.findByIdAndDelete(postId);
    if (!deletedPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}