import PostThread from '@/components/community/PostThread';

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <div className="min-h-screen bg-gray-950 text-white p-4">
            <div className="container mx-auto max-w-4xl py-8">
                <PostThread postId={id} />
            </div>
        </div>
    );
}
