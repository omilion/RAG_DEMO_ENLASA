
import React from 'react';

export type ViewType = 'dashboard' | 'ai-assistant' | 'documents' | 'collaborators' | 'normative' | 'settings';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  department: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, department }) => {
  const navItems: { id: ViewType, icon: string, label: string }[] = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'ai-assistant', icon: '🤖', label: `${department} IA` }, // Etiqueta dinámica
    { id: 'documents', icon: '📄', label: 'Documentos' },
    { id: 'collaborators', icon: '👥', label: 'Colaboradores' },
    { id: 'normative', icon: '⚖️', label: 'Normativa' },
    { id: 'settings', icon: '⚙️', label: 'Configuración' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6">
        <img
          src="https://jypzdlrbjzdqszwqefha.supabase.co/storage/v1/object/sign/enlace%20media/getsitelogo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82NTg3ZDNlMi02MDkwLTQ2MGQtOTAxZi05NTYzNjgyYjk5OWEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJlbmxhY2UgbWVkaWEvZ2V0c2l0ZWxvZ28ucG5nIiwiaWF0IjoxNzcxMzY3MjQ4LCJleHAiOjE4MDI5MDMyNDh9.94W_GJK5cdLb0QL3Lb4vl7T7CJPlT2nspV0ritbEtSg"
          alt="Enlasa Logo"
          className="h-10 w-auto cursor-pointer"
          onClick={() => onViewChange('dashboard')}
        />
      </div>

      <nav className="flex-1 mt-4 px-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${currentView === item.id
              ? 'bg-enlasa-blue text-white shadow-lg shadow-blue-200'
              : 'text-slate-500 hover:bg-slate-50 hover:text-enlasa-blue'
              }`}
          >
            <span className={`text-xl transition-transform group-hover:scale-110 ${currentView === item.id ? 'opacity-100' : 'opacity-70'}`}>
              {item.icon}
            </span>
            <span className="font-medium whitespace-nowrap">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-enlasa-cyan flex items-center justify-center text-white font-bold shadow-sm">
            JD
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-slate-900 truncate">Juan Delgado</p>
            <p className="text-xs text-slate-500 truncate">Gerente {department}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
