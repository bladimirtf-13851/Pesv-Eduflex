/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, ExternalLink, RefreshCw, CheckCircle2, 
  Link as LinkIcon, Cpu, Check, Plus, Trash2, Edit, Search, 
  Clock, Calendar, Award, Globe, Activity, Eye, Key,
  Copy, X, Save, RotateCcw
} from 'lucide-react';
import { 
  PESVTrainingIntegrationConfig, 
  PESVTrainingSession, 
  PESVDriverCompetencyProfile 
} from '../types';

interface Step10TrainingModuleProps {
  companyName: string;
  companyLogo?: string;
  companyNit?: string;
  repLegal: string;
  leaderName: string;
  repSignatureImg1?: string;
  leaderSignatureImg?: string;
  onNavigateToIndicators?: () => void;
}

const DEFAULT_EXTERNAL_APP_URL = 'https://plan-de-capacitaciones-production-eeba.up.railway.app';

const SEED_PROFILES: PESVDriverCompetencyProfile[] = [
  {
    id: 'PROF-01',
    cargo: 'Conductor de Carga Pesada y Furgones',
    tipoLicencia: 'C2 / C3 Vigente',
    escolaridadMinima: 'Bachiller Académico',
    experienciaMinimaMeses: 36,
    examenTeoricoRequerido: true,
    examenPracticoRequerido: true,
    examenMedicoRequerido: 'Psicosensométrico anual (Visiometría, Audiometría, Coordinación Motriz)',
    cursosObligatorios: ['Manejo Defensivo', 'Mecánica Básica y Preoperacional', 'Normatividad y Código Nacional', 'Gestión de Fatiga y Velocidad'],
    frecuenciaReentrenamientoMeses: 12
  },
  {
    id: 'PROF-02',
    cargo: 'Conductor de Reparto Urbano y Última Milla',
    tipoLicencia: 'C1 / C2 Vigente',
    escolaridadMinima: 'Bachiller Académico',
    experienciaMinimaMeses: 24,
    examenTeoricoRequerido: true,
    examenPracticoRequerido: true,
    examenMedicoRequerido: 'Psicosensométrico anual (Visiometría, Audiometría, Coordinación Motriz)',
    cursosObligatorios: ['Manejo Defensivo', 'Preoperacional Diario', 'Primeros Auxilios en Vía', 'Control de Distracciones'],
    frecuenciaReentrenamientoMeses: 12
  },
  {
    id: 'PROF-03',
    cargo: 'Mensajero Motorizado y Domiciliario',
    tipoLicencia: 'A2 Vigente (Sin comparendos pendientes)',
    escolaridadMinima: 'Educación Básica Secundaria',
    experienciaMinimaMeses: 18,
    examenTeoricoRequerido: true,
    examenPracticoRequerido: true,
    examenMedicoRequerido: 'Psicosensométrico anual y equilibrio vestibular',
    cursosObligatorios: ['Conducción Preventiva en Moto', 'Uso de EPP y Casco Reglamentario', 'Mecánica de Motocicleta', 'Primeros Auxilios'],
    frecuenciaReentrenamientoMeses: 12
  },
  {
    id: 'PROF-04',
    cargo: 'Personal Administrativo con Conducción en Misión',
    tipoLicencia: 'B1 / C1 Vigente',
    escolaridadMinima: 'Técnico / Profesional',
    experienciaMinimaMeses: 12,
    examenTeoricoRequerido: true,
    examenPracticoRequerido: false,
    examenMedicoRequerido: 'Examen médico ocupacional periódico con énfasis osteomuscular y visual',
    cursosObligatorios: ['Sensibilización en Seguridad Vial', 'Velocidad y Factores de Distracción'],
    frecuenciaReentrenamientoMeses: 24
  }
];

const SUGGESTED_COURSES = [
  'Manejo Defensivo',
  'Mecánica Básica y Preoperacional',
  'Normatividad y Código Nacional',
  'Gestión de Fatiga y Velocidad',
  'Primeros Auxilios en Vía',
  'Control de Distracciones',
  'Conducción Preventiva en Moto',
  'Uso de EPP y Casco Reglamentario',
  'Atención de Emergencias Viales',
  'Sensibilización en Seguridad Vial',
  'Transporte Seguro de Carga'
];

const SEED_TRAINING_SESSIONS: PESVTrainingSession[] = [
  {
    id: 'CAP-2026-001',
    codigoCurso: 'CUR-MD-01',
    nombreCurso: 'Manejo Defensivo, Técnicas de Anticipación y Frenado Seguro',
    moduloObligatorio: 'Manejo Defensivo',
    fecha: '2026-02-14',
    instructorOEntidad: 'Aplicativo LMS Plan de Capacitaciones / ARL Sura',
    duracionHoras: 8,
    modalidad: 'Virtual / E-learning',
    totalConductoresCitados: 28,
    totalConductoresAsistentes: 27,
    totalConductoresAprobados: 26,
    origen: 'Aplicativo Externo LMS',
    urlCertificados: 'https://plan-de-capacitaciones-production-eeba.up.railway.app/certificados/md-01',
    estado: 'Ejecutada',
    temarioResumen: 'Distancia de seguimiento (regla de los 3 segundos), frenado en seco y mojado, puntos ciegos y maniobras evasivas.'
  },
  {
    id: 'CAP-2026-002',
    codigoCurso: 'CUR-MEC-02',
    nombreCurso: 'Mecánica Básica e Inspección Diaria Preoperacional de Flota',
    moduloObligatorio: 'Mecánica Básica',
    fecha: '2026-03-20',
    instructorOEntidad: 'Aplicativo LMS Plan de Capacitaciones / Taller Máster',
    duracionHoras: 6,
    modalidad: 'Práctica en Vía',
    totalConductoresCitados: 28,
    totalConductoresAsistentes: 26,
    totalConductoresAprobados: 25,
    origen: 'Aplicativo Externo LMS',
    urlCertificados: 'https://plan-de-capacitaciones-production-eeba.up.railway.app/certificados/mec-02',
    estado: 'Ejecutada',
    temarioResumen: 'Chequeo de fluidos, sistema de frenos neumáticos e hidráulicos, desgaste y presión de llantas, luces reglamentarias.'
  },
  {
    id: 'CAP-2026-003',
    codigoCurso: 'CUR-TRANS-03',
    nombreCurso: 'Código Nacional de Tránsito (Ley 769) y Señalización Vial',
    moduloObligatorio: 'Normas de Tránsito',
    fecha: '2026-05-18',
    instructorOEntidad: 'Aplicativo LMS Plan de Capacitaciones HSEQ',
    duracionHoras: 6,
    modalidad: 'Virtual / E-learning',
    totalConductoresCitados: 28,
    totalConductoresAsistentes: 28,
    totalConductoresAprobados: 28,
    origen: 'Aplicativo Externo LMS',
    urlCertificados: 'https://plan-de-capacitaciones-production-eeba.up.railway.app/certificados/trans-03',
    estado: 'Ejecutada',
    temarioResumen: 'Límites de velocidad urbanos y en carretera (Ley 2251), prelaciones en glorietas, semaforización y régimen sancionatorio.'
  },
  {
    id: 'CAP-2026-004',
    codigoCurso: 'CUR-PA-04',
    nombreCurso: 'Primeros Auxilios y Atención Inicial de Siniestros Viales (PAS)',
    moduloObligatorio: 'Primeros Auxilios',
    fecha: '2026-06-22',
    instructorOEntidad: 'Cruz Roja Colombiana / Brigada PESV',
    duracionHoras: 8,
    modalidad: 'Presencial',
    totalConductoresCitados: 28,
    totalConductoresAsistentes: 25,
    totalConductoresAprobados: 25,
    origen: 'Manual',
    urlCertificados: '',
    estado: 'Ejecutada',
    temarioResumen: 'Protocolo Proteger-Avisar-Socorrer (PAS), control de hemorragias, inmovilización cervical y uso del botiquín reglamentario.'
  },
  {
    id: 'CAP-2026-005',
    codigoCurso: 'CUR-FAT-05',
    nombreCurso: 'Control de Fatiga, Higiene del Sueño y Pausas Activas en Ruta',
    moduloObligatorio: 'Fatiga y Velocidad',
    fecha: '2026-08-15',
    instructorOEntidad: 'Aplicativo LMS Plan de Capacitaciones HSEQ',
    duracionHoras: 4,
    modalidad: 'Virtual / E-learning',
    totalConductoresCitados: 28,
    totalConductoresAsistentes: 27,
    totalConductoresAprobados: 26,
    origen: 'Aplicativo Externo LMS',
    urlCertificados: 'https://plan-de-capacitaciones-production-eeba.up.railway.app/certificados/fat-05',
    estado: 'Ejecutada',
    temarioResumen: 'Microsueños, síntomas de fatiga, descansos obligatorios de 15 min cada 2 horas de conducción y nutrición en viaje.'
  },
  {
    id: 'CAP-2026-006',
    codigoCurso: 'CUR-EMERG-06',
    nombreCurso: 'Plan de Respuesta ante Emergencias en Ruta y Mercancías Peligrosas',
    moduloObligatorio: 'Emergencias en Vía',
    fecha: '2026-10-10',
    instructorOEntidad: 'Aplicativo LMS Plan de Capacitaciones HSEQ',
    duracionHoras: 6,
    modalidad: 'Mixta',
    totalConductoresCitados: 28,
    totalConductoresAsistentes: 0,
    totalConductoresAprobados: 0,
    origen: 'Aplicativo Externo LMS',
    urlCertificados: '',
    estado: 'Programada',
    temarioResumen: 'Derrames de combustible, conatos de incendio con extintor tipo ABC, señalización con conos y comunicación con aseguradora.'
  }
];

