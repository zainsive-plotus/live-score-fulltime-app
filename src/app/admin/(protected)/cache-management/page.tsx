import { Server } from "lucide-react";
import CacheManagementClient from "./CacheManagementClient";

export default function CacheManagementPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Server size={28} /> Cache Management
        </h1>
      </div>

      <CacheManagementClient />

      <div className="mt-8 bg-brand-secondary p-6 rounded-lg">
        <h3 className="text-xl font-bold text-white mb-2">How It Works</h3>
        <div className="prose prose-sm prose-invert max-w-none text-text-secondary">
          <p>
            This tool helps ensure your site is as fast as possible by
            pre-building all public pages into static HTML files.
          </p>
          <ul>
            <li>
              <strong>Step 1:</strong> When you click "Start Pre-building", the
              system reads all the URLs from your live <code>sitemap.xml</code>{" "}
              files.
            </li>
            <li>
              <strong>Step 2:</strong> It then begins a background process on
              the server to "visit" each URL one by one.
            </li>
            <li>
              <strong>Step 3:</strong> This visit triggers Next.js to generate a
              static version of the page and store it in its cache.
            </li>
            <li>
              <strong>Step 4:</strong> Subsequent real visitors will be served
              this super-fast, pre-built static page directly from the
              cache/CDN.
            </li>
          </ul>
          <p>
            The process runs in the background, and you can monitor its progress
            by checking the server logs. It is safe to navigate away from this
            page after starting the process.
          </p>
        </div>
      </div>
    </div>
  );
}
