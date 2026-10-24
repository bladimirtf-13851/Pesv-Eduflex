import React, { useState, useEffect } from 'react';
import {
  MapPin, AlertTriangle, CheckCircle2, ClipboardCheck, Plus, Edit3, Trash2,
  Download, Wrench, Eye, ShieldAlert, Calendar, DollarSign, User, CheckSquare,
  Sparkles, Search, Layers, X, ArrowRight, FileText, Upload
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { CompanyConfig } from '../types';
import { saveSystemSetting, subscribeToSystemSetting } from '../services/firestoreService';

export interface ConflictZoneItem {
  id: string;
  codigo: string;
  nombreZona: string;
  sedeUbicacion: string;
  tipoPuntoCritico:
    | 'Intersección Peligrosa'
    | 'Giro Ciego / Punto Ciego'
    | 'Cruce Peatonal Crítico'
    | 'Zona de Cargue y Descargue'
    | 'Rampa / Pendiente Pronunciada'
    | 'Acceso / Salida a Vía Pública'
    | 'Parqueadero Mixto';
  actoresExpuestos: string[];
  velocidadMaximaPermitida: number;
  flujoVehicularDia: string;
  nivelRiesgo: 'Crítico' | 'Alto' | 'Medio' | 'Bajo';
  descripcionPeligro: string;
  senalizacionActual: string;
  estadoZona: 'En Intervención' | 'Controlada' | 'Sin Intervenir';
  coordenadaInterna: string;
  fotoEvidenciaUrl?: string;
}

export interface MitigationActionPlan {
  id: string;
  zonaConflictoId: string;
  codigoAccion: string;
  tareaMitigacion: string;
  tipoIntervencion:
    | 'Instalación de Reductores de Velocidad'
    | 'Instalación de Espejos Convexos'
    | 'Mejoramiento de Iluminación LED'
    | 'Demarcación de Cebra / Sendero Peatonal'
    | 'Instalación de Señalización Vertical'
    | 'Segregación Física / Bolardos / Barreras'
    | 'Bacheo y Reparación de Pavimento';
  responsable: string;
  presupuestoEstimado: number;
  fechaInicio: string;
  fechaLimite: string;
  porcentajeAvance: number;
  estado: 'Pendiente' | 'En Ejecución' | 'Completado';
  observacionesVerificacion: string;
}

export interface InfrastructureChecklistCriterion {
  id: string;
  categoria: 'Pavimento y Superficie' | 'Pintura y Demarcación Horizontal' | 'Señalización Vertical y Espejos' | 'Iluminación y Visibilidad' | 'Zonas Peatonales y Drenajes';
  criterio: string;
  estado: 'Cumple' | 'Cumple Parcialmente' | 'No Cumple';
  hallazgoPuntual: string;
}

export interface InfrastructureInspectionRecord {
  id: string;
  codigoInspeccion: string;
  fechaInspeccion: string;
  periodicidad: 'Anual Obligatoria' | 'Semestral Preventiva' | 'Post-Intervención';
  sedeInspeccionada: string;
  inspectorNombre: string;
  inspectorCargo: string;
  items: InfrastructureChecklistCriterion[];
  puntajeCumplimiento: number;
  conceptoGeneral: 'Vía Interna Segura' | 'Requiere Mantenimiento Preventivo' | 'Riesgo Alto - Intervención Inmediata';
  recomendacionesGenerales: string;
  proximaInspeccion: string;
}

export interface Step14State {
  conflictZones: ConflictZoneItem[];
  actionPlans: MitigationActionPlan[];
  inspections: InfrastructureInspectionRecord[];
}

const STORAGE_KEY = 'pesv_paso14_vias_seguras_v1';
const FIRESTORE_DOC_ID = 'paso14_vias_seguras';

const DEFAULT_CHECKLIST_ITEMS: InfrastructureChecklistCriterion[] = [
  {
    id: 'CHK-01',
    categoria: 'Pavimento y Superficie',
    criterio: 'Estado general de la carpeta asfáltica o concreto libre de hundimientos, baches, grietas severas o desniveles peligrosos.',
    estado: 'Cumple',
    hallazgoPuntual: 'Superficie principal en buen estado; leve desgaste en zona de muelle 2.'
  },
  {
    id: 'CHK-02',
    categoria: 'Pavimento y Superficie',
    criterio: 'Ausencia de sustancias deslizantes (aceites, grasas, gravilla suelta) y adecuado coeficiente de fricción en rampas.',
    estado: 'Cumple',
    hallazgoPuntual: 'Limpieza industrial aplicada diariamente en patio de maniobras.'
  },
  {
    id: 'CHK-03',
    categoria: 'Pintura y Demarcación Horizontal',
    criterio: 'Visibilidad y reflectividad de la pintura de carriles, flechas direccionales, líneas de PARE y zonas de parqueo en reversa.',
    estado: 'Cumple Parcialmente',
    hallazgoPuntual: 'Se requiere repintar flechas de sentido vial en el acceso norte.'
  },
  {
    id: 'CHK-04',
    categoria: 'Pintura y Demarcación Horizontal',
    criterio: 'Demarcación clara con pintura tráfico pesado de cebras, senderos peatonales exclusivos y franjas de seguridad amarillas/negras.',
    estado: 'Cumple',
    hallazgoPuntual: 'Senderos peatonales demarcados con pintura epóxica antideslizante.'
  },
  {
    id: 'CHK-05',
    categoria: 'Señalización Vertical y Espejos',
    criterio: 'Señales verticales reglamentarias (Velocidad máxima 10 km/h, PARE, Altura máxima) y preventivas limpias y sin obstrucción.',
    estado: 'Cumple',
    hallazgoPuntual: 'Señales tipo SI-01 y SR-30 instaladas conforme al Manual de Señalización Vial.'
  },
  {
    id: 'CHK-06',
    categoria: 'Señalización Vertical y Espejos',
    criterio: 'Espejos convexos panorámicos instalados y bien orientados en esquinas ciegas, salidas de bodega e intersecciones críticas.',
    estado: 'Cumple Parcialmente',
    hallazgoPuntual: 'Pendiente instalar segundo espejo convexo de 80 cm en el giro ciego de bodega B.'
  },
  {
    id: 'CHK-07',
    categoria: 'Iluminación y Visibilidad',
    criterio: 'Iluminación artificial nocturna uniforme (reflectores LED operativos) en vías internas, cruces peatonales y parqueaderos.',
    estado: 'Cumple',
    hallazgoPuntual: '100% de luminarias LED encendidas en operación nocturna.'
  },
  {
    id: 'CHK-08',
    categoria: 'Zonas Peatonales y Drenajes',
    criterio: 'Reductores de velocidad (resaltos portátiles/fijos), topellantas en parqueaderos, barreras de segregación peatonal y rejillas de drenaje niveladas.',
    estado: 'Cumple',
    hallazgoPuntual: 'Topellantas y bolardos completos en áreas de tránsito mixto.'
  }
];

const INITIAL_STEP14_STATE: Step14State = {
  conflictZones: [
    {
      id: 'ZC-01',
      codigo: 'ZC-INT-001',
      nombreZona: 'Giro Ciego en Salida de Bodega Principal hacia Patio de Maniobras',
      sedeUbicacion: 'Sede Principal - Acceso Oriental Bodega 1',
      tipoPuntoCritico: 'Giro Ciego / Punto Ciego',
      actoresExpuestos: ['Conductor', 'Montacarguista', 'Peatón'],
      velocidadMaximaPermitida: 10,
      flujoVehicularDia: 'Alto (45 camiones y montacargas/día)',
      nivelRiesgo: 'Crítico',
      descripcionPeligro: 'Visibilidad reducida a menos de 3 metros al salir de la bodega por estructura metálica lateral, generando riesgo de colisión entre montacargas y camiones.',
      senalizacionActual: 'Señal vertical de PARE y línea amarilla desgastada.',
      estadoZona: 'En Intervención',
      coordenadaInterna: 'Cuadrante B-2 (Esquina Nororiental)'
    },
    {
      id: 'ZC-02',
      codigo: 'ZC-INT-002',
      nombreZona: 'Cruce Peatonal entre Edificio Administrativo y Parqueadero de Flota',
      sedeUbicacion: 'Sede Principal - Pasillo Central',
      tipoPuntoCritico: 'Cruce Peatonal Crítico',
      actoresExpuestos: ['Peatón', 'Ciclista', 'Conductor'],
      velocidadMaximaPermitida: 10,
      flujoVehicularDia: 'Medio (120 peatones y 30 vehículos/día)',
      nivelRiesgo: 'Alto',
      descripcionPeligro: 'Interacción directa entre personal administrativo peatonal y vehículos operativos saliendo a turno en horas pico (06:30 am y 05:00 pm).',
      senalizacionActual: 'Cebra peatonal pintada y aviso de prioridad al peatón.',
      estadoZona: 'En Intervención',
      coordenadaInterna: 'Cuadrante A-1 (Frente a Portería)'
    },
    {
      id: 'ZC-03',
      codigo: 'ZC-INT-003',
      nombreZona: 'Intersección de Acceso a Zona de Cargue y Descargue Muelle 3',
      sedeUbicacion: 'Patio Logístico Sur - Muelles 1 al 4',
      tipoPuntoCritico: 'Intersección Peligrosa',
      actoresExpuestos: ['Conductor', 'Auxiliar de Ruta'],
      velocidadMaximaPermitida: 10,
      flujoVehicularDia: 'Alto (Maniobras permanentes en reversa)',
      nivelRiesgo: 'Alto',
      descripcionPeligro: 'Confluencia de tractocamiones realizando maniobras de aculamiento en reversa con baja iluminación crepuscular.',
      senalizacionActual: 'Conos móviles y demarcación de bahías.',
      estadoZona: 'Controlada',
      coordenadaInterna: 'Cuadrante C-4 (Zona de Muelles)'
    }
  ],
  actionPlans: [
    {
      id: 'PA-01',
      zonaConflictoId: 'ZC-01',
      codigoAccion: 'MIT-ZC01-A',
      tareaMitigacion: 'Instalación de 2 espejos convexos panorámicos de 80 cm con visera anti-reflejo y alarma luminosa estroboscópica de aproximación.',
      tipoIntervencion: 'Instalación de Espejos Convexos',
      responsable: 'Jefe de Mantenimiento Locativo / Líder PESV',
      presupuestoEstimado: 1450000,
      fechaInicio: '2026-06-01',
      fechaLimite: '2026-07-15',
      porcentajeAvance: 75,
      estado: 'En Ejecución',
      observacionesVerificacion: 'Primer espejo instalado; pendiente conexión de sensor sonoro-luminoso.'
    },
    {
      id: 'PA-02',
      zonaConflictoId: 'ZC-02',
      codigoAccion: 'MIT-ZC02-A',
      tareaMitigacion: 'Instalación de reductor de velocidad modular en caucho vulcanizado con ojos de gato reflectivos antes del paso peatonal.',
      tipoIntervencion: 'Instalación de Reductores de Velocidad',
      responsable: 'Coordinador HSEQ / Infraestructura',
      presupuestoEstimado: 1850000,
      fechaInicio: '2026-05-15',
      fechaLimite: '2026-06-30',
      porcentajeAvance: 100,
      estado: 'Completado',
      observacionesVerificacion: 'Reductor de velocidad de 6 metros instalado y anclado con pernos expansivos.'
    },
    {
      id: 'PA-03',
      zonaConflictoId: 'ZC-03',
      codigoAccion: 'MIT-ZC03-A',
      tareaMitigacion: 'Instalación de 4 reflectores LED industriales de 200W y repintado de guías reflectivas amarillas para aculamiento seguro en reversa.',
      tipoIntervencion: 'Mejoramiento de Iluminación LED',
      responsable: 'Ingeniería y Servicios Generales',
      presupuestoEstimado: 2300000,
      fechaInicio: '2026-06-10',
      fechaLimite: '2026-07-30',
      porcentajeAvance: 60,
      estado: 'En Ejecución',
      observacionesVerificacion: 'Luminarias adquiridas y en montaje sobre postes perimetrales.'
    }
  ],
  inspections: [
    {
      id: 'INSP-2026-01',
      codigoInspeccion: 'INSP-VIAS-2026-01',
      fechaInspeccion: '2026-06-10',
      periodicidad: 'Anual Obligatoria',
      sedeInspeccionada: 'Sede Principal, Parqueaderos y Patio de Maniobras',
      inspectorNombre: 'Ing. Carlos Andrés Restrepo',
      inspectorCargo: 'Líder del Diseño e Implementación del PESV',
      items: DEFAULT_CHECKLIST_ITEMS,
      puntajeCumplimiento: 88,
      conceptoGeneral: 'Requiere Mantenimiento Preventivo',
      recomendacionesGenerales: 'Repintar flechas de sentido direccional en el acceso norte y culminar instalación del segundo espejo convexo en la salida de la Bodega 1 (ZC-INT-001).',
      proximaInspeccion: '2027-06-10'
    }
  ]
};

interface Step14SafeRoadsModuleProps {
  config: CompanyConfig;
  companyName: string;
  companyNit: string;
  companyLogo?: string;
}

export default function Step14SafeRoadsModule({
  config,
  companyName,
  companyNit,
  companyLogo = ''
}: Step14SafeRoadsModuleProps) {
  const [activeTab, setActiveTab] = useState<'zonas-conflicto' | 'planes-accion' | 'inspecciones'>('zonas-conflicto');
  const [state, setState] = useState<Step14State>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...INITIAL_STEP14_STATE, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return INITIAL_STEP14_STATE;
  });

  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('TODAS');

  // Modals State
  const [editingZone, setEditingZone] = useState<ConflictZoneItem | null>(null);
  const [isNewZone, setIsNewZone] = useState(false);

  const [editingAction, setEditingAction] = useState<MitigationActionPlan | null>(null);
  const [isNewAction, setIsNewAction] = useState(false);

  const [editingInspection, setEditingInspection] = useState<InfrastructureInspectionRecord | null>(null);
  const [isNewInspection, setIsNewInspection] = useState(false);

  useEffect(() => {
    const unsub = subscribeToSystemSetting(FIRESTORE_DOC_ID, (cloudData) => {
      if (cloudData) {
        setState(prev => {
          const merged = { ...prev, ...cloudData };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    });
    return () => unsub();
  }, []);

  const persistStep14State = (updated: Step14State, msg?: string) => {
    setState(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    saveSystemSetting(FIRESTORE_DOC_ID, updated);
    if (msg) {
      setStatusBanner(msg);
      setTimeout(() => setStatusBanner(null), 3200);
    }
  };

  const calculateInspectionScore = (items: InfrastructureChecklistCriterion[]): number => {
    if (!items.length) return 100;
    const totalPoints = items.reduce((acc, item) => {
      if (item.estado === 'Cumple') return acc + 100;
      if (item.estado === 'Cumple Parcialmente') return acc + 50;
      return acc;
    }, 0);
    return Math.round(totalPoints / items.length);
  };

  // Export Official PDF Report for Paso 14 (Zonas de Conflicto, Planes de Acción e Inspección de Infraestructura)
  const exportStep14PDF = (specificInspection?: InfrastructureInspectionRecord) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 18;

    doc.setFillColor(15, 23, 42);
    doc.rect(12, 10, pageW - 24, 24, 'F');
    if (companyLogo && companyLogo.startsWith('data:image')) {
      try {
        doc.addImage(companyLogo, 'PNG', 15, 12, 18, 18);
      } catch {}
    }
    const startX = companyLogo ? 36 : 16;
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('PASO 14: VIAS SEGURAS ADMINISTRADAS POR LA ORGANIZACION', startX, 18);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${companyName} | NIT: ${companyNit} | Nivel PESV: ${config.nivelCalculado}`, startX, 24);
    doc.text(`Matriz de Zonas de Conflicto, Planes de Mitigacion e Inspeccion de Infraestructura Vial`, startX, 29);

    y = 42;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('1. MATRIZ DE IDENTIFICACION DE ZONAS DE CONFLICTO (TRANSITO INTERNO)', 14, y);
    y += 5;

    state.conflictZones.forEach((z, idx) => {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, pageW - 28, 16, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(`${idx + 1}. [${z.codigo}] ${z.nombreZona} (${z.tipoPuntoCritico}) - Riesgo: ${z.nivelRiesgo}`, 16, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`Ubicacion: ${z.sedeUbicacion} | Vel. Max: ${z.velocidadMaximaPermitida} km/h | Actores: ${z.actoresExpuestos.join(', ')}`, 16, y + 10);
      doc.text(`Peligro: ${z.descripcionPeligro.slice(0, 105)}`, 16, y + 14);
      y += 18;
    });

    y += 3;
    if (y > 235) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('2. PLANES DE ACCION Y TAREAS DE MITIGACION VINCULADAS', 14, y);
    y += 5;

    state.actionPlans.forEach((a) => {
      if (y > 245) { doc.addPage(); y = 20; }
      const zone = state.conflictZones.find(z => z.id === a.zonaConflictoId);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(`• [${a.codigoAccion}] Zona: ${zone?.codigo || a.zonaConflictoId} | ${a.tipoIntervencion} (${a.porcentajeAvance}% - ${a.estado})`, 15, y + 4);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`  Tarea: ${a.tareaMitigacion.slice(0, 105)}`, 15, y + 8);
      doc.text(`  Responsable: ${a.responsable} | Presupuesto: $${a.presupuestoEstimado.toLocaleString('es-CO')} | Fecha Limite: ${a.fechaLimite}`, 15, y + 12);
      y += 14;
    });

    const targetInspections = specificInspection ? [specificInspection] : state.inspections;
    targetInspections.forEach((insp) => {
      if (y > 215) { doc.addPage(); y = 20; }
      y += 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(`3. LISTA DE CHEQUEO DE INSPECCION DE INFRAESTRUCTURA (${insp.codigoInspeccion})`, 14, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Fecha: ${insp.fechaInspeccion} | Sede: ${insp.sedeInspeccionada} | Inspector: ${insp.inspectorNombre} | Puntaje: ${insp.puntajeCumplimiento}%`, 14, y);
      y += 5;
      insp.items.forEach((it, idx) => {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text(`${idx + 1}. [${it.estado.toUpperCase()}] ${it.categoria}:`, 15, y);
        doc.setFont('helvetica', 'normal');
        doc.text(`   ${it.criterio.slice(0, 95)}`, 15, y + 3.8);
        doc.text(`   Hallazgo: ${it.hallazgoPuntual}`, 15, y + 7.4);
        y += 10.5;
      });
    });

    doc.save(`Paso14_Vias_Seguras_${companyName.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="mt-6 space-y-5 border-t border-slate-200 pt-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-5 shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 shrink-0">
              <MapPin size={26} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PASO 14 • RESOLUCIÓN 40595 DE 2022
                </span>
                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded border border-amber-500/30">
                  Infraestructura Interna y Puntos Críticos
                </span>
              </div>
              <h3 className="text-lg font-black tracking-tight mt-1">
                Vías Seguras Administradas por la Organización
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 max-w-3xl">
                Mapeo de zonas de conflicto de tránsito interno (intersecciones, giros ciegos, cruces peatonales), vinculación directa con planes de acción digitales y listas de chequeo para inspecciones obligatorias de infraestructura.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => exportStep14PDF()}
            className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-black rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-sm shrink-0"
          >
            <Download size={15} />
            Descargar Informe Paso 14 (PDF)
          </button>
        </div>

        {/* KPI Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Zonas de Conflicto Mapeadas</p>
            <p className="text-lg font-black text-white mt-0.5">{state.conflictZones.length} Puntos Críticos</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Planes de Acción Vinculados</p>
            <p className="text-lg font-black text-amber-300 mt-0.5">{state.actionPlans.length} Tareas de Mitigación</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Avance Promedio Mitigación</p>
            <p className="text-lg font-black text-emerald-300 mt-0.5">
              {state.actionPlans.length
                ? Math.round(state.actionPlans.reduce((a, b) => a + b.porcentajeAvance, 0) / state.actionPlans.length)
                : 0}% Ejecutado
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Inspecciones Infraestructura</p>
            <p className="text-lg font-black text-sky-300 mt-0.5">{state.inspections.length} Registradas</p>
          </div>
        </div>
      </div>

      {statusBanner && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            {statusBanner}
          </span>
          <button onClick={() => setStatusBanner(null)} className="text-emerald-700 hover:text-emerald-950 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('zonas-conflicto')}
          className={`px-3.5 py-2 rounded-lg text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
            activeTab === 'zonas-conflicto' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
          }`}
        >
          <ShieldAlert size={14} />
          1. Matriz de Identificación de Zonas de Conflicto
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('planes-accion')}
          className={`px-3.5 py-2 rounded-lg text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
            activeTab === 'planes-accion' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
          }`}
        >
          <Wrench size={14} />
          2. Planes de Acción Digitales (Tareas de Mitigación)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('inspecciones')}
          className={`px-3.5 py-2 rounded-lg text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
            activeTab === 'inspecciones' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
          }`}
        >
          <ClipboardCheck size={14} />
          3. Listas de Chequeo para Inspecciones de Infraestructura
        </button>
      </div>

      {/* TAB 1: MATRIZ DE IDENTIFICACIÓN DE ZONAS DE CONFLICTO */}
      {activeTab === 'zonas-conflicto' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <MapPin size={17} className="text-emerald-600" />
                Matriz de Identificación de Zonas de Conflicto de Tránsito Interno
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Mapee y registre puntos críticos de tránsito interno (intersecciones peligrosas, giros ciegos, cruces peatonales, zonas de cargue) y vincúlelos con planes de mitigación.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsNewZone(true);
                setEditingZone({
                  id: `ZC-${Date.now().toString().slice(-4)}`,
                  codigo: `ZC-INT-00${state.conflictZones.length + 1}`,
                  nombreZona: '',
                  sedeUbicacion: 'Sede Principal - Patio Operativo',
                  tipoPuntoCritico: 'Intersección Peligrosa',
                  actoresExpuestos: ['Conductor', 'Peatón'],
                  velocidadMaximaPermitida: 10,
                  flujoVehicularDia: 'Medio',
                  nivelRiesgo: 'Alto',
                  descripcionPeligro: '',
                  senalizacionActual: '',
                  estadoZona: 'En Intervención',
                  coordenadaInterna: 'Cuadrante B-1'
                });
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
            >
              <Plus size={14} />
              Registrar Zona de Conflicto
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-3">Código / Punto Crítico Interno</th>
                    <th className="py-3 px-2.5">Tipo de Conflicto Vial</th>
                    <th className="py-3 px-2.5">Actores Expuestos & Vel. Máx</th>
                    <th className="py-3 px-2.5 text-center">Nivel de Riesgo</th>
                    <th className="py-3 px-3">Descripción del Peligro y Señalización</th>
                    <th className="py-3 px-3">Plan de Acción Vinculado</th>
                    <th className="py-3 px-2.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {state.conflictZones.map((zone) => {
                    const linkedActions = state.actionPlans.filter(a => a.zonaConflictoId === zone.id);
                    return (
                      <tr key={zone.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 max-w-xs">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-900 text-white">
                              {zone.codigo}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500">{zone.coordenadaInterna}</span>
                          </div>
                          <p className="font-bold text-slate-900 leading-snug">{zone.nombreZona}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{zone.sedeUbicacion}</p>
                        </td>

                        <td className="py-3 px-2.5">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-[11px] border border-slate-200">
                            {zone.tipoPuntoCritico}
                          </span>
                          <p className="text-[10px] text-slate-500 mt-1">Flujo: {zone.flujoVehicularDia}</p>
                        </td>

                        <td className="py-3 px-2.5">
                          <div className="flex flex-wrap gap-1 mb-1">
                            {zone.actoresExpuestos.map((act, i) => (
                              <span key={i} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                {act}
                              </span>
                            ))}
                          </div>
                          <span className="text-[11px] font-black text-rose-700">
                            Límite: {zone.velocidadMaximaPermitida} km/h
                          </span>
                        </td>

                        <td className="py-3 px-2.5 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-black border ${
                            zone.nivelRiesgo === 'Crítico'
                              ? 'bg-rose-600 text-white border-rose-700'
                              : zone.nivelRiesgo === 'Alto'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}>
                            {zone.nivelRiesgo}
                          </span>
                        </td>

                        <td className="py-3 px-3 max-w-xs text-[11px] text-slate-600 space-y-1">
                          <p><strong className="text-slate-800">Peligro:</strong> {zone.descripcionPeligro}</p>
                          <p><strong className="text-slate-800">Señalización actual:</strong> {zone.senalizacionActual}</p>
                        </td>

                        <td className="py-3 px-3">
                          <div className="space-y-1.5">
                            {linkedActions.length > 0 ? (
                              linkedActions.map((act) => (
                                <div key={act.id} className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200 text-[11px]">
                                  <div className="flex items-center justify-between font-black text-emerald-950">
                                    <span>{act.tipoIntervencion}</span>
                                    <span>{act.porcentajeAvance}%</span>
                                  </div>
                                  <p className="text-[10px] text-slate-600 truncate">{act.tareaMitigacion}</p>
                                </div>
                              ))
                            ) : (
                              <span className="text-[11px] text-rose-600 font-bold block">Sin tarea vinculada</span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setIsNewAction(true);
                                setEditingAction({
                                  id: `PA-${Date.now().toString().slice(-4)}`,
                                  zonaConflictoId: zone.id,
                                  codigoAccion: `MIT-${zone.codigo}-${linkedActions.length + 1}`,
                                  tareaMitigacion: '',
                                  tipoIntervencion: 'Instalación de Reductores de Velocidad',
                                  responsable: 'Jefe de Mantenimiento / Líder PESV',
                                  presupuestoEstimado: 1200000,
                                  fechaInicio: new Date().toISOString().slice(0, 10),
                                  fechaLimite: '2026-08-30',
                                  porcentajeAvance: 0,
                                  estado: 'Pendiente',
                                  observacionesVerificacion: ''
                                });
                              }}
                              className="text-[11px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                            >
                              <Plus size={12} />
                              Vincular Tarea de Mitigación
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-2.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => { setIsNewZone(false); setEditingZone({ ...zone }); }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer mr-1"
                            title="Editar Zona de Conflicto"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const nextZones = state.conflictZones.filter(z => z.id !== zone.id);
                              persistStep14State({ ...state, conflictZones: nextZones }, 'Zona de conflicto eliminada.');
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            title="Eliminar Zona"
                          >
                            <Trash2 size={14} />
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

      {/* TAB 2: PLANES DE ACCIÓN DIGITALES VINCULADOS A CADA ZONA */}
      {activeTab === 'planes-accion' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Wrench size={17} className="text-emerald-600" />
                Planes de Acción Digitales (Vinculación Directa con Zonas de Riesgo Interno)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Gestione las tareas de mitigación física (reductores de velocidad, espejos convexos, iluminación LED, cebras peatonales) vinculadas a cada punto crítico.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={selectedZoneFilter}
                onChange={e => setSelectedZoneFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-bold"
              >
                <option value="TODAS">Todas las Zonas de Conflicto</option>
                {state.conflictZones.map(z => (
                  <option key={z.id} value={z.id}>{z.codigo} - {z.nombreZona.slice(0, 35)}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setIsNewAction(true);
                  setEditingAction({
                    id: `PA-${Date.now().toString().slice(-4)}`,
                    zonaConflictoId: state.conflictZones[0]?.id || 'ZC-01',
                    codigoAccion: `MIT-00${state.actionPlans.length + 1}`,
                    tareaMitigacion: '',
                    tipoIntervencion: 'Instalación de Reductores de Velocidad',
                    responsable: 'Coordinador PESV / Mantenimiento',
                    presupuestoEstimado: 1500000,
                    fechaInicio: new Date().toISOString().slice(0, 10),
                    fechaLimite: '2026-08-15',
                    porcentajeAvance: 25,
                    estado: 'En Ejecución',
                    observacionesVerificacion: ''
                  });
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                Nueva Tarea de Mitigación
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.actionPlans
              .filter(a => selectedZoneFilter === 'TODAS' || a.zonaConflictoId === selectedZoneFilter)
              .map((plan) => {
                const linkedZone = state.conflictZones.find(z => z.id === plan.zonaConflictoId);
                return (
                  <div key={plan.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-900 text-white">
                          {plan.codigoAccion}
                        </span>
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                          plan.estado === 'Completado'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : plan.estado === 'En Ejecución'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}>
                          {plan.estado} ({plan.porcentajeAvance}%)
                        </span>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                        <span className="text-[10px] font-black uppercase text-emerald-700 block">
                          Zona de Conflicto Vinculada: {linkedZone?.codigo || plan.zonaConflictoId}
                        </span>
                        <p className="text-xs font-bold text-slate-900">
                          {linkedZone?.nombreZona || 'Zona de Tránsito Interno'}
                        </p>
                      </div>

                      <p className="text-xs font-black text-blue-900">{plan.tipoIntervencion}</p>
                      <p className="text-xs text-slate-700 leading-relaxed">{plan.tareaMitigacion}</p>

                      {/* Progress Bar */}
                      <div className="pt-1">
                        <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                          <span>Avance de Obra / Mitigación</span>
                          <span>{plan.porcentajeAvance}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              plan.porcentajeAvance === 100 ? 'bg-emerald-600' : 'bg-amber-500'
                            }`}
                            style={{ width: `${plan.porcentajeAvance}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-[11px] text-slate-600">
                      <div>
                        <span><strong>Responsable:</strong> {plan.responsable}</span>
                        <span className="block text-slate-500">
                          Presupuesto: <strong>${plan.presupuestoEstimado.toLocaleString('es-CO')}</strong> • Límite: {plan.fechaLimite}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => { setIsNewAction(false); setEditingAction({ ...plan }); }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = state.actionPlans.filter(a => a.id !== plan.id);
                            persistStep14State({ ...state, actionPlans: next }, 'Tarea de mitigación eliminada.');
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 3: LISTAS DE CHEQUEO PARA INSPECCIONES DE INFRAESTRUCTURA */}
      {activeTab === 'inspecciones' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <ClipboardCheck size={17} className="text-emerald-600" />
                Listas de Chequeo para Inspecciones Anuales / Periódicas de Infraestructura Vial
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Formularios digitales para realizar y registrar las inspecciones obligatorias de las vías internas (estado del pavimento, pintura, hundimientos, espejos e iluminación).
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsNewInspection(true);
                setEditingInspection({
                  id: `INSP-${Date.now().toString().slice(-4)}`,
                  codigoInspeccion: `INSP-VIAS-${new Date().getFullYear()}-0${state.inspections.length + 1}`,
                  fechaInspeccion: new Date().toISOString().slice(0, 10),
                  periodicidad: 'Anual Obligatoria',
                  sedeInspeccionada: 'Sede Principal - Vías Internas y Parqueaderos',
                  inspectorNombre: 'Ing. Carlos Andrés Restrepo',
                  inspectorCargo: 'Líder PESV',
                  items: DEFAULT_CHECKLIST_ITEMS.map(it => ({ ...it })),
                  puntajeCumplimiento: 94,
                  conceptoGeneral: 'Vía Interna Segura',
                  recomendacionesGenerales: '',
                  proximaInspeccion: '2027-06-25'
                });
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus size={14} />
              Realizar Nueva Inspección de Vías
            </button>
          </div>

          <div className="space-y-4">
            {state.inspections.map((insp) => (
              <div key={insp.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-3.5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded bg-slate-900 text-white">
                        {insp.codigoInspeccion}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {insp.periodicidad}
                      </span>
                      <span className="text-xs font-bold text-slate-600">
                        Fecha: {insp.fechaInspeccion} • Próxima: {insp.proximaInspeccion}
                      </span>
                    </div>
                    <h5 className="text-base font-black text-slate-900 mt-1">{insp.sedeInspeccionada}</h5>
                    <p className="text-xs text-slate-500">
                      Inspector responsable: <strong>{insp.inspectorNombre}</strong> ({insp.inspectorCargo})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right mr-2">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Cumplimiento Vial</span>
                      <span className="text-lg font-black text-emerald-700">{insp.puntajeCumplimiento}%</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => exportStep14PDF(insp)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download size={13} />
                      PDF Lista Chequeo
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsNewInspection(false); setEditingInspection({ ...insp, items: insp.items.map(i => ({ ...i })) }); }}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 size={13} />
                      Editar Chequeo
                    </button>
                  </div>
                </div>

                {/* Checklist Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {insp.items.map((item) => (
                    <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-slate-500">{item.categoria}</span>
                        <p className="text-xs font-bold text-slate-800 leading-snug">{item.criterio}</p>
                        {item.hallazgoPuntual && (
                          <p className="text-[11px] text-slate-600 italic">Hallazgo: {item.hallazgoPuntual}</p>
                        )}
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-black border ${
                        item.estado === 'Cumple'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : item.estado === 'Cumple Parcialmente'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-rose-100 text-rose-800 border-rose-300'
                      }`}>
                        {item.estado}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-950 flex flex-wrap items-center justify-between gap-2">
                  <span>
                    <strong>Concepto Técnico:</strong> {insp.conceptoGeneral} — {insp.recomendacionesGenerales}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Create / Edit Conflict Zone */}
      {editingZone && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-3.5 my-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h4 className="text-base font-black text-slate-900">
                {isNewZone ? 'Registrar Punto Crítico en Matriz de Zonas de Conflicto' : `Editar Zona ${editingZone.codigo}`}
              </h4>
              <button onClick={() => setEditingZone(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre / Ubicación del Punto Crítico Interno *</label>
                <input
                  type="text"
                  value={editingZone.nombreZona}
                  onChange={e => setEditingZone({ ...editingZone, nombreZona: e.target.value })}
                  placeholder="Ej. Giro ciego en salida de bodega 2 o cruce peatonal..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Punto Crítico</label>
                <select
                  value={editingZone.tipoPuntoCritico}
                  onChange={e => setEditingZone({ ...editingZone, tipoPuntoCritico: e.target.value as ConflictZoneItem['tipoPuntoCritico'] })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Intersección Peligrosa">Intersección Peligrosa</option>
                  <option value="Giro Ciego / Punto Ciego">Giro Ciego / Punto Ciego</option>
                  <option value="Cruce Peatonal Crítico">Cruce Peatonal Crítico</option>
                  <option value="Zona de Cargue y Descargue">Zona de Cargue y Descargue</option>
                  <option value="Rampa / Pendiente Pronunciada">Rampa / Pendiente Pronunciada</option>
                  <option value="Acceso / Salida a Vía Pública">Acceso / Salida a Vía Pública</option>
                  <option value="Parqueadero Mixto">Parqueadero Mixto</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nivel de Riesgo</label>
                <select
                  value={editingZone.nivelRiesgo}
                  onChange={e => setEditingZone({ ...editingZone, nivelRiesgo: e.target.value as ConflictZoneItem['nivelRiesgo'] })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-bold"
                >
                  <option value="Crítico">Crítico</option>
                  <option value="Alto">Alto</option>
                  <option value="Medio">Medio</option>
                  <option value="Bajo">Bajo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sede / Tramo Interno</label>
                <input
                  type="text"
                  value={editingZone.sedeUbicacion}
                  onChange={e => setEditingZone({ ...editingZone, sedeUbicacion: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Velocidad Máxima Permitida (km/h)</label>
                <input
                  type="number"
                  value={editingZone.velocidadMaximaPermitida}
                  onChange={e => setEditingZone({ ...editingZone, velocidadMaximaPermitida: parseInt(e.target.value) || 10 })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción del Peligro Identificado *</label>
                <textarea
                  rows={2}
                  value={editingZone.descripcionPeligro}
                  onChange={e => setEditingZone({ ...editingZone, descripcionPeligro: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Señalización y Controles Actuales</label>
                <input
                  type="text"
                  value={editingZone.senalizacionActual}
                  onChange={e => setEditingZone({ ...editingZone, senalizacionActual: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingZone(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!editingZone.nombreZona.trim()) return;
                  const next = isNewZone
                    ? [...state.conflictZones, editingZone]
                    : state.conflictZones.map(z => (z.id === editingZone.id ? editingZone : z));
                  persistStep14State({ ...state, conflictZones: next }, 'Matriz de zonas de conflicto actualizada.');
                  setEditingZone(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black cursor-pointer"
              >
                Guardar Zona de Conflicto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create / Edit Digital Action Plan */}
      {editingAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-3.5 my-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h4 className="text-base font-black text-slate-900">
                {isNewAction ? 'Vincular Plan de Acción Digital a Zona de Conflicto' : `Editar Tarea ${editingAction.codigoAccion}`}
              </h4>
              <button onClick={() => setEditingAction(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Zona de Conflicto Vinculada *</label>
                <select
                  value={editingAction.zonaConflictoId}
                  onChange={e => setEditingAction({ ...editingAction, zonaConflictoId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-bold"
                >
                  {state.conflictZones.map(z => (
                    <option key={z.id} value={z.id}>{z.codigo} - {z.nombreZona}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Obra / Mitigación Vial</label>
                <select
                  value={editingAction.tipoIntervencion}
                  onChange={e => setEditingAction({ ...editingAction, tipoIntervencion: e.target.value as MitigationActionPlan['tipoIntervencion'] })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Instalación de Reductores de Velocidad">Instalación de Reductores de Velocidad</option>
                  <option value="Instalación de Espejos Convexos">Instalación de Espejos Convexos</option>
                  <option value="Mejoramiento de Iluminación LED">Mejoramiento de Iluminación LED</option>
                  <option value="Demarcación de Cebra / Sendero Peatonal">Demarcación de Cebra / Sendero Peatonal</option>
                  <option value="Instalación de Señalización Vertical">Instalación de Señalización Vertical</option>
                  <option value="Segregación Física / Bolardos / Barreras">Segregación Física / Bolardos / Barreras</option>
                  <option value="Bacheo y Reparación de Pavimento">Bacheo y Reparación de Pavimento</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción Detallada de la Tarea de Mitigación *</label>
                <textarea
                  rows={2}
                  value={editingAction.tareaMitigacion}
                  onChange={e => setEditingAction({ ...editingAction, tareaMitigacion: e.target.value })}
                  placeholder="Ej. Instalación de reductor de velocidad en caucho con reflectivos y señal SR-30..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Responsable</label>
                <input
                  type="text"
                  value={editingAction.responsable}
                  onChange={e => setEditingAction({ ...editingAction, responsable: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Presupuesto Estimado ($ COP)</label>
                <input
                  type="number"
                  value={editingAction.presupuestoEstimado}
                  onChange={e => setEditingAction({ ...editingAction, presupuestoEstimado: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fecha Límite</label>
                <input
                  type="date"
                  value={editingAction.fechaLimite}
                  onChange={e => setEditingAction({ ...editingAction, fechaLimite: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Avance (%) y Estado</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editingAction.porcentajeAvance}
                    onChange={e => {
                      const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                      setEditingAction({
                        ...editingAction,
                        porcentajeAvance: val,
                        estado: val === 100 ? 'Completado' : val > 0 ? 'En Ejecución' : 'Pendiente'
                      });
                    }}
                    className="px-2.5 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                  <select
                    value={editingAction.estado}
                    onChange={e => setEditingAction({ ...editingAction, estado: e.target.value as MitigationActionPlan['estado'] })}
                    className="px-2 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="En Ejecución">En Ejecución</option>
                    <option value="Completado">Completado</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingAction(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!editingAction.tareaMitigacion.trim()) return;
                  const next = isNewAction
                    ? [...state.actionPlans, editingAction]
                    : state.actionPlans.map(a => (a.id === editingAction.id ? editingAction : a));
                  persistStep14State({ ...state, actionPlans: next }, 'Plan de acción digital vinculado y guardado.');
                  setEditingAction(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black cursor-pointer"
              >
                Guardar Plan de Acción
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create / Edit Infrastructure Inspection Checklist */}
      {editingInspection && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Inspección Obligatoria de Vías Administradas por la Organización
                </span>
                <h4 className="text-base font-black text-slate-900 mt-0.5">
                  {isNewInspection ? 'Registrar Lista de Chequeo de Infraestructura Vial' : `Editar Inspección ${editingInspection.codigoInspeccion}`}
                </h4>
              </div>
              <button onClick={() => setEditingInspection(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Inspección</label>
                <input
                  type="date"
                  value={editingInspection.fechaInspeccion}
                  onChange={e => setEditingInspection({ ...editingInspection, fechaInspeccion: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sede / Vía Inspeccionada</label>
                <input
                  type="text"
                  value={editingInspection.sedeInspeccionada}
                  onChange={e => setEditingInspection({ ...editingInspection, sedeInspeccionada: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Inspector Responsable</label>
                <input
                  type="text"
                  value={editingInspection.inspectorNombre}
                  onChange={e => setEditingInspection({ ...editingInspection, inspectorNombre: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-black text-slate-800 uppercase">
                Verificación de Condiciones de la Vía (Pavimento, Pintura, Hundimientos, Señalización e Iluminación)
              </p>
              {editingInspection.items.map((item, idx) => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase text-emerald-700">{item.categoria}</span>
                      <p className="text-xs font-bold text-slate-900">{item.criterio}</p>
                    </div>
                    <select
                      value={item.estado}
                      onChange={e => {
                        const updatedItems = editingInspection.items.map((it, i) =>
                          i === idx ? { ...it, estado: e.target.value as InfrastructureChecklistCriterion['estado'] } : it
                        );
                        setEditingInspection({
                          ...editingInspection,
                          items: updatedItems,
                          puntajeCumplimiento: calculateInspectionScore(updatedItems)
                        });
                      }}
                      className="px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white shrink-0"
                    >
                      <option value="Cumple">Cumple (100%)</option>
                      <option value="Cumple Parcialmente">Cumple Parcialmente (50%)</option>
                      <option value="No Cumple">No Cumple (0%)</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    value={item.hallazgoPuntual}
                    onChange={e => {
                      const updatedItems = editingInspection.items.map((it, i) =>
                        i === idx ? { ...it, hallazgoPuntual: e.target.value } : it
                      );
                      setEditingInspection({ ...editingInspection, items: updatedItems });
                    }}
                    placeholder="Observación o hallazgo específico (estado del pavimento, pintura, hundimientos...)"
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Recomendaciones Generales de Mantenimiento Vial</label>
              <textarea
                rows={2}
                value={editingInspection.recomendacionesGenerales}
                onChange={e => setEditingInspection({ ...editingInspection, recomendacionesGenerales: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingInspection(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const score = calculateInspectionScore(editingInspection.items);
                  const finalized: InfrastructureInspectionRecord = {
                    ...editingInspection,
                    puntajeCumplimiento: score,
                    conceptoGeneral:
                      score >= 90
                        ? 'Vía Interna Segura'
                        : score >= 70
                        ? 'Requiere Mantenimiento Preventivo'
                        : 'Riesgo Alto - Intervención Inmediata'
                  };
                  const next = isNewInspection
                    ? [finalized, ...state.inspections]
                    : state.inspections.map(i => (i.id === finalized.id ? finalized : i));
                  persistStep14State({ ...state, inspections: next }, 'Lista de chequeo de inspección de infraestructura guardada.');
                  setEditingInspection(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black cursor-pointer"
              >
                Guardar Inspección de Infraestructura ({editingInspection.puntajeCumplimiento}%)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
