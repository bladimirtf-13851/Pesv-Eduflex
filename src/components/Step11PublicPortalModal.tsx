import React, { useState, useEffect } from 'react';
import { 
  Shield, AlertTriangle, CheckCircle2, Truck, User, MapPin, 
  Calendar, FileText, Send, X, Award, PenTool, ArrowLeft 
} from 'lucide-react';
import { getSystemSetting, saveSystemSetting } from '../services/firestoreService';

export interface Step11PublicPortalProps {
  mode: 'reporte' | 'evaluaciones';
  companyName: string;
  companyNit: string;
  companyLogo?: string;
  initialDriverId?: string;
  initialDriverName?: string;
  evaluationsList?: any[];
  onUpdateEvaluations?: (updated: any[]) => void;
  onClose?: () => void;
  isStandalonePage?: boolean;
}

const DEFAULT_EVALUATIONS = [
  {
    id: 'eval-1',
    colaboradorId: 1,
    nombre: 'Juan Carlos Montoya Velásquez',
    cedula: 'CC 71.382.441',
    cargo: 'Conductor de Carga Pesada',
    periodoEvaluado: 'Primer Semestre 2026',
    fechaEvaluacion: '2026-06-15',
    observacionesGenerales: 'Conductor demuestra un alto nivel de compromiso con la seguridad vial. Se evidencia cumplimiento de las inspecciones preoperacionales de forma rigurosa.',
    infracciones: [
      {
        id: 'inf-1',
        fecha: '2026-03-10',
        codigoInfraccion: 'C29 (Exceso de velocidad)',
        comparendoNo: '11001000000012345',
        descripcion: 'Exceso de velocidad registrado por fotodetector en la Autopista Norte con Calle 170 Bogotá. Velocidad registrada: 58 km/h en zona de 50 km/h.',
        estado: 'Pagada',
        puntosAfectados: 4
      }
    ],
    quejas: [
      {
        id: 'q-1',
        fecha: '2026-04-22',
        origen: 'Ciudadano (Canal Cómo Conduzco)',
        descripcion: 'Reporte ciudadano indicando que el camión de placa JKS-284 hizo un cambio brusco de carril sin activar las luces direccionales en la salida de Medellín.',
        nivelRiesgo: 'Medio',
        accionTomada: 'Llamado de atención y retroalimentación individual sobre uso obligatorio de direccionales. Suscripción de compromiso de mejora.'
      }
    ],
    compromisoFirmado: true,
    firmaEvaluador: 'Liliana Patricia Gómez (Líder PESV)',
    firmaEvaluadorImg: null,
    firmaConductor: 'Juan Carlos Montoya',
    firmaConductorImg: null,
    fechaFirma: '2026-06-15'
  },
  {
    id: 'eval-2',
    colaboradorId: 3,
    nombre: 'Carlos Julio Restrepo Bedoya',
    cedula: 'CC 19.452.883',
    cargo: 'Conductor Reparto Urbano',
    periodoEvaluado: 'Primer Semestre 2026',
    fechaEvaluacion: '2026-06-20',
    observacionesGenerales: 'Conductor con excelente récord. Cero infracciones y cero reportes en el período evaluado.',
    infracciones: [],
    quejas: [],
    compromisoFirmado: true,
    firmaEvaluador: 'Liliana Patricia Gómez (Líder PESV)',
    firmaEvaluadorImg: null,
    firmaConductor: 'Carlos Julio Restrepo',
    firmaConductorImg: null,
    fechaFirma: '2026-06-20'
  }
];

