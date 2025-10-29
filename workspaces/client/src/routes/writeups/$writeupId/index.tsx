import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { useAuth } from "@/hooks/useAuth";
import { getWriteup, getWriteupContent } from "@/libs/api";

import "@/assets/article.scss";

export const Route = createFileRoute("/writeups/$writeupId/")({
  component: WriteupDetailPage,
});

function WriteupDetailPage() {
  const { writeupId } = Route.useParams();
  const { user } = useAuth();

  const {
    data: writeup,
    isLoading: isLoadingWriteup,
    error: writeupError,
  } = useQuery({
    queryKey: ["writeups", writeupId, { includeContent: false }],
    queryFn: () => getWriteup(Number(writeupId)),
  });

  const {
    data: content,
    isLoading: isLoadingContent,
    error: contentError,
  } = useQuery({
    queryKey: ["writeups", writeupId, "content"],
    queryFn: () => getWriteupContent(Number(writeupId)),
    enabled: !!writeup,
  });

  const isAuthor = user?.id === writeup?.createdByUser.id;
  const isAdmin = user?.role === "admin";
  const canEdit = isAuthor || isAdmin;

  if (isLoadingWriteup) return <div>Loading writeup...</div>;
  if (writeupError) return <div>Error loading writeup: {writeupError.message}</div>;
  if (!writeup) return <div>Writeup not found</div>;

  return (
    <div className="max-w-xl w-full px-2">
      <div>
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold">{writeup.title}</h1>
          {canEdit && (
            <Link
              to="/writeups/$writeupId/edit"
              params={{ writeupId }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-base"
            >
              Edit
            </Link>
          )}
        </div>

        <div className="flex flex-wrap items-center text-sm text-gray-600 mb-2">
          <span>By {writeup.createdByUser.name || "Unknown"}</span>
          <span className="mx-2">•</span>
          <span>{new Date(writeup.createdAt).toLocaleDateString()}</span>
          {writeup.createdAt !== writeup.updatedAt && (
            <>
              <span className="mx-2">•</span>
              <span>Updated: {new Date(writeup.updatedAt).toLocaleDateString()}</span>
            </>
          )}
          {writeup.points !== null && (
            <>
              <span className="mx-2">•</span>
              <span>{writeup.points}pt</span>
            </>
          )}
          {writeup.solvers !== null && (
            <>
              <span className="mx-2">•</span>
              <span>
                {writeup.solvers} solver{writeup.solvers !== 1 ? "s" : ""}
              </span>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-1 mb-2">
          <Link
            to="/ctfs/$ctfId"
            params={{ ctfId: writeup.ctf.id.toString() }}
            className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
          >
            {writeup.ctf.name}
          </Link>

          <span className="text-sm px-2 py-1 bg-purple-100 text-purple-800 rounded">{writeup.category.name}</span>

          {writeup.tags?.map((tag) => (
            <span key={tag.id} className="text-sm px-2 py-1 bg-gray-100 text-gray-800 rounded">
              {tag.name}
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-none">
        {isLoadingContent ? (
          <div>Loading content...</div>
        ) : contentError ? (
          <div>Error loading content: {contentError.message}</div>
        ) : (
          /** biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized */
          <div className="article" dangerouslySetInnerHTML={{ __html: content || "<p>No content available</p>" }} />
        )}
      </div>
    </div>
  );
}
