import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/utils';
import { navigationItems } from './navigation';

export const AppSidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__title">SOLFIN PERU</span>
        <span className="sidebar__subtitle">Gestion financiera</span>
      </div>
      <nav className="sidebar__nav" aria-label="Principal">
        {navigationItems.map((item) => (
          <NavLink
            className={({ isActive }) => cn('sidebar__link', isActive && 'sidebar__link--active')}
            key={item.path}
            to={item.path}
          >
            <span className="sidebar__icon">{item.code}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