export default function Step11PublicPortalModal({
  mode: initialMode,
  companyName,
  companyNit,
  companyLogo = '',
  initialDriverId,
  initialDriverName,
  evaluationsList,
  onUpdateEvaluations,
  onClose,
  isStandalonePage = false
}: Step11PublicPortalProps) {
  const [activeMode, setActiveMode] = useState<'reporte' | 'evaluaciones'>(initialMode);
  const [localEvaluations, setLocalEvaluations] = useState<any[]>(() => {
    if (evaluationsList && evaluationsList.length > 0) return evaluationsList;
    const saved = localStorage.getItem('pesv_evaluaciones_comportamiento');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_EVALUATIONS;
  });

  useEffect(() => {
    if (evaluationsList && evaluationsList.length > 0) {
      setLocalEvaluations(evaluationsList);
    } else {
      getSystemSetting('paso11_evaluaciones_comportamiento').then((cloudData) => {
        if (Array.isArray(cloudData) && cloudData.length > 0) {
          setLocalEvaluations(cloudData);
          localStorage.setItem('pesv_evaluaciones_comportamiento', JSON.stringify(cloudData));
        }
      }).catch(() => {});
    }
  }, [evaluationsList]);

  // Selected driver for report or digital evaluation
  const [selectedDriverId, setSelectedDriverId] = useState<string>(() => {
    if (initialDriverId) return initialDriverId;
    if (initialDriverName) {
      const found = localEvaluations.find(
        (e) => e.nombre.toLowerCase() === initialDriverName.toLowerCase()
      );
      if (found) return found.id;
    }
    return localEvaluations[0]?.id || 'eval-1';
  });

  // Form states for "¿Cómo Conduzco?" Report
  const [placaVehiculo, setPlacaVehiculo] = useState<string>('JKS-284');
  const [lugarEvento, setLugarEvento] = useState<string>('');
  const [fechaReporte, setFechaReporte] = useState<string>(new Date().toISOString().split('T')[0]);
  const [origenReporte, setOrigenReporte] = useState<string>('Ciudadano (Canal Cómo Conduzco)');
  const [tipoConducta, setTipoConducta] = useState<string>('Maniobra riesgosa o cambio brusco de carril');
  const [nivelRiesgo, setNivelRiesgo] = useState<'Bajo' | 'Medio' | 'Alto'>('Medio');
  const [descripcionReporte, setDescripcionReporte] = useState<string>('');
  const [nombreReportante, setNombreReportante] = useState<string>('');
  const [submittedRadicado, setSubmittedRadicado] = useState<string | null>(null);

  // States for Digital Evaluation signature
  const currentDriverEval = localEvaluations.find((e) => e.id === selectedDriverId) || localEvaluations[0];
  const [driverSignatureInput, setDriverSignatureInput] = useState<string>(currentDriverEval?.firmaConductor || currentDriverEval?.nombre || '');
  const [driverComment, setDriverComment] = useState<string>(currentDriverEval?.observacionesGenerales || '');
  const [commitmentChecked, setCommitmentChecked] = useState<boolean>(Boolean(currentDriverEval?.compromisoFirmado));
  const [savedEvalConfirmation, setSavedEvalConfirmation] = useState<boolean>(false);

  useEffect(() => {
    if (currentDriverEval) {
      setDriverSignatureInput(currentDriverEval.firmaConductor || currentDriverEval.nombre || '');
      setDriverComment(currentDriverEval.observacionesGenerales || '');
      setCommitmentChecked(Boolean(currentDriverEval.compromisoFirmado));
    }
  }, [selectedDriverId, currentDriverEval]);

  const persistUpdatedEvaluations = (updatedList: any[]) => {
    setLocalEvaluations(updatedList);
    localStorage.setItem('pesv_evaluaciones_comportamiento', JSON.stringify(updatedList));
    saveSystemSetting('paso11_evaluaciones_comportamiento', updatedList).catch((err) =>
      console.error('Error syncing Step 11 to Firestore:', err)
    );
    if (onUpdateEvaluations) {
      onUpdateEvaluations(updatedList);
    }
    window.dispatchEvent(new CustomEvent('pesv_step11_updated', { detail: updatedList }));
  };

  const handleSubmitCitizenReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcionReporte.trim()) return;

    const fullDescription = `[Vehículo Placa: ${placaVehiculo.toUpperCase() || 'S/P'} | Conducta: ${tipoConducta}${lugarEvento ? ` | Lugar: ${lugarEvento}` : ''}${nombreReportante ? ` | Reportante: ${nombreReportante}` : ''}] ${descripcionReporte.trim()}`;

    const newComplaintObj = {
      id: 'q-qr-' + Date.now(),
      fecha: fechaReporte,
      origen: origenReporte,
      descripcion: fullDescription,
      nivelRiesgo,
      accionTomada: 'Reporte recibido vía Canal QR ¿Cómo Conduzco?. En verificación por el Comité de Seguridad Vial.'
    };

    const updated = localEvaluations.map((ev) => {
      if (ev.id === selectedDriverId) {
        return {
          ...ev,
          quejas: [newComplaintObj, ...(ev.quejas || [])]
        };
      }
      return ev;
    });

    persistUpdatedEvaluations(updated);
    const radicado = `RAD-PESV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setSubmittedRadicado(radicado);
  };

  const handleSaveDigitalEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDriverEval) return;

    const today = new Date().toISOString().split('T')[0];
    const updated = localEvaluations.map((ev) => {
      if (ev.id === currentDriverEval.id) {
        return {
          ...ev,
          observacionesGenerales: driverComment,
          compromisoFirmado: commitmentChecked,
          firmaConductor: driverSignatureInput.trim() || ev.nombre,
          fechaFirma: today
        };
      }
      return ev;
    });

    persistUpdatedEvaluations(updated);
    setSavedEvalConfirmation(true);
    setTimeout(() => setSavedEvalConfirmation(false), 3500);
  };

  const isImageLogo = Boolean(companyLogo && (companyLogo.startsWith('data:image/') || companyLogo.startsWith('http')));

  const content = (
    <div className={`bg-white ${isStandalonePage ? 'min-h-screen' : 'rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-200'}`}>
      {/* Header Institucional */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isImageLogo ? (
              <img src={companyLogo} alt={companyName} className="h-11 w-11 object-contain bg-white rounded-xl p-1 shrink-0" />
            ) : (
              <div className="p-2.5 bg-sky-500/20 border border-sky-400/30 rounded-xl text-sky-300 shrink-0">
                <Shield size={24} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded border border-sky-400/30">
                  Canal Digital PESV • Paso 11
                </span>
                <span className="text-[10px] font-mono text-slate-300">NIT: {companyNit}</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">{companyName}</h2>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Selector de Modo en el Portal */}
        <div className="max-w-3xl mx-auto mt-4 flex bg-slate-800/90 p-1 rounded-xl border border-slate-700">
          <button
            type="button"
            onClick={() => {
              setActiveMode('reporte');
              setSubmittedRadicado(null);
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMode === 'reporte'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Truck size={14} />
            <span>Canal ¿Cómo Conduzco? (Reporte en Vía)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('evaluaciones')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMode === 'evaluaciones'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Award size={14} />
            <span>Evaluación Digital del Conductor</span>
          </button>
        </div>
      </div>

      {/* Cuerpo del Portal */}
      <div className="p-6 max-w-3xl mx-auto space-y-5 text-xs">
        {activeMode === 'reporte' ? (
          submittedRadicado ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-4">
              <CheckCircle2 size={44} className="text-emerald-600 mx-auto" />
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Reporte Sincronizado con el PESV
                </span>
                <h3 className="text-base font-black text-gray-900">
                  ¡Reporte de Comportamiento Vial Registrado!
                </h3>
                <p className="text-xs text-gray-600 max-w-md mx-auto">
                  La novedad ha sido incorporada automáticamente en la hoja de comportamiento del conductor en el <strong>Paso 11</strong> para revisión del Comité de Seguridad Vial.
                </p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-emerald-200 max-w-xs mx-auto font-mono text-xs font-bold text-emerald-900">
                Consecutivo: {submittedRadicado}
              </div>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedRadicado(null);
                    setDescripcionReporte('');
                  }}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Enviar Otro Reporte
                </button>
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Volver al Paso 11
                  </button>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitCitizenReport} className="space-y-4">
              <div className="bg-sky-50 border border-sky-100 p-3.5 rounded-xl text-sky-900 leading-relaxed">
                <strong className="font-black block text-sky-950 mb-0.5">
                  Formulario Oficial de Reporte Vial «¿Cómo Conduzco?» (Resolución 40595)
                </strong>
                Reporte cualquier conducta insegura, incidente en vía o reconocimiento sobre los vehículos y conductores de <strong>{companyName}</strong>.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">
                    Conductor Asociado <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-bold text-gray-800"
                  >
                    {localEvaluations.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.nombre} ({ev.cargo})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">
                    Placa del Vehículo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={placaVehiculo}
                    onChange={(e) => setPlacaVehiculo(e.target.value.toUpperCase())}
                    placeholder="Ej: JKS-284"
                    className="w-full p-2.5 border border-gray-300 rounded-xl font-mono font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Origen del Reporte</label>
                  <select
                    value={origenReporte}
                    onChange={(e) => setOrigenReporte(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl bg-white"
                  >
                    <option value="Ciudadano (Canal Cómo Conduzco)">Ciudadano (Canal Cómo Conduzco)</option>
                    <option value="Supervisor Vial / Control de Tráfico">Supervisor Vial / Control de Tráfico</option>
                    <option value="Cliente / Generador de Carga">Cliente / Generador de Carga</option>
                    <option value="Compañero / Reporte Interno SST">Compañero / Reporte Interno SST</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Nivel de Riesgo Observado</label>
                  <select
                    value={nivelRiesgo}
                    onChange={(e) => setNivelRiesgo(e.target.value as any)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-bold"
                  >
                    <option value="Bajo">🟢 Bajo (Observación Preventiva)</option>
                    <option value="Medio">🟡 Medio (Conducta Imprudente)</option>
                    <option value="Alto">🔴 Alto (Maniobra Peligrosa / Exceso Velocidad)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Conducta Observada en la Vía</label>
                  <select
                    value={tipoConducta}
                    onChange={(e) => setTipoConducta(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl bg-white"
                  >
                    <option value="Exceso de velocidad en corredor vial">Exceso de velocidad en corredor vial</option>
                    <option value="Maniobra riesgosa o cambio brusco de carril">Maniobra riesgosa o cambio brusco de carril</option>
                    <option value="Uso de teléfono celular mientras conduce">Uso de teléfono celular mientras conduce</option>
                    <option value="No respeto de paso peatonal o semáforo">No respeto de paso peatonal o semáforo</option>
                    <option value="Frenado brusco o no conservar distancia">Frenado brusco o no conservar distancia</option>
                    <option value="Estacionamiento inadecuado en vía pública">Estacionamiento inadecuado en vía pública</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Fecha del Suceso</label>
                  <input
                    type="date"
                    value={fechaReporte}
                    onChange={(e) => setFechaReporte(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Ubicación / Vía / Ciudad</label>
                  <input
                    type="text"
                    value={lugarEvento}
                    onChange={(e) => setLugarEvento(e.target.value)}
                    placeholder="Ej: Autopista Norte Km 18 / Salida Medellín"
                    className="w-full p-2.5 border border-gray-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Nombre o Teléfono de Contacto (Opcional)</label>
                  <input
                    type="text"
                    value={nombreReportante}
                    onChange={(e) => setNombreReportante(e.target.value)}
                    placeholder="Anónimo o nombre del ciudadano"
                    className="w-full p-2.5 border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">
                  Descripción Detallada de los Hechos <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={descripcionReporte}
                  onChange={(e) => setDescripcionReporte(e.target.value)}
                  placeholder="Describa el comportamiento observado en la vía, hora aproximada y circunstancias..."
                  className="w-full p-3 border border-gray-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-black rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Send size={14} />
                  <span>Registrar Reporte en el PESV</span>
                </button>
              </div>
            </form>
          )
        ) : (
          /* MODO 2: EVALUACIÓN DIGITAL DEL CONDUCTOR Y FIRMA DE COMPROMISO */
          <form onSubmit={handleSaveDigitalEvaluation} className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-teal-50 border border-teal-200 p-3.5 rounded-xl">
              <div>
                <span className="text-[10px] font-black uppercase text-teal-800 block">
                  Consulta y Firma Digital del Conductor
                </span>
                <p className="text-[11px] text-teal-900">
                  Seleccione el conductor para verificar su historial semestral y firmar el compromiso vial.
                </p>
              </div>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="p-2 border border-teal-300 rounded-lg bg-white font-bold text-gray-800 text-xs"
              >
                {localEvaluations.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.nombre} — {ev.cedula}
                  </option>
                ))}
              </select>
            </div>

            {currentDriverEval && (
              <div className="space-y-4 border border-gray-200 rounded-2xl p-4 bg-slate-50/50">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{currentDriverEval.nombre}</h3>
                    <span className="text-[11px] text-gray-600">
                      {currentDriverEval.cargo} • {currentDriverEval.cedula}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 block">Periodo Evaluado:</span>
                    <strong className="text-xs text-slate-800">{currentDriverEval.periodoEvaluado}</strong>
                  </div>
                </div>

                {/* Resumen de Infracciones y Quejas */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-gray-200">
                    <span className="text-[10px] font-bold text-red-600 uppercase block">
                      Infracciones de Tránsito
                    </span>
                    <strong className="text-lg font-black text-slate-900">
                      {currentDriverEval.infracciones?.length || 0}
                    </strong>
                    {currentDriverEval.infracciones?.map((inf: any) => (
                      <div key={inf.id} className="text-[10px] text-gray-600 mt-1 border-t border-gray-100 pt-1">
                        <strong>{inf.codigoInfraccion}:</strong> {inf.descripcion}
                      </div>
                    ))}
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-gray-200">
                    <span className="text-[10px] font-bold text-amber-600 uppercase block">
                      Reportes ¿Cómo Conduzco?
                    </span>
                    <strong className="text-lg font-black text-slate-900">
                      {currentDriverEval.quejas?.length || 0}
                    </strong>
                    {currentDriverEval.quejas?.map((q: any) => (
                      <div key={q.id} className="text-[10px] text-gray-600 mt-1 border-t border-gray-100 pt-1 line-clamp-2">
                        <strong>{q.fecha}:</strong> {q.descripcion}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">
                    Observaciones y Compromisos de Desempeño Vial
                  </label>
                  <textarea
                    rows={2}
                    value={driverComment}
                    onChange={(e) => setDriverComment(e.target.value)}
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-gray-200">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">
                      Firma Digital del Conductor (Nombre Completo)
                    </label>
                    <input
                      type="text"
                      value={driverSignatureInput}
                      onChange={(e) => setDriverSignatureInput(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg font-serif italic text-slate-900"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={commitmentChecked}
                        onChange={(e) => setCommitmentChecked(e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-teal-600 rounded"
                      />
                      <span className="text-[10.5px] text-gray-700 leading-snug">
                        <strong>Suscripción de Compromiso Vial:</strong> Declaro haber revisado mi evaluación de comportamiento y me comprometo a cumplir las normas del PESV.
                      </span>
                    </label>
                  </div>
                </div>

                {savedEvalConfirmation && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>¡Evaluación y firma de compromiso actualizadas en el Paso 11!</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  {onClose && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl cursor-pointer"
                    >
                      Cerrar
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <PenTool size={14} />
                    <span>Guardar Firma y Evaluación</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );

  if (isStandalonePage) {
    return <div className="min-h-screen bg-slate-100 py-6 px-4">{content}</div>;
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      {content}
    </div>
  );
}
