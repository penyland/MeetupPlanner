import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  CalendarIcon, 
  UserGroupIcon, 
  PresentationChartBarIcon,
  MapPinIcon,
  PlusIcon,
  ListBulletIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';

interface MenuItem {
  name: string;
  path?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { name: 'Home', path: '/', icon: HomeIcon },
  {
    name: 'Meetups',
    icon: CalendarIcon,
    children: [
      { name: 'List', path: '/meetups', icon: ListBulletIcon },
      { name: 'Add', path: '/meetups/add', icon: PlusIcon },
    ],
  },
  {
    name: 'Speakers',
    icon: UserGroupIcon,
    children: [
      { name: 'List', path: '/speakers', icon: ListBulletIcon },
      { name: 'Add', path: '/speakers/add', icon: PlusIcon },
    ],
  },
  {
    name: 'Presentations',
    icon: PresentationChartBarIcon,
    children: [
      { name: 'List', path: '/presentations', icon: ListBulletIcon },
      { name: 'Add', path: '/presentations/add', icon: PlusIcon },
    ],
  },
  {
    name: 'Locations',
    icon: MapPinIcon,
    children: [
      { name: 'List', path: '/locations', icon: ListBulletIcon },
      { name: 'Add', path: '/locations/add', icon: PlusIcon },
    ],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['Meetups', 'Speakers', 'Presentations', 'Locations']));

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuName)) {
        newSet.delete(menuName);
      } else {
        newSet.add(menuName);
      }
      return newSet;
    });
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path;
  };

  return (
    <div className="w-64 bg-gray-900 text-white h-screen flex flex-col fixed left-0 top-0">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">MeetupPlanner</h1>
        <p className="text-sm text-gray-400">Admin</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.name}>
              {item.path ? (
                <Link
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors ${
                    isActive(item.path) ? 'bg-gray-800 text-blue-400' : ''
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center">
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </div>
                    {expandedMenus.has(item.name) ? (
                      <ChevronDownIcon className="w-4 h-4" />
                    ) : (
                      <ChevronRightIcon className="w-4 h-4" />
                    )}
                  </button>
                  {expandedMenus.has(item.name) && item.children && (
                    <ul className="ml-8 mt-2 space-y-1">
                      {item.children.map((child) => (
                        <li key={child.name}>
                          <Link
                            to={child.path!}
                            className={`flex items-center px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm ${
                              isActive(child.path) ? 'bg-gray-800 text-blue-400' : ''
                            }`}
                          >
                            <child.icon className="w-4 h-4 mr-2" />
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
