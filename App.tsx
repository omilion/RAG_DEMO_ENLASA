
import React, { useState, useEffect } from 'react';
import { Sidebar, ViewType } from './components/Sidebar';
import { DashboardCard } from './components/DashboardCard';
import { AIChat } from './components/AIChat';
import { getEnergyNews, getLibraryDocuments, getUpcomingBirthdays } from './services/geminiService';


import { NewsItem, Birthday, ActionBadge } from './types';

import { MOCK_INDICATORS, MOCK_BIRTHDAYS, MOCK_LEGAL } from './constants';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
const DAILY_ACTIONS: ActionBadge[] = [
  { label: 'Nuevas contrataciones', count: 3, color: 'bg-green-100 text-green-700' },
  { label: 'Reportes generados', count: 12, color: 'bg-blue-100 text-blue-700' },
  { label: 'Actualizaciones legales', count: 5, color: 'bg-amber-100 text-amber-700' },
  { label: 'Bajas procesadas', count: 2, color: 'bg-slate-100 text-slate-700' },
];

const MOCK_MEETINGS = [
  { time: '09:00', title: 'Onboarding Nuevo Talento', room: 'Sala A', type: 'HR' },
  { time: '11:30', title: 'Revisión Salarial Q1', room: 'Remoto', type: 'Finanzas' },
  { time: '15:00', title: 'Comité de Ética', room: 'Sala B', type: 'Legal' },
  { time: '17:00', title: 'Planificación Anual BESS', room: 'Sala C', type: 'Operaciones' },
];

