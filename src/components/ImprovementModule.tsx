/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Incident, PhvaAction } from '../types';
import { SEED_INCIDENTS, SEED_DRIVERS, SEED_VEHICLES } from '../data';
import { ShieldCheck, Plus, FileSpreadsheet, Trash2, Calendar, ClipboardCheck, Sparkles, RefreshCw, Eye, MessageSquare, ShieldAlert } from 'lucide-react';

export default function ImprovementModule() {
  const [incidents, setIncidents] = useState<Incident[]>(SEED_INCIDENTS);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(SEED_INCIDENTS[0]);

  // Form State
  const [driverId, setDriverId] = useState<string>(SEED_DRIVERS[0]?.id || '');
  const [vehiclePlate, setVehiclePlate] = useState<string>(SEED_VEHICLES[0]?.plate || '');
  const [type, setType] = useState<'Choque Simple' | 'Atropello' | 'Volcamiento' | 'Colisión Grave'>('Choque Simple');
  const [description, setDescription] = useState<string>('');
  const [severity, setSeverity] = useState<'Baja' | 'Media' | 'Alta'>('Baja');
  const [place, setPlace] = useState<string>('');
  
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Triggering the automated smart PHVA action plan generation based on incident parameters!
  const generatePhvaPlan = (incType: string, incSeverity: string, drName: string): PhvaAction[] => {
    const today = new Date().toISOString().substring(0, 10);
    
    // Core PHVA generator algorithm
    return [
      {
        id: `P-${Date.now()}-1`,
        phase: 'Planear',
        action: `Conformar equipo investigador del siniestro vial. Recolectar evidencias de campo (croquis, fotos, telemetría de frenado y bitácoras del conductor ${drName}).`,
        responsible: 'Líder de Seguridad Vial (SST)',
        deadline: '2026-06-27',
        status: 'Completado'
      },
      {
        id: `H-${Date.now()}-2`,
        phase: 'Hacer',
        action: incType === 'Choque Simple' 
          ? `Aplicar re-entrenamiento práctico presencial al conductor ${drName} enfocado en distancias de frenado y control de puntos ciegos.`
          : `Efectuar examen psicosensométrico de control obligatorio para el conductor ${drName} y revisión técnica estructural a la dirección y frenos del vehículo.`,
        responsible: 'Proveedor Académico / Taller Mecánico',
        deadline: '2026-07-05',
        status: 'Pendiente'
      },
      {
        id: `V-${Date.now()}-3`,
        phase: 'Verificar',
        action: `Auditar las planillas de mantenimiento del vehículo y revisar las cámaras frontales e internas para validar hábitos seguros del conductor durante la ruta asignada.`,
        responsible: 'Auxiliar de Tráfico',
        deadline: '2026-07-15',
        status: 'Pendiente'
      },
      {
        id: `A-${Date.now()}-4`,
        phase: 'Actuar',
        action: `Divulgar la Lección Aprendida "Lección Siniestro-${incType}" a todo el personal operativo en las charlas de seguridad vial de 5 minutos y actualizar la matriz de riesgos PESV.`,
        responsible: 'Líder PESV (SST)',
        deadline: '2026-07-20',
        status: 'Pendiente'
      }
    ];
  };

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !place) {
      alert('Por favor complete la descripción y el lugar del siniestro.');
      return;
    }

    setIsGenerating(true);

    const driverObj = SEED_DRIVERS.find(d => d.id === driverId);
    const driverName = driverObj ? driverObj.name : 'Conductor Desconocido';

    setTimeout(() => {
      const phvaPlan = generatePhvaPlan(type, severity, driverName);
      const newIncident: Incident = {
        id: `INC-2026-00${incidents.length + 1}`,
        date: '2026-06-25',
        driverId,
        driverName,
        vehiclePlate,
        type,
        description,
        severity,
        place,
        phvaPlan,
        status: 'Abierto'
      };

      const updatedIncidents = [newIncident, ...incidents];
      setIncidents(updatedIncidents);
      setSelectedIncident(newIncident);
      
      // Reset form
      setDescription('');
      setPlace('');
      setIsGenerating(false);
      
      alert(`Siniestro reportado con éxito. Se activó automáticamente el Ciclo de Mejora Continua PHVA con 4 acciones obligatorias para la mitigación y no repetición.`);
    }, 800);
  };

  const handleUpdateActionStatus = (actionId: string, newStatus: 'Pendiente' | 'En Ejecución' | 'Completado') => {
    if (!selectedIncident) return;

    const updatedIncidents = incidents.map(inc => {
      if (inc.id === selectedIncident.id) {
        const updatedPhva = inc.phvaPlan.map(act => {
          if (act.id === actionId) {
            return { ...act, status: newStatus };
          }
          return act;
        });
        
        // Compute overall status based on PHVA completion
        const allCompleted = updatedPhva.every(a => a.status === 'Completado');
        const anyInExec = updatedPhva.some(a => a.status === 'En Ejecución' || a.status === 'Completado');
        let generalStatus: 'Abierto' | 'En Proceso de Cierre' | 'Cerrado' = 'Abierto';
        if (allCompleted) generalStatus = 'Cerrado';
        else if (anyInExec) generalStatus = 'En Proceso de Cierre';

        return {
          ...inc,
          phvaPlan: updatedPhva,
          status: generalStatus
        };
      }
      return inc;
    });

    setIncidents(updatedIncidents);
    // Update active view
    const activeI = updatedIncidents.find(i => i.id === selectedIncident.id);
    if (activeI) setSelectedIncident(activeI);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="improvement-module-root">
      
      {/* Formulario de Reporte Inteligente */}
      <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between" id="report-form-panel">
        <div>
          <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
            <ShieldAlert className="text-red-500" size={20} />
            <div>
              <h2 className="text-base font-bold text-gray-900">Reporte Inteligente de Siniestros Viales</h2>
              <p className="text-[11px] text-gray-500">Generador del ciclo de acción correctiva PHVA automático (Paso 23).</p>
            </div>
          </div>

          <form onSubmit={handleCreateIncident} className="space-y-4 text-xs" id="incident-report-form">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Conductor Implicado</label>
                <select
                  id="select-inc-driver"
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-emerald-600 font-medium"
                >
                  {SEED_DRIVERS.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Vehículo Implicado</label>
                <select
                  id="select-inc-vehicle"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-emerald-600 font-mono"
                >
                  {SEED_VEHICLES.map(v => (
                    <option key={v.plate} value={v.plate}>{v.plate} ({v.type})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Tipo de Evento</label>
                <select
                  id="select-inc-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-emerald-600 font-semibold text-gray-800"
                >
                  <option value="Choque Simple">Choque Simple</option>
                  <option value="Atropello">Atropello</option>
                  <option value="Volcamiento">Volcamiento</option>
                  <option value="Colisión Grave">Colisión Grave</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Severidad Inicial</label>
                <select
                  id="select-inc-severity"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-emerald-600 font-semibold text-gray-800"
                >
                  <option value="Baja">Baja (Solo Daños)</option>
                  <option value="Media">Media (Lesiones Leves)</option>
                  <option value="Alta">Alta (Lesiones Graves / Fatal)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Dirección / Lugar exacto del siniestro</label>
              <input
                type="text"
                id="input-inc-place"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="Ej. Autopista Norte con Calle 170, Bogotá"
                className="w-full px-2.5 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-emerald-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Descripción de Hechos</label>
              <textarea
                rows={3}
                id="textarea-inc-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe la velocidad estimada, estado de la vía, clima y maniobra realizada por los implicados..."
                className="w-full px-2.5 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-emerald-600 font-sans leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              id="btn-submit-inc"
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Sparkles size={14} className="text-emerald-400" />
              {isGenerating ? 'Estructurando PHVA Ciclo...' : 'Reportar Siniestro y Armar Plan PHVA'}
            </button>
          </form>
        </div>

        <div className="bg-emerald-50 text-[10px] text-emerald-800 p-3 rounded-lg border border-emerald-100/50 flex gap-2 mt-4">
          <Sparkles size={14} className="shrink-0 text-emerald-600 mt-0.5" />
          <span>El sistema de Mejora Continua automatizado analiza la severidad y tipo de siniestro vial para estructurar preventivamente las 4 tareas (Ciclo PHVA) conforme la Guía Metodológica Colombiana.</span>
        </div>
      </div>

      {/* Historial de Siniestros y Plan de Acción PHVA */}
      <div className="lg:col-span-7 space-y-6" id="incidents-history-panel">
        
        {/* Lista de Siniestros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5" id="incidents-list-card">
          <h3 className="text-xs uppercase font-bold text-gray-500 tracking-wider mb-3">Historial de Reportes Siniestralidad</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
            {incidents.map((inc) => {
              const isSelected = selectedIncident?.id === inc.id;
              return (
                <button
                  key={inc.id}
                  type="button"
                  id={`btn-select-incident-${inc.id}`}
                  onClick={() => setSelectedIncident(inc)}
                  className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between h-28 text-xs ${
                    isSelected ? 'border-red-600 bg-red-50/10' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="font-mono font-bold text-gray-500 text-[10px]">{inc.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      inc.status === 'Cerrado' ? 'bg-emerald-100 text-emerald-800' : inc.status === 'En Proceso de Cierre' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {inc.status}
                    </span>
                  </div>
                  
                  <div className="mt-1">
                    <div className="font-bold text-gray-950 text-[11px] line-clamp-1">{inc.type} • {inc.vehiclePlate}</div>
                    <div className="text-gray-400 text-[10px] font-mono mt-0.5">{inc.date} • {inc.place}</div>
                  </div>

                  <div className="flex justify-between items-center w-full mt-2 pt-2 border-t border-gray-100/50">
                    <span className="text-gray-500 text-[10px]">Conductor: <strong>{inc.driverName}</strong></span>
                    <span className={`text-[10px] font-bold ${
                      inc.severity === 'Alta' ? 'text-red-600' : inc.severity === 'Media' ? 'text-amber-600' : 'text-sky-600'
                    }`}>
                      Severidad: {inc.severity}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Plan de Acción PHVA Interactivo para Siniestro Seleccionado */}
        {selectedIncident ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5" id="incident-phva-card">
            <div className="border-b border-gray-100 pb-3.5 mb-4">
              <span className="text-[10px] font-mono font-bold text-gray-400">PLAN DE ACCIÓN DE MEJORA CONTINUA (PHVA)</span>
              <h3 className="text-sm font-bold text-gray-900 mt-1 flex items-center gap-1.5">
                <ClipboardCheck size={16} className="text-emerald-600" />
                Ciclo PHVA: {selectedIncident.id} ({selectedIncident.type})
              </h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                <strong>Descripción del hecho:</strong> {selectedIncident.description}
              </p>
            </div>

            {/* Listado de las 4 acciones del Ciclo */}
            <div className="space-y-4">
              {selectedIncident.phvaPlan.map((act) => {
                // Color representing PHVA phase
                const phaseColors: Record<string, string> = {
                  Planear: 'bg-blue-600 text-white',
                  Hacer: 'bg-emerald-600 text-white',
                  Verificar: 'bg-indigo-600 text-white',
                  Actuar: 'bg-purple-600 text-white'
                };

                return (
                  <div key={act.id} className="flex gap-4 items-start bg-slate-50/50 p-3.5 rounded-xl border border-gray-100">
                    {/* Badge Phase */}
                    <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider shrink-0 uppercase w-18 text-center ${phaseColors[act.phase]}`}>
                      {act.phase}
                    </span>

                    {/* Action detail */}
                    <div className="flex-1 space-y-1.5 text-xs">
                      <p className="text-gray-800 leading-relaxed font-semibold">{act.action}</p>
                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-500 font-medium">
                        <span>Responsable: <strong className="text-gray-900">{act.responsible}</strong></span>
                        <span>•</span>
                        <span>Límite: <strong className="text-gray-900">{act.deadline}</strong></span>
                      </div>
                    </div>

                    {/* Interactive state modifier */}
                    <div className="shrink-0 flex flex-col gap-1.5 text-right">
                      <select
                        id={`select-act-status-${act.id}`}
                        value={act.status}
                        onChange={(e) => handleUpdateActionStatus(act.id, e.target.value as any)}
                        className={`px-2 py-1 rounded text-[10px] font-bold border ${
                          act.status === 'Completado'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : act.status === 'En Ejecución'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="En Ejecución">En Ejecución</option>
                        <option value="Completado">Completado</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400 flex flex-col items-center justify-center">
            <Calendar className="mb-3 opacity-40" size={48} />
            <h3 className="text-sm font-bold text-gray-800">No hay siniestro seleccionado</h3>
            <p className="text-xs text-gray-500 mt-1">Selecciona un incidente arriba para auditar su plan de acción correctiva.</p>
          </div>
        )}
      </div>

    </div>
  );
}
