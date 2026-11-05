/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Trophy, 
  Target, 
  Plus, 
  Download, 
  Upload, 
  X, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  Sparkles,
  Award,
  Star,
  Gift,
  ShieldCheck,
  Heart,
  Zap,
  Sliders,
  Copy,
  LayoutGrid,
  Database,
  Calendar,
  Lock,
  PartyPopper
} from 'lucide-react';

export type StageKey = 'nuevo' | 'contactado' | 'reunion' | 'propuesta' | 'ganado' | 'perdido';

export type ScreenTab = 'tablero' | 'icp' | 'logros' | 'datos';

export interface Criterion {
  id: string;
  label: string;
  peso: number; // 1 a 5
}

export interface Lead {
  id: string;
  name: string;
  contact: string;
  sector?: string;
  zona?: string;
  value: number;
  stage: StageKey;
  nextAction: string;
  date: string;
  notes: string;
  fulfillment: Record<string, number>; // 0.00 a 1.00 por criterio
}

export interface CustomBadge {
  id: string;
  name: string;
  condition: string;
  date: string;
}

export interface LevelDef {
  nivel: number;
  titulo: string;
  xpMin: number;
  xpMax: number;
  desc: string;
}

const STORAGE_KEY = 'kinetic_teal_crm_v4_logros';

const NIVELES: LevelDef[] = [
  { nivel: 1, titulo: 'Iniciador del Pipeline', xpMin: 0, xpMax: 100, desc: 'Construyendo los primeros cimientos comerciales.' },
  { nivel: 2, titulo: 'Estratega B2B', xpMin: 101, xpMax: 250, desc: 'Cualificando con rigor y enfoque de valor.' },
  { nivel: 3, titulo: 'Negociador de Alto Impacto', xpMin: 251, xpMax: 500, desc: 'Generando propuestas estratégicas irresistibles.' },
  { nivel: 4, titulo: 'Maestro del Cierre', xpMin: 501, xpMax: 850, desc: 'Dominio de acuerdos y relaciones comerciales a largo plazo.' },
  { nivel: 5, titulo: 'Arquitecto de Ingresos', xpMin: 851, xpMax: 1300, desc: 'Liderando el flujo continuo de valor y retención.' },
  { nivel: 6, titulo: 'Leyenda Comercial', xpMin: 1301, xpMax: 99999, desc: 'Maestría total y hábitos éticos impecables.' }
];

const STAGES: { key: StageKey; label: string; dotColor: string }[] = [
  { key: 'nuevo', label: '1. Nuevo', dotColor: 'bg-slate-400' },
  { key: 'contactado', label: '2. Contactado', dotColor: 'bg-[#38bdf8]' },
  { key: 'reunion', label: '3. Reunión', dotColor: 'bg-[#a855f7]' },
  { key: 'propuesta', label: '4. Propuesta', dotColor: 'bg-[#ffb703]' },
  { key: 'ganado', label: '5. Ganado', dotColor: 'bg-[#d3ec00]' },
  { key: 'perdido', label: '6. Perdido', dotColor: 'bg-[#ef4444]' }
];

const INITIAL_CRITERIA: Criterion[] = [
  { id: 'sector', label: 'Sector & Industria', peso: 5 },
  { id: 'tamano', label: 'Tamaño & Madurez', peso: 4 },
  { id: 'zona', label: 'Zona Geográfica', peso: 3 },
  { id: 'problema', label: 'Urgencia del Problema', peso: 5 },
  { id: 'presupuesto', label: 'Presupuesto Adecuado', peso: 4 },
  { id: 'canal', label: 'Canal de Venta Idóneo', peso: 3 },
  { id: 'empatia', label: 'Alineación Mapa Empatía', peso: 4 }
];

const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-1',
    name: 'NexusCloud Systems S.L.',
    contact: 'Helena Gómez (CTO)',
    sector: 'Cloud & Kubernetes',
    zona: 'Madrid, España',
    value: 48500,
    stage: 'propuesta',
    nextAction: 'Enviar contrato marco revisado por legal',
    date: '2026-11-10',
    notes: 'Migración a clusters Kubernetes y LLM privada. Presupuesto aprobado.',
    fulfillment: { sector: 1.0, tamano: 0.9, zona: 1.0, problema: 0.95, presupuesto: 0.9, canal: 0.85, empatia: 0.9 }
  },
  {
    id: 'lead-2',
    name: 'Quantum Retail Solutions',
    contact: 'Carlos Aranda (VP Ops)',
    sector: 'Retail Analytics',
    zona: 'Barcelona, España',
    value: 72000,
    stage: 'reunion',
    nextAction: 'Sesión de PoC con datos anonimizados',
    date: '2026-11-08',
    notes: 'Demo técnica completada con el equipo de infraestructura.',
    fulfillment: { sector: 0.85, tamano: 0.8, zona: 1.0, problema: 0.85, presupuesto: 0.85, canal: 0.8, empatia: 0.85 }
  },
  {
    id: 'lead-3',
    name: 'Iberia CyberShield Group',
    contact: 'Sofía Morales (CISO)',
    sector: 'Ciberseguridad Enterprise',
    zona: 'Valencia, España',
    value: 115000,
    stage: 'ganado',
    nextAction: 'Kick-off técnico y onboarding con ingeniería',
    date: '2026-11-06',
    notes: 'Contrato anual Enterprise de detección de intrusiones firmado.',
    fulfillment: { sector: 1.0, tamano: 1.0, zona: 1.0, problema: 1.0, presupuesto: 0.95, canal: 0.9, empatia: 1.0 }
  },
  {
    id: 'lead-4',
    name: 'DataPulse Analytics Europe',
    contact: 'Marcos Villegas (Head of Data)',
    sector: 'Big Data & ETL',
    zona: 'Sevilla, España',
    value: 34000,
    stage: 'contactado',
    nextAction: 'Llamada de cualificación de 15 min',
    date: '2026-11-07',
    notes: 'Formulario inbound recibido. Interesados en conector Snowflake.',
    fulfillment: { sector: 0.8, tamano: 0.65, zona: 0.9, problema: 0.75, presupuesto: 0.7, canal: 0.75, empatia: 0.7 }
  },
  {
    id: 'lead-5',
    name: 'BioHealth AI Diagnóstica',
    contact: 'Dra. Lucía Navarro (Directora Médica)',
    sector: 'HealthTech & IA',
    zona: 'Galicia, España',
    value: 89000,
    stage: 'propuesta',
    nextAction: 'Presentar oferta económica final ante el comité',
    date: '2026-11-12',
    notes: 'Cumplimiento RGPD validado con departamento legal.',
    fulfillment: { sector: 0.95, tamano: 0.9, zona: 1.0, problema: 0.95, presupuesto: 0.9, canal: 0.85, empatia: 0.9 }
  },
  {
    id: 'lead-6',
    name: 'LogistiQ Automation Logistics',
    contact: 'Fernando Ramos (Dir. Supply Chain)',
    sector: 'Logística & ERP',
    zona: 'Bilbao, España',
    value: 56000,
    stage: 'reunion',
    nextAction: 'Demostración técnica de API en vivo',
    date: '2026-11-09',
    notes: 'Interés en integración con ERP SAP.',
    fulfillment: { sector: 0.75, tamano: 0.85, zona: 0.9, problema: 0.8, presupuesto: 0.8, canal: 0.75, empatia: 0.8 }
  },
  {
    id: 'lead-7',
    name: 'FinSecure Pay Technologies',
    contact: 'Patricia De la Vega (Head of Payments)',
    sector: 'Fintech & Fraude',
    zona: 'Madrid, España',
    value: 130000,
    stage: 'ganado',
    nextAction: 'Revisión mensual de métricas de prevención',
    date: '2026-11-30',
    notes: 'Módulo de prevención de fraude en tiempo real en producción.',
    fulfillment: { sector: 0.95, tamano: 0.95, zona: 1.0, problema: 0.95, presupuesto: 0.95, canal: 0.9, empatia: 0.95 }
  },
  {
    id: 'lead-8',
    name: 'EcoSmart IoT Grid Systems',
    contact: 'Javier Montero (Lead Engineer)',
    sector: 'IoT & Telemetría',
    zona: 'Canarias, España',
    value: 28000,
    stage: 'nuevo',
    nextAction: 'Enviar caso de éxito y agendar primera llamada',
    date: '2026-11-11',
    notes: 'Contacto en feria tecnológica. Descargaron whitepaper.',
    fulfillment: { sector: 0.65, tamano: 0.5, zona: 0.7, problema: 0.6, presupuesto: 0.55, canal: 0.6, empatia: 0.6 }
  }
];