export default function Step10TrainingModule(_props: Step10TrainingModuleProps) {
  // Main Tab within Step 10 (Indicadores Normativos y Acta/Informe Oficial eliminados porque se gestionan en el Paso 20 y Auditoría)
  const [activeTab, setActiveTab] = useState<'integracion' | 'cronograma' | 'perfiles'>('integracion');

  // Integration Configuration State
  const [config, setConfig] = useState<PESVTrainingIntegrationConfig>(() => {
    const savedConfig = localStorage.getItem('pesv_training_integration_config');
    const isGloballyActive = localStorage.getItem('pesv_int_capacitaciones') === 'true';
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        return {
          ...parsed,
          enabled: isGloballyActive || parsed.enabled
        };
      } catch (e) {}
    }
    return {
      enabled: isGloballyActive,
      appUrl: localStorage.getItem('pesv_training_app_url') || DEFAULT_EXTERNAL_APP_URL,
      appName: 'Plan de Capacitaciones HSEQ (Aplicativo Externo)',
      apiKey: localStorage.getItem('pesv_training_api_key') || 'sec_pesv_live_9a7d_k928',
      webhookSecret: 'whsec_pesv_cap_2026_x89a',
      autoSync: true,
      syncIntervalHours: 6,
      lastSyncDate: '2026-09-18 14:30:12',
      syncStatus: isGloballyActive ? 'success' : 'idle',
      lastSyncMessage: 'Conexión verificada: 5 cursos sincronizados, 28 certificados registrados.',
      totalSyncedCourses: 5,
      totalSyncedDrivers: 27,
      totalCertificatesIssued: 129
    };
  });

  // Sessions State
  const [trainingSessions, setTrainingSessions] = useState<PESVTrainingSession[]>(() => {
    const saved = localStorage.getItem('pesv_training_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return SEED_TRAINING_SESSIONS;
  });

  // Competency Profiles State (Editable & Persisted)
  const [profiles, setProfiles] = useState<PESVDriverCompetencyProfile[]>(() => {
    const saved = localStorage.getItem('pesv_driver_competency_profiles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return SEED_PROFILES;
  });

  // Profile Creation / Edition State
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [editingProfileOrigId, setEditingProfileOrigId] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState<PESVDriverCompetencyProfile>({
    id: 'PROF-05',
    cargo: '',
    tipoLicencia: 'C1 / C2 Vigente',
    escolaridadMinima: 'Bachiller Académico',
    experienciaMinimaMeses: 24,
    examenTeoricoRequerido: true,
    examenPracticoRequerido: true,
    examenMedicoRequerido: 'Psicosensométrico anual (Visiometría, Audiometría, Coordinación Motriz)',
    cursosObligatorios: ['Manejo Defensivo', 'Normatividad y Código Nacional'],
    frecuenciaReentrenamientoMeses: 12,
    observaciones: ''
  });
  const [newCourseInput, setNewCourseInput] = useState<string>('');
  const [inlineCourseInputs, setInlineCourseInputs] = useState<Record<string, string>>({});
  const [newMatrixCourseName, setNewMatrixCourseName] = useState<string>('');

  // Sync / Test Connection UI State
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isTestingConn, setIsTestingConn] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latency: number; message: string } | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState<boolean>(false);
  const [isEditingConfig, setIsEditingConfig] = useState<boolean>(false);
  const [tempUrl, setTempUrl] = useState<string>(config.appUrl);
  const [tempApiKey, setTempApiKey] = useState<string>(config.apiKey || '');
  const [embeddedView, setEmbeddedView] = useState<boolean>(false);

  // Filters for Sessions Table
  const [sessionFilterStatus, setSessionFilterStatus] = useState<string>('TODOS');
  const [sessionFilterOrigin, setSessionFilterOrigin] = useState<string>('TODOS');
  const [sessionSearch, setSessionSearch] = useState<string>('');

  // New / Edit Session Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [newSession, setNewSession] = useState<Omit<PESVTrainingSession, 'id'>>({
    codigoCurso: '',
    nombreCurso: '',
    moduloObligatorio: 'Manejo Defensivo',
    fecha: new Date().toISOString().split('T')[0],
    instructorOEntidad: 'Capacitaciones HSEQ',
    duracionHoras: 4,
    modalidad: 'Virtual / E-learning',
    totalConductoresCitados: 28,
    totalConductoresAsistentes: 25,
    totalConductoresAprobados: 25,
    origen: 'Manual',
    urlCertificados: '',
    estado: 'Programada',
    temarioResumen: ''
  });

  // Save config changes to localStorage and emit cross-module event
  const saveConfig = (newCfg: PESVTrainingIntegrationConfig) => {
    setConfig(newCfg);
    localStorage.setItem('pesv_training_integration_config', JSON.stringify(newCfg));
    localStorage.setItem('pesv_int_capacitaciones', newCfg.enabled ? 'true' : 'false');
    localStorage.setItem('pesv_training_app_url', newCfg.appUrl);
    if (newCfg.apiKey) localStorage.setItem('pesv_training_api_key', newCfg.apiKey);
    
    window.dispatchEvent(new CustomEvent('pesv_training_integration_updated', {
      detail: { enabled: newCfg.enabled, appUrl: newCfg.appUrl }
    }));
  };

  // Sync sessions with localStorage
  useEffect(() => {
    localStorage.setItem('pesv_training_sessions', JSON.stringify(trainingSessions));
  }, [trainingSessions]);

  // Sync profiles with localStorage
  useEffect(() => {
    localStorage.setItem('pesv_driver_competency_profiles', JSON.stringify(profiles));
  }, [profiles]);

  // Listen to external toggle from IntegrationsModule
  useEffect(() => {
    const handleExternalToggle = () => {
      const isEnabled = localStorage.getItem('pesv_int_capacitaciones') === 'true';
      setConfig(prev => ({
        ...prev,
        enabled: isEnabled,
        syncStatus: isEnabled ? 'success' : 'idle'
      }));
    };
    window.addEventListener('pesv_training_integration_updated', handleExternalToggle);
    window.addEventListener('storage', handleExternalToggle);
    return () => {
      window.removeEventListener('pesv_training_integration_updated', handleExternalToggle);
      window.removeEventListener('storage', handleExternalToggle);
    };
  }, []);

  // Handlers
  const handleToggleIntegration = (enabled: boolean) => {
    const updated: PESVTrainingIntegrationConfig = {
      ...config,
      enabled,
      syncStatus: enabled ? 'success' : 'idle',
      lastSyncMessage: enabled 
        ? 'Integración activada. Conexión establecida con el aplicativo externo.' 
        : 'Integración en pausa. Los registros se gestionan manualmente.'
    };
    saveConfig(updated);
  };

  const handleTestConnection = () => {
    setIsTestingConn(true);
    setTestResult(null);
    setTimeout(() => {
      setIsTestingConn(false);
      setTestResult({
        success: true,
        latency: 142,
        message: 'Conexión verificada exitosamente (HTTP 200 OK). Servicio del Plan de Capacitaciones respondiendo con latencia óptima.'
      });
    }, 900);
  };

  const handleSyncNow = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const now = new Date().toLocaleString('es-CO');
      
      const updatedSessions = trainingSessions.map(s => {
        if (s.id === 'CAP-2026-006' && s.estado === 'Programada') {
          return {
            ...s,
            totalConductoresCitados: 28,
            totalConductoresAsistentes: 26,
            totalConductoresAprobados: 26,
            estado: 'Ejecutada' as const,
            origen: 'Aplicativo Externo LMS' as const,
            urlCertificados: 'https://plan-de-capacitaciones-production-eeba.up.railway.app/certificados/emerg-06'
          };
        }
        return s;
      });
      setTrainingSessions(updatedSessions);

      const updatedCfg: PESVTrainingIntegrationConfig = {
        ...config,
        enabled: true,
        lastSyncDate: now,
        syncStatus: 'success',
        lastSyncMessage: 'Sincronización completada exitosamente vía API REST. 6 cursos consolidados, 155 certificaciones validadas.',
        totalSyncedCourses: updatedSessions.filter(s => s.origen === 'Aplicativo Externo LMS').length,
        totalSyncedDrivers: 28,
        totalCertificatesIssued: 155
      };
      saveConfig(updatedCfg);
    }, 1200);
  };

  const handleSaveConfigChanges = () => {
    const updatedCfg: PESVTrainingIntegrationConfig = {
      ...config,
      appUrl: tempUrl.trim() || DEFAULT_EXTERNAL_APP_URL,
      apiKey: tempApiKey.trim()
    };
    saveConfig(updatedCfg);
    setIsEditingConfig(false);
  };

  const handleResetDefaultUrl = () => {
    setTempUrl(DEFAULT_EXTERNAL_APP_URL);
  };

  const handleCopyWebhook = () => {
    const webhookUrl = `${window.location.origin}/api/webhooks/capacitaciones`;
    navigator.clipboard?.writeText?.(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  // Profile Handlers
  const openCreateProfileModal = () => {
    const nextNum = profiles.length + 1;
    const nextId = `PROF-0${nextNum}`;
    setEditingProfileOrigId(null);
    setProfileForm({
      id: nextId,
      cargo: '',
      tipoLicencia: 'C1 / C2 Vigente',
      escolaridadMinima: 'Bachiller Académico',
      experienciaMinimaMeses: 24,
      examenTeoricoRequerido: true,
      examenPracticoRequerido: true,
      examenMedicoRequerido: 'Psicosensométrico anual (Visiometría, Audiometría, Coordinación Motriz)',
      cursosObligatorios: ['Manejo Defensivo', 'Normatividad y Código Nacional'],
      frecuenciaReentrenamientoMeses: 12,
      observaciones: ''
    });
    setNewCourseInput('');
    setShowProfileModal(true);
  };

  const openEditProfileModal = (prof: PESVDriverCompetencyProfile) => {
    setEditingProfileOrigId(prof.id);
    setProfileForm({
      ...prof,
      examenMedicoRequerido: prof.examenMedicoRequerido || 'Psicosensométrico anual (Visiometría, Audiometría, Coordinación Motriz)',
      cursosObligatorios: [...prof.cursosObligatorios]
    });
    setNewCourseInput('');
    setShowProfileModal(true);
  };

  const handleSaveProfile = () => {
    if (!profileForm.cargo.trim()) return;
    const cleanedProfile: PESVDriverCompetencyProfile = {
      ...profileForm,
      id: profileForm.id.trim() || `PROF-0${profiles.length + 1}`,
      cargo: profileForm.cargo.trim(),
      tipoLicencia: profileForm.tipoLicencia.trim() || 'B1 / C1 Vigente',
      escolaridadMinima: profileForm.escolaridadMinima.trim() || 'Bachiller Académico',
      experienciaMinimaMeses: Number(profileForm.experienciaMinimaMeses) || 0,
      frecuenciaReentrenamientoMeses: Number(profileForm.frecuenciaReentrenamientoMeses) || 12
    };

    if (editingProfileOrigId) {
      setProfiles(prev => prev.map(p => p.id === editingProfileOrigId ? cleanedProfile : p));
    } else {
      setProfiles(prev => [...prev, cleanedProfile]);
    }
    setShowProfileModal(false);
    setEditingProfileOrigId(null);
  };

  const handleDeleteProfile = (id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
  };

  const handleAddInlineCourse = (profileId: string) => {
    const text = (inlineCourseInputs[profileId] || '').trim();
    if (!text) return;
    setProfiles(prev => prev.map(p => {
      if (p.id !== profileId) return p;
      if (p.cursosObligatorios.includes(text)) return p;
      return {
        ...p,
        cursosObligatorios: [...p.cursosObligatorios, text]
      };
    }));
    setInlineCourseInputs(prev => ({ ...prev, [profileId]: '' }));
  };

  const handleRemoveInlineCourse = (profileId: string, courseIndex: number) => {
    setProfiles(prev => prev.map(p => {
      if (p.id !== profileId) return p;
      return {
        ...p,
        cursosObligatorios: p.cursosObligatorios.filter((_, idx) => idx !== courseIndex)
      };
    }));
  };

  const handleToggleCourseInMatrix = (profileId: string, courseName: string) => {
    setProfiles(prev => prev.map(p => {
      if (p.id !== profileId) return p;
      const exists = p.cursosObligatorios.includes(courseName);
      return {
        ...p,
        cursosObligatorios: exists
          ? p.cursosObligatorios.filter(c => c !== courseName)
          : [...p.cursosObligatorios, courseName]
      };
    }));
  };

  // All unique courses across profiles + suggested for the interactive Competency Matrix
  const allMatrixCourses = Array.from(
    new Set([
      ...profiles.flatMap(p => p.cursosObligatorios),
      'Manejo Defensivo',
      'Mecánica Básica y Preoperacional',
      'Normatividad y Código Nacional',
      'Gestión de Fatiga y Velocidad',
      'Primeros Auxilios en Vía',
      'Control de Distracciones'
    ])
  );

  // KPIs Calculations
  const totalCursosProgramados = trainingSessions.length;
  const cursosEjecutados = trainingSessions.filter(s => s.estado === 'Ejecutada').length;
  const totalHorasImpartidas = trainingSessions
    .filter(s => s.estado === 'Ejecutada')
    .reduce((acc, curr) => acc + curr.duracionHoras, 0);

  // Filtered Sessions
  const filteredSessions = trainingSessions.filter(s => {
    const matchesStatus = sessionFilterStatus === 'TODOS' || s.estado === sessionFilterStatus;
    const matchesOrigin = sessionFilterOrigin === 'TODOS' || s.origen === sessionFilterOrigin;
    const matchesSearch = sessionSearch === '' || 
      s.nombreCurso.toLowerCase().includes(sessionSearch.toLowerCase()) ||
      s.codigoCurso.toLowerCase().includes(sessionSearch.toLowerCase()) ||
      s.moduloObligatorio.toLowerCase().includes(sessionSearch.toLowerCase()) ||
      s.instructorOEntidad.toLowerCase().includes(sessionSearch.toLowerCase());
    return matchesStatus && matchesOrigin && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* HEADER DEL PASO 10 CON ESTADO DE INTEGRACIÓN EXTERNA */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-5 rounded-2xl shadow-sm border border-slate-700/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black tracking-wider uppercase rounded-md">
                Fase 2: Implementación • Paso 10
              </span>
              <span className="px-2.5 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold rounded-md flex items-center gap-1.5">
                <LinkIcon size={11} />
                Integración con Aplicativo Externo
              </span>
              {config.enabled ? (
                <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-black rounded-full flex items-center gap-1 shadow-xs animate-pulse">
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                  API CONECTADA
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-[10px] font-bold rounded-full">
                  MODO LOCAL
                </span>
              )}
            </div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <GraduationCap className="text-emerald-400" size={24} />
              Competencia y Plan Anual de Formación en Seguridad Vial
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Gestión centralizada del programa de formación para conductores. Conectado al aplicativo externo 
              especializado en administración de cursos, asistencias y expedición de certificados conforme a la Resolución 40595 de 2022.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <a
              href={config.appUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span>Abrir Aplicativo Externo</span>
              <ExternalLink size={13} />
            </a>
            <button
              type="button"
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-600 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} className={isSyncing ? 'animate-spin text-emerald-400' : 'text-slate-300'} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
            </button>
          </div>
        </div>

        {/* Sync Info Bar */}
        <div className="mt-4 pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-300 font-mono">
          <div className="flex items-center gap-4">
            <span>Última sincronización: <strong className="text-emerald-300">{config.lastSyncDate || 'Nunca'}</strong></span>
            <span>•</span>
            <span>Cursos activos: <strong className="text-white">{totalCursosProgramados}</strong></span>
            <span>•</span>
            <span>Certificados expedidos: <strong className="text-sky-300">{config.totalCertificatesIssued || 129}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400">Endpoint:</span>
            <span className="text-slate-200 text-[10px] bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 truncate max-w-[280px]">
              {config.appUrl}
            </span>
          </div>
        </div>
      </div>

      {/* NAVIGATION SUB-TABS (3 Módulos Principales) */}
      <div className="flex border-b border-gray-200 gap-1 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('integracion')}
          className={`px-4 py-2.5 text-xs font-black rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'integracion'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/60'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Cpu size={14} className={activeTab === 'integracion' ? 'text-emerald-600' : 'text-gray-400'} />
          <span>Configuración de Integración</span>
          {config.enabled && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cronograma')}
          className={`px-4 py-2.5 text-xs font-black rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'cronograma'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/60'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Calendar size={14} className={activeTab === 'cronograma' ? 'text-emerald-600' : 'text-gray-400'} />
          <span>Plan y Cronograma de Capacitación</span>
          <span className="px-1.5 py-0.2 bg-gray-200 text-gray-700 text-[10px] rounded-full font-bold">
            {trainingSessions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('perfiles')}
          className={`px-4 py-2.5 text-xs font-black rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'perfiles'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/60'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Award size={14} className={activeTab === 'perfiles' ? 'text-emerald-600' : 'text-gray-400'} />
          <span>Perfiles y Matriz de Competencias</span>
          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-bold">
            {profiles.length}
          </span>
        </button>
      </div>

      {/* ========================================================
          PESTAÑA 1: CONFIGURACIÓN DE INTEGRACIÓN CON APLICATIVO
         ======================================================== */}
      {activeTab === 'integracion' && (
        <div className="space-y-6">
          {/* Card Principal de Conexión */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-100">
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl shrink-0">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                    Canal de Integración con Plan de Capacitaciones HSEQ
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                      Nube Ferroviaria / Railway
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Permite sincronizar de manera bidireccional los cursos programados, asistencias validadas y certificaciones oficiales de los conductores.
                  </p>
                </div>
              </div>

              {/* Toggle de activación */}
              <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-gray-200 shrink-0">
                <span className="text-xs font-black text-gray-700">
                  {config.enabled ? 'Integración Activa' : 'Integración Desactivada'}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) => handleToggleIntegration(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>

            {/* Configuración de Parámetros */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Columna Izquierda: Parámetros URL y Autenticación */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Key size={14} className="text-emerald-600" />
                    Parámetros de Conexión del Aplicativo
                  </h4>
                  {!isEditingConfig ? (
                    <button
                      type="button"
                      onClick={() => {
                        setTempUrl(config.appUrl);
                        setTempApiKey(config.apiKey || '');
                        setIsEditingConfig(true);
                      }}
                      className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Edit size={12} />
                      Editar Configuración
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleResetDefaultUrl}
                        className="text-[11px] text-gray-500 hover:text-gray-800 underline cursor-pointer"
                      >
                        Restablecer Oficial
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveConfigChanges}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded cursor-pointer"
                      >
                        Guardar
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      URL del Aplicativo Externo de Capacitaciones
                    </label>
                    {isEditingConfig ? (
                      <input
                        type="text"
                        value={tempUrl}
                        onChange={(e) => setTempUrl(e.target.value)}
                        className="w-full p-2.5 text-xs font-mono bg-white border border-emerald-400 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        placeholder="https://su-aplicativo-capacitaciones.app"
                      />
                    ) : (
                      <div className="p-2.5 bg-slate-50 border border-gray-200 rounded-lg text-xs font-mono text-slate-800 break-all select-all flex items-center justify-between">
                        <span>{config.appUrl}</span>
                        <a
                          href={config.appUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-600 hover:text-emerald-800 shrink-0 ml-2"
                          title="Abrir URL"
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    )}
                    <span className="text-[10px] text-gray-500 block mt-1">
                      Instancia oficial en producción alojada para la gestión del plan de capacitación vial.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Token / API Key de Autorización (Bearer Token)
                    </label>
                    {isEditingConfig ? (
                      <input
                        type="text"
                        value={tempApiKey}
                        onChange={(e) => setTempApiKey(e.target.value)}
                        className="w-full p-2.5 text-xs font-mono bg-white border border-emerald-400 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        placeholder="sec_pesv_live_..."
                      />
                    ) : (
                      <div className="p-2.5 bg-slate-50 border border-gray-200 rounded-lg text-xs font-mono text-slate-600 flex items-center justify-between">
                        <span>{config.apiKey ? `${config.apiKey.substring(0, 10)}****************` : 'No configurado'}</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Encriptado SHA-256
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Webhook Endpoint */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <LinkIcon size={12} className="text-emerald-600" />
                        Webhook para Actualizaciones en Tiempo Real
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyWebhook}
                        className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        {copiedWebhook ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                        {copiedWebhook ? '¡Copiado!' : 'Copiar URL'}
                      </button>
                    </div>
                    <code className="text-[10px] text-slate-600 font-mono block bg-white p-1.5 rounded border border-slate-200 break-all">
                      {window.location.origin}/api/webhooks/capacitaciones
                    </code>
                    <p className="text-[9.5px] text-slate-500">
                      Configura este webhook en el aplicativo externo para que cada vez que un conductor apruebe un curso se actualice el PESV automáticamente.
                    </p>
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Estado de Sincronización y Prueba de Conexión */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity size={14} className="text-emerald-600" />
                  Estado del Canal de Datos
                </h4>

                <div className="bg-slate-900 text-slate-200 p-4 rounded-xl border border-slate-950 font-mono text-xs space-y-3 shadow-inner">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400 text-[11px]">Estado del Servicio:</span>
                    {config.enabled ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5 text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        EN LÍNEA (200 OK)
                      </span>
                    ) : (
                      <span className="text-slate-500 font-bold text-[11px]">PAUSADO</span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-[10.5px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Último reporte recibido:</span>
                      <span className="text-slate-200">{config.lastSyncDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cursos reconocidos:</span>
                      <span className="text-emerald-400 font-bold">{config.totalSyncedCourses} módulos</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Conductores con certificado:</span>
                      <span className="text-sky-300 font-bold">{config.totalSyncedDrivers} conductores</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total asistencias registradas:</span>
                      <span className="text-amber-300 font-bold">{config.totalCertificatesIssued}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 leading-relaxed">
                    {config.lastSyncMessage}
                  </div>
                </div>

                {/* Botones de Operación de Conexión */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTestingConn}
                    className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl border border-slate-300 transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={isTestingConn ? 'animate-spin text-emerald-600' : ''} />
                    <span>{isTestingConn ? 'Probando...' : 'Probar Conexión (Ping)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSyncNow}
                    disabled={isSyncing}
                    className="flex-1 py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                    <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Datos'}</span>
                  </button>
                </div>

                {/* Mensaje de Resultado del Test */}
                {testResult && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2 animate-fadeIn">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Conexión Exitosa con el Plan de Capacitaciones</span>
                      <p className="text-[11px] text-emerald-800 mt-0.5 leading-snug">
                        {testResult.message} Latencia: <strong className="font-mono">{testResult.latency} ms</strong>.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Accesos y Visor Incrustado */}
            <div className="pt-4 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-xs text-gray-500">
                ¿Deseas gestionar los contenidos didácticos, preguntas de examen y videos del curso?
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setEmbeddedView(!embeddedView)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer border border-slate-300"
                >
                  <Eye size={13} />
                  <span>{embeddedView ? 'Ocultar Visor Incrustado' : 'Ver Aplicativo Incrustado Aquí'}</span>
                </button>
                <a
                  href={config.appUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Abrir en Pestaña Completa</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          </div>

          {/* VISOR INCRUSTADO / IFRAME OPCIONAL */}
          {embeddedView && (
            <div className="bg-white rounded-2xl p-4 border border-gray-300 shadow-sm space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-black text-gray-800">
                    Visor en Vivo: Plan de Capacitaciones HSEQ
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">({config.appUrl})</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={config.appUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>Abrir en ventana completa</span>
                    <ExternalLink size={12} />
                  </a>
                  <button
                    type="button"
                    onClick={() => setEmbeddedView(false)}
                    className="p-1 hover:bg-gray-100 rounded text-gray-500 text-xs font-bold cursor-pointer"
                  >
                    ✕ Cerrar
                  </button>
                </div>
              </div>
              <div className="w-full h-[620px] rounded-xl overflow-hidden border border-gray-200 bg-slate-50 relative">
                <iframe
                  src={config.appUrl}
                  title="Aplicativo Externo Plan de Capacitaciones"
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          PESTAÑA 2: CRONOGRAMA Y PLAN DE CAPACITACIONES VIALES
         ======================================================== */}
      {activeTab === 'cronograma' && (
        <div className="space-y-6">
          {/* Tarjetas Resumen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Cursos Programados</span>
              <div className="text-2xl font-black text-gray-900 mt-1">{totalCursosProgramados}</div>
              <span className="text-[11px] text-gray-500">Módulos normativos anuales</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">Cursos Ejecutados</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">{cursosEjecutados}</div>
              <span className="text-[11px] text-emerald-800 font-bold">
                {Math.round((cursosEjecutados / (totalCursosProgramados || 1)) * 100)}% de avance del plan
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[10px] font-black uppercase text-sky-700 tracking-wider">Horas Impartidas</span>
              <div className="text-2xl font-black text-sky-700 mt-1">{totalHorasImpartidas} hrs</div>
              <span className="text-[11px] text-gray-500">Formación teórica y práctica</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[10px] font-black uppercase text-purple-700 tracking-wider">Origen de Datos</span>
              <div className="text-base font-black text-purple-900 mt-1 flex items-center gap-1.5">
                <Globe size={18} className="text-purple-600" />
                <span>Aplicativo Externo LMS</span>
              </div>
              <span className="text-[10px] text-purple-700 font-bold">Sincronizado vía Webhook API</span>
            </div>
          </div>

          {/* Tabla de Sesiones de Capacitación */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            {/* Barra de Filtros y Búsqueda */}
            <div className="p-4 border-b border-gray-200 bg-gray-50/60 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                <div className="relative flex-1 md:w-64">
                  <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar curso, temario o código..."
                    value={sessionSearch}
                    onChange={(e) => setSessionSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <select
                  value={sessionFilterStatus}
                  onChange={(e) => setSessionFilterStatus(e.target.value)}
                  className="py-1.5 px-2.5 text-xs bg-white border border-gray-300 rounded-lg font-bold text-gray-700"
                >
                  <option value="TODOS">Todos los Estados</option>
                  <option value="Ejecutada">Ejecutadas</option>
                  <option value="Programada">Programadas</option>
                </select>

                <select
                  value={sessionFilterOrigin}
                  onChange={(e) => setSessionFilterOrigin(e.target.value)}
                  className="py-1.5 px-2.5 text-xs bg-white border border-gray-300 rounded-lg font-bold text-gray-700"
                >
                  <option value="TODOS">Todos los Orígenes</option>
                  <option value="Aplicativo Externo LMS">Desde Aplicativo Externo</option>
                  <option value="Manual">Registro Manual</option>
                </select>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setEditingSessionId(null);
                    setNewSession({
                      codigoCurso: '',
                      nombreCurso: '',
                      moduloObligatorio: 'Manejo Defensivo',
                      fecha: new Date().toISOString().split('T')[0],
                      instructorOEntidad: 'Capacitaciones HSEQ',
                      duracionHoras: 4,
                      modalidad: 'Virtual / E-learning',
                      totalConductoresCitados: 28,
                      totalConductoresAsistentes: 25,
                      totalConductoresAprobados: 25,
                      origen: 'Manual',
                      urlCertificados: '',
                      estado: 'Programada',
                      temarioResumen: ''
                    });
                    setShowAddModal(true);
                  }}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Plus size={14} />
                  <span>Programar Capacitación</span>
                </button>
              </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-gray-100 text-gray-900 uppercase font-black text-[10px] tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="p-3">Código</th>
                    <th className="p-3">Módulo y Curso</th>
                    <th className="p-3">Modalidad / Horas</th>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Instructor / Origen</th>
                    <th className="p-3 text-center">Asistencia / Aprobados</th>
                    <th className="p-3 text-center">Estado</th>
                    <th className="p-3 text-center">Certificados</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-gray-900">
                        {session.codigoCurso}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-gray-900">{session.nombreCurso}</div>
                        <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-bold inline-block mt-0.5">
                          {session.moduloObligatorio}
                        </span>
                        {session.temarioResumen && (
                          <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">
                            {session.temarioResumen}
                          </p>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-gray-800">{session.modalidad}</div>
                        <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1 mt-0.5">
                          <Clock size={11} />
                          {session.duracionHoras} Horas
                        </span>
                      </td>
                      <td className="p-3 font-mono text-gray-700">
                        {session.fecha}
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-gray-800">{session.instructorOEntidad}</div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold inline-flex items-center gap-1 mt-0.5 ${
                          session.origen === 'Aplicativo Externo LMS'
                            ? 'bg-sky-50 text-sky-800 border border-sky-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {session.origen === 'Aplicativo Externo LMS' && <Globe size={10} className="text-sky-600" />}
                          {session.origen}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="font-black text-gray-900">
                          {session.totalConductoresAprobados} / {session.totalConductoresCitados}
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium">
                          ({session.totalConductoresCitados > 0 ? Math.round((session.totalConductoresAprobados / session.totalConductoresCitados) * 100) : 0}% aprobó)
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-block ${
                          session.estado === 'Ejecutada'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : session.estado === 'En Proceso'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {session.estado === 'Ejecutada' ? '✅ Ejecutada' : session.estado === 'En Proceso' ? '🔄 En Proceso' : '⏳ Programada'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {session.urlCertificados ? (
                          <a
                            href={session.urlCertificados}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-[10px] font-bold rounded inline-flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            <span>Ver en LMS</span>
                            <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">No disponible</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSessionId(session.id);
                              setNewSession({
                                codigoCurso: session.codigoCurso,
                                nombreCurso: session.nombreCurso,
                                moduloObligatorio: session.moduloObligatorio,
                                fecha: session.fecha,
                                instructorOEntidad: session.instructorOEntidad,
                                duracionHoras: session.duracionHoras,
                                modalidad: session.modalidad,
                                totalConductoresCitados: session.totalConductoresCitados,
                                totalConductoresAsistentes: session.totalConductoresAsistentes,
                                totalConductoresAprobados: session.totalConductoresAprobados,
                                origen: session.origen,
                                urlCertificados: session.urlCertificados || '',
                                estado: session.estado,
                                temarioResumen: session.temarioResumen || ''
                              });
                              setShowAddModal(true);
                            }}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Editar sesión"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setTrainingSessions(prev => prev.filter(s => s.id !== session.id))}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar sesión"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          PESTAÑA 3: PERFILES Y MATRIZ DE COMPETENCIAS (100% EDITABLE)
         ======================================================== */}
      {activeTab === 'perfiles' && (
        <div className="space-y-6">
          {/* SECCIÓN 1: TARJETAS DE PERFILES DE COMPETENCIA */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <Award className="text-emerald-600" size={20} />
                  Matriz de Perfiles y Competencias de Conducción (Resolución 40595)
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Definición y edición de criterios de idoneidad, escolaridad, experiencia, exámenes médicos ocupacionales y capacitaciones obligatorias según el rol vial en la empresa.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => setProfiles(SEED_PROFILES)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Restaurar perfiles predeterminados"
                >
                  <RotateCcw size={13} />
                  <span>Restaurar Base</span>
                </button>
                <button
                  type="button"
                  onClick={openCreateProfileModal}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Crear Nuevo Perfil</span>
                </button>
              </div>
            </div>

            {profiles.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-gray-300 space-y-3">
                <Award size={32} className="text-gray-400 mx-auto" />
                <div className="text-xs font-bold text-gray-700">No hay perfiles de competencia registrados</div>
                <button
                  type="button"
                  onClick={openCreateProfileModal}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} /> Crear Primer Perfil
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profiles.map((prof) => (
                  <div
                    key={prof.id}
                    className="p-5 bg-slate-50/70 hover:bg-slate-50 border border-gray-200 hover:border-emerald-300 rounded-xl space-y-3.5 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Cabecera del Perfil */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-gray-500">{prof.id}</span>
                          <h4 className="text-sm font-black text-gray-900 leading-snug">{prof.cargo}</h4>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md border border-emerald-200">
                            {prof.tipoLicencia}
                          </span>
                          <button
                            type="button"
                            onClick={() => openEditProfileModal(prof)}
                            className="p-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-gray-200 hover:border-emerald-300 rounded-lg transition-colors cursor-pointer"
                            title="Editar perfil completo"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProfile(prof.id)}
                            className="p-1.5 bg-white hover:bg-red-50 text-red-600 border border-gray-200 hover:border-red-300 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar perfil"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Parámetros de Competencia */}
                      <div className="grid grid-cols-2 gap-2.5 text-[11px] text-gray-600 border-t border-b border-gray-200 py-2.5">
                        <div>
                          <span className="text-gray-400 block text-[10px]">Escolaridad:</span>
                          <strong className="text-gray-800">{prof.escolaridadMinima}</strong>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px]">Experiencia Mínima:</span>
                          <strong className="text-gray-800">{prof.experienciaMinimaMeses} Meses</strong>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px]">Examen Teórico:</span>
                          <button
                            type="button"
                            onClick={() =>
                              setProfiles(prev =>
                                prev.map(p => p.id === prof.id ? { ...p, examenTeoricoRequerido: !p.examenTeoricoRequerido } : p)
                              )
                            }
                            className={`font-bold cursor-pointer hover:underline ${
                              prof.examenTeoricoRequerido ? 'text-emerald-700' : 'text-gray-500'
                            }`}
                            title="Clic para alternar Obligatorio / No Aplica"
                          >
                            {prof.examenTeoricoRequerido ? 'Obligatorio' : 'No Aplica'}
                          </button>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px]">Prueba Práctica en Pista:</span>
                          <button
                            type="button"
                            onClick={() =>
                              setProfiles(prev =>
                                prev.map(p => p.id === prof.id ? { ...p, examenPracticoRequerido: !p.examenPracticoRequerido } : p)
                              )
                            }
                            className={`font-bold cursor-pointer hover:underline ${
                              prof.examenPracticoRequerido ? 'text-emerald-700' : 'text-gray-500'
                            }`}
                            title="Clic para alternar Obligatoria / No Aplica"
                          >
                            {prof.examenPracticoRequerido ? 'Obligatoria' : 'No Aplica'}
                          </button>
                        </div>
                        {prof.examenMedicoRequerido && (
                          <div className="col-span-2 pt-1 border-t border-gray-100">
                            <span className="text-gray-400 block text-[10px]">Exámenes Médicos / Psicosensométricos:</span>
                            <strong className="text-gray-800 text-[10.5px]">{prof.examenMedicoRequerido}</strong>
                          </div>
                        )}
                      </div>

                      {/* Cursos Obligatorios del Plan Anual (Editables en línea) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-500 uppercase">
                            Cursos Obligatorios del Plan Anual ({prof.cursosObligatorios.length}):
                          </span>
                          <span className="text-[10px] text-emerald-700 font-semibold">
                            Reentrenamiento: cada {prof.frecuenciaReentrenamientoMeses} meses
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {prof.cursosObligatorios.map((c, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-white border border-gray-200 text-gray-800 text-[10px] rounded-md font-medium inline-flex items-center gap-1 group"
                            >
                              <span className="text-emerald-600 font-bold">✓</span>
                              <span>{c}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveInlineCourse(prof.id, i)}
                                className="text-gray-400 hover:text-red-600 ml-0.5 cursor-pointer font-bold"
                                title="Quitar curso de este perfil"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>

                        {/* Agregar curso rápido al perfil */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <input
                            type="text"
                            placeholder="Agregar curso obligatorio a este perfil..."
                            value={inlineCourseInputs[prof.id] || ''}
                            onChange={(e) =>
                              setInlineCourseInputs(prev => ({ ...prev, [prof.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddInlineCourse(prof.id);
                              }
                            }}
                            className="flex-1 px-2.5 py-1 text-[11px] bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddInlineCourse(prof.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg cursor-pointer shrink-0 flex items-center gap-1"
                          >
                            <Plus size={11} /> Agregar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECCIÓN 2: MATRIZ INTERACTIVA DE COMPETENCIAS Y CURSOS POR PERFIL */}
          {profiles.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div>
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    Matriz Consolidada de Competencias y Módulos por Rol Vial
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Haz clic en cualquier celda para activar o desactivar un curso o competencia obligatoria para cada perfil de conductor.
                  </p>
                </div>

                {/* Agregar nueva fila de competencia/curso a la matriz */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMatrixCourseName}
                    onChange={(e) => setNewMatrixCourseName(e.target.value)}
                    placeholder="Nueva competencia o curso en matriz..."
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 w-60"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = newMatrixCourseName.trim();
                      if (!trimmed || profiles.length === 0) return;
                      // Asignar al primer perfil por defecto para que aparezca en la matriz
                      handleToggleCourseInMatrix(profiles[0].id, trimmed);
                      setNewMatrixCourseName('');
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Plus size={13} /> Añadir Fila
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-gray-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-wider">
                    <tr>
                      <th className="p-3 border-r border-slate-700 min-w-[220px]">
                        Competencia / Curso Obligatorio
                      </th>
                      {profiles.map((prof) => (
                        <th key={prof.id} className="p-3 text-center border-r border-slate-700 min-w-[140px]">
                          <div className="text-emerald-300 font-mono text-[9px]">{prof.id}</div>
                          <div className="line-clamp-2 leading-tight mt-0.5">{prof.cargo}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {/* Filas de Evaluaciones de Idoneidad */}
                    <tr className="bg-emerald-50/40">
                      <td className="p-2.5 font-bold text-emerald-950 border-r border-gray-200">
                        Examen Teórico de Normatividad y Seguridad Vial
                      </td>
                      {profiles.map((prof) => (
                        <td key={prof.id} className="p-2.5 text-center border-r border-gray-200">
                          <button
                            type="button"
                            onClick={() =>
                              setProfiles(prev =>
                                prev.map(p => p.id === prof.id ? { ...p, examenTeoricoRequerido: !p.examenTeoricoRequerido } : p)
                              )
                            }
                            className={`px-2.5 py-1 rounded-md text-[10px] font-black cursor-pointer transition-all ${
                              prof.examenTeoricoRequerido
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                          >
                            {prof.examenTeoricoRequerido ? '✓ Obligatorio' : '— No Aplica'}
                          </button>
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-emerald-50/40">
                      <td className="p-2.5 font-bold text-emerald-950 border-r border-gray-200">
                        Prueba Práctica de Conducción y Maniobra en Pista
                      </td>
                      {profiles.map((prof) => (
                        <td key={prof.id} className="p-2.5 text-center border-r border-gray-200">
                          <button
                            type="button"
                            onClick={() =>
                              setProfiles(prev =>
                                prev.map(p => p.id === prof.id ? { ...p, examenPracticoRequerido: !p.examenPracticoRequerido } : p)
                              )
                            }
                            className={`px-2.5 py-1 rounded-md text-[10px] font-black cursor-pointer transition-all ${
                              prof.examenPracticoRequerido
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                          >
                            {prof.examenPracticoRequerido ? '✓ Obligatoria' : '— No Aplica'}
                          </button>
                        </td>
                      ))}
                    </tr>

                    {/* Filas de Cursos */}
                    {allMatrixCourses.map((courseName, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2.5 font-medium text-gray-800 border-r border-gray-200">
                          {courseName}
                        </td>
                        {profiles.map((prof) => {
                          const isAssigned = prof.cursosObligatorios.includes(courseName);
                          return (
                            <td key={prof.id} className="p-2.5 text-center border-r border-gray-200">
                              <button
                                type="button"
                                onClick={() => handleToggleCourseInMatrix(prof.id, courseName)}
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                                  isAssigned
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-100'
                                }`}
                              >
                                {isAssigned ? '✓ Requerido' : '— Opcional'}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          MODAL CREAR / EDITAR PERFIL DE COMPETENCIA
         ======================================================== */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-gray-200 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <Award size={18} className="text-emerald-600" />
                {editingProfileOrigId ? 'Editar Perfil de Competencia Vial' : 'Crear Nuevo Perfil de Competencia Vial'}
              </h3>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Código del Perfil</label>
                  <input
                    type="text"
                    value={profileForm.id}
                    onChange={(e) => setProfileForm({ ...profileForm, id: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg font-mono text-xs"
                    placeholder="Ej: PROF-05"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-gray-700 font-bold mb-1">
                    Cargo / Rol Vial en la Organización <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profileForm.cargo}
                    onChange={(e) => setProfileForm({ ...profileForm, cargo: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                    placeholder="Ej: Conductor de Transporte de Personal / Camioneta Doble Cabina"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Categoría de Licencia Requerida</label>
                  <input
                    type="text"
                    value={profileForm.tipoLicencia}
                    onChange={(e) => setProfileForm({ ...profileForm, tipoLicencia: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                    placeholder="Ej: C2 / C3 Vigente"
                  />
                  <div className="flex flex-wrap gap-1 mt-1">
                    {['A2 Vigente', 'B1 / C1 Vigente', 'C1 / C2 Vigente', 'C2 / C3 Vigente'].map((lic) => (
                      <button
                        key={lic}
                        type="button"
                        onClick={() => setProfileForm({ ...profileForm, tipoLicencia: lic })}
                        className="px-1.5 py-0.5 bg-gray-100 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 rounded text-[10px] cursor-pointer"
                      >
                        {lic}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Escolaridad Mínima</label>
                  <input
                    type="text"
                    value={profileForm.escolaridadMinima}
                    onChange={(e) => setProfileForm({ ...profileForm, escolaridadMinima: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                    placeholder="Ej: Bachiller Académico"
                  />
                  <div className="flex flex-wrap gap-1 mt-1">
                    {['Educación Básica Secundaria', 'Bachiller Académico', 'Técnico / Tecnólogo', 'Técnico / Profesional'].map((esc) => (
                      <button
                        key={esc}
                        type="button"
                        onClick={() => setProfileForm({ ...profileForm, escolaridadMinima: esc })}
                        className="px-1.5 py-0.5 bg-gray-100 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 rounded text-[10px] cursor-pointer"
                      >
                        {esc}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Experiencia Mínima Conduciendo (Meses)</label>
                  <input
                    type="number"
                    min="0"
                    value={profileForm.experienciaMinimaMeses}
                    onChange={(e) => setProfileForm({ ...profileForm, experienciaMinimaMeses: Number(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Periodicidad de Reentrenamiento (Meses)</label>
                  <input
                    type="number"
                    min="1"
                    value={profileForm.frecuenciaReentrenamientoMeses}
                    onChange={(e) => setProfileForm({ ...profileForm, frecuenciaReentrenamientoMeses: Number(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Exámenes Médicos Ocupacionales y Psicosensométricos</label>
                <input
                  type="text"
                  value={profileForm.examenMedicoRequerido || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, examenMedicoRequerido: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                  placeholder="Ej: Visiometría, Audiometría, Coordinación Motriz y Examen Osteomuscular"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-gray-200">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-bold text-gray-800 block">Examen Teórico de Ingreso / Periódico</span>
                    <span className="text-[10px] text-gray-500">Evaluación escrita de normas de tránsito y PESV</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={profileForm.examenTeoricoRequerido}
                    onChange={(e) => setProfileForm({ ...profileForm, examenTeoricoRequerido: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-bold text-gray-800 block">Prueba Práctica en Pista / Ruta</span>
                    <span className="text-[10px] text-gray-500">Evaluación de pericia y alistamiento en vehículo</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={profileForm.examenPracticoRequerido}
                    onChange={(e) => setProfileForm({ ...profileForm, examenPracticoRequerido: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                </label>
              </div>

              {/* Gestión de Cursos Obligatorios del Perfil */}
              <div className="space-y-2 border-t border-gray-100 pt-3">
                <label className="block text-gray-700 font-bold">
                  Cursos Obligatorios del Plan Anual Asignados a este Perfil ({profileForm.cursosObligatorios.length})
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCourseInput}
                    onChange={(e) => setNewCourseInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = newCourseInput.trim();
                        if (val && !profileForm.cursosObligatorios.includes(val)) {
                          setProfileForm({
                            ...profileForm,
                            cursosObligatorios: [...profileForm.cursosObligatorios, val]
                          });
                          setNewCourseInput('');
                        }
                      }
                    }}
                    placeholder="Escribir nombre del curso y presionar Agregar..."
                    className="flex-1 p-2 border border-gray-300 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = newCourseInput.trim();
                      if (val && !profileForm.cursosObligatorios.includes(val)) {
                        setProfileForm({
                          ...profileForm,
                          cursosObligatorios: [...profileForm.cursosObligatorios, val]
                        });
                        setNewCourseInput('');
                      }
                    }}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1"
                  >
                    <Plus size={14} /> Agregar
                  </button>
                </div>

                {/* Cursos actualmente seleccionados */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {profileForm.cursosObligatorios.map((c, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-[11px] font-bold flex items-center gap-1.5"
                    >
                      <span>✓ {c}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setProfileForm({
                            ...profileForm,
                            cursosObligatorios: profileForm.cursosObligatorios.filter((_, i) => i !== idx)
                          })
                        }
                        className="text-emerald-700 hover:text-red-600 cursor-pointer font-black"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                {/* Sugerencias rápidas de cursos normativos */}
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-gray-500 block mb-1">
                    Sugerencias rápidas (clic para añadir):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {SUGGESTED_COURSES.filter(sc => !profileForm.cursosObligatorios.includes(sc)).map((sc) => (
                      <button
                        key={sc}
                        type="button"
                        onClick={() =>
                          setProfileForm({
                            ...profileForm,
                            cursosObligatorios: [...profileForm.cursosObligatorios, sc]
                          })
                        }
                        className="px-2 py-0.5 bg-gray-100 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 border border-gray-200 rounded text-[10px] cursor-pointer"
                      >
                        + {sc}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="px-3.5 py-2 text-xs text-gray-600 font-bold hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Save size={14} />
                <span>{editingProfileOrigId ? 'Guardar Cambios del Perfil' : 'Crear Perfil de Competencia'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL ADICIONAR / EDITAR CAPACITACIÓN MANUAL
         ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <Plus size={16} className="text-emerald-600" />
                {editingSessionId ? 'Editar Sesión de Capacitación Vial' : 'Programar Sesión de Capacitación Vial'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Nombre del Curso</label>
                <input
                  type="text"
                  value={newSession.nombreCurso}
                  onChange={(e) => setNewSession({ ...newSession, nombreCurso: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                  placeholder="Ej: Taller de Sensibilización en Puntos Ciegos"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Código Curso</label>
                  <input
                    type="text"
                    value={newSession.codigoCurso}
                    onChange={(e) => setNewSession({ ...newSession, codigoCurso: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                    placeholder="Ej: CUR-PC-07"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Módulo Temático</label>
                  <select
                    value={newSession.moduloObligatorio}
                    onChange={(e) => setNewSession({ ...newSession, moduloObligatorio: e.target.value as any })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                  >
                    <option value="Manejo Defensivo">Manejo Defensivo</option>
                    <option value="Mecánica Básica">Mecánica Básica</option>
                    <option value="Normas de Tránsito">Normas de Tránsito</option>
                    <option value="Primeros Auxilios">Primeros Auxilios</option>
                    <option value="Fatiga y Velocidad">Fatiga y Velocidad</option>
                    <option value="Emergencias en Vía">Emergencias en Vía</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Fecha</label>
                  <input
                    type="date"
                    value={newSession.fecha}
                    onChange={(e) => setNewSession({ ...newSession, fecha: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Duración (Horas)</label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={newSession.duracionHoras}
                    onChange={(e) => setNewSession({ ...newSession, duracionHoras: Number(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Modalidad</label>
                  <select
                    value={newSession.modalidad}
                    onChange={(e) => setNewSession({ ...newSession, modalidad: e.target.value as any })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                  >
                    <option value="Virtual / E-learning">Virtual / LMS</option>
                    <option value="Presencial">Presencial</option>
                    <option value="Práctica en Vía">Práctica en Vía</option>
                    <option value="Mixta">Mixta</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Instructor o Entidad</label>
                  <input
                    type="text"
                    value={newSession.instructorOEntidad}
                    onChange={(e) => setNewSession({ ...newSession, instructorOEntidad: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                    placeholder="Ej: ARL Sura / Aplicativo LMS"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Estado</label>
                  <select
                    value={newSession.estado}
                    onChange={(e) => setNewSession({ ...newSession, estado: e.target.value as any })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                  >
                    <option value="Programada">Programada</option>
                    <option value="En Proceso">En Proceso</option>
                    <option value="Ejecutada">Ejecutada</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Citados</label>
                  <input
                    type="number"
                    value={newSession.totalConductoresCitados}
                    onChange={(e) => setNewSession({ ...newSession, totalConductoresCitados: Number(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Asistentes</label>
                  <input
                    type="number"
                    value={newSession.totalConductoresAsistentes}
                    onChange={(e) => setNewSession({ ...newSession, totalConductoresAsistentes: Number(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Aprobados</label>
                  <input
                    type="number"
                    value={newSession.totalConductoresAprobados}
                    onChange={(e) => setNewSession({ ...newSession, totalConductoresAprobados: Number(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Resumen del Temario</label>
                <textarea
                  rows={2}
                  value={newSession.temarioResumen || ''}
                  onChange={(e) => setNewSession({ ...newSession, temarioResumen: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                  placeholder="Temas principales abordados en la sesión..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-1.5 text-xs text-gray-600 font-bold hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newSession.nombreCurso.trim()) return;
                  if (editingSessionId) {
                    setTrainingSessions(prev =>
                      prev.map(s =>
                        s.id === editingSessionId
                          ? { ...newSession, id: editingSessionId }
                          : s
                      )
                    );
                  } else {
                    const created: PESVTrainingSession = {
                      ...newSession,
                      id: `CAP-2026-${Date.now().toString().slice(-3)}`,
                      codigoCurso: newSession.codigoCurso.trim() || `CUR-${Date.now().toString().slice(-3)}`
                    };
                    setTrainingSessions([created, ...trainingSessions]);
                  }
                  setEditingSessionId(null);
                  setShowAddModal(false);
                }}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs"
              >
                {editingSessionId ? 'Guardar Cambios' : 'Guardar Sesión'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
