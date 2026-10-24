/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CompanyConfig, PESVLevel, PESVUser, PESVCompany } from './types';
import ClassificationModule from './components/ClassificationModule';
import StepsModule from './components/StepsModule';
import IntegrationsModule from './components/IntegrationsModule';
import DashboardModule from './components/DashboardModule';
import ImprovementModule from './components/ImprovementModule';
import AuditModule from './components/AuditModule';
import LoginModule from './components/LoginModule';
import SuperAdminModule from './components/SuperAdminModule';
import Step11PublicPortalModal from './components/Step11PublicPortalModal';
import { Step12PublicPortalModal } from './components/Step12EmergencyModule';
import { Step15PublicTripRegistrationModal } from './components/Step15TripPlanningModule';
import { 
  ShieldCheck, Truck, BarChart3, Wrench, ShieldAlert, Award, FileText, 
  Info, LogOut, ClipboardCheck, User, Building2, LayoutDashboard, Undo2, Key, HelpCircle,
  Cloud, CloudCheck
} from 'lucide-react';
import { 
  subscribeToCompanies, 
  saveCompanyToFirestore, 
  deleteCompanyFromFirestore, 
  saveSystemSetting, 
  getSystemSetting 
} from './services/firestoreService';

const EMPTY_COMPANY_FALLBACK: PESVCompany = {
  id: 'empresa_principal',
  name: 'Empresa Principal',
  nit: '000.000.000-0',
  logo: '🏢',
  adminEmail: 'admin@empresa.com',
  config: {
    misionalidad: 'TRANSPORTE',
    motos: 0,
    carros: 0,
    camiones: 0,
    buses: 0,
    conductoresContratados: 0,
    conductoresAdministrados: 0,
    totalVehiculos: 0,
    totalConductores: 0,
    nivelCalculado: 'BÁSICO'
  }
};

