import { Link, useNavigate } from '@tanstack/react-router';

import { useAuth } from '@/hooks/useAuth';
import { getLoginLink } from '@/libs/api';

export function Header() {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate({ to: '/' });
  };

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-2xl font-bold text-blue-600">Kakiage</Link>
          
          <nav className="flex items-center space-x-6">
            <Link 
              to="/ctfs" 
              className="text-gray-700 hover:text-blue-600"
              activeProps={{ className: 'text-blue-600 font-medium' }}
            >
              CTFs
            </Link>
            
            {user?.role === 'admin' && (
              <Link 
                to="/categories" 
                className="text-gray-700 hover:text-blue-600"
                activeProps={{ className: 'text-blue-600 font-medium' }}
              >
                Categories
              </Link>
            )}
            
            {!isLoading && (
              <div className="flex items-center">
                {user ? (
                  <div className="flex items-center space-x-3">
                    {user.avatarUrl && (
                      <img 
                        src={user.avatarUrl} 
                        alt={user.name} 
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div className="relative group">
                      <button className="flex items-center text-gray-700 hover:text-blue-600">
                        <span>{user.name}</span>
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md py-1 z-10 hidden group-hover:block">
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    to="/"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = getLoginLink();
                    }}
                    className="text-gray-700 hover:text-blue-600"
                  >
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
