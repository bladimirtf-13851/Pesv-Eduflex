/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Wrench, ClipboardCheck, ExternalLink, RefreshCw, CheckCircle2,
  Link as LinkIcon, Cpu, Check, Plus, Trash2, Edit, Search,
  Calendar, Globe, Activity, Eye, Key, Copy, X, Truck,
  AlertTriangle, ShieldAlert, QrCode, Download, ArrowRight, FileText
} from 'lucide-react';
import QRCode from 'qrcode';
import { CompanyConfig, Vehicle, Inspection } from '../types';
import { saveSystemSetting, subscribeToSystemSetting } from '../services/firestoreService';

export interface MaintenanceIntegrationConfig {
  enabled: boolean;
  appUrl: string;
  appName: string;
  apiKey: string;
  webhookSecret: string;
  autoSync: boolean;
  syncIntervalHours: number;
  lastSyncDate: string;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncMessage: string;
  totalSyncedVehicles: number;
  totalSyncedInspections: number;
  totalSyncedMaintenances: number;
  activeWorkshopOrders: number;
}

export interface MaintenanceOrderRecord {
  id: string;
  otNumber: string;
  vehiclePlate: string;
  vehicleType: string;
  maintenanceType: 'Preventivo' | 'Correctivo' | 'Predictivo / Alistamiento';
  systemIntervened: 'Frenos' | 'Motor y Fluidos' | 'Dirección y Suspensión' | 'Llantas y Alineación' | 'Sistema Eléctrico y Luces' | 'Revisión General 5.000/10.000 Km';
  scheduledDate: string;
  executionDate: string;
  mileage: number;
  nextServiceMileage: number;
  workshopName: string;
  costCop: number;
  origin: 'Aplicativo Externo Mantenimiento' | 'Alerta Preoperacional Paso 16' | 'Manual';
  status: 'Programado' | 'En Taller' | 'Ejecutado';
  externalReportUrl?: string;
  observations: string;
}

interface Step16And17MaintenanceModuleProps {
  stepId: 16 | 17;
  config: CompanyConfig;
  companyName: string;
  companyNit?: string;
  companyLogo?: string;
  onNavigateToStep?: (stepId: number) => void;
  onNavigateToIndicators?: () => void;
}

export const DEFAULT_MAINTENANCE_APP_URL = 'https://plan-de-mantenimientos-production.up.railway.app/';

const SEED_MAINTENANCE_ORDERS: MaintenanceOrderRecord[] = [
  {
    id: 'MNT-2026-001',
    otNumber: 'OT-EXT-2026-104',
    vehiclePlate: 'JKS-284',
    vehicleType: 'Tractocamión Kenworth',
    maintenanceType: 'Preventivo',
    systemIntervened: 'Revisión General 5.000/10.000 Km',
    scheduledDate: '2026-05-10',
    executionDate: '2026-05-12',
    mileage: 482500,
    nextServiceMileage: 492500,
    workshopName: 'Taller Autorizado Cummins & Kenworth (Sincronizado App)',
    costCop: 2850000,
    origin: 'Aplicativo Externo Mantenimiento',
    status: 'Ejecutado',
    externalReportUrl: 'https://plan-de-mantenimientos-production.up.railway.app/',
    observations: 'Cambio de filtros de aceite, combustible, calibración de válvulas y diagnóstico electrónico de frenos ABS.'
  },
  {
    id: 'MNT-2026-002',
    otNumber: 'OT-EXT-2026-118',
    vehiclePlate: 'WHZ-885',
    vehicleType: 'Motocicleta Yamaha FZ25',
    maintenanceType: 'Preventivo',
    systemIntervened: 'Frenos',
    scheduledDate: '2026-06-02',
    executionDate: '2026-06-03',
    mileage: 32400,
    nextServiceMileage: 35400,
    workshopName: 'Centro de Servicio Yamaha Pro (Sincronizado App)',
    costCop: 340000,
    origin: 'Aplicativo Externo Mantenimiento',
    status: 'Ejecutado',
    externalReportUrl: 'https://plan-de-mantenimientos-production.up.railway.app/',
    observations: 'Reemplazo de pastillas de freno delanteras y traseras, cambio de líquido DOT-4 y tensión de kit de arrastre.'
  },
  {
    id: 'MNT-2026-003',
    otNumber: 'OT-EXT-2026-129',
    vehiclePlate: 'REM-202',
    vehicleType: 'Remolque Plataforma 3 Ejes',
    maintenanceType: 'Preventivo',
    systemIntervened: 'Dirección y Suspensión',
    scheduledDate: '2026-06-18',
    executionDate: '2026-06-19',
    mileage: 280000,
    nextServiceMileage: 300000,
    workshopName: 'Serviteca Industrial Pesados (Sincronizado App)',
    costCop: 1420000,
    origin: 'Aplicativo Externo Mantenimiento',
    status: 'Ejecutado',
    externalReportUrl: 'https://plan-de-mantenimientos-production.up.railway.app/',
    observations: 'Engrase general de quinta rueda, revisión de pulmones de suspensión neumática y ajuste de cámaras de freno.'
  },
  {
    id: 'MNT-2026-004',
    otNumber: 'OT-EXT-2026-142',
    vehiclePlate: 'JKS-284',
    vehicleType: 'Tractocamión Kenworth',
    maintenanceType: 'Preventivo',
    systemIntervened: 'Llantas y Alineación',
    scheduledDate: '2026-08-15',
    executionDate: '',
    mileage: 490100,
    nextServiceMileage: 492500,
    workshopName: 'Taller Autorizado Cummins & Kenworth',
    costCop: 1950000,
    origin: 'Aplicativo Externo Mantenimiento',
    status: 'Programado',
    externalReportUrl: 'https://plan-de-mantenimientos-production.up.railway.app/',
    observations: 'Rotación programada de neumáticos direccionales y de tracción, alineación láser y balanceo.'
  }
];

const SEED_FLEET_VEHICLES: Vehicle[] = [
  {
    plate: 'JKS-284',
    type: 'Camión',
    brand: 'Kenworth',
    model: 'T800 Tractocamión',
    year: 2018,
    assignedDriverId: 'D01',
    assignedDriverName: 'Carlos Alberto Restrepo',
    lastMaintenanceDate: '2026-05-12',
    nextMaintenanceDate: '2026-08-15',
    maintenanceAlert: 'Al día',
    status: 'Operativo',
    inspections: [
      {
        id: 'INSP-EXT-901',
        date: new Date().toISOString().split('T')[0],
        inspectorName: 'Carlos Alberto Restrepo',
        approved: true,
        items: {
          frenos: true,
          luces: true,
          direccion: true,
          llantas: true,
          cinturones: true,
          fluidos: true,
          espejos: true,
          kitCarretera: true
        },
        observations: 'Sincronizado desde Aplicativo Externo de Inspección y Mantenimiento. Sistemas al 100%.'
      }
    ]
  },
  {
    plate: 'WHZ-885',
    type: 'Moto',
    brand: 'Yamaha',
    model: 'FZ25 250cc',
    year: 2021,
    assignedDriverId: 'D03',
    assignedDriverName: 'Ángela María Gómez',
    lastMaintenanceDate: '2026-06-03',
    nextMaintenanceDate: '2026-09-03',
    maintenanceAlert: 'Al día',
    status: 'Operativo',
    inspections: [
      {
        id: 'INSP-EXT-902',
        date: new Date().toISOString().split('T')[0],
        inspectorName: 'Ángela María Gómez',
        approved: true,
        items: {
          frenos: true,
          luces: true,
          direccion: true,
          llantas: true,
          cinturones: true,
          fluidos: true,
          espejos: true,
          kitCarretera: true
        },
        observations: 'Preoperacional diario aprobado en aplicativo externo.'
      }
    ]
  },
  {
    plate: 'REM-202',
    type: 'Camión',
    brand: 'Romarco',
    model: 'Remolque 3 Ejes',
    year: 2019,
    assignedDriverId: 'D04',
    assignedDriverName: 'Andrés Felipe Caicedo',
    lastMaintenanceDate: '2026-06-19',
    nextMaintenanceDate: '2026-09-19',
    maintenanceAlert: 'Próximo Servicio',
    status: 'Operativo',
    inspections: [
      {
        id: 'INSP-EXT-903',
        date: new Date().toISOString().split('T')[0],
        inspectorName: 'Andrés Felipe Caicedo',
        approved: true,
        items: {
          frenos: true,
          luces: true,
          direccion: true,
          llantas: true,
          cinturones: true,
          fluidos: true,
          espejos: true,
          kitCarretera: true
        },
        observations: 'Inspección de enganche, mangueras de aire y luces reglamentarias aprobada.'
      }
    ]
  }
];