export default function App() {
  // Authentication & Session states
  const [currentUser, setCurrentUser] = useState<PESVUser | null>(() => {
    const savedUser = localStorage.getItem('pesv_current_user');
    if (savedUser) {
      try { return JSON.parse(savedUser); } catch (e) {}
    }
    return null;
  });

  const [companies, setCompanies] = useState<PESVCompany[]>(() => {
    const savedCompanies = localStorage.getItem('pesv_companies');
    if (savedCompanies) {
      try {
        const parsed = JSON.parse(savedCompanies);
        if (parsed && Array.isArray(parsed)) {
          const filtered = parsed.filter((c: PESVCompany) => c.id !== 'colombia_transportes');
          return filtered;
        }
      } catch (e) {}
    }
    return [];
  });

  // Active Company Context being viewed
  const [currentCompanyId, setCurrentCompanyId] = useState<string>(() => {
    const saved = localStorage.getItem('pesv_active_company_id');
    if (saved && saved !== 'colombia_transportes') return saved;
    return '';
  });

  // Navigation tab
  const [activeTab, setActiveTab] = useState<string>('classification');

  // Cross-module tab navigation listener
  useEffect(() => {
    const handleNav = (e: any) => {
      const target = e?.detail?.tab;
      if (target === 'steps' || target === 'classification') {
        setActiveTab('classification');
      } else if (target) {
        setActiveTab(target);
      }
    };
    window.addEventListener('pesv_navigate_tab', handleNav);
    return () => window.removeEventListener('pesv_navigate_tab', handleNav);
  }, []);

  // Firestore Realtime Subscription for Companies
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);

  useEffect(() => {
    // Listen to real-time changes in Firestore
    const unsubscribe = subscribeToCompanies((cloudCompanies) => {
      if (cloudCompanies && cloudCompanies.length > 0) {
        setCompanies(cloudCompanies);
        setIsCloudConnected(true);
      }
    });

    // Check superadmin password from Firestore
    getSystemSetting('super_admin_config').then((data: any) => {
      if (data?.password) {
        localStorage.setItem('pesv_super_password', data.password);
      }
    }).catch(() => {});

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Keep localStorage updated as offline cache
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('pesv_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('pesv_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('pesv_companies', JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem('pesv_active_company_id', currentCompanyId);
  }, [currentCompanyId]);

  // Derive current company from state
  const activeCompany = companies.find(c => c.id === currentCompanyId) || companies[0] || EMPTY_COMPANY_FALLBACK;

  // Handle updates to company config (fleet count, misionalidad)
  const handleUpdateConfig = (newConfig: CompanyConfig) => {
    setCompanies(prev => prev.map(c => {
      if (c.id === activeCompany.id) {
        const updated = { ...c, config: newConfig };
        saveCompanyToFirestore(updated).catch(err => console.error('Cloud save failed:', err));
        return updated;
      }
      return c;
    }));
  };

  // Login handler
  const handleLogin = (user: PESVUser, companyId?: string) => {
    setCurrentUser(user);
    if (companyId) {
      setCurrentCompanyId(companyId);
      setActiveTab('classification');
    } else {
      // If superadmin, default to their management view
      setActiveTab('superadmin');
    }
  };

  // Logout handler
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pesv_current_user');
  };

  // Add dynamic company from Superadmin
  const handleAddCompany = (newComp: PESVCompany) => {
    setCompanies(prev => [...prev, newComp]);
    saveCompanyToFirestore(newComp).catch(err => console.error('Error saving company to Firestore:', err));
  };

  // Update company logo
  const handleUpdateCompanyLogo = (companyId: string, newLogo: string) => {
    setCompanies(prev => prev.map(c => {
      if (c.id === companyId) {
        const updated = { ...c, logo: newLogo };
        saveCompanyToFirestore(updated).catch(err => console.error('Error saving company logo to Firestore:', err));
        return updated;
      }
      return c;
    }));
  };

  // Delete company
  const handleDeleteCompany = (id: string) => {
    setCompanies(prev => prev.filter(c => c.id !== id));
    deleteCompanyFromFirestore(id).catch(err => console.error('Error deleting company from Firestore:', err));
    if (currentCompanyId === id) {
      setCurrentCompanyId('');
    }
  };

  // Profile editing states
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileStatus, setProfileStatus] = useState<string | null>(null);

  const openProfileModal = () => {
    setProfileName(currentUser?.name || '');
    setProfileEmail(currentUser?.email || '');
    if (currentUser?.role === 'SUPER_ADMIN') {
      setProfilePassword(localStorage.getItem('pesv_super_password') || 'Kiki-2026*');
    } else {
      setProfilePassword(activeCompany.adminPassword || 'admin');
    }
    setProfileStatus(null);
    setIsProfileModalOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileEmail.trim() || !profilePassword.trim()) {
      alert('Email y Contraseña son campos requeridos.');
      return;
    }

    if (currentUser?.role === 'SUPER_ADMIN') {
      localStorage.setItem('pesv_super_password', profilePassword.trim());
      saveSystemSetting('super_admin_config', {
        password: profilePassword.trim(),
        email: profileEmail.trim().toLowerCase(),
        name: profileName.trim()
      }).catch(err => console.error('Cloud save admin setting failed:', err));
      setCurrentUser({
        ...currentUser,
        name: profileName.trim(),
        email: profileEmail.trim().toLowerCase(),
      });
    } else {
      // Save Company Admin changes
      const updatedCompanies = companies.map(c => {
        if (c.id === activeCompany.id) {
          const updated = {
            ...c,
            adminEmail: profileEmail.trim().toLowerCase(),
            adminPassword: profilePassword.trim(),
          };
          saveCompanyToFirestore(updated).catch(err => console.error('Cloud save failed:', err));
          return updated;
        }
        return c;
      });
      setCompanies(updatedCompanies);

      // Update session user
      setCurrentUser({
        ...currentUser,
        name: profileName.trim(),
        email: profileEmail.trim().toLowerCase(),
      });
    }

    setProfileStatus('¡Perfil actualizado con éxito!');
    setTimeout(() => {
      setIsProfileModalOpen(false);
    }, 1200);
  };

  // Public QR / Link Portal for Step 11 (¿Cómo Conduzco? & Evaluación Digital)
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const publicCanal = searchParams?.get('canal');
  if (publicCanal === 'como-conduzco' || publicCanal === 'evaluacion-digital') {
    const queryNit = searchParams?.get('nit') || activeCompany.nit || '901.452.883-1';
    const queryEmpresa = searchParams?.get('empresa') || activeCompany.name || 'Transportes Integrados de Colombia S.A.S.';
    const queryDriverId = searchParams?.get('conductorId') || undefined;
    const queryDriverName = searchParams?.get('conductor') || undefined;
    return (
      <Step11PublicPortalModal
        mode={publicCanal === 'evaluacion-digital' ? 'evaluaciones' : 'reporte'}
        companyName={queryEmpresa}
        companyNit={queryNit}
        companyLogo={activeCompany.logo}
        initialDriverId={queryDriverId}
        initialDriverName={queryDriverName}
        isStandalonePage={true}
        onClose={() => {
          window.history.replaceState({}, '', window.location.pathname);
          window.location.reload();
        }}
      />
    );
  }

  if (publicCanal === 'protocolo-pas' || publicCanal === 'reporte-siniestro') {
    const queryNit = searchParams?.get('nit') || activeCompany.nit || '901.452.883-1';
    const queryEmpresa = searchParams?.get('empresa') || activeCompany.name || 'Transportes Integrados de Colombia S.A.S.';
    return (
      <Step12PublicPortalModal
        mode={publicCanal === 'reporte-siniestro' ? 'reporte-siniestro' : 'protocolo-pas'}
        companyName={queryEmpresa}
        companyNit={queryNit}
        companyLogo={activeCompany.logo}
        isStandalonePage={true}
        onClose={() => {
          window.history.replaceState({}, '', window.location.pathname);
          window.location.reload();
        }}
      />
    );
  }

  if (publicCanal === 'registro-viaje-tercero') {
    const queryNit = searchParams?.get('nit') || activeCompany.nit || '901.452.883-1';
    const queryEmpresa = searchParams?.get('empresa') || activeCompany.name || 'Transportes Integrados de Colombia S.A.S.';
    return (
      <Step15PublicTripRegistrationModal
        companyName={queryEmpresa}
        companyNit={queryNit}
        companyLogo={activeCompany.logo}
        isStandalonePage={true}
        onClose={() => {
          window.history.replaceState({}, '', window.location.pathname);
          window.location.reload();
        }}
      />
    );
  }

  // Render Login Module if not authenticated
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between" id="app-auth-wrapper">
        <div className="bg-slate-900 text-white border-b border-slate-950 px-6 py-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-lg text-white">
              <ShieldCheck size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-extrabold tracking-wide uppercase">RESOLUCIÓN 40595 DE 2022</span>
                <span className="text-[10px] text-slate-400 font-medium">Ministerio de Transporte de Colombia</span>
              </div>
              <h1 className="text-xl font-extrabold tracking-tight mt-0.5">Plataforma Inteligente PESV</h1>
            </div>
          </div>
        </div>

        <LoginModule onLogin={handleLogin} companies={companies} />

        <footer className="bg-white border-t border-gray-100 py-6 text-center text-xs text-gray-400" id="auth-footer">
          <p>© 2026 Plataforma de Gestión PESV Colombiana • Diseñado conforme a la Resolución 40595 de 2022 del Ministerio de Transporte</p>
        </footer>
      </div>
    );
  }

  // Check if we are showing a company's PESV context vs Superadmin Panel
  const isViewingSuperadminPanel = currentUser.role === 'SUPER_ADMIN' && activeTab === 'superadmin';

  const handleNavigateToStep = (stepId: number) => {
    setActiveTab('classification');
    localStorage.setItem('pesv_target_step_id', String(stepId));
    window.dispatchEvent(new CustomEvent('pesv_activate_step', { detail: { stepId } }));
  };

  const handleNavigateToIndicators = () => {
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-emerald-100 selection:text-emerald-900" id="app-root">
      
      {/* Banner de Cabecera Colombiano / Institucional */}
      <div className="bg-slate-900 text-white border-b border-slate-950 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm" id="gov-header">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-lg text-white shrink-0">
            {isViewingSuperadminPanel ? <Key size={26} /> : <ShieldCheck size={26} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-extrabold tracking-wide uppercase">RESOLUCIÓN 40595 DE 2022</span>
              {currentUser.role === 'SUPER_ADMIN' ? (
                <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-extrabold tracking-wide uppercase">SUPERADMINISTRADOR</span>
              ) : (
                <span className="text-[10px] text-slate-400 font-medium">Empresa: {activeCompany.name}</span>
              )}
            </div>
            <h1 className="text-xl font-extrabold tracking-tight mt-0.5">
              {isViewingSuperadminPanel ? 'Consola de Control Global PESV' : `PESV: ${activeCompany.name}`}
            </h1>
          </div>
        </div>

        {/* Resumen de Estado de la Flota (Only visible when viewing a company PESV) */}
        {!isViewingSuperadminPanel && (
          <div className="flex flex-wrap items-center gap-4 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/40 text-xs">
            {/* Logo/Avatar clickable to upload/change logo */}
            <label
              className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-sm font-bold text-slate-800 border border-white/20 overflow-hidden cursor-pointer relative group shrink-0 shadow-xs"
              title="Haz clic para cargar o actualizar el logo de la empresa"
            >
              {activeCompany.logo && (activeCompany.logo.startsWith('http') || activeCompany.logo.startsWith('data:image/')) ? (
                <img src={activeCompany.logo} alt={activeCompany.name} className="w-full h-full object-contain p-0.5" />
              ) : (
                <span>{activeCompany.logo || '🏢'}</span>
              )}
              <div className="absolute inset-0 bg-slate-900/70 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[7.5px] font-bold text-center leading-none p-0.5">
                Logo
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file || !file.type.startsWith('image/')) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const raw = ev.target?.result as string;
                    const img = new Image();
                    img.onload = () => {
                      const canvas = document.createElement('canvas');
                      const maxDim = 260;
                      let w = img.width || 200;
                      let h = img.height || 200;
                      if (w > maxDim || h > maxDim) {
                        if (w > h) {
                          h = Math.round((h * maxDim) / w);
                          w = maxDim;
                        } else {
                          w = Math.round((w * maxDim) / h);
                          h = maxDim;
                        }
                      }
                      canvas.width = w;
                      canvas.height = h;
                      const ctx = canvas.getContext('2d');
                      if (ctx) {
                        ctx.clearRect(0, 0, w, h);
                        ctx.drawImage(img, 0, 0, w, h);
                        handleUpdateCompanyLogo(activeCompany.id, canvas.toDataURL('image/png'));
                      } else {
                        handleUpdateCompanyLogo(activeCompany.id, raw);
                      }
                    };
                    img.src = raw;
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>
            
            <div className="px-2 border-r border-slate-700/60">
              <span className="text-slate-400 block text-[9px] uppercase font-bold">NIT</span>
              <span className="font-semibold text-white truncate">{activeCompany.nit}</span>
            </div>

            <div className="px-2 border-r border-slate-700/60">
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Misionalidad</span>
              <span className="font-semibold text-white truncate">
                {activeCompany.config.misionalidad === 'TRANSPORTE' ? 'Transporte' : 'Diferente al transporte'}
              </span>
            </div>
            <div className="px-2 border-r border-slate-700/60">
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Flota / Conductores</span>
              <span className="font-semibold text-white">
                {activeCompany.config.totalVehiculos} Veh. / {activeCompany.config.totalConductores} Cond.
              </span>
            </div>
            <div className="px-2">
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Nivel PESV</span>
              <span className="font-extrabold text-emerald-400 flex items-center gap-1">
                <Award size={12} /> {activeCompany.config.nivelCalculado}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Navegación Principal de Pestañas (Tab Controller) */}
      <div className="bg-white border-b border-gray-100 px-6 py-2 sticky top-0 z-40 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3" id="main-navigation-tabs">
        <div className="flex overflow-x-auto space-x-1.5 custom-scrollbar pb-1.5 sm:pb-0 w-full sm:w-auto">
          
          {/* Superadmin Tab for Superadmin users only */}
          {currentUser.role === 'SUPER_ADMIN' && (
            <button
              type="button"
              id="tab-btn-superadmin"
              onClick={() => setActiveTab('superadmin')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'superadmin'
                  ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/10'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard size={14} />
              Panel General de Empresas
            </button>
          )}

          {/* Regular Company PESV modules. Available to all PESV Admins, and Superadmins who have loaded a company context */}
          {(!isViewingSuperadminPanel) && (
            <>
              <button
                type="button"
                id="tab-btn-classification"
                onClick={() => setActiveTab('classification')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'classification'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/10'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Truck size={14} />
                1. Clasificación y Pasos PESV
              </button>

              <button
                type="button"
                id="tab-btn-integrations"
                onClick={() => setActiveTab('integrations')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'integrations'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/10'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Wrench size={14} />
                2. Alertas y Vencimientos
              </button>

              <button
                type="button"
                id="tab-btn-dashboard"
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/10'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <BarChart3 size={14} />
                3. Indicadores de Gestión
              </button>

              <button
                type="button"
                id="tab-btn-improvement"
                onClick={() => setActiveTab('improvement')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'improvement'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/10'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <ShieldAlert size={14} />
                4. Mejora Continua (PHVA)
              </button>

              <button
                type="button"
                id="tab-btn-audit"
                onClick={() => setActiveTab('audit')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'audit'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/10'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <ClipboardCheck size={14} />
                5. Paso 22: Auditoría Anual
              </button>
            </>
          )}
        </div>

        {/* User profile & Log Out */}
        <div className="flex items-center gap-3 shrink-0 text-xs font-bold w-full sm:w-auto justify-between border-t border-gray-100 pt-2 sm:border-none sm:pt-0">
          
          <div className="flex items-center gap-2">
            {/* Show a Quick-return to super admin button if superadmin is inspecting a company's PESV */}
            {currentUser.role === 'SUPER_ADMIN' && !isViewingSuperadminPanel && (
              <button
                type="button"
                onClick={() => setActiveTab('superadmin')}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10.5px] cursor-pointer transition-all border border-slate-200"
              >
                <Undo2 size={12} />
                Regresar Panel
              </button>
            )}

            <button
              type="button"
              onClick={openProfileModal}
              title="Editar mi perfil de acceso"
              className="flex items-center gap-1.5 text-gray-600 hover:text-emerald-600 cursor-pointer transition-all border border-transparent hover:border-gray-200 hover:bg-slate-50 rounded-lg px-2 py-1"
            >
              <User size={13} className="text-emerald-600" />
              <span className="truncate max-w-[120px]" title={currentUser.name || currentUser.email}>
                {currentUser.name || currentUser.email}
              </span>
            </button>

            {/* Cloud Database Connected Badge */}
            <div className="hidden lg:flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold" title="Conectado a Firebase Cloud Firestore en tiempo real">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <Cloud size={11} className="text-emerald-600" />
              <span>Firebase Cloud</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg cursor-pointer transition-all border border-red-200"
          >
            <LogOut size={12} />
            Salir
          </button>
        </div>
      </div>

      {/* Área de Trabajo Principal */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto" id="main-content-area">
        
        {/* Render Superadmin Management Panel */}
        {currentUser.role === 'SUPER_ADMIN' && activeTab === 'superadmin' && (
          <div id="view-superadmin">
            <SuperAdminModule 
              companies={companies}
              onAddCompany={handleAddCompany}
              onDeleteCompany={handleDeleteCompany}
              onUpdateCompanyLogo={handleUpdateCompanyLogo}
              onSelectCompany={(company) => {
                setCurrentCompanyId(company.id);
                setActiveTab('classification');
              }}
            />
          </div>
        )}

        {activeTab === 'classification' && !isViewingSuperadminPanel && (
          <div className="space-y-8" id="view-classification">
            {/* MÓDULO 1: Clasificación de la empresa */}
            <ClassificationModule config={activeCompany.config} onUpdateConfig={handleUpdateConfig} />
            
            {/* MÓDULO 2: Estructura de pasos normativos */}
            <div className="border-t border-gray-200 pt-8" id="view-steps-divider">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900">Estructura Detallada del PESV ({activeCompany.config.nivelCalculado})</h3>
                <p className="text-xs text-gray-500 mt-1">Explora las 4 fases de implementación. El sistema ha priorizado los pasos de acuerdo con tu nivel normativo.</p>
              </div>
              <StepsModule 
                config={activeCompany.config} 
                companyName={activeCompany.name}
                companyNit={activeCompany.nit}
                companyLogo={activeCompany.logo}
                onNavigateToIndicators={handleNavigateToIndicators} 
              />
            </div>
          </div>
        )}

        {activeTab === 'integrations' && !isViewingSuperadminPanel && (
          <div id="view-integrations">
            <IntegrationsModule 
              companyName={activeCompany.name}
              companyNit={activeCompany.nit}
              companyLogo={activeCompany.logo}
            />
          </div>
        )}

        {activeTab === 'dashboard' && !isViewingSuperadminPanel && (
          <div id="view-dashboard">
            <DashboardModule 
              config={activeCompany.config} 
              companyName={activeCompany.name}
              companyNit={activeCompany.nit}
              companyLogo={activeCompany.logo}
              onNavigateToStep={handleNavigateToStep} 
            />
          </div>
        )}

        {activeTab === 'improvement' && !isViewingSuperadminPanel && (
          <div id="view-improvement">
            <ImprovementModule />
          </div>
        )}

        {activeTab === 'audit' && !isViewingSuperadminPanel && (
          <div id="view-audit">
            <AuditModule 
              config={activeCompany.config} 
              companyName={activeCompany.name}
              companyNit={activeCompany.nit}
              companyLogo={activeCompany.logo}
            />
          </div>
        )}

      </main>

      {/* Pie de Página */}
      <footer className="bg-white border-t border-gray-100 py-6 text-center text-xs text-gray-400 mt-12" id="app-footer">
        <p>© 2026 Plataforma de Gestión PESV Colombiana • Diseñado conforme a la Resolución 40595 de 2022 del Ministerio de Transporte</p>
        <p className="text-[10px] text-gray-400 mt-1">Herramientas de Integración de Datos para Ingeniería de Tránsito y Seguridad Vial</p>
      </footer>

      {/* MODAL DE EDICIÓN DE PERFIL */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4" id="profile-modal-overlay">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-150 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150" id="profile-modal-card">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">Editar Perfil de Acceso</h3>
                <p className="text-[10.5px] text-gray-500 font-medium">Modifique las credenciales que usará para ingresar al sistema.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            {profileStatus && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-2.5 rounded-lg font-semibold flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                {profileStatus}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-1">Correo Electrónico (Usuario)</label>
                <input
                  type="email"
                  required
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium text-slate-800"
                  disabled={currentUser?.role === 'SUPER_ADMIN'} // keep superadmin email protected or editable
                />
                {currentUser?.role === 'SUPER_ADMIN' && (
                  <span className="text-[9.5px] text-gray-400 block mt-1">
                    El correo del Superadministrador principal está fijado a la cuenta institucional.
                  </span>
                )}
              </div>

              <div>
                <label className="block text-gray-700 mb-1">Nueva Contraseña</label>
                <input
                  type="text"
                  required
                  value={profilePassword}
                  onChange={(e) => setProfilePassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-slate-800"
                  placeholder="Mínimo 4 caracteres"
                />
                <span className="text-[9.5px] text-gray-400 block mt-1">
                  Esta será su nueva contraseña para los próximos inicios de sesión.
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="flex-1 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Guardar Cambios
                </button>
              </div>

            </form>

          </div>
        </div>
      )}
    </div>
  );
}
