import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { useAuth } from "@/hooks/useAuth";
import { getWriteup, getWriteupContent } from "@/libs/api";

export const Route = createFileRoute("/writeups/$writeupId")({
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
    queryKey: ["writeups", writeupId],
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

  if (isLoadingWriteup || isLoadingContent) return <div>Loading writeup...</div>;
  if (writeupError) return <div>Error loading writeup: {writeupError.message}</div>;
  if (contentError) return <div>Error loading content: {contentError.message}</div>;
  if (!writeup) return <div>Writeup not found</div>;

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-3xl font-bold">{writeup.title}</h1>
          {canEdit && (
            <Link
              to={`/writeups/$writeupId/edit`}
              params={{ writeupId }}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
            >
              Edit
            </Link>
          )}
        </div>

        <div className="flex items-center text-sm text-gray-600 mb-2">
          <span>By {writeup.createdByUser.name || "Unknown"}</span>
          <span className="mx-2">•</span>
          <span>{new Date(writeup.createdAt).toLocaleDateString()}</span>
          {writeup.createdAt !== writeup.updatedAt && (
            <>
              <span className="mx-2">•</span>
              <span>Updated: {new Date(writeup.updatedAt).toLocaleDateString()}</span>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Link
            to={`/ctfs/$ctfId`}
            params={{ ctfId: writeup.ctf.id.toString() }}
            className="text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200"
          >
            {writeup.ctf?.name || "Unknown CTF"}
          </Link>

          <span className="text-sm px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
            {writeup.category?.name || "Uncategorized"}
          </span>

          {writeup.tags?.map((tag) => (
            <span key={tag.id} className="text-sm px-3 py-1 bg-gray-100 text-gray-800 rounded-full">
              {tag.name}
            </span>
          ))}
        </div>
      </div>

      <div className="prose max-w-none">
        <div dangerouslySetInnerHTML={{ __html: content || "<p>No content available</p>" }} />
      </div>
    </div>
  );
}
