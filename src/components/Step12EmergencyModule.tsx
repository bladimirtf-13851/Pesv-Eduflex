import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert, AlertTriangle, FileText, QrCode, MapPin, Camera, Calendar,
  Users, Plus, Edit3, Trash2, Download, CheckCircle2, ExternalLink, Copy,
  PhoneCall, Truck, Activity, Upload, Eye, Search, Navigation, Award,
  Clock, Check, X, Sparkles, Compass, Flame, CloudRain, Lock, HeartPulse,
  ClipboardCheck, Siren, HelpCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { CompanyConfig } from '../types';
import { saveSystemSetting, subscribeToSystemSetting } from '../services/firestoreService';

export interface ThreatVulnerabilityItem {
  id: string;
  amenaza: string;
  categoria: 'Operativa / Tránsito' | 'Técnica / Mecánica' | 'Natural / Climática' | 'Social / Orden Público';
  origen: 'Interno' | 'Externo' | 'Socio-Natural';
  corredoresAfectados: string;
  probabilidad: 'Posible' | 'Probable' | 'Inminente';
  // Vulnerabilidad Personas (0.0 = Baja, 0.5 = Media, 1.0 = Alta por subcriterio; suma 0 a 3)
  vulnPersonasGestion: number;
  vulnPersonasCapacitacion: number;
  vulnPersonasDotacion: number;
  // Vulnerabilidad Recursos / Flota
  vulnRecursosKitCarretera: number;
  vulnRecursosEstadoFlota: number;
  vulnRecursosEquiposRespuesta: number;
  // Vulnerabilidad Sistemas y Procesos
  vulnSistemasAsistencia: number;
  vulnSistemasComunicaciones: number;
  vulnSistemasRecuperacion: number;
  controlesExistentes: string;
  medidasIntervencion: string;
}

export interface PONProtocolItem {
  id: string;
  codigo: string;
  titulo: string;
  tipoIncidente: 'Solo Daños Materiales' | 'Heridos o Fallecidos' | 'Fallas Críticas en Ruta' | 'Climático / Derrumbe' | 'Orden Público / Bloqueo' | 'Incendio / Materiales Peligrosos';
  version: string;
  fechaActualizacion: string;
  responsable: string;
  objetivo: string;
  pasosAntes: string[];
  pasosDurante: string[];
  pasosDespues: string[];
  contactosClave: string;
  adjuntoNombre?: string;
  adjuntoDataUrl?: string;
}

export interface EmergencyIncidentReport {
  id: string;
  radicado: string;
  fechaHora: string;
  conductorNombre: string;
  conductorCedula: string;
  conductorTelefono: string;
  placaVehiculo: string;
  tipoVehiculo: string;
  tipoEvento: string;
  gravedad: 'Solo Daños Materiales' | 'Heridos Leves' | 'Heridos Graves / Fatalidad' | 'Incidente / Casi Accidente';
  numeroLesionados: number;
  ubicacionTexto: string;
  latitud?: string;
  longitud?: string;
  descripcionHechos: string;
  aplicoProteger: boolean;
  aplicoAvisar: boolean;
  aplicoSocorrer: boolean;
  fotosDanos: { nombre: string; dataUrl: string }[];
  estado: 'Reportado' | 'En Atención en Sitio' | 'Investigado / Cerrado';
  accionesInmediatas: string;
}

export interface RoadDrillRecord {
  id: string;
  codigo: string;
  tituloSimulacro: string;
  escenarioAmenaza: string;
  fechaProgramada: string;
  fechaEjecucion?: string;
  corredorOSede: string;
  tipoSimulacro: 'De Escritorio / Gabinete' | 'Parcial en Patio' | 'Real en Ruta / Operativo';
  responsable: string;
  participantesCount: number;
  tiempoRespuestaMinutos: number;
  metaTiempoMinutos: number;
  calificacionEfectividad: number;
  estado: 'Programado' | 'Ejecutado' | 'Reprogramado';
  hallazgosMejora: string;
  evidenciaNombre?: string;
  evidenciaDataUrl?: string;
}

export interface FirstResponderRecord {
  id: string;
  nombreCompleto: string;
  cedula: string;
  cargo: 'Conductor' | 'Supervisor Vial' | 'Escolta / Auxiliar' | 'Brigadista PESV' | 'Coordinador HSEQ';
  telefono: string;
  placaAsignada: string;
  competenciaCertificada: string;
  entidadCertificadora: string;
  numeroCertificado: string;
  fechaCertificacion: string;
  fechaVencimiento: string;
  horasFormacion: number;
  idoneoAtencionVictimas: boolean;
  soporteNombre?: string;
  soporteDataUrl?: string;
}

export interface Step12State {
  threats: ThreatVulnerabilityItem[];
  protocols: PONProtocolItem[];
  incidents: EmergencyIncidentReport[];
  drills: RoadDrillRecord[];
  responders: FirstResponderRecord[];
  emergencyLines: {
    entidad: string;
    linea: string;
    disponibilidad: string;
  }[];
}

const STORAGE_KEY = 'pesv_paso12_emergencias_v1';
const FIRESTORE_DOC_ID = 'paso12_emergencias_viales';

