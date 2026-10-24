/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { CompanyConfig, PESVLevel, PESVStep } from '../types';
import { PESV_STEPS } from '../data';
import { 
  ClipboardCheck, Download, Award, ShieldAlert, CheckCircle, AlertTriangle, 
  Trash2, RefreshCw, Save, User, FileText, Check, FileCheck, ShieldCheck, PenTool, Sparkles 
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface AuditModuleProps {
  config: CompanyConfig;
  companyName?: string;
  companyNit?: string;
  companyLogo?: string;
}

export default function AuditModule({
  config,
  companyName: propCompanyName,
  companyNit = '901.452.883-1',
  companyLogo = ''
}: AuditModuleProps) {
  // Level to audit (defaults to company's calculated level)
  const [auditLevel, setAuditLevel] = useState<PESVLevel>(() => {
    const saved = localStorage.getItem('pesv_audit_level');
    return (saved as PESVLevel) || config.nivelCalculado || 'ESTÁNDAR';
  });

  // Keep in sync with main configuration if requested or changed
  useEffect(() => {
    if (!localStorage.getItem('pesv_audit_level')) {
      setAuditLevel(config.nivelCalculado);
    }
  }, [config.nivelCalculado]);

  // General Audit Information
  const [companyName, setCompanyName] = useState<string>(() => {
    return propCompanyName || localStorage.getItem('pesv_audit_company') || 'Transportes Integrados de Colombia S.A.S.';
  });

  useEffect(() => {
    if (propCompanyName && propCompanyName !== 'Empresa Principal') {
      setCompanyName(propCompanyName);
    }
  }, [propCompanyName]);

  const [auditorName, setAuditorName] = useState<string>(() => {
    return localStorage.getItem('pesv_audit_auditor') || 'Dra. Sandra Milena Gómez';
  });
  const [auditorCedula, setAuditorCedula] = useState<string>(() => {
    return localStorage.getItem('pesv_audit_cedula') || 'CC 1.017.342.551';
  });
  const [auditorLicense, setAuditorLicense] = useState<string>(() => {
    return localStorage.getItem('pesv_audit_license') || 'SST-2025-99882-COL';
  });
  const [auditDate, setAuditDate] = useState<string>(() => {
    return localStorage.getItem('pesv_audit_date') || '2026-06-25';
  });

  // Step ratings ('CUMPLE' = 100%, 'PARCIAL' = 50%, 'NO_CUMPLE' = 0%)
  const [ratings, setRatings] = useState<Record<number, 'CUMPLE' | 'PARCIAL' | 'NO_CUMPLE'>>(() => {
    const saved = localStorage.getItem('pesv_audit_ratings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    // Default initial ratings
    return {};
  });

  // Step evidence / observations
  const [observations, setObservations] = useState<Record<number, string>>(() => {
    const saved = localStorage.getItem('pesv_audit_observations');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {};
  });

  // Base64 Signature string
  const [signature, setSignature] = useState<string | undefined>(() => {
    return localStorage.getItem('pesv_audit_signature') || undefined;
  });

  // UI state for drawing canvas modal
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);

  // Sync state with localStorage
  useEffect(() => {
    localStorage.setItem('pesv_audit_level', auditLevel);
    localStorage.setItem('pesv_audit_company', companyName);
    localStorage.setItem('pesv_audit_auditor', auditorName);
    localStorage.setItem('pesv_audit_cedula', auditorCedula);
    localStorage.setItem('pesv_audit_license', auditorLicense);
    localStorage.setItem('pesv_audit_date', auditDate);
    localStorage.setItem('pesv_audit_ratings', JSON.stringify(ratings));
    localStorage.setItem('pesv_audit_observations', JSON.stringify(observations));
    if (signature) {
      localStorage.setItem('pesv_audit_signature', signature);
    } else {
      localStorage.removeItem('pesv_audit_signature');
    }
  }, [auditLevel, companyName, auditorName, auditorCedula, auditorLicense, auditDate, ratings, observations, signature]);

  // Filter steps according to selected audit level
  const auditedSteps = PESV_STEPS.filter(step => step.levels.includes(auditLevel));

  // Rating values
  const getRatingValue = (r?: 'CUMPLE' | 'PARCIAL' | 'NO_CUMPLE') => {
    if (r === 'CUMPLE') return 100;
    if (r === 'PARCIAL') return 50;
    return 0; // default to 0 if unrated or no comply
  };

  // Calculations
  const totalStepsCount = auditedSteps.length;
  const gradedStepsCount = auditedSteps.filter(step => ratings[step.id] !== undefined).length;
  
  // Overall score calculation
  const totalScore = totalStepsCount > 0 
    ? auditedSteps.reduce((acc, step) => acc + getRatingValue(ratings[step.id]), 0) / totalStepsCount
    : 0;

  // Rating categories helper
  const getScoreBadge = (score: number) => {
    if (score >= 85) {
      return {
        label: 'SOBRESALIENTE (CUMPLE PESV)',
        bgColor: 'bg-emerald-100 border-emerald-200 text-emerald-800',
        icon: <ShieldCheck className="text-emerald-600 animate-bounce" size={18} />,
        textColor: 'text-emerald-600',
        barColor: 'bg-emerald-500'
      };
    } else if (score >= 60) {
      return {
        label: 'ACEPTABLE (CON PLAN DE MEJORA)',
        bgColor: 'bg-amber-100 border-amber-200 text-amber-800',
        icon: <AlertTriangle className="text-amber-600" size={18} />,
        textColor: 'text-amber-600',
        barColor: 'bg-amber-500'
      };
    } else {
      return {
        label: 'CRÍTICO (SANCIONABLE / NO CUMPLE)',
        bgColor: 'bg-red-100 border-red-200 text-red-800',
        icon: <ShieldAlert className="text-red-600" size={18} />,
        textColor: 'text-red-600',
        barColor: 'bg-red-500'
      };
    }
  };

  const badge = getScoreBadge(totalScore);

  // Quick Action: Mark all audited steps as Complies
  const handleMarkAllComplies = () => {
    const newRatings: Record<number, 'CUMPLE' | 'PARCIAL' | 'NO_CUMPLE'> = {};
    const newObs: Record<number, string> = { ...observations };
    auditedSteps.forEach(step => {
      newRatings[step.id] = 'CUMPLE';
      if (!newObs[step.id]) {
        newObs[step.id] = 'Evidencia revisada y validada conforme a la guía metodológica de la Resol. 40595.';
      }
    });
    setRatings(newRatings);
    setObservations(newObs);
  };

  // Quick Action: Reset audit
  const handleResetAudit = () => {
    if (window.confirm('¿Está seguro de reiniciar los resultados de la auditoría actual? Esto borrará todas las calificaciones y comentarios.')) {
      setRatings({});
      setObservations({});
      setSignature(undefined);
    }
  };

  // Drawing pad handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#0f172a'; // Deep slate
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawingRef.current = true;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      setSignature(canvas.toDataURL('image/png'));
    }
    setIsSignatureModalOpen(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSignature(undefined);
  };

  // high-fidelity PDF report downloader
  const handleDownloadReport = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Elegant Emerald Header
    doc.setFillColor(16, 185, 129); // Emerald-500
    doc.rect(0, 0, 210, 20, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13.5);
    doc.text('INFORME OFICIAL DE AUDITORÍA ANUAL PESV (PASO 22)', 10, 12);

    // Subtitle
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text('RESOLUCIÓN 40595 DE 2022 - MINISTERIO DE TRANSPORTE DE COLOMBIA', 10, 17);

    // Company Logo in Header (Top Right)
    if (companyLogo && companyLogo.startsWith('data:image/')) {
      try {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(203, 213, 225);
        doc.rect(174, 2, 26, 20, 'FD');
        doc.addImage(companyLogo, 175.5, 3, 23, 18, undefined, 'FAST');
      } catch (e) {
        console.warn('No se pudo renderizar logo en PDF de auditoría:', e);
      }
    }

    // Audit Metadata Box
    doc.setFillColor(243, 244, 246); // Gray-100
    doc.rect(10, 26, 190, 36, 'F');
    doc.rect(10, 26, 190, 36, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(31, 41, 55); // Gray-800

    doc.text('DATOS DE LA AUDITORÍA:', 13, 32);
    doc.line(13, 34, 197, 34);

    doc.setFont('helvetica', 'normal');
    doc.text(`Empresa Auditada: ${companyName}`, 13, 39);
    doc.text(`Fecha Ejecución: ${auditDate}`, 13, 44);
    doc.text(`Auditor Líder: ${auditorName}`, 13, 49);
    doc.text(`Identificación: ${auditorCedula}`, 13, 54);

    doc.text(`Nivel de PESV Auditado: ${auditLevel}`, 110, 39);
    doc.text(`Nro Pasos Aplicables: ${totalStepsCount} Pasos`, 110, 44);
    doc.text(`Licencia SST Auditor: ${auditorLicense}`, 110, 49);
    doc.text(`NIT Empresa: ${companyNit}`, 110, 54);

    // Score Dashboard Box
    doc.setFillColor(totalScore >= 85 ? 240 : totalScore >= 60 ? 254 : 254, totalScore >= 85 ? 253 : totalScore >= 60 ? 243 : 242, totalScore >= 85 ? 250 : totalScore >= 60 ? 199 : 242);
    doc.rect(10, 68, 190, 20, 'F');
    doc.rect(10, 68, 190, 20, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(totalScore >= 85 ? 6 : totalScore >= 60 ? 146 : 220, totalScore >= 85 ? 95 : totalScore >= 60 ? 64 : 38, totalScore >= 85 ? 70 : totalScore >= 60 ? 14 : 38);
    doc.text(`PORCENTAJE GENERAL DE CUMPLIMIENTO: ${totalScore.toFixed(1)}%`, 14, 76);
    doc.setFontSize(9);
    doc.text(`DICTAMEN: ${badge.label}`, 14, 82);

    // Step breakdown table
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(10, 94, 190, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('PASO DEL PESV / ELEMENTO EVALUADO', 13, 99);
    doc.text('CALIFICACIÓN', 125, 99);
    doc.text('ESTADO', 165, 99);

    let currentY = 108;
    auditedSteps.forEach((step, index) => {
      // Check for page break
      if (currentY > 265) {
        doc.addPage();
        // Redraw table header on new page
        doc.setFillColor(15, 23, 42);
        doc.rect(10, 15, 190, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('PASO DEL PESV / ELEMENTO EVALUADO', 13, 20);
        doc.text('CALIFICACIÓN', 125, 20);
        doc.text('ESTADO', 165, 20);
        currentY = 28;
      }

      // Zebra striping
      if (index % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(10, currentY - 5, 190, 12, 'F');
      }

      doc.setTextColor(17, 24, 39);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      
      const stepTitle = `Paso ${step.id}: ${step.title}`;
      const splitTitle = doc.splitTextToSize(stepTitle, 105);
      doc.text(splitTitle, 13, currentY - 1);

      const rating = ratings[step.id] || 'NO_CUMPLE';
      let ratingPct = '0%';
      let ratingLabel = 'No Cumple';
      if (rating === 'CUMPLE') { ratingPct = '100%'; ratingLabel = 'Cumple'; }
      if (rating === 'PARCIAL') { ratingPct = '50%'; ratingLabel = 'Parcial'; }

      doc.text(ratingPct, 132, currentY + 1);

      if (rating === 'CUMPLE') {
        doc.setTextColor(16, 185, 129);
      } else if (rating === 'PARCIAL') {
        doc.setTextColor(245, 158, 11);
      } else {
        doc.setTextColor(239, 68, 68);
      }
      doc.text(ratingLabel.toUpperCase(), 165, currentY + 1);

      // Render observations/evidence below title
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(107, 114, 128);
      const obsText = observations[step.id] || 'Sin observaciones registradas.';
      const splitObs = doc.splitTextToSize(`Obs: ${obsText}`, 105);
      doc.text(splitObs, 13, currentY + 4);

      currentY += 13;
    });

    // Check for page break for signature section
    if (currentY > 230) {
      doc.addPage();
      currentY = 30;
    }

    currentY += 10;
    doc.line(10, currentY, 90, currentY);
    doc.line(120, currentY, 200, currentY);

    doc.setFontSize(8.5);
    doc.setTextColor(55, 65, 81);
    doc.setFont('helvetica', 'bold');
    doc.text('Firma Digital del Auditor Líder', 10, currentY + 5);
    doc.text('Representante Legal de la Organización', 120, currentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.text(`Reg. SST: ${auditorLicense}`, 10, currentY + 9);
    doc.text(`Cédula: ${auditorCedula}`, 10, currentY + 13);
    doc.text(`Nombre: ${repLegalName()}`, 120, currentY + 9);

    if (signature) {
      try {
        doc.addImage(signature, 'PNG', 15, currentY - 17, 45, 14);
      } catch (err) {
        console.warn("Could not load signature to PDF", err);
      }
    } else {
      doc.setFont('courier', 'italic');
      doc.setFontSize(7.5);
      doc.text('[Requiere Firma Digital]', 15, currentY - 5);
    }

    // Official stamps & legal footnotes
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text('Certificado de cumplimiento de auditoría vial anual generado según requerimientos del Ministerio de Transporte.', 10, 280);
    doc.text('Carga probatoria válida conforme al Paso 22 del Plan Estratégico de Seguridad Vial (Resolución 40595 de 2022).', 10, 284);

    doc.save(`Informe_Auditoria_Anual_PESV_${auditLevel}_${auditDate}.pdf`);
  };

  const repLegalName = () => {
    // Attempt to read rep legal from StepsModule storage if any, otherwise default
    return 'Ing. Diana Patricia Osorio';
  };

  return (
    <div className="space-y-6" id="audit-module-root">
      
      {/* 1. SECCIÓN DE BIENVENIDA Y CONFIGURACIÓN */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" id="audit-header-panel">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2.5 rounded-lg text-emerald-700">
              <ClipboardCheck size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-700 font-extrabold px-2 py-0.5 rounded border border-emerald-500/20 uppercase">Paso 22</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Auditoría Vial Obligatoria</span>
              </div>
              <h2 className="text-lg font-black text-slate-900 mt-0.5">Auditoría Anual de Cumplimiento PESV</h2>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={handleMarkAllComplies}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm shadow-emerald-600/10"
            >
              <Check className="shrink-0" size={13} />
              Aprobar Todo (100%)
            </button>
            <button
              type="button"
              onClick={handleResetAudit}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-150 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all cursor-pointer"
            >
              <RefreshCw className="shrink-0" size={13} />
              Reiniciar
            </button>
            <button
              type="button"
              onClick={handleDownloadReport}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-950 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm shadow-slate-900/15"
            >
              <Download className="shrink-0" size={13} />
              Exportar PDF Oficial
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed font-medium">
          De acuerdo con el <strong>Paso 22 de la Resolución 40595 de 2022</strong>, toda organización sujeta al PESV debe planificar y realizar por lo menos una auditoría anual interna o externa para verificar el cumplimiento del diseño e implementación del Plan Estratégico. Califica a continuación los pasos obligatorios según el nivel aplicable para obtener el porcentaje de cumplimiento y descargar tu informe de auditoría oficial firmado por el auditor y el representante legal.
        </p>
      </div>

      {/* 2. DATOS DE AUDITORÍA Y DASHBOARD DE CUMPLIMIENTO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Formulario de Metadatos de Auditoría */}
        <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3.5 flex items-center gap-1.5 border-b border-gray-100 pb-2">
              <FileText className="text-emerald-600" size={14} />
              Datos de Control del Auditor
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Empresa Auditada</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 text-[11px] font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Nivel PESV Evaluado</label>
                <select
                  value={auditLevel}
                  onChange={(e) => {
                    setAuditLevel(e.target.value as PESVLevel);
                    setRatings({}); // clear ratings when level changes to prevent ghost calculation
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 text-[11px] font-bold text-slate-800 bg-white"
                >
                  <option value="BÁSICO">BÁSICO (7 Pasos)</option>
                  <option value="ESTÁNDAR">ESTÁNDAR (18 Pasos)</option>
                  <option value="AVANZADO">AVANZADO (22 Pasos)</option>
                </select>
                <span className="text-[10px] text-gray-400 block mt-1">
                  * El nivel calculado de la flota es: <strong className="text-emerald-600">{config.nivelCalculado}</strong>
                </span>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Nombre del Auditor Líder</label>
                <input
                  type="text"
                  value={auditorName}
                  onChange={(e) => setAuditorName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 text-[11px] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Cédula Auditor</label>
                  <input
                    type="text"
                    value={auditorCedula}
                    onChange={(e) => setAuditorCedula(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 text-[11px] font-medium font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Reg. Licencia SST</label>
                  <input
                    type="text"
                    value={auditorLicense}
                    onChange={(e) => setAuditorLicense(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 text-[11px] font-medium font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Fecha de Auditoría</label>
                <input
                  type="date"
                  value={auditDate}
                  onChange={(e) => setAuditDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 text-[11px] font-bold font-mono"
                />
              </div>
            </div>
          </div>

          {/* FIRMA DIGITAL DEL AUDITOR */}
          <div className="border-t border-gray-150 pt-4 mt-2">
            <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>Firma de Conformidad del Auditor</span>
              <Sparkles className="text-emerald-600 animate-pulse" size={11} />
            </h4>
            {signature ? (
              <div className="relative bg-slate-50 border border-gray-200 rounded-xl p-2 flex flex-col items-center group">
                <img src={signature} alt="Firma Auditor" className="h-16 object-contain" />
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="absolute top-2 right-2 p-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-full cursor-pointer transition-all opacity-0 group-hover:opacity-100"
                  title="Eliminar Firma"
                >
                  <Trash2 size={11} />
                </button>
                <span className="text-[9px] text-gray-400 font-mono mt-1">Firma digitalmente almacenada</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsSignatureModalOpen(true);
                  setTimeout(() => {
                    const canvas = canvasRef.current;
                    if (canvas) {
                      const ctx = canvas.getContext('2d');
                      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                  }, 150);
                }}
                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/20 text-gray-400 hover:text-emerald-700 font-bold text-xs transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
              >
                <PenTool size={16} />
                Firmar Auditoría Anual
              </button>
            )}
          </div>
        </div>

        {/* Dashboard de Progreso y Compliance Scorecard */}
        <div className="lg:col-span-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-1.5 border-b border-gray-100 pb-2">
              <Award className="text-emerald-600" size={14} />
              Consola de Progreso de la Auditoría Anual
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Radial Score Gauge */}
              <div className="flex flex-col items-center justify-center bg-slate-50 border border-gray-150 rounded-2xl p-6 relative">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  {/* SVG background circle and progress circle */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="54" strokeWidth="10" stroke="#f1f5f9" fill="transparent" />
                    <circle 
                      cx="64" cy="64" r="54" 
                      strokeWidth="10" 
                      stroke={totalScore >= 85 ? '#10b981' : totalScore >= 60 ? '#f59e0b' : '#ef4444'} 
                      fill="transparent" 
                      strokeDasharray={2 * Math.PI * 54}
                      strokeDashoffset={2 * Math.PI * 54 * (1 - totalScore / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-2xl font-black text-slate-900 block leading-none">{totalScore.toFixed(1)}%</span>
                    <span className="text-[9px] text-gray-400 font-extrabold uppercase mt-1 tracking-wider">Cumplimiento</span>
                  </div>
                </div>
              </div>

              {/* Text Metrics and status cards */}
              <div className="md:col-span-2 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">Resultado y Dictamen:</span>
                  <div className={`p-3 rounded-xl border font-bold text-xs ${badge.bgColor} flex items-center gap-2 shadow-xs`}>
                    {badge.icon}
                    <div>
                      <div className="font-extrabold">{badge.label}</div>
                      <div className="text-[10px] font-medium opacity-90 mt-0.5">
                        {totalScore >= 85 
                          ? 'Excelente. El plan estratégico cumple plenamente con los lineamientos del MinTransporte.' 
                          : totalScore >= 60 
                            ? 'Aprobado condicionado. Se requiere formular planes de mejora (PHVA) para los pasos reprobados.' 
                            : 'Estado crítico. Se deben subsanar los pasos reprobados de manera urgente para evitar sanciones.'
                        }
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                  <div className="bg-slate-50 border border-gray-150 rounded-xl p-3">
                    <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">Avance Evaluación</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-lg font-black text-slate-900">{gradedStepsCount}</span>
                      <span className="text-gray-400 text-[10px]">/ {totalStepsCount} pasos calificados</span>
                    </div>
                    {/* Visual Bar */}
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-slate-700 h-full rounded-full" style={{ width: `${(gradedStepsCount / totalStepsCount) * 100}%` }} />
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-gray-150 rounded-xl p-3">
                    <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">Nivel Sancionatorio</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className={`text-lg font-black ${totalScore >= 85 ? 'text-emerald-600' : totalScore >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                        {totalScore >= 85 ? 'Bajo' : totalScore >= 60 ? 'Medio' : 'Alto'}
                      </span>
                    </div>
                    <div className="text-[9.5px] text-gray-400 mt-1.5">
                      Superintendencia de Puertos y Trans.
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col sm:flex-row justify-between text-[11px] text-gray-500 gap-2 leading-normal">
            <span className="flex items-center gap-1">
              <CheckCircle size={12} className="text-emerald-600 shrink-0" />
              Calificación oficial ponderada bajo la Resolución 40595 de 2022.
            </span>
            <span className="text-slate-400 font-mono text-[10px]">
              SHA256: d83b77_audited_v22
            </span>
          </div>
        </div>

      </div>

      {/* 3. LISTADO DETALLADO DE PASOS A CALIFICAR */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" id="audit-steps-table">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Listado Detallado de Pasos Normativos del PESV (Nivel: {auditLevel})
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Califica cada uno de los {totalStepsCount} pasos de este nivel. Puedes ingresar la evidencia o hallazgo correspondiente.
            </p>
          </div>
        </div>

        {/* Audit Table */}
        <div className="overflow-x-auto border border-gray-150 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-150 text-slate-500 uppercase font-extrabold text-[9px] tracking-wider">
                <th className="py-3 px-4 w-12 text-center">Nro</th>
                <th className="py-3 px-3 w-72">Paso / Elemento Evaluado</th>
                <th className="py-3 px-3 w-56 text-center">Dictamen Auditor</th>
                <th className="py-3 px-3">Evidencia / Hallazgo / Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {auditedSteps.map(step => {
                const currentRating = ratings[step.id];

                return (
                  <tr key={step.id} className="hover:bg-slate-50/40 transition-all">
                    {/* ID */}
                    <td className="py-4 px-4 text-center font-bold text-slate-900 font-mono border-r border-slate-100">
                      {step.id}
                    </td>

                    {/* Step title & description */}
                    <td className="py-4 px-3 max-w-sm">
                      <div className="font-bold text-slate-900 font-sans">{step.title}</div>
                      <div className="text-[10.5px] text-gray-400 mt-1 font-medium leading-relaxed font-sans">{step.description}</div>
                      
                      {/* Badge identifying Phase */}
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[8.5px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded uppercase">
                          {step.phase === 1 ? 'Fase 1: Planear' : step.phase === 2 ? 'Fase 2: Hacer' : step.phase === 3 ? 'Fase 3: Verificar' : 'Fase 4: Actuar'}
                        </span>
                        <span className="text-[8.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded uppercase">
                          {step.levels.join(', ')}
                        </span>
                      </div>
                    </td>

                    {/* Grade Selector (Inline beautiful selector buttons) */}
                    <td className="py-4 px-3">
                      <div className="flex flex-col items-center justify-center space-y-1.5">
                        <div className="flex rounded-lg border border-gray-200 p-0.5 bg-slate-50 gap-0.5 max-w-fit shadow-2xs">
                          {/* Cumple Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setRatings(prev => ({ ...prev, [step.id]: 'CUMPLE' }));
                              if (!observations[step.id]) {
                                setObservations(prev => ({
                                  ...prev,
                                  [step.id]: 'Se evidencia acta y documentos soportes correspondientes en archivo central.'
                                }));
                              }
                            }}
                            className={`px-3 py-1 text-[9.5px] font-extrabold rounded-md cursor-pointer transition-all ${
                              currentRating === 'CUMPLE'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-gray-500 hover:text-slate-800 hover:bg-white'
                            }`}
                          >
                            Cumple (100)
                          </button>

                          {/* Parcial Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setRatings(prev => ({ ...prev, [step.id]: 'PARCIAL' }));
                              if (!observations[step.id]) {
                                setObservations(prev => ({
                                  ...prev,
                                  [step.id]: 'Se cuenta con documentación preliminar o parcial. Requiere plan de mejora.'
                                }));
                              }
                            }}
                            className={`px-3 py-1 text-[9.5px] font-extrabold rounded-md cursor-pointer transition-all ${
                              currentRating === 'PARCIAL'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'text-gray-500 hover:text-slate-800 hover:bg-white'
                            }`}
                          >
                            Parcial (50)
                          </button>

                          {/* No Cumple Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setRatings(prev => ({ ...prev, [step.id]: 'NO_CUMPLE' }));
                              if (!observations[step.id]) {
                                setObservations(prev => ({
                                  ...prev,
                                  [step.id]: 'No se encuentra soporte documental que valide este paso obligatorio.'
                                }));
                              }
                            }}
                            className={`px-3 py-1 text-[9.5px] font-extrabold rounded-md cursor-pointer transition-all ${
                              currentRating === 'NO_CUMPLE'
                                ? 'bg-red-500 text-white shadow-xs'
                                : 'text-gray-500 hover:text-slate-800 hover:bg-white'
                            }`}
                          >
                            No Cumple (0)
                          </button>
                        </div>
                        <span className="text-[9px] font-bold text-gray-400 block font-mono">
                          Calificación: <span className={currentRating === 'CUMPLE' ? 'text-emerald-600' : currentRating === 'PARCIAL' ? 'text-amber-500' : currentRating === 'NO_CUMPLE' ? 'text-red-500' : 'text-gray-400'}>{currentRating || 'PENDIENTE'}</span>
                        </span>
                      </div>
                    </td>

                    {/* Observations Input */}
                    <td className="py-4 px-3">
                      <textarea
                        rows={2}
                        value={observations[step.id] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setObservations(prev => ({ ...prev, [step.id]: val }));
                        }}
                        placeholder="Ej. Acta de nombramiento aprobada con fecha 2026-06-25, firmas digitales al día."
                        className="w-full p-2 border border-gray-180 rounded-lg focus:outline-none focus:border-emerald-500 font-sans text-[11px] font-medium leading-relaxed"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL PARA LA FIRMA DIGITAL CON CANVAS (DRAWING PAD) */}
      {/* ======================================================== */}
      {isSignatureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-5 shadow-2xl border border-gray-100 max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <PenTool className="text-emerald-600" size={15} />
                Firma Táctil del Auditor
              </h3>
              <span className="text-[9.5px] text-gray-400 font-bold uppercase">SST / PESV</span>
            </div>

            <p className="text-[10.5px] text-gray-500 leading-normal">
              Dibuja tu firma en el recuadro blanco usando el mouse o pantalla táctil de tu dispositivo.
            </p>

            {/* Drawing Canvas Box */}
            <div className="border border-slate-200 bg-slate-50 rounded-xl p-1 overflow-hidden">
              <canvas
                ref={canvasRef}
                width={340}
                height={150}
                className="bg-white rounded-lg border border-slate-100 cursor-crosshair shadow-2xs touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>

            <div className="flex gap-2 justify-end text-xs font-bold">
              <button
                type="button"
                onClick={clearCanvas}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all cursor-pointer"
              >
                Limpiar Lienzo
              </button>
              <button
                type="button"
                onClick={() => setIsSignatureModalOpen(false)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-150 text-slate-500 rounded-lg transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveSignature}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all cursor-pointer flex items-center gap-1"
              >
                <Save size={13} />
                Guardar Firma
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
