/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ChevronRight, HelpCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { PESVUser, PESVCompany } from '../types';

interface LoginModuleProps {
  onLogin: (user: PESVUser, companyId?: string) => void;
  companies: PESVCompany[];
}

export default function LoginModule({ onLogin, companies }: LoginModuleProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Password recovery states
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState<string | null>(null);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Clean inputs
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      setError('Por favor complete todos los campos de acceso.');
      return;
    }

    // Check Super Admin credentials requested:
    // Email: bladimir.torres@edu-flex.com
    // Contraseña: Kiki-2026*
    const expectedSuperPass = localStorage.getItem('pesv_super_password') || 'Kiki-2026*';
    if (cleanEmail === 'bladimir.torres@edu-flex.com' && (cleanPass === expectedSuperPass || cleanPass === 'Kiki-2026*')) {
      onLogin({
        email: 'bladimir.torres@edu-flex.com',
        role: 'SUPER_ADMIN',
        name: 'Super Administrador Bladimir Torres'
      });
      return;
    }

    // Search inside registered companies
    const matchingCompany = companies.find(c => c.adminEmail.toLowerCase() === cleanEmail);
    if (matchingCompany) {
      const validPassword = matchingCompany.adminPassword || 'admin';
      if (cleanPass === validPassword) {
        onLogin({
          email: matchingCompany.adminEmail,
          role: 'PESV_ADMIN',
          companyId: matchingCompany.id,
          name: `Administrador PESV - ${matchingCompany.name}`
        }, matchingCompany.id);
        return;
      }
    }

    // General error
    setError('Credenciales de acceso incorrectas. Por favor verifique e intente nuevamente.');
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    setRecoverySuccess(null);

    const cleanRecoveryEmail = recoveryEmail.trim().toLowerCase();
    if (!cleanRecoveryEmail || !cleanRecoveryEmail.includes('@')) {
      setRecoveryError('Por favor ingrese un correo electrónico válido.');
      return;
    }

    // Verify if email is associated with super admin or any company
    const isSuperAdmin = cleanRecoveryEmail === 'bladimir.torres@edu-flex.com';
    const companyExists = companies.some(c => c.adminEmail.toLowerCase() === cleanRecoveryEmail);

    if (isSuperAdmin || companyExists) {
      setRecoverySuccess(
        `¡Instrucciones enviadas! Hemos enviado un enlace de recuperación de contraseña a ${cleanRecoveryEmail} con las instrucciones para restablecer su clave.`
      );
    } else {
      // For safety, standard response, but we can give a helpful simulation
      setRecoverySuccess(
        `Si el correo ${cleanRecoveryEmail} se encuentra registrado en el sistema, recibirá un enlace de restablecimiento de contraseña en los próximos minutos.`
      );
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8" id="login-container">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-150 relative overflow-hidden" id="login-card">
        
        {/* Aesthetic Colombian-theme header line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-sky-500 to-amber-500" />

        {!isRecovering ? (
          <>
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-4 animate-pulse">
                <ShieldCheck size={28} />
              </div>
              <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-500 font-extrabold px-2.5 py-0.5 rounded uppercase tracking-wider">
                Resolución 40595 de 2022
              </span>
              <h2 className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
                Ingreso al Sistema PESV
              </h2>
              <p className="mt-1 text-xs text-gray-500 font-medium">
                Plataforma para el Plan Estratégico de Seguridad Vial
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-lg font-semibold animate-shake animate-duration-300" id="login-error-message">
                {error}
              </div>
            )}

            <form className="mt-6 space-y-4 text-xs font-semibold" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email-address" className="block text-gray-700 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                    <Mail size={14} />
                  </span>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium text-slate-800 bg-slate-50/50"
                    placeholder="ejemplo@empresa.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="block text-gray-700">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecovering(true);
                      setRecoverySuccess(null);
                      setRecoveryError(null);
                      setRecoveryEmail(email); // Prefill if they typed it
                    }}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    ¿Olvidó su contraseña?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                    <Lock size={14} />
                  </span>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium text-slate-800 bg-slate-50/50"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="login-submit-button"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/10 transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-2"
              >
                Acceder a la Plataforma
                <ChevronRight size={14} />
              </button>
            </form>
          </>
        ) : (
          /* PASSWORD RECOVERY FORM VIEW */
          <div className="space-y-4">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mb-4">
                <Lock size={28} />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Recuperación de Contraseña
              </h2>
              <p className="mt-1 text-xs text-gray-500 font-medium">
                Ingrese su correo electrónico registrado para recuperar el acceso a su cuenta PESV.
              </p>
            </div>

            {recoveryError && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-lg font-semibold">
                {recoveryError}
              </div>
            )}

            {recoverySuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-4 rounded-xl space-y-3">
                <div className="flex gap-2 items-start font-semibold">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <p>{recoverySuccess}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRecovering(false)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all text-xs cursor-pointer"
                >
                  Volver al Ingreso
                </button>
              </div>
            ) : (
              <form className="space-y-4 text-xs font-semibold" onSubmit={handleRecoverySubmit}>
                <div>
                  <label htmlFor="recovery-email" className="block text-gray-700 mb-1">
                    Correo Electrónico de Recuperación
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                      <Mail size={14} />
                    </span>
                    <input
                      id="recovery-email"
                      type="email"
                      required
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium text-slate-800 bg-slate-50/50"
                      placeholder="ejemplo@empresa.com"
                    />
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsRecovering(false)}
                    className="flex-1 py-2 px-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <ArrowLeft size={13} />
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-all cursor-pointer shadow-sm"
                  >
                    Enviar Enlace
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Legal Disclaimer Footnote */}
        <div className="text-[9.5px] text-gray-400 text-center leading-normal mt-6 border-t border-gray-100 pt-3">
          Sujeto a inspección, vigilancia y control de la <strong>Superintendencia de Puertos y Transporte</strong> de la República de Colombia.
        </div>

      </div>
    </div>
  );
}