const INITIAL_STEP12_STATE: Step12State = {
  threats: [
    {
      id: 'TH-01',
      amenaza: 'Choques y colisiones frontales o por alcance en corredor vial',
      categoria: 'Operativa / Tránsito',
      origen: 'Externo',
      corredoresAfectados: 'Rutas Nacionales Primarias y Perímetro Urbano',
      probabilidad: 'Probable',
      vulnPersonasGestion: 0.5,
      vulnPersonasCapacitacion: 0.5,
      vulnPersonasDotacion: 0.0,
      vulnRecursosKitCarretera: 0.0,
      vulnRecursosEstadoFlota: 0.5,
      vulnRecursosEquiposRespuesta: 0.5,
      vulnSistemasAsistencia: 0.0,
      vulnSistemasComunicaciones: 0.5,
      vulnSistemasRecuperacion: 0.5,
      controlesExistentes: 'Monitoreo GPS satelital, control de velocidad Paso 8, mantenimiento preventivo Paso 16.',
      medidasIntervencion: 'Activación inmediata de PON-01/PON-02, Protocolo PAS y asistencia jurídica/vial de aseguradora.'
    },
    {
      id: 'TH-02',
      amenaza: 'Volcamiento lateral o total en curvas y descensos pronunciados',
      categoria: 'Operativa / Tránsito',
      origen: 'Socio-Natural',
      corredoresAfectados: 'Tramos de montaña (La Línea, Alto de Minas, Letras, Boquerón)',
      probabilidad: 'Posible',
      vulnPersonasGestion: 0.5,
      vulnPersonasCapacitacion: 0.5,
      vulnPersonasDotacion: 0.5,
      vulnRecursosKitCarretera: 0.5,
      vulnRecursosEstadoFlota: 0.5,
      vulnRecursosEquiposRespuesta: 0.5,
      vulnSistemasAsistencia: 0.5,
      vulnSistemasComunicaciones: 0.5,
      vulnSistemasRecuperacion: 1.0,
      controlesExistentes: 'Capacitación en manejo defensivo en montaña, inspección preoperacional de frenos y suspensión.',
      medidasIntervencion: 'Simulacro anual de rescate y contención de derrames, aseguramiento de carga y protocolo de emergencia médica.'
    },
    {
      id: 'TH-03',
      amenaza: 'Fallas mecánicas críticas en ruta (frenos, dirección, estallido de llanta o incendio)',
      categoria: 'Técnica / Mecánica',
      origen: 'Interno',
      corredoresAfectados: 'Toda la red vial de operación de la flota',
      probabilidad: 'Probable',
      vulnPersonasGestion: 0.0,
      vulnPersonasCapacitacion: 0.5,
      vulnPersonasDotacion: 0.0,
      vulnRecursosKitCarretera: 0.0,
      vulnRecursosEstadoFlota: 0.5,
      vulnRecursosEquiposRespuesta: 0.0,
      vulnSistemasAsistencia: 0.0,
      vulnSistemasComunicaciones: 0.0,
      vulnSistemasRecuperacion: 0.5,
      controlesExistentes: 'Inspección diaria preoperacional (Paso 15), cronograma de mantenimiento preventivo (Paso 16).',
      medidasIntervencion: 'Aplicación de PON-03 (Varada crítica en ruta), señalización con conos a 30m y 60m, uso de extintor multiproposito.'
    },
    {
      id: 'TH-04',
      amenaza: 'Condiciones climáticas adversas (lluvia torrencial, neblina densa, derrumbes o inundación)',
      categoria: 'Natural / Climática',
      origen: 'Socio-Natural',
      corredoresAfectados: 'Zonas de alta pluviosidad y taludes inestables en carretera nacional',
      probabilidad: 'Inminente',
      vulnPersonasGestion: 0.5,
      vulnPersonasCapacitacion: 0.5,
      vulnPersonasDotacion: 0.5,
      vulnRecursosKitCarretera: 0.0,
      vulnRecursosEstadoFlota: 0.5,
      vulnRecursosEquiposRespuesta: 0.5,
      vulnSistemasAsistencia: 0.5,
      vulnSistemasComunicaciones: 0.5,
      vulnSistemasRecuperacion: 0.5,
      controlesExistentes: 'Consulta previa #767 INVIAS, reporte climático en despacho, luces antiniebla y limpiaparabrisas operativos.',
      medidasIntervencion: 'Detención preventiva en bahía segura (PON-04), reducción del 30% de velocidad límite y reporte a Torre de Control.'
    },
    {
      id: 'TH-05',
      amenaza: 'Bloqueos en la vía, protestas o áreas con orden público complejo / hurto en carretera',
      categoria: 'Social / Orden Público',
      origen: 'Externo',
      corredoresAfectados: 'Accesos urbanos, peajes y corredores con alertas de seguridad vial',
      probabilidad: 'Probable',
      vulnPersonasGestion: 0.5,
      vulnPersonasCapacitacion: 0.5,
      vulnPersonasDotacion: 0.5,
      vulnRecursosKitCarretera: 0.5,
      vulnRecursosEstadoFlota: 0.5,
      vulnRecursosEquiposRespuesta: 1.0,
      vulnSistemasAsistencia: 0.5,
      vulnSistemasComunicaciones: 0.5,
      vulnSistemasRecuperacion: 0.5,
      controlesExistentes: 'Botón de pánico GPS, caravanas seguras con Red de Apoyo Policía Nacional, restricción de tránsito nocturno.',
      medidasIntervencion: 'Despliegue de PON-05: No confrontación, resguardo de la vida del conductor en punto seguro y enlace inmediato con 123 / #767.'
    }
  ],
  protocols: [
    {
      id: 'PON-01',
      codigo: 'PON-PESV-01',
      titulo: 'Siniestro Vial con Solo Daños Materiales (Choque Simple)',
      tipoIncidente: 'Solo Daños Materiales',
      version: 'V2.0',
      fechaActualizacion: '2026-06-01',
      responsable: 'Coordinador PESV / Jefe de Operaciones',
      objetivo: 'Establecer la secuencia segura de actuación del conductor ante colisiones sin lesionados, garantizando la protección de la escena, recaudo probatorio fotográfico y despeje oportuno de la vía (Ley 2251 de 2022).',
      pasosAntes: [
        'Verificar vigencia de SOAT, Póliza Todo Riesgo, revisión técnico-mecánica y kit de carretera completo antes de iniciar ruta.',
        'Mantener distancia de seguimiento segura (regla de los 3 segundos en seco y 5 segundos en lluvia).'
      ],
      pasosDurante: [
        'PROTEGER: Encender luces estacionarias de inmediato, apagar el motor, colocar freno de seguridad y ponerse el chaleco reflectivo antes de descender.',
        'Ubicar señales reflectivas o conos a 30 y 60 metros detrás del vehículo para evitar choques secundarios.',
        'AVISAR: Verificar que ningún ocupante o tercero presente lesiones. Contactar a la Aseguradora y al Coordinador PESV.',
        'EVIDENCIAR: Tomar fotografías panorámicas de los 4 ángulos, placas, daños y posición final usando el Formulario de Reporte Inmediato QR.',
        'Retirar los vehículos de la calzada tras fijar la evidencia fotográfica (conforme a la Ley 2251 de 2022 para choques simples).'
      ],
      pasosDespues: [
        'Diligenciar el Reporte Inmediato de Siniestro Vial en la plataforma PESV adjuntando ubicación GPS y fotografías.',
        'Participar en el Comité de Investigación de Siniestros Viales (Paso 14) para análisis de causas raíz.'
      ],
      contactosClave: 'Línea Nacional #767 | Emergencias 123 | Policía de Tránsito 127 | Aseguradora #888'
    },
    {
      id: 'PON-02',
      codigo: 'PON-PESV-02',
      titulo: 'Siniestro Vial con Heridos o Fallecidos (Atención a Víctimas - PAS)',
      tipoIncidente: 'Heridos o Fallecidos',
      version: 'V2.0',
      fechaActualizacion: '2026-06-01',
      responsable: 'Líder PESV / Brigada de Primeros Respondientes',
      objetivo: 'Preservar la vida de los actores viales involucrados mediante la aplicación estricta del Protocolo PAS (Proteger, Avisar, Socorrer), evitando agravar lesiones y asegurando la escena para autoridades médicas y judiciales.',
      pasosAntes: [
        'Contar con certificación vigente como Primer Respondiente en Primeros Auxilios Viales y botiquín tipo B completo.',
        'Conocer los números de emergencia del corredor vial y la ubicación de centros hospitalarios en la ruta.'
      ],
      pasosDurante: [
        'PROTEGER (P): Estacionar en lugar seguro, activar estacionarias, cortar fluido eléctrico del vehículo accidentado, asegurar que no exista fuga de combustible y señalizar a 50-100 metros.',
        'AVISAR (A): Llamar inmediatamente al 123 / #767 / 127 indicando: ubicación exacta (kilómetro/punto de referencia), número de vehículos, cantidad y estado de los heridos.',
        'SOCORRER (S): Evaluar conciencia y respiración sin mover al lesionado. NO retirar el casco a motociclistas ni movilizar víctimas con trauma, salvo riesgo inminente de incendio o explosión.',
        'Controlar hemorragias externas con gasas estériles y presión directa utilizando guantes de nitrilo/látex del botiquín.',
        'NO alterar la posición de los vehículos ni elementos materiales probatorios hasta la llegada de la autoridad de tránsito.'
      ],
      pasosDespues: [
        'Entregar la escena a los paramédicos y Policía de Carreteras, suministrando datos veraces y practicándose la prueba de alcoholemia legal.',
        'Activar acompañamiento psicosocial, médico (ARL/SOAT) y jurídico para el conductor y las familias afectadas.'
      ],
      contactosClave: 'CRUE / Ambulancias 123 | Policía de Carreteras #767 | Línea Vital ARL | Comité de Emergencias PESV'
    },
    {
      id: 'PON-03',
      codigo: 'PON-PESV-03',
      titulo: 'Fallas Mecánicas Críticas en Ruta o Conato de Incendio Vehicular',
      tipoIncidente: 'Fallas Críticas en Ruta',
      version: 'V1.5',
      fechaActualizacion: '2026-06-01',
      responsable: 'Jefe de Mantenimiento / Coordinador de Flota',
      objetivo: 'Controlar situaciones de pérdida de frenos, falla de dirección, rotura de suspensión o conato de incendio en ruta sin generar siniestros secundarios.',
      pasosAntes: [
        'Ejecutar rigurosamente la inspección preoperacional diaria y verificar presión del extintor y estado de tacos/bloqueos.',
        'En descensos prolongados, utilizar freno de motor / retardador y descender en el mismo cambio en que se sube.'
      ],
      pasosDurante: [
        'Ante falla de frenos: Mantener la calma, encender estacionarias, accionar el pito para alertar, desacelerar reduciendo marchas progresivamente (caja de cambios) y buscar rampa de frenado o berma ascendente.',
        'Ante varada crítica: Orillar el vehículo totalmente fuera de la calzada, colocar tacos en las llantas, chaleco reflectivo y conos a 30m y 60m.',
        'Ante humo o conato de incendio: Detenerse lejos de estaciones de servicio o vegetación seca, evacuar ocupantes, desconectar batería si es seguro y accionar el extintor hacia la base del fuego a favor del viento.'
      ],
      pasosDespues: [
        'Solicitar grúa o carro-taller autorizado; prohibido remolcar vehículos con cuerdas o cadenas improvisadas.',
        'Registrar novedad crítica en el módulo de Mantenimiento (Paso 16) antes de autorizar el reingreso del vehículo a operación.'
      ],
      contactosClave: 'Asistencia Carro-Taller / Grúa #767 | Bomberos 119 | Coordinación de Mantenimiento Flota'
    },
    {
      id: 'PON-04',
      codigo: 'PON-PESV-04',
      titulo: 'Condiciones Climáticas Adversas, Derrumbes o Inundación en Vía',
      tipoIncidente: 'Climático / Derrumbe',
      version: 'V1.3',
      fechaActualizacion: '2026-06-01',
      responsable: 'Centro de Control y Monitoreo Vial',
      objetivo: 'Prevenir pérdida de adherencia (hidroplaneo), colisiones por baja visibilidad o atrapamiento por deslizamientos de tierra en temporada invernal.',
      pasosAntes: [
        'Verificar labrado de llantas (>2mm en livianos, >3mm en pesados), plumillas limpiaparabrisas y sistema desempañante.',
        'Consultar estado de corredores viales en #767 antes de despachar rutas de montaña.'
      ],
      pasosDurante: [
        'En lluvia intensa o neblina: Encender luces bajas y exploradoras (nunca luces altas en neblina), reducir velocidad en un 30% y duplicar distancia de seguimiento.',
        'Si la visibilidad es menor a 20 metros o hay alerta de derrumbe/caída de roca: Detener la marcha en estación de servicio o bahía segura lejos de taludes, árboles y cauces de ríos.',
        'Jamás intentar cruzar corrientes de agua o zonas inundadas cuya profundidad supere el borde inferior del rin.'
      ],
      pasosDespues: [
        'Reportar la detención preventiva y coordenadas GPS a la empresa para reprogramar tiempos de entrega sin presión operativa.',
        'Reanudar marcha únicamente cuando las autoridades viales (INVIAS / DITRA) confirmen la apertura segura del corredor.'
      ],
      contactosClave: 'Estado de Vías INVIAS #767 | Defensa Civil 144 | Torre de Control Logístico'
    },
    {
      id: 'PON-05',
      codigo: 'PON-PESV-05',
      titulo: 'Bloqueos en la Vía o Áreas con Orden Público Complejo',
      tipoIncidente: 'Orden Público / Bloqueo',
      version: 'V1.4',
      fechaActualizacion: '2026-06-01',
      responsable: 'Jefe de Seguridad Física y Vial',
      objetivo: 'Proteger la integridad física de los conductores y la flota frente a bloqueos viales, alteraciones de orden público o intentos de hurto en carretera.',
      pasosAntes: [
        'Transitar únicamente por corredores viales autorizados en el Rutograma (Paso 17) y cumplir horarios de restricción nocturna.',
        'Verificar funcionamiento del botón de pánico GPS y comunicación celular antes de salir a ruta.'
      ],
      pasosDurante: [
        'No intentar sobrepasar ni romper bloqueos o manifestaciones por la fuerza; mantener actitud prudente y neutral.',
        'Retornar o resguardarse en el municipio, peaje, estación de servicio o puesto de control militar/policial más cercano.',
        'Activar botón de pánico o informar ubicación en tiempo real al Centro de Monitoreo y a la Red de Apoyo de la Policía Nacional (123 / #767).',
        'Mantener vidrios arriba, seguros puestos y proteger prioritariamente la vida e integridad humana sobre cualquier bien material.'
      ],
      pasosDespues: [
        'Esperar instrucciones de ruta alterna autorizada o escolta vial en caravana segura.',
        'Dejar trazabilidad del evento en la bitácora de emergencias viales para actualización del mapa de riesgos de ruta.'
      ],
      contactosClave: 'Policía Nacional 123 | Ejército / Gaula 147 | Red de Apoyo Seguridad Vial #767'
    }
  ],
  incidents: [
    {
      id: 'INC-2026-001',
      radicado: 'SIN-2026-001',
      fechaHora: '2026-06-14T08:35',
      conductorNombre: 'Carlos Andrés Restrepo Gómez',
      conductorCedula: '71.452.980',
      conductorTelefono: '3104589210',
      placaVehiculo: 'WXY-842',
      tipoVehiculo: 'Camión NHR',
      tipoEvento: 'Choque simple por alcance en corredor urbano',
      gravedad: 'Solo Daños Materiales',
      numeroLesionados: 0,
      ubicacionTexto: 'Autopista Norte Km 14 - Sentido Norte-Sur',
      latitud: '6.3315',
      longitud: '-75.5521',
      descripcionHechos: 'Frenado súbito de vehículo particular antecedente en piso húmedo; se aplicó PON-01, señalización con conos y fijación fotográfica de daños en bómper delantero.',
      aplicoProteger: true,
      aplicoAvisar: true,
      aplicoSocorrer: true,
      fotosDanos: [],
      estado: 'Investigado / Cerrado',
      accionesInmediatas: 'Señalización de escena a 30m, reporte a aseguradora y traslado seguro a patio para peritaje.'
    }
  ],
  drills: [
    {
      id: 'SIM-01',
      codigo: 'SIM-PESV-2026-01',
      tituloSimulacro: 'Simulacro de Siniestro Vial con Lesionado y Aplicación de Protocolo PAS',
      escenarioAmenaza: 'Choques y colisiones frontales o por alcance en corredor vial',
      fechaProgramada: '2026-04-20',
      fechaEjecucion: '2026-04-20',
      corredorOSede: 'Patio de Maniobras Principal / Salida Corredor Vial Norte',
      tipoSimulacro: 'Parcial en Patio',
      responsable: 'Coordinador PESV y Brigada Vial',
      participantesCount: 28,
      tiempoRespuestaMinutos: 4.5,
      metaTiempoMinutos: 6.0,
      calificacionEfectividad: 94,
      estado: 'Ejecutado',
      hallazgosMejora: 'Excelente reacción en acordonamiento a 50 metros y aseguramiento de escena; se recomienda reforzar el reporte de coordenadas exactas al 123 en los primeros 90 segundos.'
    },
    {
      id: 'SIM-02',
      codigo: 'SIM-PESV-2026-02',
      tituloSimulacro: 'Simulacro de Conato de Incendio Vehicular y Falla Crítica en Ruta',
      escenarioAmenaza: 'Fallas mecánicas críticas en ruta (frenos, dirección, estallido de llanta o incendio)',
      fechaProgramada: '2026-09-18',
      corredorOSede: 'Corredor Logístico Nacional - Punto Seguro Km 22',
      tipoSimulacro: 'Real en Ruta / Operativo',
      responsable: 'Jefe de Mantenimiento y Primeros Respondientes',
      participantesCount: 35,
      tiempoRespuestaMinutos: 0,
      metaTiempoMinutos: 5.0,
      calificacionEfectividad: 0,
      estado: 'Programado',
      hallazgosMejora: 'Pendiente de ejecución según cronograma anual PESV.'
    }
  ],
  responders: [
    {
      id: 'PR-01',
      nombreCompleto: 'Carlos Andrés Restrepo Gómez',
      cedula: '71.452.980',
      cargo: 'Conductor',
      telefono: '3104589210',
      placaAsignada: 'WXY-842',
      competenciaCertificada: 'Primer Respondiente y Primeros Auxilios Viales (Protocolo PAS + RCP)',
      entidadCertificadora: 'Cruz Roja Colombiana / ARL',
      numeroCertificado: 'CRC-PRV-2025-8841',
      fechaCertificacion: '2025-11-15',
      fechaVencimiento: '2027-11-15',
      horasFormacion: 20,
      idoneoAtencionVictimas: true
    },
    {
      id: 'PR-02',
      nombreCompleto: 'Jorge Eliécer Mendoza Silva',
      cedula: '80.194.332',
      cargo: 'Conductor',
      telefono: '3157824109',
      placaAsignada: 'TRK-910',
      competenciaCertificada: 'Atención Prehospitalaria Básica a Víctimas en Siniestros Viales y Control de Incendios',
      entidadCertificadora: 'SENA / Cuerpo Oficial de Bomberos',
      numeroCertificado: 'SENA-APV-2026-1092',
      fechaCertificacion: '2026-02-10',
      fechaVencimiento: '2028-02-10',
      horasFormacion: 40,
      idoneoAtencionVictimas: true
    },
    {
      id: 'PR-03',
      nombreCompleto: 'Diana Marcela Pineda Vargas',
      cedula: '1.032.448.910',
      cargo: 'Coordinador HSEQ',
      telefono: '3006541289',
      placaAsignada: 'ADM-001',
      competenciaCertificada: 'Líder de Brigada de Emergencias Viales e Investigación de Siniestros',
      entidadCertificadora: 'ARL / Consejo Colombiano de Seguridad',
      numeroCertificado: 'CCS-BEV-2025-4410',
      fechaCertificacion: '2025-05-20',
      fechaVencimiento: '2026-08-20',
      horasFormacion: 32,
      idoneoAtencionVictimas: true
    }
  ],
  emergencyLines: [
    { entidad: 'INVIAS - Seguridad y Asistencia en Carretera', linea: '#767', disponibilidad: '24/7 Nacional' },
    { entidad: 'Línea Única de Emergencias y Ambulancias (CRUE)', linea: '123', disponibilidad: '24/7 Nacional' },
    { entidad: 'Policía de Tránsito y Transporte (DITRA)', linea: '127', disponibilidad: '24/7 Nacional' },
    { entidad: 'Cuerpo Oficial de Bomberos', linea: '119', disponibilidad: '24/7 Nacional' },
    { entidad: 'Cruz Roja Colombiana - Socorro Vial', linea: '132', disponibilidad: '24/7 Nacional' },
    { entidad: 'Defensa Civil Colombiana', linea: '144', disponibilidad: '24/7 Nacional' }
  ]
};

// Helper for Vulnerability & Risk Diamond calculation (Metodología de Análisis de Vulnerabilidad Vial)
export function calculateThreatRiskAnalysis(item: ThreatVulnerabilityItem) {
  const sumPersonas = Number((item.vulnPersonasGestion + item.vulnPersonasCapacitacion + item.vulnPersonasDotacion).toFixed(1));
  const sumRecursos = Number((item.vulnRecursosKitCarretera + item.vulnRecursosEstadoFlota + item.vulnRecursosEquiposRespuesta).toFixed(1));
  const sumSistemas = Number((item.vulnSistemasAsistencia + item.vulnSistemasComunicaciones + item.vulnSistemasRecuperacion).toFixed(1));

  const getVulnLevel = (sum: number): { label: 'Baja' | 'Media' | 'Alta'; color: 'emerald' | 'amber' | 'rose' } => {
    if (sum <= 1.0) return { label: 'Baja', color: 'emerald' };
    if (sum <= 2.0) return { label: 'Media', color: 'amber' };
    return { label: 'Alta', color: 'rose' };
  };

  const getProbColor = (prob: ThreatVulnerabilityItem['probabilidad']): 'emerald' | 'amber' | 'rose' => {
    if (prob === 'Posible') return 'emerald';
    if (prob === 'Probable') return 'amber';
    return 'rose';
  };

  const personasRes = getVulnLevel(sumPersonas);
  const recursosRes = getVulnLevel(sumRecursos);
  const sistemasRes = getVulnLevel(sumSistemas);
  const probColor = getProbColor(item.probabilidad);

  const colors = [personasRes.color, recursosRes.color, sistemasRes.color, probColor];
  const highCount = colors.filter(c => c === 'rose').length;
  const medCount = colors.filter(c => c === 'amber').length;

  let nivelRiesgo: 'BAJO' | 'MEDIO' | 'ALTO' = 'BAJO';
  let interpretacion = 'El riesgo está controlado; mantener seguimiento preventivo.';
  if (highCount >= 3 || (highCount === 2 && medCount >= 1)) {
    nivelRiesgo = 'ALTO';
    interpretacion = 'Del 75% al 100% de los valores representan alta vulnerabilidad o amenaza inminente. Intervención prioritaria en ruta.';
  } else if (highCount >= 1 || medCount >= 2) {
    nivelRiesgo = 'MEDIO';
    interpretacion = 'Del 50% al 74% de los elementos presentan vulnerabilidad media o alta. Requiere PON activo y simulacro periódico.';
  }

  return {
    sumPersonas,
    sumRecursos,
    sumSistemas,
    personasRes,
    recursosRes,
    sistemasRes,
    probColor,
    nivelRiesgo,
    interpretacion
  };
}