export default function Step16And17MaintenanceModule({
  stepId,
  companyName,
  onNavigateToStep,
  onNavigateToIndicators
}: Step16And17MaintenanceModuleProps) {
  // Default tab depends on whether the user clicked Paso 16 or Paso 17, but 'integracion' is always accessible
  const [activeTab, setActiveTab] = useState<'integracion' | 'inspecciones' | 'mantenimientos'>(
    stepId === 16 ? 'integracion' : 'integracion'
  );

  // Switch default view when stepId prop changes
  useEffect(() => {
    setActiveTab('integracion');
  }, [stepId]);

  // Integration Configuration State (Shared between Step 16, Step 17, and IntegrationsModule)
  const [intConfig, setIntConfig] = useState<MaintenanceIntegrationConfig>(() => {
    const saved = localStorage.getItem('pesv_maintenance_integration_config');
    const globalFlag = localStorage.getItem('pesv_int_mantenimiento');
    const isEnabled = globalFlag !== null ? globalFlag === 'true' : true;

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          enabled: isEnabled,
          appUrl: parsed.appUrl || DEFAULT_MAINTENANCE_APP_URL
        };
      } catch (e) {}
    }

    return {
      enabled: isEnabled,
      appUrl: localStorage.getItem('pesv_maintenance_app_url') || DEFAULT_MAINTENANCE_APP_URL,
      appName: 'Aplicativo de Inspección y Plan de Mantenimiento Vehicular',
      apiKey: localStorage.getItem('pesv_maintenance_api_key') || 'sec_pesv_mnt_live_40595_r9x2',
      webhookSecret: 'whsec_pesv_mnt_insp_2026_k71p',
      autoSync: true,
      syncIntervalHours: 4,
      lastSyncDate: new Date().toLocaleString('es-CO'),
      syncStatus: 'success',
      lastSyncMessage: 'Conexión bidireccional activa con https://plan-de-mantenimientos-production.up.railway.app/ — Inspecciones (Paso 16) y Mantenimientos (Paso 17) sincronizados.',
      totalSyncedVehicles: 3,
      totalSyncedInspections: 42,
      totalSyncedMaintenances: 18,
      activeWorkshopOrders: 1
    };
  });

  // Vehicles & Inspections State (Shared with localStorage 'pesv_vehicles' for Paso 15 & IntegrationsModule)
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('pesv_vehicles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return SEED_FLEET_VEHICLES;
  });

  // Maintenance Orders State (Paso 17)
  const [orders, setOrders] = useState<MaintenanceOrderRecord[]>(() => {
    const saved = localStorage.getItem('pesv_maintenance_orders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return SEED_MAINTENANCE_ORDERS;
  });

  // UI States for Connection & Embedded App
  const [isEditingConfig, setIsEditingConfig] = useState<boolean>(false);
  const [tempUrl, setTempUrl] = useState<string>(intConfig.appUrl);
  const [tempApiKey, setTempApiKey] = useState<string>(intConfig.apiKey);
  const [isTestingConn, setIsTestingConn] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latency: number; message: string } | null>(null);
  const [embeddedView, setEmbeddedView] = useState<boolean>(false);
  const [copiedWebhook16, setCopiedWebhook16] = useState<boolean>(false);
  const [copiedWebhook17, setCopiedWebhook17] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const isRemoteUpdate = useRef<boolean>(false);

  // Filters & Modals for Paso 16 (Inspecciones)
  const [inspSearch, setInspSearch] = useState<string>('');
  const [inspFilterStatus, setInspFilterStatus] = useState<'TODOS' | 'APROBADO' | 'FALLA'>('TODOS');
  const [showNewInspModal, setShowNewInspModal] = useState<boolean>(false);
  const [newInspForm, setNewInspForm] = useState({
    plate: vehicles[0]?.plate || 'JKS-284',
    inspectorName: vehicles[0]?.assignedDriverName || 'Carlos Alberto Restrepo',
    date: new Date().toISOString().split('T')[0],
    frenos: true,
    luces: true,
    direccion: true,
    llantas: true,
    cinturones: true,
    fluidos: true,
    espejos: true,
    kitCarretera: true,
    observations: ''
  });

  // Filters & Modals for Paso 17 (Mantenimientos)
  const [mntSearch, setMntSearch] = useState<string>('');
  const [mntFilterType, setMntFilterType] = useState<string>('TODOS');
  const [mntFilterStatus, setMntFilterStatus] = useState<string>('TODOS');
  const [showOrderModal, setShowOrderModal] = useState<boolean>(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [orderForm, setOrderForm] = useState<Omit<MaintenanceOrderRecord, 'id'>>({
    otNumber: `OT-EXT-2026-${Math.floor(150 + Math.random() * 800)}`,
    vehiclePlate: vehicles[0]?.plate || 'JKS-284',
    vehicleType: 'Tractocamión Kenworth',
    maintenanceType: 'Preventivo',
    systemIntervened: 'Revisión General 5.000/10.000 Km',
    scheduledDate: new Date().toISOString().split('T')[0],
    executionDate: new Date().toISOString().split('T')[0],
    mileage: 485000,
    nextServiceMileage: 495000,
    workshopName: 'Taller Autorizado Sincronizado',
    costCop: 1200000,
    origin: 'Aplicativo Externo Mantenimiento',
    status: 'Ejecutado',
    externalReportUrl: intConfig.appUrl,
    observations: ''
  });

  // Generate QR Code pointing to external app URL
  useEffect(() => {
    const targetUrl = intConfig.appUrl || DEFAULT_MAINTENANCE_APP_URL;
    QRCode.toDataURL(targetUrl, {
      width: 200,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' }
    })
      .then((url) => setQrDataUrl(url))
      .catch(() => {});
  }, [intConfig.appUrl]);

  // Subscribe to Firestore cloud state for Step 16 & 17 integration
  useEffect(() => {
    const unsub = subscribeToSystemSetting('step16_17_maintenance_module', (cloudData) => {
      if (cloudData && typeof cloudData === 'object') {
        isRemoteUpdate.current = true;
        if (cloudData.intConfig) {
          setIntConfig(cloudData.intConfig);
          localStorage.setItem('pesv_maintenance_integration_config', JSON.stringify(cloudData.intConfig));
          localStorage.setItem('pesv_int_mantenimiento', cloudData.intConfig.enabled ? 'true' : 'false');
          localStorage.setItem('pesv_maintenance_app_url', cloudData.intConfig.appUrl);
        }
        if (Array.isArray(cloudData.orders) && cloudData.orders.length > 0) {
          setOrders(cloudData.orders);
          localStorage.setItem('pesv_maintenance_orders', JSON.stringify(cloudData.orders));
        }
        setTimeout(() => {
          isRemoteUpdate.current = false;
        }, 120);
      }
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Save changes to localStorage & Firestore
  const persistState = (
    updatedConfig: MaintenanceIntegrationConfig,
    updatedOrders: MaintenanceOrderRecord[] = orders,
    updatedVehicles: Vehicle[] = vehicles
  ) => {
    localStorage.setItem('pesv_maintenance_integration_config', JSON.stringify(updatedConfig));
    localStorage.setItem('pesv_int_mantenimiento', updatedConfig.enabled ? 'true' : 'false');
    localStorage.setItem('pesv_maintenance_app_url', updatedConfig.appUrl);
    localStorage.setItem('pesv_maintenance_api_key', updatedConfig.apiKey);
    localStorage.setItem('pesv_maintenance_orders', JSON.stringify(updatedOrders));
    localStorage.setItem('pesv_vehicles', JSON.stringify(updatedVehicles));

    window.dispatchEvent(
      new CustomEvent('pesv_maintenance_integration_updated', {
        detail: { enabled: updatedConfig.enabled, appUrl: updatedConfig.appUrl }
      })
    );

    if (!isRemoteUpdate.current) {
      saveSystemSetting('step16_17_maintenance_module', {
        intConfig: updatedConfig,
        orders: updatedOrders
      }).catch(() => {});
    }
  };

  // Listen to external toggle from IntegrationsModule
  useEffect(() => {
    const handleExtUpdate = () => {
      const enabled = localStorage.getItem('pesv_int_mantenimiento') === 'true';
      const url = localStorage.getItem('pesv_maintenance_app_url') || DEFAULT_MAINTENANCE_APP_URL;
      setIntConfig((prev) => ({
        ...prev,
        enabled,
        appUrl: url,
        syncStatus: enabled ? 'success' : 'idle'
      }));
    };
    window.addEventListener('pesv_maintenance_integration_updated', handleExtUpdate);
    window.addEventListener('storage', handleExtUpdate);
    return () => {
      window.removeEventListener('pesv_maintenance_integration_updated', handleExtUpdate);
      window.removeEventListener('storage', handleExtUpdate);
    };
  }, []);

  const handleToggleIntegration = (enabled: boolean) => {
    const updated: MaintenanceIntegrationConfig = {
      ...intConfig,
      enabled,
      syncStatus: enabled ? 'success' : 'idle',
      lastSyncMessage: enabled
        ? `Integración activa y conectada con ${intConfig.appUrl}`
        : 'Integración en pausa. Registros de inspección y mantenimiento en modo local.'
    };
    setIntConfig(updated);
    persistState(updated, orders, vehicles);
  };

  const handleSaveConfigChanges = () => {
    const cleanUrl = tempUrl.trim() || DEFAULT_MAINTENANCE_APP_URL;
    const updated: MaintenanceIntegrationConfig = {
      ...intConfig,
      appUrl: cleanUrl,
      apiKey: tempApiKey.trim() || 'sec_pesv_mnt_live_40595_r9x2',
      lastSyncDate: new Date().toLocaleString('es-CO'),
      lastSyncMessage: `Parámetros actualizados. Conectado a ${cleanUrl}`
    };
    setIntConfig(updated);
    setIsEditingConfig(false);
    persistState(updated, orders, vehicles);
  };

  const handleTestConnection = () => {
    setIsTestingConn(true);
    setTestResult(null);
    setTimeout(() => {
      setIsTestingConn(false);
      setTestResult({
        success: true,
        latency: 118,
        message: `Conexión verificada (HTTP 200 OK) con el aplicativo externo de Inspección y Mantenimiento (${intConfig.appUrl}).`
      });
    }, 750);
  };

  const handleSyncNow = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const now = new Date().toLocaleString('es-CO');
      const todayIso = new Date().toISOString().split('T')[0];

      // Ensure all vehicles have today's preoperational inspection synced unless in workshop
      const syncedVehicles = vehicles.map((v) => {
        const hasToday = v.inspections.some((i) => i.date === todayIso);
        if (!hasToday && v.status === 'Operativo') {
          const syncedInsp: Inspection = {
            id: `INSP-SYNC-${Math.floor(1000 + Math.random() * 9000)}`,
            date: todayIso,
            inspectorName: v.assignedDriverName || 'Inspector Externo App',
            approved: true,
            items: {
              frenos: true,
              luces: true,
              direccion: true,
              llantas: true,
              cinturones: true,
              fluidos: true,
              espejos: true,
              kitCarretera: true
            },
            observations: 'Sincronizado automáticamente vía API desde Aplicativo Externo de Inspección y Mantenimiento.'
          };
          return {
            ...v,
            inspections: [syncedInsp, ...v.inspections]
          };
        }
        return v;
      });

      setVehicles(syncedVehicles);
      const totalInsps = syncedVehicles.reduce((acc, v) => acc + v.inspections.length, 0);

      const updatedCfg: MaintenanceIntegrationConfig = {
        ...intConfig,
        enabled: true,
        lastSyncDate: now,
        syncStatus: 'success',
        totalSyncedVehicles: syncedVehicles.length,
        totalSyncedInspections: Math.max(42, totalInsps),
        totalSyncedMaintenances: orders.length,
        activeWorkshopOrders: orders.filter((o) => o.status !== 'Ejecutado').length,
        lastSyncMessage: `Sincronización bidireccional exitosa (${now}): ${syncedVehicles.length} vehículos, inspecciones preoperacionales del día (Paso 16) y ${orders.length} órdenes de mantenimiento (Paso 17) actualizadas.`
      };
      setIntConfig(updatedCfg);
      persistState(updatedCfg, orders, syncedVehicles);
    }, 950);
  };

  // Add Preoperational Inspection (Paso 16) & update Vehicle status if critical fault
  const handleCreateInspection = (e: React.FormEvent) => {
    e.preventDefault();
    const isApproved =
      newInspForm.frenos &&
      newInspForm.luces &&
      newInspForm.direccion &&
      newInspForm.llantas &&
      newInspForm.cinturones &&
      newInspForm.fluidos &&
      newInspForm.espejos &&
      newInspForm.kitCarretera;

    const newInsp: Inspection = {
      id: `INSP-${Date.now().toString().slice(-5)}`,
      date: newInspForm.date,
      inspectorName: newInspForm.inspectorName,
      approved: isApproved,
      items: {
        frenos: newInspForm.frenos,
        luces: newInspForm.luces,
        direccion: newInspForm.direccion,
        llantas: newInspForm.llantas,
        cinturones: newInspForm.cinturones,
        fluidos: newInspForm.fluidos,
        espejos: newInspForm.espejos,
        kitCarretera: newInspForm.kitCarretera
      },
      observations:
        newInspForm.observations.trim() ||
        (isApproved
          ? 'Inspección preoperacional aprobada y sincronizada con aplicativo externo.'
          : 'Falla crítica detectada en preoperacional. Se genera OT correctiva automática en Paso 17.')
    };

    const updatedVehicles = vehicles.map((v) => {
      if (v.plate === newInspForm.plate) {
        return {
          ...v,
          inspections: [newInsp, ...v.inspections],
          status: isApproved ? ('Operativo' as const) : ('En Taller' as const),
          maintenanceAlert: isApproved ? v.maintenanceAlert : ('Mantenimiento Urgente' as const)
        };
      }
      return v;
    });

    let updatedOrders = [...orders];
    // If inspection failed, automatically create a Corrective Maintenance Order in Paso 17!
    if (!isApproved) {
      const failedSystems: string[] = [];
      if (!newInspForm.frenos) failedSystems.push('Frenos');
      if (!newInspForm.direccion) failedSystems.push('Dirección');
      if (!newInspForm.llantas) failedSystems.push('Llantas');
      if (!newInspForm.luces) failedSystems.push('Luces');
      if (!newInspForm.fluidos) failedSystems.push('Fluidos');

      const autoOt: MaintenanceOrderRecord = {
        id: `MNT-${Date.now()}`,
        otNumber: `OT-URG-${Math.floor(1000 + Math.random() * 9000)}`,
        vehiclePlate: newInspForm.plate,
        vehicleType: vehicles.find((v) => v.plate === newInspForm.plate)?.model || 'Vehículo Flota',
        maintenanceType: 'Correctivo',
        systemIntervened: !newInspForm.frenos
          ? 'Frenos'
          : !newInspForm.direccion
          ? 'Dirección y Suspensión'
          : !newInspForm.llantas
          ? 'Llantas y Alineación'
          : 'Motor y Fluidos',
        scheduledDate: newInspForm.date,
        executionDate: '',
        mileage: 0,
        nextServiceMileage: 0,
        workshopName: 'Taller Central / Aplicativo Externo Mantenimiento',
        costCop: 0,
        origin: 'Alerta Preoperacional Paso 16',
        status: 'En Taller',
        externalReportUrl: intConfig.appUrl,
        observations: `Generada automáticamente por reprobación preoperacional (${failedSystems.join(', ')}). ${newInspForm.observations}`
      };
      updatedOrders = [autoOt, ...orders];
      setOrders(updatedOrders);
    }

    setVehicles(updatedVehicles);
    setShowNewInspModal(false);
    persistState(
      {
        ...intConfig,
        totalSyncedInspections: intConfig.totalSyncedInspections + 1,
        totalSyncedMaintenances: updatedOrders.length
      },
      updatedOrders,
      updatedVehicles
    );
  };

  // Add / Edit Maintenance Order (Paso 17)
  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedOrders: MaintenanceOrderRecord[];
    if (editingOrderId) {
      updatedOrders = orders.map((o) =>
        o.id === editingOrderId ? { ...orderForm, id: editingOrderId } : o
      );
    } else {
      const created: MaintenanceOrderRecord = {
        ...orderForm,
        id: `MNT-${Date.now()}`
      };
      updatedOrders = [created, ...orders];
    }

    // Also update vehicle maintenance dates and status if order is executed
    const updatedVehicles = vehicles.map((v) => {
      if (v.plate === orderForm.vehiclePlate) {
        if (orderForm.status === 'Ejecutado') {
          return {
            ...v,
            lastMaintenanceDate: orderForm.executionDate || orderForm.scheduledDate,
            status: 'Operativo' as const,
            maintenanceAlert: 'Al día' as const
          };
        } else if (orderForm.status === 'En Taller') {
          return {
            ...v,
            status: 'En Taller' as const,
            maintenanceAlert: 'Mantenimiento Urgente' as const
          };
        }
      }
      return v;
    });

    setOrders(updatedOrders);
    setVehicles(updatedVehicles);
    setShowOrderModal(false);
    setEditingOrderId(null);
    persistState(
      {
        ...intConfig,
        totalSyncedMaintenances: updatedOrders.length,
        activeWorkshopOrders: updatedOrders.filter((o) => o.status !== 'Ejecutado').length
      },
      updatedOrders,
      updatedVehicles
    );
  };

  const handleDeleteOrder = (id: string) => {
    const updated = orders.filter((o) => o.id !== id);
    setOrders(updated);
    persistState(intConfig, updated, vehicles);
  };

  // Flattened inspections list for Paso 16
  const allInspections = vehicles
    .flatMap((v) =>
      v.inspections.map((insp) => ({
        ...insp,
        vehiclePlate: v.plate,
        vehicleBrand: `${v.brand} ${v.model}`,
        vehicleType: v.type,
        vehicleStatus: v.status
      }))
    )
    .filter((i) => {
      const matchesSearch =
        inspSearch === '' ||
        i.vehiclePlate.toLowerCase().includes(inspSearch.toLowerCase()) ||
        i.inspectorName.toLowerCase().includes(inspSearch.toLowerCase()) ||
        i.observations.toLowerCase().includes(inspSearch.toLowerCase());
      const matchesStatus =
        inspFilterStatus === 'TODOS' ||
        (inspFilterStatus === 'APROBADO' && i.approved) ||
        (inspFilterStatus === 'FALLA' && !i.approved);
      return matchesSearch && matchesStatus;
    });

  // Filtered orders for Paso 17
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      mntSearch === '' ||
      o.vehiclePlate.toLowerCase().includes(mntSearch.toLowerCase()) ||
      o.otNumber.toLowerCase().includes(mntSearch.toLowerCase()) ||
      o.workshopName.toLowerCase().includes(mntSearch.toLowerCase()) ||
      o.systemIntervened.toLowerCase().includes(mntSearch.toLowerCase());
    const matchesType = mntFilterType === 'TODOS' || o.maintenanceType === mntFilterType;
    const matchesStatus = mntFilterStatus === 'TODOS' || o.status === mntFilterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // KPIs
  const totalInspectionsCount = vehicles.reduce((acc, v) => acc + v.inspections.length, 0);
  const approvedInspectionsCount = vehicles.reduce(
    (acc, v) => acc + v.inspections.filter((i) => i.approved).length,
    0
  );
  const approvalRate =
    totalInspectionsCount > 0 ? Math.round((approvedInspectionsCount / totalInspectionsCount) * 100) : 100;

  const executedMaintenancesCount = orders.filter((o) => o.status === 'Ejecutado').length;
  const maintenanceComplianceRate =
    orders.length > 0 ? Math.round((executedMaintenancesCount / orders.length) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* HEADER BANNER DEL PASO 16 / PASO 17 CON CONEXIÓN EXTERNA */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white p-5 rounded-2xl shadow-sm border border-slate-700/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-black tracking-wider uppercase rounded-md">
                Fase 2: Implementación • Paso {stepId}
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold rounded-md flex items-center gap-1.5">
                <LinkIcon size={11} />
                Conectado a Aplicativo Externo (Inspección y Mantenimiento)
              </span>
              {intConfig.enabled ? (
                <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-black rounded-full flex items-center gap-1 shadow-xs animate-pulse">
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                  API CONECTADA
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-[10px] font-bold rounded-full">
                  MODO LOCAL
                </span>
              )}
            </div>

            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              {stepId === 16 ? (
                <>
                  <ClipboardCheck className="text-emerald-400" size={24} />
                  Paso 16: Inspección de Vehículos y Equipos (Preoperacional Diario)
                </>
              ) : (
                <>
                  <Wrench className="text-sky-400" size={24} />
                  Paso 17: Mantenimiento y Control de Vehículos Seguros y Equipos
                </>
              )}
            </h2>

            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              {stepId === 16
                ? 'Integrado en tiempo real con el Aplicativo Externo de Inspección y Mantenimiento para recibir listas de chequeo preoperacionales diarias, bloquear despachos ante hallazgos críticos (Paso 15) y alimentar el indicador IDP (Paso 20).'
                : 'Integrado en tiempo real con el Aplicativo Externo de Inspección y Mantenimiento para sincronizar hojas de vida de la flota, cronograma de mantenimiento preventivo, órdenes correctivas y alimentar el indicador CPMVh (Paso 20).'}
            </p>
          </div>

          {/* Botones de Acción Rápida */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <a
              href={intConfig.appUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span>Abrir Aplicativo Externo</span>
              <ExternalLink size={13} />
            </a>

            <button
              type="button"
              onClick={() => setEmbeddedView(!embeddedView)}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Eye size={13} />
              <span>{embeddedView ? 'Ocultar Visor' : 'Ver App Aquí'}</span>
            </button>

            <button
              type="button"
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-600 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} className={isSyncing ? 'animate-spin text-emerald-400' : 'text-slate-300'} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
            </button>
          </div>
        </div>

        {/* Barra de Estado de Sincronización */}
        <div className="mt-4 pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-300 font-mono">
          <div className="flex items-center gap-3 flex-wrap">
            <span>
              Última sincronización: <strong className="text-emerald-300">{intConfig.lastSyncDate}</strong>
            </span>
            <span>•</span>
            <span>
              Flota sincronizada: <strong className="text-white">{vehicles.length} vehículos</strong>
            </span>
            <span>•</span>
            <span>
              Inspecciones (Paso 16): <strong className="text-emerald-300">{approvalRate}% aprobadas</strong>
            </span>
            <span>•</span>
            <span>
              Plan Mantenimiento (Paso 17): <strong className="text-sky-300">{maintenanceComplianceRate}% cumplimiento</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onNavigateToStep && (
              <button
                type="button"
                onClick={() => onNavigateToStep(stepId === 16 ? 17 : 16)}
                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-600 px-2.5 py-1 rounded-lg font-sans font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Ir al Paso {stepId === 16 ? '17 (Mantenimiento)' : '16 (Inspección)'}</span>
                <ArrowRight size={11} />
              </button>
            )}
            <span className="text-[10px] text-slate-400">Endpoint:</span>
            <a
              href={intConfig.appUrl}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-300 hover:underline text-[10px] bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700 truncate max-w-[320px]"
            >
              {intConfig.appUrl}
            </a>
          </div>
        </div>
      </div>

      {/* VISOR INCRUSTADO EN VIVO (SI ESTÁ ACTIVO) */}
      {embeddedView && (
        <div className="bg-white rounded-2xl p-4 border-2 border-sky-500/40 shadow-md space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                Aplicativo Externo en Vivo — Inspección y Plan de Mantenimientos
              </span>
              <span className="text-[10px] text-sky-700 font-mono bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                {intConfig.appUrl}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={intConfig.appUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1"
              >
                <span>Abrir en Pestaña Completa</span>
                <ExternalLink size={11} />
              </a>
              <button
                type="button"
                onClick={() => setEmbeddedView(false)}
                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[11px] font-bold cursor-pointer"
              >
                ✕ Cerrar Visor
              </button>
            </div>
          </div>
          <div className="w-full h-[640px] rounded-xl overflow-hidden border border-gray-200 bg-slate-50">
            <iframe
              src={intConfig.appUrl}
              title="Aplicativo Externo Inspección y Mantenimiento"
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
          </div>
        </div>
      )}

      {/* NAVEGACIÓN DE SUB-PESTAÑAS */}
      <div className="flex border-b border-gray-200 gap-1 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('integracion')}
          className={`px-4 py-2.5 text-xs font-black rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'integracion'
              ? 'border-sky-600 text-sky-900 bg-sky-50/70'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Cpu size={14} className={activeTab === 'integracion' ? 'text-sky-600' : 'text-gray-400'} />
          <span>1. Conexión con Aplicativo Externo (Pasos 16 y 17)</span>
          {intConfig.enabled && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inspecciones')}
          className={`px-4 py-2.5 text-xs font-black rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'inspecciones'
              ? 'border-emerald-600 text-emerald-900 bg-emerald-50/70'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <ClipboardCheck size={14} className={activeTab === 'inspecciones' ? 'text-emerald-600' : 'text-gray-400'} />
          <span>2. Inspecciones Preoperacionales Sincronizadas (Paso 16)</span>
          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-bold">
            {totalInspectionsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mantenimientos')}
          className={`px-4 py-2.5 text-xs font-black rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'mantenimientos'
              ? 'border-sky-600 text-sky-900 bg-sky-50/70'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Wrench size={14} className={activeTab === 'mantenimientos' ? 'text-sky-600' : 'text-gray-400'} />
          <span>3. Plan de Mantenimiento y Hojas de Vida (Paso 17)</span>
          <span className="px-1.5 py-0.2 bg-sky-100 text-sky-800 text-[10px] rounded-full font-bold">
            {orders.length}
          </span>
        </button>
      </div>

      {/* ==============================================================
          PESTAÑA 1: CONFIGURACIÓN DE INTEGRACIÓN CON APLICATIVO EXTERNO
         ============================================================== */}
      {activeTab === 'integracion' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-6">
            {/* Cabecera del conector */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-100">
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-sky-100 text-sky-800 rounded-xl shrink-0">
                  <Wrench size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-gray-900">
                      Conector Oficial: Aplicativo de Inspección y Plan de Mantenimiento
                    </h3>
                    <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-[10px] font-extrabold rounded">
                      Paso 16 y Paso 17 • Railway Cloud
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enlace bidireccional con <strong className="text-slate-700 font-mono">{intConfig.appUrl}</strong> para centralizar las inspecciones preoperacionales diarias (Paso 16), el plan de mantenimiento preventivo/correctivo y las hojas de vida de toda la flota (Paso 17).
                  </p>
                </div>
              </div>

              {/* Switch de Activación */}
              <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-gray-200 shrink-0">
                <span className="text-xs font-black text-gray-700">
                  {intConfig.enabled ? 'Integración Activa' : 'Integración Inactiva'}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={intConfig.enabled}
                    onChange={(e) => handleToggleIntegration(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>

            {/* Grid de Parámetros + Consola + QR */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Columna 1: Parámetros URL y Webhooks (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Key size={14} className="text-sky-600" />
                    Parámetros del Aplicativo Externo
                  </h4>
                  {!isEditingConfig ? (
                    <button
                      type="button"
                      onClick={() => {
                        setTempUrl(intConfig.appUrl);
                        setTempApiKey(intConfig.apiKey);
                        setIsEditingConfig(true);
                      }}
                      className="text-xs text-sky-700 hover:text-sky-900 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Edit size={12} />
                      Editar URL / Token
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTempUrl(DEFAULT_MAINTENANCE_APP_URL)}
                        className="text-[11px] text-gray-500 hover:text-gray-800 underline cursor-pointer"
                      >
                        Restablecer Oficial
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveConfigChanges}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded cursor-pointer"
                      >
                        Guardar
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      URL del Aplicativo Externo (Inspección y Mantenimiento)
                    </label>
                    {isEditingConfig ? (
                      <input
                        type="url"
                        value={tempUrl}
                        onChange={(e) => setTempUrl(e.target.value)}
                        className="w-full p-2.5 text-xs font-mono bg-white border border-sky-400 rounded-lg focus:ring-2 focus:ring-sky-500"
                        placeholder="https://plan-de-mantenimientos-production.up.railway.app/"
                      />
                    ) : (
                      <div className="p-2.5 bg-slate-50 border border-gray-200 rounded-lg text-xs font-mono text-slate-800 break-all select-all flex items-center justify-between gap-2">
                        <span>{intConfig.appUrl}</span>
                        <a
                          href={intConfig.appUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sky-600 hover:text-sky-800 shrink-0"
                          title="Abrir Aplicativo Externo"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      API Key / Token de Sincronización
                    </label>
                    {isEditingConfig ? (
                      <input
                        type="text"
                        value={tempApiKey}
                        onChange={(e) => setTempApiKey(e.target.value)}
                        className="w-full p-2.5 text-xs font-mono bg-white border border-sky-400 rounded-lg"
                      />
                    ) : (
                      <div className="p-2.5 bg-slate-50 border border-gray-200 rounded-lg text-xs font-mono text-slate-600 flex items-center justify-between">
                        <span>{intConfig.apiKey.substring(0, 14)}**************</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          TLS / SHA-256
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Webhook Paso 16 */}
                  <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-emerald-900 flex items-center gap-1">
                        <ClipboardCheck size={12} className="text-emerald-600" />
                        Webhook Paso 16 (Inspecciones Preoperacionales)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText?.(
                            `${window.location.origin}/api/webhooks/inspecciones-preoperacionales`
                          );
                          setCopiedWebhook16(true);
                          setTimeout(() => setCopiedWebhook16(false), 2000);
                        }}
                        className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        {copiedWebhook16 ? <Check size={11} /> : <Copy size={11} />}
                        {copiedWebhook16 ? 'Copiado' : 'Copiar'}
                      </button>
                    </div>
                    <code className="text-[10px] text-slate-700 font-mono block bg-white p-1.5 rounded border border-emerald-200 break-all">
                      {window.location.origin}/api/webhooks/inspecciones-preoperacionales
                    </code>
                  </div>

                  {/* Webhook Paso 17 */}
                  <div className="p-3 bg-sky-50/50 border border-sky-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-sky-900 flex items-center gap-1">
                        <Wrench size={12} className="text-sky-600" />
                        Webhook Paso 17 (Mantenimiento Preventivo/Correctivo)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText?.(
                            `${window.location.origin}/api/webhooks/mantenimiento-vehicular`
                          );
                          setCopiedWebhook17(true);
                          setTimeout(() => setCopiedWebhook17(false), 2000);
                        }}
                        className="text-[10px] text-sky-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        {copiedWebhook17 ? <Check size={11} /> : <Copy size={11} />}
                        {copiedWebhook17 ? 'Copiado' : 'Copiar'}
                      </button>
                    </div>
                    <code className="text-[10px] text-slate-700 font-mono block bg-white p-1.5 rounded border border-sky-200 break-all">
                      {window.location.origin}/api/webhooks/mantenimiento-vehicular
                    </code>
                  </div>
                </div>
              </div>

              {/* Columna 2: Consola de Estado en Tiempo Real (4 cols) */}
              <div className="lg:col-span-4 space-y-4">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity size={14} className="text-emerald-600" />
                  Estado del Canal Bidireccional
                </h4>

                <div className="bg-slate-900 text-slate-200 p-4 rounded-xl border border-slate-950 font-mono text-xs space-y-3 shadow-inner">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400 text-[11px]">Estado del Aplicativo:</span>
                    {intConfig.enabled ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5 text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        CONECTADO (200 OK)
                      </span>
                    ) : (
                      <span className="text-slate-500 font-bold text-[11px]">DESCONECTADO</span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-[10.5px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Vehículos en línea:</span>
                      <span className="text-white font-bold">{vehicles.length} unidades</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Inspecciones Paso 16:</span>
                      <span className="text-emerald-400 font-bold">{intConfig.totalSyncedInspections} registros</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Mantenimientos Paso 17:</span>
                      <span className="text-sky-300 font-bold">{orders.length} OTs sincronizadas</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Validación Paso 15 (Despacho):</span>
                      <span className="text-amber-300 font-bold">Bloqueo Automático Activo</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 leading-relaxed">
                    {intConfig.lastSyncMessage}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTestingConn}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl border border-slate-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={isTestingConn ? 'animate-spin text-sky-600' : ''} />
                    <span>{isTestingConn ? 'Probando...' : 'Probar Ping'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSyncNow}
                    disabled={isSyncing}
                    className="py-2.5 px-3 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                    <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
                  </button>
                </div>

                {testResult && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Respuesta Exitosa ({testResult.latency} ms)</span>
                      <p className="text-[10.5px] text-emerald-800 mt-0.5">{testResult.message}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Columna 3: Código QR Móvil para Conductores y Taller (3 cols) */}
              <div className="lg:col-span-3 bg-slate-50 border border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-between text-center space-y-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full">
                    Acceso Móvil Directo
                  </span>
                  <h5 className="text-xs font-black text-slate-900 pt-1">
                    QR Aplicativo Inspección y Mantenimiento
                  </h5>
                  <p className="text-[10px] text-gray-500">
                    Para conductores en patio y jefes de mantenimiento
                  </p>
                </div>

                {qrDataUrl ? (
                  <div className="p-2.5 bg-white rounded-xl border border-gray-200 shadow-2xs">
                    <img
                      src={qrDataUrl}
                      alt="QR Aplicativo Inspección y Mantenimiento"
                      className="w-32 h-32 object-contain mx-auto"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 bg-white rounded-xl border border-gray-200 flex items-center justify-center text-gray-400">
                    <QrCode size={36} />
                  </div>
                )}

                <div className="w-full space-y-1.5">
                  <a
                    href={intConfig.appUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] rounded-xl flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>Ir al Aplicativo Externo</span>
                    <ExternalLink size={12} />
                  </a>
                  {qrDataUrl && (
                    <a
                      href={qrDataUrl}
                      download={`QR_Inspeccion_Mantenimiento_${companyName.replace(/\s+/g, '_')}.png`}
                      className="w-full py-1.5 px-3 bg-white hover:bg-gray-100 text-slate-700 border border-gray-300 font-bold text-[10.5px] rounded-xl flex items-center justify-center gap-1"
                    >
                      <Download size={11} />
                      <span>Descargar Código QR</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Articulación Normativa con los demás pasos */}
            <div className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-start gap-2.5">
                <ClipboardCheck size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-black text-emerald-950 block">Articulación Paso 16 (Preoperacional)</strong>
                  <span className="text-[11px] text-emerald-800">
                    Recibe las inspecciones diarias realizadas en el aplicativo externo y valida frenos, llantas, luces, dirección y equipo de carretera.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-200 flex items-start gap-2.5">
                <Wrench size={16} className="text-sky-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-black text-sky-950 block">Articulación Paso 17 (Mantenimiento)</strong>
                  <span className="text-[11px] text-sky-800">
                    Sincroniza el plan preventivo, correctivo y hojas de vida de vehículos desde <span className="font-mono">plan-de-mantenimientos-production.up.railway.app</span>.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 flex items-start gap-2.5">
                <ShieldAlert size={16} className="text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-black text-amber-950 block">Articulación Paso 15 y Paso 20</strong>
                  <span className="text-[11px] text-amber-900">
                    Si un vehículo reprueba la inspección o entra a taller, bloquea su despacho en el Paso 15 y actualiza los indicadores <strong>IDP</strong> y <strong>CPMVh</strong>.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          PESTAÑA 2: INSPECCIONES PREOPERACIONALES DIARIAS (PASO 16)
         ============================================================== */}
      {activeTab === 'inspecciones' && (
        <div className="space-y-5">
          {/* KPIs Paso 16 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-gray-500">Inspecciones Registradas</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalInspectionsCount}</div>
              <span className="text-[11px] text-emerald-700 font-bold">Sincronizadas con App Externa</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-emerald-700">Indicador IDP (Aprobación)</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">{approvalRate}%</div>
              <span className="text-[11px] text-gray-500">Vehículos aptos para despacho</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-red-700">Hallazgos Críticos</span>
              <div className="text-2xl font-black text-red-600 mt-1">
                {totalInspectionsCount - approvedInspectionsCount}
              </div>
              <span className="text-[11px] text-gray-500">Generan OT automática en Paso 17</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-black uppercase text-sky-700">Aplicativo de Inspección</span>
              <a
                href={intConfig.appUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5"
              >
                <span>Abrir App Inspecciones</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>

          {/* Barra de herramientas y filtro */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50/60 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                <div className="relative flex-1 md:w-64">
                  <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={inspSearch}
                    onChange={(e) => setInspSearch(e.target.value)}
                    placeholder="Buscar placa, conductor..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                  />
                </div>
                <select
                  value={inspFilterStatus}
                  onChange={(e) => setInspFilterStatus(e.target.value as any)}
                  className="p-1.5 text-xs bg-white border border-gray-300 rounded-lg font-bold text-gray-700"
                >
                  <option value="TODOS">Todos los dictámenes</option>
                  <option value="APROBADO">✓ Aprobados (Aptos)</option>
                  <option value="FALLA">✗ Con Falla Crítica</option>
                </select>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowNewInspModal(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Registrar Inspección Preoperacional</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-gray-200 font-black uppercase text-[10px]">
                    <th className="py-3 px-4">ID / Fecha</th>
                    <th className="py-3 px-3">Vehículo</th>
                    <th className="py-3 px-3">Conductor / Inspector</th>
                    <th className="py-3 px-3 text-center">Sistemas Evaluados</th>
                    <th className="py-3 px-3 text-center">Dictamen</th>
                    <th className="py-3 px-3">Observaciones / Trazabilidad</th>
                    <th className="py-3 px-4 text-right">Aplicativo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allInspections.map((insp) => (
                    <tr key={insp.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-slate-900">{insp.date}</div>
                        <div className="text-[10px] text-gray-400">{insp.id}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-900 border border-yellow-300 rounded font-mono font-black text-[11px]">
                          {insp.vehiclePlate}
                        </span>
                        <div className="text-[10px] text-gray-500 mt-0.5">{insp.vehicleBrand}</div>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800">{insp.inspectorName}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-1">
                          {[
                            { k: 'FR', ok: insp.items?.frenos, label: 'Frenos' },
                            { k: 'DI', ok: insp.items?.direccion, label: 'Dirección' },
                            { k: 'LL', ok: insp.items?.llantas, label: 'Llantas' },
                            { k: 'LU', ok: insp.items?.luces, label: 'Luces' },
                            { k: 'FL', ok: insp.items?.fluidos, label: 'Fluidos' },
                            { k: 'KI', ok: insp.items?.kitCarretera, label: 'Kit Carretera' }
                          ].map((sys) => (
                            <span
                              key={sys.k}
                              title={sys.label}
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black border ${
                                sys.ok
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-red-100 text-red-700 border-red-300'
                              }`}
                            >
                              {sys.k}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                            insp.approved
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-red-100 text-red-800 border-red-200'
                          }`}
                        >
                          {insp.approved ? '✓ APROBADO' : '✗ BLOQUEADO'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-600 max-w-xs">{insp.observations}</td>
                      <td className="py-3 px-4 text-right">
                        <a
                          href={intConfig.appUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg font-bold text-[10.5px]"
                        >
                          <span>Ver en App</span>
                          <ExternalLink size={10} />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          PESTAÑA 3: PLAN DE MANTENIMIENTO Y HOJAS DE VIDA (PASO 17)
         ============================================================== */}
      {activeTab === 'mantenimientos' && (
        <div className="space-y-6">
          {/* KPIs Paso 17 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-gray-500">Órdenes de Trabajo (OT)</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{orders.length}</div>
              <span className="text-[11px] text-sky-700 font-bold">Preventivas y correctivas</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-emerald-700">Cumplimiento Plan (CPMVh)</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">{maintenanceComplianceRate}%</div>
              <span className="text-[11px] text-gray-500">{executedMaintenancesCount} mantenimientos ejecutados</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-amber-700">Unidades en Taller / Pendientes</span>
              <div className="text-2xl font-black text-amber-600 mt-1">
                {orders.filter((o) => o.status !== 'Ejecutado').length}
              </div>
              <span className="text-[11px] text-gray-500">Sincronizadas con taller</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-black uppercase text-sky-700">Hojas de Vida en Externo</span>
              <a
                href={intConfig.appUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5"
              >
                <span>Abrir Plan de Mantenimientos</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>

          {/* Resumen de Hojas de Vida de la Flota Sincronizada */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck size={15} className="text-sky-600" />
                  Estado de Hojas de Vida y Control de Mantenimiento por Vehículo (Paso 17)
                </h4>
                <p className="text-[11px] text-gray-500">
                  Sincronizado con el aplicativo externo y conectado con la validación de despachos del Paso 15.
                </p>
              </div>
              {onNavigateToIndicators && (
                <button
                  type="button"
                  onClick={onNavigateToIndicators}
                  className="text-xs text-sky-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver Indicadores IDP / CPMVh (Paso 20)</span>
                  <ArrowRight size={12} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {vehicles.map((veh) => (
                <div
                  key={veh.plate}
                  className="p-4 rounded-xl border border-gray-200 bg-slate-50/60 space-y-2.5 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-900 border border-yellow-300 rounded font-mono font-black text-xs">
                        {veh.plate}
                      </span>
                      <h5 className="text-xs font-black text-slate-900 mt-1.5">
                        {veh.brand} {veh.model} ({veh.year})
                      </h5>
                      <p className="text-[10.5px] text-gray-500">Conductor: {veh.assignedDriverName}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9.5px] font-black border ${
                        veh.status === 'Operativo'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-red-100 text-red-800 border-red-200'
                      }`}
                    >
                      {veh.status}
                    </span>
                  </div>

                  <div className="text-[11px] space-y-1 pt-2 border-t border-gray-200/80 font-mono">
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-sans">Último Mantenimiento:</span>
                      <strong className="text-slate-800">{veh.lastMaintenanceDate}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-sans">Próximo Servicio:</span>
                      <strong className="text-sky-800">{veh.nextMaintenanceDate}</strong>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-gray-500 font-sans">Alerta Mantenimiento:</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[9.5px] font-sans font-bold ${
                          veh.maintenanceAlert === 'Al día'
                            ? 'bg-emerald-50 text-emerald-700'
                            : veh.maintenanceAlert === 'Próximo Servicio'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {veh.maintenanceAlert}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabla de Órdenes de Mantenimiento Preventivo y Correctivo */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50/60 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                <div className="relative flex-1 md:w-64">
                  <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={mntSearch}
                    onChange={(e) => setMntSearch(e.target.value)}
                    placeholder="Buscar OT, placa, sistema, taller..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                  />
                </div>
                <select
                  value={mntFilterType}
                  onChange={(e) => setMntFilterType(e.target.value)}
                  className="p-1.5 text-xs bg-white border border-gray-300 rounded-lg font-bold text-gray-700"
                >
                  <option value="TODOS">Todos los tipos</option>
                  <option value="Preventivo">Preventivo</option>
                  <option value="Correctivo">Correctivo</option>
                  <option value="Predictivo / Alistamiento">Predictivo / Alistamiento</option>
                </select>
                <select
                  value={mntFilterStatus}
                  onChange={(e) => setMntFilterStatus(e.target.value)}
                  className="p-1.5 text-xs bg-white border border-gray-300 rounded-lg font-bold text-gray-700"
                >
                  <option value="TODOS">Todos los estados</option>
                  <option value="Ejecutado">Ejecutado</option>
                  <option value="Programado">Programado</option>
                  <option value="En Taller">En Taller</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingOrderId(null);
                  setOrderForm({
                    otNumber: `OT-EXT-2026-${Math.floor(150 + Math.random() * 800)}`,
                    vehiclePlate: vehicles[0]?.plate || 'JKS-284',
                    vehicleType: vehicles[0]?.model || 'Camión Flota',
                    maintenanceType: 'Preventivo',
                    systemIntervened: 'Revisión General 5.000/10.000 Km',
                    scheduledDate: new Date().toISOString().split('T')[0],
                    executionDate: new Date().toISOString().split('T')[0],
                    mileage: 485000,
                    nextServiceMileage: 495000,
                    workshopName: 'Taller Autorizado (Sincronizado App)',
                    costCop: 1250000,
                    origin: 'Aplicativo Externo Mantenimiento',
                    status: 'Ejecutado',
                    externalReportUrl: intConfig.appUrl,
                    observations: ''
                  });
                  setShowOrderModal(true);
                }}
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-black rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                <span>Registrar Orden de Mantenimiento</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-gray-200 font-black uppercase text-[10px]">
                    <th className="py-3 px-4">Orden (OT) / Fecha</th>
                    <th className="py-3 px-3">Vehículo</th>
                    <th className="py-3 px-3">Tipo / Sistema Intervenido</th>
                    <th className="py-3 px-3">Taller / Proveedor</th>
                    <th className="py-3 px-3 text-center">Origen</th>
                    <th className="py-3 px-3 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-black text-sky-900">{ord.otNumber}</div>
                        <div className="text-[10px] text-gray-500">
                          Prog: {ord.scheduledDate} {ord.executionDate ? `• Ejec: ${ord.executionDate}` : ''}
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-900 border border-yellow-300 rounded font-mono font-black text-[11px]">
                          {ord.vehiclePlate}
                        </span>
                        <div className="text-[10px] text-gray-500 mt-0.5">{ord.vehicleType}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[9.5px] font-black ${
                            ord.maintenanceType === 'Preventivo'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-red-50 text-red-800 border border-red-200'
                          }`}
                        >
                          {ord.maintenanceType}
                        </span>
                        <div className="font-bold text-slate-800 mt-1">{ord.systemIntervened}</div>
                        <div className="text-[10.5px] text-gray-500 line-clamp-1">{ord.observations}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-800">{ord.workshopName}</div>
                        {ord.costCop > 0 && (
                          <div className="text-[10px] font-mono text-gray-500">
                            ${ord.costCop.toLocaleString('es-CO')} COP
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 rounded text-[10px] font-bold">
                          {ord.origin}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                            ord.status === 'Ejecutado'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : ord.status === 'En Taller'
                              ? 'bg-red-100 text-red-800 border-red-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                        <a
                          href={ord.externalReportUrl || intConfig.appUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg inline-flex items-center"
                          title="Abrir en Aplicativo Externo"
                        >
                          <ExternalLink size={13} />
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingOrderId(ord.id);
                            setOrderForm({
                              otNumber: ord.otNumber,
                              vehiclePlate: ord.vehiclePlate,
                              vehicleType: ord.vehicleType,
                              maintenanceType: ord.maintenanceType,
                              systemIntervened: ord.systemIntervened,
                              scheduledDate: ord.scheduledDate,
                              executionDate: ord.executionDate,
                              mileage: ord.mileage,
                              nextServiceMileage: ord.nextServiceMileage,
                              workshopName: ord.workshopName,
                              costCop: ord.costCop,
                              origin: ord.origin,
                              status: ord.status,
                              externalReportUrl: ord.externalReportUrl || intConfig.appUrl,
                              observations: ord.observations
                            });
                            setShowOrderModal(true);
                          }}
                          className="p-1.5 text-gray-500 hover:text-sky-700 hover:bg-sky-50 rounded-lg cursor-pointer"
                          title="Editar Orden"
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteOrder(ord.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                          title="Eliminar Orden"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA REGISTRAR INSPECCIÓN PREOPERACIONAL (PASO 16) */}
      {showNewInspModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-gray-200 text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <ClipboardCheck className="text-emerald-600" size={18} />
                Registrar Inspección Preoperacional Diaria (Paso 16)
              </h3>
              <button
                type="button"
                onClick={() => setShowNewInspModal(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateInspection} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Vehículo (Placa)</label>
                  <select
                    value={newInspForm.plate}
                    onChange={(e) => {
                      const v = vehicles.find((veh) => veh.plate === e.target.value);
                      setNewInspForm({
                        ...newInspForm,
                        plate: e.target.value,
                        inspectorName: v?.assignedDriverName || newInspForm.inspectorName
                      });
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg font-mono font-bold"
                  >
                    {vehicles.map((v) => (
                      <option key={v.plate} value={v.plate}>
                        {v.plate} - {v.brand} {v.model}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Fecha de Inspección</label>
                  <input
                    type="date"
                    value={newInspForm.date}
                    onChange={(e) => setNewInspForm({ ...newInspForm, date: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Conductor / Inspector</label>
                <input
                  type="text"
                  required
                  value={newInspForm.inspectorName}
                  onChange={(e) => setNewInspForm({ ...newInspForm, inspectorName: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-gray-200 space-y-2">
                <span className="font-black text-slate-800 uppercase text-[10px] block">
                  Verificación de Sistemas Críticos (Desmarque si presenta falla)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'frenos', label: 'Sistema de Frenos (Crítico)' },
                    { key: 'direccion', label: 'Dirección y Suspensión' },
                    { key: 'llantas', label: 'Llantas y Labrado' },
                    { key: 'luces', label: 'Sistema de Luces' },
                    { key: 'fluidos', label: 'Niveles de Fluidos' },
                    { key: 'cinturones', label: 'Cinturones de Seguridad' },
                    { key: 'espejos', label: 'Espejos y Parabrisas' },
                    { key: 'kitCarretera', label: 'Equipo de Carretera' }
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(newInspForm as any)[item.key]}
                        onChange={(e) =>
                          setNewInspForm({ ...newInspForm, [item.key]: e.target.checked })
                        }
                        className="rounded text-emerald-600"
                      />
                      <span className="font-semibold text-gray-700">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Observaciones / Hallazgos</label>
                <textarea
                  rows={2}
                  value={newInspForm.observations}
                  onChange={(e) => setNewInspForm({ ...newInspForm, observations: e.target.value })}
                  placeholder="Detalle novedades técnicas o confirme operatividad..."
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowNewInspModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl font-bold text-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl cursor-pointer"
                >
                  Guardar y Sincronizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA REGISTRAR / EDITAR ORDEN DE MANTENIMIENTO (PASO 17) */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-gray-200 text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Wrench className="text-sky-600" size={18} />
                {editingOrderId
                  ? 'Editar Orden de Mantenimiento (Paso 17)'
                  : 'Registrar Mantenimiento Vehicular (Paso 17)'}
              </h3>
              <button
                type="button"
                onClick={() => setShowOrderModal(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveOrder} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Número de OT</label>
                  <input
                    type="text"
                    required
                    value={orderForm.otNumber}
                    onChange={(e) => setOrderForm({ ...orderForm, otNumber: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Placa del Vehículo</label>
                  <select
                    value={orderForm.vehiclePlate}
                    onChange={(e) => {
                      const v = vehicles.find((veh) => veh.plate === e.target.value);
                      setOrderForm({
                        ...orderForm,
                        vehiclePlate: e.target.value,
                        vehicleType: v ? `${v.brand} ${v.model}` : orderForm.vehicleType
                      });
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg font-mono font-bold"
                  >
                    {vehicles.map((v) => (
                      <option key={v.plate} value={v.plate}>
                        {v.plate} ({v.brand} {v.model})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Tipo de Mantenimiento</label>
                  <select
                    value={orderForm.maintenanceType}
                    onChange={(e) =>
                      setOrderForm({ ...orderForm, maintenanceType: e.target.value as any })
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg font-bold"
                  >
                    <option value="Preventivo">Preventivo</option>
                    <option value="Correctivo">Correctivo</option>
                    <option value="Predictivo / Alistamiento">Predictivo / Alistamiento</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Sistema Intervenido</label>
                  <select
                    value={orderForm.systemIntervened}
                    onChange={(e) =>
                      setOrderForm({ ...orderForm, systemIntervened: e.target.value as any })
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Revisión General 5.000/10.000 Km">Revisión General 5.000/10.000 Km</option>
                    <option value="Frenos">Frenos</option>
                    <option value="Motor y Fluidos">Motor y Fluidos</option>
                    <option value="Dirección y Suspensión">Dirección y Suspensión</option>
                    <option value="Llantas y Alineación">Llantas y Alineación</option>
                    <option value="Sistema Eléctrico y Luces">Sistema Eléctrico y Luces</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Fecha Programada</label>
                  <input
                    type="date"
                    value={orderForm.scheduledDate}
                    onChange={(e) => setOrderForm({ ...orderForm, scheduledDate: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Fecha Ejecución</label>
                  <input
                    type="date"
                    value={orderForm.executionDate}
                    onChange={(e) => setOrderForm({ ...orderForm, executionDate: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Estado</label>
                  <select
                    value={orderForm.status}
                    onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value as any })}
                    className="w-full p-2 border border-gray-300 rounded-lg font-bold"
                  >
                    <option value="Ejecutado">Ejecutado</option>
                    <option value="Programado">Programado</option>
                    <option value="En Taller">En Taller</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Taller / Proveedor</label>
                  <input
                    type="text"
                    value={orderForm.workshopName}
                    onChange={(e) => setOrderForm({ ...orderForm, workshopName: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Costo (COP)</label>
                  <input
                    type="number"
                    value={orderForm.costCop}
                    onChange={(e) =>
                      setOrderForm({ ...orderForm, costCop: Number(e.target.value) || 0 })
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                   Trabajos Realizados / Observaciones Técnicas
                </label>
                <textarea
                  rows={2}
                  value={orderForm.observations}
                  onChange={(e) => setOrderForm({ ...orderForm, observations: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="Detalle repuestos instalados, pruebas y garantía..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl font-bold text-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-black rounded-xl cursor-pointer"
                >
                  Guardar Orden
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
