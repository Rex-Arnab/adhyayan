import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

/**
 * react-markdown v10 removed the `className` prop, so styling is applied to a
 * wrapper element rather than passed to the component.
 */
export function ReadingPane({
  contentMd,
  youtubeId,
}: {
  contentMd: string;
  youtubeId?: string | null;
}) {
  return (
    <article className="reading-column prose-adhyayan mx-auto">
      {youtubeId ? (
        <div className="mb-8 aspect-video overflow-hidden rounded-2xl border">
          <iframe
            className="size-full"
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
            title="Chapter video"
            allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : null}

      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
      >
        {contentMd}
      </ReactMarkdown>
    </article>
  );
}
