import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { writeupsQueryOptions } from "@/queries/writeups";
import { createPageTitle } from "@/utils/meta";

export const Route = createFileRoute("/writeups/")({
  component: WriteupsListPage,
  loader: ({ context }) => {
    return context.queryClient.ensureQueryData(writeupsQueryOptions());
  },
  head: () => ({
    meta: [{ title: createPageTitle("Writeups") }],
  }),
  pendingComponent: () => <div>Loading writeups...</div>,
  errorComponent: ({ error }) => <div>Error loading writeups: {error.message}</div>,
});

function WriteupsListPage() {
  const { data: writeups, isLoading, error } = useQuery(writeupsQueryOptions());

  if (isLoading || !writeups) return <div>Loading writeups...</div>;
  if (error) return <div>Error loading writeups: {(error as Error).message}</div>;

  return (
    <div className="max-w-lg w-full px-2">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold mb-3">Writeups</h1>
      </div>

      <div className="space-y-2">
        {writeups.map(writeup => (
          <div key={writeup.id} className="block px-4 py-3 hover:bg-gray-50">
            <div className="flex justify-between items-center">
              <Link to="/writeups/$writeupId" params={{ writeupId: writeup.id }}>
                <h3 className="font-medium hover:underline">{writeup.title}</h3>
              </Link>
              <div className="text-sm text-gray-500">
                by {writeup.createdByUser.name} • {new Date(writeup.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              <Link
                to="/ctfs/$ctfId"
                params={{ ctfId: writeup.ctf.id }}
                className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
              >
                {writeup.ctf.name}
              </Link>
              <span key={writeup.category.id} className="px-2 py-1 text-sm bg-purple-100 text-purple-800 rounded">
                {writeup.category.name}
              </span>
              {writeup.tags.map(tag => (
                <span key={tag.id} className="px-2 py-1 text-sm bg-gray-200 text-gray-700 rounded">
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {writeups.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No writeups found.</p>
        </div>
      )}
    </div>
  );
}
