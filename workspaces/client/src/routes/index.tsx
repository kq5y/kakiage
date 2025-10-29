import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [{ title: "kakiage" }],
  }),
});

function HomePage() {
  return (
    <div className="max-w-xl w-full px-2">
      <h1 className="text-3xl font-bold mb-6">kakiage - CTF Writeups</h1>
      <p className="mb-4">Welcome to kakiage, a platform for sharing CTF writeups with your team.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="p-6 border rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Browse CTFs</h2>
          <p className="mb-4">View all CTF competitions and their writeups.</p>
          <Link to="/ctfs" className="text-blue-600 hover:underline">
            View CTFs →
          </Link>
        </div>
        <div className="p-6 border rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Latest Writeups</h2>
          <p className="mb-4">Check out the most recent writeups.</p>
          <Link to="/writeups" className="text-blue-600 hover:underline">
            View Writeups →
          </Link>
        </div>
      </div>
    </div>
  );
}
