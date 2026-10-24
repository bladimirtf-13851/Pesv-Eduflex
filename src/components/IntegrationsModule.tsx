/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Driver, Vehicle, Inspection } from '../types';
import { SEED_DRIVERS, SEED_VEHICLES } from '../data';
import { 
  GraduationCap, ShieldAlert, CheckCircle, Wrench, AlertTriangle, RefreshCw, Send, Save, 
  FileSpreadsheet, PlusCircle, UserCheck, Lock, Unlock, ExternalLink, Settings, 
  ShieldCheck, Link, Cpu, Eye, QrCode, Smartphone, Calendar, Search, Filter, Trash2, 
  X, Download, Check, FileText, CheckSquare, Info, Signal, Wifi, Battery, FileUp, Sparkles, ClipboardCheck,
  Edit, Plus, Truck, Car
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface IntegrationsModuleProps {
  companyName?: string;
  companyNit?: string;
  companyLogo?: string;
}

export default function IntegrationsModule({
  companyName = 'Transportes Integrados de Colombia S.A.S.',
  companyNit = '901.452.883-1',
  companyLogo = ''
}: IntegrationsModuleProps = {}) {
  const [drivers, setDrivers] = useState<Driver[]>(() => {
    const saved = localStorage.getItem('pesv_drivers');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return SEED_DRIVERS;
  });
  
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('pesv_vehicles');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return SEED_VEHICLES;
  });
  
  // Selected conductor/vehicle for details
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(() => {
    const saved = localStorage.getItem('pesv_drivers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed[0];
      } catch (e) {}
    }
    return SEED_DRIVERS[0];
  });
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(() => {
    const saved = localStorage.getItem('pesv_vehicles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed[0];
      } catch (e) {}
    }
    return SEED_VEHICLES[0];
  });

  // Sync drivers list with localStorage to bridge with StepsModule diagnostic data
  useEffect(() => {
    localStorage.setItem('pesv_drivers', JSON.stringify(drivers));
  }, [drivers]);

  // Sync vehicles list with localStorage to bridge with StepsModule diagnostic data and maintain history
  useEffect(() => {
    localStorage.setItem('pesv_vehicles', JSON.stringify(vehicles));
  }, [vehicles]);

  // --- CRUD State for Conductores (Drivers) ---
  const [isDriverModalOpen, setIsDriverModalOpen] = useState<boolean>(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [driverForm, setDriverForm] = useState({
    name: '',
    cedula: '',
    role: 'Conductor de Operación',
    license: 'C2 - Camiones Rígidos',
    licenseCategory: 'C2',
    licenseExpiry: '2028-12-31',
    soatExpiry: '2027-12-31',
    tecnoExpiry: '2027-12-31',
    isContracted: true,
    documentStatus: 'Vigente' as 'Vigente' | 'Próximo a vencer' | 'Vencido'
  });

  const handleOpenAddDriver = () => {
    setEditingDriver(null);
    setDriverForm({
      name: '',
      cedula: '',
      role: 'Conductor de Operación',
      license: 'C2 - Camiones Rígidos',
      licenseCategory: 'C2',
      licenseExpiry: '2028-12-31',
      soatExpiry: '2027-12-31',
      tecnoExpiry: '2027-12-31',
      isContracted: true,
      documentStatus: 'Vigente'
    });
    setIsDriverModalOpen(true);
  };

  const handleOpenEditDriver = (d: Driver) => {
    setEditingDriver(d);
    setDriverForm({
      name: d.name,
      cedula: d.cedula,
      role: d.role,
      license: d.license,
      licenseCategory: d.licenseCategory || 'C2',
      licenseExpiry: d.licenseExpiry,
      soatExpiry: d.soatExpiry,
      tecnoExpiry: d.tecnoExpiry,
      isContracted: d.isContracted ?? true,
      documentStatus: d.documentStatus
    });
    setIsDriverModalOpen(true);
  };

  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverForm.name.trim() || !driverForm.cedula.trim()) {
      alert('Por favor complete el nombre y la cédula del conductor.');
      return;
    }

    const isExpired = new Date(driverForm.licenseExpiry) < new Date('2026-06-25') || 
                      new Date(driverForm.soatExpiry) < new Date('2026-06-25') || 
                      new Date(driverForm.tecnoExpiry) < new Date('2026-06-25');
    const isExpiring = new Date(driverForm.licenseExpiry) < new Date('2026-07-25') || 
                       new Date(driverForm.soatExpiry) < new Date('2026-07-25') || 
                       new Date(driverForm.tecnoExpiry) < new Date('2026-07-25');
    const calculatedStatus: 'Vigente' | 'Próximo a vencer' | 'Vencido' = isExpired ? 'Vencido' : isExpiring ? 'Próximo a vencer' : 'Vigente';

    if (editingDriver) {
      const updated = drivers.map(d => d.id === editingDriver.id ? {
        ...d,
        name: driverForm.name.trim(),
        cedula: driverForm.cedula.trim(),
        role: driverForm.role.trim(),
        license: driverForm.license.trim(),
        licenseCategory: driverForm.licenseCategory,
        licenseExpiry: driverForm.licenseExpiry,
        soatExpiry: driverForm.soatExpiry,
        tecnoExpiry: driverForm.tecnoExpiry,
        isContracted: driverForm.isContracted,
        documentStatus: calculatedStatus
      } : d);
      setDrivers(updated);
      if (selectedDriver?.id === editingDriver.id) {
        setSelectedDriver({
          ...selectedDriver,
          name: driverForm.name.trim(),
          cedula: driverForm.cedula.trim(),
          role: driverForm.role.trim(),
          license: driverForm.license.trim(),
          licenseCategory: driverForm.licenseCategory,
          licenseExpiry: driverForm.licenseExpiry,
          soatExpiry: driverForm.soatExpiry,
          tecnoExpiry: driverForm.tecnoExpiry,
          isContracted: driverForm.isContracted,
          documentStatus: calculatedStatus
        });
      }
    } else {
      const newD: Driver = {
        id: `D${String(drivers.length + 1).padStart(2, '0')}`,
        name: driverForm.name.trim(),
        cedula: driverForm.cedula.trim(),
        role: driverForm.role.trim(),
        license: driverForm.license.trim(),
        licenseCategory: driverForm.licenseCategory,
        licenseExpiry: driverForm.licenseExpiry,
        soatExpiry: driverForm.soatExpiry,
        tecnoExpiry: driverForm.tecnoExpiry,
        isContracted: driverForm.isContracted,
        trainingCourses: [],
        documentStatus: calculatedStatus
      };
      setDrivers([...drivers, newD]);
    }
    setIsDriverModalOpen(false);
  };

  const handleDeleteDriver = (id: string, name: string) => {
    if (window.confirm(`¿Está seguro de eliminar al conductor "${name}"?`)) {
      setDrivers(prev => prev.filter(d => d.id !== id));
      if (selectedDriver?.id === id) {
        setSelectedDriver(drivers.find(d => d.id !== id) || null);
      }
    }
  };

  // --- CRUD State for Vehículos (Vehicles) ---
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState<boolean>(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehicleForm, setVehicleForm] = useState({
    plate: '',
    type: 'Automóvil' as 'Moto' | 'Automóvil' | 'Camioneta' | 'Camión' | 'Bus',
    brand: '',
    model: '',
    year: 2023,
    assignedDriverId: '',
    assignedDriverName: '',
    lastMaintenanceDate: '2026-05-15',
    nextMaintenanceDate: '2026-11-15',
    maintenanceAlert: 'Al día' as 'Al día' | 'Mantenimiento Urgente' | 'Próximo Servicio',
    status: 'Operativo' as 'Operativo' | 'En Taller' | 'Inactivo'
  });

  const handleOpenAddVehicle = () => {
    setEditingVehicle(null);
    setVehicleForm({
      plate: '',
      type: 'Automóvil',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      assignedDriverId: drivers[0]?.id || '',
      assignedDriverName: drivers[0]?.name || '',
      lastMaintenanceDate: '2026-05-15',
      nextMaintenanceDate: '2026-11-15',
      maintenanceAlert: 'Al día',
      status: 'Operativo'
    });
    setIsVehicleModalOpen(true);
  };

  const handleOpenEditVehicle = (v: Vehicle) => {
    setEditingVehicle(v);
    setVehicleForm({
      plate: v.plate,
      type: v.type,
      brand: v.brand,
      model: v.model,
      year: v.year,
      assignedDriverId: v.assignedDriverId || '',
      assignedDriverName: v.assignedDriverName || '',
      lastMaintenanceDate: v.lastMaintenanceDate,
      nextMaintenanceDate: v.nextMaintenanceDate,
      maintenanceAlert: v.maintenanceAlert,
      status: v.status
    });
    setIsVehicleModalOpen(true);
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleForm.plate.trim()) {
      alert('Por favor ingrese la placa del vehículo.');
      return;
    }
    const cleanPlate = vehicleForm.plate.trim().toUpperCase();

    // Determine driver name from ID if provided
    let drName = vehicleForm.assignedDriverName;
    if (vehicleForm.assignedDriverId) {
      const foundDr = drivers.find(d => d.id === vehicleForm.assignedDriverId);
      if (foundDr) drName = foundDr.name;
    }

    if (editingVehicle) {
      const updated = vehicles.map(v => v.plate === editingVehicle.plate ? {
        ...v,
        plate: cleanPlate,
        type: vehicleForm.type,
        brand: vehicleForm.brand.trim(),
        model: vehicleForm.model.trim(),
        year: Number(vehicleForm.year),
        assignedDriverId: vehicleForm.assignedDriverId,
        assignedDriverName: drName,
        lastMaintenanceDate: vehicleForm.lastMaintenanceDate,
        nextMaintenanceDate: vehicleForm.nextMaintenanceDate,
        maintenanceAlert: vehicleForm.maintenanceAlert,
        status: vehicleForm.status
      } : v);
      setVehicles(updated);
      if (selectedVehicle?.plate === editingVehicle.plate) {
        setSelectedVehicle({
          ...selectedVehicle,
          plate: cleanPlate,
          type: vehicleForm.type,
          brand: vehicleForm.brand.trim(),
          model: vehicleForm.model.trim(),
          year: Number(vehicleForm.year),
          assignedDriverId: vehicleForm.assignedDriverId,
          assignedDriverName: drName,
          lastMaintenanceDate: vehicleForm.lastMaintenanceDate,
          nextMaintenanceDate: vehicleForm.nextMaintenanceDate,
          maintenanceAlert: vehicleForm.maintenanceAlert,
          status: vehicleForm.status
        });
      }
    } else {
      if (vehicles.some(v => v.plate === cleanPlate)) {
        alert('Ya existe un vehículo registrado con esta placa en el sistema.');
        return;
      }
      const newV: Vehicle = {
        plate: cleanPlate,
        type: vehicleForm.type,
        brand: vehicleForm.brand.trim() || 'Genérica',
        model: vehicleForm.model.trim() || 'Estándar',
        year: Number(vehicleForm.year),
        assignedDriverId: vehicleForm.assignedDriverId,
        assignedDriverName: drName,
        lastMaintenanceDate: vehicleForm.lastMaintenanceDate,
        nextMaintenanceDate: vehicleForm.nextMaintenanceDate,
        maintenanceAlert: vehicleForm.maintenanceAlert,
        inspections: [],
        status: vehicleForm.status
      };
      setVehicles([...vehicles, newV]);
    }
    setIsVehicleModalOpen(false);
  };

  const handleDeleteVehicle = (plate: string) => {
    if (window.confirm(`¿Está seguro de eliminar el vehículo con placa ${plate}?`)) {
      setVehicles(prev => prev.filter(v => v.plate !== plate));
      if (selectedVehicle?.plate === plate) {
        setSelectedVehicle(vehicles.find(v => v.plate !== plate) || null);
      }
    }
  };

  // Admin authentication and external integrations state (Paso 2. Integraciones Avanzadas)
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    return localStorage.getItem('pesv_admin_mode') === 'true';
  });
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');
  const [adminError, setAdminError] = useState<string>('');

  const [integrationMantenimiento, setIntegrationMantenimiento] = useState<boolean>(() => {
    return localStorage.getItem('pesv_int_mantenimiento') === 'true';
  });
  const [integrationCapacitaciones, setIntegrationCapacitaciones] = useState<boolean>(() => {
    return localStorage.getItem('pesv_int_capacitaciones') === 'true';
  });
  const [integrationSst, setIntegrationSst] = useState<boolean>(() => {
    return localStorage.getItem('pesv_int_sst') === 'true';
  });

  // Listen to training integration updates from Step 10
  useEffect(() => {
    const handleUpdate = () => {
      setIntegrationCapacitaciones(localStorage.getItem('pesv_int_capacitaciones') === 'true');
    };
    window.addEventListener('pesv_training_integration_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('pesv_training_integration_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleAdminAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput.trim().toLowerCase() === 'admin') {
      setIsAdminMode(true);
      localStorage.setItem('pesv_admin_mode', 'true');
      setAdminError('');
    } else {
      setAdminError('Contraseña incorrecta (pruebe con "admin").');
    }
  };

  const handleToggleMantenimiento = (checked: boolean) => {
    if (!isAdminMode) {
      alert('🔒 Acceso Restringido: Debe autenticarse como Administrador para activar esta integración.');
      return;
    }
    setIntegrationMantenimiento(checked);
    localStorage.setItem('pesv_int_mantenimiento', checked ? 'true' : 'false');
  };

  const handleToggleCapacitaciones = (checked: boolean) => {
    if (!isAdminMode) {
      alert('🔒 Acceso Restringido: Debe autenticarse como Administrador para activar esta integración.');
      return;
    }
    setIntegrationCapacitaciones(checked);
    localStorage.setItem('pesv_int_capacitaciones', checked ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('pesv_training_integration_updated', {
      detail: { enabled: checked }
    }));
  };

  const handleToggleSst = (checked: boolean) => {
    if (!isAdminMode) {
      alert('🔒 Acceso Restringido: Debe autenticarse como Administrador para activar esta integración.');
      return;
    }
    setIntegrationSst(checked);
    localStorage.setItem('pesv_int_sst', checked ? 'true' : 'false');
  };

  // Preoperational form state
  const [inspPlate, setInspPlate] = useState<string>(() => {
    return vehicles[0]?.plate || '';
  });
  const [inspector, setInspector] = useState<string>(() => {
    return drivers[0]?.name || '';
  });
  const [inspFrenos, setInspFrenos] = useState<boolean>(true);
  const [inspLuces, setInspLuces] = useState<boolean>(true);
  const [inspDireccion, setInspDireccion] = useState<boolean>(true);
  const [inspLlantas, setInspLlantas] = useState<boolean>(true);
  const [inspFluidos, setInspFluidos] = useState<boolean>(true);
  const [inspCinturones, setInspCinturones] = useState<boolean>(true);
  const [inspEspejos, setInspEspejos] = useState<boolean>(true);
  const [inspKit, setInspKit] = useState<boolean>(true);
  const [inspObs, setInspObs] = useState<string>('');
  const [lastSubmissionResult, setLastSubmissionResult] = useState<any | null>(null);

  // Mobile Simulator states
  const [isMobileSimulatorOpen, setIsMobileSimulatorOpen] = useState<boolean>(false);
  const [mobilePlate, setMobilePlate] = useState<string>(() => {
    return vehicles[0]?.plate || '';
  });
  const [mobileDriverName, setMobileDriverName] = useState<string>(() => {
    return drivers[0]?.name || '';
  });
  const [mobileDate, setMobileDate] = useState<string>('2026-06-25');
  const [mobileFrenos, setMobileFrenos] = useState<boolean>(true);
  const [mobileLuces, setMobileLuces] = useState<boolean>(true);
  const [mobileDireccion, setMobileDireccion] = useState<boolean>(true);
  const [mobileLlantas, setMobileLlantas] = useState<boolean>(true);
  const [mobileFluidos, setMobileFluidos] = useState<boolean>(true);
  const [mobileCinturones, setMobileCinturones] = useState<boolean>(true);
  const [mobileEspejos, setMobileEspejos] = useState<boolean>(true);
  const [mobileKit, setMobileKit] = useState<boolean>(true);
  const [mobileObs, setMobileObs] = useState<string>('');
  const [mobileSignature, setMobileSignature] = useState<string | undefined>(undefined);
  const [isMobileSuccess, setIsMobileSuccess] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  // Filters state for Tracking Panel
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterPlate, setFilterPlate] = useState<string>('');
  const [filterDriver, setFilterDriver] = useState<string>('');

  // Selected inspection for detailed visual report modal
  const [selectedInspectionForDetail, setSelectedInspectionForDetail] = useState<any | null>(null);

  // Signature pad canvas references
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);

  // Simple Canvas scribble drawer for the signature pad
  const startDrawing = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#0f172a'; // slate-900
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawingRef.current = true;
  };

  const draw = (e: any) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      setMobileSignature(canvas.toDataURL('image/png'));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setMobileSignature(undefined);
  };

  // General registration engine (common for admin and mobile)
  const registerInspection = (
    plate: string,
    driverName: string,
    dateString: string,
    items: {
      frenos: boolean;
      luces: boolean;
      direccion: boolean;
      llantas: boolean;
      cinturones: boolean;
      fluidos: boolean;
      espejos: boolean;
      kitCarretera: boolean;
    },
    observations: string,
    signatureData?: string
  ): boolean => {
    const isApproved = items.frenos && items.luces && items.direccion && items.llantas && items.fluidos && items.cinturones && items.espejos && items.kitCarretera;
    const currentVehicle = vehicles.find(v => v.plate === plate);

    if (!currentVehicle) return false;

    const newInspection: Inspection = {
      id: `I-${Date.now().toString().substring(7)}`,
      date: dateString,
      inspectorName: driverName,
      approved: isApproved,
      items: {
        frenos: items.frenos,
        luces: items.luces,
        direccion: items.direccion,
        llantas: items.llantas,
        cinturones: items.cinturones,
        fluidos: items.fluidos,
        espejos: items.espejos,
        kitCarretera: items.kitCarretera
      },
      observations: observations || (isApproved ? 'Inspección aprobada sin observaciones.' : 'Fallas mecánicas encontradas.'),
      signature: signatureData
    };

    // Bidirectional Integration Logic
    // If not approved (especially critical things like frenos, direccion or llantas), change vehicle status to "En Taller"
    // and maintenance warning to "Mantenimiento Urgente"
    const updatedVehicles = vehicles.map(v => {
      if (v.plate === plate) {
        const newInspections = [newInspection, ...v.inspections];
        return {
          ...v,
          inspections: newInspections,
          status: isApproved ? 'Operativo' as const : 'En Taller' as const,
          maintenanceAlert: isApproved ? 'Al día' as const : 'Mantenimiento Urgente' as const,
          nextMaintenanceDate: isApproved ? v.nextMaintenanceDate : dateString
        };
      }
      return v;
    });

    setVehicles(updatedVehicles);

    // Set interactive visual webhook response
    setLastSubmissionResult({
      success: true,
      approved: isApproved,
      plate: plate,
      driverName: driverName,
      date: dateString,
      otCreated: !isApproved,
      otNumber: !isApproved ? `OT-2026-${Math.floor(1000 + Math.random() * 9000)}` : null,
      assignedTaller: !isApproved ? 'Taller Central de Pesados Medellín' : null,
      blockReason: !isApproved ? 'Inspección preoperacional diaria REPROBADA por fallas críticas.' : null
    });

    // Update active selection
    const activeV = updatedVehicles.find(v => v.plate === plate);
    if (activeV) setSelectedVehicle(activeV);

    return true;
  };

  const handleInspectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = registerInspection(
      inspPlate,
      inspector,
      '2026-06-25',
      {
        frenos: inspFrenos,
        luces: inspLuces,
        direccion: inspDireccion,
        llantas: inspLlantas,
        cinturones: inspCinturones,
        fluidos: inspFluidos,
        espejos: inspEspejos,
        kitCarretera: inspKit
      },
      inspObs
    );

    if (success) {
      setInspObs('');
      // Show mini toast notification of receipt
      alert(`✓ Reporte de Inspección Registrado para la placa ${inspPlate}.`);
    }
  };

  // jsPDF High-Fidelity PDF report generator
  const handleDownloadPDF = (insp: any) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Elegant emerald bar representing corporate security
    doc.setFillColor(16, 185, 129); // Emerald color
    doc.rect(0, 0, 210, 18, 'F');

    // Title Block
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('REGISTRO DE INSPECCIÓN PREOPERACIONAL DIARIA DE VEHÍCULOS', 10, 11);

    // Company Logo in Header (Top Right)
    if (companyLogo && companyLogo.startsWith('data:image/')) {
      try {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(203, 213, 225);
        doc.rect(174, 2, 26, 20, 'FD');
        doc.addImage(companyLogo, 175.5, 3, 23, 18, undefined, 'FAST');
      } catch (e) {
        console.warn('No se pudo dibujar logo en PDF preoperacional:', e);
      }
    }

    // Header Metadata
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`${companyName.toUpperCase()} — NIT: ${companyNit}`, 10, 25);
    doc.setTextColor(55, 65, 81); // Dark Gray
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text('SISTEMA DE GESTIÓN DE SEGURIDAD VIAL (PESV) • Resolución 40595 de 2022 - Paso 16', 10, 30.5);

    doc.setFillColor(243, 244, 246);
    doc.rect(10, 36, 190, 22, 'F');
    doc.rect(10, 36, 190, 22, 'S');

    doc.setFont('helvetica', 'bold');
    doc.text(`CÓDIGO DE INSPECCIÓN:`, 13, 42);
    doc.text(`FECHA DE REPORTE:`, 13, 48);
    doc.text(`CONDUCTOR / INSPECTOR:`, 13, 54);

    doc.setFont('helvetica', 'normal');
    doc.text(insp.id || 'N/A', 60, 42);
    doc.text(insp.date || 'N/A', 60, 48);
    doc.text(insp.inspectorName || 'N/A', 60, 54);

    // Fetch corresponding vehicle specs
    const vInfo = vehicles.find(v => v.plate === (insp.vehiclePlate || insp.plate));
    
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS TÉCNICOS DEL VEHÍCULO', 10, 68);
    doc.line(10, 70, 200, 70);

    doc.setFont('helvetica', 'normal');
    doc.text(`Placa: ${insp.vehiclePlate || insp.plate || 'N/A'}`, 10, 76);
    doc.text(`Tipo de Unidad: ${vInfo?.type || 'N/A'}`, 10, 82);
    doc.text(`Marca y Línea: ${vInfo?.brand || 'N/A'}`, 100, 76);
    doc.text(`Modelo / Año: ${vInfo?.model || ''} - ${vInfo?.year || ''}`, 100, 82);

    // Checklist Header
    doc.setFont('helvetica', 'bold');
    doc.text('EVALUACIÓN E INSPECCIÓN DE SISTEMAS', 10, 94);

    doc.setFillColor(31, 41, 55); // charcoal
    doc.rect(10, 97, 190, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('SISTEMA EVALUADO', 15, 102);
    doc.text('DICTAMEN', 145, 102);
    doc.text('CRITICIDAD', 172, 102);

    doc.setTextColor(17, 24, 39);
    const checks = [
      { name: 'Sistema de Frenos de Servicio e Individual', val: insp.items?.frenos, crit: 'SÍ' },
      { name: 'Dirección, Terminales y Alineación', val: insp.items?.direccion, crit: 'SÍ' },
      { name: 'Llantas (Labrado, Presión y Rines)', val: insp.items?.llantas, crit: 'SÍ' },
      { name: 'Sistema de Luces (Altas, Bajas, Cruces, Freno, Reversa)', val: insp.items?.luces, crit: 'NO' },
      { name: 'Nivel de Fluidos (Refrigerante, Aceite, Frenos)', val: insp.items?.fluidos, crit: 'NO' },
      { name: 'Cinturones de Seguridad y Anclajes', val: insp.items?.cinturones, crit: 'NO' },
      { name: 'Espejos Retrovisores y Vidrio Parabrisas', val: insp.items?.espejos, crit: 'NO' },
      { name: 'Kit de Carretera Obligatorio Completo', val: insp.items?.kitCarretera, crit: 'NO' }
    ];

    let currentY = 111;
    checks.forEach((chk, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(10, currentY - 5, 190, 7, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.text(chk.name, 15, currentY);

      if (chk.val) {
        doc.setTextColor(16, 185, 129); // green
        doc.setFont('helvetica', 'bold');
        doc.text('CONFORME (PASÓ)', 145, currentY);
      } else {
        doc.setTextColor(239, 68, 68); // red
        doc.setFont('helvetica', 'bold');
        doc.text('REPROBADO (FALLÓ)', 145, currentY);
      }

      doc.setTextColor(75, 85, 99);
      doc.setFont('helvetica', chk.crit === 'SÍ' ? 'bold' : 'normal');
      doc.text(chk.crit, 175, currentY);

      doc.setTextColor(17, 24, 39);
      currentY += 7;
    });

    // Observations
    currentY += 3;
    doc.setFont('helvetica', 'bold');
    doc.text('OBSERVACIONES ADICIONALES:', 10, currentY);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(insp.observations || 'Vehículo operando bajo condiciones normales, sin novedades.', 185);
    doc.text(lines, 10, currentY + 6);

    // Verdict box
    currentY += 18;
    doc.setFillColor(insp.approved ? 240 : 254, insp.approved ? 253 : 242, insp.approved ? 250 : 242);
    doc.rect(10, currentY, 190, 16, 'F');
    doc.rect(10, currentY, 190, 16, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    if (insp.approved) {
      doc.setTextColor(5, 150, 105);
      doc.text('✓ APTO PARA RUTA - DESPACHO AUTORIZADO EN EL ERP CENTRAL', 15, currentY + 10);
    } else {
      doc.setTextColor(220, 38, 38);
      doc.text('✗ REPROBADO - VEHÍCULO INHABILITADO / ORDEN DE TRABAJO AUTOMÁTICA EMITIDA', 15, currentY + 10);
    }

    // Signatures
    currentY += 36;
    doc.line(10, currentY, 90, currentY);
    doc.line(120, currentY, 200, currentY);

    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);
    doc.setFont('helvetica', 'bold');
    doc.text('Firma Digital del Conductor', 10, currentY + 5);
    doc.text('Coordinador HSEQ / Autoridad Vial', 120, currentY + 5);

    // Add drawn signature if available
    if (insp.signature) {
      try {
        doc.addImage(insp.signature, 'PNG', 20, currentY - 17, 45, 14);
      } catch (err) {
        console.warn("Could not draw signature inside PDF", err);
      }
    } else {
      doc.setFont('courier', 'italic');
      doc.setFontSize(8);
      doc.text('Firmado Electrónicamente', 20, currentY - 4);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(156, 163, 175);
    doc.text('Copia fiel registrada en los repositorios de Tránsito y Transporte del sistema PESV.', 10, 280);
    doc.text('Carga probatoria válida conforme a los requerimientos de la Superintendencia de Puertos y Transporte.', 10, 284);

    doc.save(`Ficha_Inspeccion_${insp.vehiclePlate || insp.plate || 'Vehiculo'}_${insp.date}.pdf`);
  };

  const handleScanRunt = () => {
    const updated = drivers.map(d => {
      if (d.documentStatus === 'Vencido') {
        return {
          ...d,
          licenseExpiry: '2029-12-10',
          soatExpiry: '2027-06-25',
          tecnoExpiry: '2027-06-25',
          documentStatus: 'Vigente' as const
        };
      } else if (d.documentStatus === 'Próximo a vencer') {
        return {
          ...d,
          licenseExpiry: '2030-07-15',
          documentStatus: 'Vigente' as const
        };
      }
      return d;
    });
    setDrivers(updated);
    alert('Sincronización RUNT completada. ¡Se detectaron y actualizaron las renovaciones vigentes para todos los conductores en tiempo real!');
  };

  const handleNotifyDriver = (driver: Driver, docType: string) => {
    alert(`Enviando alerta automatizada al conductor ${driver.name} por WhatsApp/SMS:\n\n"Estimado conductor, su ${docType} se encuentra próximo a vencer o vencido (${docType === 'Licencia' ? driver.licenseExpiry : docType === 'SOAT' ? driver.soatExpiry : driver.tecnoExpiry}). Por favor, cargue su renovación en el portal PESV."`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="integrations-module-root">
      
      {/* SECCIÓN 1: Vencimiento y Gestión de Documentos de Conductores */}
      <div className="lg:col-span-12 bg-white rounded-xl shadow-sm border border-gray-100 p-6" id="doc-expirations-panel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ShieldAlert className="text-red-500" size={20} />
              Gestión de Conductores y Alertas de Vencimiento
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Control, edición y actualización de licencias, SOAT y revisiones técnico-mecánicas (Paso 9 y 11).</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-add-driver"
              onClick={handleOpenAddDriver}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer"
            >
              <Plus size={13} />
              Registrar Conductor
            </button>
            <button
              type="button"
              id="btn-re-verify-docs"
              onClick={handleScanRunt}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold text-xs rounded-lg bg-gray-50/50 cursor-pointer transition-all"
            >
              <RefreshCw size={12} />
              Escanear RUNT
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-100 font-bold">
                <th className="py-2.5 px-4 rounded-l-lg">Conductor / Cédula</th>
                <th className="py-2.5 px-3">Cargo / Rol</th>
                <th className="py-2.5 px-3">Licencia (Expira)</th>
                <th className="py-2.5 px-3">SOAT (Vence)</th>
                <th className="py-2.5 px-3">Técnico-Mecánica (Vence)</th>
                <th className="py-2.5 px-3 text-center">Estado General</th>
                <th className="py-2.5 px-4 rounded-r-lg text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {drivers.map(driver => {
                const isLicenseExpiring = new Date(driver.licenseExpiry) < new Date('2026-07-25');
                const isSoatExpiring = new Date(driver.soatExpiry) < new Date('2026-07-25');
                const isTecnoExpiring = new Date(driver.tecnoExpiry) < new Date('2026-07-25');

                const isLicenseExpired = new Date(driver.licenseExpiry) < new Date('2026-06-25');
                const isSoatExpired = new Date(driver.soatExpiry) < new Date('2026-06-25');
                const isTecnoExpired = new Date(driver.tecnoExpiry) < new Date('2026-06-25');

                return (
                  <tr key={driver.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      <div>{driver.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">{driver.cedula}</div>
                    </td>
                    <td className="py-3.5 px-3 text-gray-600">{driver.role}</td>
                    <td className="py-3.5 px-3">
                      <div className="font-medium text-gray-950">{driver.licenseCategory}</div>
                      <span className={`inline-block px-1.5 py-0.5 rounded-[4px] font-semibold text-[9px] mt-1 ${
                        isLicenseExpired ? 'bg-red-50 text-red-700 border border-red-100' : isLicenseExpiring ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {driver.licenseExpiry}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`inline-block px-1.5 py-0.5 rounded-[4px] font-semibold text-[9px] ${
                        isSoatExpired ? 'bg-red-50 text-red-700 border border-red-100' : isSoatExpiring ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {driver.soatExpiry}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`inline-block px-1.5 py-0.5 rounded-[4px] font-semibold text-[9px] ${
                        isTecnoExpired ? 'bg-red-50 text-red-700 border border-red-100' : isTecnoExpiring ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {driver.tecnoExpiry}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        driver.documentStatus === 'Vencido' ? 'bg-red-100 text-red-800' : driver.documentStatus === 'Próximo a vencer' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {driver.documentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditDriver(driver)}
                          title="Editar Conductor"
                          className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDriver(driver.id, driver.name)}
                          title="Eliminar Conductor"
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                        {(driver.documentStatus === 'Vencido' || driver.documentStatus === 'Próximo a vencer') && (
                          <button
                            type="button"
                            id={`btn-notify-driver-${driver.id}`}
                            onClick={() => handleNotifyDriver(driver, isLicenseExpiring ? 'Licencia' : 'SOAT')}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] rounded transition-all cursor-pointer shadow-xs ml-1"
                          >
                            Alerta
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECCIÓN 1.5: GESTIÓN Y PARQUE AUTOMOTOR DE VEHÍCULOS DE LA FLOTA */}
      <div className="lg:col-span-12 bg-white rounded-xl shadow-sm border border-gray-100 p-6" id="vehicles-management-panel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Truck className="text-emerald-600" size={20} />
              Gestión del Parque Automotor y Flota de Vehículos
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Control, edición y programación de mantenimientos preventivos y preoperacionales (Paso 16 y Paso 4).</p>
          </div>
          <button
            type="button"
            id="btn-add-vehicle"
            onClick={handleOpenAddVehicle}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Plus size={13} />
            Registrar Vehículo
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-100 font-bold">
                <th className="py-2.5 px-4 rounded-l-lg">Placa / Tipo</th>
                <th className="py-2.5 px-3">Marca / Modelo</th>
                <th className="py-2.5 px-3">Año</th>
                <th className="py-2.5 px-3">Conductor Asignado</th>
                <th className="py-2.5 px-3">Último Mantenimiento</th>
                <th className="py-2.5 px-3">Próximo Servicio</th>
                <th className="py-2.5 px-3 text-center">Estado Mantenimiento</th>
                <th className="py-2.5 px-3 text-center">Operatividad</th>
                <th className="py-2.5 px-4 rounded-r-lg text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vehicles.map(vehicle => {
                const isUrgent = vehicle.maintenanceAlert === 'Mantenimiento Urgente';
                const isWarning = vehicle.maintenanceAlert === 'Próximo Servicio';

                return (
                  <tr key={vehicle.plate} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-900 font-black border border-yellow-300 rounded font-mono text-[11px]">
                          {vehicle.plate}
                        </span>
                        <span className="text-gray-500 font-medium text-[11px]">{vehicle.type}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-gray-700 font-medium">{vehicle.brand} {vehicle.model}</td>
                    <td className="py-3.5 px-3 text-gray-600">{vehicle.year}</td>
                    <td className="py-3.5 px-3 text-gray-800 font-medium">
                      {vehicle.assignedDriverName || 'Sin asignar'}
                    </td>
                    <td className="py-3.5 px-3 text-gray-600 font-mono text-[11px]">{vehicle.lastMaintenanceDate}</td>
                    <td className="py-3.5 px-3 font-mono text-[11px] font-bold text-gray-900">{vehicle.nextMaintenanceDate}</td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        isUrgent ? 'bg-red-100 text-red-800 border border-red-200' : isWarning ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {vehicle.maintenanceAlert}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        vehicle.status === 'Operativo' ? 'bg-blue-50 text-blue-700 border border-blue-100' : vehicle.status === 'En Taller' ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditVehicle(vehicle)}
                          title="Editar Vehículo"
                          className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVehicle(vehicle.plate)}
                          title="Eliminar Vehículo"
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL EDICIÓN / CREACIÓN DE CONDUCTOR */}
      {isDriverModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-150 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="text-emerald-600" size={18} />
                {editingDriver ? 'Editar Datos del Conductor' : 'Registrar Nuevo Conductor'}
              </h3>
              <button
                type="button"
                onClick={() => setIsDriverModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveDriver} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-gray-700 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={driverForm.name}
                    onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white font-medium"
                    placeholder="Ej. Carlos Alberto Restrepo"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Cédula / Documento *</label>
                  <input
                    type="text"
                    required
                    value={driverForm.cedula}
                    onChange={(e) => setDriverForm({ ...driverForm, cedula: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white font-mono"
                    placeholder="Ej. CC 71.345.890"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Cargo / Rol</label>
                  <input
                    type="text"
                    value={driverForm.role}
                    onChange={(e) => setDriverForm({ ...driverForm, role: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white"
                    placeholder="Ej. Conductor Carga Pesada"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Categoría Licencia</label>
                  <select
                    value={driverForm.licenseCategory}
                    onChange={(e) => setDriverForm({ ...driverForm, licenseCategory: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-bold"
                  >
                    <option value="A1">A1 (Motocicletas hasta 125cc)</option>
                    <option value="A2">A2 (Motocicletas &gt;125cc)</option>
                    <option value="B1">B1 (Automóviles particulares)</option>
                    <option value="B2">B2 (Camiones particulares)</option>
                    <option value="B3">B3 (Articulados particulares)</option>
                    <option value="C1">C1 (Automóviles públicos/van)</option>
                    <option value="C2">C2 (Camiones rígidos públicos)</option>
                    <option value="C3">C3 (Tractocamiones articulados)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Vencimiento Licencia</label>
                  <input
                    type="date"
                    required
                    value={driverForm.licenseExpiry}
                    onChange={(e) => setDriverForm({ ...driverForm, licenseExpiry: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Vencimiento SOAT</label>
                  <input
                    type="date"
                    required
                    value={driverForm.soatExpiry}
                    onChange={(e) => setDriverForm({ ...driverForm, soatExpiry: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Vencimiento Técnico-Mecánica</label>
                  <input
                    type="date"
                    required
                    value={driverForm.tecnoExpiry}
                    onChange={(e) => setDriverForm({ ...driverForm, tecnoExpiry: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="driver-is-contracted"
                  checked={driverForm.isContracted}
                  onChange={(e) => setDriverForm({ ...driverForm, isContracted: e.target.checked })}
                  className="rounded text-emerald-600"
                />
                <label htmlFor="driver-is-contracted" className="font-semibold text-gray-700">
                  Conductor Vinculado Directamente (Contratado)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setIsDriverModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Check size={14} />
                  {editingDriver ? 'Guardar Cambios' : 'Registrar Conductor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDICIÓN / CREACIÓN DE VEHÍCULO */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-150 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Truck className="text-slate-800" size={18} />
                {editingVehicle ? `Editar Vehículo [${editingVehicle.plate}]` : 'Registrar Nuevo Vehículo en la Flota'}
              </h3>
              <button
                type="button"
                onClick={() => setIsVehicleModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Placa del Vehículo *</label>
                  <input
                    type="text"
                    required
                    value={vehicleForm.plate}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, plate: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white font-mono font-black uppercase text-sm tracking-wider"
                    placeholder="Ej. ABC-123"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Tipo de Vehículo</label>
                  <select
                    value={vehicleForm.type}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-bold"
                  >
                    <option value="Moto">Motocicleta</option>
                    <option value="Automóvil">Automóvil / Sedán</option>
                    <option value="Camioneta">Camioneta SUV / Pick-up</option>
                    <option value="Camión">Camión Rígido / Carga</option>
                    <option value="Bus">Bus / Microbús Pasajeros</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-bold text-gray-700 mb-1">Marca</label>
                  <input
                    type="text"
                    value={vehicleForm.brand}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg"
                    placeholder="Ej. Kenworth"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block font-bold text-gray-700 mb-1">Modelo / Línea</label>
                  <input
                    type="text"
                    value={vehicleForm.model}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg"
                    placeholder="Ej. T800"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block font-bold text-gray-700 mb-1">Año</label>
                  <input
                    type="number"
                    min="1990"
                    max="2030"
                    value={vehicleForm.year}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Conductor Asignado</label>
                <select
                  value={vehicleForm.assignedDriverId}
                  onChange={(e) => {
                    const drId = e.target.value;
                    const dr = drivers.find(d => d.id === drId);
                    setVehicleForm({
                      ...vehicleForm,
                      assignedDriverId: drId,
                      assignedDriverName: dr ? dr.name : ''
                    });
                  }}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-medium"
                >
                  <option value="">-- Sin conductor asignado --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.cedula})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Último Mantenimiento</label>
                  <input
                    type="date"
                    value={vehicleForm.lastMaintenanceDate}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, lastMaintenanceDate: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Próximo Mantenimiento</label>
                  <input
                    type="date"
                    value={vehicleForm.nextMaintenanceDate}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, nextMaintenanceDate: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Alerta Mantenimiento</label>
                  <select
                    value={vehicleForm.maintenanceAlert}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, maintenanceAlert: e.target.value as any })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-bold"
                  >
                    <option value="Al día">Al día (Verde)</option>
                    <option value="Próximo Servicio">Próximo Servicio (Amarillo)</option>
                    <option value="Mantenimiento Urgente">Mantenimiento Urgente (Rojo)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Estado Operativo</label>
                  <select
                    value={vehicleForm.status}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-bold"
                  >
                    <option value="Operativo">Operativo (En servicio)</option>
                    <option value="En Taller">En Taller (Mantenimiento)</option>
                    <option value="Inactivo">Inactivo / Fuera de servicio</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Check size={14} />
                  {editingVehicle ? 'Guardar Cambios' : 'Registrar Vehículo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECCIÓN ECOSISTEMA DE INTEGRACIONES (AI STUDIO) */}
      <div className="lg:col-span-12 bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6" id="ai-studio-integrations-panel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <Cpu className="text-sky-600" size={20} />
              Ecosistema de Integraciones Satélites (Paso 2 / Nivel Avanzado)
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Administre la sincronización de flujos de datos en tiempo real con las aplicaciones satélites homologadas del PESV.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdminMode ? (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 animate-pulse">
                <Unlock size={10} /> MODO ADMINISTRADOR ACTIVO
              </span>
            ) : (
              <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                <Lock size={10} /> ACCESO SOLO LECTURA
              </span>
            )}
          </div>
        </div>

        {/* CONTROLES DE SEGURIDAD / ACCESO DE ADMINISTRADOR */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-50 rounded-xl p-5 border border-slate-200/60">
          <div className="md:col-span-5 space-y-2">
            <div className="flex items-center gap-2">
              {isAdminMode ? (
                <Unlock className="text-emerald-600" size={18} />
              ) : (
                <Lock className="text-amber-600" size={18} />
              )}
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                Control de Privilegios Administrativos
              </h3>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              De acuerdo con la reglamentación de seguridad vial, la activación de túneles de comunicación API externa con aplicativos de terceros está estrictamente restringida al <strong>Administrador PESV</strong> de la organización.
            </p>
          </div>

          <div className="md:col-span-7 flex flex-col justify-center">
            {isAdminMode ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-emerald-950 font-medium">
                  ✓ Sesión de administración autenticada. Los controles de activación de API están desbloqueados.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminMode(false);
                    localStorage.setItem('pesv_admin_mode', 'false');
                    setAdminPasswordInput('');
                    setAdminError('');
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-950 text-white font-bold text-[10px] rounded-lg transition-all cursor-pointer whitespace-nowrap"
                >
                  Bloquear Controles
                </button>
              </div>
            ) : (
              <form onSubmit={handleAdminAuthSubmit} className="flex flex-col sm:flex-row items-center gap-3">
                <div className="w-full relative">
                  <input
                    type="password"
                    placeholder="Contraseña de Administrador (pruebe con 'admin')"
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    className="w-full p-2.5 pl-3 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:border-sky-600 font-mono"
                  />
                  {adminError && (
                    <span className="text-[10px] text-red-600 block mt-1 font-semibold">{adminError}</span>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1 whitespace-nowrap"
                >
                  <Unlock size={12} />
                  Autenticar Admin
                </button>
              </form>
            )}
          </div>
        </div>

        {/* GRILLA DE INTEGRACIONES DISPONIBLES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* INTEGRACIÓN 1 */}
          <div className={`border rounded-xl p-4.5 transition-all flex flex-col justify-between space-y-4 ${
            integrationMantenimiento ? 'border-sky-500 bg-sky-50/10 shadow-sm' : 'border-gray-200 bg-gray-50/50'
          }`}>
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="bg-sky-100 p-2 rounded-lg text-sky-700">
                  <Wrench size={18} />
                </div>
                <div className="flex items-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={integrationMantenimiento}
                      onChange={(e) => handleToggleMantenimiento(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
                  </label>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-900 leading-snug">Plan de Mantenimientos</h4>
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                  Sincronización en tiempo real del estado de mantenimiento preventivo y correctivo de la flota.
                </p>
              </div>

              <div className="bg-slate-100/80 rounded border border-gray-200 p-1.5 text-[10px] font-mono break-all select-all text-slate-600">
                <span className="text-slate-400 block text-[8px] font-bold uppercase">App URL:</span>
                https://plan-de-mantenimientos-production.up.railway.app
              </div>
            </div>

            <div className="pt-2 border-t border-gray-150/60 flex items-center justify-between text-[10px]">
              <span className={`font-bold flex items-center gap-1 ${integrationMantenimiento ? 'text-sky-700' : 'text-gray-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${integrationMantenimiento ? 'bg-sky-600 animate-pulse' : 'bg-gray-300'}`} />
                {integrationMantenimiento ? 'Canal API Activo' : 'Inactivo'}
              </span>
              <a
                href="https://plan-de-mantenimientos-production.up.railway.app"
                target="_blank"
                rel="noreferrer"
                className="text-sky-600 hover:text-sky-850 font-bold flex items-center gap-0.5 hover:underline"
              >
                Ver App <ExternalLink size={10} />
              </a>
            </div>
          </div>

          {/* INTEGRACIÓN 2 */}
          <div className={`border rounded-xl p-4.5 transition-all flex flex-col justify-between space-y-4 ${
            integrationCapacitaciones ? 'border-sky-500 bg-sky-50/10 shadow-sm' : 'border-gray-200 bg-gray-50/50'
          }`}>
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="bg-emerald-100 p-2 rounded-lg text-emerald-700">
                  <GraduationCap size={18} />
                </div>
                <div className="flex items-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={integrationCapacitaciones}
                      onChange={(e) => handleToggleCapacitaciones(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
                  </label>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-900 leading-snug">Plan de Capacitaciones HSEQ</h4>
                  <span className="text-[9px] font-black px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                    Paso 10 PESV
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                  Control y registro automatizado del plan de capacitación obligatoria y específica para conductores conforme a la Res. 40595.
                </p>
              </div>

              <div className="bg-slate-100/80 rounded border border-gray-200 p-1.5 text-[10px] font-mono break-all select-all text-slate-600">
                <span className="text-slate-400 block text-[8px] font-bold uppercase">App URL:</span>
                https://plan-de-capacitaciones-production-eeba.up.railway.app
              </div>

              <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200 rounded p-1.5 text-[10px]">
                <span className="text-emerald-900 font-medium">Gestionar cursos y competencias:</span>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('pesv_target_step_id', '10');
                    window.dispatchEvent(new CustomEvent('pesv_navigate_tab', { detail: { tab: 'classification' } }));
                    window.dispatchEvent(new CustomEvent('pesv_activate_step', { detail: { stepId: 10 } }));
                  }}
                  className="font-black text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                >
                  Configurar en Paso 10 →
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-150/60 flex items-center justify-between text-[10px]">
              <span className={`font-bold flex items-center gap-1 ${integrationCapacitaciones ? 'text-sky-700' : 'text-gray-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${integrationCapacitaciones ? 'bg-sky-600 animate-pulse' : 'bg-gray-300'}`} />
                {integrationCapacitaciones ? 'Canal API Activo' : 'Inactivo'}
              </span>
              <a
                href="https://plan-de-capacitaciones-production-eeba.up.railway.app"
                target="_blank"
                rel="noreferrer"
                className="text-sky-600 hover:text-sky-850 font-bold flex items-center gap-0.5 hover:underline"
              >
                Ver App <ExternalLink size={10} />
              </a>
            </div>
          </div>

          {/* INTEGRACIÓN 3 */}
          <div className={`border rounded-xl p-4.5 transition-all flex flex-col justify-between space-y-4 ${
            integrationSst ? 'border-sky-500 bg-sky-50/10 shadow-sm' : 'border-gray-200 bg-gray-50/50'
          }`}>
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="bg-purple-100 p-2 rounded-lg text-purple-700">
                  <ShieldCheck size={18} />
                </div>
                <div className="flex items-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={integrationSst}
                      onChange={(e) => handleToggleSst(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
                  </label>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-900 leading-snug">Indicadores de SST</h4>
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                  Consolidación de estadísticas e indicadores del Sistema de Gestión de Seguridad y Salud en el Trabajo.
                </p>
              </div>

              <div className="bg-slate-100/80 rounded border border-gray-200 p-1.5 text-[10px] font-mono break-all select-all text-slate-600">
                <span className="text-slate-400 block text-[8px] font-bold uppercase">App URL:</span>
                https://indicadores-sst-production.up.railway.app
              </div>
            </div>

            <div className="pt-2 border-t border-gray-150/60 flex items-center justify-between text-[10px]">
              <span className={`font-bold flex items-center gap-1 ${integrationSst ? 'text-sky-700' : 'text-gray-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${integrationSst ? 'bg-sky-600 animate-pulse' : 'bg-gray-300'}`} />
                {integrationSst ? 'Canal API Activo' : 'Inactivo'}
              </span>
              <a
                href="https://indicadores-sst-production.up.railway.app"
                target="_blank"
                rel="noreferrer"
                className="text-sky-600 hover:text-sky-850 font-bold flex items-center gap-0.5 hover:underline"
              >
                Ver App <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </div>

        {/* LOG DE SIMULACIÓN SI ALGUNA DE LAS INTEGRACIONES ESTÁ ACTIVA */}
        {(integrationMantenimiento || integrationCapacitaciones || integrationSst) && (
          <div className="bg-slate-900 text-slate-300 p-4 rounded-lg border border-slate-950 font-mono text-[10px] space-y-2">
            <div className="text-slate-500 border-b border-slate-800 pb-1 flex justify-between items-center">
              <span>SINCRO-LOGS: CANALES DE INTEGRACIÓN SATÉLITE</span>
              <span className="text-sky-400 animate-pulse">● Conectado</span>
            </div>
            <div className="space-y-1">
              {integrationMantenimiento && (
                <div className="text-sky-300">
                  [MANTENIMIENTO] Conexión establecida con Plan de Mantenimientos. Sincronizando órdenes de trabajo y estados preventivos...
                </div>
              )}
              {integrationCapacitaciones && (
                <div className="text-emerald-300">
                  [CAPACITACIONES] Conexión activa con Plan de Capacitaciones HSEQ. Sincronizando base de asistencia y certificados de conductores en tiempo real...
                </div>
              )}
              {integrationSst && (
                <div className="text-purple-300">
                  [SST] Sincronización exitosa. Indicadores y estadísticas del Sistema de Gestión cargados bidireccionalmente.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECCIÓN 4: Formulario de Inspección Preoperacional Diaria (Simulador de Integración) */}
      <div className="lg:col-span-12 bg-white rounded-xl shadow-sm border border-gray-100 p-6" id="preoperational-form-panel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-gray-100 pb-3 gap-2">
          <div>
            <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <ClipboardCheck className="text-emerald-600" size={20} />
              Reportar Inspección Preoperacional Diaria (Paso 16)
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">
              Sincronización de inspecciones viales obligatorias conforme a la Resolución 40595 de 2022.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setIsMobileSimulatorOpen(true);
                setIsMobileSuccess(false);
                setMobileObs('');
                setMobileSignature(undefined);
                setTimeout(() => {
                  const canvas = canvasRef.current;
                  if (canvas) {
                    const ctx = canvas.getContext('2d');
                    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
                  }
                }, 100);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer shadow-sm"
            >
              <Smartphone size={13} />
              Simular Celular Conductor
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* COLUMNA 1: COMPARTIR FORMULARIO (QR) */}
          <div className="lg:col-span-4 bg-slate-50 border border-slate-150 rounded-xl p-5 flex flex-col justify-between" id="qr-sharing-box">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <QrCode className="text-slate-700" size={18} />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Compartir Formulario (QR)
                </h3>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Los conductores pueden escanear este código QR en el patio de despachos o cabina para abrir el formulario de control diario directamente en sus teléfonos móviles.
              </p>

              {/* BRANDED SVG QR CODE */}
              <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs max-w-[170px] mx-auto group hover:shadow-md transition-all relative">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Outer positions */}
                  <rect x="0" y="0" width="22" height="22" fill="#0f172a" />
                  <rect x="2" y="2" width="18" height="18" fill="#fff" />
                  <rect x="5" y="5" width="12" height="12" fill="#10b981" />

                  <rect x="78" y="0" width="22" height="22" fill="#0f172a" />
                  <rect x="80" y="2" width="18" height="18" fill="#fff" />
                  <rect x="83" y="5" width="12" height="12" fill="#10b981" />

                  <rect x="0" y="78" width="22" height="22" fill="#0f172a" />
                  <rect x="2" y="80" width="18" height="18" fill="#fff" />
                  <rect x="5" y="83" width="12" height="12" fill="#10b981" />

                  {/* Timing & Alignment */}
                  <rect x="32" y="5" width="5" height="5" fill="#0f172a" />
                  <rect x="44" y="5" width="5" height="5" fill="#0f172a" />
                  <rect x="56" y="5" width="5" height="5" fill="#0f172a" />
                  <rect x="5" y="32" width="5" height="5" fill="#0f172a" />
                  <rect x="5" y="44" width="5" height="5" fill="#0f172a" />
                  <rect x="5" y="56" width="5" height="5" fill="#0f172a" />

                  <rect x="70" y="70" width="8" height="8" fill="#0f172a" />
                  <rect x="72" y="72" width="4" height="4" fill="#fff" />

                  {/* Random pixels for standard QR code density */}
                  <path d="M 28,28 H 35 V 32 H 30 V 42 H 28 Z M 48,25 H 58 V 32 H 52 V 40 H 48 Z M 28,48 H 38 V 58 H 32 V 65 H 28 Z M 58,58 H 68 V 70 H 62 V 75 H 58 Z M 42,72 H 52 V 85 H 48 V 90 H 42 Z M 72,28 H 85 V 32 H 80 V 40 H 72 Z M 40,45 H 45 V 50 H 40 Z M 62,35 H 68 V 40 H 62 Z M 70,50 H 75 V 55 H 70 Z M 25,72 H 32 V 75 H 25 Z M 80,60 H 88 V 65 H 80 Z" fill="#0f172a" />
                  
                  {/* Custom Center Logo Overlay */}
                  <rect x="37" y="37" width="26" height="26" fill="#fff" rx="4" />
                  <circle cx="50" cy="50" r="10" fill="#059669" />
                  {/* Steering Wheel inside Center */}
                  <circle cx="50" cy="50" r="7" fill="none" stroke="#fff" strokeWidth="1.5" />
                  <line x1="50" y1="40" x2="50" y2="60" stroke="#fff" strokeWidth="1.5" />
                  <line x1="40" y1="50" x2="60" y2="50" stroke="#fff" strokeWidth="1.5" />
                </svg>
                
                {/* Floating Scan Action on Hover */}
                <div className="absolute inset-0 bg-emerald-600/95 rounded-xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-all cursor-pointer p-2"
                  onClick={() => {
                    setIsMobileSimulatorOpen(true);
                    setIsMobileSuccess(false);
                    setMobileObs('');
                    setMobileSignature(undefined);
                  }}
                >
                  <Smartphone className="animate-bounce" size={24} />
                  <span className="text-[10px] font-extrabold tracking-wider uppercase mt-1.5 text-center">Abrir en Celular</span>
                </div>
              </div>

              {/* simulated portal URL */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Enlace del portal móvil:</span>
                <div className="flex gap-1.5">
                  <div className="bg-white border border-gray-200 rounded px-2 py-1 text-[9.5px] font-mono font-medium truncate flex-1 text-gray-600">
                    https://pesv.co/inspect/m?id=9ad7d6e9
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://pesv.co/inspect/m?id=9ad7d6e9`);
                      setCopiedToast(true);
                      setTimeout(() => setCopiedToast(false), 2000);
                    }}
                    className="p-1 px-2 bg-slate-800 hover:bg-slate-900 text-white rounded text-[10px] font-bold cursor-pointer relative"
                  >
                    {copiedToast ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-250/50 text-[10.5px] text-slate-500 font-medium flex items-center gap-1.5 leading-relaxed">
              <Sparkles className="text-emerald-600 shrink-0" size={12} />
              <span>Soporta escaneo físico de cámara y firmas táctiles.</span>
            </div>
          </div>

          {/* COLUMNA 2: REGISTRO MANUAL (ADMIN) */}
          <div className="lg:col-span-4 border border-gray-100 rounded-xl p-5" id="manual-admin-entry-box">
            <div className="flex items-center gap-2 mb-4">
              <Save className="text-slate-700" size={18} />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Registro Administrativo PESV
              </h3>
            </div>

            <form onSubmit={handleInspectSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Vehículo</label>
                  <select
                    id="select-inspect-vehicle"
                    value={inspPlate}
                    onChange={(e) => {
                      setInspPlate(e.target.value);
                      const v = vehicles.find(veh => veh.plate === e.target.value);
                      if (v) {
                        setInspector(v.assignedDriverName);
                      }
                    }}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded font-mono text-[11px] font-bold"
                  >
                    {vehicles.map(v => (
                      <option key={v.plate} value={v.plate}>{v.plate} ({v.type})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Inspector</label>
                  <input
                    type="text"
                    id="input-inspect-driver-name"
                    value={inspector}
                    onChange={(e) => setInspector(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-[11px] font-medium"
                    placeholder="Nombre del inspector"
                  />
                </div>
              </div>

              {/* Checklist Compact checkboxes */}
              <div>
                <span className="block text-gray-700 font-bold mb-1.5 uppercase tracking-wider text-[10px]">Sistemas de Seguridad</span>
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-150">
                  <label className="flex items-center gap-1.5 cursor-pointer p-1 rounded hover:bg-white text-[10.5px]">
                    <input
                      type="checkbox"
                      checked={inspFrenos}
                      onChange={(e) => setInspFrenos(e.target.checked)}
                      className="text-emerald-600 rounded"
                    />
                    <span className="font-medium text-gray-700">Frenos (Crítico)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer p-1 rounded hover:bg-white text-[10.5px]">
                    <input
                      type="checkbox"
                      checked={inspDireccion}
                      onChange={(e) => setInspDireccion(e.target.checked)}
                      className="text-emerald-600 rounded"
                    />
                    <span className="font-medium text-gray-700">Dirección (Crít.)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer p-1 rounded hover:bg-white text-[10.5px]">
                    <input
                      type="checkbox"
                      checked={inspLlantas}
                      onChange={(e) => setInspLlantas(e.target.checked)}
                      className="text-emerald-600 rounded"
                    />
                    <span className="font-medium text-gray-700">Llantas (Crít.)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer p-1 rounded hover:bg-white text-[10.5px]">
                    <input
                      type="checkbox"
                      checked={inspLuces}
                      onChange={(e) => setInspLuces(e.target.checked)}
                      className="text-emerald-600 rounded"
                    />
                    <span className="font-medium text-gray-700">Luces</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer p-1 rounded hover:bg-white text-[10.5px]">
                    <input
                      type="checkbox"
                      checked={inspFluidos}
                      onChange={(e) => setInspFluidos(e.target.checked)}
                      className="text-emerald-600 rounded"
                    />
                    <span className="font-medium text-gray-700">Fluidos Motor</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer p-1 rounded hover:bg-white text-[10.5px]">
                    <input
                      type="checkbox"
                      checked={inspCinturones}
                      onChange={(e) => setInspCinturones(e.target.checked)}
                      className="text-emerald-600 rounded"
                    />
                    <span className="font-medium text-gray-700">Cinturones</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer p-1 rounded hover:bg-white text-[10.5px]">
                    <input
                      type="checkbox"
                      checked={inspEspejos}
                      onChange={(e) => setInspEspejos(e.target.checked)}
                      className="text-emerald-600 rounded"
                    />
                    <span className="font-medium text-gray-700">Parabrisas</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer p-1 rounded hover:bg-white text-[10.5px]">
                    <input
                      type="checkbox"
                      checked={inspKit}
                      onChange={(e) => setInspKit(e.target.checked)}
                      className="text-emerald-600 rounded"
                    />
                    <span className="font-medium text-gray-700">Kit Carretera</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  value={inspObs}
                  onChange={(e) => setInspObs(e.target.value)}
                  placeholder="Detalles de inspección física..."
                  className="w-full px-2 py-1 border border-gray-200 rounded font-sans text-[11px]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Save size={13} />
                Guardar Reporte Manual
              </button>
            </form>
          </div>

          {/* COLUMNA 3: WEBHOOK RESPONSE TERMINAL */}
          <div className="lg:col-span-4 bg-slate-950 text-slate-300 p-5 rounded-xl border border-slate-900 font-mono text-xs flex flex-col justify-between" id="webhook-api-terminal">
            <div>
              <div className="flex justify-between items-center text-slate-500 border-b border-slate-800 pb-2 mb-3">
                <span className="text-[10px] uppercase font-semibold">Eventos de Integración API Satélite</span>
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              </div>

              {lastSubmissionResult ? (
                <div className="space-y-3.5 text-[11px]">
                  <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle size={13} />
                    <span>[POST RECEPCIÓN] Reporte preoperacional recibido.</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 block">POST /api/v1/pesv/inspection</span>
                    <div><span className="text-sky-400">Placa:</span> <span className="text-white font-bold">{lastSubmissionResult.plate}</span></div>
                    <div><span className="text-sky-400">Conductor:</span> <span className="text-white">{lastSubmissionResult.driverName}</span></div>
                    <div><span className="text-sky-400">Dictamen:</span> <span className={lastSubmissionResult.approved ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{lastSubmissionResult.approved ? 'APROBADO (OPERATIVO)' : 'FALLA CRÍTICA DETECTADA'}</span></div>
                  </div>

                  {lastSubmissionResult.otCreated ? (
                    <div className="bg-red-500/10 border border-red-500/30 p-2.5 rounded text-red-400 space-y-1">
                      <div className="font-extrabold uppercase tracking-wide flex items-center gap-1 text-[10px]">
                        <AlertTriangle size={13} />
                        OT Preventiva Automática Disparada
                      </div>
                      <p className="text-[10px] leading-relaxed text-red-300">
                        La API de mantenimiento ha inhabilitado este vehículo para despachos viales.
                      </p>
                      <div className="text-[9.5px] font-semibold text-slate-200 pt-1">
                        • OT Nro: {lastSubmissionResult.otNumber}
                        <br />• Workshop: Taller Pesados Medellín
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded text-emerald-400">
                      <div className="font-bold flex items-center gap-1 text-[10px]">
                        <CheckCircle size={13} />
                        DESPACHO AUTORIZADO
                      </div>
                      <p className="text-[10px] text-emerald-300 mt-1">
                        Vehículo cumple los estándares del PESV. Estado habilitado en ERP.
                      </p>
                    </div>
                  )}

                  <div className="text-[9.5px] text-slate-500">
                    Sincronización: {new Date().toISOString()}
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 italic py-14 text-center text-[11px] leading-relaxed">
                  Escanea el código QR, o haz clic en "Simular Celular Conductor" a la derecha para ver cómo la base de datos registra de forma bidireccional los reportes y bloquea despachos en tiempo real.
                </div>
              )}
            </div>

            <div className="text-[9px] text-slate-600 border-t border-slate-900 pt-2.5 mt-3">
              RESTful Protocol over HTTPS | Payload: JSON
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* PANEL DE SEGUIMIENTO Y REGISTRO HISTÓRICO */}
        {/* ========================================== */}
        <div className="mt-8 border-t border-gray-150 pt-6" id="inspections-tracking-section">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileSpreadsheet className="text-emerald-600" size={16} />
                Módulo de Seguimiento y Generación de Reportes
              </h3>
              <p className="text-[11.5px] text-gray-500 mt-0.5">
                Historial general consolidado de inspecciones diarias. Filtra reportes y exporta el documento oficial firmado.
              </p>
            </div>
          </div>

          {/* DYNAMIC KPI SCORECARD */}
          {(() => {
            const allInspecsFlat = vehicles.flatMap(v => 
              v.inspections.map(insp => ({
                ...insp,
                vehiclePlate: v.plate,
                vehicleType: v.type,
                vehicleBrand: v.brand
              }))
            );
            const totalInsps = allInspecsFlat.length;
            const approvedInsps = allInspecsFlat.filter(i => i.approved).length;
            const approvalRate = totalInsps > 0 ? Math.round((approvedInsps / totalInsps) * 100) : 100;
            const criticalRejects = allInspecsFlat.filter(i => !i.approved).length;
            const inactiveVehicles = vehicles.filter(v => v.status === 'En Taller').length;

            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                <div className="bg-slate-50 border border-gray-150 rounded-xl p-3.5">
                  <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">Total Inspecciones</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-xl font-black text-slate-900">{totalInsps}</span>
                    <span className="text-[9.5px] text-slate-500 font-semibold">formuladas</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-gray-150 rounded-xl p-3.5">
                  <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">Índice Aprobación</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-xl font-black text-emerald-600">{approvalRate}%</span>
                    <span className="text-[9.5px] text-slate-500 font-semibold">aptos</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-gray-150 rounded-xl p-3.5">
                  <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">Fallas Críticas</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className={`text-xl font-black ${criticalRejects > 0 ? 'text-red-600' : 'text-slate-600'}`}>{criticalRejects}</span>
                    <span className="text-[9.5px] text-slate-500 font-semibold">reportadas</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-gray-150 rounded-xl p-3.5">
                  <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">En Taller (Bloqueados)</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className={`text-xl font-black ${inactiveVehicles > 0 ? 'text-amber-600' : 'text-slate-600'}`}>{inactiveVehicles}</span>
                    <span className="text-[9.5px] text-slate-500 font-semibold">vehículos</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* REAL-TIME FILTER BAR */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end text-xs">
            <div>
              <label className="block text-gray-600 font-bold mb-1 uppercase tracking-wider text-[9.5px] flex items-center gap-1">
                <Calendar size={11} className="text-emerald-600" />
                Filtrar por Fecha:
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full p-2 bg-white border border-gray-200 rounded text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-gray-600 font-bold mb-1 uppercase tracking-wider text-[9.5px] flex items-center gap-1">
                <Search size={11} className="text-emerald-600" />
                Buscador por Placa:
              </label>
              <input
                type="text"
                value={filterPlate}
                onChange={(e) => setFilterPlate(e.target.value.toUpperCase())}
                placeholder="Ej. SXT-420"
                className="w-full p-2 bg-white border border-gray-200 rounded text-xs font-mono font-bold placeholder-gray-400 uppercase"
              />
            </div>

            <div>
              <label className="block text-gray-600 font-bold mb-1 uppercase tracking-wider text-[9.5px] flex items-center gap-1">
                <Search size={11} className="text-emerald-600" />
                Buscador por Conductor:
              </label>
              <input
                type="text"
                value={filterDriver}
                onChange={(e) => setFilterDriver(e.target.value)}
                placeholder="Ej. Carlos Restrepo"
                className="w-full p-2 bg-white border border-gray-200 rounded text-xs font-medium placeholder-gray-400"
              />
            </div>

            <div>
              <button
                type="button"
                onClick={() => {
                  setFilterDate('');
                  setFilterPlate('');
                  setFilterDriver('');
                }}
                className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded text-xs transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <Trash2 size={12} />
                Limpiar Filtros
              </button>
            </div>
          </div>

          {/* DYNAMIC REPORTS LIST TABLE */}
          <div className="overflow-x-auto border border-gray-150 rounded-xl bg-white shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-gray-150 font-bold uppercase text-[9px] tracking-wider">
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-3">Vehículo</th>
                  <th className="py-3 px-3">Conductor / Inspector</th>
                  <th className="py-3 px-3 text-center">Chequeo de Sistemas (8)</th>
                  <th className="py-3 px-3 text-center">Resultado Verdict</th>
                  <th className="py-3 px-3">Observaciones</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {(() => {
                  // Flatten & Filter inspections
                  const flatFiltered = vehicles.flatMap(v => 
                    v.inspections.map(insp => ({
                      ...insp,
                      vehiclePlate: v.plate,
                      vehicleType: v.type,
                      vehicleBrand: v.brand
                    }))
                  ).filter(insp => {
                    const matchesDate = filterDate ? insp.date === filterDate : true;
                    const matchesPlate = filterPlate ? insp.vehiclePlate.includes(filterPlate) : true;
                    const matchesDriver = filterDriver ? insp.inspectorName.toLowerCase().includes(filterDriver.toLowerCase()) : true;
                    return matchesDate && matchesPlate && matchesDriver;
                  }).sort((a, b) => b.date.localeCompare(a.date));

                  if (flatFiltered.length === 0) {
                    return (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-gray-400 italic">
                          No se encontraron inspecciones diarias registradas que coincidan con los filtros aplicados.
                        </td>
                      </tr>
                    );
                  }

                  return flatFiltered.map(insp => (
                    <tr key={insp.id} className="hover:bg-slate-50/60 transition-all">
                      <td className="py-3.5 px-4 text-gray-900 font-semibold font-mono whitespace-nowrap">
                        {insp.date}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-gray-950 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-gray-200">{insp.vehiclePlate}</span>
                        <div className="text-[10px] text-gray-500 mt-0.5">{insp.vehicleType}</div>
                      </td>
                      <td className="py-3.5 px-3 text-gray-800">
                        {insp.inspectorName}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center justify-center gap-1">
                          {/* Render visual bullet indicators for passing/failing checks */}
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-extrabold border ${insp.items?.frenos ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`} title="Frenos">FR</span>
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-extrabold border ${insp.items?.direccion ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`} title="Dirección">DI</span>
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-extrabold border ${insp.items?.llantas ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`} title="Llantas">LL</span>
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-extrabold border ${insp.items?.luces ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`} title="Luces">LU</span>
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-extrabold border ${insp.items?.fluidos ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`} title="Fluidos">FL</span>
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-extrabold border ${insp.items?.cinturones ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`} title="Cinturones">CI</span>
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-extrabold border ${insp.items?.espejos ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`} title="Vidrios">ES</span>
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-extrabold border ${insp.items?.kitCarretera ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`} title="Kit Carretera">KI</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-extrabold ${insp.approved ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                          {insp.approved ? '✓ Aprobado (Apto)' : '✗ Falla Crítica'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 max-w-[150px] truncate text-gray-500 font-sans" title={insp.observations}>
                        {insp.observations}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedInspectionForDetail(insp)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded text-[10.5px] transition-all cursor-pointer inline-flex items-center gap-0.5"
                        >
                          <Eye size={11} /> Detalle
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadPDF(insp)}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded text-[10.5px] border border-emerald-200 transition-all cursor-pointer inline-flex items-center gap-0.5"
                        >
                          <Download size={11} /> PDF
                        </button>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ======================================================= */}
      {/* MODAL SMARTPHONE SIMULATOR (CELLPHONE VIEWPORT MOCKUP) */}
      {/* ======================================================= */}
      {isMobileSimulatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative bg-slate-950 rounded-[45px] p-4.5 shadow-2xl border-4 border-slate-800 max-w-[360px] w-full flex flex-col h-[670px] my-auto">
            {/* Phone Top Notch / Speaker & Camera */}
            <div className="absolute top-2.5 left-1/2 transform -translate-x-1/2 w-32 h-5 bg-slate-950 rounded-b-xl flex items-center justify-center z-30">
              <div className="w-10 h-1 bg-slate-800 rounded-full" />
              <div className="w-2.5 h-2.5 bg-slate-900 rounded-full ml-3 border border-slate-800" />
            </div>

            {/* Simulated Phone Screen Area */}
            <div className="bg-slate-50 flex-1 rounded-[30px] overflow-hidden flex flex-col relative pt-6 border border-slate-900">
              
              {/* Mobile Top Status Bar */}
              <div className="px-5 py-1.5 flex justify-between items-center text-[10px] text-slate-700 font-bold bg-white/90 backdrop-blur-md absolute top-0 left-0 right-0 z-20 border-b border-gray-150">
                <span>08:45 AM</span>
                <div className="flex items-center gap-1.5">
                  <Signal size={10} className="text-slate-800" />
                  <Wifi size={10} className="text-slate-800" />
                  <Battery size={10} className="text-slate-800" />
                </div>
              </div>

              {/* Success Overlay View inside mobile device */}
              {isMobileSuccess ? (
                <div className="flex-1 bg-white p-5 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 animate-scale-up">
                    <CheckCircle size={36} />
                  </div>
                  <h3 className="text-sm font-black text-slate-900">¡REPORTE TRANSMITIDO!</h3>
                  <p className="text-[11px] text-gray-500 leading-relaxed px-2">
                    La ficha de inspección diaria preoperacional para el vehículo <strong className="font-mono text-slate-800">{mobilePlate}</strong> ha sido cargada con éxito en el sistema central de transportes.
                  </p>
                  <div className="bg-slate-50 rounded-lg p-2.5 text-[9px] font-mono text-slate-500 w-full text-left">
                    • Hash SHA256: central-api-sec32...
                    <br />• Conductor: {mobileDriverName}
                    <br />• Estado: { (mobileFrenos && mobileLuces && mobileDireccion && mobileLlantas && mobileFluidos && mobileCinturones && mobileEspejos && mobileKit) ? 'APROBADO' : 'OT GENERADA EN TALLER' }
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileSimulatorOpen(false)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cerrar Simulador
                  </button>
                </div>
              ) : (
                /* Mobile App Scrollable Web Form */
                <div className="flex-1 overflow-y-auto p-4 space-y-4 pt-4 text-xs font-medium">
                  {/* Driver Header */}
                  <div className="bg-emerald-600 rounded-xl p-3 text-white text-center space-y-0.5 shadow-xs">
                    <h4 className="font-bold text-xs tracking-wider">PORTAL DEL CONDUCTOR</h4>
                    <p className="text-[9.5px] opacity-90">Inspección Preoperacional Obligatoria</p>
                  </div>

                  {/* Fields Block */}
                  <div className="space-y-2.5 bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
                    <div>
                      <label className="block text-gray-600 font-bold mb-1 uppercase tracking-wider text-[9px]">Placa de Vehículo:</label>
                      <select
                        value={mobilePlate}
                        onChange={(e) => {
                          setMobilePlate(e.target.value);
                          const v = vehicles.find(veh => veh.plate === e.target.value);
                          if (v) setMobileDriverName(v.assignedDriverName);
                        }}
                        className="w-full p-2 bg-slate-50 border border-gray-200 rounded font-mono font-bold text-xs text-slate-900"
                      >
                        {vehicles.map(v => (
                          <option key={v.plate} value={v.plate}>{v.plate} ({v.type})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-600 font-bold mb-1 uppercase tracking-wider text-[9px]">Nombre de Conductor:</label>
                      <input
                        type="text"
                        value={mobileDriverName}
                        onChange={(e) => setMobileDriverName(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-gray-200 rounded font-semibold text-xs text-slate-900"
                        placeholder="Nombre completo del conductor"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-600 font-bold mb-1 uppercase tracking-wider text-[9px]">Fecha del Reporte:</label>
                      <input
                        type="date"
                        value={mobileDate}
                        onChange={(e) => setMobileDate(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-gray-200 rounded text-xs font-semibold"
                      />
                    </div>
                  </div>

                  {/* Checklist switches */}
                  <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs space-y-3">
                    <span className="block text-slate-800 font-black uppercase tracking-wider text-[9.5px] border-b pb-1.5 border-gray-100">Evaluación de Sistemas</span>
                    
                    <div className="space-y-2.5">
                      {/* FRENOS */}
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700 text-[10.5px]">Sistema de Frenos:</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-extrabold uppercase ${mobileFrenos ? 'text-emerald-600' : 'text-red-500'}`}>{mobileFrenos ? 'OK' : 'Falla'}</span>
                          <button
                            type="button"
                            onClick={() => setMobileFrenos(!mobileFrenos)}
                            className={`w-10 h-5.5 rounded-full transition-all relative ${mobileFrenos ? 'bg-emerald-500' : 'bg-red-500'}`}
                          >
                            <span className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full transition-all ${mobileFrenos ? 'right-0.5' : 'left-0.5'}`} />
                          </button>
                        </div>
                      </div>

                      {/* DIRECCION */}
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700 text-[10.5px]">Dirección Hidráulica:</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-extrabold uppercase ${mobileDireccion ? 'text-emerald-600' : 'text-red-500'}`}>{mobileDireccion ? 'OK' : 'Falla'}</span>
                          <button
                            type="button"
                            onClick={() => setMobileDireccion(!mobileDireccion)}
                            className={`w-10 h-5.5 rounded-full transition-all relative ${mobileDireccion ? 'bg-emerald-500' : 'bg-red-500'}`}
                          >
                            <span className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full transition-all ${mobileDireccion ? 'right-0.5' : 'left-0.5'}`} />
                          </button>
                        </div>
                      </div>

                      {/* LLANTAS */}
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700 text-[10.5px]">Llantas y Labrado:</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-extrabold uppercase ${mobileLlantas ? 'text-emerald-600' : 'text-red-500'}`}>{mobileLlantas ? 'OK' : 'Falla'}</span>
                          <button
                            type="button"
                            onClick={() => setMobileLlantas(!mobileLlantas)}
                            className={`w-10 h-5.5 rounded-full transition-all relative ${mobileLlantas ? 'bg-emerald-500' : 'bg-red-500'}`}
                          >
                            <span className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full transition-all ${mobileLlantas ? 'right-0.5' : 'left-0.5'}`} />
                          </button>
                        </div>
                      </div>

                      {/* LUCES */}
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700 text-[10.5px]">Luces de Seguridad:</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-extrabold uppercase ${mobileLuces ? 'text-emerald-600' : 'text-red-500'}`}>{mobileLuces ? 'OK' : 'Falla'}</span>
                          <button
                            type="button"
                            onClick={() => setMobileLuces(!mobileLuces)}
                            className={`w-10 h-5.5 rounded-full transition-all relative ${mobileLuces ? 'bg-emerald-500' : 'bg-red-500'}`}
                          >
                            <span className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full transition-all ${mobileLuces ? 'right-0.5' : 'left-0.5'}`} />
                          </button>
                        </div>
                      </div>

                      {/* FLUIDOS */}
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700 text-[10.5px]">Niveles de Fluidos:</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-extrabold uppercase ${mobileFluidos ? 'text-emerald-600' : 'text-red-500'}`}>{mobileFluidos ? 'OK' : 'Falla'}</span>
                          <button
                            type="button"
                            onClick={() => setMobileFluidos(!mobileFluidos)}
                            className={`w-10 h-5.5 rounded-full transition-all relative ${mobileFluidos ? 'bg-emerald-500' : 'bg-red-500'}`}
                          >
                            <span className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full transition-all ${mobileFluidos ? 'right-0.5' : 'left-0.5'}`} />
                          </button>
                        </div>
                      </div>

                      {/* CINTURON */}
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700 text-[10.5px]">Cinturones de Seg.:</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-extrabold uppercase ${mobileCinturones ? 'text-emerald-600' : 'text-red-500'}`}>{mobileCinturones ? 'OK' : 'Falla'}</span>
                          <button
                            type="button"
                            onClick={() => setMobileCinturones(!mobileCinturones)}
                            className={`w-10 h-5.5 rounded-full transition-all relative ${mobileCinturones ? 'bg-emerald-500' : 'bg-red-500'}`}
                          >
                            <span className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full transition-all ${mobileCinturones ? 'right-0.5' : 'left-0.5'}`} />
                          </button>
                        </div>
                      </div>

                      {/* ESPEJOS */}
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700 text-[10.5px]">Parabrisas y Espejos:</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-extrabold uppercase ${mobileEspejos ? 'text-emerald-600' : 'text-red-500'}`}>{mobileEspejos ? 'OK' : 'Falla'}</span>
                          <button
                            type="button"
                            onClick={() => setMobileEspejos(!mobileEspejos)}
                            className={`w-10 h-5.5 rounded-full transition-all relative ${mobileEspejos ? 'bg-emerald-500' : 'bg-red-500'}`}
                          >
                            <span className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full transition-all ${mobileEspejos ? 'right-0.5' : 'left-0.5'}`} />
                          </button>
                        </div>
                      </div>

                      {/* KIT */}
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700 text-[10.5px]">Kit de Carretera:</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-extrabold uppercase ${mobileKit ? 'text-emerald-600' : 'text-red-500'}`}>{mobileKit ? 'OK' : 'Falla'}</span>
                          <button
                            type="button"
                            onClick={() => setMobileKit(!mobileKit)}
                            className={`w-10 h-5.5 rounded-full transition-all relative ${mobileKit ? 'bg-emerald-500' : 'bg-red-500'}`}
                          >
                            <span className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full transition-all ${mobileKit ? 'right-0.5' : 'left-0.5'}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Observations */}
                  <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs space-y-1.5">
                    <label className="block text-gray-600 font-bold uppercase tracking-wider text-[9px]">Observaciones:</label>
                    <textarea
                      rows={2}
                      value={mobileObs}
                      onChange={(e) => setMobileObs(e.target.value)}
                      placeholder="Indique si hay ruidos, fallos o faltantes..."
                      className="w-full p-2 border border-gray-200 rounded font-sans text-xs"
                    />
                  </div>

                  {/* SIGNATURE PAD CANVAS */}
                  <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-gray-600 font-bold uppercase tracking-wider text-[9px]">Firma Digital del Conductor:</label>
                      <button
                        type="button"
                        onClick={clearSignature}
                        className="text-[9px] font-bold text-red-500 uppercase tracking-widest cursor-pointer hover:underline"
                      >
                        Limpiar
                      </button>
                    </div>

                    <div className="border border-dashed border-gray-300 rounded-lg bg-gray-50 relative h-[75px] overflow-hidden">
                      <canvas
                        ref={canvasRef}
                        width={300}
                        height={75}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-full cursor-crosshair"
                      />
                      {!mobileSignature && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[10px] text-gray-400 italic">
                          Firme aquí usando mouse o dedo
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const success = registerInspection(
                        mobilePlate,
                        mobileDriverName,
                        mobileDate,
                        {
                          frenos: mobileFrenos,
                          luces: mobileLuces,
                          direccion: mobileDireccion,
                          llantas: mobileLlantas,
                          cinturones: mobileCinturones,
                          fluidos: mobileFluidos,
                          espejos: mobileEspejos,
                          kitCarretera: mobileKit
                        },
                        mobileObs,
                        mobileSignature
                      );

                      if (success) {
                        setIsMobileSuccess(true);
                        // Reset forms
                        setMobileObs('');
                      }
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Send size={12} />
                    Enviar Reporte en Vía
                  </button>
                </div>
              )}
            </div>

            {/* Simulated Phone Home Button */}
            <button
              type="button"
              onClick={() => setIsMobileSimulatorOpen(false)}
              className="absolute -right-3 top-24 w-1.5 h-12 bg-slate-800 rounded-l"
              title="Cerrar"
            />
            <div className="w-24 h-1 bg-slate-800 rounded-full mx-auto mt-2 cursor-pointer hover:bg-slate-700" onClick={() => setIsMobileSimulatorOpen(false)} />
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL VIEW REPORT DETAIL (COMPREHENSIVE OFFICIAL SHEET) */}
      {/* ======================================================= */}
      {selectedInspectionForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-gray-200 overflow-hidden text-xs text-slate-800 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-5 py-3.5 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold uppercase tracking-wider text-xs">Ficha Oficial de Inspección Preoperacional</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {selectedInspectionForDetail.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInspectionForDetail(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Report Content */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 font-medium">
              
              {/* Header Blocks */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
                <div>
                  <span className="text-[10px] text-gray-400 font-extrabold block uppercase tracking-wider">Fecha del Registro:</span>
                  <span className="text-slate-900 font-bold text-xs">{selectedInspectionForDetail.date}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-extrabold block uppercase tracking-wider">Placa del Vehículo:</span>
                  <span className="text-emerald-700 font-black text-xs font-mono">{selectedInspectionForDetail.vehiclePlate || selectedInspectionForDetail.plate}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-gray-400 font-extrabold block uppercase tracking-wider">Inspector / Conductor:</span>
                  <span className="text-slate-900 font-bold text-xs">{selectedInspectionForDetail.inspectorName}</span>
                </div>
              </div>

              {/* Systems Pass Fail Status Rows */}
              <div className="space-y-2">
                <span className="block text-slate-900 font-black uppercase tracking-wider text-[10px] border-b pb-1.5 border-gray-150">Chequeo Detallado de Sistemas</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  <div className="flex items-center justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-600 font-semibold">Sistema de Frenos (Crítico):</span>
                    <span className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold ${selectedInspectionForDetail.items?.frenos ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {selectedInspectionForDetail.items?.frenos ? 'APROBADO' : 'CON DEFECTO'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-600 font-semibold">Dirección Hidráulica (Crítico):</span>
                    <span className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold ${selectedInspectionForDetail.items?.direccion ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {selectedInspectionForDetail.items?.direccion ? 'APROBADO' : 'CON DEFECTO'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-600 font-semibold">Llantas y Rines (Crítico):</span>
                    <span className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold ${selectedInspectionForDetail.items?.llantas ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {selectedInspectionForDetail.items?.llantas ? 'APROBADO' : 'CON DEFECTO'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-600 font-semibold">Sistema de Luces:</span>
                    <span className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold ${selectedInspectionForDetail.items?.luces ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {selectedInspectionForDetail.items?.luces ? 'APROBADO' : 'CON DEFECTO'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-600 font-semibold">Fluidos de Motor:</span>
                    <span className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold ${selectedInspectionForDetail.items?.fluidos ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {selectedInspectionForDetail.items?.fluidos ? 'APROBADO' : 'CON DEFECTO'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-600 font-semibold">Cinturones de Seguridad:</span>
                    <span className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold ${selectedInspectionForDetail.items?.cinturones ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {selectedInspectionForDetail.items?.cinturones ? 'APROBADO' : 'CON DEFECTO'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-600 font-semibold">Parabrisas y Espejos:</span>
                    <span className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold ${selectedInspectionForDetail.items?.espejos ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {selectedInspectionForDetail.items?.espejos ? 'APROBADO' : 'CON DEFECTO'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-600 font-semibold">Kit Carretera Completo:</span>
                    <span className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold ${selectedInspectionForDetail.items?.kitCarretera ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {selectedInspectionForDetail.items?.kitCarretera ? 'APROBADO' : 'CON DEFECTO'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Verdict Verdict */}
              <div className={`p-4 rounded-xl border flex items-center gap-3 ${selectedInspectionForDetail.approved ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                {selectedInspectionForDetail.approved ? (
                  <>
                    <CheckCircle className="text-emerald-600 shrink-0" size={24} />
                    <div>
                      <h4 className="font-extrabold text-emerald-900 uppercase">Vehículo Autorizado</h4>
                      <p className="text-[10.5px] text-emerald-800 mt-0.5 font-medium">Cumple de manera idónea con las exigencias del Plan de Seguridad Vial para iniciar ruta.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="text-red-600 shrink-0" size={24} />
                    <div>
                      <h4 className="font-extrabold text-red-900 uppercase">Vehículo Bloqueado</h4>
                      <p className="text-[10.5px] text-red-800 mt-0.5 font-medium">Reprobado. Se inhabilitó el despacho y se disparó una orden de reparación en taller preventivo.</p>
                    </div>
                  </>
                )}
              </div>

              {/* Observaciones */}
              <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-gray-200">
                <span className="text-[9px] text-gray-400 font-extrabold block uppercase tracking-wider">Observaciones Registradas:</span>
                <p className="text-[11px] leading-relaxed text-slate-700 italic">
                  "{selectedInspectionForDetail.observations || 'Ninguna.'}"
                </p>
              </div>

              {/* Digital signature display */}
              {selectedInspectionForDetail.signature ? (
                <div className="space-y-1">
                  <span className="text-[9px] text-gray-400 font-extrabold block uppercase tracking-wider">Firma Conductor Digitalizada:</span>
                  <div className="border border-gray-200 rounded-lg bg-gray-50 max-w-[170px] p-1.5">
                    <img
                      src={selectedInspectionForDetail.signature}
                      alt="Firma"
                      className="max-h-[45px] object-contain mx-auto"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-[9.5px] text-slate-400 italic">
                  ✓ Reportado con Firma Electrónica Autenticada
                </div>
              )}
            </div>

            {/* Modal Footer with Actions */}
            <div className="bg-slate-50 border-t border-gray-150 p-4.5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedInspectionForDetail(null)}
                className="px-3.5 py-1.5 border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold rounded-lg cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPDF(selectedInspectionForDetail)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Download size={13} /> Descargar Reporte PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
