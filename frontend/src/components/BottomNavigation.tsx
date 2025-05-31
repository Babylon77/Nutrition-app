import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  DocumentTextIcon, 
  BookOpenIcon,
  BeakerIcon, 
  HeartIcon,
  UserCircleIcon,
  PlusIcon 
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeSolid, 
  DocumentTextIcon as DocumentSolid, 
  BookOpenIcon as BookOpenSolid,
  BeakerIcon as BeakerSolid, 
  HeartIcon as HeartSolid,
  UserCircleIcon as UserSolid 
} from '@heroicons/react/24/solid';
import './BottomNavigation.css';

interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<any>;
  solidIcon: React.ComponentType<any>;
  color: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/',
    icon: HomeIcon,
    solidIcon: HomeSolid,
    color: 'var(--color-primary-green)'
  },
  {
    id: 'food',
    label: 'Food Log',
    path: '/food-log',
    icon: DocumentTextIcon,
    solidIcon: DocumentSolid,
    color: 'var(--color-food)'
  },
  {
    id: 'personal',
    label: 'My Foods',
    path: '/personal-foods',
    icon: BookOpenIcon,
    solidIcon: BookOpenSolid,
    color: 'var(--color-personal)'
  },
  {
    id: 'supplements',
    label: 'Supplements',
    path: '/supplements',
    icon: BeakerIcon,
    solidIcon: BeakerSolid,
    color: 'var(--color-supplements)'
  },
  {
    id: 'health',
    label: 'Health',
    path: '/bloodwork',
    icon: HeartIcon,
    solidIcon: HeartSolid,
    color: 'var(--color-health)'
  },
  {
    id: 'profile',
    label: 'Profile',
    path: '/profile',
    icon: UserCircleIcon,
    solidIcon: UserSolid,
    color: 'var(--color-primary-blue)'
  }
];

interface BottomNavigationProps {
  onQuickAdd?: () => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ onQuickAdd }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleQuickAdd = () => {
    if (onQuickAdd) {
      onQuickAdd();
    } else {
      // Default behavior - navigate to food log
      navigate('/food-log');
    }
  };

  return (
    <nav className="bottom-navigation">
      <div className="bottom-nav-container">
        {navigationItems.map((item, index) => {
          const active = isActive(item.path);
          const Icon = active ? item.solidIcon : item.icon;
          
          return (
            <button
              key={item.id}
              className={`nav-item ${active ? 'nav-item--active' : ''}`}
              onClick={() => handleNavigation(item.path)}
              aria-label={item.label}
              style={{
                '--nav-color': active ? item.color : 'var(--color-text-light)'
              } as React.CSSProperties}
            >
              <div className="nav-icon">
                <Icon className="nav-icon-svg" />
                {active && <div className="nav-indicator" />}
              </div>
              <span className="nav-label">{item.label}</span>
              
              {/* Quick Add FAB positioned after Food Log item */}
              {index === 1 && (
                <button
                  className="quick-add-fab"
                  onClick={handleQuickAdd}
                  aria-label="Quick Add"
                >
                  <PlusIcon className="fab-icon" />
                </button>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Safe area for iOS devices */}
      <div className="bottom-nav-safe-area" />
    </nav>
  );
};

export default BottomNavigation; 