import React, { useState, useEffect, useRef } from 'react';
import {
  Compass, MapPin, Clock, Gauge, ShieldCheck, ShieldAlert, Lock, Unlock,
  Truck, Users, FileText, Plus, Edit3, Trash2, Download, CheckCircle2,
  AlertTriangle, QrCode, ExternalLink, Copy, Check, X, Upload, Calendar,
  Navigation, Coffee, UserCheck, Ban, Eye
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { CompanyConfig } from '../types';
import { saveSystemSetting, subscribeToSystemSetting } from '../services/firestoreService';

export interface MandatoryRestStop {
  id: string;
  puntoParada: string;
  kilometroReferencia: string;
  tiempoConduccionPrevioHoras: number;
  duracionDescansoMinutos: number;
  actividadPausaActiva: string;
}

export interface DigitalRutogramaItem {
  id: string;
  paso5RutaId?: number;
  codigoRutograma: string;
  nombreCorredor: string;
  origen: string;
  destino: string;
  distanciaKm: number;
  frecuenciaPaso5: string;
  viaPrincipal: string;
  tiempoEstimadoHoras: number;
  tiempoEstimadoMinutos: number;
  horarioPermitido: string;
  velMaxCarreteraKmH: number;
  velMaxUrbanaKmH: number;
  velMaxZonaEspecialKmH: number;
  velMaxPatioKmH: number;
  paradasObligatorias: MandatoryRestStop[];
  puntosCriticosCorredor: string;
  peajesYControles: string;
  recomendacionesSeguridad: string;
}

export interface PreTripDispatchOrder {
  id: string;
  codigoDespacho: string;
  fechaViaje: string;
  horaSalida: string;
  rutogramaId: string;
  conductorNombre: string;
  conductorCedula: string;
  esquemaCapacitacionEstado: 'Vigente' | 'Vencido';
  fechaVencimientoCapacitacion: string;
  vehiculoPlaca: string;
  vehiculoClase: string;
  inspeccionPreoperacionalHoy: boolean;
  fechaInspeccionPreoperacional: string;
  codigoPreoperacional: string;
  testAlcoholemiaNegativo: boolean;
  horasSuenoPrevias: number;
  estadoAutorizacion: 'Autorizado' | 'Bloqueado por Seguridad' | 'Pendiente Validación';
  motivoBloqueo?: string;
  autorizadoPor?: string;
}

export interface ThirdPartyMassTripRegistration {
  id: string;
  radicado: string;
  fechaSolicitud: string;
  fechaViajeProgramado: string;
  horaSalida: string;
  tipoDesplazamientoMasivo:
    | 'Salida Pedagógica / Académica'
    | 'Integración Empresarial / Bienestar'
    | 'Transporte Especial Contratado de Personal'
    | 'Misión Corporativa Grupal';
  rutogramaId: string;
  rutogramaNombre: string;
  numeroPasajeros: number;
  empresaTransporteTercero: string;
  nitEmpresaTercero: string;
  conductorNombre: string;
  conductorCedula: string;
  conductorTelefono: string;
  licenciaCategoria: string;
  esquemaCapacitacionVigente: boolean;
  vehiculoPlaca: string;
  vehiculoClase: string;
  inspeccionPreoperacionalDiaAprobada: boolean;
  fuecNumero: string;
  soatVigente: boolean;
  rtmVigente: boolean;
  polizasRccRceVigentes: boolean;
  compromisoLimitesYParadas: boolean;
  soporteDocumentalNombre?: string;
  soporteDocumentalDataUrl?: string;
  estadoAprobacion: 'Pendiente de Aprobación' | 'Aprobado para Despacho' | 'Rechazado / Bloqueado';
  observacionesRevision: string;
}

export interface Step15State {
  rutogramas: DigitalRutogramaItem[];
  dispatches: PreTripDispatchOrder[];
  thirdPartyTrips: ThirdPartyMassTripRegistration[];
}

const STORAGE_KEY = 'pesv_paso15_desplazamientos_v1';
const FIRESTORE_DOC_ID = 'paso15_planificacion_desplazamientos';

const TODAY_ISO = new Date().toISOString().slice(0, 10);

const INITIAL_STEP15_STATE: Step15State = {
  rutogramas: [
    {
      id: 'RUT-01',
      paso5RutaId: 1,
      codigoRutograma: 'RUT-PESV-001',
      nombreCorredor: 'Corredor Troncal de Occidente',
      origen: 'Bogotá D.C.',
      destino: 'Medellín (Antioquia)',
      distanciaKm: 415,
      frecuenciaPaso5: '24 veces al mes',
      viaPrincipal: 'Autopista de doble calzada y montaña (Ruta 80 / Ruta 60)',
      tiempoEstimadoHoras: 8,
      tiempoEstimadoMinutos: 30,
      horarioPermitido: '05:00 AM - 07:00 PM (Restricción nocturna en descenso de montaña)',
      velMaxCarreteraKmH: 80,
      velMaxUrbanaKmH: 50,
      velMaxZonaEspecialKmH: 30,
      velMaxPatioKmH: 10,
      paradasObligatorias: [
        {
          id: 'STOP-1',
          puntoParada: 'Estación de Servicio Segura Villeta / Guaduas',
          kilometroReferencia: 'Km 84',
          tiempoConduccionPrevioHoras: 2.5,
          duracionDescansoMinutos: 20,
          actividadPausaActiva: 'Estiramiento osteomuscular, hidratación e inspección visual de llantas y frenos.'
        },
        {
          id: 'STOP-2',
          puntoParada: 'Parador Logístico Puerto Triunfo / Doradal',
          kilometroReferencia: 'Km 245',
          tiempoConduccionPrevioHoras: 5.0,
          duracionDescansoMinutos: 45,
          actividadPausaActiva: 'Pausa de alimentación ligera, descanso visual y verificación de aseguramiento de carga.'
        },
        {
          id: 'STOP-3',
          puntoParada: 'Bahía Segura Santuario (Antes de descenso a Medellín)',
          kilometroReferencia: 'Km 355',
          tiempoConduccionPrevioHoras: 7.0,
          duracionDescansoMinutos: 15,
          actividadPausaActiva: 'Enfriamiento y chequeo de temperatura de campanas/discos de freno antes del descenso.'
        }
      ],
      puntosCriticosCorredor: 'Descenso Alto del Trigo, curvas cerradas en Alto de la Virgen y ascenso/descenso Santuario-Caño Alegre.',
      peajesYControles: '6 Peajes ( Siberia, Caiquero, Korán, Puerto Triunfo, Cocorná, Las Palmas) + 2 Puestos DITRA.',
      recomendacionesSeguridad: 'Uso permanente de freno de motor en pendientes >6%, luces bajas encendidas 24h y reporte en cada parada obligatoria.'
    },
    {
      id: 'RUT-02',
      paso5RutaId: 2,
      codigoRutograma: 'RUT-PESV-002',
      nombreCorredor: 'Distribución Urbana Bogotá',
      origen: 'Sede Principal El Dorado',
      destino: 'Red Metropolitana Urbana',
      distanciaKm: 45,
      frecuenciaPaso5: 'Diaria (6 veces por semana)',
      viaPrincipal: 'Vías arterias urbanas metropolitanas (Av. Boyacá, Av. 68, Autopista Norte)',
      tiempoEstimadoHoras: 3,
      tiempoEstimadoMinutos: 15,
      horarioPermitido: '06:00 AM - 06:00 PM',
      velMaxCarreteraKmH: 60,
      velMaxUrbanaKmH: 50,
      velMaxZonaEspecialKmH: 30,
      velMaxPatioKmH: 10,
      paradasObligatorias: [
        {
          id: 'STOP-201',
          puntoParada: 'Bahía Autorizada Punto Medio de Entrega',
          kilometroReferencia: 'Km 22 (Mitad de circuito)',
          tiempoConduccionPrevioHoras: 2.0,
          duracionDescansoMinutos: 15,
          actividadPausaActiva: 'Pausa activa de miembros superiores/inferiores y verificación de cierre de furgón.'
        }
      ],
      puntosCriticosCorredor: 'Intersecciones con ciclorrutas en Av. Boyacá, pasos peatonales de alta densidad y zonas escolares.',
      peajesYControles: 'Controles de velocidad por cámaras salvavidas (límite estricto 50 km/h).',
      recomendacionesSeguridad: 'Verificación constante de espejos de punto ciego ante presencia de motociclistas y ciclistas.'
    },
    {
      id: 'RUT-03',
      paso5RutaId: 3,
      codigoRutograma: 'RUT-PESV-003',
      nombreCorredor: 'Corredor Puerto Buenaventura',
      origen: 'Sede Industrial Cali',
      destino: 'Buenaventura (Puerto)',
      distanciaKm: 120,
      frecuenciaPaso5: '12 veces al mes',
      viaPrincipal: 'Vía nacional doble calzada de alta densidad (Vía al Mar / Loboguerrero)',
      tiempoEstimadoHoras: 3,
      tiempoEstimadoMinutos: 40,
      horarioPermitido: '05:30 AM - 06:30 PM',
      velMaxCarreteraKmH: 70,
      velMaxUrbanaKmH: 40,
      velMaxZonaEspecialKmH: 30,
      velMaxPatioKmH: 10,
      paradasObligatorias: [
        {
          id: 'STOP-301',
          puntoParada: 'Estación de Control Cisneros / Loboguerrero',
          kilometroReferencia: 'Km 62',
          tiempoConduccionPrevioHoras: 1.8,
          duracionDescansoMinutos: 20,
          actividadPausaActiva: 'Chequeo de frenos, hidratación y reporte satelital antes de ingreso a zona portuaria.'
        }
      ],
      puntosCriticosCorredor: 'Sector de túneles, alta pluviosidad en Córdoba/Cisneros y alto flujo de tractocamiones.',
      peajesYControles: 'Peajes Estambul y Loboguerrero + Puesto de Control Policía de Carreteras.',
      recomendacionesSeguridad: 'Encender luces exploradoras en lluvia o túneles y conservar mínimo 50 metros de distancia con vehículos de carga.'
    }
  ],
  dispatches: [
    {
      id: 'DSP-01',
      codigoDespacho: 'DESP-2026-001',
      fechaViaje: TODAY_ISO,
      horaSalida: '06:15',
      rutogramaId: 'RUT-01',
      conductorNombre: 'Carlos Andrés Restrepo Gómez',
      conductorCedula: '71.452.980',
      esquemaCapacitacionEstado: 'Vigente',
      fechaVencimientoCapacitacion: '2027-06-15',
      vehiculoPlaca: 'JKS-284',
      vehiculoClase: 'Tractocamión Kenworth',
      inspeccionPreoperacionalHoy: true,
      fechaInspeccionPreoperacional: TODAY_ISO,
      codigoPreoperacional: 'PREOP-2026-884',
      testAlcoholemiaNegativo: true,
      horasSuenoPrevias: 8,
      estadoAutorizacion: 'Autorizado',
      autorizadoPor: 'Centro de Control PESV'
    },
    {
      id: 'DSP-02',
      codigoDespacho: 'DESP-2026-002',
      fechaViaje: TODAY_ISO,
      horaSalida: '07:30',
      rutogramaId: 'RUT-02',
      conductorNombre: 'Jorge Eliécer Mendoza Silva',
      conductorCedula: '80.194.332',
      esquemaCapacitacionEstado: 'Vencido',
      fechaVencimientoCapacitacion: '2026-04-10',
      vehiculoPlaca: 'WHZ-885',
      vehiculoClase: 'Motocicleta Yamaha FZ25',
      inspeccionPreoperacionalHoy: false,
      fechaInspeccionPreoperacional: '2026-06-20',
      codigoPreoperacional: 'SIN-PREOP-HOY',
      testAlcoholemiaNegativo: true,
      horasSuenoPrevias: 7,
      estadoAutorizacion: 'Bloqueado por Seguridad',
      motivoBloqueo: 'BLOQUEO DE SEGURIDAD ACTIVO: 1) Esquema de capacitación del conductor VENCIDO. 2) El vehículo NO cuenta con inspección preoperacional aprobada el día de hoy.'
    }
  ],
  thirdPartyTrips: [
    {
      id: 'TER-01',
      radicado: 'VTER-2026-001',
      fechaSolicitud: TODAY_ISO,
      fechaViajeProgramado: '2026-07-05',
      horaSalida: '06:00',
      tipoDesplazamientoMasivo: 'Integración Empresarial / Bienestar',
      rutogramaId: 'RUT-01',
      rutogramaNombre: 'Corredor Troncal de Occidente (Bogotá D.C. -> Medellín)',
      numeroPasajeros: 36,
      empresaTransporteTercero: 'Expresos Especiales de Colombia S.A.S.',
      nitEmpresaTercero: '900.412.889-4',
      conductorNombre: 'Hernán Darío Gómez Pineda',
      conductorCedula: '79.654.112',
      conductorTelefono: '3114568923',
      licenciaCategoria: 'C3 Vigente',
      esquemaCapacitacionVigente: true,
      vehiculoPlaca: 'SXT-945',
      vehiculoClase: 'Bus Especial 40 Pasajeros',
      inspeccionPreoperacionalDiaAprobada: true,
      fuecNumero: 'FUEC-2026-31500984',
      soatVigente: true,
      rtmVigente: true,
      polizasRccRceVigentes: true,
      compromisoLimitesYParadas: true,
      estadoAprobacion: 'Pendiente de Aprobación',
      observacionesRevision: 'Autoregistrado por el conductor contratista. Cumple requisitos documentales y articulación con Rutograma RUT-PESV-001.'
    }
  ]
};

// Validation helper for Pre-Trip Security Lock
export function evaluateDispatchSecurityLock(params: {
  esquemaCapacitacionEstado: 'Vigente' | 'Vencido';
  inspeccionPreoperacionalHoy: boolean;
  fechaInspeccionPreoperacional: string;
  fechaViaje: string;
}): { blocked: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (params.esquemaCapacitacionEstado !== 'Vigente') {
    reasons.push('El conductor tiene el esquema de capacitación vial VENCIDO o pendiente.');
  }
  if (!params.inspeccionPreoperacionalHoy || params.fechaInspeccionPreoperacional !== params.fechaViaje) {
    reasons.push('El vehículo NO cuenta con la inspección preoperacional aprobada el mismo día del viaje.');
  }
  return {
    blocked: reasons.length > 0,
    reasons
  };
}

interface Step15PublicTripRegistrationModalProps {
  companyName: string;
  companyNit: string;
  companyLogo?: string;
  isStandalonePage?: boolean;
  onClose: () => void;
}

export function Step15PublicTripRegistrationModal({
  companyName,
  companyNit,
  companyLogo,
  isStandalonePage = false,
  onClose
}: Step15PublicTripRegistrationModalProps) {
  const [state, setState] = useState<Step15State>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...INITIAL_STEP15_STATE, ...JSON.parse(saved) };
    } catch {}
    return INITIAL_STEP15_STATE;
  });

  const [submittedRadicado, setSubmittedRadicado] = useState<string | null>(null);
  const [form, setForm] = useState({
    fechaViajeProgramado: TODAY_ISO,
    horaSalida: '06:30',
    tipoDesplazamientoMasivo: 'Salida Pedagógica / Académica' as ThirdPartyMassTripRegistration['tipoDesplazamientoMasivo'],
    rutogramaId: state.rutogramas[0]?.id || 'RUT-01',
    numeroPasajeros: 28,
    empresaTransporteTercero: '',
    nitEmpresaTercero: '',
    conductorNombre: '',
    conductorCedula: '',
    conductorTelefono: '',
    licenciaCategoria: 'C2 / C3 Servicio Especial',
    esquemaCapacitacionVigente: true,
    vehiculoPlaca: '',
    vehiculoClase: 'Bus / Van de Transporte Especial',
    inspeccionPreoperacionalDiaAprobada: true,
    fuecNumero: '',
    soatVigente: true,
    rtmVigente: true,
    polizasRccRceVigentes: true,
    compromisoLimitesYParadas: true,
    soporteDocumentalNombre: '',
    soporteDocumentalDataUrl: ''
  });

  useEffect(() => {
    const unsub = subscribeToSystemSetting(FIRESTORE_DOC_ID, (cloudData) => {
      if (cloudData) {
        setState(prev => ({ ...prev, ...cloudData }));
      }
    });
    return () => unsub();
  }, []);

  const selectedRutograma = state.rutogramas.find(r => r.id === form.rutogramaId) || state.rutogramas[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.conductorNombre.trim() || !form.vehiculoPlaca.trim()) return;

    const radicado = `VTER-${new Date().getFullYear()}-${String(state.thirdPartyTrips.length + 1).padStart(3, '0')}`;
    const newRecord: ThirdPartyMassTripRegistration = {
      id: `TER-${Date.now()}`,
      radicado,
      fechaSolicitud: TODAY_ISO,
      fechaViajeProgramado: form.fechaViajeProgramado,
      horaSalida: form.horaSalida,
      tipoDesplazamientoMasivo: form.tipoDesplazamientoMasivo,
      rutogramaId: selectedRutograma?.id || 'RUT-01',
      rutogramaNombre: selectedRutograma
        ? `${selectedRutograma.nombreCorredor} (${selectedRutograma.origen} -> ${selectedRutograma.destino})`
        : 'Ruta Corporativa',
      numeroPasajeros: Number(form.numeroPasajeros) || 1,
      empresaTransporteTercero: form.empresaTransporteTercero.trim() || 'Transporte Especial Contratado',
      nitEmpresaTercero: form.nitEmpresaTercero.trim() || 'N/A',
      conductorNombre: form.conductorNombre.trim(),
      conductorCedula: form.conductorCedula.trim(),
      conductorTelefono: form.conductorTelefono.trim(),
      licenciaCategoria: form.licenciaCategoria,
      esquemaCapacitacionVigente: form.esquemaCapacitacionVigente,
      vehiculoPlaca: form.vehiculoPlaca.trim().toUpperCase(),
      vehiculoClase: form.vehiculoClase,
      inspeccionPreoperacionalDiaAprobada: form.inspeccionPreoperacionalDiaAprobada,
      fuecNumero: form.fuecNumero.trim() || 'FUEC-EN-VERIFICACION',
      soatVigente: form.soatVigente,
      rtmVigente: form.rtmVigente,
      polizasRccRceVigentes: form.polizasRccRceVigentes,
      compromisoLimitesYParadas: form.compromisoLimitesYParadas,
      soporteDocumentalNombre: form.soporteDocumentalNombre,
      soporteDocumentalDataUrl: form.soporteDocumentalDataUrl,
      estadoAprobacion: 'Pendiente de Aprobación',
      observacionesRevision: 'Diligenciado por el conductor para revisión y aprobación del Líder PESV.'
    };

    const updated: Step15State = {
      ...state,
      thirdPartyTrips: [newRecord, ...state.thirdPartyTrips]
    };
    setState(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    saveSystemSetting(FIRESTORE_DOC_ID, updated);
    setSubmittedRadicado(radicado);
  };

  return (
    <div className={`${isStandalonePage ? 'min-h-screen bg-slate-900 py-6 px-4' : 'fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto'}`}>
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-emerald-900 text-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {companyLogo ? (
                <img src={companyLogo} alt={companyName} className="w-11 h-11 rounded-lg bg-white p-1 object-contain" />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center border border-white/25">
                  <Compass size={24} className="text-emerald-300" />
                </div>
              )}
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/25 text-emerald-200 px-2 py-0.5 rounded">
                  PASO 15 PESV • AUTOREGISTRO DE VIAJES Y TERCEROS
                </span>
                <h2 className="text-lg font-black leading-tight mt-0.5">{companyName}</h2>
                <p className="text-xs text-slate-300">Formulario de Conductor para Aprobación de Desplazamiento</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
            >
              {isStandalonePage ? 'Ir a Plataforma' : 'Cerrar'}
            </button>
          </div>
        </div>

        <div className="p-5 max-h-[82vh] overflow-y-auto">
          {submittedRadicado ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                  Solicitud Radicada: {submittedRadicado}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-2">
                  ¡Formulario Registrado para Aprobación del PESV!
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                  Sus datos de conductor, soportes del vehículo e itinerario articulado con el Rutograma han quedado registrados en estado <strong>Pendiente de Aprobación</strong> en el Paso 15.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubmittedRadicado(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Registrar Otro Desplazamiento
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-950">
                <strong>Instrucción para el Conductor:</strong> Diligencie este formulario antes de iniciar el desplazamiento masivo (salida pedagógica, integración o transporte contratado). Su solicitud será revisada y aprobada por el Coordinador PESV.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Tipo de Desplazamiento Masivo / Tercero *</label>
                  <select
                    value={form.tipoDesplazamientoMasivo}
                    onChange={e => setForm({ ...form, tipoDesplazamientoMasivo: e.target.value as ThirdPartyMassTripRegistration['tipoDesplazamientoMasivo'] })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-bold"
                  >
                    <option value="Salida Pedagógica / Académica">Salida Pedagógica / Académica</option>
                    <option value="Integración Empresarial / Bienestar">Integración Empresarial / Bienestar</option>
                    <option value="Transporte Especial Contratado de Personal">Transporte Especial Contratado de Personal</option>
                    <option value="Misión Corporativa Grupal">Misión Corporativa Grupal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Ruta Articulada del Planificador / Rutograma *</label>
                  <select
                    value={form.rutogramaId}
                    onChange={e => setForm({ ...form, rutogramaId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-bold"
                  >
                    {state.rutogramas.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.codigoRutograma} - {r.nombreCorredor} ({r.origen} → {r.destino})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedRutograma && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-700 space-y-1">
                  <p className="font-black text-slate-900">
                    Parámetros Obligatorios del Rutograma Seleccionado ({selectedRutograma.codigoRutograma}):
                  </p>
                  <p>
                    • <strong>Tiempo estimado:</strong> {selectedRutograma.tiempoEstimadoHoras}h {selectedRutograma.tiempoEstimadoMinutos}m | <strong>Velocidad Máx Carretera:</strong> {selectedRutograma.velMaxCarreteraKmH} km/h | <strong>Urbana:</strong> {selectedRutograma.velMaxUrbanaKmH} km/h
                  </p>
                  <p>
                    • <strong>Paradas obligatorias de descanso:</strong> {selectedRutograma.paradasObligatorias.map(p => `${p.puntoParada} (${p.duracionDescansoMinutos} min)`).join(' • ')}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Fecha del Viaje *</label>
                  <input
                    type="date"
                    required
                    value={form.fechaViajeProgramado}
                    onChange={e => setForm({ ...form, fechaViajeProgramado: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Hora de Salida</label>
                  <input
                    type="time"
                    value={form.horaSalida}
                    onChange={e => setForm({ ...form, horaSalida: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">N° de Pasajeros</label>
                  <input
                    type="number"
                    min={1}
                    value={form.numeroPasajeros}
                    onChange={e => setForm({ ...form, numeroPasajeros: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Empresa de Transporte Contratada *</label>
                  <input
                    type="text"
                    required
                    value={form.empresaTransporteTercero}
                    onChange={e => setForm({ ...form, empresaTransporteTercero: e.target.value })}
                    placeholder="Nombre de la empresa de transporte especial"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">NIT Empresa Transporte / N° FUEC</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={form.nitEmpresaTercero}
                      onChange={e => setForm({ ...form, nitEmpresaTercero: e.target.value })}
                      placeholder="NIT"
                      className="px-2.5 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                    <input
                      type="text"
                      value={form.fuecNumero}
                      onChange={e => setForm({ ...form, fuecNumero: e.target.value })}
                      placeholder="N° FUEC"
                      className="px-2.5 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nombre del Conductor *</label>
                  <input
                    type="text"
                    required
                    value={form.conductorNombre}
                    onChange={e => setForm({ ...form, conductorNombre: e.target.value })}
                    placeholder="Nombre completo"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Cédula del Conductor *</label>
                  <input
                    type="text"
                    required
                    value={form.conductorCedula}
                    onChange={e => setForm({ ...form, conductorCedula: e.target.value })}
                    placeholder="Documento"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Placa del Vehículo *</label>
                  <input
                    type="text"
                    required
                    value={form.vehiculoPlaca}
                    onChange={e => setForm({ ...form, vehiculoPlaca: e.target.value.toUpperCase() })}
                    placeholder="SXT-945"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg uppercase font-bold"
                  />
                </div>
              </div>

              {/* Mandatory Safety Checkboxes */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-2 text-xs">
                <p className="font-black text-emerald-950 uppercase text-[11px]">
                  Declaración de Requisitos Previos al Viaje y Control Documental:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-semibold text-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.esquemaCapacitacionVigente}
                      onChange={e => setForm({ ...form, esquemaCapacitacionVigente: e.target.checked })}
                    />
                    Esquema de capacitación en seguridad vial VIGENTE
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.inspeccionPreoperacionalDiaAprobada}
                      onChange={e => setForm({ ...form, inspeccionPreoperacionalDiaAprobada: e.target.checked })}
                    />
                    Inspección preoperacional APROBADA el mismo día
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.soatVigente}
                      onChange={e => setForm({ ...form, soatVigente: e.target.checked })}
                    />
                    SOAT y Revisión Técnico-Mecánica vigentes
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.polizasRccRceVigentes}
                      onChange={e => setForm({ ...form, polizasRccRceVigentes: e.target.checked })}
                    />
                    Pólizas RCC / RCE y FUEC vigentes
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700">
                  Adjuntar FUEC / Preoperacional / Documentos (Opcional):
                </span>
                <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                  <Upload size={13} />
                  {form.soporteDocumentalNombre ? form.soporteDocumentalNombre.slice(0, 20) : 'Subir Soporte PDF/Foto'}
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        setForm(prev => ({
                          ...prev,
                          soporteDocumentalNombre: file.name,
                          soporteDocumentalDataUrl: reader.result as string
                        }));
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-md cursor-pointer"
              >
                Enviar Registro de Desplazamiento para Aprobación PESV
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

interface FrequentRoutePaso5 {
  id: number;
  nombre: string;
  origen: string;
  destino: string;
  distancia: number;
  frecuencia: string;
  viaPrincipal: string;
}

interface Step15TripPlanningModuleProps {
  config: CompanyConfig;
  companyName: string;
  companyNit: string;
  companyLogo?: string;
  frequentRoutesPaso5: FrequentRoutePaso5[];
  onSyncRouteToPaso5?: (route: FrequentRoutePaso5) => void;
  onNavigateToPaso5?: () => void;
}

export default function Step15TripPlanningModule({
  config,
  companyName,
  companyNit,
  companyLogo = '',
  frequentRoutesPaso5,
  onSyncRouteToPaso5,
  onNavigateToPaso5
}: Step15TripPlanningModuleProps) {
  const [activeTab, setActiveTab] = useState<'rutograma' | 'validacion-previa' | 'viajes-terceros'>('rutograma');

  const [state, setState] = useState<Step15State>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...INITIAL_STEP15_STATE, ...JSON.parse(saved) };
    } catch {}
    return INITIAL_STEP15_STATE;
  });

  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [showPublicModal, setShowPublicModal] = useState(false);

  // Rutograma Editor State
  const [selectedRutogramaId, setSelectedRutogramaId] = useState<string>('RUT-01');
  const [editingRutograma, setEditingRutograma] = useState<DigitalRutogramaItem | null>(null);
  const [isNewRutograma, setIsNewRutograma] = useState(false);

  // Dispatch Validation Editor State
  const [editingDispatch, setEditingDispatch] = useState<PreTripDispatchOrder | null>(null);
  const [isNewDispatch, setIsNewDispatch] = useState(false);

  // QR Canvas for Third Party Driver Self-Registration
  const qrThirdPartyRef = useRef<HTMLCanvasElement | null>(null);
  const [copiedQrLink, setCopiedQrLink] = useState(false);

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pesv-colombia.app';
  const thirdPartyPublicUrl = `${originUrl}/?canal=registro-viaje-tercero&nit=${encodeURIComponent(companyNit)}&empresa=${encodeURIComponent(companyName)}`;

  // Sync with Firestore
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

  // Automatically align any new frequent routes created in Paso 5 into Paso 15 Rutogramas
  useEffect(() => {
    if (!frequentRoutesPaso5 || frequentRoutesPaso5.length === 0) return;
    setState(prev => {
      let changed = false;
      const updatedRutogramas = [...prev.rutogramas];

      frequentRoutesPaso5.forEach((r5) => {
        const existingIdx = updatedRutogramas.findIndex(
          rt => rt.paso5RutaId === r5.id || rt.nombreCorredor.toLowerCase() === r5.nombre.toLowerCase()
        );
        if (existingIdx === -1) {
          changed = true;
          const estHours = Math.max(1, Math.round(r5.distancia / 50));
          updatedRutogramas.push({
            id: `RUT-P5-${r5.id}`,
            paso5RutaId: r5.id,
            codigoRutograma: `RUT-PESV-00${updatedRutogramas.length + 1}`,
            nombreCorredor: r5.nombre,
            origen: r5.origen,
            destino: r5.destino,
            distanciaKm: r5.distancia,
            frecuenciaPaso5: r5.frecuencia,
            viaPrincipal: r5.viaPrincipal,
            tiempoEstimadoHoras: estHours,
            tiempoEstimadoMinutos: 15,
            horarioPermitido: '05:30 AM - 06:30 PM',
            velMaxCarreteraKmH: 80,
            velMaxUrbanaKmH: 50,
            velMaxZonaEspecialKmH: 30,
            velMaxPatioKmH: 10,
            paradasObligatorias: [
              {
                id: `ST-${Date.now()}`,
                puntoParada: `Punto Seguro Intermedio (${r5.origen} - ${r5.destino})`,
                kilometroReferencia: `Km ${Math.round(r5.distancia / 2)}`,
                tiempoConduccionPrevioHoras: 2,
                duracionDescansoMinutos: 15,
                actividadPausaActiva: 'Pausa activa osteomuscular, hidratación y chequeo visual del vehículo.'
              }
            ],
            puntosCriticosCorredor: 'Intersecciones principales, zonas de ascenso/descenso y pasos urbanos.',
            peajesYControles: 'Puestos de control vial en el corredor.',
            recomendacionesSeguridad: 'Cumplir límites de velocidad del corredor y realizar la parada obligatoria registrada.'
          });
        }
      });

      if (!changed) return prev;
      const nextState = { ...prev, rutogramas: updatedRutogramas };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
      } catch {}
      return nextState;
    });
  }, [frequentRoutesPaso5]);

  useEffect(() => {
    if (qrThirdPartyRef.current) {
      QRCode.toCanvas(qrThirdPartyRef.current, thirdPartyPublicUrl, {
        width: 140,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' }
      }).catch(() => {});
    }
  }, [activeTab, thirdPartyPublicUrl]);

  const persistStep15State = (updated: Step15State, msg?: string) => {
    setState(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    saveSystemSetting(FIRESTORE_DOC_ID, updated);
    if (msg) {
      setStatusBanner(msg);
      setTimeout(() => setStatusBanner(null), 3400);
    }
  };

  const selectedRutograma = state.rutogramas.find(r => r.id === selectedRutogramaId) || state.rutogramas[0];

  // Export PDF for Paso 15 (Rutogramas, Despachos y Viajes con Terceros)
  const exportStep15PDF = (singleRutograma?: DigitalRutogramaItem) => {
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
    doc.text('PASO 15: PLANIFICACION DE DESPLAZAMIENTOS LABORALES Y RUTOGRAMAS', startX, 18);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${companyName} | NIT: ${companyNit} | Alineado con Paso 5 (Rutas Frecuentes)`, startX, 24);
    doc.text(`Rutograma Digital, Validacion Previa al Viaje y Control de Viajes con Terceros`, startX, 29);

    y = 42;
    const listToExport = singleRutograma ? [singleRutograma] : state.rutogramas;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('1. PLANIFICADOR Y RUTOGRAMAS DIGITALES DE CORREDORES VIALES', 14, y);
    y += 5;

    listToExport.forEach((rut) => {
      if (y > 225) { doc.addPage(); y = 20; }
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, pageW - 28, 26, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(`${rut.codigoRutograma} - ${rut.nombreCorredor} (${rut.origen} -> ${rut.destino} | ${rut.distanciaKm} km)`, 16, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`Tiempo estimado: ${rut.tiempoEstimadoHoras}h ${rut.tiempoEstimadoMinutos}m | Horario: ${rut.horarioPermitido}`, 16, y + 10);
      doc.text(`Limites de Velocidad: Carretera ${rut.velMaxCarreteraKmH} km/h | Urbana ${rut.velMaxUrbanaKmH} km/h | Especial ${rut.velMaxZonaEspecialKmH} km/h | Patios ${rut.velMaxPatioKmH} km/h`, 16, y + 14.5);
      const stopsText = rut.paradasObligatorias.map(s => `${s.puntoParada} (${s.kilometroReferencia}, ${s.duracionDescansoMinutos} min)`).join(' ; ');
      doc.text(`Paradas Obligatorias de Descanso: ${stopsText.slice(0, 105)}`, 16, y + 19);
      doc.text(`Puntos Criticos: ${rut.puntosCriticosCorredor.slice(0, 105)}`, 16, y + 23.5);
      y += 29;
    });

    if (!singleRutograma) {
      if (y > 225) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('2. VALIDACION DE REQUISITOS PREVIOS AL VIAJE (CONTROL DE DESPACHO)', 14, y);
      y += 5;
      state.dispatches.forEach((d) => {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(`• [${d.codigoDespacho}] ${d.conductorNombre} | Placa: ${d.vehiculoPlaca} | Estado: ${d.estadoAutorizacion}`, 15, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text(`  Capacitacion: ${d.esquemaCapacitacionEstado} | Preoperacional Hoy (${d.fechaViaje}): ${d.inspeccionPreoperacionalHoy ? 'APROBADA' : 'NO REGISTRADA'}`, 15, y + 4);
        y += 8.5;
      });

      if (y > 225) { doc.addPage(); y = 20; }
      y += 3;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('3. MODULO DE VIAJES MASIVOS CON TERCEROS Y APROBACION DOCUMENTAL', 14, y);
      y += 5;
      state.thirdPartyTrips.forEach((t) => {
        if (y > 245) { doc.addPage(); y = 20; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(`• [${t.radicado}] ${t.tipoDesplazamientoMasivo} | Ruta: ${t.rutogramaNombre} | Estado: ${t.estadoAprobacion}`, 15, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text(`  Empresa: ${t.empresaTransporteTercero} | Conductor: ${t.conductorNombre} | Placa: ${t.vehiculoPlaca} | FUEC: ${t.fuecNumero}`, 15, y + 4);
        y += 9;
      });
    }

    doc.save(`Paso15_Planificacion_Desplazamientos_${companyName.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="mt-6 space-y-5 border-t border-slate-200 pt-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 shrink-0">
              <Compass size={26} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                  PASO 15 • RESOLUCIÓN 40595 DE 2022
                </span>
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded border border-emerald-500/30">
                  Articulado con Paso 5 ({frequentRoutesPaso5.length} Rutas Frecuentes)
                </span>
              </div>
              <h3 className="text-lg font-black tracking-tight mt-1">
                Planificación de Desplazamientos Laborales y Rutograma Digital
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 max-w-3xl">
                Planificador de rutas seguras con tiempos estimados, paradas obligatorias de descanso y límites de velocidad; bloqueo automático previo al viaje (capacitación + preoperacional del día) y control de viajes masivos con terceros con autoregistro de conductores.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowPublicModal(true)}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <UserCheck size={15} />
              Formulario Autoregistro Conductor
            </button>
            <button
              type="button"
              onClick={() => exportStep15PDF()}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-900 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Download size={15} />
              Descargar Plan Paso 15 (PDF)
            </button>
          </div>
        </div>

        {/* KPI Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Rutogramas Activos (Paso 5)</p>
            <p className="text-lg font-black text-white mt-0.5">{state.rutogramas.length} Rutas Seguras</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Despachos Autorizados Hoy</p>
            <p className="text-lg font-black text-emerald-300 mt-0.5">
              {state.dispatches.filter(d => d.estadoAutorizacion === 'Autorizado').length} Habilitados
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Bloqueos de Seguridad Vial</p>
            <p className="text-lg font-black text-rose-400 mt-0.5">
              {state.dispatches.filter(d => d.estadoAutorizacion === 'Bloqueado por Seguridad').length} Retenidos
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Viajes con Terceros / Masivos</p>
            <p className="text-lg font-black text-amber-300 mt-0.5">
              {state.thirdPartyTrips.length} Registrados
            </p>
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
          onClick={() => setActiveTab('rutograma')}
          className={`px-3.5 py-2 rounded-lg text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
            activeTab === 'rutograma' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
          }`}
        >
          <Compass size={14} />
          1. Planificador / Rutograma Digital (Alineado con Paso 5)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('validacion-previa')}
          className={`px-3.5 py-2 rounded-lg text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
            activeTab === 'validacion-previa' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
          }`}
        >
          <Lock size={14} />
          2. Validación de Requisitos Previos al Viaje (Bloqueo de Despacho)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('viajes-terceros')}
          className={`px-3.5 py-2 rounded-lg text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
            activeTab === 'viajes-terceros' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
          }`}
        >
          <Users size={14} />
          3. Módulo de Viajes con Terceros y Autoregistro Conductor
        </button>
      </div>

      {/* TAB 1: PLANIFICADOR / RUTOGRAMA DIGITAL (ALINEADO CON PASO 5) */}
      {activeTab === 'rutograma' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Compass size={17} className="text-indigo-600" />
                Planificador y Rutograma Digital Articulado con Rutas Frecuentes (Paso 5)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Diseñe rutas seguras indicando tiempos estimados de viaje, puntos de parada obligatoria para descanso activo y límites de velocidad por tramo.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              {onNavigateToPaso5 && (
                <button
                  type="button"
                  onClick={onNavigateToPaso5}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
                >
                  Ver Rutas en Paso 5
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsNewRutograma(true);
                  setEditingRutograma({
                    id: `RUT-${Date.now().toString().slice(-4)}`,
                    codigoRutograma: `RUT-PESV-00${state.rutogramas.length + 1}`,
                    nombreCorredor: '',
                    origen: '',
                    destino: '',
                    distanciaKm: 120,
                    frecuenciaPaso5: 'Semanal',
                    viaPrincipal: 'Doble calzada nacional',
                    tiempoEstimadoHoras: 2,
                    tiempoEstimadoMinutos: 45,
                    horarioPermitido: '05:30 AM - 06:30 PM',
                    velMaxCarreteraKmH: 80,
                    velMaxUrbanaKmH: 50,
                    velMaxZonaEspecialKmH: 30,
                    velMaxPatioKmH: 10,
                    paradasObligatorias: [
                      {
                        id: `STOP-${Date.now()}`,
                        puntoParada: 'Estación de Servicio / Bahía Segura Km 60',
                        kilometroReferencia: 'Km 60',
                        tiempoConduccionPrevioHoras: 2,
                        duracionDescansoMinutos: 15,
                        actividadPausaActiva: 'Pausa activa osteomuscular e inspección visual de seguridad.'
                      }
                    ],
                    puntosCriticosCorredor: '',
                    peajesYControles: '',
                    recomendacionesSeguridad: ''
                  });
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus size={14} />
                Diseñar Nuevo Rutograma
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Sidebar of Rutogramas */}
            <div className="lg:col-span-4 space-y-2.5">
              {state.rutogramas.map((rut) => {
                const isSelected = selectedRutograma?.id === rut.id;
                return (
                  <div
                    key={rut.id}
                    onClick={() => setSelectedRutogramaId(rut.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                        isSelected ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        {rut.codigoRutograma}
                      </span>
                      <span className={`text-[10px] font-bold ${isSelected ? 'text-emerald-300' : 'text-emerald-700'}`}>
                        {rut.distanciaKm} km • {rut.tiempoEstimadoHoras}h {rut.tiempoEstimadoMinutos}m
                      </span>
                    </div>
                    <h5 className="text-xs font-extrabold mt-1.5">{rut.nombreCorredor}</h5>
                    <p className={`text-[11px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {rut.origen} → {rut.destino}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/20 text-[10px]">
                      <span className={isSelected ? 'text-slate-300' : 'text-slate-500'}>
                        Frecuencia Paso 5: {rut.frecuenciaPaso5}
                      </span>
                      <span className="font-bold text-amber-400">
                        {rut.paradasObligatorias.length} paradas
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detailed Rutograma Digital View */}
            {selectedRutograma && (
              <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black px-2.5 py-0.5 rounded bg-indigo-100 text-indigo-900 border border-indigo-200">
                        {selectedRutograma.codigoRutograma}
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Sincronizado con Diagnóstico Paso 5
                      </span>
                    </div>
                    <h4 className="text-base font-black text-slate-900 mt-1">
                      {selectedRutograma.nombreCorredor}: {selectedRutograma.origen} → {selectedRutograma.destino}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Vía Principal: <strong>{selectedRutograma.viaPrincipal}</strong> | Frecuencia: {selectedRutograma.frecuenciaPaso5}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewRutograma(false);
                        setEditingRutograma({
                          ...selectedRutograma,
                          paradasObligatorias: selectedRutograma.paradasObligatorias.map(p => ({ ...p }))
                        });
                      }}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 size={13} />
                      Editar Rutograma
                    </button>
                    <button
                      type="button"
                      onClick={() => exportStep15PDF(selectedRutograma)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download size={13} />
                      Ficha Rutograma PDF
                    </button>
                  </div>
                </div>

                {/* Travel Time & Speed Limits Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
                  <div className="col-span-2 bg-indigo-50 border border-indigo-200 rounded-xl p-3">
                    <span className="text-[10px] font-black uppercase text-indigo-700 flex items-center gap-1">
                      <Clock size={12} /> Tiempo Estimado de Viaje
                    </span>
                    <p className="text-base font-black text-indigo-950 mt-0.5">
                      {selectedRutograma.tiempoEstimadoHoras} h {selectedRutograma.tiempoEstimadoMinutos} min ({selectedRutograma.distanciaKm} km)
                    </p>
                    <p className="text-[10px] text-indigo-700 truncate">{selectedRutograma.horarioPermitido}</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] font-bold text-slate-500 block">Carretera Nal.</span>
                    <span className="text-base font-black text-slate-900">{selectedRutograma.velMaxCarreteraKmH}</span>
                    <span className="text-[10px] font-bold text-slate-500 block">km/h máx</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] font-bold text-slate-500 block">Tramo Urbano</span>
                    <span className="text-base font-black text-blue-700">{selectedRutograma.velMaxUrbanaKmH}</span>
                    <span className="text-[10px] font-bold text-slate-500 block">km/h máx</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] font-bold text-slate-500 block">Zonas Escolares</span>
                    <span className="text-base font-black text-amber-700">{selectedRutograma.velMaxZonaEspecialKmH}</span>
                    <span className="text-[10px] font-bold text-slate-500 block">km/h máx</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] font-bold text-slate-500 block">Patios Internos</span>
                    <span className="text-base font-black text-rose-700">{selectedRutograma.velMaxPatioKmH}</span>
                    <span className="text-[10px] font-bold text-slate-500 block">km/h máx</span>
                  </div>
                </div>

                {/* Mandatory Rest Stops Timeline */}
                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-2.5">
                  <h5 className="text-xs font-black text-amber-950 uppercase flex items-center gap-1.5">
                    <Coffee size={15} className="text-amber-600" />
                    Puntos de Parada Obligatoria (Descanso, Pausas Activas y Prevención de Fatiga)
                  </h5>
                  <div className="space-y-2">
                    {selectedRutograma.paradasObligatorias.map((stop, idx) => (
                      <div key={stop.id} className="bg-white rounded-lg border border-amber-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px]">
                              PARADA #{idx + 1} • {stop.kilometroReferencia}
                            </span>
                            <strong className="text-slate-900">{stop.puntoParada}</strong>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1">{stop.actividadPausaActiva}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-black text-[11px]">
                            Descanso: {stop.duracionDescansoMinutos} min
                          </span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            Tras {stop.tiempoConduccionPrevioHoras}h de conducción
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Critical Points & Safety Recommendations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200">
                    <p className="font-black text-rose-900 uppercase text-[11px] mb-1">
                      Puntos Críticos Identificados en el Corredor
                    </p>
                    <p className="text-slate-700 leading-relaxed">{selectedRutograma.puntosCriticosCorredor}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
                    <p className="font-black text-emerald-900 uppercase text-[11px] mb-1">
                      Controles Operacionales y Peajes
                    </p>
                    <p className="text-slate-700 leading-relaxed">
                      {selectedRutograma.peajesYControles} — {selectedRutograma.recomendacionesSeguridad}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: VALIDACIÓN DE REQUISITOS PREVIOS AL VIAJE (BLOQUEO AUTOMÁTICO DE DESPACHO) */}
      {activeTab === 'validacion-previa' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Lock size={17} className="text-rose-600" />
                Validación de Requisitos Previos al Viaje (Check y Bloqueo de Seguridad en Despacho)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                El sistema bloquea e impide autorizar cualquier despacho si el conductor tiene el <strong>esquema de capacitación vencido</strong> o si el vehículo <strong>no cuenta con la inspección preoperacional aprobada el mismo día</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsNewDispatch(true);
                setEditingDispatch({
                  id: `DSP-${Date.now().toString().slice(-4)}`,
                  codigoDespacho: `DESP-2026-00${state.dispatches.length + 1}`,
                  fechaViaje: TODAY_ISO,
                  horaSalida: '08:00',
                  rutogramaId: state.rutogramas[0]?.id || 'RUT-01',
                  conductorNombre: '',
                  conductorCedula: '',
                  esquemaCapacitacionEstado: 'Vigente',
                  fechaVencimientoCapacitacion: '2027-06-30',
                  vehiculoPlaca: '',
                  vehiculoClase: 'Camión / Flota Operativa',
                  inspeccionPreoperacionalHoy: true,
                  fechaInspeccionPreoperacional: TODAY_ISO,
                  codigoPreoperacional: `PREOP-${TODAY_ISO}-01`,
                  testAlcoholemiaNegativo: true,
                  horasSuenoPrevias: 8,
                  estadoAutorizacion: 'Autorizado'
                });
              }}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
            >
              <Plus size={14} />
              Validar Nuevo Despacho
            </button>
          </div>

          <div className="space-y-3">
            {state.dispatches.map((dsp) => {
              const lockEval = evaluateDispatchSecurityLock({
                esquemaCapacitacionEstado: dsp.esquemaCapacitacionEstado,
                inspeccionPreoperacionalHoy: dsp.inspeccionPreoperacionalHoy,
                fechaInspeccionPreoperacional: dsp.fechaInspeccionPreoperacional,
                fechaViaje: dsp.fechaViaje
              });
              const rut = state.rutogramas.find(r => r.id === dsp.rutogramaId);

              return (
                <div
                  key={dsp.id}
                  className={`rounded-xl border-2 p-4 shadow-xs transition-all ${
                    lockEval.blocked
                      ? 'bg-rose-50/40 border-rose-300'
                      : 'bg-white border-emerald-300'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded bg-slate-900 text-white">
                          {dsp.codigoDespacho}
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          Fecha de Viaje: <strong>{dsp.fechaViaje}</strong> ({dsp.horaSalida})
                        </span>
                        <span className="text-xs font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          Ruta: {rut ? `${rut.nombreCorredor} (${rut.origen} → ${rut.destino})` : dsp.rutogramaId}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 text-xs">
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Conductor Asignado</span>
                          <strong className="text-slate-900">{dsp.conductorNombre}</strong>
                          <span className="block text-[10px] text-slate-500">CC: {dsp.conductorCedula}</span>
                        </div>

                        <div className={`p-2.5 rounded-lg border ${
                          dsp.esquemaCapacitacionEstado === 'Vigente'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                            : 'bg-rose-100 border-rose-300 text-rose-950'
                        }`}>
                          <span className="text-[10px] font-black uppercase block">Check 1: Esquema Capacitación</span>
                          <div className="flex items-center justify-between mt-0.5">
                            <strong className="text-xs">{dsp.esquemaCapacitacionEstado.toUpperCase()}</strong>
                            <button
                              type="button"
                              onClick={() => {
                                const nextStatus = dsp.esquemaCapacitacionEstado === 'Vigente' ? 'Vencido' : 'Vigente';
                                const nextList = state.dispatches.map(item => {
                                  if (item.id !== dsp.id) return item;
                                  const check = evaluateDispatchSecurityLock({
                                    esquemaCapacitacionEstado: nextStatus,
                                    inspeccionPreoperacionalHoy: item.inspeccionPreoperacionalHoy,
                                    fechaInspeccionPreoperacional: item.fechaInspeccionPreoperacional,
                                    fechaViaje: item.fechaViaje
                                  });
                                  return {
                                    ...item,
                                    esquemaCapacitacionEstado: nextStatus,
                                    estadoAutorizacion: check.blocked ? 'Bloqueado por Seguridad' as const : 'Autorizado' as const
                                  };
                                });
                                persistStep15State({ ...state, dispatches: nextList }, 'Estado de capacitación validado.');
                              }}
                              className="text-[10px] underline font-bold cursor-pointer"
                            >
                              Alternar Estado
                            </button>
                          </div>
                          <span className="block text-[10px] opacity-80">Vence: {dsp.fechaVencimientoCapacitacion}</span>
                        </div>

                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Vehículo Asignado</span>
                          <strong className="text-slate-900">{dsp.vehiculoPlaca}</strong>
                          <span className="block text-[10px] text-slate-500">{dsp.vehiculoClase}</span>
                        </div>

                        <div className={`p-2.5 rounded-lg border ${
                          dsp.inspeccionPreoperacionalHoy && dsp.fechaInspeccionPreoperacional === dsp.fechaViaje
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                            : 'bg-rose-100 border-rose-300 text-rose-950'
                        }`}>
                          <span className="text-[10px] font-black uppercase block">Check 2: Preoperacional del Día</span>
                          <div className="flex items-center justify-between mt-0.5">
                            <strong className="text-xs">
                              {dsp.inspeccionPreoperacionalHoy && dsp.fechaInspeccionPreoperacional === dsp.fechaViaje
                                ? 'APROBADA HOY'
                                : 'PENDIENTE HOY'}
                            </strong>
                            <button
                              type="button"
                              onClick={() => {
                                const nextPreop = !(dsp.inspeccionPreoperacionalHoy && dsp.fechaInspeccionPreoperacional === dsp.fechaViaje);
                                const nextList = state.dispatches.map(item => {
                                  if (item.id !== dsp.id) return item;
                                  const check = evaluateDispatchSecurityLock({
                                    esquemaCapacitacionEstado: item.esquemaCapacitacionEstado,
                                    inspeccionPreoperacionalHoy: nextPreop,
                                    fechaInspeccionPreoperacional: nextPreop ? item.fechaViaje : 'Sin-Preop',
                                    fechaViaje: item.fechaViaje
                                  });
                                  return {
                                    ...item,
                                    inspeccionPreoperacionalHoy: nextPreop,
                                    fechaInspeccionPreoperacional: nextPreop ? item.fechaViaje : 'Sin-Preop',
                                    estadoAutorizacion: check.blocked ? 'Bloqueado por Seguridad' as const : 'Autorizado' as const
                                  };
                                });
                                persistStep15State({ ...state, dispatches: nextList }, 'Validación de inspección preoperacional del día actualizada.');
                              }}
                              className="text-[10px] underline font-bold cursor-pointer"
                            >
                              {dsp.inspeccionPreoperacionalHoy ? 'Marcar Sin Preop' : 'Aprobar Preop Hoy'}
                            </button>
                          </div>
                          <span className="block text-[10px] opacity-80">Fecha preop: {dsp.fechaInspeccionPreoperacional}</span>
                        </div>
                      </div>

                      {lockEval.blocked && (
                        <div className="bg-rose-600 text-white px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
                          <Ban size={15} className="shrink-0" />
                          <span>
                            BLOQUEO DE SEGURIDAD ACTIVO (DESPACHO RETENIDO): {lockEval.reasons.join(' ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Authorization Action Button */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={lockEval.blocked}
                        onClick={() => {
                          const nextList = state.dispatches.map(item =>
                            item.id === dsp.id ? { ...item, estadoAutorizacion: 'Autorizado' as const } : item
                          );
                          persistStep15State({ ...state, dispatches: nextList }, `Despacho ${dsp.codigoDespacho} autorizado exitosamente.`);
                        }}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                          lockEval.blocked
                            ? 'bg-rose-200 text-rose-900 cursor-not-allowed border border-rose-400'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-sm'
                        }`}
                      >
                        {lockEval.blocked ? <Lock size={14} /> : <ShieldCheck size={15} />}
                        {lockEval.blocked ? 'Despacho Bloqueado' : 'Despacho Autorizado'}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => { setIsNewDispatch(false); setEditingDispatch({ ...dsp }); }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer text-xs font-bold flex items-center gap-1"
                        >
                          <Edit3 size={13} /> Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = state.dispatches.filter(i => i.id !== dsp.id);
                            persistStep15State({ ...state, dispatches: next }, 'Registro de despacho eliminado.');
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: MÓDULO DE VIAJES CON TERCEROS Y AUTOREGISTRO DEL CONDUCTOR PARA APROBACIÓN */}
      {activeTab === 'viajes-terceros' && (
        <div className="space-y-4">
          {/* Top QR & Link Card for Driver Self-Registration */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-5">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 shrink-0">
                <canvas ref={qrThirdPartyRef} className="rounded" />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                  Canal Digital de Autoregistro para Conductores y Terceros
                </span>
                <h4 className="text-base font-black text-slate-900">
                  Módulo de Viajes con Terceros (Salidas Pedagógicas, Integraciones y Transporte Contratado)
                </h4>
                <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                  Comparta este enlace o código QR con el conductor o empresa de transporte contratada para que diligencie el formulario de desplazamiento masivo articulado con los Rutogramas del Planificador. Toda solicitud ingresa abajo para su <strong>revisión y aprobación oficial</strong>.
                </p>
                <div className="bg-slate-100 px-3 py-1.5 rounded-lg text-[11px] font-mono text-slate-700 break-all border border-slate-200">
                  {thirdPartyPublicUrl}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowPublicModal(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <UserCheck size={15} />
                Diligenciar Formulario Conductor Aquí
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(thirdPartyPublicUrl);
                  setCopiedQrLink(true);
                  setTimeout(() => setCopiedQrLink(false), 2000);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedQrLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copiedQrLink ? '¡Enlace Copiado!' : 'Copiar Enlace de Autoregistro'}
              </button>
              <a
                href={thirdPartyPublicUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <ExternalLink size={14} />
                Abrir Portal en Nueva Pestaña
              </a>
            </div>
          </div>

          {/* List of Driver-Submitted Third Party Trips for Approval */}
          <div className="space-y-3">
            {state.thirdPartyTrips.map((trip) => {
              const missingCriticalReqs = !trip.esquemaCapacitacionVigente || !trip.inspeccionPreoperacionalDiaAprobada || !trip.soatVigente || !trip.rtmVigente;

              return (
                <div key={trip.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded bg-slate-900 text-white">
                          {trip.radicado}
                        </span>
                        <span className="text-[11px] font-black px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
                          {trip.tipoDesplazamientoMasivo} ({trip.numeroPasajeros} pasajeros)
                        </span>
                        <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                          trip.estadoAprobacion === 'Aprobado para Despacho'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : trip.estadoAprobacion === 'Rechazado / Bloqueado'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          {trip.estadoAprobacion}
                        </span>
                      </div>
                      <h5 className="text-sm font-black text-slate-900 mt-1">
                        Ruta Articulada: {trip.rutogramaNombre}
                      </h5>
                      <p className="text-xs text-slate-600">
                        Empresa Contratada: <strong>{trip.empresaTransporteTercero}</strong> (NIT: {trip.nitEmpresaTercero}) • Fecha Salida: <strong>{trip.fechaViajeProgramado} ({trip.horaSalida})</strong>
                      </p>
                    </div>

                    {/* Approval Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={missingCriticalReqs}
                        onClick={() => {
                          const next = state.thirdPartyTrips.map(t =>
                            t.id === trip.id
                              ? { ...t, estadoAprobacion: 'Aprobado para Despacho' as const, observacionesRevision: 'Aprobado por Coordinación PESV tras validar Rutograma, FUEC, capacitación y preoperacional.' }
                              : t
                          );
                          persistStep15State({ ...state, thirdPartyTrips: next }, `Viaje masivo ${trip.radicado} APROBADO para despacho.`);
                        }}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 transition-all ${
                          missingCriticalReqs
                            ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs'
                        }`}
                        title={missingCriticalReqs ? 'No se puede aprobar: falta capacitación vigente o preoperacional del día' : 'Aprobar viaje con tercero'}
                      >
                        <CheckCircle2 size={14} />
                        Aprobar Desplazamiento
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const next = state.thirdPartyTrips.map(t =>
                            t.id === trip.id
                              ? { ...t, estadoAprobacion: 'Rechazado / Bloqueado' as const, observacionesRevision: 'Rechazado / Bloqueado por incumplimiento de requisitos previos de seguridad vial.' }
                              : t
                          );
                          persistStep15State({ ...state, thirdPartyTrips: next }, `Solicitud ${trip.radicado} marcada como Rechazada / Bloqueada.`);
                        }}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Rechazar / Bloquear
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const next = state.thirdPartyTrips.filter(t => t.id !== trip.id);
                          persistStep15State({ ...state, thirdPartyTrips: next }, 'Registro eliminado.');
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Driver & Document Verification Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Conductor Registrado</span>
                      <strong className="text-slate-900">{trip.conductorNombre}</strong>
                      <span className="block text-[10px] text-slate-500">CC: {trip.conductorCedula} • Tel: {trip.conductorTelefono}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Vehículo y FUEC</span>
                      <strong className="text-slate-900">{trip.vehiculoPlaca} ({trip.vehiculoClase})</strong>
                      <span className="block text-[10px] text-slate-500">FUEC: {trip.fuecNumero}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Esquema Capacitación</span>
                      <span className={`font-black ${trip.esquemaCapacitacionVigente ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {trip.esquemaCapacitacionVigente ? '✔ VIGENTE' : '✖ VENCIDO / PENDIENTE'}
                      </span>
                      <span className="block text-[10px] text-slate-500">Licencia: {trip.licenciaCategoria}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Preoperacional Mismo Día</span>
                      <span className={`font-black ${trip.inspeccionPreoperacionalDiaAprobada ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {trip.inspeccionPreoperacionalDiaAprobada ? '✔ APROBADA HOY' : '✖ NO APROBADA'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Pólizas / SOAT / RTM</span>
                      <span className="font-bold text-slate-800">
                        SOAT: {trip.soatVigente ? '✔' : '✖'} | RTM: {trip.rtmVigente ? '✔' : '✖'} | Pólizas: {trip.polizasRccRceVigentes ? '✔' : '✖'}
                      </span>
                      {trip.soporteDocumentalNombre && trip.soporteDocumentalDataUrl && (
                        <a
                          href={trip.soporteDocumentalDataUrl}
                          download={trip.soporteDocumentalNombre}
                          className="text-[10px] text-blue-600 font-bold hover:underline block mt-0.5"
                        >
                          📎 Descargar Soporte Adjunto
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Create / Edit Digital Rutograma */}
      {editingRutograma && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h4 className="text-base font-black text-slate-900">
                {isNewRutograma ? 'Diseñar Nuevo Rutograma Digital (Sincronizado con Paso 5)' : `Editar Rutograma ${editingRutograma.codigoRutograma}`}
              </h4>
              <button onClick={() => setEditingRutograma(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Corredor Vial / Ruta *</label>
                <input
                  type="text"
                  value={editingRutograma.nombreCorredor}
                  onChange={e => setEditingRutograma({ ...editingRutograma, nombreCorredor: e.target.value })}
                  placeholder="Ej. Corredor Logístico Centro - Costa"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Distancia Total (km)</label>
                <input
                  type="number"
                  value={editingRutograma.distanciaKm}
                  onChange={e => setEditingRutograma({ ...editingRutograma, distanciaKm: parseInt(e.target.value) || 10 })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Origen *</label>
                <input
                  type="text"
                  value={editingRutograma.origen}
                  onChange={e => setEditingRutograma({ ...editingRutograma, origen: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Destino *</label>
                <input
                  type="text"
                  value={editingRutograma.destino}
                  onChange={e => setEditingRutograma({ ...editingRutograma, destino: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tiempo Estimado (Horas / Min)</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="number"
                    placeholder="Horas"
                    value={editingRutograma.tiempoEstimadoHoras}
                    onChange={e => setEditingRutograma({ ...editingRutograma, tiempoEstimadoHoras: parseInt(e.target.value) || 0 })}
                    className="px-2 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Min"
                    value={editingRutograma.tiempoEstimadoMinutos}
                    onChange={e => setEditingRutograma({ ...editingRutograma, tiempoEstimadoMinutos: parseInt(e.target.value) || 0 })}
                    className="px-2 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Speed Limits */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <p className="text-xs font-black text-slate-800 mb-2">Límites de Velocidad Segura por Tramo (km/h)</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block">Carretera Nal.</label>
                  <input
                    type="number"
                    value={editingRutograma.velMaxCarreteraKmH}
                    onChange={e => setEditingRutograma({ ...editingRutograma, velMaxCarreteraKmH: parseInt(e.target.value) || 80 })}
                    className="w-full px-2.5 py-1.5 border rounded font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block">Tramo Urbano</label>
                  <input
                    type="number"
                    value={editingRutograma.velMaxUrbanaKmH}
                    onChange={e => setEditingRutograma({ ...editingRutograma, velMaxUrbanaKmH: parseInt(e.target.value) || 50 })}
                    className="w-full px-2.5 py-1.5 border rounded font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block">Zonas Escolares</label>
                  <input
                    type="number"
                    value={editingRutograma.velMaxZonaEspecialKmH}
                    onChange={e => setEditingRutograma({ ...editingRutograma, velMaxZonaEspecialKmH: parseInt(e.target.value) || 30 })}
                    className="w-full px-2.5 py-1.5 border rounded font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block">Patios / Maniobra</label>
                  <input
                    type="number"
                    value={editingRutograma.velMaxPatioKmH}
                    onChange={e => setEditingRutograma({ ...editingRutograma, velMaxPatioKmH: parseInt(e.target.value) || 10 })}
                    className="w-full px-2.5 py-1.5 border rounded font-bold bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Mandatory Rest Stops Editor */}
            <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-amber-950">Puntos de Parada Obligatoria (Descanso y Pausas Activas)</p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingRutograma({
                      ...editingRutograma,
                      paradasObligatorias: [
                        ...editingRutograma.paradasObligatorias,
                        {
                          id: `STOP-${Date.now()}`,
                          puntoParada: 'Nueva Bahía / Estación Segura',
                          kilometroReferencia: 'Km 100',
                          tiempoConduccionPrevioHoras: 2,
                          duracionDescansoMinutos: 15,
                          actividadPausaActiva: 'Pausa activa e inspección ocular.'
                        }
                      ]
                    });
                  }}
                  className="px-2.5 py-1 bg-amber-500 text-slate-950 font-black rounded text-[11px] cursor-pointer"
                >
                  + Añadir Parada
                </button>
              </div>
              {editingRutograma.paradasObligatorias.map((stop, idx) => (
                <div key={stop.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-white p-2 rounded-lg border border-amber-200 text-xs">
                  <input
                    type="text"
                    value={stop.puntoParada}
                    onChange={e => {
                      const next = editingRutograma.paradasObligatorias.map((s, i) => (i === idx ? { ...s, puntoParada: e.target.value } : s));
                      setEditingRutograma({ ...editingRutograma, paradasObligatorias: next });
                    }}
                    placeholder="Lugar de parada"
                    className="sm:col-span-5 px-2 py-1 border rounded"
                  />
                  <input
                    type="text"
                    value={stop.kilometroReferencia}
                    onChange={e => {
                      const next = editingRutograma.paradasObligatorias.map((s, i) => (i === idx ? { ...s, kilometroReferencia: e.target.value } : s));
                      setEditingRutograma({ ...editingRutograma, paradasObligatorias: next });
                    }}
                    placeholder="Km"
                    className="sm:col-span-2 px-2 py-1 border rounded"
                  />
                  <input
                    type="number"
                    value={stop.duracionDescansoMinutos}
                    onChange={e => {
                      const next = editingRutograma.paradasObligatorias.map((s, i) => (i === idx ? { ...s, duracionDescansoMinutos: parseInt(e.target.value) || 15 } : s));
                      setEditingRutograma({ ...editingRutograma, paradasObligatorias: next });
                    }}
                    placeholder="Minutos"
                    className="sm:col-span-2 px-2 py-1 border rounded"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = editingRutograma.paradasObligatorias.filter((_, i) => i !== idx);
                      setEditingRutograma({ ...editingRutograma, paradasObligatorias: next });
                    }}
                    className="sm:col-span-3 text-rose-600 font-bold text-[11px] cursor-pointer"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Puntos Críticos del Corredor y Controles</label>
              <textarea
                rows={2}
                value={editingRutograma.puntosCriticosCorredor}
                onChange={e => setEditingRutograma({ ...editingRutograma, puntosCriticosCorredor: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingRutograma(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!editingRutograma.nombreCorredor.trim()) return;
                  const next = isNewRutograma
                    ? [...state.rutogramas, editingRutograma]
                    : state.rutogramas.map(r => (r.id === editingRutograma.id ? editingRutograma : r));
                  persistStep15State({ ...state, rutogramas: next }, 'Rutograma digital guardado y sincronizado con Paso 5.');
                  if (isNewRutograma && onSyncRouteToPaso5) {
                    onSyncRouteToPaso5({
                      id: Date.now(),
                      nombre: editingRutograma.nombreCorredor,
                      origen: editingRutograma.origen,
                      destino: editingRutograma.destino,
                      distancia: editingRutograma.distanciaKm,
                      frecuencia: editingRutograma.frecuenciaPaso5,
                      viaPrincipal: editingRutograma.viaPrincipal
                    });
                  }
                  setSelectedRutogramaId(editingRutograma.id);
                  setEditingRutograma(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black cursor-pointer"
              >
                Guardar Rutograma Digital
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create / Edit Pre-Trip Dispatch Order */}
      {editingDispatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-3.5 my-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h4 className="text-base font-black text-slate-900">
                Validación de Requisitos Previos al Viaje ({editingDispatch.codigoDespacho})
              </h4>
              <button onClick={() => setEditingDispatch(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Rutograma Asignado *</label>
                <select
                  value={editingDispatch.rutogramaId}
                  onChange={e => setEditingDispatch({ ...editingDispatch, rutogramaId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-bold"
                >
                  {state.rutogramas.map(r => (
                    <option key={r.id} value={r.id}>{r.codigoRutograma} - {r.nombreCorredor}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Conductor *</label>
                <input
                  type="text"
                  value={editingDispatch.conductorNombre}
                  onChange={e => setEditingDispatch({ ...editingDispatch, conductorNombre: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cédula del Conductor</label>
                <input
                  type="text"
                  value={editingDispatch.conductorCedula}
                  onChange={e => setEditingDispatch({ ...editingDispatch, conductorCedula: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Placa del Vehículo *</label>
                <input
                  type="text"
                  value={editingDispatch.vehiculoPlaca}
                  onChange={e => setEditingDispatch({ ...editingDispatch, vehiculoPlaca: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg uppercase font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fecha del Despacho</label>
                <input
                  type="date"
                  value={editingDispatch.fechaViaje}
                  onChange={e => setEditingDispatch({ ...editingDispatch, fechaViaje: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Estado Esquema de Capacitación</label>
                <select
                  value={editingDispatch.esquemaCapacitacionEstado}
                  onChange={e => setEditingDispatch({ ...editingDispatch, esquemaCapacitacionEstado: e.target.value as 'Vigente' | 'Vencido' })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-bold"
                >
                  <option value="Vigente">Vigente (Habilitado)</option>
                  <option value="Vencido">Vencido (Activa Bloqueo de Despacho)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Inspección Preoperacional del Mismo Día</label>
                <select
                  value={editingDispatch.inspeccionPreoperacionalHoy ? 'SI' : 'NO'}
                  onChange={e => {
                    const yes = e.target.value === 'SI';
                    setEditingDispatch({
                      ...editingDispatch,
                      inspeccionPreoperacionalHoy: yes,
                      fechaInspeccionPreoperacional: yes ? editingDispatch.fechaViaje : 'Sin-Preoperacional'
                    });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-bold"
                >
                  <option value="SI">Aprobada Hoy ({editingDispatch.fechaViaje})</option>
                  <option value="NO">No Aprobada Hoy (Activa Bloqueo)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingDispatch(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!editingDispatch.conductorNombre.trim() || !editingDispatch.vehiculoPlaca.trim()) return;
                  const lockCheck = evaluateDispatchSecurityLock({
                    esquemaCapacitacionEstado: editingDispatch.esquemaCapacitacionEstado,
                    inspeccionPreoperacionalHoy: editingDispatch.inspeccionPreoperacionalHoy,
                    fechaInspeccionPreoperacional: editingDispatch.fechaInspeccionPreoperacional,
                    fechaViaje: editingDispatch.fechaViaje
                  });
                  const finalized: PreTripDispatchOrder = {
                    ...editingDispatch,
                    estadoAutorizacion: lockCheck.blocked ? 'Bloqueado por Seguridad' : 'Autorizado',
                    motivoBloqueo: lockCheck.reasons.join(' ')
                  };
                  const next = isNewDispatch
                    ? [finalized, ...state.dispatches]
                    : state.dispatches.map(d => (d.id === finalized.id ? finalized : d));
                  persistStep15State(
                    { ...state, dispatches: next },
                    lockCheck.blocked
                      ? 'Alerta: Despacho registrado con BLOQUEO DE SEGURIDAD activo.'
                      : 'Despacho validado y autorizado correctamente.'
                  );
                  setEditingDispatch(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black cursor-pointer"
              >
                Validar y Guardar Despacho
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Driver Self-Registration for Third Party Trips */}
      {showPublicModal && (
        <Step15PublicTripRegistrationModal
          companyName={companyName}
          companyNit={companyNit}
          companyLogo={companyLogo}
          isStandalonePage={false}
          onClose={() => setShowPublicModal(false)}
        />
      )}
    </div>
  );
}