interface Step12PublicPortalModalProps {
  mode: 'protocolo-pas' | 'reporte-siniestro';
  companyName: string;
  companyNit: string;
  companyLogo?: string;
  isStandalonePage?: boolean;
  onClose: () => void;
}

export function Step12PublicPortalModal({
  mode: initialMode,
  companyName,
  companyNit,
  companyLogo,
  isStandalonePage = false,
  onClose
}: Step12PublicPortalModalProps) {
  const [activeMode, setActiveMode] = useState<'protocolo-pas' | 'reporte-siniestro'>(initialMode);
  const [state, setState] = useState<Step12State>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...INITIAL_STEP12_STATE, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return INITIAL_STEP12_STATE;
  });

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');
  const [submittedRadicado, setSubmittedRadicado] = useState<string | null>(null);

  const [reportForm, setReportForm] = useState({
    conductorNombre: '',
    conductorCedula: '',
    conductorTelefono: '',
    placaVehiculo: '',
    tipoVehiculo: 'Camión / Flota Operativa',
    tipoEvento: 'Choque simple solo daños materiales',
    gravedad: 'Solo Daños Materiales' as EmergencyIncidentReport['gravedad'],
    numeroLesionados: 0,
    ubicacionTexto: '',
    latitud: '',
    longitud: '',
    descripcionHechos: '',
    aplicoProteger: true,
    aplicoAvisar: true,
    aplicoSocorrer: true,
    accionesInmediatas: '',
    fotosDanos: [] as { nombre: string; dataUrl: string }[]
  });

  useEffect(() => {
    const unsub = subscribeToSystemSetting(FIRESTORE_DOC_ID, (cloudData) => {
      if (cloudData) {
        setState(prev => ({ ...prev, ...cloudData }));
      }
    });
    return () => unsub();
  }, []);

  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatus('El navegador no soporta geolocalización automática. Ingresa el punto de referencia manualmente.');
      return;
    }
    setGpsLoading(true);
    setGpsStatus('Obteniendo coordenadas satelitales GPS...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setReportForm(prev => ({
          ...prev,
          latitud: lat,
          longitud: lng,
          ubicacionTexto: prev.ubicacionTexto || `Coordenadas GPS: ${lat}, ${lng}`
        }));
        setGpsLoading(false);
        setGpsStatus(`Coordenadas capturadas con éxito (${lat}, ${lng})`);
      },
      () => {
        setGpsLoading(false);
        setGpsStatus('No se pudo obtener el GPS automático (verifica permisos de ubicación). Puedes escribir el kilómetro o dirección.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).slice(0, 4).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setReportForm(prev => ({
            ...prev,
            fotosDanos: [...prev.fotosDanos, { nombre: file.name, dataUrl: reader.result as string }]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmitEmergencyReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.conductorNombre.trim() || !reportForm.placaVehiculo.trim()) return;

    const radicado = `SIN-${new Date().getFullYear()}-${String(state.incidents.length + 1).padStart(3, '0')}`;
    const newIncident: EmergencyIncidentReport = {
      id: `INC-${Date.now()}`,
      radicado,
      fechaHora: new Date().toISOString().slice(0, 16),
      conductorNombre: reportForm.conductorNombre.trim(),
      conductorCedula: reportForm.conductorCedula.trim(),
      conductorTelefono: reportForm.conductorTelefono.trim(),
      placaVehiculo: reportForm.placaVehiculo.trim().toUpperCase(),
      tipoVehiculo: reportForm.tipoVehiculo,
      tipoEvento: reportForm.tipoEvento,
      gravedad: reportForm.gravedad,
      numeroLesionados: Number(reportForm.numeroLesionados) || 0,
      ubicacionTexto: reportForm.ubicacionTexto.trim() || 'Reportado desde móvil en ruta',
      latitud: reportForm.latitud,
      longitud: reportForm.longitud,
      descripcionHechos: reportForm.descripcionHechos.trim(),
      aplicoProteger: reportForm.aplicoProteger,
      aplicoAvisar: reportForm.aplicoAvisar,
      aplicoSocorrer: reportForm.aplicoSocorrer,
      fotosDanos: reportForm.fotosDanos,
      estado: 'Reportado',
      accionesInmediatas: reportForm.accionesInmediatas.trim() || 'Protocolo PAS activado por primer respondiente en sitio.'
    };

    const updatedState: Step12State = {
      ...state,
      incidents: [newIncident, ...state.incidents]
    };
    setState(updatedState);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState));
    } catch {
      // ignore quota error
    }
    saveSystemSetting(FIRESTORE_DOC_ID, updatedState);
    setSubmittedRadicado(radicado);
  };

  return (
    <div className={`${isStandalonePage ? 'min-h-screen bg-slate-900 py-6 px-4' : 'fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto'}`}>
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Top Emergency Header */}
        <div className="bg-gradient-to-r from-rose-700 via-red-600 to-amber-600 text-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {companyLogo ? (
                <img src={companyLogo} alt={companyName} className="w-11 h-11 rounded-lg bg-white p-1 object-contain" />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center border border-white/25">
                  <Siren size={24} className="text-white" />
                </div>
              )}
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest bg-black/25 px-2 py-0.5 rounded">
                  PASO 12 PESV • ASISTENCIA VIAL MÓVIL 24/7
                </span>
                <h2 className="text-lg font-black leading-tight mt-0.5">{companyName}</h2>
                <p className="text-xs text-rose-100">NIT: {companyNit}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors"
            >
              {isStandalonePage ? 'Ir a Plataforma' : 'Cerrar'}
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 mt-4 bg-black/20 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => { setActiveMode('protocolo-pas'); setSubmittedRadicado(null); }}
              className={`py-2 px-3 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                activeMode === 'protocolo-pas'
                  ? 'bg-white text-rose-700 shadow-sm'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <HeartPulse size={15} />
              1. Protocolo PAS (Guía Rápida)
            </button>
            <button
              type="button"
              onClick={() => { setActiveMode('reporte-siniestro'); setSubmittedRadicado(null); }}
              className={`py-2 px-3 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                activeMode === 'reporte-siniestro'
                  ? 'bg-white text-rose-700 shadow-sm'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <Camera size={15} />
              2. Reportar Siniestro + GPS
            </button>
          </div>
        </div>

        {activeMode === 'protocolo-pas' ? (
          <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase text-rose-800">Líneas de Emergencia Vial en Ruta</p>
                <p className="text-xs text-rose-600">Toque cualquier número para marcar desde su celular:</p>
              </div>
              <div className="flex gap-1.5">
                <a href="tel:123" className="bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs font-black shadow-sm hover:bg-rose-700">
                  123
                </a>
                <a href="tel:#767" className="bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-black shadow-sm hover:bg-amber-700">
                  #767
                </a>
                <a href="tel:127" className="bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-black shadow-sm hover:bg-slate-900">
                  127
                </a>
              </div>
            </div>

            {/* P - A - S Interactive Cards */}
            <div className="space-y-3">
              <div className="border-2 border-amber-400 bg-amber-50/70 rounded-xl p-4">
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="w-8 h-8 rounded-lg bg-amber-500 text-white font-black text-base flex items-center justify-center shadow-sm">
                    P
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-amber-950 uppercase">1. PROTEGER (Asegurar la Escena)</h3>
                    <p className="text-[11px] text-amber-800 font-semibold">Evite un segundo accidente antes de atender</p>
                  </div>
                </div>
                <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-5 font-medium">
                  <li>Encienda luces estacionarias de inmediato, ponga freno de parqueo y apague el motor.</li>
                  <li>Póngase el <strong>chaleco reflectivo</strong> antes de bajar del vehículo.</li>
                  <li>Ubique conos o triángulos reflectivos a <strong>30 metros y 60 metros</strong> (en curva o noche a 100 metros).</li>
                  <li>Verifique que no existan fugas de combustible, cables eléctricos caídos o riesgo de incendio.</li>
                </ul>
              </div>

              <div className="border-2 border-blue-400 bg-blue-50/70 rounded-xl p-4">
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-base flex items-center justify-center shadow-sm">
                    A
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-blue-950 uppercase">2. AVISAR (Activar Ayuda Especializada)</h3>
                    <p className="text-[11px] text-blue-800 font-semibold">Comunique datos claros y precisos a las autoridades</p>
                  </div>
                </div>
                <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-5 font-medium">
                  <li>Llame al <strong>123 (Emergencias)</strong>, <strong>#767 (INVIAS)</strong> o <strong>127 (Policía de Tránsito)</strong>.</li>
                  <li>Informe: Ubicación exacta o coordenadas GPS, tipo de vehículos involucrados y número de lesionados.</li>
                  <li>Notifique al Coordinador PESV / Centro de Control de <strong>{companyName}</strong> y a la Aseguradora.</li>
                </ul>
              </div>

              <div className="border-2 border-emerald-400 bg-emerald-50/70 rounded-xl p-4">
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black text-base flex items-center justify-center shadow-sm">
                    S
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-emerald-950 uppercase">3. SOCORRER (Primer Respondiente)</h3>
                    <p className="text-[11px] text-emerald-800 font-semibold">Solo actúe según su capacitación sin agravar lesiones</p>
                  </div>
                </div>
                <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-5 font-medium">
                  <li>Evalúe estado de conciencia y respiración hablándole a la víctima sin sacudirla.</li>
                  <li><strong>NO mueva a los heridos</strong> ni retire el casco a motociclistas (riesgo de lesión medular).</li>
                  <li>Controle hemorragias externas aplicando presión directa con gasas limpias y guantes de bioseguridad.</li>
                  <li>Acompañe y tranquilice al lesionado hasta que llegue la ambulancia.</li>
                </ul>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveMode('reporte-siniestro')}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Camera size={16} />
                Diligenciar Reporte Inmediato de Siniestro Vial (GPS + Fotos)
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 max-h-[80vh] overflow-y-auto">
            {submittedRadicado ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={36} />
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                    Radicado Oficial: {submittedRadicado}
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-2">
                    ¡Reporte de Emergencia Vial Registrado en Tiempo Real!
                  </h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                    La información, coordenadas GPS y fotografías de los daños ya están disponibles en el Centro de Control PESV (Paso 12).
                  </p>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedRadicado(null);
                      setReportForm({
                        conductorNombre: '',
                        conductorCedula: '',
                        conductorTelefono: '',
                        placaVehiculo: '',
                        tipoVehiculo: 'Camión / Flota Operativa',
                        tipoEvento: 'Choque simple solo daños materiales',
                        gravedad: 'Solo Daños Materiales',
                        numeroLesionados: 0,
                        ubicacionTexto: '',
                        latitud: '',
                        longitud: '',
                        descripcionHechos: '',
                        aplicoProteger: true,
                        aplicoAvisar: true,
                        aplicoSocorrer: true,
                        accionesInmediatas: '',
                        fotosDanos: []
                      });
                    }}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Enviar Otro Reporte
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMode('protocolo-pas')}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Ver Protocolo PAS
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitEmergencyReport} className="space-y-3.5">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 font-medium">
                  <strong>Formulario de Primer Respondiente / Conductor:</strong> Registre en tiempo real los datos del siniestro vial, capture su geolocalización GPS y adjunte fotos de los daños.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Nombre del Conductor / Respondiente *</label>
                    <input
                      type="text"
                      required
                      value={reportForm.conductorNombre}
                      onChange={e => setReportForm({ ...reportForm, conductorNombre: e.target.value })}
                      placeholder="Ej. Carlos Andrés Restrepo"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-rose-600"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Placa Vehículo *</label>
                      <input
                        type="text"
                        required
                        value={reportForm.placaVehiculo}
                        onChange={e => setReportForm({ ...reportForm, placaVehiculo: e.target.value.toUpperCase() })}
                        placeholder="WXY-842"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg uppercase font-bold focus:outline-none focus:border-rose-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Celular Contacto</label>
                      <input
                        type="text"
                        value={reportForm.conductorTelefono}
                        onChange={e => setReportForm({ ...reportForm, conductorTelefono: e.target.value })}
                        placeholder="310..."
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-rose-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Tipo de Evento Vial</label>
                    <select
                      value={reportForm.tipoEvento}
                      onChange={e => setReportForm({ ...reportForm, tipoEvento: e.target.value })}
                      className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Choque simple solo daños materiales">Choque simple (Solo daños)</option>
                      <option value="Colisión con lesionados en vía">Colisión con lesionados</option>
                      <option value="Volcamiento en ruta">Volcamiento en ruta</option>
                      <option value="Atropellamiento a actor vial">Atropellamiento a actor vial</option>
                      <option value="Falla mecánica crítica / Incendio">Falla mecánica crítica / Incendio</option>
                      <option value="Bloqueo vial / Orden público">Bloqueo vial / Orden público</option>
                      <option value="Derrumbe o evento climático">Derrumbe o evento climático</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Nivel de Gravedad</label>
                    <select
                      value={reportForm.gravedad}
                      onChange={e => setReportForm({ ...reportForm, gravedad: e.target.value as EmergencyIncidentReport['gravedad'] })}
                      className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Solo Daños Materiales">Solo Daños Materiales</option>
                      <option value="Heridos Leves">Heridos Leves</option>
                      <option value="Heridos Graves / Fatalidad">Heridos Graves / Fatalidad</option>
                      <option value="Incidente / Casi Accidente">Incidente / Casi Accidente</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">N° de Lesionados</label>
                    <input
                      type="number"
                      min={0}
                      value={reportForm.numeroLesionados}
                      onChange={e => setReportForm({ ...reportForm, numeroLesionados: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Geolocalización GPS */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                      <MapPin size={14} className="text-rose-600" />
                      Geolocalización y Punto Exacto del Siniestro
                    </label>
                    <button
                      type="button"
                      onClick={handleCaptureGPS}
                      disabled={gpsLoading}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-sm"
                    >
                      <Navigation size={12} />
                      {gpsLoading ? 'Capturando GPS...' : 'Capturar GPS Actual'}
                    </button>
                  </div>
                  {gpsStatus && (
                    <p className="text-[11px] text-blue-700 font-semibold">{gpsStatus}</p>
                  )}
                  <input
                    type="text"
                    value={reportForm.ubicacionTexto}
                    onChange={e => setReportForm({ ...reportForm, ubicacionTexto: e.target.value })}
                    placeholder="Dirección, corredor vial, kilómetro o punto de referencia..."
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={reportForm.latitud}
                      onChange={e => setReportForm({ ...reportForm, latitud: e.target.value })}
                      placeholder="Latitud (ej. 6.2442)"
                      className="px-2.5 py-1 text-[11px] border border-slate-200 rounded bg-white"
                    />
                    <input
                      type="text"
                      value={reportForm.longitud}
                      onChange={e => setReportForm({ ...reportForm, longitud: e.target.value })}
                      placeholder="Longitud (ej. -75.5812)"
                      className="px-2.5 py-1 text-[11px] border border-slate-200 rounded bg-white"
                    />
                  </div>
                </div>

                {/* Carga de fotos de los daños */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                      <Camera size={14} className="text-rose-600" />
                      Registro Fotográfico de los Daños y Escena Vial
                    </label>
                    <label className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                      <Upload size={12} />
                      Subir / Tomar Fotos
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {reportForm.fotosDanos.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2 pt-1">
                      {reportForm.fotosDanos.map((foto, idx) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-300 h-16 bg-white">
                          <img src={foto.dataUrl} alt={foto.nombre} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setReportForm(prev => ({
                              ...prev,
                              fotosDanos: prev.fotosDanos.filter((_, i) => i !== idx)
                            }))}
                            className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-0.5 cursor-pointer"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500">
                      Puede adjuntar hasta 4 fotografías panorámicas de los daños materiales, placas y señalización de la vía.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Descripción Breve del Siniestro y Estado de la Vía *</label>
                  <textarea
                    rows={2}
                    required
                    value={reportForm.descripcionHechos}
                    onChange={e => setReportForm({ ...reportForm, descripcionHechos: e.target.value })}
                    placeholder="Describa qué ocurrió, condiciones de la vía y acciones realizadas..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                {/* Verificación PAS */}
                <div className="flex flex-wrap gap-3 bg-emerald-50/70 border border-emerald-200 p-2.5 rounded-xl text-xs font-bold text-emerald-950">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reportForm.aplicoProteger}
                      onChange={e => setReportForm({ ...reportForm, aplicoProteger: e.target.checked })}
                    />
                    1. Escena Protegida (Conos/Chaleco)
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reportForm.aplicoAvisar}
                      onChange={e => setReportForm({ ...reportForm, aplicoAvisar: e.target.checked })}
                    />
                    2. Autoridades / Empresa Avisadas
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reportForm.aplicoSocorrer}
                      onChange={e => setReportForm({ ...reportForm, aplicoSocorrer: e.target.checked })}
                    />
                    3. Verificación de Víctimas (Socorrer)
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-md cursor-pointer transition-all"
                >
                  Transmitir Reporte Inmediato de Siniestro Vial
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface Step12EmergencyModuleProps {
  config: CompanyConfig;
  companyName: string;
  companyNit: string;
  companyLogo?: string;
}

export default function Step12EmergencyModule({
  config,
  companyName,
  companyNit,
  companyLogo = ''
}: Step12EmergencyModuleProps) {
  const [activeTab, setActiveTab] = useState<'amenazas' | 'protocolos' | 'qr-pas' | 'reportes' | 'simulacros' | 'capacitacion'>('amenazas');

  const [state, setState] = useState<Step12State>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...INITIAL_STEP12_STATE, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return INITIAL_STEP12_STATE;
  });

  // Modals & UI feedback states
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [publicModalMode, setPublicModalMode] = useState<'protocolo-pas' | 'reporte-siniestro' | null>(null);

  // Threat / Vulnerability Editor State
  const [editingThreat, setEditingThreat] = useState<ThreatVulnerabilityItem | null>(null);
  const [isNewThreat, setIsNewThreat] = useState(false);

  // PON Protocol Editor State
  const [selectedPonId, setSelectedPonId] = useState<string>('PON-01');
  const [editingPon, setEditingPon] = useState<PONProtocolItem | null>(null);
  const [isNewPon, setIsNewPon] = useState(false);

  // Incident Report Form inside Admin
  const [showNewIncidentForm, setShowNewIncidentForm] = useState(false);
  const [gpsCapturing, setGpsCapturing] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [newIncident, setNewIncident] = useState({
    conductorNombre: '',
    conductorCedula: '',
    conductorTelefono: '',
    placaVehiculo: '',
    tipoVehiculo: 'Camión / Flota',
    tipoEvento: 'Choque simple por alcance en corredor vial',
    gravedad: 'Solo Daños Materiales' as EmergencyIncidentReport['gravedad'],
    numeroLesionados: 0,
    ubicacionTexto: '',
    latitud: '',
    longitud: '',
    descripcionHechos: '',
    aplicoProteger: true,
    aplicoAvisar: true,
    aplicoSocorrer: true,
    accionesInmediatas: '',
    fotosDanos: [] as { nombre: string; dataUrl: string }[]
  });

  // Drills Editor State
  const [editingDrill, setEditingDrill] = useState<RoadDrillRecord | null>(null);
  const [isNewDrill, setIsNewDrill] = useState(false);

  // First Responders Editor State
  const [responderSearch, setResponderSearch] = useState('');
  const [editingResponder, setEditingResponder] = useState<FirstResponderRecord | null>(null);
  const [isNewResponder, setIsNewResponder] = useState(false);

  // QR Canvas Refs
  const qrPasCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const qrReportCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copiedLinkType, setCopiedLinkType] = useState<'pas' | 'reporte' | null>(null);

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pesv-colombia.app';
  const pasPublicUrl = `${originUrl}/?canal=protocolo-pas&nit=${encodeURIComponent(companyNit)}&empresa=${encodeURIComponent(companyName)}`;
  const reportPublicUrl = `${originUrl}/?canal=reporte-siniestro&nit=${encodeURIComponent(companyNit)}&empresa=${encodeURIComponent(companyName)}`;

  // Sync with Firestore
  useEffect(() => {
    const unsub = subscribeToSystemSetting(FIRESTORE_DOC_ID, (cloudData) => {
      if (cloudData) {
        setState(prev => {
          const merged = { ...prev, ...cloudData };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          } catch {
            // ignore
          }
          return merged;
        });
      }
    });
    return () => unsub();
  }, []);

  const persistStep12State = (updated: Step12State, msg?: string) => {
    setState(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    saveSystemSetting(FIRESTORE_DOC_ID, updated);
    if (msg) {
      setStatusBanner(msg);
      setTimeout(() => setStatusBanner(null), 3200);
    }
  };

  // Render QR codes when on QR tab or mounted
  useEffect(() => {
    if (qrPasCanvasRef.current) {
      QRCode.toCanvas(qrPasCanvasRef.current, pasPublicUrl, {
        width: 176,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' }
      }).catch(() => {});
    }
    if (qrReportCanvasRef.current) {
      QRCode.toCanvas(qrReportCanvasRef.current, reportPublicUrl, {
        width: 176,
        margin: 1,
        color: { dark: '#991b1b', light: '#ffffff' }
      }).catch(() => {});
    }
  }, [activeTab, pasPublicUrl, reportPublicUrl]);

  const downloadQrImage = (canvas: HTMLCanvasElement | null, filename: string) => {
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // PDF Export for Full Plan de Preparación y Respuesta ante Emergencias Viales (Paso 12)
  const exportFullEmergencyPlanPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 18;

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(12, 10, pageW - 24, 24, 'F');
    if (companyLogo && companyLogo.startsWith('data:image')) {
      try {
        doc.addImage(companyLogo, 'PNG', 15, 12, 18, 18);
      } catch {
        // ignore logo error
      }
    }
    const textStartX = companyLogo ? 36 : 16;
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('PLAN DE PREPARACION Y RESPUESTA ANTE EMERGENCIAS VIALES (PASO 12)', textStartX, 18);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${companyName} | NIT: ${companyNit} | Nivel PESV: ${config.nivelCalculado}`, textStartX, 24);
    doc.text(`Resolucion 40595 de 2022 - Ministerio de Transporte | Fecha: ${new Date().toISOString().slice(0, 10)}`, textStartX, 29);

    y = 42;

    // Section 1: Evaluación de Amenazas y Vulnerabilidad
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('1. EVALUACION DE AMENAZAS EN RUTA Y ANALISIS DE VULNERABILIDAD VIAL', 14, y);
    y += 5;

    state.threats.forEach((t, idx) => {
      if (y > 245) { doc.addPage(); y = 20; }
      const calc = calculateThreatRiskAnalysis(t);
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, pageW - 28, 16, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${idx + 1}. ${t.amenaza} [${t.categoria}]`, 16, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`Probabilidad: ${t.probabilidad} | Vuln. Personas: ${calc.personasRes.label} (${calc.sumPersonas}) | Flota: ${calc.recursosRes.label} (${calc.sumRecursos}) | Sistemas: ${calc.sistemasRes.label} (${calc.sumSistemas}) => RIESGO: ${calc.nivelRiesgo}`, 16, y + 10);
      doc.text(`Corredores: ${t.corredoresAfectados.slice(0, 95)}`, 16, y + 14);
      y += 18;
    });

    y += 3;
    if (y > 235) { doc.addPage(); y = 20; }

    // Section 2: Protocolos PON
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('2. REPOSITORIO DE PROCEDIMIENTOS OPERATIVOS NORMALIZADOS (PON)', 14, y);
    y += 5;

    state.protocols.forEach((p) => {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(`${p.codigo} - ${p.titulo} (${p.version})`, 15, y + 4);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      const objLines = doc.splitTextToSize(`Objetivo: ${p.objetivo}`, pageW - 32);
      doc.text(objLines, 15, y + 8);
      y += 8 + objLines.length * 3.5;
    });

    y += 4;
    if (y > 230) { doc.addPage(); y = 20; }

    // Section 3: Simulacros y Primeros Respondientes
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('3. PROGRAMACION DE SIMULACROS VIALES Y PRIMEROS RESPONDIENTES CERTIFICADOS', 14, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`• Simulacros programados/ejecutados: ${state.drills.length} | Primeros respondientes certificados: ${state.responders.length}`, 15, y);
    y += 5;
    state.responders.forEach((r) => {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.text(`- ${r.nombreCompleto} (CC ${r.cedula}) | ${r.cargo} | ${r.competenciaCertificada} | Entidad: ${r.entidadCertificadora} | Vence: ${r.fechaVencimiento}`, 16, y);
      y += 4.5;
    });

    doc.save(`Plan_Emergencias_Viales_Paso12_${companyName.replace(/\s+/g, '_')}.pdf`);
  };

  // Export single PON PDF
  const exportSinglePonPDF = (pon: PONProtocolItem) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 18;

    doc.setFillColor(153, 27, 27);
    doc.rect(12, 10, pageW - 24, 22, 'F');
    if (companyLogo && companyLogo.startsWith('data:image')) {
      try {
        doc.addImage(companyLogo, 'PNG', 15, 12, 16, 16);
      } catch {}
    }
    const startX = companyLogo ? 35 : 16;
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(`PROCEDIMIENTO OPERATIVO NORMALIZADO (${pon.codigo})`, startX, 18);
    doc.setFontSize(8.5);
    doc.text(`${pon.titulo} | ${companyName}`, startX, 24);
    doc.setFont('helvetica', 'normal');
    doc.text(`Version: ${pon.version} | Actualizacion: ${pon.fechaActualizacion} | Responsable: ${pon.responsable}`, startX, 29);

    y = 40;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('1. OBJETIVO DEL PROTOCOLO', 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const objLines = doc.splitTextToSize(pon.objetivo, pageW - 28);
    doc.text(objLines, 14, y);
    y += objLines.length * 4.2 + 4;

    const renderPhase = (title: string, steps: string[]) => {
      if (y > 235) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(title, 14, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      steps.forEach((st, i) => {
        const lines = doc.splitTextToSize(`${i + 1}. ${st}`, pageW - 30);
        if (y + lines.length * 4 > 255) { doc.addPage(); y = 20; }
        doc.text(lines, 16, y);
        y += lines.length * 4 + 1.5;
      });
      y += 3;
    };

    renderPhase('2. ANTES DE LA EMERGENCIA (PREVENCION Y PREPARACION)', pon.pasosAntes);
    renderPhase('3. DURANTE LA EMERGENCIA EN RUTA (APLICACION PROTOCOLO PAS)', pon.pasosDurante);
    renderPhase('4. DESPUES DE LA EMERGENCIA (REPORTE E INVESTIGACION)', pon.pasosDespues);

    doc.setFont('helvetica', 'bold');
    doc.text(`Contactos de Emergencia: ${pon.contactosClave}`, 14, y + 3);

    doc.save(`${pon.codigo}_${pon.titulo.replace(/\s+/g, '_').slice(0, 30)}.pdf`);
  };

  const selectedPon = state.protocols.find(p => p.id === selectedPonId) || state.protocols[0];

  const getResponderStatus = (vencimiento: string): { label: 'Vigente' | 'Próximo a Vencer' | 'Vencido'; badge: string } => {
    const today = new Date();
    const exp = new Date(vencimiento);
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: 'Vencido', badge: 'bg-rose-100 text-rose-800 border-rose-200' };
    if (diffDays <= 60) return { label: 'Próximo a Vencer', badge: 'bg-amber-100 text-amber-800 border-amber-200' };
    return { label: 'Vigente', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  };

  return (
    <div className="mt-6 space-y-5 border-t border-slate-200 pt-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 text-white rounded-2xl p-5 shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-400 shrink-0">
              <Siren size={26} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  PASO 12 • RESOLUCIÓN 40595 DE 2022
                </span>
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded border border-emerald-500/30">
                  Sincronizado en Nube & QR Móvil Activo
                </span>
              </div>
              <h3 className="text-lg font-black tracking-tight mt-1">
                Plan de Preparación y Respuesta ante Emergencias Viales
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 max-w-3xl">
                Gestión integral de amenazas en ruta, análisis de vulnerabilidad (Diamante de Riesgo), repositorio de PONs, Protocolo PAS móvil por QR, reporte inmediato con GPS/fotos, simulacros viales y base de datos de primeros respondientes.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setPublicModalMode('protocolo-pas')}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
            >
              <QrCode size={15} />
              Vista Móvil Protocolo PAS
            </button>
            <button
              type="button"
              onClick={exportFullEmergencyPlanPDF}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-900 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
            >
              <Download size={15} />
              Descargar Plan Paso 12 (PDF)
            </button>
          </div>
        </div>

        {/* KPI Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-4 pt-4 border-t border-white/10">
          <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Amenazas en Ruta</p>
            <p className="text-lg font-black text-white mt-0.5">{state.threats.length} Evaluadas</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Riesgo Alto / Crítico</p>
            <p className="text-lg font-black text-rose-400 mt-0.5">
              {state.threats.filter(t => calculateThreatRiskAnalysis(t).nivelRiesgo === 'ALTO').length} Corredores
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Repositorio PON</p>
            <p className="text-lg font-black text-amber-300 mt-0.5">{state.protocols.length} Protocolos</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Reportes en Ruta</p>
            <p className="text-lg font-black text-sky-300 mt-0.5">{state.incidents.length} Registrados</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Simulacros Viales</p>
            <p className="text-lg font-black text-emerald-300 mt-0.5">
              {state.drills.filter(d => d.estado === 'Ejecutado').length}/{state.drills.length} Ejecutados
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Primeros Respondientes</p>
            <p className="text-lg font-black text-white mt-0.5">
              {state.responders.filter(r => r.idoneoAtencionVictimas).length} Certificados
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

      {/* Navigation Tabs for the 6 Core Modules of Step 12 */}
      <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('amenazas')}
          className={`px-3 py-2 rounded-lg text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
            activeTab === 'amenazas' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
          }`}
        >
          <ShieldAlert size={14} />
          1. Amenazas y Vulnerabilidad
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('protocolos')}
          className={`px-3 py-2 rounded-lg text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
            activeTab === 'protocolos' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
          }`}
        >
          <FileText size={14} />
          2. Repositorio de Protocolos (PON)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('qr-pas')}
          className={`px-3 py-2 rounded-lg text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
            activeTab === 'qr-pas' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
          }`}
        >
          <QrCode size={14} />
          3. Código QR - Protocolo PAS
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reportes')}
          className={`px-3 py-2 rounded-lg text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
            activeTab === 'reportes' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
          }`}
        >
          <Camera size={14} />
          4. Reporte Inmediato (GPS + Fotos)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('simulacros')}
          className={`px-3 py-2 rounded-lg text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
            activeTab === 'simulacros' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
          }`}
        >
          <Calendar size={14} />
          5. Programación y Simulacros
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('capacitacion')}
          className={`px-3 py-2 rounded-lg text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
            activeTab === 'capacitacion' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
          }`}
        >
          <Award size={14} />
          6. Primeros Auxilios Viales (Respondientes)
        </button>
      </div>

      {/* TAB 1: EVALUACIÓN DE AMENAZAS EN RUTA Y ANÁLISIS DE VULNERABILIDAD */}
      {activeTab === 'amenazas' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <ShieldAlert size={17} className="text-rose-600" />
                Módulo de Evaluación de Amenazas en Ruta y Análisis de Vulnerabilidad (Diamante de Riesgo)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Califique las amenazas viales (choques, volcamientos, fallas mecánicas, clima adverso, bloqueos y orden público) y mida qué tan expuestos están los conductores, la flota y los procesos.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsNewThreat(true);
                setEditingThreat({
                  id: `TH-${Date.now().toString().slice(-4)}`,
                  amenaza: '',
                  categoria: 'Operativa / Tránsito',
                  origen: 'Externo',
                  corredoresAfectados: '',
                  probabilidad: 'Probable',
                  vulnPersonasGestion: 0.5,
                  vulnPersonasCapacitacion: 0.5,
                  vulnPersonasDotacion: 0.0,
                  vulnRecursosKitCarretera: 0.0,
                  vulnRecursosEstadoFlota: 0.5,
                  vulnRecursosEquiposRespuesta: 0.5,
                  vulnSistemasAsistencia: 0.5,
                  vulnSistemasComunicaciones: 0.0,
                  vulnSistemasRecuperacion: 0.5,
                  controlesExistentes: '',
                  medidasIntervencion: ''
                });
              }}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
            >
              <Plus size={14} />
              Agregar Amenaza en Ruta
            </button>
          </div>

          {/* Threat & Vulnerability Matrix Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-3">Amenaza en Ruta / Corredor</th>
                    <th className="py-3 px-2.5 text-center">Calificación Amenaza</th>
                    <th className="py-3 px-2.5 text-center">Vuln. Personas (Conductores)</th>
                    <th className="py-3 px-2.5 text-center">Vuln. Recursos (Flota/Kit)</th>
                    <th className="py-3 px-2.5 text-center">Vuln. Sistemas y Procesos</th>
                    <th className="py-3 px-3 text-center">Diamante / Nivel de Riesgo</th>
                    <th className="py-3 px-3">Controles y Medidas de Respuesta</th>
                    <th className="py-3 px-2.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {state.threats.map((item) => {
                    const calc = calculateThreatRiskAnalysis(item);
                    const badgeColor = (c: 'emerald' | 'amber' | 'rose') =>
                      c === 'emerald'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : c === 'amber'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-rose-100 text-rose-800 border-rose-300';

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 max-w-xs">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {item.categoria}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400">({item.origen})</span>
                          </div>
                          <p className="font-bold text-slate-900 leading-snug">{item.amenaza}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                            <MapPin size={11} className="text-slate-400 shrink-0" />
                            {item.corredoresAfectados}
                          </p>
                        </td>

                        <td className="py-3 px-2.5 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-black border ${badgeColor(calc.probColor)}`}>
                            {item.probabilidad}
                          </span>
                        </td>

                        <td className="py-3 px-2.5 text-center">
                          <div className={`inline-flex flex-col items-center px-2.5 py-1 rounded-lg border ${badgeColor(calc.personasRes.color)}`}>
                            <span className="text-[11px] font-black">{calc.personasRes.label}</span>
                            <span className="text-[10px] opacity-80">{calc.sumPersonas} / 3.0</span>
                          </div>
                        </td>

                        <td className="py-3 px-2.5 text-center">
                          <div className={`inline-flex flex-col items-center px-2.5 py-1 rounded-lg border ${badgeColor(calc.recursosRes.color)}`}>
                            <span className="text-[11px] font-black">{calc.recursosRes.label}</span>
                            <span className="text-[10px] opacity-80">{calc.sumRecursos} / 3.0</span>
                          </div>
                        </td>

                        <td className="py-3 px-2.5 text-center">
                          <div className={`inline-flex flex-col items-center px-2.5 py-1 rounded-lg border ${badgeColor(calc.sistemasRes.color)}`}>
                            <span className="text-[11px] font-black">{calc.sistemasRes.label}</span>
                            <span className="text-[10px] opacity-80">{calc.sumSistemas} / 3.0</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            {/* Mini Visual Risk Diamond */}
                            <div className="grid grid-cols-2 gap-0.5 w-9 h-9 rotate-45 p-0.5 bg-slate-800 rounded shadow-inner my-1">
                              <div title={`Personas: ${calc.personasRes.label}`} className={`rounded-xs ${calc.personasRes.color === 'emerald' ? 'bg-emerald-400' : calc.personasRes.color === 'amber' ? 'bg-amber-400' : 'bg-rose-500'}`} />
                              <div title={`Recursos: ${calc.recursosRes.label}`} className={`rounded-xs ${calc.recursosRes.color === 'emerald' ? 'bg-emerald-400' : calc.recursosRes.color === 'amber' ? 'bg-amber-400' : 'bg-rose-500'}`} />
                              <div title={`Sistemas: ${calc.sistemasRes.label}`} className={`rounded-xs ${calc.sistemasRes.color === 'emerald' ? 'bg-emerald-400' : calc.sistemasRes.color === 'amber' ? 'bg-amber-400' : 'bg-rose-500'}`} />
                              <div title={`Amenaza: ${item.probabilidad}`} className={`rounded-xs ${calc.probColor === 'emerald' ? 'bg-emerald-400' : calc.probColor === 'amber' ? 'bg-amber-400' : 'bg-rose-500'}`} />
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              calc.nivelRiesgo === 'ALTO'
                                ? 'bg-rose-600 text-white'
                                : calc.nivelRiesgo === 'MEDIO'
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-emerald-600 text-white'
                            }`}>
                              RIESGO {calc.nivelRiesgo}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3 max-w-xs text-[11px] text-slate-600 space-y-1">
                          <p><strong className="text-slate-800">Controles:</strong> {item.controlesExistentes}</p>
                          <p><strong className="text-rose-700">Respuesta:</strong> {item.medidasIntervencion}</p>
                        </td>

                        <td className="py-3 px-2.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => { setIsNewThreat(false); setEditingThreat({ ...item }); }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer mr-1"
                            title="Calificar Amenaza y Vulnerabilidad"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const next = state.threats.filter(t => t.id !== item.id);
                              persistStep12State({ ...state, threats: next }, 'Amenaza eliminada de la matriz de vulnerabilidad.');
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            title="Eliminar Amenaza"
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

          {/* Modal to Create / Edit Threat & Vulnerability Assessment */}
          {editingThreat && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                      Metodología Diamante de Riesgo Vial
                    </span>
                    <h4 className="text-base font-black text-slate-900 mt-0.5">
                      {isNewThreat ? 'Registrar Nueva Amenaza y Análisis de Vulnerabilidad' : 'Calificar Amenaza en Ruta y Vulnerabilidad'}
                    </h4>
                  </div>
                  <button onClick={() => setEditingThreat(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Descripción de la Amenaza en Ruta *</label>
                    <input
                      type="text"
                      value={editingThreat.amenaza}
                      onChange={e => setEditingThreat({ ...editingThreat, amenaza: e.target.value })}
                      placeholder="Ej. Choques, volcamientos, fallas mecánicas, clima adverso, bloqueos u orden público..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Categoría de la Amenaza</label>
                    <select
                      value={editingThreat.categoria}
                      onChange={e => setEditingThreat({ ...editingThreat, categoria: e.target.value as ThreatVulnerabilityItem['categoria'] })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Operativa / Tránsito">Operativa / Tránsito (Choques / Volcamientos)</option>
                      <option value="Técnica / Mecánica">Técnica / Mecánica (Fallas en Ruta / Incendio)</option>
                      <option value="Natural / Climática">Natural / Climática (Lluvias / Derrumbes)</option>
                      <option value="Social / Orden Público">Social / Orden Público (Bloqueos / Hurto)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Calificación de la Amenaza (Probabilidad)</label>
                    <select
                      value={editingThreat.probabilidad}
                      onChange={e => setEditingThreat({ ...editingThreat, probabilidad: e.target.value as ThreatVulnerabilityItem['probabilidad'] })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-bold"
                    >
                      <option value="Posible">Posible (Verde - Ha ocurrido rara vez)</option>
                      <option value="Probable">Probable (Amarillo - Ya ha ocurrido en ruta)</option>
                      <option value="Inminente">Inminente (Rojo - Alta frecuencia / Exposición permanente)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Corredores Viales o Tramos Expuestos</label>
                    <input
                      type="text"
                      value={editingThreat.corredoresAfectados}
                      onChange={e => setEditingThreat({ ...editingThreat, corredoresAfectados: e.target.value })}
                      placeholder="Ej. Ruta Nacional 45, Tramos de montaña, Accesos urbanos..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* 3 Dimensions of Vulnerability */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-black text-slate-800 uppercase">
                    Análisis de Vulnerabilidad (0.0 = Baja Exposición / Controlado | 0.5 = Media | 1.0 = Alta Exposición)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Personas */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                      <h5 className="text-xs font-black text-blue-900">1. Personas (Conductores)</h5>
                      <div>
                        <label className="block text-[11px] text-slate-600">Gestión Organizacional / Brigada</label>
                        <select
                          value={editingThreat.vulnPersonasGestion}
                          onChange={e => setEditingThreat({ ...editingThreat, vulnPersonasGestion: parseFloat(e.target.value) })}
                          className="w-full px-2 py-1 text-xs border rounded mt-0.5"
                        >
                          <option value={0}>0.0 - Buena (Baja vuln.)</option>
                          <option value={0.5}>0.5 - Regular (Media vuln.)</option>
                          <option value={1}>1.0 - Deficiente (Alta vuln.)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600">Capacitación Primer Respondiente</label>
                        <select
                          value={editingThreat.vulnPersonasCapacitacion}
                          onChange={e => setEditingThreat({ ...editingThreat, vulnPersonasCapacitacion: parseFloat(e.target.value) })}
                          className="w-full px-2 py-1 text-xs border rounded mt-0.5"
                        >
                          <option value={0}>0.0 - Buena (Baja vuln.)</option>
                          <option value={0.5}>0.5 - Regular (Media vuln.)</option>
                          <option value={1}>1.0 - Deficiente (Alta vuln.)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600">Dotación y EPP en Ruta</label>
                        <select
                          value={editingThreat.vulnPersonasDotacion}
                          onChange={e => setEditingThreat({ ...editingThreat, vulnPersonasDotacion: parseFloat(e.target.value) })}
                          className="w-full px-2 py-1 text-xs border rounded mt-0.5"
                        >
                          <option value={0}>0.0 - Buena (Baja vuln.)</option>
                          <option value={0.5}>0.5 - Regular (Media vuln.)</option>
                          <option value={1}>1.0 - Deficiente (Alta vuln.)</option>
                        </select>
                      </div>
                    </div>

                    {/* Recursos / Flota */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                      <h5 className="text-xs font-black text-amber-900">2. Recursos y Flota</h5>
                      <div>
                        <label className="block text-[11px] text-slate-600">Kit de Carretera y Botiquín</label>
                        <select
                          value={editingThreat.vulnRecursosKitCarretera}
                          onChange={e => setEditingThreat({ ...editingThreat, vulnRecursosKitCarretera: parseFloat(e.target.value) })}
                          className="w-full px-2 py-1 text-xs border rounded mt-0.5"
                        >
                          <option value={0}>0.0 - Completo (Baja vuln.)</option>
                          <option value={0.5}>0.5 - Parcial (Media vuln.)</option>
                          <option value={1}>1.0 - Incompleto (Alta vuln.)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600">Estado Técnico-Mecánico Flota</label>
                        <select
                          value={editingThreat.vulnRecursosEstadoFlota}
                          onChange={e => setEditingThreat({ ...editingThreat, vulnRecursosEstadoFlota: parseFloat(e.target.value) })}
                          className="w-full px-2 py-1 text-xs border rounded mt-0.5"
                        >
                          <option value={0}>0.0 - Óptimo (Baja vuln.)</option>
                          <option value={0.5}>0.5 - Medio (Media vuln.)</option>
                          <option value={1}>1.0 - Crítico (Alta vuln.)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600">Extintores y Equipos de Rescate</label>
                        <select
                          value={editingThreat.vulnRecursosEquiposRespuesta}
                          onChange={e => setEditingThreat({ ...editingThreat, vulnRecursosEquiposRespuesta: parseFloat(e.target.value) })}
                          className="w-full px-2 py-1 text-xs border rounded mt-0.5"
                        >
                          <option value={0}>0.0 - Vigentes (Baja vuln.)</option>
                          <option value={0.5}>0.5 - Parcial (Media vuln.)</option>
                          <option value={1}>1.0 - Ausentes (Alta vuln.)</option>
                        </select>
                      </div>
                    </div>

                    {/* Sistemas y Procesos */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                      <h5 className="text-xs font-black text-emerald-900">3. Sistemas y Procesos</h5>
                      <div>
                        <label className="block text-[11px] text-slate-600">Asistencia Grúa / Aseguradora</label>
                        <select
                          value={editingThreat.vulnSistemasAsistencia}
                          onChange={e => setEditingThreat({ ...editingThreat, vulnSistemasAsistencia: parseFloat(e.target.value) })}
                          className="w-full px-2 py-1 text-xs border rounded mt-0.5"
                        >
                          <option value={0}>0.0 - Cobertura 24/7 (Baja)</option>
                          <option value={0.5}>0.5 - Parcial (Media)</option>
                          <option value={1}>1.0 - Sin cobertura (Alta)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600">Comunicaciones / Botón GPS</label>
                        <select
                          value={editingThreat.vulnSistemasComunicaciones}
                          onChange={e => setEditingThreat({ ...editingThreat, vulnSistemasComunicaciones: parseFloat(e.target.value) })}
                          className="w-full px-2 py-1 text-xs border rounded mt-0.5"
                        >
                          <option value={0}>0.0 - Redundante (Baja)</option>
                          <option value={0.5}>0.5 - Zonas sin señal (Media)</option>
                          <option value={1}>1.0 - Sin monitoreo (Alta)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600">PON y Continuidad Operativa</label>
                        <select
                          value={editingThreat.vulnSistemasRecuperacion}
                          onChange={e => setEditingThreat({ ...editingThreat, vulnSistemasRecuperacion: parseFloat(e.target.value) })}
                          className="w-full px-2 py-1 text-xs border rounded mt-0.5"
                        >
                          <option value={0}>0.0 - Probado (Baja)</option>
                          <option value={0.5}>0.5 - En ajuste (Media)</option>
                          <option value={1}>1.0 - No definido (Alta)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Controles Existentes en la Flota / Ruta</label>
                    <textarea
                      rows={2}
                      value={editingThreat.controlesExistentes}
                      onChange={e => setEditingThreat({ ...editingThreat, controlesExistentes: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Medidas de Intervención y Protocolo Asociado</label>
                    <textarea
                      rows={2}
                      value={editingThreat.medidasIntervencion}
                      onChange={e => setEditingThreat({ ...editingThreat, medidasIntervencion: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setEditingThreat(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!editingThreat.amenaza.trim()) return;
                      const next = isNewThreat
                        ? [...state.threats, editingThreat]
                        : state.threats.map(t => (t.id === editingThreat.id ? editingThreat : t));
                      persistStep12State({ ...state, threats: next }, 'Evaluación de amenaza y vulnerabilidad actualizada.');
                      setEditingThreat(null);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black cursor-pointer"
                  >
                    Guardar Calificación de Amenaza y Vulnerabilidad
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REPOSITORIO DE PROTOCOLOS (PON - PROCEDIMIENTOS OPERATIVOS NORMALIZADOS) */}
      {activeTab === 'protocolos' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <FileText size={17} className="text-rose-600" />
                Repositorio Digital de Protocolos (PON - Procedimientos Operativos Normalizados)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Seleccione, edite, descargue en PDF o cargue anexos digitales de los PON específicos para cada tipo de incidente vial.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsNewPon(true);
                setEditingPon({
                  id: `PON-${Date.now().toString().slice(-4)}`,
                  codigo: `PON-PESV-0${state.protocols.length + 1}`,
                  titulo: '',
                  tipoIncidente: 'Solo Daños Materiales',
                  version: 'V1.0',
                  fechaActualizacion: new Date().toISOString().slice(0, 10),
                  responsable: 'Coordinador PESV',
                  objetivo: '',
                  pasosAntes: ['Verificar estado técnico-mecánico y documentos antes de salir a ruta.'],
                  pasosDurante: ['Aplicar Protocolo PAS: Proteger la escena, Avisar a emergencias y Socorrer.'],
                  pasosDespues: ['Registrar reporte inmediato en plataforma PESV y participar en lección aprendida.'],
                  contactosClave: 'Emergencias 123 | INVIAS #767 | Policía Tránsito 127'
                });
              }}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus size={14} />
              Crear Nuevo Protocolo PON
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Sidebar List of PONs */}
            <div className="lg:col-span-4 space-y-2">
              {state.protocols.map((pon) => {
                const isSelected = selectedPon?.id === pon.id;
                return (
                  <div
                    key={pon.id}
                    onClick={() => setSelectedPonId(pon.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                        isSelected ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {pon.codigo}
                      </span>
                      <span className={`text-[10px] font-bold ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                        {pon.tipoIncidente}
                      </span>
                    </div>
                    <h5 className="text-xs font-extrabold mt-1.5 leading-snug">{pon.titulo}</h5>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/20 text-[10px]">
                      <span className={isSelected ? 'text-slate-300' : 'text-slate-500'}>
                        Actualizado: {pon.fechaActualizacion}
                      </span>
                      {pon.adjuntoNombre && (
                        <span className="text-emerald-400 font-bold">📎 Anexo cargado</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Detail View of Selected PON */}
            {selectedPon && (
              <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black px-2.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                        {selectedPon.codigo} • {selectedPon.version}
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {selectedPon.tipoIncidente}
                      </span>
                    </div>
                    <h4 className="text-base font-black text-slate-900 mt-1">{selectedPon.titulo}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Responsable: <strong>{selectedPon.responsable}</strong> | Fecha: {selectedPon.fechaActualizacion}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                      <Upload size={13} />
                      Cargar Anexo PON
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            const updatedProtocols = state.protocols.map(p =>
                              p.id === selectedPon.id
                                ? { ...p, adjuntoNombre: file.name, adjuntoDataUrl: reader.result as string }
                                : p
                            );
                            persistStep12State({ ...state, protocols: updatedProtocols }, `Documento "${file.name}" anexado al protocolo ${selectedPon.codigo}.`);
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => { setIsNewPon(false); setEditingPon({ ...selectedPon }); }}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 size={13} />
                      Editar PON
                    </button>
                    <button
                      type="button"
                      onClick={() => exportSinglePonPDF(selectedPon)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Download size={13} />
                      Descargar PON (PDF)
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <p className="text-[11px] font-black uppercase text-slate-700 mb-1">Objetivo Operativo del Protocolo</p>
                  <p className="text-xs text-slate-700 leading-relaxed">{selectedPon.objetivo}</p>
                </div>

                {/* 3 Phases: Antes, Durante, Después */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-3.5">
                    <h5 className="text-xs font-black text-blue-950 uppercase mb-2 flex items-center gap-1.5">
                      <ShieldAlert size={14} className="text-blue-600" />
                      1. Antes (Prevención)
                    </h5>
                    <ol className="text-xs text-slate-700 space-y-1.5 list-decimal pl-4">
                      {selectedPon.pasosAntes.map((step, i) => (
                        <li key={i} className="leading-snug">{step}</li>
                      ))}
                    </ol>
                  </div>

                  <div className="border border-rose-200 bg-rose-50/50 rounded-xl p-3.5">
                    <h5 className="text-xs font-black text-rose-950 uppercase mb-2 flex items-center gap-1.5">
                      <Siren size={14} className="text-rose-600" />
                      2. Durante (Respuesta en Ruta)
                    </h5>
                    <ol className="text-xs text-slate-700 space-y-1.5 list-decimal pl-4">
                      {selectedPon.pasosDurante.map((step, i) => (
                        <li key={i} className="leading-snug">{step}</li>
                      ))}
                    </ol>
                  </div>

                  <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-3.5">
                    <h5 className="text-xs font-black text-emerald-950 uppercase mb-2 flex items-center gap-1.5">
                      <ClipboardCheck size={14} className="text-emerald-600" />
                      3. Después (Cierre y Lección)
                    </h5>
                    <ol className="text-xs text-slate-700 space-y-1.5 list-decimal pl-4">
                      {selectedPon.pasosDespues.map((step, i) => (
                        <li key={i} className="leading-snug">{step}</li>
                      ))}
                    </ol>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 text-white p-3.5 rounded-xl text-xs">
                  <div className="flex items-center gap-2">
                    <PhoneCall size={15} className="text-amber-400 shrink-0" />
                    <span><strong>Líneas de Activación Directa:</strong> {selectedPon.contactosClave}</span>
                  </div>
                  {selectedPon.adjuntoNombre && selectedPon.adjuntoDataUrl && (
                    <a
                      href={selectedPon.adjuntoDataUrl}
                      download={selectedPon.adjuntoNombre}
                      className="px-2.5 py-1 bg-emerald-500 text-slate-950 font-black rounded-lg text-[11px] flex items-center gap-1"
                    >
                      <Download size={12} />
                      Descargar Anexo: {selectedPon.adjuntoNombre}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modal to Create / Edit PON */}
          {editingPon && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-3.5 my-auto max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h4 className="text-base font-black text-slate-900">
                    {isNewPon ? 'Crear Nuevo Procedimiento Operativo Normalizado (PON)' : `Editar Protocolo ${editingPon.codigo}`}
                  </h4>
                  <button onClick={() => setEditingPon(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Código PON</label>
                    <input
                      type="text"
                      value={editingPon.codigo}
                      onChange={e => setEditingPon({ ...editingPon, codigo: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Incidente</label>
                    <select
                      value={editingPon.tipoIncidente}
                      onChange={e => setEditingPon({ ...editingPon, tipoIncidente: e.target.value as PONProtocolItem['tipoIncidente'] })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Solo Daños Materiales">Solo Daños Materiales</option>
                      <option value="Heridos o Fallecidos">Heridos o Fallecidos</option>
                      <option value="Fallas Críticas en Ruta">Fallas Críticas en Ruta</option>
                      <option value="Climático / Derrumbe">Climático / Derrumbe</option>
                      <option value="Orden Público / Bloqueo">Orden Público / Bloqueo</option>
                      <option value="Incendio / Materiales Peligrosos">Incendio / Materiales Peligrosos</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Versión</label>
                    <input
                      type="text"
                      value={editingPon.version}
                      onChange={e => setEditingPon({ ...editingPon, version: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Título del Protocolo PON *</label>
                  <input
                    type="text"
                    value={editingPon.titulo}
                    onChange={e => setEditingPon({ ...editingPon, titulo: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Objetivo Operativo</label>
                  <textarea
                    rows={2}
                    value={editingPon.objetivo}
                    onChange={e => setEditingPon({ ...editingPon, objetivo: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pasos ANTES de la Emergencia (uno por línea)</label>
                  <textarea
                    rows={3}
                    value={editingPon.pasosAntes.join('\n')}
                    onChange={e => setEditingPon({ ...editingPon, pasosAntes: e.target.value.split('\n').filter(Boolean) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pasos DURANTE la Emergencia / Protocolo PAS (uno por línea)</label>
                  <textarea
                    rows={4}
                    value={editingPon.pasosDurante.join('\n')}
                    onChange={e => setEditingPon({ ...editingPon, pasosDurante: e.target.value.split('\n').filter(Boolean) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pasos DESPUÉS de la Emergencia (uno por línea)</label>
                  <textarea
                    rows={3}
                    value={editingPon.pasosDespues.join('\n')}
                    onChange={e => setEditingPon({ ...editingPon, pasosDespues: e.target.value.split('\n').filter(Boolean) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setEditingPon(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!editingPon.titulo.trim()) return;
                      const next = isNewPon
                        ? [...state.protocols, editingPon]
                        : state.protocols.map(p => (p.id === editingPon.id ? editingPon : p));
                      persistStep12State({ ...state, protocols: next }, `Protocolo ${editingPon.codigo} guardado correctamente.`);
                      setSelectedPonId(editingPon.id);
                      setEditingPon(null);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black cursor-pointer"
                  >
                    Guardar Protocolo PON
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CÓDIGO QR - PROTOCOLO PAS (PROTEGER, AVISAR Y SOCORRER) */}
      {activeTab === 'qr-pas' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Card 1: QR Protocolo PAS */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row items-center gap-5">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col items-center shrink-0">
                <canvas ref={qrPasCanvasRef} className="rounded-lg shadow-xs" />
                <span className="text-[10px] font-black uppercase text-slate-600 mt-2">
                  Escanear con cámara móvil
                </span>
              </div>

              <div className="space-y-3 flex-1">
                <div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                    Consulta Móvil para Conductores
                  </span>
                  <h4 className="text-base font-black text-slate-900 mt-1">
                    Código QR - Protocolo PAS (Proteger, Avisar y Socorrer)
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Permite que el conductor consulte rápidamente desde su celular el paso a paso del <strong>Protocolo PAS</strong>, marque en un toque a las líneas de emergencia (#767, 123, 127) y active la respuesta inmediata en ruta.
                  </p>
                </div>

                <div className="bg-slate-100 p-2 rounded-lg text-[11px] font-mono text-slate-700 break-all border border-slate-200">
                  {pasPublicUrl}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPublicModalMode('protocolo-pas')}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Eye size={13} />
                    Abrir Protocolo PAS Aquí
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadQrImage(qrPasCanvasRef.current, `QR_Protocolo_PAS_${companyName.replace(/\s+/g, '_')}.png`)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download size={13} />
                    Descargar QR PNG
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(pasPublicUrl);
                      setCopiedLinkType('pas');
                      setTimeout(() => setCopiedLinkType(null), 2000);
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedLinkType === 'pas' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    {copiedLinkType === 'pas' ? '¡Copiado!' : 'Copiar Enlace'}
                  </button>
                  <a
                    href={pasPublicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <ExternalLink size={13} />
                    Nueva Pestaña
                  </a>
                </div>
              </div>
            </div>

            {/* Card 2: QR Reporte Inmediato de Siniestro Vial */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row items-center gap-5">
              <div className="bg-rose-50/60 p-3 rounded-2xl border border-rose-200 flex flex-col items-center shrink-0">
                <canvas ref={qrReportCanvasRef} className="rounded-lg shadow-xs" />
                <span className="text-[10px] font-black uppercase text-rose-700 mt-2">
                  QR Reporte Siniestro + GPS
                </span>
              </div>

              <div className="space-y-3 flex-1">
                <div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                    Enlace Digital de Primer Respondiente
                  </span>
                  <h4 className="text-base font-black text-slate-900 mt-1">
                    Código QR - Formulario de Reporte Inmediato en Ruta
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Enlace directo para que el conductor o primer respondiente reporte en tiempo real el siniestro vial, capturando <strong>geolocalización GPS</strong> y subiendo <strong>fotos de los daños</strong> desde el celular.
                  </p>
                </div>

                <div className="bg-slate-100 p-2 rounded-lg text-[11px] font-mono text-slate-700 break-all border border-slate-200">
                  {reportPublicUrl}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPublicModalMode('reporte-siniestro')}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Camera size={13} />
                    Abrir Formulario Móvil Aquí
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadQrImage(qrReportCanvasRef.current, `QR_Reporte_Inmediato_${companyName.replace(/\s+/g, '_')}.png`)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download size={13} />
                    Descargar QR PNG
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(reportPublicUrl);
                      setCopiedLinkType('reporte');
                      setTimeout(() => setCopiedLinkType(null), 2000);
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedLinkType === 'reporte' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    {copiedLinkType === 'reporte' ? '¡Copiado!' : 'Copiar Enlace'}
                  </button>
                  <a
                    href={reportPublicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <ExternalLink size={13} />
                    Nueva Pestaña
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Guide of Protocolo PAS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
              <HeartPulse size={17} className="text-rose-600" />
              Cartilla Digital del Protocolo PAS (Proteger, Avisar y Socorrer) para Cabina de Vehículos
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-amber-500 text-white font-black flex items-center justify-center">P</span>
                  <h5 className="text-sm font-black text-amber-950">1. PROTEGER LA ESCENA</h5>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Estacione en lugar seguro, encienda estacionarias, apague el motor, colóquese el chaleco reflectivo e instale conos a 30m y 60m. Evalúe riesgos de incendio o derrame de combustible antes de acercarse.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center">A</span>
                  <h5 className="text-sm font-black text-blue-950">2. AVISAR DE INMEDIATO</h5>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Active la cadena de llamadas: <strong>123</strong> (Ambulancias/Policía), <strong>#767</strong> (INVIAS), <strong>127</strong> (Tránsito), Aseguradora y Comité PESV indicando ubicación exacta, número de heridos y estado de la vía.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black flex items-center justify-center">S</span>
                  <h5 className="text-sm font-black text-emerald-950">3. SOCORRER A LAS VÍCTIMAS</h5>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Verifique conciencia y respiración sin movilizar al herido ni quitar el casco a motociclistas. Controle hemorragias externas con gasas estériles y acompañe hasta el arribo médico.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FORMULARIO Y BITÁCORA DE REPORTE INMEDIATO DE SINIESTRO VIAL (GPS + FOTOS) */}
      {activeTab === 'reportes' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Camera size={17} className="text-rose-600" />
                Formulario y Bitácora de Reporte Inmediato de Siniestros Viales en Tiempo Real
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Centraliza los reportes enviados por los conductores desde el código QR móvil o registrados directamente aquí con coordenadas GPS y fotografías de daños.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setPublicModalMode('reporte-siniestro')}
                className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <QrCode size={14} />
                Vista Móvil Conductor
              </button>
              <button
                type="button"
                onClick={() => setShowNewIncidentForm(!showNewIncidentForm)}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus size={14} />
                {showNewIncidentForm ? 'Ocultar Formulario' : 'Registrar Siniestro Ahora'}
              </button>
            </div>
          </div>

          {showNewIncidentForm && (
            <div className="bg-white rounded-xl border-2 border-rose-200 p-5 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <h5 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Siren size={16} className="text-rose-600" />
                  Nuevo Reporte Inmediato de Siniestro Vial (Con Geolocalización GPS y Carga de Fotos)
                </h5>
                <button
                  type="button"
                  onClick={() => {
                    if (!navigator.geolocation) return;
                    setGpsCapturing(true);
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        const lat = pos.coords.latitude.toFixed(6);
                        const lng = pos.coords.longitude.toFixed(6);
                        setNewIncident(prev => ({
                          ...prev,
                          latitud: lat,
                          longitud: lng,
                          ubicacionTexto: prev.ubicacionTexto || `GPS Capturado: ${lat}, ${lng}`
                        }));
                        setGpsCapturing(false);
                      },
                      () => setGpsCapturing(false)
                    );
                  }}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Navigation size={12} />
                  {gpsCapturing ? 'Obteniendo GPS...' : 'Capturar Coordenadas GPS'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nombre del Conductor *</label>
                  <input
                    type="text"
                    value={newIncident.conductorNombre}
                    onChange={e => setNewIncident({ ...newIncident, conductorNombre: e.target.value })}
                    placeholder="Nombre completo"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Cédula / ID</label>
                  <input
                    type="text"
                    value={newIncident.conductorCedula}
                    onChange={e => setNewIncident({ ...newIncident, conductorCedula: e.target.value })}
                    placeholder="Documento"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Placa del Vehículo *</label>
                  <input
                    type="text"
                    value={newIncident.placaVehiculo}
                    onChange={e => setNewIncident({ ...newIncident, placaVehiculo: e.target.value.toUpperCase() })}
                    placeholder="Ej. WXY-842"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Teléfono Conductor</label>
                  <input
                    type="text"
                    value={newIncident.conductorTelefono}
                    onChange={e => setNewIncident({ ...newIncident, conductorTelefono: e.target.value })}
                    placeholder="310..."
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Tipo de Evento Vial</label>
                  <input
                    type="text"
                    value={newIncident.tipoEvento}
                    onChange={e => setNewIncident({ ...newIncident, tipoEvento: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Gravedad del Siniestro</label>
                  <select
                    value={newIncident.gravedad}
                    onChange={e => setNewIncident({ ...newIncident, gravedad: e.target.value as EmergencyIncidentReport['gravedad'] })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Solo Daños Materiales">Solo Daños Materiales</option>
                    <option value="Heridos Leves">Heridos Leves</option>
                    <option value="Heridos Graves / Fatalidad">Heridos Graves / Fatalidad</option>
                    <option value="Incidente / Casi Accidente">Incidente / Casi Accidente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Número de Lesionados</label>
                  <input
                    type="number"
                    min={0}
                    value={newIncident.numeroLesionados}
                    onChange={e => setNewIncident({ ...newIncident, numeroLesionados: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Ubicación / Corredor Vial / Km</label>
                  <input
                    type="text"
                    value={newIncident.ubicacionTexto}
                    onChange={e => setNewIncident({ ...newIncident, ubicacionTexto: e.target.value })}
                    placeholder="Tramo vial o dirección exacta"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Latitud GPS</label>
                  <input
                    type="text"
                    value={newIncident.latitud}
                    onChange={e => setNewIncident({ ...newIncident, latitud: e.target.value })}
                    placeholder="Ej. 4.7110"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Longitud GPS</label>
                  <input
                    type="text"
                    value={newIncident.longitud}
                    onChange={e => setNewIncident({ ...newIncident, longitud: e.target.value })}
                    placeholder="Ej. -74.0721"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Descripción de los Hechos y Daños *</label>
                  <textarea
                    rows={2}
                    value={newIncident.descripcionHechos}
                    onChange={e => setNewIncident({ ...newIncident, descripcionHechos: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Fotografías de los Daños (Evidencia en Ruta)</label>
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-300">
                      <Upload size={13} />
                      Cargar Fotos de Daños ({newIncident.fotosDanos.length})
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (!files) return;
                          Array.from(files).slice(0, 4).forEach((file: File) => {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === 'string') {
                                setNewIncident(prev => ({
                                  ...prev,
                                  fotosDanos: [...prev.fotosDanos, { nombre: file.name, dataUrl: reader.result as string }]
                                }));
                              }
                            };
                            reader.readAsDataURL(file);
                          });
                        }}
                      />
                    </label>
                    <div className="flex gap-1.5">
                      {newIncident.fotosDanos.map((f, i) => (
                        <img key={i} src={f.dataUrl} alt={f.nombre} className="w-10 h-10 object-cover rounded border border-slate-300" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewIncidentForm(false)}
                  className="px-4 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!newIncident.conductorNombre.trim() || !newIncident.placaVehiculo.trim()) return;
                    const created: EmergencyIncidentReport = {
                      id: `INC-${Date.now()}`,
                      radicado: `SIN-${new Date().getFullYear()}-${String(state.incidents.length + 1).padStart(3, '0')}`,
                      fechaHora: new Date().toISOString().slice(0, 16),
                      conductorNombre: newIncident.conductorNombre.trim(),
                      conductorCedula: newIncident.conductorCedula.trim(),
                      conductorTelefono: newIncident.conductorTelefono.trim(),
                      placaVehiculo: newIncident.placaVehiculo.trim().toUpperCase(),
                      tipoVehiculo: newIncident.tipoVehiculo,
                      tipoEvento: newIncident.tipoEvento,
                      gravedad: newIncident.gravedad,
                      numeroLesionados: newIncident.numeroLesionados,
                      ubicacionTexto: newIncident.ubicacionTexto || 'Reportado en ruta',
                      latitud: newIncident.latitud,
                      longitud: newIncident.longitud,
                      descripcionHechos: newIncident.descripcionHechos,
                      aplicoProteger: newIncident.aplicoProteger,
                      aplicoAvisar: newIncident.aplicoAvisar,
                      aplicoSocorrer: newIncident.aplicoSocorrer,
                      fotosDanos: newIncident.fotosDanos,
                      estado: 'Reportado',
                      accionesInmediatas: newIncident.accionesInmediatas || 'Activación de protocolo PAS y reporte a centro de control.'
                    };
                    persistStep12State({ ...state, incidents: [created, ...state.incidents] }, `Siniestro vial ${created.radicado} registrado exitosamente.`);
                    setShowNewIncidentForm(false);
                  }}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black cursor-pointer"
                >
                  Guardar Reporte de Siniestro Vial
                </button>
              </div>
            </div>
          )}

          {/* List of Reported Incidents */}
          <div className="space-y-3">
            {state.incidents.map((inc) => (
              <div key={inc.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-900 text-white">
                      {inc.radicado}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                      inc.gravedad === 'Heridos Graves / Fatalidad'
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : inc.gravedad === 'Heridos Leves'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-blue-50 text-blue-800 border-blue-200'
                    }`}>
                      {inc.gravedad} ({inc.numeroLesionados} lesionados)
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      Placa: <strong className="text-slate-950">{inc.placaVehiculo}</strong> • Conductor: {inc.conductorNombre}
                    </span>
                    <span className="text-[11px] text-slate-400">{inc.fechaHora.replace('T', ' ')}</span>
                  </div>

                  <p className="text-xs font-bold text-slate-900">{inc.tipoEvento}</p>
                  <p className="text-xs text-slate-600">{inc.descripcionHechos}</p>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-600">
                    <span className="flex items-center gap-1 font-semibold text-slate-800">
                      <MapPin size={12} className="text-rose-600" />
                      {inc.ubicacionTexto}
                    </span>
                    {inc.latitud && inc.longitud && (
                      <a
                        href={`https://www.google.com/maps?q=${inc.latitud},${inc.longitud}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline font-bold flex items-center gap-1"
                      >
                        <ExternalLink size={11} />
                        Ver Coordenadas GPS ({inc.latitud}, {inc.longitud})
                      </a>
                    )}
                    <span className="text-emerald-700 font-bold">
                      PAS: {inc.aplicoProteger ? '✔ Proteger ' : ''}{inc.aplicoAvisar ? '✔ Avisar ' : ''}{inc.aplicoSocorrer ? '✔ Socorrer' : ''}
                    </span>
                  </div>
                </div>

                {/* Photos & Status */}
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  {inc.fotosDanos && inc.fotosDanos.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      {inc.fotosDanos.map((foto, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setPreviewPhotoUrl(foto.dataUrl)}
                          className="w-12 h-12 rounded-lg overflow-hidden border border-slate-300 hover:border-rose-500 cursor-pointer"
                          title="Ampliar fotografía de daños"
                        >
                          <img src={foto.dataUrl} alt={foto.nombre} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}

                  <select
                    value={inc.estado}
                    onChange={(e) => {
                      const next = state.incidents.map(item =>
                        item.id === inc.id ? { ...item, estado: e.target.value as EmergencyIncidentReport['estado'] } : item
                      );
                      persistStep12State({ ...state, incidents: next }, `Estado del reporte ${inc.radicado} actualizado.`);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-black border cursor-pointer ${
                      inc.estado === 'Investigado / Cerrado'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : inc.estado === 'En Atención en Sitio'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-rose-50 text-rose-800 border-rose-300'
                    }`}
                  >
                    <option value="Reportado">Reportado</option>
                    <option value="En Atención en Sitio">En Atención en Sitio</option>
                    <option value="Investigado / Cerrado">Investigado / Cerrado</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      const next = state.incidents.filter(item => item.id !== inc.id);
                      persistStep12State({ ...state, incidents: next }, 'Reporte eliminado del historial.');
                    }}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PROGRAMACIÓN Y REGISTRO DE SIMULACROS VIALES */}
      {activeTab === 'simulacros' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Calendar size={17} className="text-rose-600" />
                Módulo de Programación y Registro de Simulacros Viales (Cronograma y Cargue de Actas)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Programe los simulacros anuales de emergencias viales, evalúe tiempos de respuesta y cargue las evidencias o actas de ejecución.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsNewDrill(true);
                setEditingDrill({
                  id: `SIM-${Date.now().toString().slice(-4)}`,
                  codigo: `SIM-PESV-2026-0${state.drills.length + 1}`,
                  tituloSimulacro: '',
                  escenarioAmenaza: state.threats[0]?.amenaza || 'Siniestro vial con lesionados',
                  fechaProgramada: new Date().toISOString().slice(0, 10),
                  corredorOSede: 'Patio Operativo / Ruta Principal',
                  tipoSimulacro: 'Real en Ruta / Operativo',
                  responsable: 'Coordinador PESV / Brigada Vial',
                  participantesCount: 15,
                  tiempoRespuestaMinutos: 4.0,
                  metaTiempoMinutos: 5.0,
                  calificacionEfectividad: 90,
                  estado: 'Programado',
                  hallazgosMejora: ''
                });
              }}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus size={14} />
              Programar / Registrar Simulacro Vial
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.drills.map((drill) => (
              <div key={drill.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-900 text-white">
                      {drill.codigo}
                    </span>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                      drill.estado === 'Ejecutado'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : drill.estado === 'Programado'
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>
                      {drill.estado}
                    </span>
                  </div>

                  <h5 className="text-sm font-black text-slate-900 leading-snug">{drill.tituloSimulacro}</h5>
                  <p className="text-xs text-slate-600">
                    <strong>Escenario Simulado:</strong> {drill.escenarioAmenaza}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Fecha Programada</span>
                      <strong className="text-slate-800">{drill.fechaProgramada}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Participantes</span>
                      <strong className="text-slate-800">{drill.participantesCount} colaboradores</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Tiempo Respuesta</span>
                      <strong className="text-emerald-700">
                        {drill.tiempoRespuestaMinutos > 0 ? `${drill.tiempoRespuestaMinutos} min (Meta ${drill.metaTiempoMinutos}m)` : `Meta <= ${drill.metaTiempoMinutos} min`}
                      </strong>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600">
                    <strong>Hallazgos / Plan de Mejora:</strong> {drill.hallazgosMejora || 'Sin observaciones registradas.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <label className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                      <Upload size={12} />
                      {drill.evidenciaNombre ? 'Actualizar Evidencia' : 'Cargar Registro / Acta'}
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            const next = state.drills.map(d =>
                              d.id === drill.id
                                ? { ...d, estado: 'Ejecutado' as const, evidenciaNombre: file.name, evidenciaDataUrl: reader.result as string }
                                : d
                            );
                            persistStep12State({ ...state, drills: next }, `Registro de simulacro "${file.name}" cargado con éxito.`);
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                    {drill.evidenciaNombre && drill.evidenciaDataUrl && (
                      <a
                        href={drill.evidenciaDataUrl}
                        download={drill.evidenciaNombre}
                        className="text-[11px] text-emerald-700 font-bold hover:underline flex items-center gap-1"
                      >
                        <Download size={12} />
                        {drill.evidenciaNombre.slice(0, 18)}
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => { setIsNewDrill(false); setEditingDrill({ ...drill }); }}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                      title="Editar Simulacro"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = state.drills.filter(d => d.id !== drill.id);
                        persistStep12State({ ...state, drills: next }, 'Simulacro eliminado.');
                      }}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      title="Eliminar Simulacro"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {editingDrill && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-3.5 my-auto">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h4 className="text-base font-black text-slate-900">
                    {isNewDrill ? 'Programar / Registrar Simulacro Vial' : `Editar Simulacro ${editingDrill.codigo}`}
                  </h4>
                  <button onClick={() => setEditingDrill(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Título del Simulacro Vial *</label>
                    <input
                      type="text"
                      value={editingDrill.tituloSimulacro}
                      onChange={e => setEditingDrill({ ...editingDrill, tituloSimulacro: e.target.value })}
                      placeholder="Ej. Simulacro de Atención a Víctimas y Protocolo PAS en Ruta"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Fecha Programada</label>
                    <input
                      type="date"
                      value={editingDrill.fechaProgramada}
                      onChange={e => setEditingDrill({ ...editingDrill, fechaProgramada: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Estado del Simulacro</label>
                    <select
                      value={editingDrill.estado}
                      onChange={e => setEditingDrill({ ...editingDrill, estado: e.target.value as RoadDrillRecord['estado'] })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Programado">Programado</option>
                      <option value="Ejecutado">Ejecutado</option>
                      <option value="Reprogramado">Reprogramado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">N° de Participantes</label>
                    <input
                      type="number"
                      value={editingDrill.participantesCount}
                      onChange={e => setEditingDrill({ ...editingDrill, participantesCount: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tiempo de Respuesta Obtenido (Minutos)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={editingDrill.tiempoRespuestaMinutos}
                      onChange={e => setEditingDrill({ ...editingDrill, tiempoRespuestaMinutos: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Hallazgos, Evaluación y Acciones de Mejora</label>
                    <textarea
                      rows={3}
                      value={editingDrill.hallazgosMejora}
                      onChange={e => setEditingDrill({ ...editingDrill, hallazgosMejora: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setEditingDrill(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!editingDrill.tituloSimulacro.trim()) return;
                      const next = isNewDrill
                        ? [...state.drills, editingDrill]
                        : state.drills.map(d => (d.id === editingDrill.id ? editingDrill : d));
                      persistStep12State({ ...state, drills: next }, 'Cronograma y registro de simulacros actualizado.');
                      setEditingDrill(null);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black cursor-pointer"
                  >
                    Guardar Simulacro Vial
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: CONTROL DE CAPACITACIÓN EN PRIMEROS AUXILIOS VIALES (BASE DE DATOS DE PRIMEROS RESPONDIENTES) */}
      {activeTab === 'capacitacion' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Award size={17} className="text-rose-600" />
                Control de Capacitación en Primeros Auxilios Viales (Base de Datos de Primeros Respondientes)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Base de datos que almacena qué conductores y colaboradores están certificados como primeros respondientes e idóneos para la atención a víctimas en ruta.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={responderSearch}
                  onChange={e => setResponderSearch(e.target.value)}
                  placeholder="Buscar por nombre, cédula o placa..."
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsNewResponder(true);
                  setEditingResponder({
                    id: `PR-${Date.now().toString().slice(-4)}`,
                    nombreCompleto: '',
                    cedula: '',
                    cargo: 'Conductor',
                    telefono: '',
                    placaAsignada: '',
                    competenciaCertificada: 'Primer Respondiente y Primeros Auxilios Viales (Protocolo PAS)',
                    entidadCertificadora: 'Cruz Roja / SENA / ARL',
                    numeroCertificado: '',
                    fechaCertificacion: new Date().toISOString().slice(0, 10),
                    fechaVencimiento: '2028-06-01',
                    horasFormacion: 20,
                    idoneoAtencionVictimas: true
                  });
                }}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                Registrar Primer Respondiente
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-3">Colaborador / Conductor</th>
                    <th className="py-3 px-2.5">Cargo y Placa</th>
                    <th className="py-3 px-3">Competencia en Primeros Auxilios Viales</th>
                    <th className="py-3 px-2.5">Entidad Certificadora</th>
                    <th className="py-3 px-2.5 text-center">Vigencia Certificado</th>
                    <th className="py-3 px-2.5 text-center">Idóneo Atención Víctimas</th>
                    <th className="py-3 px-2.5 text-center">Soporte Digital</th>
                    <th className="py-3 px-2.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {state.responders
                    .filter(r =>
                      !responderSearch.trim() ||
                      r.nombreCompleto.toLowerCase().includes(responderSearch.toLowerCase()) ||
                      r.cedula.includes(responderSearch) ||
                      r.placaAsignada.toLowerCase().includes(responderSearch.toLowerCase())
                    )
                    .map((resp) => {
                      const status = getResponderStatus(resp.fechaVencimiento);
                      return (
                        <tr key={resp.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3">
                            <p className="font-bold text-slate-900">{resp.nombreCompleto}</p>
                            <p className="text-[11px] text-slate-500">CC: {resp.cedula} • Tel: {resp.telefono}</p>
                          </td>
                          <td className="py-3 px-2.5">
                            <span className="font-bold text-slate-800 block">{resp.cargo}</span>
                            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">
                              Vehículo: {resp.placaAsignada || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 px-3 max-w-xs">
                            <p className="font-semibold text-slate-800 leading-snug">{resp.competenciaCertificada}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Intensidad: {resp.horasFormacion} horas • Cert. N° {resp.numeroCertificado || 'S/N'}
                            </p>
                          </td>
                          <td className="py-3 px-2.5 font-medium text-slate-700">
                            {resp.entidadCertificadora}
                          </td>
                          <td className="py-3 px-2.5 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black border ${status.badge}`}>
                              {status.label}
                            </span>
                            <p className="text-[10px] text-slate-500 mt-0.5">Vence: {resp.fechaVencimiento}</p>
                          </td>
                          <td className="py-3 px-2.5 text-center">
                            {resp.idoneoAtencionVictimas ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-black">
                                <CheckCircle2 size={12} className="text-emerald-600" />
                                IDÓNEO CERTIFICADO
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                                En Formación
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-2.5 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <label className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold cursor-pointer flex items-center gap-1">
                                <Upload size={11} />
                                {resp.soporteNombre ? 'Cambiar' : 'Subir Diploma'}
                                <input
                                  type="file"
                                  accept=".pdf,image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.onload = () => {
                                      const next = state.responders.map(item =>
                                        item.id === resp.id
                                          ? { ...item, soporteNombre: file.name, soporteDataUrl: reader.result as string }
                                          : item
                                      );
                                      persistStep12State({ ...state, responders: next }, `Certificado cargado para ${resp.nombreCompleto}.`);
                                    };
                                    reader.readAsDataURL(file);
                                  }}
                                />
                              </label>
                              {resp.soporteNombre && resp.soporteDataUrl && (
                                <a
                                  href={resp.soporteDataUrl}
                                  download={resp.soporteNombre}
                                  className="text-[10px] text-emerald-700 font-bold hover:underline"
                                >
                                  Ver Certificado
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-2.5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => { setIsNewResponder(false); setEditingResponder({ ...resp }); }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer mr-1"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const next = state.responders.filter(item => item.id !== resp.id);
                                persistStep12State({ ...state, responders: next }, 'Colaborador eliminado de la base de primeros respondientes.');
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
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

          {editingResponder && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-3.5 my-auto">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h4 className="text-base font-black text-slate-900">
                    {isNewResponder ? 'Registrar Primer Respondiente Certificado' : 'Editar Certificación en Primeros Auxilios Viales'}
                  </h4>
                  <button onClick={() => setEditingResponder(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      value={editingResponder.nombreCompleto}
                      onChange={e => setEditingResponder({ ...editingResponder, nombreCompleto: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cédula de Ciudadanía *</label>
                    <input
                      type="text"
                      value={editingResponder.cedula}
                      onChange={e => setEditingResponder({ ...editingResponder, cedula: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cargo / Rol en Emergencia Vial</label>
                    <select
                      value={editingResponder.cargo}
                      onChange={e => setEditingResponder({ ...editingResponder, cargo: e.target.value as FirstResponderRecord['cargo'] })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Conductor">Conductor</option>
                      <option value="Supervisor Vial">Supervisor Vial</option>
                      <option value="Escolta / Auxiliar">Escolta / Auxiliar</option>
                      <option value="Brigadista PESV">Brigadista PESV</option>
                      <option value="Coordinador HSEQ">Coordinador HSEQ</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Placa Asignada / Teléfono</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Placa"
                        value={editingResponder.placaAsignada}
                        onChange={e => setEditingResponder({ ...editingResponder, placaAsignada: e.target.value.toUpperCase() })}
                        className="px-2.5 py-2 text-xs border border-slate-300 rounded-lg uppercase"
                      />
                      <input
                        type="text"
                        placeholder="Celular"
                        value={editingResponder.telefono}
                        onChange={e => setEditingResponder({ ...editingResponder, telefono: e.target.value })}
                        className="px-2.5 py-2 text-xs border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Curso / Competencia en Primeros Auxilios Viales</label>
                    <input
                      type="text"
                      value={editingResponder.competenciaCertificada}
                      onChange={e => setEditingResponder({ ...editingResponder, competenciaCertificada: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Entidad Certificadora</label>
                    <input
                      type="text"
                      value={editingResponder.entidadCertificadora}
                      onChange={e => setEditingResponder({ ...editingResponder, entidadCertificadora: e.target.value })}
                      placeholder="Cruz Roja, SENA, ARL, Bomberos..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Número de Certificado y Horas</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="N° Cert."
                        value={editingResponder.numeroCertificado}
                        onChange={e => setEditingResponder({ ...editingResponder, numeroCertificado: e.target.value })}
                        className="px-2.5 py-2 text-xs border border-slate-300 rounded-lg"
                      />
                      <input
                        type="number"
                        placeholder="Horas"
                        value={editingResponder.horasFormacion}
                        onChange={e => setEditingResponder({ ...editingResponder, horasFormacion: parseInt(e.target.value) || 0 })}
                        className="px-2.5 py-2 text-xs border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Certificación</label>
                    <input
                      type="date"
                      value={editingResponder.fechaCertificacion}
                      onChange={e => setEditingResponder({ ...editingResponder, fechaCertificacion: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Vencimiento</label>
                    <input
                      type="date"
                      value={editingResponder.fechaVencimiento}
                      onChange={e => setEditingResponder({ ...editingResponder, fechaVencimiento: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-2 pt-1">
                    <label className="flex items-center gap-2 text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingResponder.idoneoAtencionVictimas}
                        onChange={e => setEditingResponder({ ...editingResponder, idoneoAtencionVictimas: e.target.checked })}
                      />
                      Certificado e Idóneo como Primer Respondiente para la Atención a Víctimas en Siniestros Viales
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setEditingResponder(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!editingResponder.nombreCompleto.trim()) return;
                      const next = isNewResponder
                        ? [...state.responders, editingResponder]
                        : state.responders.map(r => (r.id === editingResponder.id ? editingResponder : r));
                      persistStep12State({ ...state, responders: next }, 'Base de datos de primeros respondientes actualizada.');
                      setEditingResponder(null);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black cursor-pointer"
                  >
                    Guardar Primer Respondiente
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {previewPhotoUrl && (
        <div
          onClick={() => setPreviewPhotoUrl(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
        >
          <img src={previewPhotoUrl} alt="Evidencia daños" className="max-w-full max-h-[85vh] rounded-xl shadow-2xl border-2 border-white" />
        </div>
      )}

      {/* In-App Preview Modal for Mobile PAS & Reporte Inmediato */}
      {publicModalMode && (
        <Step12PublicPortalModal
          mode={publicModalMode}
          companyName={companyName}
          companyNit={companyNit}
          companyLogo={companyLogo}
          isStandalonePage={false}
          onClose={() => setPublicModalMode(null)}
        />
      )}
    </div>
  );
}
