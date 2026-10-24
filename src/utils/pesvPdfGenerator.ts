import { jsPDF } from 'jspdf';

export interface ActaNombramientoPDFData {
  companyName: string;
  companyLogo?: string;
  companyNit?: string;
  actaNumber: string;
  appointmentDate: string;
  leaderName: string;
  leaderId: string;
  leaderLicense: string;
  leaderLicenseExpiry: string;
  repLegal: string;
  actaCustomIntro?: string;
  actaResponsibilities?: string;
  repSignatureImg1?: string;
  leaderSignatureImg?: string;
  filename?: string;
}

export interface PoliticaPDFData {
  companyName: string;
  companyLogo?: string;
  companyNit?: string;
  policyDate: string;
  repLegal: string;
  policyCustomText: string;
  selectedCommitments: string[];
  repSignatureImg2?: string;
  filename?: string;
}

export interface ComiteActaPDFData {
  companyName: string;
  companyLogo?: string;
  companyNit?: string;
  numeroActa: string;
  fecha: string;
  temasDiscutidos: string;
  compromisos: Array<{
    tarea: string;
    responsable: string;
    fechaLimite: string;
    estado?: string;
  }>;
  asistentes?: Array<{
    nombre: string;
    cargo: string;
    rol: string;
    firma?: string;
    firmado?: boolean;
  }>;
  filename?: string;
}

export interface CompromisoGerentePDFData {
  companyName: string;
  companyLogo?: string;
  companyNit?: string;
  managerSignatureName: string;
  managerSignatureCharge: string;
  managerSignatureDate: string;
  commitmentScore: number;
  managerSignatureImg?: string;
  filename?: string;
}

export interface PlanAnualPDFData {
  companyName: string;
  companyLogo?: string;
  companyNit?: string;
  activities: Array<{
    id: string;
    actividad: string;
    responsable: string;
    recursos: string;
    fechaInicio: string;
    fechaFin: string;
    estado: string;
    fase?: string;
  }>;
  filename?: string;
}

function drawCompanyLogoInHeader(doc: jsPDF, companyLogo: string | undefined, x: number, y: number, boxW = 24, boxH = 22) {
  if (!companyLogo || !companyLogo.startsWith('data:image/')) return;
  try {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.rect(x, y, boxW, boxH, 'FD');
    doc.addImage(companyLogo, x + 1.5, y + 1.5, boxW - 3, boxH - 3, undefined, 'FAST');
  } catch (err) {
    console.warn('No se pudo renderizar el logo de la empresa en el PDF:', err);
  }
}

/**
 * Generador de PDF oficial en TAMAÑO CARTA (Letter: 215.9mm x 279.4mm)
 * para el Acta de Nombramiento y Delegación del Líder del PESV (Paso 1).
 * Soporta paginación dinámica, encabezado en cada página, pie de página "Página X de Y"
 * y bloques protegidos contra desbordes o cortes a mitad de firma.
 */
