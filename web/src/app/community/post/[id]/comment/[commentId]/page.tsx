import PostThread from '@/components/community/PostThread';

export default async function CommentPermalinkPage({
    params,
}: {
    params: Promise<{ id: string; commentId: string }>;
}) {
    const { id, commentId } = await params;
    return (
        <div className="min-h-screen bg-background text-foreground p-4">
            <div className="container mx-auto max-w-4xl py-8">
                <PostThread postId={id} focusCommentId={commentId} />
            </div>
        </div>
    );
}
