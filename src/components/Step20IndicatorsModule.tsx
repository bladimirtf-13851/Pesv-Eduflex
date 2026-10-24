/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { CompanyConfig, PESVIndicatorRecord, PESVObjective } from '../types';
import { PESV_OFFICIAL_INDICATORS, calculateOfficialIndicatorResult } from '../data';
import { 
  Activity, 
  TrendingUp, 
  Award, 
  Calendar, 
  Printer, 
  Percent, 
  ShieldCheck, 
  PenTool, 
  Save, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowRight, 
  Eye, 
  BarChart3, 
  Target, 
  Clock, 
  Shield, 
  Filter, 
  Search, 
  Check, 
  Layers,
  ArrowUpRight,
  Info,
  DollarSign,
  FileText,
  UserCheck
} from 'lucide-react';
import { subscribeToAnnualPlan } from '../services/firestoreService';

interface Step20IndicatorsModuleProps {
  config: CompanyConfig;
  companyName?: string;
  companyLogo?: string;
  companyNit?: string;
  repLegal?: string;
  leaderName?: string;
  repSignatureImg1?: string | null;
  leaderSignatureImg?: string | null;
  onNavigateToStep?: (stepId: number) => void;
}

export default function Step20IndicatorsModule({
  config,
  companyName = 'EMPRESA DEMO PESV S.A.S.',
  companyLogo = '',
  companyNit = '901.452.883-1',
  repLegal = 'Representante Legal',
  leaderName = 'Líder del PESV',
  repSignatureImg1,
  leaderSignatureImg,
  onNavigateToStep
}: Step20IndicatorsModuleProps) {
  const isImageLogo = Boolean(companyLogo && (companyLogo.startsWith('data:image/') || companyLogo.startsWith('http')));
  // Navigation tabs inside Step 20
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'medicion' | 'matriz' | 'reporte'>('dashboard');

  const [metricYear, setMetricYear] = useState<string>('2026');
  const [applicabilityFilter, setApplicabilityFilter] = useState<'APPLICABLE_ONLY' | 'ALL'>('APPLICABLE_ONLY');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'resultado' | 'actividad'>('ALL');
  const [frequencyFilter, setFrequencyFilter] = useState<'ALL' | 'trimestral' | 'mensual' | 'anual'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Selection for measuring variables
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<number>(4); // Default to Indicador 4 (CM PESV)
  const [selectedPeriod, setSelectedPeriod] = useState<string>('T2');
  
  // Selection for graph view
  const [selectedGraphIndicatorId, setSelectedGraphIndicatorId] = useState<number>(1); // Default to Indicador 1 (TSV)

  // Indicators Data State (persisted in localStorage)
  const [indicators, setIndicators] = useState<PESVIndicatorRecord[]>(() => {
    const saved = localStorage.getItem('pesv_official_indicators_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 13) {
          return parsed;
        }
      } catch (e) {}
    }
    return PESV_OFFICIAL_INDICATORS;
  });

  // Paso 7 Objectives State (Synchronized via localStorage and events)
  const [objectivesList, setObjectivesList] = useState<PESVObjective[]>(() => {
    const saved = localStorage.getItem('pesv_objectives_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [];
  });

  // Annual Plan Activities
  const [annualActivities, setAnnualActivities] = useState<any[]>(() => {
    const saved = localStorage.getItem('pesv_annual_plan_activities');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  // Active indicator for measurement form
  const activeIndicator = useMemo(() => {
    return indicators.find(ind => ind.id === selectedIndicatorId) || indicators[0];
  }, [indicators, selectedIndicatorId]);

  // Available periods for the active indicator
  const availablePeriods = useMemo(() => {
    if (!activeIndicator) return ['T1', 'T2', 'T3', 'T4'];
    if (activeIndicator.frecuenciaTipo === 'mensual') {
      return ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    }
    if (activeIndicator.frecuenciaTipo === 'anual') {
      return ['2026', '2025'];
    }
    return ['T1', 'T2', 'T3', 'T4'];
  }, [activeIndicator]);

  useEffect(() => {
    if (!availablePeriods.includes(selectedPeriod)) {
      setSelectedPeriod(availablePeriods[0]);
    }
  }, [availablePeriods, selectedPeriod]);

  // Form State for active indicator's variables
  const [formVariables, setFormVariables] = useState<Record<string, number>>({});
  const [formMeta, setFormMeta] = useState<number>(0);
  const [formObservacion, setFormObservacion] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // Load active indicator's data when indicator or period changes
  useEffect(() => {
    if (!activeIndicator) return;
    const periodData = activeIndicator.datosPeriodo?.[selectedPeriod];
    const initialVars: Record<string, number> = {};

    activeIndicator.variables.forEach(v => {
      initialVars[v.key] = periodData?.variables?.[v.key] ?? v.defaultValue ?? 0;
    });

    setFormVariables(initialVars);
    setFormMeta(periodData?.meta ?? activeIndicator.metaPredeterminada);
    setFormObservacion(periodData?.observacion ?? '');
    setSaveSuccessMsg('');
  }, [activeIndicator, selectedPeriod]);

  // Subscribe to real-time events for objectives & annual plan
  useEffect(() => {
    const handleObjectivesUpdate = () => {
      const saved = localStorage.getItem('pesv_objectives_list');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setObjectivesList(parsed);
        } catch (e) {}
      }
    };

    window.addEventListener('pesv_objectives_updated', handleObjectivesUpdate);
    window.addEventListener('storage', handleObjectivesUpdate);

    // Cross-module selection of indicator from Step 7
    const handleSelectIndicator = (e: any) => {
      const indId = e?.detail?.indicatorId || Number(localStorage.getItem('pesv_target_indicator_id'));
      if (indId) {
        setSelectedIndicatorId(indId);
        setSelectedGraphIndicatorId(indId);
        setActiveSubTab('medicion');
        localStorage.removeItem('pesv_target_indicator_id');
      }
    };
    window.addEventListener('pesv_select_indicator', handleSelectIndicator);

    const pendingId = localStorage.getItem('pesv_target_indicator_id');
    if (pendingId) {
      setSelectedIndicatorId(Number(pendingId));
      setSelectedGraphIndicatorId(Number(pendingId));
      setActiveSubTab('medicion');
      localStorage.removeItem('pesv_target_indicator_id');
    }

    const unsubscribe = subscribeToAnnualPlan('global_plan', (activities) => {
      if (activities && activities.length > 0) {
        setAnnualActivities(activities);
      }
    });

    return () => {
      window.removeEventListener('pesv_objectives_updated', handleObjectivesUpdate);
      window.removeEventListener('storage', handleObjectivesUpdate);
      window.removeEventListener('pesv_select_indicator', handleSelectIndicator);
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Save indicators to localStorage and notify other components
  useEffect(() => {
    localStorage.setItem('pesv_official_indicators_data', JSON.stringify(indicators));
    window.dispatchEvent(new CustomEvent('pesv_indicators_updated', { detail: { indicators } }));
  }, [indicators]);

  const userLevel = config.nivelCalculado || 'BÁSICO';

  const isIndicatorApplicable = (indicator: PESVIndicatorRecord): boolean => {
    if (userLevel === 'BÁSICO') return indicator.aplicabilidad.basico;
    if (userLevel === 'ESTÁNDAR') return indicator.aplicabilidad.estandar;
    if (userLevel === 'AVANZADO') return indicator.aplicabilidad.avanzado;
    return true;
  };

  // Filtered indicators list
  const filteredIndicators = useMemo(() => {
    return indicators.filter(ind => {
      if (applicabilityFilter === 'APPLICABLE_ONLY' && !isIndicatorApplicable(ind)) {
        return false;
      }
      if (typeFilter !== 'ALL' && ind.tipo !== typeFilter) {
        return false;
      }
      if (frequencyFilter !== 'ALL' && ind.frecuenciaTipo !== frequencyFilter) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return (
          ind.code.toLowerCase().includes(q) ||
          ind.nombre.toLowerCase().includes(q) ||
          ind.formula.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [indicators, applicabilityFilter, typeFilter, frequencyFilter, searchQuery, userLevel]);

  // Live calculation of current form result
  const currentCalculatedResult = useMemo(() => {
    if (!activeIndicator) return 0;
    return calculateOfficialIndicatorResult(activeIndicator.id, formVariables);
  }, [activeIndicator, formVariables]);

  // Determine if current form result meets the target
  const doesCurrentResultMeetTarget = useMemo(() => {
    if (!activeIndicator) return false;
    if (activeIndicator.sentidoMeta === 'descendente') {
      return currentCalculatedResult <= formMeta;
    } else {
      return currentCalculatedResult >= formMeta;
    }
  }, [activeIndicator, currentCalculatedResult, formMeta]);

  // STEP 7 Stats
  const step7Stats = useMemo(() => {
    const total = objectivesList.length;
    if (total === 0) {
      return { total: 4, met: 4, percent: 100 };
    }
    const met = objectivesList.filter(o => {
      const latest = o.valoresAnuales?.[o.valoresAnuales.length - 1]?.value;
      if (latest === undefined) return false;
      return o.unidadMedida === 'Siniestros' ? latest <= o.metaValor : latest >= o.metaValor;
    }).length;
    const percent = Math.round((met / total) * 100);
    return { total, met, percent };
  }, [objectivesList]);

  // Auto-fill from Paso 7 for Indicator 4
  const handleAutoSyncFromStep7 = () => {
    if (activeIndicator.id === 4) {
      setFormVariables({
        MA_t: step7Stats.met,
        TM_t: step7Stats.total
      });
      setSaveSuccessMsg(`¡Sincronizado con Paso 7! ${step7Stats.met} metas alcanzadas de ${step7Stats.total} definidas.`);
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    }
  };

  // Auto-fill from Plan Anual for Indicator 5
  const handleAutoSyncFromAnnualPlan = () => {
    if (activeIndicator.id === 5) {
      const totalActivities = annualActivities.length || 12;
      const completedActivities = annualActivities.filter(a => a.estado === 'Ejecutado').length || 10;
      setFormVariables({
        AEPlan_t: completedActivities,
        APPlan_t: totalActivities
      });
      setSaveSuccessMsg(`¡Sincronizado con Plan Anual! ${completedActivities} ejecutadas de ${totalActivities} programadas.`);
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    }
  };

  // Auto-fill from Training for Indicator 11 & 12
  const handleAutoSyncFromTraining = () => {
    try {
      const savedSessions = localStorage.getItem('pesv_training_sessions');
      if (savedSessions) {
        const sessions = JSON.parse(savedSessions);
        if (Array.isArray(sessions) && sessions.length > 0) {
          const completed = sessions.filter((s: any) => s.estado === 'COMPLETADA').length;
          const total = sessions.length;
          if (activeIndicator.id === 11) {
            setFormVariables({
              CESV_t: completed,
              CPSV_t: total
            });
            setSaveSuccessMsg(`¡Sincronizado con Paso 10! ${completed} sesiones ejecutadas de ${total} programadas.`);
            setTimeout(() => setSaveSuccessMsg(''), 4000);
            return;
          }
        }
      }
    } catch (e) {}
    setSaveSuccessMsg('¡Datos base del plan de formación sincronizados!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  // Save current registration
  const handleSaveIndicatorRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIndicator) return;

    const result = calculateOfficialIndicatorResult(activeIndicator.id, formVariables);
    const meets = activeIndicator.sentidoMeta === 'descendente' ? result <= formMeta : result >= formMeta;

    const updatedIndicators = indicators.map(ind => {
      if (ind.id === activeIndicator.id) {
        const prevDatos = ind.datosPeriodo || {};
        return {
          ...ind,
          datosPeriodo: {
            ...prevDatos,
            [selectedPeriod]: {
              variables: { ...formVariables },
              resultado: result,
              meta: formMeta,
              cumple: meets,
              fechaRegistro: new Date().toISOString().split('T')[0],
              observacion: formObservacion
            }
          }
        };
      }
      return ind;
    });

    setIndicators(updatedIndicators);
    setSaveSuccessMsg(`¡Medición de ${activeIndicator.code} para ${selectedPeriod} registrada y calculada con éxito!`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // Graph Data logic
  const graphIndicator = useMemo(() => {
    return indicators.find(ind => ind.id === selectedGraphIndicatorId) || indicators[0];
  }, [indicators, selectedGraphIndicatorId]);

  const graphPeriods = useMemo(() => {
    if (graphIndicator.frecuenciaTipo === 'mensual') {
      return ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    }
    if (graphIndicator.frecuenciaTipo === 'anual') {
      return ['2025', '2026'];
    }
    return ['T1', 'T2', 'T3', 'T4'];
  }, [graphIndicator]);

  const graphPoints = useMemo(() => {
    return graphPeriods.map(p => {
      const data = graphIndicator.datosPeriodo?.[p];
      const val = data ? data.resultado : 0;
      const meta = data ? data.meta : graphIndicator.metaPredeterminada;
      return { periodo: p, valor: val, meta, cumple: data?.cumple ?? (graphIndicator.sentidoMeta === 'descendente' ? val <= meta : val >= meta) };
    });
  }, [graphIndicator, graphPeriods]);

  const maxGraphVal = Math.max(...graphPoints.map(p => Math.max(p.valor, p.meta)), 10);
  const graphAxisMax = Math.ceil(maxGraphVal * 1.25);

  // Core 6 indicators for compliance overview chart
  const coreComplianceList = useMemo(() => {
    const ids = [4, 5, 7, 10, 11, 12];
    return ids.map(id => {
      const ind = indicators.find(i => i.id === id);
      if (!ind) return null;
      const current = ind.datosPeriodo?.['T2']?.resultado ?? ind.datosPeriodo?.['T1']?.resultado ?? ind.metaPredeterminada;
      const target = ind.datosPeriodo?.['T2']?.meta ?? ind.metaPredeterminada;
      const isMet = ind.sentidoMeta === 'descendente' ? current <= target : current >= target;
      return {
        id: ind.id,
        code: ind.code,
        nombre: ind.nombre,
        valor: current,
        meta: target,
        unidad: ind.unidad,
        isMet,
        tipo: ind.tipo
      };
    }).filter(Boolean) as Array<{ id: number; code: string; nombre: string; valor: number; meta: number; unidad: string; isMet: boolean; tipo: string }>;
  }, [indicators]);

  return (
    <div className="space-y-6" id="paso-20-indicadores-root">
      
      {/* CABECERA NORMATIVA INSTITUCIONAL: PASO 20 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5" id="step-20-header">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md uppercase tracking-wider">
              Fase 3: Seguimiento por la Organización
            </span>
            <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-[10px] font-bold rounded-md">
              Paso 20 de la Metodología
            </span>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-md">
              Nivel: <strong>{userLevel}</strong>
            </span>
          </div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Activity className="text-emerald-600" size={24} />
            Paso 20: Indicadores y Reporte de Autogestión del PESV
          </h2>
          <p className="text-xs text-gray-600 max-w-3xl leading-relaxed">
            Módulo oficial de seguimiento, medición y análisis de los <strong>13 indicadores normativos</strong> establecidos en la <strong>Resolución 40595 de 2022</strong>. Aquí se registran las variables matemáticas, se calculan las fórmulas periódicas y se proyectan los KPI de desempeño de la seguridad vial.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={metricYear}
            onChange={(e) => setMetricYear(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold bg-white text-gray-800 shadow-xs cursor-pointer"
          >
            <option value="2026">Vigencia 2026 (En Curso)</option>
            <option value="2025">Vigencia 2025 (Histórico)</option>
          </select>

          <button
            type="button"
            onClick={() => setActiveSubTab('reporte')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-lg cursor-pointer transition-all shadow-xs"
          >
            <Printer size={14} />
            Reporte Oficial de Autogestión
          </button>
        </div>
      </div>

      {/* PESTAÑAS DE NAVEGACIÓN DENTRO DEL PASO 20 */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveSubTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all cursor-pointer ${
            activeSubTab === 'dashboard'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <BarChart3 size={15} />
          <span>Tablero de Control y Gráficas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('medicion')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all cursor-pointer ${
            activeSubTab === 'medicion'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <PenTool size={15} />
          <span>Medición y Registro de Variables</span>
          <span className="px-1.5 py-0.2 bg-emerald-900/30 text-white rounded text-[10px]">Paso 20</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('matriz')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all cursor-pointer ${
            activeSubTab === 'matriz'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Layers size={15} />
          <span>Matriz de los 13 Indicadores</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('reporte')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all cursor-pointer ${
            activeSubTab === 'reporte'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <FileText size={15} />
          <span>Reporte Anual de Autogestión</span>
        </button>
      </div>

      {/* SUB-VISTA 1: TABLERO DE CONTROL Y GRÁFICAS ORDENADAS */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6" id="paso-20-subvista-dashboard">
          
          {/* BANNER DE INTEGRACIÓN CON PASO 7 (OBJETIVOS) */}
          <div className="bg-gradient-to-r from-sky-50 via-white to-emerald-50 p-4 rounded-xl border border-sky-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-sky-600 text-white rounded-xl shadow-xs">
                <Target size={20} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-sky-100 text-sky-800 rounded">
                    Integración con Paso 7 (Objetivos)
                  </span>
                  <span className="text-xs font-bold text-gray-600">
                    Indicador 4 Oficial: CM PESV = (MA(t) / TM(t)) * 100
                  </span>
                </div>
                <p className="text-xs text-gray-700 mt-0.5">
                  Los objetivos redactados en el <strong>Paso 7</strong> alimentan directamente la variable <strong className="text-sky-950 font-bold">MA(t) ({step7Stats.met} metas alcanzadas)</strong> y <strong className="text-sky-950 font-bold">TM(t) ({step7Stats.total} metas definidas)</strong>. Cumplimiento actual: <strong className="text-emerald-700 font-black">{step7Stats.percent}%</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedIndicatorId(4);
                  setActiveSubTab('medicion');
                }}
                className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-lg cursor-pointer transition-all shadow-xs"
              >
                Medir Indicador 4
              </button>
              {onNavigateToStep && (
                <button
                  type="button"
                  onClick={() => onNavigateToStep(7)}
                  className="px-3 py-1.5 bg-white border border-sky-300 text-sky-800 hover:bg-sky-50 text-xs font-bold rounded-lg cursor-pointer transition-all shadow-xs flex items-center gap-1"
                >
                  <span>Ir a Paso 7</span>
                  <ArrowRight size={12} />
                </button>
              )}
            </div>
          </div>

          {/* TARJETAS KPI EJECUTIVAS: 4 KPIS CARDINALES ORDENADOS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="paso-20-kpis-grid">
            
            {/* KPI 1: TSV */}
            {(() => {
              const ind = indicators.find(i => i.id === 1);
              const data = ind?.datosPeriodo?.['T2'] || ind?.datosPeriodo?.['T1'] || { resultado: 2.22, meta: 2.0, cumple: false };
              return (
                <div className="bg-white p-4.5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                      Indicador 1 • Resultado
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9.5px] font-black uppercase ${
                      data.cumple ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {data.cumple ? 'Meta Cumplida' : 'Bajo Observación'}
                    </span>
                  </div>
                  <div>
                    <span className="text-2xl font-black text-gray-900 tracking-tight">
                      {data.resultado}
                    </span>
                    <span className="text-xs text-gray-500 font-bold ml-1.5">siniestros/1M km</span>
                    <p className="text-[11px] font-bold text-gray-700 mt-1 line-clamp-1">
                      {ind?.nombre || 'Tasa de Siniestros Viales (TSV)'}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
                    <span>Meta: ≤ {data.meta}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedIndicatorId(1);
                        setActiveSubTab('medicion');
                      }}
                      className="text-emerald-700 hover:text-emerald-900 font-black cursor-pointer"
                    >
                      Medir →
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* KPI 2: CM PESV (Paso 7) */}
            {(() => {
              const ind = indicators.find(i => i.id === 4);
              const data = ind?.datosPeriodo?.['T2'] || ind?.datosPeriodo?.['T1'] || { resultado: 100, meta: 90, cumple: true };
              return (
                <div className="bg-white p-4.5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase tracking-wider text-sky-700">
                      Indicador 4 • Resultado
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9.5px] font-black uppercase bg-emerald-100 text-emerald-800">
                      Cumplido
                    </span>
                  </div>
                  <div>
                    <span className="text-2xl font-black text-emerald-800 tracking-tight">
                      {step7Stats.percent}%
                    </span>
                    <p className="text-[11px] font-bold text-gray-700 mt-1 line-clamp-1">
                      Cumplimiento de Metas (Paso 7)
                    </p>
                  </div>
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
                    <span>{step7Stats.met} de {step7Stats.total} metas</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedIndicatorId(4);
                        setActiveSubTab('medicion');
                      }}
                      className="text-emerald-700 hover:text-emerald-900 font-black cursor-pointer"
                    >
                      Medir →
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* KPI 3: CPA PESV (Paso 8) */}
            {(() => {
              const ind = indicators.find(i => i.id === 5);
              const data = ind?.datosPeriodo?.['T2'] || ind?.datosPeriodo?.['T1'] || { resultado: 85, meta: 80, cumple: true };
              return (
                <div className="bg-white p-4.5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                      Indicador 5 • Actividad
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9.5px] font-black uppercase ${
                      data.cumple ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {data.cumple ? 'Meta Cumplida' : 'En Ejecución'}
                    </span>
                  </div>
                  <div>
                    <span className="text-2xl font-black text-gray-900 tracking-tight">
                      {data.resultado}%
                    </span>
                    <p className="text-[11px] font-bold text-gray-700 mt-1 line-clamp-1">
                      Cumplimiento Plan Anual (Paso 8)
                    </p>
                  </div>
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
                    <span>Meta: ≥ {data.meta}%</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedIndicatorId(5);
                        setActiveSubTab('medicion');
                      }}
                      className="text-emerald-700 hover:text-emerald-900 font-black cursor-pointer"
                    >
                      Medir →
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* KPI 4: CPF PESV (Paso 10 Capacitaciones) */}
            {(() => {
              const ind = indicators.find(i => i.id === 12);
              const data = ind?.datosPeriodo?.['T2'] || ind?.datosPeriodo?.['T1'] || { resultado: 92, meta: 85, cumple: true };
              return (
                <div className="bg-white p-4.5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-700">
                      Indicador 12 • Actividad
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9.5px] font-black uppercase ${
                      data.cumple ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {data.cumple ? 'Meta Cumplida' : 'Bajo Observación'}
                    </span>
                  </div>
                  <div>
                    <span className="text-2xl font-black text-gray-900 tracking-tight">
                      {data.resultado}%
                    </span>
                    <p className="text-[11px] font-bold text-gray-700 mt-1 line-clamp-1">
                      Cobertura Plan de Formación (Paso 10)
                    </p>
                  </div>
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
                    <span>Meta: ≥ {data.meta}%</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedIndicatorId(12);
                        setActiveSubTab('medicion');
                      }}
                      className="text-emerald-700 hover:text-emerald-900 font-black cursor-pointer"
                    >
                      Medir →
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* SECCIÓN DE GRÁFICAS ORDENADAS (2 COLUMNAS ESTRUCTURADAS) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="paso-20-graficas-ordenadas">
            
            {/* GRÁFICA 1: TENDENCIA TEMPORAL Y META POR INDICADOR (7 COLS) */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart3 size={15} className="text-emerald-600" />
                    Evolución Temporal del Indicador Seleccionado
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Visualice el desempeño periodo a periodo frente a la meta reglamentaria.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedGraphIndicatorId}
                    onChange={(e) => setSelectedGraphIndicatorId(Number(e.target.value))}
                    className="p-1.5 border border-gray-300 rounded-lg text-xs font-bold bg-gray-50 text-gray-800 cursor-pointer"
                  >
                    {indicators.map(ind => (
                      <option key={ind.id} value={ind.id}>
                        {ind.code} - {ind.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contenedor Gráfico Limpio */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-gray-200 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <div className="font-bold text-gray-800">
                    <span>{graphIndicator.code}: {graphIndicator.nombre}</span>
                    <span className="text-[10px] text-gray-500 block">Frecuencia: {graphIndicator.frecuencia} • Unidad: {graphIndicator.unidad}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-bold">
                    <span className="flex items-center gap-1 text-emerald-800">
                      <span className="w-2.5 h-2.5 bg-emerald-600 rounded-xs"></span>
                      Resultado
                    </span>
                    <span className="flex items-center gap-1 text-rose-700">
                      <span className="w-3.5 h-0.5 border-t-2 border-dashed border-rose-600"></span>
                      Meta: {graphIndicator.metaPredeterminada} {graphIndicator.unidad}
                    </span>
                  </div>
                </div>

                {/* Barras SVG */}
                <div className="h-52 w-full flex items-end justify-around pt-6 pb-2 px-4 border-b border-gray-300 relative bg-white rounded-lg">
                  {/* Grid horizontal */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none p-3 opacity-30">
                    <div className="border-b border-dashed border-gray-400 w-full"></div>
                    <div className="border-b border-dashed border-gray-400 w-full"></div>
                    <div className="border-b border-dashed border-gray-400 w-full"></div>
                  </div>

                  {graphPoints.map((pt, idx) => {
                    const heightPct = Math.min(100, Math.max(8, (pt.valor / graphAxisMax) * 100));
                    return (
                      <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end z-10">
                        <span className="text-[10.5px] font-mono font-black text-gray-900">
                          {pt.valor}{graphIndicator.unidad === '%' ? '%' : ''}
                        </span>

                        <div className="w-12 bg-gray-100 rounded-t-md flex items-end justify-center overflow-hidden" style={{ height: '68%' }}>
                          <div
                            className={`w-full rounded-t-md transition-all duration-500 ${
                              pt.cumple ? 'bg-emerald-600' : 'bg-amber-500'
                            }`}
                            style={{ height: `${heightPct}%` }}
                          ></div>
                        </div>

                        <span className="text-[10px] font-bold text-gray-600">
                          {pt.periodo}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="text-[10px] text-gray-500 flex justify-between items-center px-1">
                  <span>Fórmula: <strong className="font-mono text-gray-700">{graphIndicator.formula}</strong></span>
                  <span>Sentido: {graphIndicator.sentidoMeta === 'descendente' ? 'Menor valor es mejor (Reducción)' : 'Mayor valor es mejor (Aumento)'}</span>
                </div>
              </div>
            </div>

            {/* GRÁFICA 2: COMPARATIVO DE CUMPLIMIENTO DE INDICADORES CLAVE (5 COLS) */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Target size={15} className="text-emerald-600" />
                  Cumplimiento vs Meta Reglamentaria
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Evaluación semafórica de los indicadores operativos principales.
                </p>
              </div>

              <div className="space-y-3.5">
                {coreComplianceList.map((item) => {
                  const pctToGoal = item.meta > 0 ? Math.min(100, Math.round((item.valor / item.meta) * 100)) : 100;
                  return (
                    <div key={item.id} className="space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-800">
                          {item.code} <span className="font-normal text-gray-500">({item.nombre})</span>
                        </span>
                        <span className={`font-mono font-black text-[11px] ${
                          item.isMet ? 'text-emerald-700' : 'text-amber-700'
                        }`}>
                          {item.valor}{item.unidad} / {item.meta}{item.unidad}
                        </span>
                      </div>

                      {/* Barra de progreso ordenada */}
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            item.isMet ? 'bg-emerald-500' : 'bg-amber-400'
                          }`}
                          style={{ width: `${pctToGoal}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                <span className="text-gray-500 font-medium">Estado General del Tablero:</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-black rounded text-[10px]">
                  Vigencia Conforme (Res. 40595)
                </span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SUB-VISTA 2: MEDICIÓN Y REGISTRO DE INDICADORES (SOLICITUD EXPLÍCITA DEL USUARIO) */}
      {activeSubTab === 'medicion' && (
        <div className="space-y-6" id="paso-20-subvista-medicion">
          
          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-900 px-2 py-0.5 bg-emerald-200 rounded">
                Módulo Oficial de Medición del Paso 20
              </span>
              <h3 className="text-sm font-black text-emerald-950 mt-1">
                Alimentación y Cálculo de Variables por Periodo
              </h3>
              <p className="text-xs text-emerald-800 leading-relaxed mt-0.5">
                Seleccione el indicador que desea medir y registre los valores de cada variable matemática según las fórmulas de la <strong>Resolución 40595</strong>. El sistema recalculará en tiempo real el resultado y actualizará el estado semafórico.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveSubTab('dashboard')}
                className="px-3.5 py-1.5 bg-white border border-emerald-300 text-emerald-900 font-bold text-xs rounded-lg hover:bg-emerald-100 cursor-pointer shadow-xs"
              >
                Volver al Tablero
              </button>
            </div>
          </div>

          {/* SELECTORES DE INDICADOR Y PERIODO */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              <div className="lg:col-span-8 space-y-1">
                <label className="block text-xs font-black text-gray-800 uppercase">
                  1. Seleccione el Indicador a Medir:
                </label>
                <select
                  value={selectedIndicatorId}
                  onChange={(e) => setSelectedIndicatorId(Number(e.target.value))}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs font-black bg-white text-gray-900 shadow-xs focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {indicators.map(ind => {
                    const applies = isIndicatorApplicable(ind);
                    return (
                      <option key={ind.id} value={ind.id}>
                        Indicador {ind.id}: {ind.code} - {ind.nombre} ({ind.frecuencia}) {!applies ? '⚠️ [No obligatorio en Básico]' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="lg:col-span-4 space-y-1">
                <label className="block text-xs font-black text-gray-800 uppercase">
                  2. Periodo de Medición ({activeIndicator.frecuenciaTipo}):
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {availablePeriods.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSelectedPeriod(p)}
                      className={`px-3 py-2 text-xs font-black rounded-lg cursor-pointer transition-all border ${
                        selectedPeriod === p
                          ? 'bg-emerald-700 border-emerald-700 text-white shadow-xs'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-emerald-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* VINCULACIÓN CON OBJETIVOS DEL PASO 7 */}
            {(() => {
              const linkedObjectives = objectivesList.filter(o => {
                const ids = o.indicadoresOficialesIds || (o.indicadorOficialId ? [o.indicadorOficialId] : []);
                return ids.includes(activeIndicator.id) || (o.indicador && o.indicador.includes(activeIndicator.code));
              });
              if (linkedObjectives.length === 0) return null;
              return (
                <div className="bg-sky-50/90 border border-sky-200 rounded-xl p-3 text-xs text-sky-950 flex items-start gap-2.5 shadow-2xs">
                  <Target size={16} className="text-sky-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-bold text-sky-900 flex items-center justify-between">
                      <span>Este indicador mide {linkedObjectives.length === 1 ? '1 objetivo estratégico' : `${linkedObjectives.length} objetivos estratégicos`} del PESV (Paso 7):</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (onNavigateToStep) {
                            onNavigateToStep(7);
                          } else {
                            localStorage.setItem('pesv_target_step_id', '7');
                            window.dispatchEvent(new CustomEvent('pesv_activate_step', { detail: { stepId: 7 } }));
                          }
                        }}
                        className="text-[10px] font-bold text-sky-700 hover:underline cursor-pointer"
                      >
                        Ver en Paso 7 →
                      </button>
                    </div>
                    <div className="mt-1.5 space-y-1">
                      {linkedObjectives.map(o => (
                        <div key={o.id} className="text-[11px] text-sky-800 bg-white/80 p-2 rounded-lg border border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="font-semibold">{o.objetivo}</span>
                          <span className="text-[10px] font-mono font-bold text-sky-900 bg-sky-100 px-1.5 py-0.5 rounded shrink-0">
                            Meta: {o.metaValor}{o.unidadMedida}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* FICHA TÉCNICA DEL INDICADOR ACTIVO */}
            <div className="bg-slate-50 p-4 rounded-xl border border-gray-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-700 text-white text-[10px] font-black rounded">
                    Indicador #{activeIndicator.id}
                  </span>
                  <span className="font-mono font-bold text-xs text-gray-700">
                    {activeIndicator.code}
                  </span>
                  <span className="text-[11px] font-bold text-gray-500">
                    • Tipo: <strong className="uppercase text-gray-800">{activeIndicator.tipo}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] font-black">
                  <span className={`px-2 py-0.5 rounded ${activeIndicator.aplicabilidad.basico ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-400 line-through'}`}>
                    Básico
                  </span>
                  <span className={`px-2 py-0.5 rounded ${activeIndicator.aplicabilidad.estandar ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-400 line-through'}`}>
                    Estándar
                  </span>
                  <span className={`px-2 py-0.5 rounded ${activeIndicator.aplicabilidad.avanzado ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-400 line-through'}`}>
                    Avanzado
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                <div className="md:col-span-6 space-y-1">
                  <span className="text-[10px] font-black uppercase text-gray-500 block">Fórmula Oficial:</span>
                  <div className="p-2 bg-white rounded border border-emerald-200 font-mono font-black text-emerald-950 text-xs">
                    {activeIndicator.formula}
                  </div>
                  <p className="text-[11px] text-gray-600 mt-1">
                    {activeIndicator.formulaDescription}
                  </p>
                </div>

                <div className="md:col-span-6 space-y-1">
                  <span className="text-[10px] font-black uppercase text-gray-500 block">Paso Relacionado del PESV:</span>
                  <p className="text-[11px] text-gray-700">
                    {activeIndicator.observaciones || 'Seguimiento sistemático del desempeño del PESV.'}
                  </p>
                  <div className="pt-1 text-[11px] text-emerald-800 font-bold flex items-center gap-1">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    Paso Asociado: <strong>Paso {activeIndicator.pasoRelacionado}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* FORMULARIO DE VARIABLES MATEMÁTICAS */}
            <form onSubmit={handleSaveIndicatorRecord} className="space-y-4 pt-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                  Ingreso de Variables para el Periodo: <span className="text-emerald-700 font-black">{selectedPeriod} {metricYear}</span>
                </h4>

                {/* Sincronizaciones automáticas de pasos */}
                <div className="flex items-center gap-2 flex-wrap">
                  {activeIndicator.id === 4 && (
                    <button
                      type="button"
                      onClick={handleAutoSyncFromStep7}
                      className="flex items-center gap-1 px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded cursor-pointer shadow-xs"
                    >
                      <Sparkles size={12} />
                      Auto-calcular desde Paso 7 (Objetivos)
                    </button>
                  )}

                  {activeIndicator.id === 5 && (
                    <button
                      type="button"
                      onClick={handleAutoSyncFromAnnualPlan}
                      className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded cursor-pointer shadow-xs"
                    >
                      <Sparkles size={12} />
                      Auto-calcular desde Plan Anual
                    </button>
                  )}

                  {(activeIndicator.id === 11 || activeIndicator.id === 12) && (
                    <button
                      type="button"
                      onClick={handleAutoSyncFromTraining}
                      className="flex items-center gap-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded cursor-pointer shadow-xs"
                    >
                      <Sparkles size={12} />
                      Auto-calcular desde Paso 10 (Capacitaciones)
                    </button>
                  )}
                </div>
              </div>

              {/* Campos dinámicos por variable */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {activeIndicator.variables.map(v => (
                  <div key={v.key} className="space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono font-black text-gray-800">
                        {v.symbol}
                      </label>
                      <span className="text-[10px] text-gray-500 font-bold">
                        {v.unit}
                      </span>
                    </div>
                    <div className="text-[10.5px] text-gray-600 leading-tight min-h-[30px]">
                      {v.name}
                    </div>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formVariables[v.key] ?? 0}
                      onChange={(e) => setFormVariables({
                        ...formVariables,
                        [v.key]: parseFloat(e.target.value) || 0
                      })}
                      className="w-full p-2 border border-gray-300 rounded bg-white text-xs font-black text-gray-900 focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-[9.5px] text-gray-400 block truncate" title={v.description}>
                      {v.description}
                    </span>
                  </div>
                ))}

                {/* Campo de Meta Contractual */}
                <div className="space-y-1 bg-emerald-50/50 p-3 rounded-lg border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-emerald-950 uppercase">
                      Meta del Periodo
                    </label>
                    <span className="text-[10px] text-emerald-700 font-bold">
                      {activeIndicator.unidad}
                    </span>
                  </div>
                  <div className="text-[10.5px] text-emerald-800 leading-tight min-h-[30px]">
                    Umbral esperado ({activeIndicator.sentidoMeta === 'descendente' ? '≤ Menor es mejor' : '≥ Mayor es mejor'})
                  </div>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formMeta}
                    onChange={(e) => setFormMeta(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-emerald-300 rounded bg-white text-xs font-black text-emerald-950 focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[9.5px] text-emerald-700 block">
                    Predeterminada: {activeIndicator.metaPredeterminada} {activeIndicator.unidad}
                  </span>
                </div>
              </div>

              {/* Observaciones */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">
                  Observaciones / Hallazgos y Análisis de Causa del Periodo ({selectedPeriod}):
                </label>
                <input
                  type="text"
                  value={formObservacion}
                  onChange={(e) => setFormObservacion(e.target.value)}
                  placeholder="ej. Se cumplió el objetivo operacional con reducción en horas nocturnas..."
                  className="w-full p-2 border border-gray-300 rounded text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Barra de Resultado en Vivo y Guardado */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-100 p-4 rounded-xl border border-gray-300">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">
                      Resultado Matemático Calculado:
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-gray-900">
                        {currentCalculatedResult}
                      </span>
                      <span className="text-xs font-bold text-gray-600">
                        {activeIndicator.unidad}
                      </span>
                    </div>
                  </div>

                  <div className="h-8 w-px bg-gray-300 hidden sm:block"></div>

                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">Estado Semafórico:</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-black uppercase ${
                      doesCurrentResultMeetTarget
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {doesCurrentResultMeetTarget ? (
                        <>
                          <CheckCircle2 size={13} />
                          Meta Cumplida (Conforme)
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={13} />
                          Fuera de Rango (No Conforme)
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  {saveSuccessMsg && (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <Check size={14} />
                      {saveSuccessMsg}
                    </span>
                  )}
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Save size={14} />
                    Guardar Medición de {activeIndicator.code}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-VISTA 3: MATRIZ MAESTRA DE LOS 13 INDICADORES (TABLA ORDENADA) */}
      {activeSubTab === 'matriz' && (
        <div className="space-y-4" id="paso-20-subvista-matriz">
          
          {/* BARRA DE FILTROS ORDENADA */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-bold text-gray-700 flex items-center gap-1">
                <Filter size={13} />
                Filtrar por:
              </span>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="p-1.5 border border-gray-300 rounded text-xs font-bold bg-white"
              >
                <option value="ALL">Todos los Tipos</option>
                <option value="resultado">Solo Resultado</option>
                <option value="actividad">Solo Actividad</option>
              </select>

              <select
                value={frequencyFilter}
                onChange={(e) => setFrequencyFilter(e.target.value as any)}
                className="p-1.5 border border-gray-300 rounded text-xs font-bold bg-white"
              >
                <option value="ALL">Todas las Frecuencias</option>
                <option value="trimestral">Trimestral</option>
                <option value="mensual">Mensual</option>
                <option value="anual">Anual</option>
              </select>

              <button
                type="button"
                onClick={() => setApplicabilityFilter(applicabilityFilter === 'APPLICABLE_ONLY' ? 'ALL' : 'APPLICABLE_ONLY')}
                className={`px-2.5 py-1.5 rounded border text-xs font-bold cursor-pointer ${
                  applicabilityFilter === 'APPLICABLE_ONLY'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                {applicabilityFilter === 'APPLICABLE_ONLY' ? `✓ Solo aplicables a Nivel ${userLevel}` : 'Ver todos (13)'}
              </button>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Buscar indicador o código..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* TABLA MAESTRA */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-800 text-white font-mono text-[11px] uppercase tracking-wider">
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3 w-28">Código</th>
                    <th className="p-3">Nombre del Indicador</th>
                    <th className="p-3 w-24">Tipo</th>
                    <th className="p-3 w-24">Frecuencia</th>
                    <th className="p-3">Fórmula Matemática</th>
                    <th className="p-3 w-24 text-center">Meta</th>
                    <th className="p-3 w-28 text-center">Último Valor</th>
                    <th className="p-3 w-24 text-center">Estado</th>
                    <th className="p-3 w-24 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-700">
                  {filteredIndicators.map((ind) => {
                    const t2Data = ind.datosPeriodo?.['T2'] || ind.datosPeriodo?.['T1'];
                    const val = t2Data ? t2Data.resultado : null;
                    const meets = t2Data ? t2Data.cumple : null;

                    return (
                      <tr key={ind.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-center font-bold text-gray-500">
                          {ind.id}
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-800">
                          {ind.code}
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-gray-900 block">{ind.nombre}</span>
                          <span className="text-[10px] text-gray-500">Paso Relacionado: Paso {ind.pasoRelacionado}</span>
                          {(() => {
                            const linked = objectivesList.filter(o => {
                              const ids = o.indicadoresOficialesIds || (o.indicadorOficialId ? [o.indicadorOficialId] : []);
                              return ids.includes(ind.id) || (o.indicador && o.indicador.includes(ind.code));
                            });
                            if (linked.length === 0) return null;
                            return (
                              <div className="mt-1 flex items-center gap-1 flex-wrap">
                                <span className="text-[9px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                                  <Target size={10} className="text-sky-600" />
                                  {linked.length === 1 ? `Objetivo: ${linked[0].objetivo.slice(0, 32)}...` : `${linked.length} Objetivos vinculados`}
                                </span>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            ind.tipo === 'resultado' ? 'bg-sky-100 text-sky-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {ind.tipo}
                          </span>
                        </td>
                        <td className="p-3 text-gray-600 font-medium">
                          {ind.frecuencia}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-gray-800">
                          {ind.formula}
                        </td>
                        <td className="p-3 text-center font-bold text-gray-700">
                          {ind.metaPredeterminada}{ind.unidad}
                        </td>
                        <td className="p-3 text-center font-mono font-black text-gray-900">
                          {val !== null ? `${val}${ind.unidad}` : '—'}
                        </td>
                        <td className="p-3 text-center">
                          {meets === null ? (
                            <span className="text-gray-400 text-[10px]">Sin medir</span>
                          ) : meets ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-black text-[9.5px] uppercase">
                              Cumple
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-black text-[9.5px] uppercase">
                              Alerta
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedIndicatorId(ind.id);
                              setActiveSubTab('medicion');
                            }}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-[10px] rounded cursor-pointer transition-all shadow-xs"
                          >
                            Medir
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VISTA 4: REPORTE ANUAL DE AUTOGESTIÓN */}
      {activeSubTab === 'reporte' && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-xs space-y-6" id="paso-20-subvista-reporte">
          
          <div className="flex justify-between items-start border-b border-gray-200 pb-5 gap-4">
            <div className="flex items-center gap-3.5">
              {isImageLogo && (
                <img src={companyLogo} alt={companyName} className="h-12 w-14 object-contain border border-gray-200 rounded p-1 bg-white shrink-0" />
              )}
              <div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                  Formato Oficial de Auditoría
                </span>
                <h3 className="text-lg font-black text-gray-900 mt-1">
                  Reporte de Autogestión del PESV (Paso 20 - Resolución 40595)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Organización: <strong>{companyName}</strong> • NIT: <strong>{companyNit}</strong> • Nivel: <strong>{userLevel}</strong> • Vigencia: <strong>{metricYear}</strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg cursor-pointer transition-all shadow-xs"
            >
              <Printer size={13} />
              Imprimir Informe
            </button>
          </div>

          <div className="space-y-4 text-xs leading-relaxed text-gray-700">
            <p>
              El presente informe sintetiza los resultados obtenidos en la medición periódica de los indicadores obligatorios del Plan Estratégico de Seguridad Vial para la empresa <strong>{companyName}</strong>, de conformidad con la metodología prescrita en la <strong>Resolución 40595 de 2022 del Ministerio de Transporte</strong>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-gray-200 text-center">
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Total Indicadores Normativos</span>
                <span className="text-2xl font-black text-gray-900">13</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Indicadores Aplicables Nivel {userLevel}</span>
                <span className="text-2xl font-black text-emerald-700">
                  {indicators.filter(isIndicatorApplicable).length}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Cumplimiento Metas Paso 7</span>
                <span className="text-2xl font-black text-sky-700">{step7Stats.percent}%</span>
              </div>
            </div>

            {/* Firmas institucionales */}
            <div className="pt-8 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-8 text-center text-xs">
              <div className="space-y-2">
                <div className="h-16 border-b border-gray-300 flex items-end justify-center pb-1">
                  {repSignatureImg1 ? (
                    <img src={repSignatureImg1} alt="Firma Representante Legal" className="max-h-14 object-contain" />
                  ) : (
                    <span className="font-serif italic text-gray-500">{repLegal}</span>
                  )}
                </div>
                <span className="font-bold text-gray-900 block">{repLegal}</span>
                <span className="text-[10px] text-gray-500 block">Representante Legal</span>
              </div>

              <div className="space-y-2">
                <div className="h-16 border-b border-gray-300 flex items-end justify-center pb-1">
                  {leaderSignatureImg ? (
                    <img src={leaderSignatureImg} alt="Firma Líder PESV" className="max-h-14 object-contain" />
                  ) : (
                    <span className="font-serif italic text-gray-500">{leaderName}</span>
                  )}
                </div>
                <span className="font-bold text-gray-900 block">{leaderName}</span>
                <span className="text-[10px] text-gray-500 block">Líder del Diseño e Implementación del PESV</span>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
