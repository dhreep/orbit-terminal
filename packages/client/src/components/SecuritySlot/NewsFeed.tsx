import { useQuery } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/services/api';

interface NewsFeedProps {
  ticker: string;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp * 1000) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NewsFeed({ ticker }: NewsFeedProps) {
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['news', ticker],
    queryFn: () => api.news.getByTicker(ticker),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <span className="text-[10px] font-mono text-muted-foreground animate-pulse">Loading news…</span>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="flex items-center justify-center py-6">
        <span className="text-[10px] font-mono text-muted-foreground">No news available</span>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full max-h-[300px]">
      <div className="flex flex-col divide-y divide-border">
        {articles.slice(0, 10).map((article) => (
          <a
            key={article.id}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-2 hover:bg-muted/50 transition-colors"
          >
            <p className="text-[11px] font-medium text-foreground leading-tight line-clamp-2">{article.headline}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] font-mono text-primary">{article.source}</span>
              <span className="text-[9px] font-mono text-muted-foreground">{timeAgo(article.datetime)}</span>
            </div>
          </a>
        ))}
      </div>
    </ScrollArea>
  );
}
