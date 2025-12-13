export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Page Not Found</p>
        <p className="text-gray-500">The page you're looking for doesn't exist.</p>
      </div>
    </div>
  );
}
