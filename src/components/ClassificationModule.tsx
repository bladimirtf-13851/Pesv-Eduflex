/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CompanyConfig, Misionalidad, PESVLevel } from '../types';
import { ShieldCheck, Truck, Car, Users, ClipboardCheck, Info } from 'lucide-react';

interface ClassificationModuleProps {
  config: CompanyConfig;
  onUpdateConfig: (newConfig: CompanyConfig) => void;
}

export default function ClassificationModule({ config, onUpdateConfig }: ClassificationModuleProps) {
  const [misionalidad, setMisionalidad] = useState<Misionalidad>(config.misionalidad);
  const [motos, setMotos] = useState<number>(config.motos);
  const [carros, setCarros] = useState<number>(config.carros);
  const [camiones, setCamiones] = useState<number>(config.camiones);
  const [buses, setBuses] = useState<number>(config.buses);
  const [conductoresContratados, setConductoresContratados] = useState<number>(config.conductoresContratados);
  const [conductoresAdministrados, setConductoresAdministrados] = useState<number>(config.conductoresAdministrados);

  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  // Sync local state when switching active company
  useEffect(() => {
    setMisionalidad(config.misionalidad);
    setMotos(config.motos);
    setCarros(config.carros);
    setCamiones(config.camiones);
    setBuses(config.buses);
    setConductoresContratados(config.conductoresContratados);
    setConductoresAdministrados(config.conductoresAdministrados);
  }, [
    config.misionalidad,
    config.motos,
    config.carros,
    config.camiones,
    config.buses,
    config.conductoresContratados,
    config.conductoresAdministrados
  ]);

  const totalVehiculos = motos + carros + camiones + buses;
  const totalConductores = conductoresContratados + conductoresAdministrados;

  const calculateLevel = (mis: Misionalidad, vehs: number, drivers: number): { level: PESVLevel; applies: boolean; explanation: string } => {
    if (vehs < 11 && drivers < 11) {
      return {
        level: 'BÁSICO',
        applies: false,
        explanation: 'La organización tiene menos de 11 vehículos y menos de 11 conductores. No está obligada legalmente a diseñar el PESV, pero se sugiere implementar el nivel BÁSICO de manera preventiva.'
      };
    }

    if (mis === 'TRANSPORTE') {
      if (vehs >= 50 || drivers >= 50) {
        return {
          level: 'AVANZADO',
          applies: true,
          explanation: 'Empresa de Transporte con 50 o más vehículos, o 50 o más conductores. Clasificación: AVANZADO (aplica los 22 pasos normativos).'
        };
      } else if (vehs >= 20 || drivers >= 20) {
        return {
          level: 'ESTÁNDAR',
          applies: true,
          explanation: 'Empresa de Transporte con 20 a 49 vehículos, o 20 a 49 conductores. Clasificación: ESTÁNDAR (aplica 20 pasos normativos obligatorios).'
        };
      } else {
        return {
          level: 'BÁSICO',
          applies: true,
          explanation: 'Empresa de Transporte con 11 a 19 vehículos, o 11 a 19 conductores. Clasificación: BÁSICO (aplica 16 pasos normativos obligatorios).'
        };
      }
    } else {
      // NO TRANSPORTE
      if (vehs > 100 || drivers > 100) {
        return {
          level: 'AVANZADO',
          applies: true,
          explanation: 'Empresa diferente al transporte con más de 100 vehículos, o más de 100 conductores. Clasificación: AVANZADO (aplica los 22 pasos normativos).'
        };
      } else if (vehs >= 50 || drivers >= 50) {
        return {
          level: 'ESTÁNDAR',
          applies: true,
          explanation: 'Empresa diferente al transporte con 50 a 100 vehículos, o 50 a 100 conductores. Clasificación: ESTÁNDAR (aplica 20 pasos normativos obligatorios).'
        };
      } else {
        return {
          level: 'BÁSICO',
          applies: true,
          explanation: 'Empresa diferente al transporte con 11 a 49 vehículos, o 11 a 49 conductores. Clasificación: BÁSICO (aplica 16 pasos normativos obligatorios).'
        };
      }
    }
  };

  const { level: nivelCalculado, applies, explanation } = calculateLevel(misionalidad, totalVehiculos, totalConductores);

  // Propagate changes automatically when vehicle/driver inputs change so StepsModule activates applicable steps immediately
  useEffect(() => {
    if (
      misionalidad !== config.misionalidad ||
      motos !== config.motos ||
      carros !== config.carros ||
      camiones !== config.camiones ||
      buses !== config.buses ||
      conductoresContratados !== config.conductoresContratados ||
      conductoresAdministrados !== config.conductoresAdministrados ||
      nivelCalculado !== config.nivelCalculado
    ) {
      onUpdateConfig({
        misionalidad,
        motos,
        carros,
        camiones,
        buses,
        conductoresContratados,
        conductoresAdministrados,
        totalVehiculos,
        totalConductores,
        nivelCalculado
      });
    }
  }, [misionalidad, motos, carros, camiones, buses, conductoresContratados, conductoresAdministrados, nivelCalculado]);

  const handleApply = () => {
    onUpdateConfig({
      misionalidad,
      motos,
      carros,
      camiones,
      buses,
      conductoresContratados,
      conductoresAdministrados,
      totalVehiculos,
      totalConductores,
      nivelCalculado
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="classification-module-root">
      {/* Columna Izquierda: Formulario de Registro */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between" id="classification-form-card">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-sky-50 rounded-lg text-sky-600">
              <Truck size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Clasificación de la Organización</h2>
              <p className="text-xs text-gray-500">Resolución 40595 de 2022 - Ministerio de Transporte de Colombia</p>
            </div>
          </div>

          {/* Selector de Misionalidad */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Misionalidad de la Empresa</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                id="btn-misionalidad-transporte"
                onClick={() => setMisionalidad('TRANSPORTE')}
                className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                  misionalidad === 'TRANSPORTE'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/10'
                    : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${misionalidad === 'TRANSPORTE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
                  <Truck size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Empresa de Transporte</div>
                  <div className="text-xs text-gray-500 mt-0.5">Su actividad principal o razón social es la prestación del servicio de transporte público (carga o pasajeros).</div>
                </div>
              </button>

              <button
                type="button"
                id="btn-misionalidad-no-transporte"
                onClick={() => setMisionalidad('NO_TRANSPORTE')}
                className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                  misionalidad === 'NO_TRANSPORTE'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/10'
                    : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${misionalidad === 'NO_TRANSPORTE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
                  <Car size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Actividad Diferente al Transporte</div>
                  <div className="text-xs text-gray-500 mt-0.5">Organizaciones con propósitos comerciales, industriales o de servicios que no prestan transporte público pero operan flota.</div>
                </div>
              </button>
            </div>
          </div>

          {/* Selector de Flota */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b border-gray-100 pb-1.5">Tamaño de la Flota de Vehículos</h3>
            <p className="text-xs text-gray-500 mb-4">Incluye vehículos propios, tomados en arrendamiento, contratados, administrados o puestos al servicio de la organización.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Motocicletas</label>
                <input
                  type="number"
                  min="0"
                  id="input-flota-motos"
                  value={motos}
                  onChange={(e) => setMotos(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Carros / SUVs</label>
                <input
                  type="number"
                  min="0"
                  id="input-flota-carros"
                  value={carros}
                  onChange={(e) => setCarros(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Camiones / Turbos</label>
                <input
                  type="number"
                  min="0"
                  id="input-flota-camiones"
                  value={camiones}
                  onChange={(e) => setCamiones(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Buses / Microbuses</label>
                <input
                  type="number"
                  min="0"
                  id="input-flota-buses"
                  value={buses}
                  onChange={(e) => setBuses(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="mt-3 text-right">
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full">
                Total Vehículos: <strong className="text-gray-950 font-bold">{totalVehiculos}</strong>
              </span>
            </div>
          </div>

          {/* Conductores */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b border-gray-100 pb-1.5">Personal de Conductores</h3>
            <p className="text-xs text-gray-500 mb-4">Conductores de planta, contratistas, afiliados o personal administrativo que conduce para cumplir la misionalidad corporativa.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Conductores Contratados (Directos)</label>
                <input
                  type="number"
                  min="0"
                  id="input-cond-contratados"
                  value={conductoresContratados}
                  onChange={(e) => setConductoresContratados(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Conductores Administrados (Terceros / Outsourcing)</label>
                <input
                  type="number"
                  min="0"
                  id="input-cond-administrados"
                  value={conductoresAdministrados}
                  onChange={(e) => setConductoresAdministrados(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="mt-3 text-right">
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full">
                Total Conductores: <strong className="text-gray-950 font-bold">{totalConductores}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-4">
          <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200/70 max-w-lg">
            <Info size={14} className="shrink-0 text-emerald-600" />
            <span>
              Nivel de aplicabilidad activo: <strong>{nivelCalculado}</strong> ({nivelCalculado === 'BÁSICO' ? '16' : nivelCalculado === 'ESTÁNDAR' ? '20' : '22'} pasos obligatorios habilitados en la estructura detallada).
            </span>
          </div>
          <button
            type="button"
            id="btn-aplicar-configuracion"
            onClick={handleApply}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm transition-all flex items-center gap-2 cursor-pointer shadow-sm shadow-emerald-600/10 shrink-0"
          >
            <ClipboardCheck size={16} />
            {savedNotice ? '¡Nivel Aplicado!' : 'Guardar Clasificación'}
          </button>
        </div>
      </div>

      {/* Columna Derecha: Resultado y Resumen */}
      <div className="space-y-6" id="classification-summary-column">
        {/* Card Nivel Asignado */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-lg border border-slate-950 text-white p-6 relative overflow-hidden flex flex-col justify-between min-h-[320px]" id="level-badge-card">
          {/* Fondo estético */}
          <div className="absolute right-[-40px] top-[-40px] w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl" />
          <div className="absolute left-[-20px] bottom-[-20px] w-32 h-32 bg-sky-500/10 rounded-full blur-2xl" />

          <div className="relative z-10">
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase font-semibold text-slate-400 tracking-widest">Nivel de Diseño</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${applies ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                {applies ? 'PESV Obligatorio' : 'Voluntario'}
              </span>
            </div>

            <div className="mt-8">
              <span className="text-xs text-slate-400">Nivel Asignado</span>
              <h1 className="text-4xl font-extrabold tracking-tight mt-1 flex items-center gap-3">
                {nivelCalculado}
                <ShieldCheck className="text-emerald-400" size={32} />
              </h1>
            </div>

            <p className="text-sm text-slate-300 mt-4 leading-relaxed">
              {explanation}
            </p>
          </div>

          <div className="border-t border-slate-700/50 pt-4 mt-6 relative z-10 grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">Pasos Obligatorios</span>
              <span className="text-lg font-bold text-emerald-400">
                {nivelCalculado === 'BÁSICO' ? '16 / 22' : nivelCalculado === 'ESTÁNDAR' ? '20 / 22' : '22 / 22'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">Misionalidad</span>
              <span className="text-xs font-semibold text-white">
                {misionalidad === 'TRANSPORTE' ? 'Servicio de Transporte' : 'Actividades Diversas'}
              </span>
            </div>
          </div>
        </div>

        {/* Card Tablas de Referencia Ley */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5" id="normative-thresholds-card">
          <h3 className="text-xs uppercase font-bold text-gray-500 tracking-wider mb-3">Tabla de Umbrales (Resol. 40595)</h3>
          
          <div className="space-y-3.5">
            <div>
              <div className="text-[11px] font-bold text-gray-800 bg-gray-50 px-2 py-1 rounded">MISIÓN 1: SERVICIO DE TRANSPORTE</div>
              <div className="mt-1.5 grid grid-cols-3 gap-1 text-[10px] text-gray-600 text-center">
                <div className={`border p-1 rounded ${nivelCalculado === 'BÁSICO' && misionalidad === 'TRANSPORTE' ? 'border-emerald-500 bg-emerald-50 font-bold text-emerald-900' : 'border-gray-100'}`}>
                  <div className="font-semibold">BÁSICO (16)</div>
                  <div>11 - 19 Veh.</div>
                  <div>11 - 19 Cond.</div>
                </div>
                <div className={`border p-1 rounded ${nivelCalculado === 'ESTÁNDAR' && misionalidad === 'TRANSPORTE' ? 'border-emerald-500 bg-emerald-50 font-bold text-emerald-900' : 'border-gray-100 bg-slate-50/50'}`}>
                  <div className="font-semibold">ESTÁNDAR (20)</div>
                  <div>20 - 49 Veh.</div>
                  <div>20 - 49 Cond.</div>
                </div>
                <div className={`border p-1 rounded ${nivelCalculado === 'AVANZADO' && misionalidad === 'TRANSPORTE' ? 'border-emerald-500 bg-emerald-50 font-bold text-emerald-900' : 'border-gray-100'}`}>
                  <div className="font-semibold">AVANZADO (22)</div>
                  <div>≥ 50 Veh.</div>
                  <div>≥ 50 Cond.</div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-gray-800 bg-gray-50 px-2 py-1 rounded">MISIÓN 2: NO TRANSPORTE</div>
              <div className="mt-1.5 grid grid-cols-3 gap-1 text-[10px] text-gray-600 text-center">
                <div className={`border p-1 rounded ${nivelCalculado === 'BÁSICO' && misionalidad === 'NO_TRANSPORTE' ? 'border-emerald-500 bg-emerald-50 font-bold text-emerald-900' : 'border-gray-100'}`}>
                  <div className="font-semibold">BÁSICO (16)</div>
                  <div>11 - 49 Veh.</div>
                  <div>11 - 49 Cond.</div>
                </div>
                <div className={`border p-1 rounded ${nivelCalculado === 'ESTÁNDAR' && misionalidad === 'NO_TRANSPORTE' ? 'border-emerald-500 bg-emerald-50 font-bold text-emerald-900' : 'border-gray-100 bg-slate-50/50'}`}>
                  <div className="font-semibold">ESTÁNDAR (20)</div>
                  <div>50 - 100 Veh.</div>
                  <div>50 - 100 Cond.</div>
                </div>
                <div className={`border p-1 rounded ${nivelCalculado === 'AVANZADO' && misionalidad === 'NO_TRANSPORTE' ? 'border-emerald-500 bg-emerald-50 font-bold text-emerald-900' : 'border-gray-100'}`}>
                  <div className="font-semibold">AVANZADO (22)</div>
                  <div>&gt; 100 Veh.</div>
                  <div>&gt; 100 Cond.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
