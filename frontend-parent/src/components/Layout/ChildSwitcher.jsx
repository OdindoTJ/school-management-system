import React, { useState, useRef, useEffect } from 'react';
import { useChild } from '../../context/ChildContext';

const ChildSwitcher = () => {
  const { children, selectedChild, setSelectedChild } = useChild();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!children || children.length === 0) {
    return (
      <div className="px-3 py-2 text-sm text-gray-500">
        No children linked
      </div>
    );
  }

  const initials = (name) =>
    name
      ? name
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase()
      : '?';

  const current = selectedChild || children[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-gray-50 transition border border-gray-200 bg-white"
      >
        {current.photo ? (
          <img
            src={current.photo}
            alt={current.full_name}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary-900 text-white flex items-center justify-center text-xs font-bold">
            {initials(current.full_name)}
          </div>
        )}
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {current.full_name}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {current.class_name || '—'}
          </p>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-40">
          <p className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Switch Child
          </p>
          {children.map((child) => {
            const isSelected = current.id === child.id;
            return (
              <button
                key={child.id}
                onClick={() => {
                  setSelectedChild(child);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2 transition text-left ${
                  isSelected
                    ? 'bg-primary-50 text-primary-900'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {child.photo ? (
                  <img
                    src={child.photo}
                    alt={child.full_name}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-primary-900 text-white flex items-center justify-center text-[10px] font-bold">
                    {initials(child.full_name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{child.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {child.class_name}
                  </p>
                </div>
                {isSelected && (
                  <svg className="w-4 h-4 text-primary-900" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChildSwitcher;