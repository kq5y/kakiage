import { Link, useNavigate } from "@tanstack/react-router";
import { useId } from "react";

import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const popoverId = useId();

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/" });
  };

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          <Link to="/" className="text-2xl font-bold text-black">
            kakiage
          </Link>

          <nav className="flex items-center space-x-6">
            <Link
              to="/ctfs"
              className="text-gray-700 hover:text-blue-600"
              activeProps={{ className: "text-blue-600 font-medium" }}
            >
              CTFs
            </Link>

            {user?.role === "admin" && (
              <Link
                to="/categories"
                className="text-gray-700 hover:text-blue-600"
                activeProps={{ className: "text-blue-600 font-medium" }}
              >
                Categories
              </Link>
            )}

            {!isLoading && (
              <div className="flex items-center">
                {user ? (
                  <div>
                    <button
                      type="button"
                      popoverTarget={popoverId}
                      className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 bg-transparent"
                    >
                      {user.avatarUrl && (
                        <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full" />
                      )}
                    </button>
                    <div
                      id={popoverId}
                      popover="auto"
                      className="bg-white shadow-lg rounded-md w-48 mt-2 border border-gray-300 translate-x-[-152px] top-[anchor(bottom)] left-[anchor(left)]"
                    >
                      <div className="block w-full text-left text-base px-4 py-3 text-gray-500 bg-transparent hover:bg-gray-200 border-0 border-b border-gray-300 border-solid">
                        <div>
                          <span className="font-medium text-black">{user.name}</span> ({user.role})
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="block w-full text-left text-base px-4 py-3 text-gray-700 bg-transparent hover:bg-gray-200"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                ) : (
                  <Link to="/login" className="text-gray-700 hover:text-blue-600">
                    Login
                  </Link>
                )}
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
