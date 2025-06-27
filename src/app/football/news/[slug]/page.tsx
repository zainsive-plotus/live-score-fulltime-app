import { notFound } from 'next/navigation';
import dbConnect from '@/lib/dbConnect';
import Post from '@/models/Post';
import { format } from 'date-fns';
import Header from '@/components/Header';
import Image from 'next/image'; // <-- Import next/image
import SocialShareButtons from '@/components/SocialShareButtons'; // We will create this next
import NewsSidebar from '@/components/NewsSidebar';

// This function fetches the data on the server
async function getPost(slug: string) {
  await dbConnect();
  const post = await Post.findOne({ slug: slug, status: 'published' }).lean();
  if (!post) {
    return null;
  }
  return post;
}

// Update generateMetadata to use the new meta fields if they exist
export async function generateMetadata({ params }: { params: { slug: string } }) {
    const post = await getPost(params.slug);
    if (!post) {
      return { title: 'Not Found' };
    }
    return {
      // Use specific meta title if available, otherwise fall back to post title
      title: post.metaTitle || `${post.title} | Fulltime News`,
      // Use specific meta description if available
      description: post.metaDescription || post.content.replace(/<[^>]*>?/gm, '').substring(0, 160),
    };
}


// --- The Main Page Component ---
export default async function NewsArticlePage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  // We need to construct the full URL for sharing
  const postUrl = `${process.env.NEXTAUTH_URL}/news/${post.slug}`;

  return (
     <div className="bg-brand-dark min-h-screen">
      <Header />
      {/* --- UPDATED LAYOUT --- */}
      <main className="container mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Main Content (Article) - Spans 2 columns on large screens */}
        <div className="lg:col-span-2">
          <article className="bg-brand-secondary rounded-lg overflow-hidden">
            {post.featuredImage && (
              <div className="relative w-full h-64 md:h-96">
                <Image
                  src={post.featuredImage}
                  alt={post.featuredImageAltText || post.title}
                  title={post.featuredImageTitle || post.title}
                  layout="fill"
                  objectFit="cover"
                  priority
                />
              </div>
            )}
            
            <div className="p-8">
              <div className="mb-8 text-center border-b border-gray-700/50 pb-8">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4">
                  {post.title}
                </h1>
                <p className="text-brand-muted">
                  Published by {post.author} on {format(new Date(), 'MMMM dd, yyyy')}
                </p>
              </div>
              
              <div 
                className="prose prose-invert lg:prose-xl max-w-none"
                dangerouslySetInnerHTML={{ __html: post.content }} 
              />

              <div className="mt-12 pt-8 border-t border-gray-700/50">
                  <h3 className="text-lg font-bold text-center text-brand-muted mb-4">Share this article</h3>
                  <SocialShareButtons url={postUrl} title={post.title} />
              </div>
            </div>
          </article>
        </div>

        {/* Sidebar - Spans 1 column on large screens */}
        <div className="lg:col-span-1">
          <NewsSidebar />
        </div>

      </main>
    </div>
  );
}
// Optional: For better performance in production, generate static pages for each post at build time.
export async function generateStaticParams() {
  await dbConnect();
  const posts = await Post.find({ status: 'published' }).select('slug').lean();
  return posts.map(post => ({
    slug: post.slug,
  }));
}