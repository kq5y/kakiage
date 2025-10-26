import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { useAuth } from "@/hooks/useAuth";
import { getCtfDetail } from "@/libs/api";

export const Route = createFileRoute("/ctfs/$ctfId")({
  component: CtfDetailPage,
});

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
};

function CtfDetailPage() {
  const { ctfId } = Route.useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const {
    data: ctf,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["ctfs", ctfId],
    queryFn: () => getCtfDetail(Number(ctfId)),
  });

  if (isLoading) return <div>Loading CTF details...</div>;
  if (error) return <div>Error loading CTF: {error.message}</div>;
  if (!ctf) return <div>CTF not found</div>;

  const writeupsByCategory = ctf.writeups?.reduce(
    (acc, writeup) => {
      const categoryId = writeup.category.id;
      if (!acc[categoryId]) {
        acc[categoryId] = [];
      }
      acc[categoryId].push(writeup);
      return acc;
    },
    {} as Record<string, typeof ctf.writeups>,
  );

  return (
    <div className="max-w-lg w-full">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold text-gray-800 mb-3">{ctf.name}</h1>
        {isAdmin && (
          <Link
            to={`/ctfs/$ctfId/edit`}
            params={{ ctfId }}
            className="px-5 py-2 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700 transition-colors text-base"
          >
            Edit
          </Link>
        )}
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="font-medium text-gray-700">Start Date</h3>
            <p>{new Date(ctf.startAt).toLocaleString(undefined, DATE_OPTIONS)}</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">End Date</h3>
            <p>{new Date(ctf.endAt).toLocaleString(undefined, DATE_OPTIONS)}</p>
          </div>
        </div>

        {ctf.url && (
          <div className="mb-4">
            <h3 className="font-medium text-gray-700">CTF URL</h3>
            <a href={ctf.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {ctf.url}
            </a>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold mb-4">Writeups</h2>
        <Link
          to={`/writeups/new`}
          search={{ ctfId: Number(ctfId) }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors text-base"
        >
          Add
        </Link>
      </div>

      {!writeupsByCategory || Object.keys(writeupsByCategory).length === 0 ? (
        <div className="text-center py-8 border rounded-lg">
          <p className="text-gray-500 mb-2">No writeups available for this CTF yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(writeupsByCategory).map(([categoryId, writeups]) => {
            const categoryName = writeups[0].category.name || "Uncategorized";

            return (
              <div key={categoryId} className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-3 font-medium">{categoryName}</div>
                <div className="divide-y">
                  {writeups.map((writeup) => (
                    <Link
                      key={writeup.id}
                      to={`/writeups/$writeupId`}
                      params={{ writeupId: writeup.id.toString() }}
                      className="block px-4 py-3 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">{writeup.title}</h3>
                        <div className="text-sm text-gray-500">
                          by {writeup.createdByUser.name || "Unknown"} •{" "}
                          {new Date(writeup.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      {writeup.tags && writeup.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {writeup.tags.map((tag) => (
                            <span key={tag.id} className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
