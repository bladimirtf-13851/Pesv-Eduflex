/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Building2, Plus, Users, ShieldAlert, Award, FileText, Settings, Key, 
  Trash2, Mail, ShieldCheck, HelpCircle, Check, Briefcase, Sparkles, UploadCloud, Truck 
} from 'lucide-react';
import { PESVCompany, PESVLevel, CompanyConfig, Misionalidad } from '../types';

interface SuperAdminModuleProps {
  companies: PESVCompany[];
  onAddCompany: (company: PESVCompany) => void;
  onDeleteCompany: (id: string) => void;
  onSelectCompany: (company: PESVCompany) => void;
  onUpdateCompanyLogo?: (companyId: string, newLogo: string) => void;
}

export default function SuperAdminModule({
  companies,
  onAddCompany,
  onDeleteCompany,
  onSelectCompany,
  onUpdateCompanyLogo
}: SuperAdminModuleProps) {
  
  // Creation form state
  const [name, setName] = useState('');
  const [nit, setNit] = useState('');
  const [misionalidad, setMisionalidad] = useState<Misionalidad>('TRANSPORTE');
  const [motos, setMotos] = useState(0);
  const [carros, setCarros] = useState(0);
  const [camiones, setCamiones] = useState(0);
  const [buses, setBuses] = useState(0);
  const [conductoresContratados, setConductoresContratados] = useState(0);
  const [conductoresAdministrados, setConductoresAdministrados] = useState(0);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('admin'); // default simplified admin password
  
  // Logo type / selection: 'upload' | 'preset' | 'url'
  const [logoMode, setLogoMode] = useState<'upload' | 'preset' | 'url'>('upload');
  const [uploadedLogoDataUrl, setUploadedLogoDataUrl] = useState<string>('');
  const [selectedLogoPreset, setSelectedLogoPreset] = useState<string>('💼');
  const [customLogoUrl, setCustomLogoUrl] = useState<string>('');

  // Status flags
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Helper to resize and convert uploaded image file into compact PNG DataURL
  const processLogoFile = (file: File, callback: (dataUrl: string) => void) => {
    if (!file.type.startsWith('image/')) {
      setFormError('Por favor seleccione un archivo de imagen válido (PNG, JPG, WEBP o SVG).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rawDataUrl = ev.target?.result as string;
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
          callback(canvas.toDataURL('image/png'));
        } else {
          callback(rawDataUrl);
        }
      };
      img.onerror = () => callback(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Dynamic Level Calculation helper
  const calculateLevel = (
    mision: Misionalidad,
    vMotos: number,
    vCarros: number,
    vCamiones: number,
    vBuses: number,
    cContratados: number,
    cAdministrados: number
  ): PESVLevel => {
    const totalVehiculos = vMotos + vCarros + vCamiones + vBuses;
    const totalConductores = cContratados + cAdministrados;

    if (mision === 'TRANSPORTE') {
      if (totalVehiculos >= 50 || totalConductores >= 50) {
        return 'AVANZADO';
      } else if (totalVehiculos >= 11 || totalConductores >= 11) {
        return 'ESTÁNDAR';
      } else {
        return 'BÁSICO';
      }
    } else {
      // Actividad diferente al transporte
      if (totalVehiculos >= 100 || totalConductores >= 100) {
        return 'AVANZADO';
      } else if (totalVehiculos >= 30 || totalConductores >= 30) {
        return 'ESTÁNDAR';
      } else {
        return 'BÁSICO';
      }
    }
  };

  // Live level calculation preview
  const liveLevel = calculateLevel(
    misionalidad,
    motos,
    carros,
    camiones,
    buses,
    conductoresContratados,
    conductoresAdministrados
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!name.trim() || !nit.trim() || !adminEmail.trim()) {
      setFormError('Por favor, rellene todos los campos requeridos (Nombre de empresa, NIT y Email del Administrador).');
      return;
    }

    // Email validation
    if (!adminEmail.includes('@')) {
      setFormError('Ingrese un formato de correo electrónico válido.');
      return;
    }

    // Verify existing email to avoid duplication
    if (companies.some(c => c.adminEmail.toLowerCase() === adminEmail.toLowerCase().trim())) {
      setFormError('Este correo electrónico ya está asignado como administrador de otra empresa.');
      return;
    }

    const totalVehiculos = motos + carros + camiones + buses;
    const totalConductores = conductoresContratados + conductoresAdministrados;

    if (totalVehiculos === 0 && totalConductores === 0) {
      setFormError('La empresa debe registrar al menos un vehículo o un conductor para calcular su rango normativo.');
      return;
    }

    // Logo resolution
    let finalLogo = selectedLogoPreset;
    if (logoMode === 'upload' && uploadedLogoDataUrl) {
      finalLogo = uploadedLogoDataUrl;
    } else if (logoMode === 'url' && customLogoUrl.trim() !== '') {
      finalLogo = customLogoUrl.trim();
    } else if (uploadedLogoDataUrl) {
      finalLogo = uploadedLogoDataUrl;
    }

    const newCompany: PESVCompany = {
      id: `company_${Date.now()}`,
      name: name.trim(),
      nit: nit.trim(),
      logo: finalLogo,
      adminEmail: adminEmail.trim().toLowerCase(),
      adminPassword: adminPassword.trim() || 'admin',
      config: {
        misionalidad,
        motos,
        carros,
        camiones,
        buses,
        conductoresContratados,
        conductoresAdministrados,
        totalVehiculos,
        totalConductores,
        nivelCalculado: liveLevel
      }
    };

    onAddCompany(newCompany);
    setSuccessMessage(`¡Empresa "${name}" registrada exitosamente! Se ha creado un usuario administrador con el correo: ${adminEmail} y clave: ${adminPassword.trim() || 'admin'}`);
    
    // Reset Form
    setName('');
    setNit('');
    setAdminEmail('');
    setAdminPassword('admin');
    setMotos(0);
    setCarros(0);
    setCamiones(0);
    setBuses(0);
    setConductoresContratados(0);
    setConductoresAdministrados(0);
    setUploadedLogoDataUrl('');
    setCustomLogoUrl('');
    setLogoMode('upload');
  };

  return (
    <div className="space-y-6" id="superadmin-module-root">
      
      {/* Superadmin welcome and stats bar */}
      <div className="bg-slate-900 text-white rounded-2xl shadow-lg p-6 relative overflow-hidden border border-slate-950" id="superadmin-banner">
        <div className="absolute top-0 right-0 p-8 text-slate-800 opacity-20 pointer-events-none">
          <Settings size={180} className="animate-spin" style={{ animationDuration: '30s' }} />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500 rounded-xl text-slate-950">
              <Key size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9.5px] bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-extrabold tracking-wider uppercase">Panel Superadministrador</span>
                <span className="text-[9.5px] text-slate-400 font-bold uppercase">• Control de Clientes PESV</span>
              </div>
              <h2 className="text-xl font-black mt-0.5">Consola de Control y Gestión de Empresas PESV</h2>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-800 text-xs">
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/40">
            <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Total Empresas Clientes</span>
            <span className="text-lg font-black text-white mt-1 block">{companies.length}</span>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/40">
            <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Marco Normativo</span>
            <span className="text-lg font-black text-emerald-400 mt-1 block">Res. 40595 de 2022</span>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/40">
            <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Rol de Acceso Actual</span>
            <span className="text-lg font-black text-amber-400 mt-1 block">Super Administrador</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* FORM TO CREATE COMPANY WITH LOGO OPTION */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-gray-150 p-6" id="create-company-form-panel">
          <div className="flex items-center justify-between border-b border-gray-150 pb-3 mb-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="text-emerald-600" size={15} />
              Crear Nueva Empresa Cliente
            </h3>
            <Sparkles className="text-emerald-500 animate-pulse" size={12} />
          </div>

          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-xl mb-4 font-semibold">
              {formError}
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl mb-4 font-semibold">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 mb-1">Nombre de la Empresa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Logística Andina"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">NIT *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 901.552.128-4"
                  value={nit}
                  onChange={(e) => setNit(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>
            </div>

            {/* SELECCIÓN Y CARGA DE LOGO DE LA EMPRESA */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-gray-250 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-600 uppercase font-extrabold block">Logo Institucional de la Empresa</span>
                <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
                  Se incluye en todos los PDFs
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 pb-1 border-b border-gray-200">
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                  <input
                    type="radio"
                    checked={logoMode === 'upload'}
                    onChange={() => setLogoMode('upload')}
                    className="accent-emerald-600"
                  />
                  <span>Subir Imagen (PNG/JPG)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                  <input
                    type="radio"
                    checked={logoMode === 'preset'}
                    onChange={() => setLogoMode('preset')}
                    className="accent-emerald-600"
                  />
                  <span>Icono Predefinido</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                  <input
                    type="radio"
                    checked={logoMode === 'url'}
                    onChange={() => setLogoMode('url')}
                    className="accent-emerald-600"
                  />
                  <span>URL Externa</span>
                </label>
              </div>

              {logoMode === 'upload' && (
                <div>
                  {uploadedLogoDataUrl ? (
                    <div className="flex items-center justify-between bg-white border border-emerald-200 rounded-xl p-2.5 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg border border-gray-200 bg-slate-50 p-1 flex items-center justify-center overflow-hidden">
                          <img src={uploadedLogoDataUrl} alt="Vista previa del logo" className="max-w-full max-h-full object-contain" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-emerald-800 block">Logo cargado correctamente</span>
                          <span className="text-[9.5px] text-gray-500 block">Aparecerá en el encabezado de cada documento descargable</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <label className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer transition-all">
                          Cambiar
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) processLogoFile(file, setUploadedLogoDataUrl);
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setUploadedLogoDataUrl('')}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg cursor-pointer transition-all"
                          title="Quitar logo"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/30 rounded-xl p-4 text-center cursor-pointer flex flex-col items-center justify-center gap-1.5 transition-all">
                      <UploadCloud size={22} className="text-emerald-600" />
                      <span className="text-[11px] font-bold text-slate-700">Haz clic para seleccionar el logo de la empresa</span>
                      <span className="text-[9.5px] text-gray-400 font-normal">Formatos soportados: PNG, JPG, WEBP • Se ajusta automáticamente para reportes PDF</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) processLogoFile(file, setUploadedLogoDataUrl);
                        }}
                      />
                    </label>
                  )}
                </div>
              )}

              {logoMode === 'preset' && (
                <div className="grid grid-cols-5 gap-2">
                  {['💼', '🚛', '🚕', '🚍', '✈️', '⚙️', '⚡', '📦', '🌍', '🏢'].map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedLogoPreset(emoji)}
                      className={`py-2 text-xl rounded-lg border transition-all cursor-pointer ${
                        selectedLogoPreset === emoji
                          ? 'border-emerald-600 bg-emerald-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {logoMode === 'url' && (
                <div>
                  <input
                    type="text"
                    placeholder="https://ejemplo.com/logo.png"
                    value={customLogoUrl}
                    onChange={(e) => setCustomLogoUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium bg-white"
                  />
                  <span className="text-[9px] text-gray-400 block mt-1">
                    Ingrese la URL absoluta de la imagen del logotipo de la empresa.
                  </span>
                </div>
              )}
            </div>

            {/* USER ADMIN CREDENTIALS */}
            <div className="bg-slate-50 p-3 rounded-xl border border-gray-250 space-y-3">
              <span className="text-[10px] text-slate-500 uppercase font-extrabold block border-b border-gray-200 pb-1">Administrador de PESV Principal</span>
              
              <div>
                <label className="block text-gray-700 mb-1">Email del Administrador *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400 pointer-events-none">
                    <Mail size={12} />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="admin@empresa.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-1">Contraseña de Acceso Principal *</label>
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-slate-800 bg-white"
                />
                <span className="text-[9px] text-gray-400 block mt-1">
                  Establezca la contraseña inicial para esta empresa. El administrador podrá cambiarla posteriormente.
                </span>
              </div>
            </div>

            {/* LIVE CONFIGURATION & REAL-TIME LEVEL PREVIEW */}
            <div className="bg-slate-50 p-3 rounded-xl border border-gray-250 space-y-3">
              <div className="flex items-center justify-between border-b border-gray-200 pb-1">
                <span className="text-[10px] text-slate-500 uppercase font-extrabold block">Tamaño de la Flota</span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                  Nivel PESV: {liveLevel}
                </span>
              </div>

              <div className="mb-2">
                <label className="block text-gray-700 mb-1">Misionalidad</label>
                <select
                  value={misionalidad}
                  onChange={(e) => setMisionalidad(e.target.value as Misionalidad)}
                  className="w-full px-3 py-1.5 border border-gray-200 bg-white rounded-lg focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="TRANSPORTE">TRANSPORTE (Sujeto a rangos más exigentes)</option>
                  <option value="NO_TRANSPORTE">OTRA ACTIVIDAD (Sujeto a rangos estándar)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 mb-1">Motos</label>
                  <input
                    type="number"
                    min="0"
                    value={motos}
                    onChange={(e) => setMotos(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium bg-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Carros</label>
                  <input
                    type="number"
                    min="0"
                    value={carros}
                    onChange={(e) => setCarros(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium bg-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Camiones</label>
                  <input
                    type="number"
                    min="0"
                    value={camiones}
                    onChange={(e) => setCamiones(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium bg-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Buses</label>
                  <input
                    type="number"
                    min="0"
                    value={buses}
                    onChange={(e) => setBuses(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-gray-200 pt-2 mt-1">
                <div>
                  <label className="block text-gray-700 mb-1">Cond. Contratados</label>
                  <input
                    type="number"
                    min="0"
                    value={conductoresContratados}
                    onChange={(e) => setConductoresContratados(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium bg-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Cond. Administrados</label>
                  <input
                    type="number"
                    min="0"
                    value={conductoresAdministrados}
                    onChange={(e) => setConductoresAdministrados(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium bg-white"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus size={14} />
              Registrar Empresa y Generar Admin
            </button>

          </form>
        </div>

        {/* LIST OF EXISTING COMPANIES */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-150 p-6 flex flex-col justify-between" id="companies-list-panel">
          <div>
            <div className="flex items-center justify-between border-b border-gray-150 pb-3 mb-4">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="text-emerald-600" size={15} />
                Empresas Clientes en el Sistema
              </h3>
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-gray-600 font-bold">
                {companies.length} registradas
              </span>
            </div>

            <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
              {companies.length === 0 ? (
                <div className="p-8 text-center bg-slate-50/60 rounded-xl border border-dashed border-gray-200">
                  <Building2 className="mx-auto text-gray-300 mb-2" size={32} />
                  <p className="font-bold text-xs text-gray-700">No hay empresas cliente registradas</p>
                  <p className="text-[11px] text-gray-400 max-w-xs mx-auto mt-1">
                    Utilice el formulario de la izquierda para registrar la primera empresa y asignarle su respectivo usuario administrador.
                  </p>
                </div>
              ) : (
                companies.map(company => {
                  const totalV = company.config.totalVehiculos;
                  const totalC = company.config.totalConductores;
                  
                  return (
                    <div 
                      key={company.id} 
                      className="border border-gray-180 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/5 p-4 rounded-xl transition-all flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center relative overflow-hidden"
                    >
                      <div className="flex items-center gap-3">
                        {/* Logo avatar with upload trigger */}
                        <label
                          className="w-12 h-12 bg-white rounded-lg border border-gray-200 hover:border-emerald-500 flex items-center justify-center text-xl shadow-2xs font-extrabold text-slate-800 shrink-0 cursor-pointer relative group overflow-hidden"
                          title="Haz clic para cargar o cambiar el logo de esta empresa"
                        >
                          {(company.logo && (company.logo.startsWith('http') || company.logo.startsWith('data:image/'))) ? (
                            <img src={company.logo} alt={company.name} className="w-full h-full object-contain p-1 rounded-lg" />
                          ) : (
                            <span>{company.logo || '🏢'}</span>
                          )}
                          {onUpdateCompanyLogo && (
                            <div className="absolute inset-0 bg-slate-900/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[8px] font-bold text-center leading-tight p-0.5">
                              Subir Logo
                            </div>
                          )}
                          {onUpdateCompanyLogo && (
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  processLogoFile(file, (dataUrl) => {
                                    onUpdateCompanyLogo(company.id, dataUrl);
                                  });
                                }
                              }}
                            />
                          )}
                        </label>

                        <div>
                          <h4 className="text-sm font-black text-slate-900">{company.name}</h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-gray-500 font-semibold">
                            <span>NIT: <strong className="text-slate-800">{company.nit}</strong></span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              Email: <strong className="text-slate-800 font-mono text-[9.5px]">{company.adminEmail}</strong>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              Clave: <strong className="text-emerald-700 font-mono text-[9.5px]">{company.adminPassword || 'admin'}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end gap-2 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded font-extrabold uppercase border border-sky-100">
                            {company.config.misionalidad === 'TRANSPORTE' ? 'TRANSPORTE' : 'OTRA MISIÓN'}
                          </span>
                          <span className="text-[9px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-extrabold uppercase border border-emerald-100 flex items-center gap-0.5">
                            <Award size={9} />
                            {company.config.nivelCalculado}
                          </span>
                        </div>

                        <div className="text-[10px] text-gray-400 font-semibold text-left sm:text-right">
                          <span>{totalV} Veh. • {totalC} Cond.</span>
                        </div>

                        <div className="flex items-center gap-1.5 mt-1">
                          {onUpdateCompanyLogo && (
                            <label
                              className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] rounded-md cursor-pointer transition-all flex items-center gap-1"
                              title="Cargar o actualizar el logo de la empresa"
                            >
                              <UploadCloud size={11} />
                              Logo
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    processLogoFile(file, (dataUrl) => {
                                      onUpdateCompanyLogo(company.id, dataUrl);
                                    });
                                  }
                                }}
                              />
                            </label>
                          )}

                          <button
                            type="button"
                            onClick={() => onSelectCompany(company)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-950 text-white font-bold text-[10px] rounded-md cursor-pointer transition-all flex items-center gap-1"
                          >
                            <Check size={10} />
                            Ingresar a PESV
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`¿Está seguro de eliminar a la empresa "${company.name}" y todos sus datos del PESV?`)) {
                                onDeleteCompany(company.id);
                              }
                            }}
                            className="p-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-md cursor-pointer transition-all"
                            title="Eliminar Empresa"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="border-t border-gray-150 pt-4 mt-4 text-[10.5px] text-gray-400 font-medium flex items-center gap-1">
            <ShieldCheck size={13} className="text-emerald-500 shrink-0" />
            Control exclusivo para la creación y habilitación de planes estratégicos nacionales.
          </div>
        </div>

      </div>

    </div>
  );
}
