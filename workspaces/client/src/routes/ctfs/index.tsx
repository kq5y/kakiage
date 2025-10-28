import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { useAuth } from "@/hooks/useAuth";
import { getCtfs } from "@/libs/api";

export const Route = createFileRoute("/ctfs/")({
  component: CtfsPage,
});

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
};

function CtfsPage() {
  const {
    data: ctfs,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["ctfs"],
    queryFn: () => getCtfs({}),
  });

  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  if (isLoading) return <div>Loading CTFs...</div>;
  if (error) return <div>Error loading CTFs: {error.message}</div>;

  return (
    <div className="max-w-lg w-full">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold mb-3">CTF Competitions</h1>
        {isAdmin && (
          <Link
            to="/ctfs/new"
            className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors text-base"
          >
            Add
          </Link>
        )}
      </div>

      <div className="space-y-2">
        {ctfs?.map((ctf) => (
          <Link
            key={ctf.id}
            to="/ctfs/$ctfId"
            params={{ ctfId: ctf.id.toString() }}
            className="block p-3 border border-gray-200 border-solid rounded-lg shadow-sm hover:shadow-md hover:bg-gray-50 transition-all"
          >
            <h2 className="text-xl font-semibold mb-2">{ctf.name}</h2>
            <div className="text-sm text-gray-500">
              {new Date(ctf.startAt).toLocaleString(undefined, DATE_OPTIONS)}
              {" - "}
              {new Date(ctf.endAt).toLocaleString(undefined, DATE_OPTIONS)}
            </div>
          </Link>
        ))}
      </div>

      {ctfs?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No CTF competitions found.</p>
        </div>
      )}
    </div>
  );
}
