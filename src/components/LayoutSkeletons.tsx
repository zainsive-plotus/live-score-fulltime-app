export const HeaderSkeleton = () => (
    // Mimics the h-20 class on your Header
    <div className="h-20 w-full" style={{ backgroundColor: 'var(--color-primary)' }}></div>
);

export const SidebarSkeleton = () => (
    // Mimics the general shape of the sidebar
    <div className="hidden lg:block w-72 rounded-xl" style={{ backgroundColor: 'var(--color-primary)' }}></div>
);