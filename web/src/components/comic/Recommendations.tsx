import ComicCard from '../ComicCard';

interface RecommendationsProps {
    comics: any[];
}

export default function Recommendations({ comics }: RecommendationsProps) {
    if (!comics || comics.length === 0) return null;

    return (
        <div className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-purple-500">✨</span> More Like This
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {comics.map((comic) => (
                    <ComicCard
                        key={comic.id}
                        id={comic.id}
                        title={comic.title}
                        coverUrl={comic.coverImageUrl}
                        type={comic.type}
                        rating={comic.rating}
                        // We don't have status/folders for these yet, passing null/empty is fine
                        currentStatus={null}
                    />
                ))}
            </div>
        </div>
    );
}
