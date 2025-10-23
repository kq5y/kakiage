import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { useAuth } from "@/hooks/useAuth";
import { getCtfs } from "@/libs/api";

export const Route = createFileRoute("/ctfs/")({
  component: CtfsPage,
});

function CtfsPage() {
  const {
    data: ctfs,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["ctfs"],
    queryFn: getCtfs,
  });

  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  if (isLoading) return <div>Loading CTFs...</div>;
  if (error) return <div>Error loading CTFs: {error.message}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">CTF Competitions</h1>
        {isAdmin && (
          <Link to="/ctfs/new" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Add New CTF
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ctfs?.map((ctf) => (
          <Link
            key={ctf.id}
            to={`/ctfs/$ctfId`}
            params={{ ctfId: ctf.id.toString() }}
            className="block p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">{ctf.name}</h2>
            <div className="text-sm text-gray-500">
              {new Date(ctf.startAt).toLocaleDateString()} - {new Date(ctf.endAt).toLocaleDateString()}
            </div>
          </Link>
        ))}
      </div>

      {ctfs?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No CTF competitions found.</p>
          {isAdmin && (
            <Link to="/ctfs/new" className="text-blue-600 hover:underline mt-2 inline-block">
              Add your first CTF
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