const CHART_DATA = [
  { name: 'Lun', value: 400 }, { name: 'Mar', value: 300 }, { name: 'Mie', value: 600 },
  { name: 'Jue', value: 800 }, { name: 'Vie', value: 500 }, { name: 'Sab', value: 900 }, { name: 'Dom', value: 700 },
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [realDocs, setRealDocs] = useState<{ documents: any[], folders: string[] }>({ documents: [], folders: [] });
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [birthdays, setBirthdays] = useState<Birthday[]>(MOCK_BIRTHDAYS);
  const department = "RRHH"; // Departamento que inicia el sistema



  useEffect(() => {
    const fetchNews = async () => {
      setLoadingNews(true);
      const data = await getEnergyNews();
      setNews(data);
      setLoadingNews(false);
    };
    const fetchBirthdays = async () => {
      const data = await getUpcomingBirthdays();
      if (data && data.length > 0) setBirthdays(data);
    };
    fetchNews();
    fetchBirthdays();
  }, []);


  useEffect(() => {
    if (currentView === 'documents') {
      const fetchDocs = async () => {
        const data = await getLibraryDocuments();
        setRealDocs(data);
      };
      fetchDocs();
    }
  }, [currentView]);


  // --- RENDERING VIEWS ---

  const renderDashboard = () => (
    <div className="grid grid-cols-12 gap-6 animate-in fade-in duration-500">
      <div className="col-span-12 lg:col-span-8 space-y-6">
        <div className="space-y-2 mb-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resumen de Acciones - Día Anterior</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {DAILY_ACTIONS.map((action, idx) => (
              <div key={idx} className={`p-4 rounded-2xl border border-transparent shadow-sm flex items-center justify-between font-bold text-sm ${action.color}`}>
                <span className="truncate">{action.label}</span>
                <span className="text-lg opacity-80">{action.count}</span>
              </div>
            ))}
          </div>
        </div>

        <DashboardCard title="Inteligencia Organizacional (RAG)" icon="🧠">
          <AIChat />
        </DashboardCard>
        <DashboardCard title="Calendario de Reuniones" icon="📅">
          <div className="space-y-4">
            {MOCK_MEETINGS.map((meeting, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className="flex flex-col items-center justify-center w-16 h-16 bg-enlasa-blue/5 rounded-xl shrink-0">
                  <span className="text-sm font-bold text-enlasa-blue">{meeting.time}</span>
                  <span className="text-[10px] text-enlasa-blue/60 font-medium">AM/PM</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-bold text-slate-800 truncate">{meeting.title}</h5>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">{meeting.room}</span>
                    <span className="text-[10px] text-slate-400">• {meeting.type}</span>
                  </div>
                </div>
                <button className="p-2 text-slate-400 hover:text-enlasa-blue transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
                </button>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
      <div className="col-span-12 lg:col-span-4 space-y-6">
        <DashboardCard title="Indicadores Económicos" icon="📈">
          <div className="grid grid-cols-2 gap-3">
            {MOCK_INDICATORS.map((indicator, idx) => (
              <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{indicator.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-bold text-slate-800">{indicator.value}</span>
                  <span className={`text-[10px] font-bold ${indicator.trend === 'up' ? 'text-red-500' : indicator.trend === 'down' ? 'text-green-500' : 'text-slate-400'}`}>
                    {indicator.trend === 'up' ? '▲' : indicator.trend === 'down' ? '▼' : '•'} {indicator.change}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard title="Noticias" icon="📰">
          {loadingNews ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-lg shrink-0"></div>
                  <div className="flex-1 space-y-2 py-1"><div className="h-3 bg-slate-100 rounded w-3/4"></div></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {news.map((item, idx) => (
                <a key={idx} href={item.url} target="_blank" rel="noopener noreferrer" className="group block space-y-3">
                  <div className="flex gap-4 items-start">
                    <div className="relative w-16 h-16 shrink-0 overflow-hidden rounded-xl border border-slate-100">
                      <img src={item.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=400'; }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-enlasa-blue transition-colors">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-enlasa-blue font-bold px-1.5 py-0.5 bg-enlasa-blue/5 rounded">{item.source}</span>
                        <span className="text-[10px] text-slate-400">{item.date}</span>
                      </div>
                    </div>
                  </div>
                  {item.excerpt && (
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 px-1 italic border-l-2 border-slate-100">{item.excerpt}</p>
                  )}
                </a>
              ))}
            </div>
          )}
        </DashboardCard>
        <DashboardCard title="Personal de Cumpleaños" icon="🎂" className="md:col-span-2">
          <div className="space-y-3">
            {birthdays.map((b, i) => (
              <div key={i} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <img
                    src={b.photo}
                    alt={b.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-slate-100"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(b.name)}&background=0E1B4D&color=fff`;
                    }}
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-800">{b.name}</p>
                    <p className="text-xs text-slate-400">{b.department}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-md ${b.date === 'Hoy' ? 'bg-enlasa-cyan/20 text-enlasa-blue' : 'bg-slate-100 text-slate-500'
                  }`}>{b.date}</span>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
    </div >
  );

  const renderAIAssistant = () => (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <DashboardCard title={`Enlasa Expert AI - Consultas Avanzadas`} icon="🤖" className="min-h-[700px]">
        <AIChat />
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:border-enlasa-blue transition-colors">
            <p className="text-xs font-bold text-enlasa-blue mb-1 uppercase tracking-wider">Sugerencia</p>
            <p className="text-sm text-slate-600 font-medium">"Resume la ley 21.305 para el equipo de planta"</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:border-enlasa-blue transition-colors">
            <p className="text-xs font-bold text-enlasa-blue mb-1 uppercase tracking-wider">Sugerencia</p>
            <p className="text-sm text-slate-600 font-medium">"¿Cuáles son los protocolos de seguridad en BESS?"</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:border-enlasa-blue transition-colors">
            <p className="text-xs font-bold text-enlasa-blue mb-1 uppercase tracking-wider">Sugerencia</p>
            <p className="text-sm text-slate-600 font-medium">"Analiza la rotación de personal en el Q3"</p>
          </div>
        </div>
      </DashboardCard>
    </div>
  );

  const renderDocuments = () => {
    const documentsArray = realDocs.documents || [];
    const foldersArray = realDocs.folders || [];

    const filteredDocs = activeFolder
      ? documentsArray.filter(d => d.folder === activeFolder)
      : documentsArray;

    return (
      <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {foldersArray.length > 0 ? foldersArray.map((folder, i) => (
            <button
              key={i}
              onClick={() => setActiveFolder(activeFolder === folder ? null : folder)}
              className={`p-6 rounded-2xl border transition-all text-left group ${activeFolder === folder ? 'bg-enlasa-blue border-enlasa-blue shadow-lg' : 'bg-white border-slate-200 hover:border-enlasa-blue'
                }`}
            >
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                📂
              </div>
              <h3 className={`font-bold mb-1 ${activeFolder === folder ? 'text-white' : 'text-slate-800'}`}>{folder}</h3>
              <p className={`text-xs ${activeFolder === folder ? 'text-white/70' : 'text-slate-400'}`}>
                {documentsArray.filter(d => d.folder === folder).length} archivos
              </p>
            </button>
          )) : (
            [1, 2, 3, 4].map(i => (
              <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 animate-pulse">
                <div className="w-12 h-12 bg-slate-200 rounded-xl mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              </div>
            ))
          )}
        </div>

        <DashboardCard title={activeFolder ? `Archivos en: ${activeFolder}` : "Base de Conocimientos Real"} icon="📂">
          <div className="divide-y divide-slate-100">
            {filteredDocs.length > 0 ? filteredDocs.map((doc, i) => (
              <div key={i} className="py-4 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {doc.type === 'PDF' ? '📕' : doc.type === 'XLSX' ? '📗' : '📑'}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-800 group-hover:text-enlasa-blue">{doc.name}</p>
                    <p className="text-xs text-slate-400">{doc.type} • {doc.segments} fragmentos inteligentes</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-[10px] bg-green-50 text-green-600 px-2 py-1 rounded-full font-bold uppercase">Sincronizado</span>
                </div>
              </div>
            )) : (
              <div className="py-10 text-center text-slate-400 text-sm italic">
                {documentsArray.length === 0 ? "Cargando documentos..." : "No hay archivos en esta categoría."}
              </div>
            )}
          </div>
        </DashboardCard>
      </div>
    );
  };



  const renderCollaborators = () => (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex gap-4 items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <button className="px-4 py-2 bg-slate-50 text-slate-600 rounded-lg text-sm font-bold hover:bg-enlasa-blue hover:text-white transition-all">Todos</button>
        <button className="px-4 py-2 bg-slate-50 text-slate-600 rounded-lg text-sm font-bold hover:bg-enlasa-blue hover:text-white transition-all">Planta Maule</button>
        <button className="px-4 py-2 bg-slate-50 text-slate-600 rounded-lg text-sm font-bold hover:bg-enlasa-blue hover:text-white transition-all">Solar Arica</button>
        <div className="flex-1"></div>
        <input type="text" placeholder="Buscar por nombre o cargo..." className="px-4 py-2 bg-slate-50 border-none rounded-lg text-sm w-64 focus:ring-2 focus:ring-enlasa-blue/20" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all text-center">
            <img src={`https://picsum.photos/seed/user${i}/150/150`} alt="" className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-enlasa-cyan/30" />
            <h4 className="font-bold text-slate-800">Colaborador {i}</h4>
            <p className="text-xs text-enlasa-blue font-bold uppercase mb-4">Ingeniero de Planta</p>
            <div className="flex justify-center gap-2">
              <button className="p-2 bg-slate-50 rounded-lg hover:bg-enlasa-blue/5">✉️</button>
              <button className="p-2 bg-slate-50 rounded-lg hover:bg-enlasa-blue/5">📞</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderNormative = () => (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          <DashboardCard title="Marco Legal del Sector Energía" icon="⚖️">
            <div className="space-y-6">
              {MOCK_LEGAL.map((law, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-100 hover:border-enlasa-blue transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-bold text-slate-800 text-lg">{law.title}</h5>
                    <span className="bg-green-100 text-green-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase">{law.status}</span>
                  </div>
                  <p className="text-sm text-slate-500 mb-4 leading-relaxed">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam...</p>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-enlasa-blue">{law.category}</span>
                    <span className="text-xs text-slate-400">• Publicada hace 3 meses</span>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
        <div className="col-span-4 space-y-6">
          <div className="bg-enlasa-blue rounded-2xl p-6 text-white shadow-xl shadow-blue-200">
            <h4 className="font-bold text-lg mb-2">Alertas Legales</h4>
            <p className="text-sm text-white/80 mb-4">Hay 2 nuevas regulaciones en revisión que podrían afectar la operación del Q4.</p>
            <button className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold transition-all">Ver Alertas</button>
          </div>
          <DashboardCard title="Accesos Rápidos" icon="🔗">
            <ul className="space-y-2 text-sm text-slate-600 font-medium">
              <li className="hover:text-enlasa-blue cursor-pointer transition-colors">• Diario Oficial</li>
              <li className="hover:text-enlasa-blue cursor-pointer transition-colors">• Ministerio de Energía</li>
              <li className="hover:text-enlasa-blue cursor-pointer transition-colors">• CNE Chile</li>
            </ul>
          </DashboardCard>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <DashboardCard title="Configuración del Sistema" icon="⚙️">
        <div className="space-y-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800">Notificaciones Inteligentes</p>
              <p className="text-xs text-slate-500">Recibir alertas de la IA sobre desviaciones en KPIs.</p>
            </div>
            <div className="w-12 h-6 bg-enlasa-cyan rounded-full relative"><div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm"></div></div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-50 pt-6">
            <div>
              <p className="font-bold text-slate-800">Idioma del Ecosistema</p>
              <p className="text-xs text-slate-500">Ajustar la localización de la plataforma.</p>
            </div>
            <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 text-sm outline-none">
              <option>Español (Chile)</option>
              <option>English (Global)</option>
            </select>
          </div>
          <div className="border-t border-slate-50 pt-6">
            <p className="font-bold text-slate-800 mb-4">Seguridad de la Cuenta</p>
            <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:brightness-125 transition-all">Cambiar Contraseña</button>
            <button className="ml-4 text-red-500 text-sm font-bold hover:underline">Cerrar Sesión</button>
          </div>
        </div>
      </DashboardCard>
    </div>
  );

  const getContent = () => {
    switch (currentView) {
      case 'dashboard': return renderDashboard();
      case 'ai-assistant': return renderAIAssistant();
      case 'documents': return renderDocuments();
      case 'collaborators': return renderCollaborators();
      case 'normative': return renderNormative();
      case 'settings': return renderSettings();
      default: return renderDashboard();
    }
  };

  const getTitle = () => {
    switch (currentView) {
      case 'dashboard': return `Panel de ${department}`;
      case 'ai-assistant': return `Enlasa Intelligence Assistant - ${department} EXPERT`;
      case 'documents': return 'Gestión Documental';
      case 'collaborators': return 'Directorio de Colaboradores';
      case 'normative': return 'Cumplimiento Legal y Normativo';
      case 'settings': return 'Configuración de Usuario';
      default: return department;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} department={department} />

      <main className="flex-1 ml-64 p-8">
        <header className="mb-8 flex justify-between items-end">
          <div className="animate-in slide-in-from-left-4 duration-500">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-enlasa-cyan/20 text-enlasa-blue text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                Enlasa Digital Ecosystem
              </span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{getTitle()}</h1>
            <p className="text-slate-500 mt-1">Gestión inteligente para el futuro de la energía.</p>
          </div>
          <div className="flex gap-3">
            <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth="2" /></svg>
              Reporte Mensual
            </button>
            <button className="bg-enlasa-blue text-white px-4 py-2 rounded-xl text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-blue-200">
              Nueva Solicitud
            </button>
          </div>
        </header>

        <div className="transition-all duration-300">
          {getContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