export function exportActaNombramientoPDF(data: ActaNombramientoPDFData) {
  const {
    companyName = 'EMPRESA',
    companyLogo = '',
    actaNumber = 'ACTA-PESV-001-2026',
    appointmentDate = '2026-06-25',
    leaderName = 'Ing. Carlos Andrés Restrepo',
    leaderId = 'CC 1.036.782.112',
    leaderLicense = 'SST-2024-5432',
    leaderLicenseExpiry = '2028-12-31',
    repLegal = 'Ing. Diana Patricia Osorio',
    actaCustomIntro = '',
    actaResponsibilities = '',
    repSignatureImg1 = '',
    leaderSignatureImg = '',
    filename = `Acta_Nombramiento_Lider_${(leaderName || 'PESV').replace(/\s+/g, '_')}.pdf`
  } = data;

  // Carta / Letter en mm: 215.9 mm ancho x 279.4 mm alto
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = 215.9;
  const pageHeight = 279.4;
  const marginX = 20;
  const contentWidth = pageWidth - marginX * 2; // 175.9 mm
  const maxY = 250; // límite seguro antes del pie de página (266 mm)

  let currentPage = 1;
  let currentY = 20;

  // Encabezado de páginas posteriores (Página 2 en adelante)
  const drawRunningHeader = () => {
    const hasLogo = Boolean(companyLogo && companyLogo.startsWith('data:image/'));
    if (hasLogo) {
      drawCompanyLogoInHeader(doc, companyLogo, marginX, 8.5, 11, 9);
    }
    const textX = hasLogo ? marginX + 13 : marginX;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(companyName.toUpperCase(), textX, 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`ACTA DE NOMBRAMIENTO DEL LÍDER DEL PESV • ${actaNumber}`, textX, 16.5);
    doc.text('RESOLUCIÓN 40595 DE 2022 - PASO 1', pageWidth - marginX, 16.5, { align: 'right' });

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(marginX, 18.5, pageWidth - marginX, 18.5);
  };

  // Función de control de salto de página dinámico
  const ensureSpace = (heightNeeded: number) => {
    if (currentY + heightNeeded > maxY) {
      doc.addPage('letter', 'portrait');
      currentPage++;
      drawRunningHeader();
      currentY = 24;
    }
  };

  // ==========================================
  // PÁGINA 1: ENCABEZADO INSTITUCIONAL FORMAL
  // ==========================================
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.4);
  doc.rect(marginX, currentY, contentWidth, 32, 'FD');

  // Barra de acento superior institucional (Esmeralda oscuro)
  doc.setFillColor(5, 150, 105);
  doc.rect(marginX, currentY, contentWidth, 3, 'F');

  drawCompanyLogoInHeader(doc, companyLogo, marginX + 3, currentY + 5, 24, 23);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('SISTEMA DE GESTIÓN DE SEGURIDAD VIAL (PESV)', pageWidth / 2, currentY + 7.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(companyName.toUpperCase(), pageWidth / 2, currentY + 14, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(4, 120, 87);
  doc.text('ACTA DE NOMBRAMIENTO Y DELEGACIÓN DEL LÍDER DEL PESV', pageWidth / 2, currentY + 20.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`CÓD: ${actaNumber}   •   FECHA: ${appointmentDate}   •   CONFORME A RESOLUCIÓN 40595 DE 2022 (PASO 1)`, pageWidth / 2, currentY + 26.5, { align: 'center' });

  currentY += 38;

  // ==========================================
  // CUERPO DEL ACTA / INTRODUCCIÓN LEGAL
  // ==========================================
  const legalIntro = `Siendo el día ${appointmentDate}, la Alta Dirección de la empresa ${companyName}, en ejercicio de sus facultades legales y en especial cumplimiento del Paso 1 de la Metodología para el diseño, implementación y verificación del Plan Estratégico de Seguridad Vial (Resolución 40595 de 2022 del Ministerio de Transporte de Colombia), se permite formalizar la designación de funciones para el liderazgo del PESV.`;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  const introLines = doc.splitTextToSize(legalIntro, contentWidth);
  doc.text(introLines, marginX, currentY);
  currentY += introLines.length * 4.3 + 3.5;

  if (actaCustomIntro && actaCustomIntro.trim().length > 0) {
    const customLines = doc.splitTextToSize(actaCustomIntro.trim(), contentWidth);
    ensureSpace(customLines.length * 4.3 + 4);
    doc.text(customLines, marginX, currentY);
    currentY += customLines.length * 4.3 + 4;
  }

  // ==========================================
  // SECCIÓN 1: DATOS DEL LÍDER DESIGNADO
  // ==========================================
  ensureSpace(34);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. DATOS DE IDENTIFICACIÓN DEL LÍDER DESIGNADO:', marginX, currentY);
  currentY += 3.5;

  // Tarjeta / Tabla de datos con fondo y líneas
  const boxH = 26;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(marginX, currentY, contentWidth, boxH, 'FD');

  // Barra de título interna
  doc.setFillColor(241, 245, 249);
  doc.rect(marginX, currentY, contentWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('PERFIL TÉCNICO Y LEGAL DEL RESPONSABLE ASIGNADO', marginX + 3, currentY + 3.8);

  const col1X = marginX + 3;
  const col2X = marginX + 90;

  // Fila 1
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Nombre Completo:', col1X, currentY + 10.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(leaderName || 'N/A', col1X + 28, currentY + 10.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Licencia en SST:', col2X, currentY + 10.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(leaderLicense || 'N/A', col2X + 28, currentY + 10.5);

  // Fila 2
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Documento Identidad:', col1X, currentY + 15.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(leaderId || 'N/A', col1X + 28, currentY + 15.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Vigencia Licencia:', col2X, currentY + 15.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(leaderLicenseExpiry || 'N/A', col2X + 28, currentY + 15.5);

  // Fila 3
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Rol Asignado:', col1X, currentY + 20.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(4, 120, 87);
  doc.text('Líder del Plan Estratégico de Seguridad Vial (PESV) - Paso 1 Res. 40595 de 2022', col1X + 28, currentY + 20.5);

  currentY += boxH + 5;

  // ==========================================
  // SECCIÓN 2: RESPONSABILIDADES Y OBLIGACIONES
  // ==========================================
  ensureSpace(18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. RESPONSABILIDADES Y OBLIGACIONES ASIGNADAS:', marginX, currentY);
  currentY += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const respIntro = 'De conformidad con el Paso 1 de la Resolución 40595 de 2022, el líder designado asume de manera expresa las siguientes facultades y deberes:';
  const respIntroLines = doc.splitTextToSize(respIntro, contentWidth);
  doc.text(respIntroLines, marginX, currentY);
  currentY += respIntroLines.length * 4 + 2.5;

  // Procesar cada responsabilidad línea por línea
  const rawResponsibilities = actaResponsibilities ||
    '1. Diseñar, planificar e implementar las fases del PESV en la organización.\n2. Coordinar el Comité de Seguridad Vial y reportar mensualmente a la Gerencia General.\n3. Recopilar y analizar la información de la línea base y los indicadores de siniestralidad viales.\n4. Promover campañas de sensibilización, hábitos seguros y capacitaciones operativas continuas.\n5. Vigilar el cumplimiento de las inspecciones preoperacionales y programas preventivos.';

  const items = rawResponsibilities.split('\n').map(i => i.trim()).filter(Boolean);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  items.forEach((item) => {
    // Calculamos espacio con indentación de viñeta
    const textLines = doc.splitTextToSize(item, contentWidth - 8);
    const itemHeight = textLines.length * 4.2 + 2;

    ensureSpace(itemHeight);

    // Viñeta verde estilizada
    doc.setFillColor(5, 150, 105);
    doc.rect(marginX + 1.5, currentY - 2.5, 1.8, 1.8, 'F');

    // Texto del ítem
    doc.text(textLines, marginX + 6, currentY);
    currentY += itemHeight;
  });

  currentY += 2;

  // ==========================================
  // SECCIÓN 3: DECLARACIÓN DE ACEPTACIÓN
  // ==========================================
  const acceptanceText = 'El líder designado acepta la presente delegación, comprometiéndose a velar por el cumplimiento de las metas de seguridad vial laboral, la reducción de siniestros, la articulación continua con el Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST) y la promoción permanente de conductas seguras en la vía de todos los colaboradores de la organización.';
  const acceptLines = doc.splitTextToSize(acceptanceText, contentWidth);

  ensureSpace(acceptLines.length * 4.2 + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. DECLARACIÓN DE ACEPTACIÓN Y COMPROMISO:', marginX, currentY);
  currentY += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(acceptLines, marginX, currentY);
  currentY += acceptLines.length * 4.2 + 6;

  // ==========================================
  // SECCIÓN 4: CONSTANCIA Y FIRMAS
  // ==========================================
  // El bloque de firmas requiere al menos 46 mm
  const signatureBlockHeight = 46;
  if (currentY + signatureBlockHeight > maxY) {
    doc.addPage('letter', 'portrait');
    currentPage++;
    drawRunningHeader();
    currentY = 25;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`EN CONSTANCIA DE NOMBRAMIENTO Y ACEPTACIÓN SE SUSCRIBE EN FECHA ${appointmentDate.toUpperCase()}:`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;

  const signCol1Center = marginX + 40; // 60 mm
  const signCol2Center = marginX + 135; // 155 mm

  // Altura reservada para las imágenes de firma
  const imgY = currentY;
  const lineY = currentY + 16;

  // Firma Representante Legal
  if (repSignatureImg1 && repSignatureImg1.startsWith('data:image/')) {
    try {
      doc.addImage(repSignatureImg1, signCol1Center - 22, imgY, 44, 14, undefined, 'FAST');
    } catch (err) {
      console.warn('No se pudo renderizar imagen de firma representante legal:', err);
    }
  }

  // Firma Líder PESV
  if (leaderSignatureImg && leaderSignatureImg.startsWith('data:image/')) {
    try {
      doc.addImage(leaderSignatureImg, signCol2Center - 22, imgY, 44, 14, undefined, 'FAST');
    } catch (err) {
      console.warn('No se pudo renderizar imagen de firma líder PESV:', err);
    }
  }

  // Líneas de firma
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.4);
  doc.line(signCol1Center - 32, lineY, signCol1Center + 32, lineY);
  doc.line(signCol2Center - 32, lineY, signCol2Center + 32, lineY);

  // Textos bajo las firmas
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(repLegal || 'Representante Legal', signCol1Center, lineY + 4.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Representante Legal', signCol1Center, lineY + 8.5, { align: 'center' });
  doc.text(companyName, signCol1Center, lineY + 12.5, { align: 'center' });

  // Líder PESV
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(leaderName || 'Líder Designado', signCol2Center, lineY + 4.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Líder del PESV Designado', signCol2Center, lineY + 8.5, { align: 'center' });
  doc.text(`Lic. SST Nro. ${leaderLicense || 'N/A'}`, signCol2Center, lineY + 12.5, { align: 'center' });
  doc.text(`Vigencia Licencia: ${leaderLicenseExpiry || 'N/A'}`, signCol2Center, lineY + 16.5, { align: 'center' });

  // ==========================================
  // PIE DE PÁGINA EN TODAS LAS HOJAS
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(marginX, 267, pageWidth - marginX, 267);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Documento Oficial PESV • ${companyName} • Formato Carta • Conforme a la Res. 40595 de 2022 (Paso 1)`,
      marginX,
      271
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - marginX, 271, { align: 'right' });
  }

  // Descarga del archivo
  doc.save(filename);
}

/**
 * Generador de PDF oficial en TAMAÑO CARTA para la Política de Seguridad Vial (Paso 2).
 */
export function exportPoliticaPDF(data: PoliticaPDFData) {
  const {
    companyName = 'EMPRESA',
    companyLogo = '',
    policyDate = '2026-06-25',
    repLegal = 'Ing. Diana Patricia Osorio',
    policyCustomText = '',
    selectedCommitments = [],
    repSignatureImg2 = '',
    filename = `Politica_Seguridad_Vial_${companyName.replace(/\s+/g, '_')}.pdf`
  } = data;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = 215.9;
  const marginX = 20;
  const contentWidth = pageWidth - marginX * 2;
  let currentY = 20;

  // Encabezado
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.4);
  doc.rect(marginX, currentY, contentWidth, 32, 'FD');

  doc.setFillColor(5, 150, 105);
  doc.rect(marginX, currentY, contentWidth, 3, 'F');

  drawCompanyLogoInHeader(doc, companyLogo, marginX + 3, currentY + 5, 24, 23);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('SISTEMA DE GESTIÓN DE SEGURIDAD VIAL (PESV)', pageWidth / 2, currentY + 7.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(companyName.toUpperCase(), pageWidth / 2, currentY + 14, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(4, 120, 87);
  doc.text('POLÍTICA INSTITUCIONAL DE SEGURIDAD VIAL LABORAL', pageWidth / 2, currentY + 20.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`CÓD: PESV-POL-001 v2   •   FECHA DE EMISIÓN: ${policyDate}   •   CONFORME A RES. 40595 DE 2022 (PASO 2)`, pageWidth / 2, currentY + 26.5, { align: 'center' });

  currentY += 38;

  // Declaración General
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. DECLARACIÓN DE COMPROMISO GERENCIAL:', marginX, currentY);
  currentY += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  const textLines = doc.splitTextToSize(policyCustomText || 'La Alta Dirección se compromete con la seguridad vial...', contentWidth);
  doc.text(textLines, marginX, currentY);
  currentY += textLines.length * 4.3 + 6;

  // Compromisos Específicos
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. COMPROMISOS Y DIRECTRICES OPERACIONALES OBLIGATORIAS:', marginX, currentY);
  currentY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  selectedCommitments.forEach((com) => {
    const comLines = doc.splitTextToSize(com, contentWidth - 8);
    doc.setFillColor(5, 150, 105);
    doc.rect(marginX + 1.5, currentY - 2.5, 2, 2, 'F');
    doc.text(comLines, marginX + 6, currentY);
    currentY += comLines.length * 4.2 + 2;
  });

  currentY += 6;

  // Alcance
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. ALCANCE Y DIVULGACIÓN:', marginX, currentY);
  currentY += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const alcanceText = 'Esta política aplica a todos los colaboradores, directivos, contratistas y terceros que utilicen vehículos para fines laborales o en sus desplazamientos misionales. Se divulga a todo el personal y será revisada como mínimo una (1) vez al año bajo el ciclo PHVA.';
  const alcanceLines = doc.splitTextToSize(alcanceText, contentWidth);
  doc.text(alcanceLines, marginX, currentY);
  currentY += alcanceLines.length * 4 + 10;

  // Firma Representante Legal
  const signCenter = pageWidth / 2;
  if (repSignatureImg2 && repSignatureImg2.startsWith('data:image/')) {
    try {
      doc.addImage(repSignatureImg2, signCenter - 22, currentY - 14, 44, 13, undefined, 'FAST');
    } catch (e) {
      console.warn('Error rendering signature:', e);
    }
  }

  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.4);
  doc.line(signCenter - 35, currentY, signCenter + 35, currentY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(repLegal || 'Representante Legal', signCenter, currentY + 4.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Representante Legal y Gerencia General', signCenter, currentY + 8.5, { align: 'center' });
  doc.text(companyName, signCenter, currentY + 12.5, { align: 'center' });

  // Pie de página
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(marginX, 267, pageWidth - marginX, 267);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`Documento Oficial PESV • ${companyName} • Formato Carta • Conforme a Res. 40595 de 2022`, marginX, 271);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - marginX, 271, { align: 'right' });
  }

  doc.save(filename);
}

/**
 * Generador de PDF oficial en TAMAÑO CARTA para Acta del Comité de Seguridad Vial (Paso 3).
 * Soporta paginación dinámica, control de saltos de página, formato carta (Letter),
 * cabecera recurrente en páginas posteriores y registro completo de compromisos y firmas.
 */
export function exportComiteActaPDF(data: ComiteActaPDFData) {
  const {
    companyName = 'EMPRESA',
    companyLogo = '',
    numeroActa = 'CSV-ACT-001',
    fecha = '2026-05-20',
    temasDiscutidos = '',
    compromisos = [],
    asistentes = [],
    filename = `Acta_Comite_${numeroActa}.pdf`
  } = data;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = 215.9;
  const marginX = 20;
  const contentWidth = pageWidth - marginX * 2; // 175.9 mm
  const maxY = 250; // límite seguro antes del pie de página (267 mm)

  let currentPage = 1;
  let currentY = 20;

  // Encabezado para páginas 2 en adelante
  const drawRunningHeader = () => {
    const hasLogo = Boolean(companyLogo && companyLogo.startsWith('data:image/'));
    if (hasLogo) {
      drawCompanyLogoInHeader(doc, companyLogo, marginX, 8.5, 11, 9);
    }
    const textX = hasLogo ? marginX + 13 : marginX;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(companyName.toUpperCase(), textX, 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`ACTA DE REUNIÓN DEL COMITÉ DE SEGURIDAD VIAL • ${numeroActa}`, textX, 16.5);
    doc.text('RESOLUCIÓN 40595 DE 2022 - PASO 3', pageWidth - marginX, 16.5, { align: 'right' });

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(marginX, 18.5, pageWidth - marginX, 18.5);
  };

  // Función de control de salto de página dinámico
  const ensureSpace = (heightNeeded: number) => {
    if (currentY + heightNeeded > maxY) {
      doc.addPage('letter', 'portrait');
      currentPage++;
      drawRunningHeader();
      currentY = 24;
    }
  };

  // ==========================================
  // PÁGINA 1: ENCABEZADO INSTITUCIONAL FORMAL
  // ==========================================
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.4);
  doc.rect(marginX, currentY, contentWidth, 32, 'FD');

  // Barra de acento superior azul institucional (Sky/Azul Comité)
  doc.setFillColor(2, 132, 199);
  doc.rect(marginX, currentY, contentWidth, 3, 'F');

  drawCompanyLogoInHeader(doc, companyLogo, marginX + 3, currentY + 5, 24, 23);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('COMITÉ DE SEGURIDAD VIAL (RESOLUCIÓN 40595 DE 2022 - PASO 3)', pageWidth / 2, currentY + 7.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(companyName.toUpperCase(), pageWidth / 2, currentY + 14, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(2, 132, 199);
  doc.text(`ACTA OFICIAL DE SESIÓN DE REUNIÓN Nro. ${numeroActa}`, pageWidth / 2, currentY + 20.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`CÓD: SIG-PESV-ACT-02   •   FECHA DE REUNIÓN: ${fecha}   •   ESTADO: APROBADA POR COMITÉ`, pageWidth / 2, currentY + 26.5, { align: 'center' });

  currentY += 36;

  // ==========================================
  // DATOS GENERALES DE LA SESIÓN
  // ==========================================
  ensureSpace(18);
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(marginX, currentY, contentWidth, 13, 'FD');

  const colWidth3 = contentWidth / 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('ORGANIZACIÓN:', marginX + 3, currentY + 4.5);
  doc.text('FECHA DE SESIÓN:', marginX + colWidth3 + 3, currentY + 4.5);
  doc.text('LUGAR / MODALIDAD:', marginX + colWidth3 * 2 + 3, currentY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  const compLines = doc.splitTextToSize(companyName, colWidth3 - 6);
  doc.text(compLines[0] || companyName, marginX + 3, currentY + 9.5);
  doc.text(fecha, marginX + colWidth3 + 3, currentY + 9.5);
  doc.text('Sala de Juntas SST / Virtual', marginX + colWidth3 * 2 + 3, currentY + 9.5);

  currentY += 17;

  // ==========================================
  // SECCIÓN 1: AGENDA Y TEMAS DISCUTIDOS
  // ==========================================
  ensureSpace(20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. AGENDA Y TEMAS DISCUTIDOS EN LA SESIÓN:', marginX, currentY);
  currentY += 4;

  const rawTemas = temasDiscutidos || 'Sesión ordinaria del Comité de Seguridad Vial para seguimiento al Plan Estratégico de Seguridad Vial (PESV), revisión de indicadores de siniestralidad vial, evaluación de inspecciones preoperacionales y definición de planes de acción.';
  const temasParagraphs = rawTemas.split('\n').map(p => p.trim()).filter(Boolean);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  temasParagraphs.forEach(paragraph => {
    const lines = doc.splitTextToSize(paragraph, contentWidth);
    ensureSpace(lines.length * 4.2 + 2);
    doc.text(lines, marginX, currentY);
    currentY += lines.length * 4.2 + 2;
  });

  currentY += 4;

  // ==========================================
  // SECCIÓN 2: PLAN DE COMPROMISOS Y ACCIONES
  // ==========================================
  ensureSpace(25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. PLAN DE TAREAS Y COMPROMISOS ADQUIRIDOS:', marginX, currentY);
  currentY += 4;

  // Encabezado de la tabla
  const colTareaW = contentWidth - 72; // ~103.9 mm
  const colRespW = 44; // 44 mm
  const colFechaW = 28; // 28 mm

  doc.setFillColor(2, 132, 199);
  doc.rect(marginX, currentY, contentWidth, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('ACTIVIDAD O COMPROMISO ASIGNADO', marginX + 3, currentY + 4.5);
  doc.text('RESPONSABLE', marginX + colTareaW + 3, currentY + 4.5);
  doc.text('FECHA LÍMITE', marginX + colTareaW + colRespW + colFechaW / 2, currentY + 4.5, { align: 'center' });
  currentY += 6.5;

  if (compromisos && compromisos.length > 0) {
    compromisos.forEach((comp, idx) => {
      const tareaText = comp.tarea || 'Sin descripción';
      const respText = comp.responsable || 'Comité PESV';
      const fechaText = comp.fechaLimite || 'Por definir';

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      const tareaLines = doc.splitTextToSize(tareaText, colTareaW - 6);
      const respLines = doc.splitTextToSize(respText, colRespW - 6);
      const rowHeight = Math.max(tareaLines.length * 3.8, respLines.length * 3.8, 6.5) + 3;

      ensureSpace(rowHeight);

      // Fondo alternado
      if (idx % 2 === 0) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(248, 250, 252);
      }
      doc.rect(marginX, currentY, contentWidth, rowHeight, 'F');

      // Bordes
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.rect(marginX, currentY, contentWidth, rowHeight, 'D');
      doc.line(marginX + colTareaW, currentY, marginX + colTareaW, currentY + rowHeight);
      doc.line(marginX + colTareaW + colRespW, currentY, marginX + colTareaW + colRespW, currentY + rowHeight);

      // Textos
      doc.setTextColor(15, 23, 42);
      doc.text(tareaLines, marginX + 3, currentY + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text(respLines, marginX + colTareaW + 3, currentY + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(fechaText, marginX + colTareaW + colRespW + colFechaW / 2, currentY + 4.5, { align: 'center' });

      currentY += rowHeight;
    });
  } else {
    ensureSpace(8);
    doc.setFillColor(255, 255, 255);
    doc.rect(marginX, currentY, contentWidth, 8, 'FD');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('No se registraron tareas adicionales en esta acta de comité.', marginX + contentWidth / 2, currentY + 5, { align: 'center' });
    currentY += 8;
  }

  currentY += 6;

  // ==========================================
  // SECCIÓN 3: MIEMBROS ASISTENTES Y FIRMAS
  // ==========================================
  ensureSpace(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. CONTROL DE ASISTENCIA Y FIRMAS DE LOS MIEMBROS DEL COMITÉ:', marginX, currentY);
  currentY += 6;

  if (asistentes && asistentes.length > 0) {
    const cardW = (contentWidth - 10) / 2; // ~83 mm
    const cardH = 32;

    for (let i = 0; i < asistentes.length; i += 2) {
      ensureSpace(cardH + 4);

      // Miembro 1 (Izquierda)
      const m1 = asistentes[i];
      const x1 = marginX;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.rect(x1, currentY, cardW, cardH, 'FD');

      // Firma de m1
      const lineY1 = currentY + 16;
      if (m1.firma && m1.firma.startsWith('data:image/')) {
        try {
          doc.addImage(m1.firma, x1 + 8, currentY + 2, cardW - 16, 12, undefined, 'FAST');
        } catch (e) {
          doc.setFont('times', 'italic');
          doc.setFontSize(9);
          doc.setTextColor(2, 132, 199);
          doc.text(m1.nombre, x1 + cardW / 2, currentY + 11, { align: 'center' });
        }
      } else if (m1.firmado) {
        doc.setFont('times', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(2, 132, 199);
        doc.text(m1.firma || m1.nombre, x1 + cardW / 2, currentY + 11, { align: 'center' });
      } else {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(156, 163, 175);
        doc.text('Pendiente por firmar', x1 + cardW / 2, currentY + 11, { align: 'center' });
      }

      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.3);
      doc.line(x1 + 6, lineY1, x1 + cardW - 6, lineY1);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(m1.nombre, x1 + cardW / 2, lineY1 + 3.8, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      doc.text(m1.cargo || 'Miembro', x1 + cardW / 2, lineY1 + 7, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(2, 132, 199);
      doc.text(`Rol Comité: ${m1.rol || 'Miembro'}`, x1 + cardW / 2, lineY1 + 10.2, { align: 'center' });

      if (m1.firmado) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.5);
        doc.setTextColor(5, 150, 105);
        doc.text('✓ ASISTENTE FIRMADO DIGITALMENTE', x1 + cardW / 2, lineY1 + 13.5, { align: 'center' });
      }

      // Miembro 2 (Derecha, si existe)
      if (i + 1 < asistentes.length) {
        const m2 = asistentes[i + 1];
        const x2 = marginX + cardW + 10;
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.rect(x2, currentY, cardW, cardH, 'FD');

        const lineY2 = currentY + 16;
        if (m2.firma && m2.firma.startsWith('data:image/')) {
          try {
            doc.addImage(m2.firma, x2 + 8, currentY + 2, cardW - 16, 12, undefined, 'FAST');
          } catch (e) {
            doc.setFont('times', 'italic');
            doc.setFontSize(9);
            doc.setTextColor(2, 132, 199);
            doc.text(m2.nombre, x2 + cardW / 2, currentY + 11, { align: 'center' });
          }
        } else if (m2.firmado) {
          doc.setFont('times', 'italic');
          doc.setFontSize(9);
          doc.setTextColor(2, 132, 199);
          doc.text(m2.firma || m2.nombre, x2 + cardW / 2, currentY + 11, { align: 'center' });
        } else {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7);
          doc.setTextColor(156, 163, 175);
          doc.text('Pendiente por firmar', x2 + cardW / 2, currentY + 11, { align: 'center' });
        }

        doc.setDrawColor(148, 163, 184);
        doc.setLineWidth(0.3);
        doc.line(x2 + 6, lineY2, x2 + cardW - 6, lineY2);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.text(m2.nombre, x2 + cardW / 2, lineY2 + 3.8, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(71, 85, 105);
        doc.text(m2.cargo || 'Miembro', x2 + cardW / 2, lineY2 + 7, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(2, 132, 199);
        doc.text(`Rol Comité: ${m2.rol || 'Miembro'}`, x2 + cardW / 2, lineY2 + 10.2, { align: 'center' });

        if (m2.firmado) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(5.5);
          doc.setTextColor(5, 150, 105);
          doc.text('✓ ASISTENTE FIRMADO DIGITALMENTE', x2 + cardW / 2, lineY2 + 13.5, { align: 'center' });
        }
      }

      currentY += cardH + 4;
    }
  } else {
    // Fallback estándar si no hay lista de miembros
    ensureSpace(30);
    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.3);
    doc.line(marginX + 15, currentY + 16, marginX + 65, currentY + 16);
    doc.line(marginX + 95, currentY + 16, marginX + 145, currentY + 16);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Presidente del Comité', marginX + 40, currentY + 20, { align: 'center' });
    doc.text('Secretario del Comité', marginX + 120, currentY + 20, { align: 'center' });
    currentY += 26;
  }

  // ==========================================
  // PIE DE PÁGINA EN TODAS LAS HOJAS (Página X de Y)
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(marginX, 267, pageWidth - marginX, 267);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`Acta Oficial Comité PESV • ${companyName} • Formato Carta • Res. 40595 de 2022`, marginX, 271);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - marginX, 271, { align: 'right' });
  }

  doc.save(filename);
}

/**
 * Generador de PDF oficial en TAMAÑO CARTA para la Declaración Juramentada de Liderazgo y Compromiso (Paso 4).
 */
export function exportCompromisoGerentePDF(data: CompromisoGerentePDFData) {
  const {
    companyName = 'EMPRESA',
    companyLogo = '',
    managerSignatureName = 'Ing. Diana Patricia Osorio',
    managerSignatureCharge = 'Gerente General y Representante Legal',
    managerSignatureDate = '2026-06-25',
    commitmentScore = 100,
    managerSignatureImg = '',
    filename = 'Certificado_Compromiso_Gerente_PESV.pdf'
  } = data;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = 215.9;
  const marginX = 20;
  const contentWidth = pageWidth - marginX * 2;
  let currentY = 20;

  // Header
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.4);
  doc.rect(marginX, currentY, contentWidth, 32, 'FD');

  doc.setFillColor(5, 150, 105);
  doc.rect(marginX, currentY, contentWidth, 3, 'F');

  drawCompanyLogoInHeader(doc, companyLogo, marginX + 3, currentY + 5, 24, 23);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('SISTEMA DE GESTIÓN DE SEGURIDAD VIAL (PESV)', pageWidth / 2, currentY + 7.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(companyName.toUpperCase(), pageWidth / 2, currentY + 14, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(4, 120, 87);
  doc.text('DECLARACIÓN JURAMENTADA DE LIDERAZGO, COMPROMISO Y CORRESPONSABILIDAD DIRECTIVA', pageWidth / 2, currentY + 20, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`CÓD: DIR-PESV-LID-01   •   FECHA: ${managerSignatureDate}   •   RES. 40595 DE 2022 (PASO 4)`, pageWidth / 2, currentY + 26, { align: 'center' });

  currentY += 38;

  // Declaración
  const juramentoText = `Yo, ${managerSignatureName}, actuando en calidad de ${managerSignatureCharge} de la organización ${companyName}, en cumplimiento expreso del Paso 4 de la Metodología de la Resolución 40595 de 2022, declaro formalmente bajo la gravedad de juramento que la Alta Dirección asume el liderazgo, asignación de recursos presupuestales, humanos y tecnológicos requeridos para la ejecución eficaz del Plan Estratégico de Seguridad Vial.`;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  const juraLines = doc.splitTextToSize(juramentoText, contentWidth);
  doc.text(juraLines, marginX, currentY);
  currentY += juraLines.length * 4.3 + 5;

  // Obligaciones asumidas
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('OBLIGACIONES DIRECTIVAS CERTIFICADAS (PASO 4 LITERALES a HASTA h):', marginX, currentY);
  currentY += 4.5;

  const obligations = [
    'a) Definir, firmar y divulgar la política de seguridad vial anual.',
    'b) Asignar los recursos financieros, humanos y técnicos suficientes para el PESV.',
    'c) Designar al líder del PESV con competencias y responsabilidades claras.',
    'd) Conformar y garantizar la periodicidad de reuniones del Comité de Seguridad Vial.',
    'e) Articular activamente el PESV con el Sistema de Gestión de Seguridad y Salud en el Trabajo.',
    'f) Participar en la formulación de planes de acción y tratamiento del riesgo vial.',
    'g) Realizar seguimiento periódico a indicadores de siniestralidad y auditorías preventivas.',
    'h) Rendir cuentas sobre los resultados y avances alcanzados en la seguridad vial de la empresa.'
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  obligations.forEach(ob => {
    doc.setFillColor(5, 150, 105);
    doc.rect(marginX + 2, currentY - 2.5, 1.8, 1.8, 'F');
    doc.text(ob, marginX + 6, currentY);
    currentY += 4.5;
  });

  currentY += 5;

  // Puntuación
  doc.setFillColor(240, 253, 250);
  doc.setDrawColor(20, 184, 166);
  doc.rect(marginX, currentY, contentWidth, 10, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(13, 148, 136);
  doc.text(`NIVEL DE CUMPLIMIENTO DEL COMPROMISO DIRECTIVO: ${commitmentScore}% - AUDITORÍA CUMPLE`, pageWidth / 2, currentY + 6.5, { align: 'center' });
  currentY += 18;

  // Firma Gerente
  const signCenter = pageWidth / 2;
  if (managerSignatureImg && managerSignatureImg.startsWith('data:image/')) {
    try {
      doc.addImage(managerSignatureImg, signCenter - 22, currentY - 14, 44, 13, undefined, 'FAST');
    } catch (e) {
      console.warn('Error rendering signature:', e);
    }
  }

  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.4);
  doc.line(signCenter - 35, currentY, signCenter + 35, currentY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(managerSignatureName, signCenter, currentY + 4.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(managerSignatureCharge, signCenter, currentY + 8.5, { align: 'center' });
  doc.text(companyName, signCenter, currentY + 12.5, { align: 'center' });

  // Pie de página
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(marginX, 267, pageWidth - marginX, 267);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`Certificado Oficial PESV • ${companyName} • Formato Carta • Conforme a Res. 40595 de 2022`, marginX, 271);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - marginX, 271, { align: 'right' });
  }

  doc.save(filename);
}

/**
 * Generador de PDF oficial en TAMAÑO CARTA para el Plan Anual de Trabajo PESV (Paso 8).
 */
export function exportPlanAnualPDF(data: PlanAnualPDFData) {
  const {
    companyName = 'EMPRESA',
    companyLogo = '',
    activities = [],
    filename = `Plan_Anual_Trabajo_PESV_${companyName.replace(/\s+/g, '_')}.pdf`
  } = data;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'letter' // 279.4mm x 215.9mm en apaisado
  });

  const pageWidth = 279.4;
  const pageHeight = 215.9;
  const marginX = 15;
  const contentWidth = pageWidth - marginX * 2;
  const maxY = 195;

  let currentY = 15;
  let currentPage = 1;

  const drawHeader = () => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.4);
    doc.rect(marginX, currentY, contentWidth, 22, 'FD');

    doc.setFillColor(5, 150, 105);
    doc.rect(marginX, currentY, contentWidth, 2.5, 'F');

    drawCompanyLogoInHeader(doc, companyLogo, marginX + 3, currentY + 3.5, 20, 16.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`${companyName.toUpperCase()} — PLAN ANUAL DE TRABAJO PESV (PASO 8)`, pageWidth / 2, currentY + 10, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('CONFORME A LA METODOLOGÍA DE LA RESOLUCIÓN 40595 DE 2022 • VIGENCIA ANUAL 2026/2027', pageWidth / 2, currentY + 16, { align: 'center' });

    currentY += 26;
  };

  drawHeader();

  // Encabezado de tabla
  const colWidths = [18, 70, 42, 45, 24, 24, 26]; // Total = 249
  const headers = ['CÓDIGO', 'ACTIVIDAD PESV', 'RESPONSABLE', 'RECURSOS', 'INICIO', 'FIN', 'ESTADO'];

  const drawTableHead = (y: number) => {
    doc.setFillColor(30, 41, 59);
    doc.rect(marginX, y, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);

    let x = marginX;
    headers.forEach((h, i) => {
      doc.text(h, x + 2, y + 4.8);
      x += colWidths[i];
    });
  };

  drawTableHead(currentY);
  currentY += 7;

  // Filas
  activities.forEach((act, idx) => {
    const actLines = doc.splitTextToSize(act.actividad, colWidths[1] - 4);
    const rowH = Math.max(actLines.length * 3.8 + 2.5, 7);

    if (currentY + rowH > maxY) {
      doc.addPage('letter', 'landscape');
      currentPage++;
      currentY = 15;
      drawTableHead(currentY);
      currentY += 7;
    }

    // Fondo alternado
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(marginX, currentY, contentWidth, rowH, 'F');
    }

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.rect(marginX, currentY, contentWidth, rowH, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);

    let x = marginX;
    // Código
    doc.text(act.id, x + 2, currentY + 4.5);
    x += colWidths[0];

    // Actividad
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(actLines, x + 2, currentY + 4.2);
    x += colWidths[1];

    // Responsable
    const respLines = doc.splitTextToSize(act.responsable, colWidths[2] - 4);
    doc.text(respLines, x + 2, currentY + 4.2);
    x += colWidths[2];

    // Recursos
    const recLines = doc.splitTextToSize(act.recursos, colWidths[3] - 4);
    doc.text(recLines, x + 2, currentY + 4.2);
    x += colWidths[3];

    // Fechas
    doc.setFontSize(6.5);
    doc.text(act.fechaInicio, x + 2, currentY + 4.5);
    x += colWidths[4];
    doc.text(act.fechaFin, x + 2, currentY + 4.5);
    x += colWidths[5];

    // Estado
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(act.estado === 'Ejecutado' ? 5 : 217, act.estado === 'Ejecutado' ? 150 : 119, act.estado === 'Ejecutado' ? 105 : 6);
    doc.text(act.estado, x + 2, currentY + 4.5);

    currentY += rowH;
  });

  // Pie de página
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`Documento Oficial PESV • ${companyName} • Formato Carta (Apaisado) • Conforme a Res. 40595 de 2022`, marginX, pageHeight - 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - marginX, pageHeight - 8, { align: 'right' });
  }

  doc.save(filename);
}