export default function App() {
  // Navegación de 4 pantallas
  const [activeTab, setActiveTab] = useState<ScreenTab>('tablero');

  // Estado del Pipeline
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [criteria, setCriteria] = useState<Criterion[]>(INITIAL_CRITERIA);
  const [sortByFit, setSortByFit] = useState<boolean>(true);

  // Cliente Ideal (ICP)
  const [icpSector, setIcpSector] = useState('Tecnología B2B, Cloud & IA');
  const [icpTamano, setIcpTamano] = useState('50 a 500 empleados / >5M€ facturación');
  const [icpZona, setIcpZona] = useState('España, Portugal y Sur de Europa');
  const [icpPresupuesto, setIcpPresupuesto] = useState('40.000 € a 150.000 € anuales');
  const [icpProblema, setIcpProblema] = useState('Ineficiencia operativa y falta de integración segura en nube');
  const [icpCanal, setIcpCanal] = useState('Demo técnica consultiva y propuesta directa al CTO/CISO');

  // Mapa de Empatía
  const [empathyPiensa, setEmpathyPiensa] = useState('Teme quedarse rezagado frente a rivales que usan IA y le preocupan las brechas de seguridad o caídas de servidores.');
  const [empathyVe, setEmpathyVe] = useState('Ve a empresas del sector anunciando automatizaciones y saturación de proveedores generalistas sin especialización.');
  const [empathyDice, setEmpathyDice] = useState('Exige pruebas de concepto reales (PoC), pide referencias de otros CTOs y revisa rigurosamente el acuerdo de nivel de servicio.');
  const [empathyOye, setEmpathyOye] = useState('Oye a la dirección financiera exigir reducción de costes y a sus ingenieros solicitar mejores herramientas modernas.');

  // Gamificación Ética (XP, Movimientos, Cofres, Insignias)
  const [xp, setXp] = useState<number>(35);
  const [movesThisWeek, setMovesThisWeek] = useState<number>(4);
  const [weeklyClaimed, setWeeklyClaimed] = useState<boolean>(false);
  const [monthlyClaimed, setMonthlyClaimed] = useState<boolean>(false);
  const [customBadges, setCustomBadges] = useState<CustomBadge[]>([
    {
      id: 'badge-wins-default',
      name: 'WinS',
      condition: 'Celebrar el primer avance semanal con rigor ético',
      date: '2026-11-05'
    }
  ]);

  // Modales
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isCustomBadgeModalOpen, setIsCustomBadgeModalOpen] = useState(false);
  const [isChestModalOpen, setIsChestModalOpen] = useState(false);
  const [chestModalData, setChestModalData] = useState<{ title: string; desc: string; reward: string; icon: string }>({
    title: '', desc: '', reward: '', icon: '🎁'
  });
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [parsedImportLead, setParsedImportLead] = useState<any | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Formulario Lead
  const [formName, setFormName] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formSector, setFormSector] = useState('');
  const [formZona, setFormZona] = useState('');
  const [formValue, setFormValue] = useState<number | ''>(45000);
  const [formStage, setFormStage] = useState<StageKey>('nuevo');
  const [formNextAction, setFormNextAction] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formFulfillment, setFormFulfillment] = useState<Record<string, number>>({});

  // Formulario Crear mi Insignia "WinS"
  const [badgeNameInput, setBadgeNameInput] = useState('WinS');
  const [badgeConditionInput, setBadgeConditionInput] = useState('');

  // Notificaciones Breves (Toast)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // REGLA 5: Al abrir la app por primera vez no debe saltar ningún aviso.
  const isInitialLoadRef = useRef<boolean>(true);

  // Drag and drop
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<StageKey | null>(null);

  // File input para importar JSON
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar de localStorage al montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (Array.isArray(data.leads) && data.leads.length > 0) setLeads(data.leads);
        if (Array.isArray(data.criteria) && data.criteria.length > 0) setCriteria(data.criteria);
        if (typeof data.sortByFit === 'boolean') setSortByFit(data.sortByFit);
        if (data.icpConfig) {
          if (data.icpConfig.sector) setIcpSector(data.icpConfig.sector);
          if (data.icpConfig.tamano) setIcpTamano(data.icpConfig.tamano);
          if (data.icpConfig.zona) setIcpZona(data.icpConfig.zona);
          if (data.icpConfig.presupuesto) setIcpPresupuesto(data.icpConfig.presupuesto);
          if (data.icpConfig.problema) setIcpProblema(data.icpConfig.problema);
          if (data.icpConfig.canal) setIcpCanal(data.icpConfig.canal);
          if (data.icpConfig.empathy) {
            if (data.icpConfig.empathy.piensa) setEmpathyPiensa(data.icpConfig.empathy.piensa);
            if (data.icpConfig.empathy.ve) setEmpathyVe(data.icpConfig.empathy.ve);
            if (data.icpConfig.empathy.dice) setEmpathyDice(data.icpConfig.empathy.dice);
            if (data.icpConfig.empathy.oye) setEmpathyOye(data.icpConfig.empathy.oye);
          }
        }
        if (data.gamification) {
          if (typeof data.gamification.xp === 'number') setXp(data.gamification.xp);
          if (typeof data.gamification.movesThisWeek === 'number') setMovesThisWeek(data.gamification.movesThisWeek);
          if (typeof data.gamification.weeklyClaimed === 'boolean') setWeeklyClaimed(data.gamification.weeklyClaimed);
          if (typeof data.gamification.monthlyClaimed === 'boolean') setMonthlyClaimed(data.gamification.monthlyClaimed);
          if (Array.isArray(data.gamification.customBadges)) setCustomBadges(data.gamification.customBadges);
        }
      }
    } catch (e) {
      console.warn('Cargando defaults locales', e);
    }

    // Permitir notificaciones después de la carga inicial
    const t = setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 900);
    return () => clearTimeout(t);
  }, []);

  // Guardar en localStorage con try/catch
  const saveStateToLocalStorage = (
    updatedLeads = leads,
    updatedCriteria = criteria,
    updatedXp = xp,
    updatedMoves = movesThisWeek,
    updatedWeekly = weeklyClaimed,
    updatedMonthly = monthlyClaimed,
    updatedBadges = customBadges
  ) => {
    try {
      const payload = {
        leads: updatedLeads,
        criteria: updatedCriteria,
        sortByFit,
        icpConfig: {
          sector: icpSector,
          tamano: icpTamano,
          zona: icpZona,
          presupuesto: icpPresupuesto,
          problema: icpProblema,
          canal: icpCanal,
          empathy: {
            piensa: empathyPiensa,
            ve: empathyVe,
            dice: empathyDice,
            oye: empathyOye
          }
        },
        gamification: {
          xp: updatedXp,
          movesThisWeek: updatedMoves,
          weeklyClaimed: updatedWeekly,
          monthlyClaimed: updatedMonthly,
          customBadges: updatedBadges
        },
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.error('Error guardando en localStorage:', err);
    }
  };

  const showToast = (msg: string) => {
    if (isInitialLoadRef.current) return; // REGLA 5: Al abrir por primera vez no salta aviso
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const getLevelByXp = (score: number): LevelDef => {
    for (let i = NIVELES.length - 1; i >= 0; i--) {
      if (score >= NIVELES[i].xpMin) return NIVELES[i];
    }
    return NIVELES[0];
  };

  // Niveles y XP
  const currentLevelObj = useMemo(() => {
    return getLevelByXp(xp);
  }, [xp]);

  const nextLevelObj = useMemo(() => {
    return NIVELES.find(n => n.nivel === currentLevelObj.nivel + 1) || NIVELES[NIVELES.length - 1];
  }, [currentLevelObj]);

  const levelProgressPct = useMemo(() => {
    if (nextLevelObj.nivel <= currentLevelObj.nivel) return 100;
    const xpInLevel = xp - currentLevelObj.xpMin;
    const range = nextLevelObj.xpMin - currentLevelObj.xpMin;
    return Math.min(100, Math.max(0, Math.round((xpInLevel / range) * 100)));
  }, [xp, currentLevelObj, nextLevelObj]);

  // Función para sumar XP
  const addXp = (amount: number, reason: string) => {
    setXp(prevXp => {
      const newXp = prevXp + amount;
      const prevLevel = getLevelByXp(prevXp).nivel;
      const newLevel = getLevelByXp(newXp).nivel;

      saveStateToLocalStorage(leads, criteria, newXp);

      if (!isInitialLoadRef.current) {
        if (newLevel > prevLevel) {
          const newObj = NIVELES.find(n => n.nivel === newLevel);
          showToast(`🎉 ¡Subiste al Nivel ${newLevel}: ${newObj?.titulo}! (+${amount} XP)`);
        } else if (amount >= 10) {
          showToast(`⚡ +${amount} XP: ${reason}`);
        }
      }
      return newXp;
    });
  };

  /**
   * Cálculo de encaje:
   * Encaje = suma(peso x cumplimiento) / suma(pesos), en porcentaje.
   * TEXTO OBLIGATORIO: "parecido con tu cliente ideal" (nunca probabilidad de compra).
   */
  const calculateFitScore = (lead: Partial<Lead> | null | undefined): number => {
    if (!lead || !lead.fulfillment) return 0;
    let sumWeight = 0;
    let sumScore = 0;

    criteria.forEach(crit => {
      const w = crit.peso || 1;
      const f = lead.fulfillment?.[crit.id] !== undefined ? lead.fulfillment[crit.id] : 0.7;
      sumScore += f * w;
      sumWeight += w;
    });

    if (sumWeight === 0) return 0;
    return Math.round((sumScore / sumWeight) * 100);
  };

  // Leads agrupados por columna
  const columnsData = useMemo(() => {
    const map: Record<StageKey, Lead[]> = {
      nuevo: [],
      contactado: [],
      reunion: [],
      propuesta: [],
      ganado: [],
      perdido: []
    };

    leads.forEach(lead => {
      if (map[lead.stage]) {
        map[lead.stage].push(lead);
      } else {
        map['nuevo'].push(lead);
      }
    });

    if (sortByFit) {
      Object.keys(map).forEach(stage => {
        map[stage as StageKey].sort((a, b) => calculateFitScore(b) - calculateFitScore(a));
      });
    }

    return map;
  }, [leads, criteria, sortByFit]);

  // Totales
  const globalTotalValue = useMemo(() => {
    return leads.reduce((acc, l) => acc + (Number(l.value) || 0), 0);
  }, [leads]);

  const globalAvgFit = useMemo(() => {
    if (leads.length === 0) return 0;
    const sum = leads.reduce((acc, l) => acc + calculateFitScore(l), 0);
    return Math.round(sum / leads.length);
  }, [leads, criteria]);

  // Insignia Organizado: Leads con próxima acción
  const leadsWithNextActionCount = useMemo(() => {
    return leads.filter(l => (l.nextAction || '').trim().length > 0).length;
  }, [leads]);

  // Reto Semanal: 4 movimientos
  const weeklyGoal = 4;
  const weeklyProgress = Math.min(movesThisWeek, weeklyGoal);
  const isWeeklyReady = movesThisWeek >= weeklyGoal;

  // Reto Mensual: al menos 1 ganado
  const ganadoCount = useMemo(() => {
    return leads.filter(l => l.stage === 'ganado').length;
  }, [leads]);
  const isMonthlyReady = ganadoCount >= 1;

  // Manejo de Movimiento de Lead (Arrastrar o Select)
  const handleMoveLead = (leadId: string, newStage: StageKey) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead || lead.stage === newStage) return;

    const oldStage = lead.stage;
    const updated = leads.map(l => l.id === leadId ? { ...l, stage: newStage } : l);
    setLeads(updated);

    const updatedMoves = movesThisWeek + 1;
    setMovesThisWeek(updatedMoves);

    // XP por mover un lead (+10)
    let addedXp = 10;
    let reason = 'Lead avanzado en el pipeline';

    // XP por ganar un cliente (+50)
    if (newStage === 'ganado' && oldStage !== 'ganado') {
      addedXp += 50;
      reason = `🎉 ¡CLIENTE GANADO!: "${lead.name}"`;
    }

    addXp(addedXp, reason);
    saveStateToLocalStorage(updated, criteria, xp + addedXp, updatedMoves);
  };

  // Abrir Cofre
  const handleOpenChest = (type: 'semanal' | 'mensual') => {
    if (type === 'semanal') {
      if (weeklyClaimed) {
        showToast('ℹ️ El cofre semanal ya ha sido reclamado.');
        return;
      }
      if (!isWeeklyReady) {
        showToast('🔒 Realiza 4 movimientos de leads para desbloquear este cofre.');
        return;
      }
      setWeeklyClaimed(true);
      addXp(100, 'Cofre Semanal Reclamado');
      saveStateToLocalStorage(leads, criteria, xp + 100, movesThisWeek, true, monthlyClaimed);
      setChestModalData({
        title: '¡Cofre Semanal Desbloqueado!',
        desc: 'Has completado 4 avances en tu pipeline con constancia ética y sin prisa.',
        reward: '+100 XP',
        icon: '🎁'
      });
      setIsChestModalOpen(true);
    } else {
      if (monthlyClaimed) {
        showToast('ℹ️ El gran cofre mensual ya ha sido reclamado.');
        return;
      }
      if (!isMonthlyReady) {
        showToast('🔒 Lleva al menos 1 lead a "Ganado" para abrir el Gran Cofre.');
        return;
      }
      setMonthlyClaimed(true);
      addXp(250, 'Gran Cofre Mensual Reclamado');
      saveStateToLocalStorage(leads, criteria, xp + 250, movesThisWeek, weeklyClaimed, true);
      setChestModalData({
        title: '👑 ¡Gran Victoria Mensual!',
        desc: '¡Enhorabuena! Has coronado el mes con un acuerdo cerrado y celebrado.',
        reward: '+250 XP',
        icon: '🏆'
      });
      setIsChestModalOpen(true);
    }
  };

  // Crear Insignia Personalizada ("WinS")
  const handleCreateCustomBadge = (e: React.FormEvent) => {
    e.preventDefault();
    const name = (badgeNameInput || 'WinS').trim();
    const condition = (badgeConditionInput || 'Hábito comercial especial').trim();

    const newBadge: CustomBadge = {
      id: 'badge-' + Date.now(),
      name,
      condition,
      date: new Date().toISOString().slice(0, 10)
    };

    const updatedBadges = [...customBadges, newBadge];
    setCustomBadges(updatedBadges);
    addXp(15, `Insignia "${name}" creada`);
    saveStateToLocalStorage(leads, criteria, xp + 15, movesThisWeek, weeklyClaimed, monthlyClaimed, updatedBadges);
    setIsCustomBadgeModalOpen(false);
    showToast(`⭐ ¡Insignia "${name}" desbloqueada! (+15 XP)`);
  };

  // Guardar Formulario Lead
  const handleSaveLead = (e: React.FormEvent) => {
    e.preventDefault();
    const isCompleted = Boolean(formName && formContact && formSector && formZona && Number(formValue) > 0 && formNotes);
    const hasNextAction = Boolean(formNextAction.trim());

    let xpToAdd = 0;

    if (editingLead) {
      // Edición
      if (!editingLead.nextAction && hasNextAction) xpToAdd += 5; // Poner próxima acción (+5)
      if (isCompleted) xpToAdd += 10; // Completar ficha (+10)

      const updated = leads.map(l => l.id === editingLead.id ? {
        ...l,
        name: formName,
        contact: formContact,
        sector: formSector,
        zona: formZona,
        value: Number(formValue) || 0,
        stage: formStage,
        nextAction: formNextAction,
        date: formDate,
        notes: formNotes,
        fulfillment: formFulfillment
      } : l);

      setLeads(updated);
      showToast(`✅ Lead "${formName}" actualizado`);
      if (xpToAdd > 0) addXp(xpToAdd, 'Ficha mejorada con acción');
      saveStateToLocalStorage(updated, criteria, xp + xpToAdd);
    } else {
      // Crear lead (+5)
      xpToAdd += 5;
      if (hasNextAction) xpToAdd += 5;
      if (isCompleted) xpToAdd += 10;

      const newLead: Lead = {
        id: 'lead-' + Date.now(),
        name: formName,
        contact: formContact,
        sector: formSector,
        zona: formZona,
        value: Number(formValue) || 0,
        stage: formStage,
        nextAction: formNextAction,
        date: formDate,
        notes: formNotes,
        fulfillment: formFulfillment
      };

      const updated = [newLead, ...leads];
      setLeads(updated);
      showToast(`⚡ Nuevo lead creado: "${formName}" (+${xpToAdd} XP)`);
      addXp(xpToAdd, 'Nuevo lead registrado');
      saveStateToLocalStorage(updated, criteria, xp + xpToAdd);
    }

    setIsLeadModalOpen(false);
  };

  // Abrir Modal para crear lead
  const openNewLeadModal = () => {
    setEditingLead(null);
    setFormName('');
    setFormContact('');
    setFormSector('');
    setFormZona('');
    setFormValue(45000);
    setFormStage('nuevo');
    setFormNextAction('');
    const d = new Date();
    d.setDate(d.getDate() + 3);
    setFormDate(d.toISOString().slice(0, 10));
    setFormNotes('');
    
    const initialFulfill: Record<string, number> = {};
    criteria.forEach(c => { initialFulfill[c.id] = 0.8; });
    setFormFulfillment(initialFulfill);
    setIsLeadModalOpen(true);
  };

  // Abrir Modal para editar lead
  const openEditLeadModal = (lead: Lead) => {
    setEditingLead(lead);
    setFormName(lead.name);
    setFormContact(lead.contact);
    setFormSector(lead.sector || '');
    setFormZona(lead.zona || '');
    setFormValue(lead.value);
    setFormStage(lead.stage);
    setFormNextAction(lead.nextAction || '');
    setFormDate(lead.date || '');
    setFormNotes(lead.notes || '');
    setFormFulfillment(lead.fulfillment || {});
    setIsLeadModalOpen(true);
  };

  // Eliminar lead
  const handleDeleteLead = (id: string) => {
    const l = leads.find(item => item.id === id);
    if (!l) return;
    if (confirm(`¿Eliminar al lead "${l.name}"?`)) {
      const updated = leads.filter(item => item.id !== id);
      setLeads(updated);
      saveStateToLocalStorage(updated);
      showToast('🗑️ Lead eliminado');
    }
  };

  // Actualizar Peso de Criterio
  const handleWeightChange = (critId: string, val: number) => {
    const updated = criteria.map(c => c.id === critId ? { ...c, peso: val } : c);
    setCriteria(updated);
    saveStateToLocalStorage(leads, updated);
  };

  // Exportar copia en JSON
  const handleExportBackup = () => {
    try {
      const payload = {
        version: '4.0.0',
        exportedAt: new Date().toISOString(),
        leads,
        criteria,
        icpConfig: {
          sector: icpSector,
          tamano: icpTamano,
          zona: icpZona,
          presupuesto: icpPresupuesto,
          problema: icpProblema,
          canal: icpCanal,
          empathy: {
            piensa: empathyPiensa,
            ve: empathyVe,
            dice: empathyDice,
            oye: empathyOye
          }
        },
        gamification: {
          xp,
          movesThisWeek,
          weeklyClaimed,
          monthlyClaimed,
          customBadges
        }
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
      const a = document.createElement('a');
      a.href = dataStr;
      a.download = `crm_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      addXp(10, 'Copia de seguridad guardada');
      showToast('📥 Copia de seguridad exportada con éxito (+10 XP)');
    } catch {
      showToast('❌ Error exportando la copia');
    }
  };

  // Importar copia desde archivo JSON
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data.leads)) setLeads(data.leads);
        if (Array.isArray(data.criteria)) setCriteria(data.criteria);
        if (data.icpConfig) {
          if (data.icpConfig.sector) setIcpSector(data.icpConfig.sector);
          if (data.icpConfig.tamano) setIcpTamano(data.icpConfig.tamano);
          if (data.icpConfig.zona) setIcpZona(data.icpConfig.zona);
          if (data.icpConfig.presupuesto) setIcpPresupuesto(data.icpConfig.presupuesto);
          if (data.icpConfig.problema) setIcpProblema(data.icpConfig.problema);
          if (data.icpConfig.canal) setIcpCanal(data.icpConfig.canal);
          if (data.icpConfig.empathy) {
            if (data.icpConfig.empathy.piensa) setEmpathyPiensa(data.icpConfig.empathy.piensa);
            if (data.icpConfig.empathy.ve) setEmpathyVe(data.icpConfig.empathy.ve);
            if (data.icpConfig.empathy.dice) setEmpathyDice(data.icpConfig.empathy.dice);
            if (data.icpConfig.empathy.oye) setEmpathyOye(data.icpConfig.empathy.oye);
          }
        }
        if (data.gamification) {
          if (typeof data.gamification.xp === 'number') setXp(data.gamification.xp);
          if (typeof data.gamification.movesThisWeek === 'number') setMovesThisWeek(data.gamification.movesThisWeek);
          if (typeof data.gamification.weeklyClaimed === 'boolean') setWeeklyClaimed(data.gamification.weeklyClaimed);
          if (typeof data.gamification.monthlyClaimed === 'boolean') setMonthlyClaimed(data.gamification.monthlyClaimed);
          if (Array.isArray(data.gamification.customBadges)) setCustomBadges(data.gamification.customBadges);
        }
        showToast('✅ Copia de seguridad importada correctamente');
      } catch {
        showToast('❌ Archivo de copia corrupto o formato inválido');
      }
    };
    reader.readAsText(file);
  };

  // Importar análisis IA (previsualizar y confirmar)
  const handlePreviewImportAnalysis = () => {
    try {
      const parsed = JSON.parse(importJsonText.trim());
      if (!parsed.nombre) throw new Error("Falta el campo 'nombre'");

      const dummyLead = { fulfillment: parsed.cumplimiento || {} };
      const score = calculateFitScore(dummyLead);

      setParsedImportLead({
        name: parsed.nombre,
        contact: parsed.contacto || 'Contacto Principal',
        sector: parsed.sector || 'Tecnología B2B',
        zona: parsed.zona || 'España',
        value: Number(parsed.valor_estimado) || 50000,
        stage: parsed.etapa || 'reunion',
        nextAction: parsed.proxima_accion || 'Llamada de seguimiento',
        date: parsed.fecha || new Date().toISOString().slice(0, 10),
        notes: parsed.notas || '',
        fulfillment: parsed.cumplimiento || {},
        fitScore: score
      });
      setImportError(null);
    } catch (err: any) {
      setImportError(err.message || 'JSON inválido');
      setParsedImportLead(null);
    }
  };

  const handleConfirmImportAnalysis = () => {
    if (!parsedImportLead) return;
    const newLead: Lead = {
      id: 'lead-' + Date.now(),
      name: parsedImportLead.name,
      contact: parsedImportLead.contact,
      sector: parsedImportLead.sector,
      zona: parsedImportLead.zona,
      value: parsedImportLead.value,
      stage: parsedImportLead.stage,
      nextAction: parsedImportLead.nextAction,
      date: parsedImportLead.date,
      notes: parsedImportLead.notes,
      fulfillment: parsedImportLead.fulfillment
    };

    const updated = [newLead, ...leads];
    setLeads(updated);
    addXp(15, `Lead "${newLead.name}" analizado e importado`);
    saveStateToLocalStorage(updated, criteria, xp + 15);
    setIsImportModalOpen(false);
    showToast(`✅ Lead "${newLead.name}" importado (${parsedImportLead.fitScore}% parecido con tu cliente ideal)`);
  };

  const formatEuros = (n: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(n || 0);
  };

  // Componente de Estrella SVG dinámica
  const StarIconSvg = ({ size = 32 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="starGradReact" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e2fd0d" />
          <stop offset="50%" stopColor="#d3ec00" />
          <stop offset="100%" stopColor="#00e5ff" />
        </linearGradient>
      </defs>
      <path 
        d="M24 2L29.5 16.5L44 18L32.5 28.5L36 43L24 35.5L12 43L15.5 28.5L4 18L18.5 16.5L24 2Z" 
        fill="url(#starGradReact)" 
        stroke="#d3ec00"
        strokeWidth="1.5"
      />
      <circle cx="24" cy="24" r="5" fill="#051c24" />
      <circle cx="24" cy="24" r="2.5" fill="#d3ec00" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-[#051c24] text-[#f0fdf4] font-['Outfit'] flex flex-col selection:bg-[#d3ec00] selection:text-[#051c24]">
      
      {/* Barra Superior */}
      <header className="sticky top-0 z-40 bg-[#051c24]/90 backdrop-blur-md border-b border-white/10 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#d3ec00] text-[#051c24] font-black text-xl flex items-center justify-center shadow-[0_0_15px_rgba(211,236,0,0.35)]">
            ⚡
          </div>
          <div>
            <div className="text-base font-bold flex items-center gap-2">
              <span>KINETIC SALES PIPELINE</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#00e5ff]/10 text-[#00e5ff] font-semibold">
                ICP & Logros
              </span>
            </div>
            <div className="text-[11px] font-mono text-[#00e5ff] uppercase tracking-wider">
              Comando Comercial con Gamificación Ética
            </div>
          </div>
        </div>

        {/* Navegación entre las 4 pantallas */}
        <nav className="flex items-center gap-1 bg-[#04151b]/80 p-1 rounded-full border border-white/10 text-xs">
          <button
            onClick={() => setActiveTab('tablero')}
            className={`px-3.5 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'tablero'
                ? 'bg-[#d3ec00]/15 text-[#d3ec00] border border-[#d3ec00]/30'
                : 'text-[#7e9ca7] hover:text-[#f0fdf4] hover:bg-white/5'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Tablero</span>
          </button>

          <button
            onClick={() => setActiveTab('icp')}
            className={`px-3.5 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'icp'
                ? 'bg-[#d3ec00]/15 text-[#d3ec00] border border-[#d3ec00]/30'
                : 'text-[#7e9ca7] hover:text-[#f0fdf4] hover:bg-white/5'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Cliente Ideal & Pesos</span>
          </button>

          <button
            onClick={() => setActiveTab('logros')}
            className={`px-3.5 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'logros'
                ? 'bg-[#d3ec00]/15 text-[#d3ec00] border border-[#d3ec00]/30 shadow-[0_0_12px_rgba(211,236,0,0.2)]'
                : 'text-[#7e9ca7] hover:text-[#f0fdf4] hover:bg-white/5'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-[#d3ec00]" />
            <span>Logros</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#d3ec00]/20 text-[#d3ec00]">
              Nvl {currentLevelObj.nivel}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('datos')}
            className={`px-3.5 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'datos'
                ? 'bg-[#d3ec00]/15 text-[#d3ec00] border border-[#d3ec00]/30'
                : 'text-[#7e9ca7] hover:text-[#f0fdf4] hover:bg-white/5'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Datos & Copias</span>
          </button>
        </nav>

        {/* Píldora de XP Rápido */}
        <div 
          onClick={() => setActiveTab('logros')}
          className="flex items-center gap-2 bg-[#d3ec00]/10 border border-[#d3ec00]/30 px-3 py-1 rounded-full cursor-pointer hover:bg-[#d3ec00]/20 transition-transform active:scale-95"
          title="Ver pantalla de logros"
        >
          <Zap className="w-3.5 h-3.5 text-[#d3ec00]" />
          <div>
            <div className="text-[9px] font-mono text-[#7e9ca7] uppercase leading-none">EXP TOTAL</div>
            <div className="text-xs font-bold font-mono text-[#d3ec00] leading-tight">{xp} XP</div>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="flex items-center gap-2.5">
          {/* Interruptor ordenar por encaje */}
          <div 
            onClick={() => setSortByFit(!sortByFit)}
            className="flex items-center gap-2 bg-[#04151b]/80 border border-white/10 px-3 py-1.5 rounded-full cursor-pointer hover:border-[#d3ec00]/40 transition-colors"
            title="Activar/Desactivar ordenación por parecido con el cliente ideal"
          >
            <span className="text-xs font-semibold text-[#cfe6f1]">⚡ Ordenar por encaje</span>
            <div className={`w-9 h-5 rounded-full relative transition-colors ${sortByFit ? 'bg-[#d3ec00]' : 'bg-white/20'}`}>
              <div className={`w-3.5 h-3.5 rounded-full absolute top-[3px] transition-transform ${sortByFit ? 'translate-x-4 bg-[#051c24]' : 'translate-x-1 bg-white'}`} />
            </div>
          </div>

          {/* Botón Importar análisis con IA */}
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="bg-[#00e5ff]/15 hover:bg-[#00e5ff]/25 text-[#00e5ff] border border-[#00e5ff]/40 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Importar análisis</span>
          </button>

          {/* Botón Nuevo Lead */}
          <button 
            onClick={openNewLeadModal}
            className="bg-[#d3ec00] hover:bg-[#e2fd0d] text-[#051c24] text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-[0_0_12px_rgba(211,236,0,0.3)] transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Nuevo Lead</span>
          </button>
        </div>
      </header>

      {/* Sub-barra de métricas rápidas */}
      <div className="bg-[#04151b]/70 border-b border-white/5 px-6 py-2 flex flex-wrap items-center justify-between text-xs text-[#7e9ca7]">
        <div className="flex items-center gap-5">
          <div>Total Cartera: <span className="font-mono font-bold text-[#f0fdf4]">{formatEuros(globalTotalValue)}</span></div>
          <div>Leads: <span className="font-mono font-bold text-[#f0fdf4]">{leads.length}</span></div>
          <div>Encaje Medio: <span className="font-mono font-bold text-[#d3ec00]">{globalAvgFit}%</span></div>
        </div>
        <div className="flex items-center gap-2">
          <span>Rango Actual: </span>
          <span className="font-bold text-[#d3ec00]">Nivel {currentLevelObj.nivel} • {currentLevelObj.titulo}</span>
        </div>
      </div>

      {/* ======================================================================
          PANTALLA 1: TABLERO KANBAN
          ====================================================================== */}
      {activeTab === 'tablero' && (
        <main className="flex-1 overflow-x-auto p-6">
          <div className="grid grid-cols-6 gap-4 min-w-[1920px] items-start">
            {STAGES.map(stage => {
              const stageLeads = columnsData[stage.key] || [];
              const stageSum = stageLeads.reduce((acc, l) => acc + (Number(l.value) || 0), 0);
              const isOver = dragOverStage === stage.key;

              return (
                <div 
                  key={stage.key}
                  className="bg-[#04151b]/80 border border-white/10 rounded-2xl flex flex-col max-h-[calc(100vh-185px)] backdrop-blur-md"
                >
                  {/* Encabezado de Columna */}
                  <div className="p-3.5 border-b border-white/10">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${stage.dotColor}`} />
                        <span className="text-xs font-bold uppercase tracking-wide">{stage.label}</span>
                      </div>
                      <span className="text-[11px] font-mono bg-white/10 text-[#cfe6f1] px-2 py-0.5 rounded-full">
                        {stageLeads.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-mono">
                      <span className="text-[#7e9ca7]">Suma etapa:</span>
                      <span className="font-bold text-[#00e5ff]">{formatEuros(stageSum)}</span>
                    </div>
                  </div>

                  {/* Dropzone de Tarjetas */}
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage.key); }}
                    onDragLeave={() => setDragOverStage(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverStage(null);
                      const id = e.dataTransfer.getData('text/plain') || draggedId;
                      if (id) handleMoveLead(id, stage.key);
                    }}
                    className={`p-3 overflow-y-auto flex flex-col gap-3 min-h-[160px] transition-colors ${
                      isOver ? 'bg-[#d3ec00]/10 border-2 border-dashed border-[#d3ec00] rounded-b-2xl' : ''
                    }`}
                  >
                    {stageLeads.map(lead => {
                      const fit = calculateFitScore(lead);
                      let fitBadgeClass = 'bg-[#00e5ff]/15 text-[#00e5ff] border-[#00e5ff]/30';
                      if (fit >= 85) fitBadgeClass = 'bg-[#d3ec00]/15 text-[#d3ec00] border-[#d3ec00]/40';
                      else if (fit < 60) fitBadgeClass = 'bg-slate-500/15 text-slate-400 border-slate-500/30';

                      return (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={(e) => {
                            setDraggedId(lead.id);
                            e.dataTransfer.setData('text/plain', lead.id);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragEnd={() => setDraggedId(null)}
                          className={`bg-[#0a2732]/75 hover:bg-[#0e3442]/90 border border-white/10 hover:border-[#d3ec00]/30 rounded-xl p-3.5 shadow-lg transition-all cursor-grab active:cursor-grabbing ${
                            draggedId === lead.id ? 'opacity-40 scale-95' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-bold text-sm text-[#f0fdf4] leading-tight">{lead.name}</div>
                              <div className="text-[11px] text-[#7e9ca7] mt-0.5">
                                {lead.contact || 'Sin contacto'} {lead.sector ? `• ${lead.sector}` : ''}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => openEditLeadModal(lead)} 
                                className="p-1 hover:bg-white/10 rounded text-[#7e9ca7] hover:text-[#f0fdf4]"
                                title="Editar ficha"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteLead(lead.id)} 
                                className="p-1 hover:bg-white/10 rounded text-[#7e9ca7] hover:text-red-400"
                                title="Eliminar lead"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex justify-between items-baseline py-1.5 border-b border-white/5 my-1.5">
                            <span className="text-[11px] text-[#7e9ca7]">Valor previsto:</span>
                            <span className="font-mono text-sm font-bold text-[#d3ec00]">{formatEuros(lead.value)}</span>
                          </div>

                          {/* TEXTO EXACTO REQUERIDO: "parecido con tu cliente ideal" */}
                          <div className={`px-2 py-1 rounded text-[11px] font-bold border flex items-center gap-1.5 mb-2.5 ${fitBadgeClass}`}>
                            <span>⚡ {fit}% parecido con tu cliente ideal</span>
                          </div>

                          {lead.nextAction && (
                            <div className="bg-black/30 rounded p-2 text-xs text-[#cfe6f1] mb-2.5 border-l-2 border-[#00e5ff]">
                              <div className="font-medium text-[11px]">
                                <span className="text-[#7e9ca7]">Acción:</span> {lead.nextAction}
                              </div>
                              {lead.date && (
                                <div className="text-[10px] font-mono text-[#7e9ca7] mt-1 flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-[#00e5ff]" />
                                  <span>{lead.date}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Selector "Mover a..." para móviles y accesibilidad */}
                          <div className="flex items-center gap-1.5 pt-1 border-t border-white/5">
                            <span className="text-[10px] text-[#7e9ca7]">Mover:</span>
                            <select
                              value={lead.stage}
                              onChange={(e) => handleMoveLead(lead.id, e.target.value as StageKey)}
                              className="bg-[#04151b] border border-white/10 text-xs rounded px-2 py-1 text-[#cfe6f1] flex-1 outline-none"
                            >
                              {STAGES.map(s => (
                                <option key={s.key} value={s.key}>{s.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      )}

      {/* ======================================================================
          PANTALLA 2: CLIENTE IDEAL (ICP) & MAPA DE EMPATÍA
          ====================================================================== */}
      {activeTab === 'icp' && (
        <div className="flex-1 max-w-5xl mx-auto w-full p-8 space-y-6">
          {/* Formulario del Cliente Ideal */}
          <div className="bg-[#0a2732]/70 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-white/10">
              <div className="text-lg font-bold flex items-center gap-2">
                <Target className="w-5 h-5 text-[#d3ec00]" />
                <span>1. Formulario del Cliente Ideal (ICP)</span>
              </div>
              <button 
                onClick={() => {
                  saveStateToLocalStorage();
                  addXp(10, 'Perfil ICP afinado');
                  showToast('✅ Perfil de Cliente Ideal actualizado (+10 XP)');
                }}
                className="bg-[#d3ec00] text-[#051c24] text-xs font-bold px-4 py-2 rounded-lg"
              >
                Guardar Perfil
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#cfe6f1] font-semibold block mb-1">Sector & Industria</label>
                <input 
                  type="text" 
                  value={icpSector} 
                  onChange={(e) => setIcpSector(e.target.value)}
                  className="w-full bg-[#04151b] border border-white/10 rounded-lg p-2.5 text-xs text-white" 
                />
              </div>
              <div>
                <label className="text-xs text-[#cfe6f1] font-semibold block mb-1">Tamaño & Facturación</label>
                <input 
                  type="text" 
                  value={icpTamano} 
                  onChange={(e) => setIcpTamano(e.target.value)}
                  className="w-full bg-[#04151b] border border-white/10 rounded-lg p-2.5 text-xs text-white" 
                />
              </div>
              <div>
                <label className="text-xs text-[#cfe6f1] font-semibold block mb-1">Zona Geográfica</label>
                <input 
                  type="text" 
                  value={icpZona} 
                  onChange={(e) => setIcpZona(e.target.value)}
                  className="w-full bg-[#04151b] border border-white/10 rounded-lg p-2.5 text-xs text-white" 
                />
              </div>
              <div>
                <label className="text-xs text-[#cfe6f1] font-semibold block mb-1">Presupuesto Estimado</label>
                <input 
                  type="text" 
                  value={icpPresupuesto} 
                  onChange={(e) => setIcpPresupuesto(e.target.value)}
                  className="w-full bg-[#04151b] border border-white/10 rounded-lg p-2.5 text-xs text-white" 
                />
              </div>
              <div>
                <label className="text-xs text-[#cfe6f1] font-semibold block mb-1">Problema Principal que Resuelves</label>
                <input 
                  type="text" 
                  value={icpProblema} 
                  onChange={(e) => setIcpProblema(e.target.value)}
                  className="w-full bg-[#04151b] border border-white/10 rounded-lg p-2.5 text-xs text-white" 
                />
              </div>
              <div>
                <label className="text-xs text-[#cfe6f1] font-semibold block mb-1">Canal por el que Compra</label>
                <input 
                  type="text" 
                  value={icpCanal} 
                  onChange={(e) => setIcpCanal(e.target.value)}
                  className="w-full bg-[#04151b] border border-white/10 rounded-lg p-2.5 text-xs text-white" 
                />
              </div>
            </div>
          </div>

          {/* Mapa de Empatía con 4 cajas */}
          <div className="bg-[#0a2732]/70 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-white/10">
              <div className="text-lg font-bold flex items-center gap-2">
                <Heart className="w-5 h-5 text-[#00e5ff]" />
                <span>2. Mapa de Empatía (4 Perspectivas)</span>
              </div>
              <span className="text-xs text-[#7e9ca7]">¿Qué experimenta tu comprador ideal?</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#04151b]/80 border border-white/10 p-3.5 rounded-xl">
                <div className="text-xs font-bold text-[#00e5ff] mb-1.5 flex items-center gap-1.5">
                  <span>💭 ¿Qué Piensa y Siente?</span>
                </div>
                <textarea 
                  rows={3} 
                  value={empathyPiensa} 
                  onChange={(e) => setEmpathyPiensa(e.target.value)}
                  className="w-full bg-transparent border border-white/10 rounded p-2 text-xs text-white outline-none focus:border-[#00e5ff]"
                />
              </div>

              <div className="bg-[#04151b]/80 border border-white/10 p-3.5 rounded-xl">
                <div className="text-xs font-bold text-[#00e5ff] mb-1.5 flex items-center gap-1.5">
                  <span>👁️ ¿Qué Ve en su Entorno?</span>
                </div>
                <textarea 
                  rows={3} 
                  value={empathyVe} 
                  onChange={(e) => setEmpathyVe(e.target.value)}
                  className="w-full bg-transparent border border-white/10 rounded p-2 text-xs text-white outline-none focus:border-[#00e5ff]"
                />
              </div>

              <div className="bg-[#04151b]/80 border border-white/10 p-3.5 rounded-xl">
                <div className="text-xs font-bold text-[#00e5ff] mb-1.5 flex items-center gap-1.5">
                  <span>🗣️ ¿Qué Dice y Hace?</span>
                </div>
                <textarea 
                  rows={3} 
                  value={empathyDice} 
                  onChange={(e) => setEmpathyDice(e.target.value)}
                  className="w-full bg-transparent border border-white/10 rounded p-2 text-xs text-white outline-none focus:border-[#00e5ff]"
                />
              </div>

              <div className="bg-[#04151b]/80 border border-white/10 p-3.5 rounded-xl">
                <div className="text-xs font-bold text-[#00e5ff] mb-1.5 flex items-center gap-1.5">
                  <span>👂 ¿Qué Oye de Otros?</span>
                </div>
                <textarea 
                  rows={3} 
                  value={empathyOye} 
                  onChange={(e) => setEmpathyOye(e.target.value)}
                  className="w-full bg-transparent border border-white/10 rounded p-2 text-xs text-white outline-none focus:border-[#00e5ff]"
                />
              </div>
            </div>
          </div>

          {/* Deslizadores de PESO (1 a 5) */}
          <div className="bg-[#0a2732]/70 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-white/10">
              <div className="text-lg font-bold flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#d3ec00]" />
                <span>3. Ponderación: Pesos de Criterios (Deslizador 1 a 5)</span>
              </div>
              <span className="text-xs text-[#d3ec00]">Al mover cualquier peso, el parecido se recalcula de inmediato</span>
            </div>

            <div className="space-y-3">
              {criteria.map(crit => (
                <div key={crit.id} className="grid grid-cols-[180px_1fr_60px] items-center gap-4 bg-[#04151b]/60 p-3 rounded-lg border border-white/10">
                  <div>
                    <div className="text-xs font-bold text-[#f0fdf4]">{crit.label}</div>
                    <div className="text-[10px] text-[#7e9ca7]">Importancia relativa</div>
                  </div>
                  <input 
                    type="range" 
                    min={1} 
                    max={5} 
                    step={1} 
                    value={crit.peso}
                    onChange={(e) => handleWeightChange(crit.id, Number(e.target.value))}
                    className="accent-[#d3ec00] cursor-pointer"
                  />
                  <div className="text-right font-mono font-bold text-sm text-[#d3ec00]">
                    P{crit.peso}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          PANTALLA 3: LOGROS (SISTEMA DE GAMIFICACIÓN ÉTICA SOLICITADO)
          ====================================================================== */}
      {activeTab === 'logros' && (
        <div className="flex-1 max-w-6xl mx-auto w-full p-8 space-y-6">
          
          {/* Tarjeta Hero de Nivel y Barra hasta el siguiente */}
          <div className="bg-gradient-to-r from-[#0e3442]/90 to-[#051c24]/95 border border-[#d3ec00]/30 rounded-3xl p-6 md:p-8 shadow-[0_12px_36px_rgba(0,0,0,0.5),0_0_24px_rgba(211,236,0,0.1)] flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#e2fd0d] to-[#a4b800] text-[#051c24] font-black text-2xl flex items-center justify-center shadow-[0_0_25px_rgba(211,236,0,0.6)] font-mono shrink-0">
                {currentLevelObj.nivel}
              </div>
              <div>
                <div className="text-[10px] font-mono text-[#d3ec00] uppercase tracking-widest">NIVEL ACTUAL</div>
                <div className="text-2xl font-black text-white tracking-tight">{currentLevelObj.titulo}</div>
                <div className="text-xs text-[#7e9ca7] mt-1">{currentLevelObj.desc}</div>
              </div>
            </div>

            <div className="flex-1 min-w-[280px]">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-[#7e9ca7]">Progreso hacia el siguiente nivel</span>
                <span className="font-mono font-bold text-[#d3ec00]">{xp} / {nextLevelObj.xpMin} XP</span>
              </div>
              <div className="h-3 bg-black/40 rounded-full overflow-hidden border border-white/10">
                <div 
                  className="h-full bg-gradient-to-r from-[#00e5ff] to-[#d3ec00] rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(211,236,0,0.5)]"
                  style={{ width: `${levelProgressPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-[#7e9ca7] mt-1.5">
                <span>Nvl {currentLevelObj.nivel}</span>
                <span>{levelProgressPct}% completado</span>
                <span>Nvl {nextLevelObj.nivel}</span>
              </div>
            </div>
          </div>

          {/* 1. XP por buenos hábitos */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-[#0a2732]/60 border border-white/10 rounded-xl p-3 flex justify-between items-center">
              <span className="text-xs font-semibold text-[#cfe6f1]">Crear Lead</span>
              <span className="text-xs font-mono font-bold text-[#d3ec00] bg-[#d3ec00]/15 px-2 py-0.5 rounded">+5 XP</span>
            </div>
            <div className="bg-[#0a2732]/60 border border-white/10 rounded-xl p-3 flex justify-between items-center">
              <span className="text-xs font-semibold text-[#cfe6f1]">Completar Ficha</span>
              <span className="text-xs font-mono font-bold text-[#d3ec00] bg-[#d3ec00]/15 px-2 py-0.5 rounded">+10 XP</span>
            </div>
            <div className="bg-[#0a2732]/60 border border-white/10 rounded-xl p-3 flex justify-between items-center">
              <span className="text-xs font-semibold text-[#cfe6f1]">Poner Próxima Acción</span>
              <span className="text-xs font-mono font-bold text-[#d3ec00] bg-[#d3ec00]/15 px-2 py-0.5 rounded">+5 XP</span>
            </div>
            <div className="bg-[#0a2732]/60 border border-white/10 rounded-xl p-3 flex justify-between items-center">
              <span className="text-xs font-semibold text-[#cfe6f1]">Mover un Lead</span>
              <span className="text-xs font-mono font-bold text-[#d3ec00] bg-[#d3ec00]/15 px-2 py-0.5 rounded">+10 XP</span>
            </div>
            <div className="bg-[#0a2732]/60 border border-[#d3ec00]/40 rounded-xl p-3 flex justify-between items-center col-span-2 md:col-span-1">
              <span className="text-xs font-bold text-[#d3ec00]">Ganar un Cliente 🎉</span>
              <span className="text-xs font-mono font-bold text-[#051c24] bg-[#d3ec00] px-2 py-0.5 rounded shadow-[0_0_10px_rgba(211,236,0,0.4)]">+50 XP</span>
            </div>
          </div>

          {/* Insignias de 3 niveles & Retos con Cofre */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Panel 1: Insignias Progresivas (3 niveles con gradiente de opacidad en verde lima) */}
            <div className="bg-[#0a2732]/70 border border-white/10 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center pb-3 mb-4 border-b border-white/10">
                  <div className="text-base font-bold flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#d3ec00]" />
                    <span>Insignias Progresivas (3 Niveles en Verde Lima)</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#d3ec00]">Opacidad Gradual</span>
                </div>

                {/* Insignia: Organizado */}
                <div className="bg-[#04151b]/60 border border-white/10 rounded-xl p-4 mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <div className="font-bold text-sm text-[#f0fdf4] flex items-center gap-1.5">
                      <span>📋 Organizado</span>
                    </div>
                    <span className="text-xs font-mono text-[#00e5ff]">{leadsWithNextActionCount} leads con acción</span>
                  </div>
                  <div className="text-[11px] text-[#7e9ca7] mb-3">Leads con próxima acción y fecha definida.</div>
                  
                  {/* 3 niveles con opacidad gradual */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* Nivel 1: suave (35% opacidad) */}
                    <div className={`p-3 rounded-lg text-center border transition-all ${
                      leadsWithNextActionCount >= 3 
                        ? 'border-[#d3ec00]/35 bg-[#d3ec00]/10 text-[#d3ec00]/60' 
                        : 'border-white/5 bg-black/20 text-[#7e9ca7]/40 grayscale'
                    }`}>
                      <Calendar className="w-6 h-6 mx-auto mb-1" />
                      <div className="text-xs font-bold text-white">Nivel 1</div>
                      <div className="text-[10px] font-mono text-[#7e9ca7]">3 leads</div>
                    </div>

                    {/* Nivel 2: medio (70% opacidad) */}
                    <div className={`p-3 rounded-lg text-center border transition-all ${
                      leadsWithNextActionCount >= 7 
                        ? 'border-[#d3ec00]/70 bg-[#d3ec00]/20 text-[#d3ec00] shadow-[0_0_12px_rgba(211,236,0,0.2)]' 
                        : 'border-white/5 bg-black/20 text-[#7e9ca7]/40 grayscale'
                    }`}>
                      <Zap className="w-6 h-6 mx-auto mb-1" />
                      <div className="text-xs font-bold text-white">Nivel 2</div>
                      <div className="text-[10px] font-mono text-[#7e9ca7]">7 leads</div>
                    </div>

                    {/* Nivel 3: 100% brillante resplandor */}
                    <div className={`p-3 rounded-lg text-center border transition-all ${
                      leadsWithNextActionCount >= 12 
                        ? 'border-[#d3ec00] bg-[#d3ec00]/30 text-[#d3ec00] shadow-[0_0_18px_rgba(211,236,0,0.5)]' 
                        : 'border-white/5 bg-black/20 text-[#7e9ca7]/40 grayscale'
                    }`}>
                      <Trophy className="w-6 h-6 mx-auto mb-1 text-[#d3ec00]" />
                      <div className="text-xs font-bold text-white">Nivel 3</div>
                      <div className="text-[10px] font-mono text-[#7e9ca7]">12 leads</div>
                    </div>
                  </div>
                </div>

                {/* Insignia: Constante */}
                <div className="bg-[#04151b]/60 border border-white/10 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-1">
                    <div className="font-bold text-sm text-[#f0fdf4] flex items-center gap-1.5">
                      <span>🚀 Constante</span>
                    </div>
                    <span className="text-xs font-mono text-[#00e5ff]">{movesThisWeek} movimientos esta semana</span>
                  </div>
                  <div className="text-[11px] text-[#7e9ca7] mb-3">Movimientos de pipeline realizados durante esta semana.</div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* Nivel 1: suave */}
                    <div className={`p-3 rounded-lg text-center border transition-all ${
                      movesThisWeek >= 3 
                        ? 'border-[#d3ec00]/35 bg-[#d3ec00]/10 text-[#d3ec00]/60' 
                        : 'border-white/5 bg-black/20 text-[#7e9ca7]/40 grayscale'
                    }`}>
                      <Sparkles className="w-6 h-6 mx-auto mb-1" />
                      <div className="text-xs font-bold text-white">Nivel 1</div>
                      <div className="text-[10px] font-mono text-[#7e9ca7]">3 avances</div>
                    </div>

                    {/* Nivel 2: medio */}
                    <div className={`p-3 rounded-lg text-center border transition-all ${
                      movesThisWeek >= 8 
                        ? 'border-[#d3ec00]/70 bg-[#d3ec00]/20 text-[#d3ec00] shadow-[0_0_12px_rgba(211,236,0,0.2)]' 
                        : 'border-white/5 bg-black/20 text-[#7e9ca7]/40 grayscale'
                    }`}>
                      <Star className="w-6 h-6 mx-auto mb-1" />
                      <div className="text-xs font-bold text-white">Nivel 2</div>
                      <div className="text-[10px] font-mono text-[#7e9ca7]">8 avances</div>
                    </div>

                    {/* Nivel 3: pleno resplandor */}
                    <div className={`p-3 rounded-lg text-center border transition-all ${
                      movesThisWeek >= 15 
                        ? 'border-[#d3ec00] bg-[#d3ec00]/30 text-[#d3ec00] shadow-[0_0_18px_rgba(211,236,0,0.5)]' 
                        : 'border-white/5 bg-black/20 text-[#7e9ca7]/40 grayscale'
                    }`}>
                      <Award className="w-6 h-6 mx-auto mb-1 text-[#d3ec00]" />
                      <div className="text-xs font-bold text-white">Nivel 3</div>
                      <div className="text-[10px] font-mono text-[#7e9ca7]">15 avances</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón "Crear mi insignia" */}
              <div className="mt-5">
                <button
                  onClick={() => setIsCustomBadgeModalOpen(true)}
                  className="w-full bg-[#d3ec00] hover:bg-[#e2fd0d] text-[#051c24] font-bold py-2.5 rounded-xl shadow-[0_0_16px_rgba(211,236,0,0.3)] flex items-center justify-center gap-2 transition-all"
                >
                  <Star className="w-4 h-4 fill-current" />
                  <span>Crear mi insignia ("WinS")</span>
                </button>
              </div>
            </div>

            {/* Panel 2: Reto Semanal y Reto Mensual con Cofre */}
            <div className="bg-[#0a2732]/70 border border-white/10 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center pb-3 mb-4 border-b border-white/10">
                  <div className="text-base font-bold flex items-center gap-2">
                    <Gift className="w-5 h-5 text-[#00e5ff]" />
                    <span>Retos con Cofre de Recompensas</span>
                  </div>
                  <span className="text-[11px] text-[#00e5ff]">Sin estrés ni cuentas atrás</span>
                </div>

                {/* Reto Semanal */}
                <div className="bg-[#04151b]/60 border border-white/10 rounded-xl p-4 mb-4 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#00e5ff]/15 text-[#00e5ff] inline-block mb-1.5">
                      Reto Semanal
                    </span>
                    <div className="font-bold text-sm text-white">Foco y Continuidad de Pipeline</div>
                    <div className="text-[11px] text-[#7e9ca7] mb-2.5">Realiza 4 movimientos de leads esta semana.</div>
                    
                    <div className="flex justify-between text-[11px] font-mono mb-1">
                      <span>Progreso:</span>
                      <span className="text-[#00e5ff] font-bold">{weeklyProgress} / {weeklyGoal}</span>
                    </div>
                    <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#00e5ff] rounded-full transition-all"
                        style={{ width: `${(weeklyProgress / weeklyGoal) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Cofre Semanal */}
                  <div 
                    onClick={() => handleOpenChest('semanal')}
                    className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl border transition-all ${
                      weeklyClaimed
                        ? 'bg-[#0e3442]/50 border-white/10 opacity-70'
                        : isWeeklyReady
                        ? 'bg-[#d3ec00]/25 border-[#d3ec00] animate-bounce shadow-[0_0_20px_rgba(211,236,0,0.5)]'
                        : 'bg-black/30 border-white/10 text-slate-500'
                    }`}>
                      {weeklyClaimed ? '✨' : isWeeklyReady ? '🎁' : <Lock className="w-5 h-5 text-slate-500" />}
                    </div>
                    <span className={`text-[10px] font-mono font-bold ${
                      weeklyClaimed ? 'text-[#7e9ca7]' : isWeeklyReady ? 'text-[#d3ec00]' : 'text-[#7e9ca7]'
                    }`}>
                      {weeklyClaimed ? 'Reclamado' : isWeeklyReady ? '¡Abrir (+100 XP)!' : 'En curso'}
                    </span>
                  </div>
                </div>

                {/* Reto Mensual */}
                <div className="bg-[#04151b]/60 border border-white/10 rounded-xl p-4 mb-4 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#d3ec00]/15 text-[#d3ec00] inline-block mb-1.5">
                      Reto Mensual
                    </span>
                    <div className="font-bold text-sm text-white">Victoria Comercial de Alto Nivel</div>
                    <div className="text-[11px] text-[#7e9ca7] mb-2.5">Lleva al menos 1 lead a la columna "Ganado".</div>
                    
                    <div className="flex justify-between text-[11px] font-mono mb-1">
                      <span>Progreso:</span>
                      <span className="text-[#d3ec00] font-bold">{ganadoCount} / 1 ganado</span>
                    </div>
                    <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#d3ec00] rounded-full transition-all"
                        style={{ width: `${Math.min(100, ganadoCount * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Cofre Mensual */}
                  <div 
                    onClick={() => handleOpenChest('mensual')}
                    className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl border transition-all ${
                      monthlyClaimed
                        ? 'bg-[#0e3442]/50 border-white/10 opacity-70'
                        : isMonthlyReady
                        ? 'bg-[#d3ec00]/25 border-[#d3ec00] animate-bounce shadow-[0_0_20px_rgba(211,236,0,0.5)]'
                        : 'bg-black/30 border-white/10 text-slate-500'
                    }`}>
                      {monthlyClaimed ? '🏆' : isMonthlyReady ? '👑' : <Lock className="w-5 h-5 text-slate-500" />}
                    </div>
                    <span className={`text-[10px] font-mono font-bold ${
                      monthlyClaimed ? 'text-[#7e9ca7]' : isMonthlyReady ? 'text-[#d3ec00]' : 'text-[#7e9ca7]'
                    }`}>
                      {monthlyClaimed ? 'Reclamado' : isMonthlyReady ? '¡Abrir (+250 XP)!' : 'En curso'}
                    </span>
                  </div>
                </div>

                {/* Mis Insignias Personalizadas */}
                <div>
                  <div className="text-xs font-bold text-[#cfe6f1] mb-2 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-[#d3ec00]" />
                    <span>Mis Insignias Personalizadas ("WinS")</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                    {customBadges.map(b => (
                      <div key={b.id} className="bg-[#04151b] border border-[#d3ec00]/30 rounded-lg p-2.5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#d3ec00]/15 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(211,236,0,0.2)]">
                          <StarIconSvg size={24} />
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-xs font-bold text-[#d3ec00] truncate">{b.name}</div>
                          <div className="text-[10px] text-[#7e9ca7] line-clamp-1">{b.condition}</div>
                          <div className="text-[9px] font-mono text-[#00e5ff]">{b.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* 6. REGLAS ÉTICAS (SIN CASTIGOS, SIN PENALIZACIONES, SIN RANKINGS) */}
          <div className="bg-gradient-to-r from-[#07212b]/80 to-[#04151b]/90 border border-[#00e5ff]/25 rounded-2xl p-6">
            <div className="flex items-center gap-2 text-sm font-bold text-[#00e5ff] mb-3">
              <ShieldCheck className="w-4 h-4 text-[#00e5ff]" />
              <span>Principios Éticos de Gamificación Saludable & Respeto Humano</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="text-xl">🛡️</span>
                <div>
                  <div className="font-bold text-white mb-0.5">Sin castigos por no entrar</div>
                  <div className="text-[#7e9ca7] leading-relaxed">Tu progreso, XP y nivel se conservan íntegros. Descansas sin penalizaciones.</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-xl">🌿</span>
                <div>
                  <div className="font-bold text-white mb-0.5">Sin rachas que penalicen</div>
                  <div className="text-[#7e9ca7] leading-relaxed">Cero ansiedad de "streaks rotos". Los buenos hábitos florecen a tu ritmo.</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-xl">🕊️</span>
                <div>
                  <div className="font-bold text-white mb-0.5">Sin cuentas atrás hostiles</div>
                  <div className="text-[#7e9ca7] leading-relaxed">Retos para enfocar tu energía sin temporizadores de estrés artificial.</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-xl">🔒</span>
                <div>
                  <div className="font-bold text-white mb-0.5">Sin rankings públicos</div>
                  <div className="text-[#7e9ca7] leading-relaxed">Un espacio privado de maestría y serenidad. Compites solo contigo mismo.</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ======================================================================
          PANTALLA 4: DATOS, COPIAS & IMPORTAR ANÁLISIS
          ====================================================================== */}
      {activeTab === 'datos' && (
        <div className="flex-1 max-w-4xl mx-auto w-full p-8 space-y-6">
          <div className="bg-[#0a2732]/70 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <div className="text-lg font-bold flex items-center gap-2 mb-2">
              <Database className="w-5 h-5 text-[#d3ec00]" />
              <span>Copias de Seguridad & Portabilidad</span>
            </div>
            <p className="text-xs text-[#cfe6f1] mb-5 leading-relaxed">
              Exporta un archivo JSON con todos tus leads, puntuaciones ponderadas de cliente ideal, nivel de XP e insignias. Puedes restaurarlo en cualquier navegador al instante.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleExportBackup}
                className="bg-[#d3ec00] text-[#051c24] text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-[0_0_12px_rgba(211,236,0,0.3)]"
              >
                <Download className="w-4 h-4" />
                <span>Exportar copia (.json)</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#0e3442] hover:bg-[#0e3442]/90 border border-white/10 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2"
              >
                <Upload className="w-4 h-4 text-[#00e5ff]" />
                <span>Importar copia (.json)</span>
              </button>
              <input 
                ref={fileInputRef} 
                type="file" 
                accept=".json" 
                onChange={handleImportFile} 
                className="hidden" 
              />

              <a
                href="/crm.html"
                download="crm.html"
                className="bg-[#00e5ff]/15 hover:bg-[#00e5ff]/25 border border-[#00e5ff]/40 text-[#00e5ff] text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>Descargar crm.html Standalone</span>
              </a>
            </div>
          </div>

          <div className="bg-[#0a2732]/70 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex justify-between items-center mb-3">
              <div className="text-base font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#00e5ff]" />
                <span>Prompt para Análisis de Cliente con IA</span>
              </div>
              <button
                onClick={() => {
                  const promptTxt = `"Analiza este cliente potencial: [DESCRIPCIÓN FICTICIA]. Devuélveme SOLO un JSON con: nombre, sector, zona, valor_estimado, notas y, para cada criterio de mi cliente ideal, un cumplimiento entre 0 y 1."`;
                  navigator.clipboard.writeText(promptTxt);
                  showToast('📋 Prompt copiado al portapapeles');
                }}
                className="text-xs text-[#00e5ff] hover:underline flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Prompt</span>
              </button>
            </div>

            <div className="bg-[#04151b] p-3 rounded-lg border border-white/10 font-mono text-xs text-[#cfe6f1] leading-relaxed mb-4">
              "Analiza este cliente potencial: [DESCRIPCIÓN FICTICIA]. Devuélveme SOLO un JSON con: nombre, sector, zona, valor_estimado, notas y, para cada criterio de mi cliente ideal, un cumplimiento entre 0 y 1."
            </div>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="bg-[#0e3442] text-[#f0fdf4] text-xs font-semibold px-4 py-2 rounded-lg border border-white/10"
            >
              Abrir importador de JSON
            </button>
          </div>
        </div>
      )}

      {/* ======================================================================
          MODAL 1: NUEVO / EDITAR LEAD
          ====================================================================== */}
      {isLeadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#07212b] border border-[#d3ec00]/30 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-white/10">
              <div className="text-base font-bold text-white">
                {editingLead ? 'Editar Ficha del Lead' : 'Nuevo Lead Comercial'}
              </div>
              <button 
                onClick={() => setIsLeadModalOpen(false)}
                className="text-[#7e9ca7] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLead} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#cfe6f1] block mb-1">Nombre de la Empresa o Lead *</label>
                <input 
                  type="text" 
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Apex Logistics AI"
                  className="w-full bg-[#04151b] border border-white/10 rounded-lg p-2.5 text-xs text-white" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#cfe6f1] block mb-1">Contacto Principal</label>
                  <input 
                    type="text" 
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    placeholder="Ej: Laura Sanz (VP)"
                    className="w-full bg-[#04151b] border border-white/10 rounded-lg p-2.5 text-xs text-white" 
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#cfe6f1] block mb-1">Valor en Euros (€) *</label>
                  <input 
                    type="number" 
                    required
                    min={0}
                    step={500}
                    value={formValue}
                    onChange={(e) => setFormValue(Number(e.target.value) || '')}
                    className="w-full bg-[#04151b] border border-white/10 rounded-lg p-2.5 text-xs text-white" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#cfe6f1] block mb-1">Sector</label>
                  <input 
                    type="text" 
                    value={formSector}
                    onChange={(e) => setFormSector(e.target.value)}
                    placeholder="Ej: Cloud Security"
                    className="w-full bg-[#04151b] border border-white/10 rounded-lg p-2.5 text-xs text-white" 
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#cfe6f1] block mb-1">Zona Geográfica</label>
                  <input 
                    type="text" 
                    value={formZona}
                    onChange={(e) => setFormZona(e.target.value)}
                    placeholder="Ej: Madrid, España"
                    className="w-full bg-[#04151b] border border-white/10 rounded-lg p-2.5 text-xs text-white" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#cfe6f1] block mb-1">Etapa Inicial</label>
                  <select 
                    value={formStage}
                    onChange={(e) => setFormStage(e.target.value as StageKey)}
                    className="w-full bg-[#04151b] border border-white/10 rounded-lg p-2.5 text-xs text-white"
                  >
                    {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#cfe6f1] block mb-1">Fecha Límite</label>
                  <input 
                    type="date" 
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-[#04151b] border border-white/10 rounded-lg p-2.5 text-xs text-white" 
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#cfe6f1] block mb-1">Próxima Acción Concreta</label>
                <input 
                  type="text" 
                  value={formNextAction}
                  onChange={(e) => setFormNextAction(e.target.value)}
                  placeholder="Ej: Presentar caso de éxito similar y fijar demo técnica"
                  className="w-full bg-[#04151b] border border-white/10 rounded-lg p-2.5 text-xs text-white" 
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#cfe6f1] block mb-1">Notas Comerciales</label>
                <textarea 
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Detalles clave, urgencias y decisores..."
                  className="w-full bg-[#04151b] border border-white/10 rounded-lg p-2.5 text-xs text-white" 
                />
              </div>

              {/* Cumplimiento por criterio (0.00 a 1.00) */}
              <div className="pt-3 border-t border-white/10">
                <div className="flex justify-between items-baseline mb-3">
                  <span className="text-xs font-bold text-[#d3ec00]">Cumplimiento por Criterio (0 a 100%)</span>
                  <span className="text-xs font-mono font-bold text-[#d3ec00]">
                    ⚡ {calculateFitScore({ fulfillment: formFulfillment })}% parecido con tu cliente ideal
                  </span>
                </div>

                <div className="space-y-2">
                  {criteria.map(crit => {
                    const val = formFulfillment[crit.id] !== undefined ? formFulfillment[crit.id] : 0.8;
                    return (
                      <div key={crit.id} className="grid grid-cols-[140px_1fr_50px] items-center gap-3 bg-[#04151b]/80 p-2 rounded border border-white/5">
                        <div className="text-[11px] font-semibold text-white">{crit.label}</div>
                        <input 
                          type="range"
                          min={0}
                          max={1}
                          step={0.05}
                          value={val}
                          onChange={(e) => {
                            const newV = Number(e.target.value);
                            setFormFulfillment(prev => ({ ...prev, [crit.id]: newV }));
                          }}
                          className="accent-[#d3ec00] cursor-pointer"
                        />
                        <div className="text-right text-[11px] font-mono text-[#00e5ff] font-bold">
                          {(val * 100).toFixed(0)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button 
                  type="button" 
                  onClick={() => setIsLeadModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-[#7e9ca7] hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-[#d3ec00] text-[#051c24] shadow-[0_0_12px_rgba(211,236,0,0.3)]"
                >
                  Guardar Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================
          MODAL 2: CREAR MI INSIGNIA ("WinS" CON ESTRELLA AUTO-GENERADA)
          ====================================================================== */}
      {isCustomBadgeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#07212b] border border-[#d3ec00]/40 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-white/10">
              <div className="text-base font-bold text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-[#d3ec00] fill-current" />
                <span>⭐ Crear Mi Insignia Personalizada</span>
              </div>
              <button 
                onClick={() => setIsCustomBadgeModalOpen(false)}
                className="text-[#7e9ca7] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomBadge} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#cfe6f1] block mb-1">
                  Nombre de la Insignia (Predeterminado "WinS")
                </label>
                <input 
                  type="text" 
                  required
                  value={badgeNameInput}
                  onChange={(e) => setBadgeNameInput(e.target.value)}
                  className="w-full bg-[#04151b] border border-white/10 rounded-lg p-2.5 text-xs text-white" 
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#cfe6f1] block mb-1">
                  Condición Sencilla del Logro
                </label>
                <input 
                  type="text" 
                  required
                  value={badgeConditionInput}
                  onChange={(e) => setBadgeConditionInput(e.target.value)}
                  placeholder="Ej: Cerrar llamada de seguimiento en menos de 2h"
                  className="w-full bg-[#04151b] border border-white/10 rounded-lg p-2.5 text-xs text-white" 
                />
              </div>

              {/* Previsualización del icono de estrella auto-generado */}
              <div className="bg-[#04151b] border border-[#d3ec00]/30 rounded-xl p-4 text-center">
                <div className="text-[11px] text-[#7e9ca7] mb-2">
                  Icono Generado Automáticamente con Forma de Estrella:
                </div>
                <div className="flex justify-center mb-1">
                  <StarIconSvg size={54} />
                </div>
                <div className="text-sm font-bold text-[#d3ec00]">{badgeNameInput || 'WinS'}</div>
                <div className="text-[10px] text-[#00e5ff] font-mono mt-0.5">Insignia Estelar de Reconocimiento</div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsCustomBadgeModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-[#7e9ca7]"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-[#d3ec00] text-[#051c24] shadow-[0_0_12px_rgba(211,236,0,0.3)]"
                >
                  Desbloquear Insignia (+15 XP)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================
          MODAL 3: CELEBRACIÓN DE COFRE
          ====================================================================== */}
      {isChestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#07212b] border border-[#d3ec00] rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl">
            <div className="text-5xl mb-3 animate-bounce">
              {chestModalData.icon}
            </div>
            <div className="text-xl font-black text-[#d3ec00] mb-1">
              {chestModalData.title}
            </div>
            <p className="text-xs text-[#cfe6f1] leading-relaxed mb-4">
              {chestModalData.desc}
            </p>
            <div className="inline-block bg-[#d3ec00]/15 border border-[#d3ec00] text-[#d3ec00] font-mono font-bold text-base px-4 py-1.5 rounded-full mb-5">
              {chestModalData.reward}
            </div>
            <div>
              <button 
                onClick={() => setIsChestModalOpen(false)}
                className="w-full bg-[#d3ec00] text-[#051c24] text-xs font-bold py-2.5 rounded-lg"
              >
                ¡Fantástico! Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          MODAL 4: IMPORTAR ANÁLISIS DE IA
          ====================================================================== */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#07212b] border border-[#00e5ff]/40 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-white/10">
              <div className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#00e5ff]" />
                <span>Importar Análisis de Lead con IA</span>
              </div>
              <button 
                onClick={() => setIsImportModalOpen(false)}
                className="text-[#7e9ca7] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#7e9ca7] mb-3">
              Pega a continuación el JSON devuelto por tu modelo de IA:
            </p>

            <textarea 
              rows={5}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder="Pega el JSON aquí..."
              className="w-full bg-[#04151b] border border-white/10 rounded-lg p-3 text-xs font-mono text-white mb-3"
            />

            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => {
                  const demo = {
                    nombre: "Apex CyberDefenders Ibérica",
                    contacto: "Alfonso Prieto (Director TI)",
                    sector: "Ciberseguridad Enterprise",
                    zona: "Madrid, España",
                    valor_estimado: 64000,
                    etapa: "reunion",
                    proxima_accion: "Revisar arquitectura de red y conector SIEM",
                    fecha: "2026-11-15",
                    notas: "Empresa de 250 empleados con urgencia alta por auditoría de seguridad bancaria.",
                    cumplimiento: {
                      sector: 0.95,
                      tamano: 0.85,
                      zona: 1.0,
                      problema: 0.95,
                      presupuesto: 0.9,
                      canal: 0.8,
                      empatia: 0.9
                    }
                  };
                  setImportJsonText(JSON.stringify(demo, null, 2));
                }}
                className="text-xs font-semibold px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-[#cfe6f1]"
              >
                Cargar JSON de Ejemplo
              </button>
              <button
                type="button"
                onClick={handlePreviewImportAnalysis}
                className="text-xs font-semibold px-3 py-1.5 rounded bg-[#00e5ff]/20 text-[#00e5ff] hover:bg-[#00e5ff]/30"
              >
                Previsualizar
              </button>
            </div>

            {importError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs p-2.5 rounded mb-3">
                {importError}
              </div>
            )}

            {parsedImportLead && (
              <div className="bg-[#04151b] border border-[#d3ec00]/30 rounded-xl p-3.5 text-xs space-y-1.5 mb-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">{parsedImportLead.name}</span>
                  <span className="text-[11px] font-bold text-[#d3ec00]">
                    ⚡ {parsedImportLead.fitScore}% parecido con tu cliente ideal
                  </span>
                </div>
                <div className="text-[#7e9ca7]">
                  Valor: {formatEuros(parsedImportLead.value)} • Etapa: {parsedImportLead.stage}
                </div>
                <div className="text-[#00e5ff]">
                  Acción: {parsedImportLead.nextAction}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-[#7e9ca7]"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                disabled={!parsedImportLead}
                onClick={handleConfirmImportAnalysis}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-[#d3ec00] disabled:opacity-40 text-[#051c24]"
              >
                Confirmar e Incorporar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notificación Breve (REGLA 5) */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0e3442] border border-[#d3ec00] text-white px-4 py-3 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(211,236,0,0.3)] text-xs font-bold flex items-center gap-2.5 animate-bounce">
          <PartyPopper className="w-4 h-4 text-[#d3ec00]" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
