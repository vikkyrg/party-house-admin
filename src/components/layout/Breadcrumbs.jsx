import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { capitalize } from '../../lib/formatters';

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x && x !== 'admin');

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center space-x-1 text-sm text-slate-500 mb-4">
      <Link to="/admin" className="flex items-center hover:text-primary-600 transition-colors">
        <Home className="h-4 w-4" />
      </Link>
      
      {pathnames.map((value, index) => {
        const isLast = index === pathnames.length - 1;
        const to = `/admin/${pathnames.slice(0, index + 1).join('/')}`;
        
        // Try to make nice titles from URL segments
        const title = value.split('-').map(capitalize).join(' ');

        return (
          <div key={to} className="flex items-center space-x-1">
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            {isLast ? (
              <span className="font-medium text-slate-900" aria-current="page">
                {title}
              </span>
            ) : (
              <Link to={to} className="hover:text-primary-600 transition-colors">
                {title}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
