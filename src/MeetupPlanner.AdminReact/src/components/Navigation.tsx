import { Link } from 'react-router-dom';

export default function Navigation() {
  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold">
            MeetupPlanner Admin
          </Link>
          <div className="flex space-x-4">
            <Link
              to="/"
              className="px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Home
            </Link>
            <Link
              to="/add-speaker"
              className="px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Add Speaker
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
