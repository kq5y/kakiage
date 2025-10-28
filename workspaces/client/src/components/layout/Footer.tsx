export function Footer() {
  return (
    <footer className="bg-gray-100">
      <div className="container mx-auto px-4 py-3">
        <div className="text-center text-gray-600 text-sm">
          <p>© {new Date().getFullYear()} kakiage - CTF Writeups Platform</p>
        </div>
      </div>
    </footer>
  );
}
