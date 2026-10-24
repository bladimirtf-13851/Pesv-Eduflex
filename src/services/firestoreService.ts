import { 
  collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, 
  onSnapshot, query, where, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { PESVCompany, PESVAnnualPlanActivity, RiskMatrixItem, PESVObjective, CommitteeMember } from '../types';

// Collection references
export const COLLECTIONS = {
  COMPANIES: 'companies',
  COMPANY_CONFIGS: 'company_configs',
  ANNUAL_PLANS: 'annual_plans',
  RISK_MATRICES: 'risk_matrices',
  OBJECTIVES: 'objectives',
  COMMITTEES: 'committees',
  SETTINGS: 'system_settings',
  METRICS: 'metrics'
};

// --- COMPANIES CRUD & REALTIME ---
export const subscribeToCompanies = (callback: (companies: PESVCompany[]) => void) => {
  const companiesRef = collection(db, COLLECTIONS.COMPANIES);
  return onSnapshot(companiesRef, (snapshot) => {
    const list: PESVCompany[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as any;
      list.push({
        id: docSnap.id,
        name: data.name || '',
        nit: data.nit || '',
        logo: data.logo || '🏢',
        adminEmail: data.adminEmail || '',
        adminPassword: data.adminPassword || 'admin',
        config: data.config || {
          misionalidad: 'TRANSPORTE',
          motos: 0,
          carros: 0,
          camiones: 0,
          buses: 0,
          conductoresContratados: 0,
          conductoresAdministrados: 0,
          totalVehiculos: 0,
          totalConductores: 0,
          nivelCalculado: 'BÁSICO'
        }
      });
    });
    callback(list);
  }, (error) => {
    console.error('Error listening to companies from Firebase:', error);
  });
};

export const saveCompanyToFirestore = async (company: PESVCompany) => {
  const docRef = doc(db, COLLECTIONS.COMPANIES, company.id);
  await setDoc(docRef, {
    name: company.name,
    nit: company.nit,
    logo: company.logo || '🏢',
    adminEmail: company.adminEmail,
    adminPassword: company.adminPassword || 'admin',
    config: company.config,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

export const deleteCompanyFromFirestore = async (companyId: string) => {
  const docRef = doc(db, COLLECTIONS.COMPANIES, companyId);
  await deleteDoc(docRef);
};

// --- ANNUAL WORK PLAN (PASO 8) CLOUD PERSISTENCE ---
export const subscribeToAnnualPlan = (
  companyId: string, 
  callback: (activities: PESVAnnualPlanActivity[]) => void
) => {
  const planDocRef = doc(db, COLLECTIONS.ANNUAL_PLANS, companyId || 'global_plan');
  return onSnapshot(planDocRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (Array.isArray(data.activities)) {
        callback(data.activities);
        return;
      }
    }
    callback([]);
  }, (error) => {
    console.error('Error listening to annual plan:', error);
  });
};

export const saveAnnualPlanToFirestore = async (
  companyId: string, 
  activities: PESVAnnualPlanActivity[]
) => {
  const planDocRef = doc(db, COLLECTIONS.ANNUAL_PLANS, companyId || 'global_plan');
  await setDoc(planDocRef, {
    companyId: companyId || 'global_plan',
    activities,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

// --- SYSTEM SETTINGS (e.g. Super Admin credentials / profile) ---
export const saveSystemSetting = async (key: string, value: any) => {
  const docRef = doc(db, COLLECTIONS.SETTINGS, key);
  await setDoc(docRef, { value, updatedAt: serverTimestamp() }, { merge: true });
};

export const getSystemSetting = async (key: string) => {
  const docRef = doc(db, COLLECTIONS.SETTINGS, key);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data().value;
  }
  return null;
};

export const subscribeToSystemSetting = (key: string, callback: (value: any) => void) => {
  const docRef = doc(db, COLLECTIONS.SETTINGS, key);
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data().value);
    }
  }, (error) => {
    console.error(`Error listening to system setting ${key}:`, error);
  });
};

