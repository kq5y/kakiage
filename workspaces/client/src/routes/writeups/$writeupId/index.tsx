import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import Article from "@/components/Article";
import { useAuth } from "@/hooks/useAuth";
import { ApiError, unlockWriteup } from "@/libs/api";
import { type WriteupDetail, writeupContentQueryOptions, writeupQueryOptions } from "@/queries/writeups";
import { createPageTitle } from "@/utils/meta";

export const Route = createFileRoute("/writeups/$writeupId/")({
  component: WriteupDetailPage,
  params: {
    parse: ({ writeupId }) => ({ writeupId: Number(writeupId) }),
  },
  loader: ({ params, context }) => {
    return context.queryClient.ensureQueryData(writeupQueryOptions(params.writeupId, false));
  },
  head: ctx => ({
    meta: [{ title: createPageTitle(ctx.loaderData?.title || "") }],
  }),
  pendingComponent: () => <div>Loading writeup...</div>,
  errorComponent: ({ error }) => <div>Error loading writeup: {error.message}</div>,
});

interface Token {
  token: string;
  expiresAt: Date;
}

function WriteupContentContainer({
  writeup,
  token,
  setToken,
}: {
  writeup: WriteupDetail;
  token: Token | null;
  setToken: React.Dispatch<React.SetStateAction<Token | null>>;
}) {
  const { data: content, isLoading, error } = useQuery(writeupContentQueryOptions(writeup.id, token?.token));

  useEffect(() => {
    if (error instanceof ApiError && error.status === 401 && token) {
      setToken(null);
    }
  }, [error, token, setToken]);

  return (
    <div className="max-w-none">
      {isLoading ? (
        <div>Loading content...</div>
      ) : error ? (
        <div>Error loading content: {error.message}</div>
      ) : (
        <Article value={content || "<p>No content available</p>"} />
      )}
    </div>
  );
}

function WriteupContentArea({ writeup }: { writeup: WriteupDetail }) {
  const { user, isAdmin } = useAuth();
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<Token | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const canEdit = user?.id === writeup.createdByUser.id || isAdmin;

  const handleUnlock = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsUnlocking(true);
    setUnlockError(null);
    try {
      const tokenData = await unlockWriteup(writeup.id, password);
      setToken(tokenData);
      setPassword("");
    } catch (err) {
      if (err instanceof ApiError) {
        setUnlockError(err.message);
      } else {
        setUnlockError("Failed to unlock writeup");
      }
    } finally {
      setIsUnlocking(false);
    }
  };

  if (writeup.hasPassword && !token && !canEdit) {
    return (
      <div>
        {unlockError && <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">{unlockError}</div>}
        <p className="mb-1">This writeup is locked. Please enter the password to unlock it.</p>
        <form className="space-y-4" onSubmit={handleUnlock}>
          <label className="block mb-2 font-medium">
            Password
            <input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              required
              disabled={isUnlocking}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </label>
          <div className="flex justify-end items-center space-x-3">
            <button
              type="submit"
              disabled={isUnlocking}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-default shadow text-base"
            >
              {isUnlocking ? "Unlocking..." : "Unlock"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return <WriteupContentContainer writeup={writeup} token={token} setToken={setToken} />;
}

function WriteupDetailPage() {
  const { user, isAdmin } = useAuth();

  const { writeupId } = Route.useParams();
  const { data: writeup, isLoading, error } = useQuery(writeupQueryOptions(writeupId, false));

  if (isLoading || !writeup) return <div>Loading writeup...</div>;
  if (error) return <div>Error loading writeup: {error.message}</div>;

  const canEdit = user?.id === writeup.createdByUser.id || isAdmin;
  return (
    <div className="max-w-xl w-full px-2 space-y-3">
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
            params={{ ctfId: writeup.ctf.id }}
            className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
          >
            {writeup.ctf.name}
          </Link>

          <span className="text-sm px-2 py-1 bg-purple-100 text-purple-800 rounded">{writeup.category.name}</span>

          {writeup.tags.map(tag => (
            <span key={tag.id} className="text-sm px-2 py-1 bg-gray-100 text-gray-800 rounded">
              {tag.name}
            </span>
          ))}
        </div>
      </div>

      <WriteupContentArea writeup={writeup} />
    </div>
  );
}
