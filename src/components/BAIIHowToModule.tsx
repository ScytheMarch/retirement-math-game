import React, { useMemo, useState, useEffect, createContext, useContext } from "react";
import { Copy } from "lucide-react";
import { formatCurrency, formatPercent3, parseCurrencyToNumber, parsePercentToDecimal, formatIntegerWithCommas, parseInteger } from "@/utils/formatters";

/**
 * BA II Plus How‑To (AM • CPM • PPPM)
 * Now includes optional ad slots so you can monetize the page.
 *
 * Pass your AdSense client (e.g., "ca-pub-XXXXXXXXXXXXXXX") and slot IDs.
 * Nothing breaks if you leave them blank—"house" cards will show instead.
 */

export type Scenario = {
  salary: number;           // current salary
  wrrPct: number;           // work replacement rate (e.g., 0.75)
  ssPension: number;        // Social Security or pension today
  yearsToRetire: number;    // years until retirement
  yearsInRetirement: number;// retirement length
  nominalRet: number;       // nominal return during retirement (e.g., 0.08)
  inflation: number;        // inflation (e.g., 0.03)
};

// Ads removed

// Utility formatters
const currency = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
const pct = (r: number, digits = 6) => `${(r * 100).toFixed(digits)}%`;
const numberFmt = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const numberFmt0 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

// Finance helpers
function pvAnnuityDue(pmt: number, r: number, n: number) {
  if (Math.abs(r) < 1e-9) return pmt * n; // nearly zero real rate
  return pmt * ((1 - Math.pow(1 + r, -n)) / r) * (1 + r); // due = ordinary * (1+r)
}

function computeScenario(s: Scenario) {
  const shortfallToday = s.salary * s.wrrPct - s.ssPension; // can be negative (surplus)
  const firstYearNeed = shortfallToday * Math.pow(1 + s.inflation, s.yearsToRetire);
  const rReal = (1 + s.nominalRet) / (1 + s.inflation) - 1;

  const pvAM = pvAnnuityDue(firstYearNeed, rReal, s.yearsInRetirement);

  // CPM: preserve same nominal dollars as pvAM at end of retirement
  const keepCPM = pvAM / Math.pow(1 + s.nominalRet, s.yearsInRetirement);
  const totalCPM = pvAM + keepCPM;

  // PPPM: preserve same purchasing power as pvAM at end (real terms)
  const keepPPPM = pvAM / Math.pow(1 + rReal, s.yearsInRetirement);
  const totalPPPM = pvAM + keepPPPM;

  return { shortfallToday, firstYearNeed, rReal, pvAM, keepCPM, totalCPM, keepPPPM, totalPPPM };
}

// Ad component was removed

// Plain Tailwind elements to replace shadcn/ui components
type DivProps = React.HTMLAttributes<HTMLDivElement>;
function Card({ className = "", ...props }: DivProps) {
  return <div className={`card ${className}`} {...props} />;
}
function CardContent({ className = "", ...props }: DivProps) {
  return <div className={`card-content ${className}`} {...props} />;
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string };
function Button({ className = "", children, ...props }: ButtonProps) {
    return (
    <button type="button" className={`btn ${className}`} {...props}>
      {children}
    </button>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;
function Input({ className = "", ...props }: InputProps) {
  return <input className={`input ${className}`} {...props} />;
}

// Minimal Tabs implementation
type TabsContextType = { value: string; setValue: (v: string) => void };
const TabsContext = createContext<TabsContextType | null>(null);

function Tabs({ defaultValue, className = "", children }: { defaultValue: string; className?: string; children: React.ReactNode }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}
function TabsList({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`tabs-list ${className}`}>{children}</div>;
}
function TabsTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = useContext(TabsContext);
  const isActive = ctx?.value === value;
  const base = "inline-flex items-center px-3 py-1.5 text-sm rounded-full transition-colors";
  return (
    <button
      type="button"
      onClick={() => ctx?.setValue(value)}
      className={`tabs-trigger ${base} ${isActive ? "bg-white text-gray-900 shadow" : "text-white/80 hover:text-white"}`}
      data-active={isActive ? "true" : "false"}
    >
      {children}
    </button>
  );
}
function TabsContent({ value, className = "", children }: { value: string; className?: string; children: React.ReactNode }) {
  const ctx = useContext(TabsContext);
  if (ctx?.value !== value) return null;
  return <div className={className}>{children}</div>;
}

function KeystrokesBox({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative border border-neutral-700 rounded-2xl p-4 text-sm font-mono bg-neutral-800 text-black shadow-sm">
      <pre className="whitespace-pre-wrap leading-6">{text}</pre>
      <Button
        variant="ghost"
        className="absolute top-2 right-2 h-8 w-8 p-0 rounded-xl text-white/80 hover:text-white"
        onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
        title="Copy keystrokes"
      >
        <Copy className="h-4 w-4" />
      </Button>
      {copied && <div className="absolute top-2 right-12 text-xs text-green-300">Copied!</div>}
    </div>
  );
}

function NumberInput({ label, value, setValue, step = 1, suffix = "", min }: { label: string; value: number; setValue: (n: number) => void; step?: number; suffix?: string; min?: number; }) {
  return (
    <div className="grid grid-cols-2 gap-2 items-center">
      <div className="text-sm text-gray-600">{label}</div>
      <Input type="number" value={value} step={step} min={min} onChange={(e) => setValue(parseFloat(e.target.value))} className="rounded-xl border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      {suffix && <div className="col-span-2 text-xs text-gray-500 -mt-1">{suffix}</div>}
    </div>
  );
}

// ---------- Practice Game helpers (seeded RNG and truth) ----------
type Difficulty = "easy" | "normal" | "hard";

const RANGES: Record<Difficulty, any> = {
  easy: { income: [50000, 90000], wrr: [0.65, 0.85], ss: [12000, 28000], rwle: [15, 25], rle: [20, 30], g: [0.02, 0.035], r: [0.06, 0.09], pvcur: [0, 50000] },
  normal: { income: [60000, 120000], wrr: [0.7, 0.85], ss: [15000, 30000], rwle: [20, 35], rle: [20, 35], g: [0.02, 0.04], r: [0.07, 0.1], pvcur: [0, 200000] },
  hard: { income: [80000, 180000], wrr: [0.7, 0.9], ss: [15000, 40000], rwle: [10, 35], rle: [20, 35], g: [0.025, 0.045], r: [0.07, 0.11], pvcur: [0, 400000] },
};

function mulberry32(a: number) {
  let t = a >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
function randInt(rng: () => number, lo: number, hi: number) { return lo + Math.floor(rng() * (hi - lo + 1)); }
function randFloat(rng: () => number, lo: number, hi: number) { return lo + rng() * (hi - lo); }
function splitSeed(base: number, idx: number) { const GOLD = 0x9E3779B9; return (base ^ Math.imul(idx + 1, GOLD)) >>> 0; }

function computeRealRate(r: number, g: number) { return (1 + r) / (1 + g) - 1; }
function capitalAnnuity(pmt1: number, rReal: number, RLE: number) { if (Math.abs(rReal) < 1e-12) return pmt1 * RLE; const factor = (1 - Math.pow(1 + rReal, -RLE)) / rReal; return pmt1 * factor * (1 + rReal); }
function capitalCPM(capA: number, r: number, RLE: number) { return capA / (1 - Math.pow(1 + r, -RLE)); }
function capitalPPPM(capA: number, r: number, g: number, RLE: number) { const ratio = (1 + g) / (1 + r); return capA / (1 - Math.pow(ratio, RLE)); }
function annualSavings(PVcur: number, K: number, r: number, N: number, timing: "END" | "BEGIN") { const FVexist = PVcur * Math.pow(1 + r, N); const need = K - FVexist; if (need <= 0) return 0; let pmtEnd: number; if (Math.abs(r) < 1e-12) pmtEnd = need / N; else pmtEnd = need / ((Math.pow(1 + r, N) - 1) / r); return timing === "BEGIN" ? pmtEnd / (1 + r) : pmtEnd; }

type GameScenario = { name: string; bio: string; income: number; wrr: number; ss: number; rwle: number; rle: number; g: number; r: number; pvcur: number; rRetire?: number; bequest?: number };
type GameTruth = { need_today: number; PMT1: number; r_real: number; capA: number; keepCPM: number; totalCPM: number; keepPPPM: number; totalPPPM: number; svA: number; svCPM: number; svPPPM: number; };

function generateScenarioFromSeed(baseSeed: number, difficulty: Difficulty): GameScenario {
  const ranges = RANGES[difficulty] || RANGES.normal;
  const rng = mulberry32(baseSeed >>> 0);
  let income = randInt(rng, ranges.income[0], ranges.income[1]);
  let wrr = randFloat(rng, ranges.wrr[0], ranges.wrr[1]);
  let ss = randInt(rng, ranges.ss[0], ranges.ss[1]);
  let rwle = randInt(rng, ranges.rwle[0], ranges.rwle[1]);
  let rle = randInt(rng, ranges.rle[0], ranges.rle[1]);
  let g = randFloat(rng, ranges.g[0], ranges.g[1]);
  let r = randFloat(rng, ranges.r[0], ranges.r[1]);
  if (r <= g) r = g + 0.0005;
  let pvcur = randInt(rng, ranges.pvcur[0], ranges.pvcur[1]);

  // Easy mode: clean/even numbers and zero current savings
  if (difficulty === "easy") {
    const wrrChoices = [0.70, 0.75, 0.80, 0.85];
    const gChoices = [0.020, 0.025, 0.030, 0.035];
    const rChoices = [0.060, 0.070, 0.080, 0.090];
    wrr = wrrChoices[randInt(rng, 0, wrrChoices.length - 1)];
    g = gChoices[randInt(rng, 0, gChoices.length - 1)];
    r = rChoices[randInt(rng, 0, rChoices.length - 1)];
    if (r <= g) r = g + 0.005;
    income = Math.round(income / 1000) * 1000;
    ss = Math.round(ss / 1000) * 1000;
    rwle = Math.round(rwle / 5) * 5;
    rle = Math.round(rle / 5) * 5;
    pvcur = 0;
  }

  // Hard mode: also generate a separate return during retirement
  let rRetire: number | undefined = undefined;
  if (difficulty === "hard") {
    // Allow retirement return to vary +/- 2% around r
    const delta = (randFloat(rng, -0.02, 0.02));
    rRetire = Math.max(0, r + delta);
    if (rRetire <= g) rRetire = g + 0.0005;
  }

  // Optionally generate a reasonable bequest for hard mode (proportional to annuity size)
  let bequest: number | undefined = undefined;
  if (difficulty === "hard") {
    const rDuring = (typeof rRetire === "number" ? rRetire : r);
    const need_today = Math.max(0, wrr * income - ss);
    const PMT1 = need_today * Math.pow(1 + g, rwle);
    const r_real = computeRealRate(rDuring, g);
    const capA_est = capitalAnnuity(PMT1, r_real, rle);
    const ratio = randFloat(rng, 0.05, 0.25); // 5% - 25% of annuity nest egg
    bequest = Math.max(0, Math.round((capA_est * ratio) / 1000) * 1000);
  }
  const NAMES = ["Alex", "Jordan", "Taylor", "Morgan", "Riley", "Casey", "Drew"]; const LAST = ["Reeves", "Kim", "Singh", "Garcia", "Patel", "Lee"]; const BIOS = ["Analyst planning hikes.", "Small business owner plan.", "Teacher traveler.", "Engineer optimizer."];
  const name = `${NAMES[randInt(rng, 0, NAMES.length - 1)]} ${LAST[randInt(rng, 0, LAST.length - 1)]}`;
  const bio = BIOS[randInt(rng, 0, BIOS.length - 1)];
  return { name, bio, income, wrr, ss, rwle, rle, g, r, pvcur, rRetire, bequest };
}

function computeGameTruth(scn: GameScenario, timing: "END" | "BEGIN"): any {
  const need_today = Math.max(0, scn.wrr * scn.income - scn.ss);
  const PMT1 = need_today * Math.pow(1 + scn.g, scn.rwle);
  const rDuring = (typeof scn.rRetire === "number" ? scn.rRetire : scn.r);
  const r_real = computeRealRate(rDuring, scn.g);
  const bequestPV = scn.bequest ? scn.bequest / Math.pow(1 + r_real, scn.rle) : 0;
  const capA = capitalAnnuity(PMT1, r_real, scn.rle) + bequestPV;
  // Our CPM/PPPM per BA II module: discount AM nest egg to PV as untouched lump, then add back
  const keepCPM = capA / Math.pow(1 + rDuring, scn.rle);
  const totalCPM = capA + keepCPM;
  const keepPPPM = capA / Math.pow(1 + r_real, scn.rle);
  const totalPPPM = capA + keepPPPM;
  const svA = annualSavings(scn.pvcur, capA, scn.r, scn.rwle, timing);
  const svCPM = annualSavings(scn.pvcur, totalCPM, scn.r, scn.rwle, timing);
  const svPPPM = annualSavings(scn.pvcur, totalPPPM, scn.r, scn.rwle, timing);
  return { need_today, PMT1, r_real, capA, keepCPM, totalCPM, keepPPPM, totalPPPM, svA, svCPM, svPPPM };
}
export default function BAIIHowToModule({ initial, mode = "game" }: { initial?: Partial<Scenario>; mode?: "game" | "canvas"; }) {
  const [scenario, setScenario] = useState<Scenario>({
    salary: initial?.salary ?? 80000,
    wrrPct: initial?.wrrPct ?? 0.75,
    ssPension: initial?.ssPension ?? 20000,
    yearsToRetire: initial?.yearsToRetire ?? 15,
    yearsInRetirement: initial?.yearsInRetirement ?? 33,
    nominalRet: initial?.nominalRet ?? 0.08,
    inflation: initial?.inflation ?? 0.03,
  });

  const out = useMemo(() => computeScenario(scenario), [scenario]);

  // Stats for gamification (hidden in canvas mode)
  const [stats, setStats] = useState<{attempted: number; allCorrect: number; correct: number; incorrect: number}>({ attempted: 0, allCorrect: 0, correct: 0, incorrect: 0 });

  // ---------- Practice Game state ----------
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const timing: "END" = "END";
  const [seed, setSeed] = useState<number>(0);
  const [problemIndex, setProblemIndex] = useState<number>(0);
  const seedForProblem = useMemo(() => splitSeed(seed, problemIndex), [seed, problemIndex]);
  const [gameScenario, setGameScenario] = useState<GameScenario>(() => {
    if (mode === "canvas") {
      return { name: "", bio: "", income: 0, wrr: 0, ss: 0, rwle: 0, rle: 0, g: 0, r: 0, pvcur: 0 } as GameScenario;
    }
    return generateScenarioFromSeed(seedForProblem, difficulty);
  });
  const [gameTruth, setGameTruth] = useState<GameTruth>(() => computeGameTruth(gameScenario, timing));
  // Raw input strings for Canvas so typing is smooth (no live formatting)
  const emptyCanvas = { income: "", wrr: "", ss: "", rwle: "", rle: "", g: "", r: "", rRetire: "", pvcur: "", bequest: "" };
  const [canvasInputs, setCanvasInputs] = useState<any>(emptyCanvas);
  const [activeMethod, setActiveMethod] = useState<"ann" | "cpm" | "pppm">("ann");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, "correct" | "incorrect" | "">>({});
  const [showSolution, setShowSolution] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  useEffect(() => {
    if (mode === "game") {
      const methods: any[] = ["ann", "cpm", "pppm"];
      setActiveMethod(methods[Math.floor(Math.random() * methods.length)] as any);
    }
  }, [problemIndex, mode]);

  useEffect(() => {
    if (mode === "canvas") return;
    const scn = generateScenarioFromSeed(seedForProblem, difficulty);
    setGameScenario(scn);
    setGameTruth(computeGameTruth(scn, timing));
    setAnswers({}); setStatuses({}); setShowSolution(false); setShowDetails(false);
  }, [seedForProblem, difficulty, mode]);

  // Initialize seed randomly on first mount
  useEffect(() => {
    if (mode !== "game") return; // canvas: no RNG
    if (seed !== 0) return;
    try {
      const buf = new Uint32Array(1);
      if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
        window.crypto.getRandomValues(buf);
        setSeed(buf[0] >>> 0);
      } else {
        setSeed(((Math.random() * 0xffffffff) >>> 0));
      }
    } catch {
      setSeed(((Math.random() * 0xffffffff) >>> 0));
    }
    setProblemIndex(0);
  }, [mode]);

  function grade() {
    const res: Record<string, "correct" | "incorrect"> = {} as any;
    function gradeOne(userVal: number, truthVal: number) {
      const absErr = Math.abs(userVal - truthVal);
      const pctErr = truthVal === 0 ? (absErr > 0 ? 1 : 0) : Math.abs(absErr / truthVal);
      const tolDollar = 500; const tolPctStrict = 0.01;
      return (pctErr <= tolPctStrict || absErr <= tolDollar) ? "correct" : "incorrect";
    }
    if (activeMethod === "ann") {
      const v = parseFloat((answers["cap_ann"] || "0").toString().replace(/[^0-9.\-]/g, ""));
      res["cap_ann"] = gradeOne(v, gameTruth.capA);
      const sv = parseFloat((answers["sv_ann"] || "0").toString().replace(/[^0-9.\-]/g, ""));
      res["sv_ann"] = gradeOne(sv, gameTruth.svA);
    } else if (activeMethod === "cpm") {
      const v = parseFloat((answers["cap_cpm"] || "0").toString().replace(/[^0-9.\-]/g, ""));
      res["cap_cpm"] = gradeOne(v, gameTruth.totalCPM);
      const sv = parseFloat((answers["sv_cpm"] || "0").toString().replace(/[^0-9.\-]/g, ""));
      res["sv_cpm"] = gradeOne(sv, gameTruth.svCPM);
    } else {
      const v = parseFloat((answers["cap_pppm"] || "0").toString().replace(/[^0-9.\-]/g, ""));
      res["cap_pppm"] = gradeOne(v, gameTruth.totalPPPM);
      const sv = parseFloat((answers["sv_pppm"] || "0").toString().replace(/[^0-9.\-]/g, ""));
      res["sv_pppm"] = gradeOne(sv, gameTruth.svPPPM);
    }
    setStatuses(res);
    const keys = Object.keys(res);
    const numCorrect = keys.filter((k) => res[k] === "correct").length;
    const numIncorrect = keys.length - numCorrect;
    setStats((s) => ({
      attempted: s.attempted + 1,
      allCorrect: s.allCorrect + (numIncorrect === 0 ? 1 : 0),
      correct: s.correct + numCorrect,
      incorrect: s.incorrect + numIncorrect,
    }));
  }

  function resetRun() {
    setStats({ attempted: 0, allCorrect: 0, correct: 0, incorrect: 0 });
    setAnswers({});
    setStatuses({});
    setShowSolution(false);
    setShowDetails(false);
    if (mode === "canvas") {
      setCanvasInputs(emptyCanvas);
      const blank = { name: "", bio: "", income: 0, wrr: 0, ss: 0, rwle: 0, rle: 0, g: 0, r: 0, pvcur: 0 } as any;
      setGameScenario(blank);
      setGameTruth(computeGameTruth(blank, timing));
    }
  }

  // Canvas mode: compute and populate answers
  function submitCanvas() {
    let scn = gameScenario;
    if (mode === "canvas") {
      const ns: GameScenario = { ...gameScenario };
      ns.income = parseCurrencyToNumber(canvasInputs.income || "0");
      ns.wrr = parsePercentToDecimal(canvasInputs.wrr || "0");
      ns.ss = parseCurrencyToNumber(canvasInputs.ss || "0");
      ns.rwle = parseInteger(canvasInputs.rwle || "0");
      ns.rle = parseInteger(canvasInputs.rle || "0");
      ns.g = parsePercentToDecimal(canvasInputs.g || "0");
      ns.r = parsePercentToDecimal(canvasInputs.r || "0");
      if (!(ns.r > ns.g)) ns.r = ns.g + 0.0005;
      ns.rRetire = canvasInputs.rRetire ? parsePercentToDecimal(canvasInputs.rRetire) : ns.r;
      if (!(ns.rRetire! > ns.g)) ns.rRetire = ns.g + 0.0005;
      ns.pvcur = parseCurrencyToNumber(canvasInputs.pvcur || "0");
      ns.bequest = canvasInputs.bequest ? parseCurrencyToNumber(canvasInputs.bequest) : undefined;
      scn = ns;
      setGameScenario(scn);
    }
    const truth = computeGameTruth(scn, timing);
    setGameTruth(truth);
  }

  const ksPreamble = `Before you start:
2ND P/Y → 1 ENTER → 2ND QUIT
Use 2ND CLR TVM before each step.
`;

  const ksStep1 = `Step 1 — First-year retirement need (inflate today’s shortfall)
2ND CLR TVM
${scenario.yearsToRetire}   N
${(scenario.inflation * 100).toFixed(6)}   I/Y
-${(scenario.salary * scenario.wrrPct - scenario.ssPension).toFixed(2)}   PV
0   PMT
CPT FV  →  ${out.firstYearNeed.toFixed(2)}  (store)
`;

  const ksStep2 = `Step 2 — Real return during retirement
(1 + ${pct(scenario.nominalRet, 6)}) ÷ (1 + ${pct(scenario.inflation, 6)}) − 1 = ${pct(out.rReal, 6)} (store)
`;

  const ksAM = `Step 3 — AM nest egg at retirement (annuity due; FV=0)
2ND BGN  (BGN should show)
2ND CLR TVM
${scenario.yearsInRetirement}   N
${(out.rReal * 100).toFixed(6)}   I/Y
-${out.firstYearNeed.toFixed(2)}   PMT
0   FV
CPT PV  →  ${out.pvAM.toFixed(2)}
`;

  const ksCPM = `CPM — Preserve same nominal capital (extra untouched lump)
2ND CLR TVM
${scenario.yearsInRetirement}   N
${(scenario.nominalRet * 100).toFixed(6)}   I/Y
0   PMT
${out.pvAM.toFixed(2)}   FV
CPT PV  →  ${out.keepCPM.toFixed(2)}  (extra lump)
CPM Total at retirement = ${out.pvAM.toFixed(2)} + ${out.keepCPM.toFixed(2)} = ${(out.totalCPM).toFixed(2)}
`;

  const ksPPPM = `PPPM — Preserve purchasing power of capital (extra untouched lump)
2ND CLR TVM
${scenario.yearsInRetirement}   N
${(out.rReal * 100).toFixed(6)}   I/Y
0   PMT
${out.pvAM.toFixed(2)}   FV
CPT PV  →  ${out.keepPPPM.toFixed(2)}  (extra lump)
PPPM Total at retirement = ${out.pvAM.toFixed(2)} + ${out.keepPPPM.toFixed(2)} = ${(out.totalPPPM).toFixed(2)}
`;

  // formatting helpers moved to utils/formatters

  return (
    <div className={`baii-shell max-w-screen-2xl mx-auto p-8 md:p-12 space-y-8 text-2xl`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">Retirement Planning Math Game</h1>
          <p className="text-gray-300">Solve for Annuity, CPM, or PPPM. Randomize scenarios or edit numbers manually.</p>
        </div>
        {mode === "game" && (
          <a href="/canvas" className="rounded-full px-4 py-1.5 text-sm border bg-gray-300 text-gray-900 shadow hover:bg-gray-400 whitespace-nowrap">Blank Calculator →</a>
        )}
      </div>

      {/* Stats Tracker */}
      {mode === "game" && (
      <div className="flex flex-wrap gap-3 text-sm">
        <div className="rounded-xl border px-3 py-2 bg-[#0c1520] text-white/90">Attempted: <span className="font-semibold">{stats.attempted}</span></div>
        <div className="rounded-xl border px-3 py-2 bg-[#0c1520] text-white/90">All-correct: <span className="font-semibold">{stats.allCorrect}</span></div>
        <div className="rounded-xl border px-3 py-2 bg-[#0c1520] text-white/90">Correct: <span className="font-semibold">{stats.correct}</span></div>
        <div className="rounded-xl border px-3 py-2 bg-[#0c1520] text-white/90">Incorrect: <span className="font-semibold">{stats.incorrect}</span></div>
      </div>
      )}

      {/* Practice Game */}
      <Card className="rounded-2xl border bg-white text-gray-900 shadow-sm">
        <CardContent className="p-4 md:p-6 space-y-4">
          {mode === "game" ? (
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-sm text-gray-500">Difficulty</div>
              <select className="input input-sm" value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)}>
                <option value="easy">Easy</option>
                <option value="normal">Normal</option>
                <option value="hard">Hard</option>
              </select>
              <div className="text-sm text-gray-500">Seed</div>
              <input className="input input-sm" value={seed} onChange={(e) => setSeed(parseInt(e.target.value || "0", 10) || 0)} />
              <Button className="rounded-full px-4 py-1.5 text-sm border bg-gray-300 text-gray-900 shadow hover:bg-gray-400" onClick={() => setProblemIndex((i) => i + 1)}>New Problem</Button>
              <Button className="rounded-full px-4 py-1.5 text-sm border bg-gray-300 text-gray-900 shadow hover:bg-gray-400" onClick={() => { setSeed((Math.random() * 0xffffffff) >>> 0); setProblemIndex(0); }}>Re‑seed</Button>
              <Button className="rounded-full px-4 py-1.5 text-sm border bg-gray-300 text-gray-900 shadow hover:bg-gray-400" onClick={resetRun}>Reset Run</Button>
            </div>
          ) : null}

          <div className="grid md:grid-cols-3 gap-4 text-lg">
            <div className="rounded-xl border p-3 bg-gray-50">
              <div className="font-medium mb-2">Scenario</div>
              <div className="grid grid-cols-2 gap-2 items-center">
                <div className="text-gray-800">Income</div>
                {mode === "canvas" ? (
                  <input className="input" value={canvasInputs.income} onChange={(e)=> setCanvasInputs({ ...canvasInputs, income: e.target.value })} />
                ) : (
                  <input className="input" value={formatCurrency(gameScenario.income)} onChange={(e)=>{ const v=parseCurrencyToNumber(e.target.value); const ns={...gameScenario, income:v}; setGameScenario(ns); setGameTruth(computeGameTruth(ns, timing)); }} />
                )}
                <div className="text-gray-800">WRR</div>
                {mode === "canvas" ? (
                  <input className="input" value={canvasInputs.wrr} onChange={(e)=> setCanvasInputs({ ...canvasInputs, wrr: e.target.value })} />
                ) : (
                  <input className="input" value={formatPercent3(gameScenario.wrr)} onChange={(e)=>{ const v=parsePercentToDecimal(e.target.value); const ns={...gameScenario, wrr:v}; setGameScenario(ns); setGameTruth(computeGameTruth(ns, timing)); }} />
                )}
                <div className="text-gray-800">Social Security</div>
                {mode === "canvas" ? (
                  <input className="input" value={canvasInputs.ss} onChange={(e)=> setCanvasInputs({ ...canvasInputs, ss: e.target.value })} />
                ) : (
                  <input className="input" value={formatCurrency(gameScenario.ss)} onChange={(e)=>{ const v=parseCurrencyToNumber(e.target.value); const ns={...gameScenario, ss:v}; setGameScenario(ns); setGameTruth(computeGameTruth(ns, timing)); }} />
                )}
                <div className="text-gray-800">Years to retire</div>
                {mode === "canvas" ? (
                  <input className="input" value={canvasInputs.rwle} onChange={(e)=> setCanvasInputs({ ...canvasInputs, rwle: e.target.value })} />
                ) : (
                  <input className="input" value={formatIntegerWithCommas(gameScenario.rwle)} onChange={(e)=>{ const v=parseInteger(e.target.value); const ns={...gameScenario, rwle:v}; setGameScenario(ns); setGameTruth(computeGameTruth(ns, timing)); }} />
                )}
                <div className="text-gray-800">Years in retirement</div>
                {mode === "canvas" ? (
                  <input className="input" value={canvasInputs.rle} onChange={(e)=> setCanvasInputs({ ...canvasInputs, rle: e.target.value })} />
                ) : (
                  <input className="input" value={formatIntegerWithCommas(gameScenario.rle)} onChange={(e)=>{ const v=parseInteger(e.target.value); const ns={...gameScenario, rle:v}; setGameScenario(ns); setGameTruth(computeGameTruth(ns, timing)); }} />
                )}
                <div className="text-gray-800">Inflation</div>
                {mode === "canvas" ? (
                  <input className="input" value={canvasInputs.g} onChange={(e)=> setCanvasInputs({ ...canvasInputs, g: e.target.value })} />
                ) : (
                  <input className="input" value={formatPercent3(gameScenario.g)} onChange={(e)=>{ const v=parsePercentToDecimal(e.target.value); const ns={...gameScenario, g:v}; setGameScenario(ns); setGameTruth(computeGameTruth(ns, timing)); }} />
                )}
                <div className="text-gray-800">Return</div>
                {mode === "canvas" ? (
                  <input className="input" value={canvasInputs.r} onChange={(e)=> setCanvasInputs({ ...canvasInputs, r: e.target.value })} />
                ) : (
                  <input className="input" value={formatPercent3(gameScenario.r)} onChange={(e)=>{ const v=parsePercentToDecimal(e.target.value); const ns={...gameScenario, r:v}; if(!(ns.r>ns.g)) ns.r=ns.g+0.0005; setGameScenario(ns); setGameTruth(computeGameTruth(ns, timing)); }} />
                )}
                {(mode==="canvas" || difficulty === "hard") && (
                  <>
                    <div className="text-gray-800">Return in retirement</div>
                    {mode === "canvas" ? (
                      <input className="input" value={canvasInputs.rRetire} onChange={(e)=> setCanvasInputs({ ...canvasInputs, rRetire: e.target.value })} />
                    ) : (
                      <input className="input" value={formatPercent3(gameScenario.rRetire ?? gameScenario.r)} onChange={(e)=>{ const v=parsePercentToDecimal(e.target.value); const ns={...gameScenario, rRetire:v}; if(!(v>ns.g)) ns.rRetire=(ns.g+0.0005); setGameScenario(ns); setGameTruth(computeGameTruth(ns, timing)); }} />
                    )}
                  </>
                )}
                <div className="text-gray-800">Current savings</div>
                {mode === "canvas" ? (
                  <input className="input" value={canvasInputs.pvcur} onChange={(e)=> setCanvasInputs({ ...canvasInputs, pvcur: e.target.value })} />
                ) : (
                  <input className="input" value={formatCurrency(gameScenario.pvcur)} onChange={(e)=>{ const v=parseCurrencyToNumber(e.target.value); const ns={...gameScenario, pvcur:v}; setGameScenario(ns); setGameTruth(computeGameTruth(ns, timing)); }} />
                )}
                {((mode==="canvas" && activeMethod === "ann") || (difficulty === "hard" && activeMethod === "ann")) && (
                  <>
                    <div className="text-gray-800">Bequest (target at end of retirement)</div>
                    {mode === "canvas" ? (
                      <input className="input" value={canvasInputs.bequest} onChange={(e)=> setCanvasInputs({ ...canvasInputs, bequest: e.target.value })} />
                    ) : (
                      <input className="input" value={formatCurrency(gameScenario.bequest ?? 0)} onChange={(e)=>{ const v=parseCurrencyToNumber(e.target.value); const ns={...gameScenario, bequest:v}; setGameScenario(ns); setGameTruth(computeGameTruth(ns, timing)); }} />
                    )}
                  </>
                )}
                {mode === "canvas" && (
                  <div className="col-span-2 flex gap-2 pt-1">
                    <Button className="rounded-full px-4 py-1.5 text-sm border bg-gray-300 text-gray-900 shadow hover:bg-gray-400" onClick={submitCanvas}>Submit</Button>
                    <Button className="rounded-full px-4 py-1.5 text-sm border bg-gray-300 text-gray-900 shadow hover:bg-gray-400" onClick={resetRun}>Reset</Button>
                  </div>
                )}
              </div>
        </div>

            <div className="md:col-span-2">
              {mode !== "canvas" && (
                <div className="inline-flex items-center gap-2 mb-2">
                  <div className="rounded-full px-4 py-1.5 text-sm border bg-gray-300 text-gray-900 shadow">Method: {activeMethod === "ann" ? "Annuity" : activeMethod === "cpm" ? "CPM" : "PPPM"}</div>
                </div>
              )}
              {mode !== "canvas" && (
              <div className="grid md:grid-cols-2 gap-3">
                {activeMethod === "ann" && (
                  <>
                    <div>
                      <div className="text-sm text-gray-600">Capital at Retirement (Annuity)</div>
                      <div className="flex items-center gap-2">
                        <input className="input w-full" placeholder="$" value={answers["cap_ann"] || ""} onChange={(e) => setAnswers({ ...answers, cap_ann: e.target.value })} />
                        <span className={`status text-xs ${statuses["cap_ann"] === "correct" ? "text-green-600" : statuses["cap_ann"] === "incorrect" ? "text-red-600" : "text-gray-400"}`}>{statuses["cap_ann"] || ""}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Annual Savings Needed</div>
                      <div className="flex items-center gap-2">
                        <input className="input w-full" placeholder="$" value={answers["sv_ann"] || ""} onChange={(e) => setAnswers({ ...answers, sv_ann: e.target.value })} />
                        <span className={`status text-xs ${statuses["sv_ann"] === "correct" ? "text-green-600" : statuses["sv_ann"] === "incorrect" ? "text-red-600" : "text-gray-400"}`}>{statuses["sv_ann"] || ""}</span>
                      </div>
                    </div>
                  </>
                )}
                {activeMethod === "cpm" && (
                  <>
                    <div>
                      <div className="text-sm text-gray-600">Capital CPM</div>
                      <div className="flex items-center gap-2">
                        <input className="input w-full" placeholder="$" value={answers["cap_cpm"] || ""} onChange={(e) => setAnswers({ ...answers, cap_cpm: e.target.value })} />
                        <span className={`status text-xs ${statuses["cap_cpm"] === "correct" ? "text-green-600" : statuses["cap_cpm"] === "incorrect" ? "text-red-600" : "text-gray-400"}`}>{statuses["cap_cpm"] || ""}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Annual Savings for CPM</div>
                      <div className="flex items-center gap-2">
                        <input className="input w-full" placeholder="$" value={answers["sv_cpm"] || ""} onChange={(e) => setAnswers({ ...answers, sv_cpm: e.target.value })} />
                        <span className={`status text-xs ${statuses["sv_cpm"] === "correct" ? "text-green-600" : statuses["sv_cpm"] === "incorrect" ? "text-red-600" : "text-gray-400"}`}>{statuses["sv_cpm"] || ""}</span>
                      </div>
                    </div>
                  </>
                )}
                {activeMethod === "pppm" && (
                  <>
                    <div>
                      <div className="text-sm text-gray-600">Capital PPPM</div>
                      <div className="flex items-center gap-2">
                        <input className="input w-full" placeholder="$" value={answers["cap_pppm"] || ""} onChange={(e) => setAnswers({ ...answers, cap_pppm: e.target.value })} />
                        <span className={`status text-xs ${statuses["cap_pppm"] === "correct" ? "text-green-600" : statuses["cap_pppm"] === "incorrect" ? "text-red-600" : "text-gray-400"}`}>{statuses["cap_pppm"] || ""}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Annual Savings for PPPM</div>
                      <div className="flex items-center gap-2">
                        <input className="input w-full" placeholder="$" value={answers["sv_pppm"] || ""} onChange={(e) => setAnswers({ ...answers, sv_pppm: e.target.value })} />
                        <span className={`status text-xs ${statuses["sv_pppm"] === "correct" ? "text-green-600" : statuses["sv_pppm"] === "incorrect" ? "text-red-600" : "text-gray-400"}`}>{statuses["sv_pppm"] || ""}</span>
                      </div>
                    </div>
                  </>
                )}
               </div>
              )}

              {mode === "game" && (
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button className="rounded-full px-4 py-1.5 text-sm border bg-gray-300 text-gray-900 shadow hover:bg-gray-400" onClick={grade}>Check Answers</Button>
                  <Button className="rounded-full px-4 py-1.5 text-sm border bg-gray-300 text-gray-900 shadow hover:bg-gray-400" onClick={() => setShowSolution((s) => !s)}>{showSolution ? "Hide Solution" : "Show Solution"}</Button>
                  <Button className="rounded-full px-4 py-1.5 text-sm border bg-gray-300 text-gray-900 shadow hover:bg-gray-400" onClick={() => setShowDetails((s) => !s)}>{showDetails ? "Hide Details" : "Show Details"}</Button>
                </div>
              )}
              {mode === "canvas" && null}

              {(mode === "canvas" ? true : showDetails) && (
                <div className="mt-3 text-lg text-gray-900">
                  <div className="grid grid-cols-2 gap-1">
                    <div className="text-gray-800">Need today</div><div className="text-right">{currency(gameTruth.need_today)}</div>
                    <div className="text-gray-800">First‑year need</div><div className="text-right">{currency(gameTruth.PMT1)}</div>
                    <div className="text-gray-800">Real return</div><div className="text-right">{pct(gameTruth.r_real, 4)}</div>
                    <div className="text-gray-800">Capital Annuity</div><div className="text-right">{currency(gameTruth.capA)}</div>
                    <div className="text-gray-800">CPM Total</div><div className="text-right">{currency(gameTruth.totalCPM)}</div>
                    <div className="text-gray-800">PPPM Total</div><div className="text-right">{currency(gameTruth.totalPPPM)}</div>
                    <div className="text-gray-800">Annual savings (Annuity)</div><div className="text-right">{currency(gameTruth.svA)}</div>
                    <div className="text-gray-800">Annual savings (CPM)</div><div className="text-right">{currency(gameTruth.svCPM)}</div>
                    <div className="text-gray-800">Annual savings (PPPM)</div><div className="text-right">{currency(gameTruth.svPPPM)}</div>
                  </div>
              </div>
            )}

              {(mode === "canvas" ? true : showSolution) && (() => {
                const rRet = (gameScenario.rRetire ?? gameScenario.r);
                const rReal = computeRealRate(rRet, gameScenario.g);
                let text = "";
                text += "Before you start:\n";
                text += "2ND P/Y → 1 ENTER → 2ND QUIT\n";
                text += "Use 2ND CLR TVM before each step.\n\n";
                // Step 1
                text += "Step 1 — First‑year retirement need (inflate today’s shortfall)\n";
                text += "2ND CLR TVM\n";
                text += `${formatIntegerWithCommas(gameScenario.rwle)}   N\n`;
                text += `${(gameScenario.g*100).toFixed(3)}   I/Y\n`;
                text += `${formatCurrency(-(gameScenario.income*gameScenario.wrr - gameScenario.ss))}   PV\n`;
                text += `0   PMT\n`;
                text += `CPT FV  →  ${formatCurrency(gameTruth.PMT1)}  (store)\n\n`;
                // Step 2
                text += "Step 2 — Real return during retirement\n";
                text += `(1 + ${(rRet*100).toFixed(3)}%) ÷ (1 + ${(gameScenario.g*100).toFixed(3)}%) − 1 = ${formatPercent3(rReal)} (store)\n\n`;
                // Group by method for readability
                text += "===== Annuity Method (AM) =====\n";
                text += "Step 3 — AM nest egg at retirement (annuity due; FV=0)\n";
                text += "2ND BGN  (BGN should show)\n";
                text += "2ND CLR TVM\n";
                text += `${formatIntegerWithCommas(gameScenario.rle)}   N\n`;
                text += `${(rReal*100).toFixed(3)}   I/Y\n`;
                text += `${formatCurrency(-gameTruth.PMT1)}   PMT\n`;
                text += `${formatCurrency(gameScenario.bequest ? gameScenario.bequest : 0)}   FV  (bequest)\n`;
                text += `CPT PV  →  ${formatCurrency(gameTruth.capA)}\n`;
                // Savings to reach Annuity capital
                text += `\nSavings — Annual deposits to reach Annuity capital\n`;
                text += `2ND CLR TVM\n`;
                text += `${formatIntegerWithCommas(gameScenario.rwle)}   N\n`;
                text += `${(gameScenario.r*100).toFixed(3)}   I/Y\n`;
                text += `${formatCurrency(-gameScenario.pvcur)}   PV\n`;
                text += `0   PMT\n`;
                text += `${formatCurrency(gameTruth.capA)}   FV\n`;
                text += `CPT PMT  →  ${formatCurrency(gameTruth.svA)}\n\n`;

                if (mode === "canvas" || activeMethod === "cpm") {
                  text += "===== Capital Preservation Method (CPM) =====\n";
                  text += "CPM — Preserve same nominal capital (extra untouched lump)\n";
                  text += "2ND CLR TVM\n";
                  text += `${formatIntegerWithCommas(gameScenario.rle)}   N\n`;
                  text += `${(rRet*100).toFixed(3)}   I/Y\n`;
                  text += `0   PMT\n`;
                  text += `${formatCurrency(gameTruth.capA)}   FV\n`;
                  text += `CPT PV  →  ${formatCurrency(gameTruth.keepCPM)}  (extra lump)\n`;
                  text += `CPM Total at retirement = ${formatCurrency(gameTruth.capA)} + ${formatCurrency(gameTruth.keepCPM)} = ${formatCurrency(gameTruth.totalCPM)}\n`;
                  // Savings to reach CPM total
                  text += `\nSavings — Annual deposits to reach CPM total\n`;
                  text += `2ND CLR TVM\n`;
                  text += `${formatIntegerWithCommas(gameScenario.rwle)}   N\n`;
                  text += `${(gameScenario.r*100).toFixed(3)}   I/Y\n`;
                  text += `${formatCurrency(-gameScenario.pvcur)}   PV\n`;
                  text += `0   PMT\n`;
                  text += `${formatCurrency(gameTruth.totalCPM)}   FV\n`;
                  text += `CPT PMT  →  ${formatCurrency(gameTruth.svCPM)}\n\n`;
                }
                if (mode === "canvas" || activeMethod === "pppm") {
                  text += "===== Purchasing Power Preservation Method (PPPM) =====\n";
                  text += "PPPM — Preserve purchasing power of capital (extra untouched lump)\n";
                  text += "2ND CLR TVM\n";
                  text += `${formatIntegerWithCommas(gameScenario.rle)}   N\n`;
                  text += `${(rReal*100).toFixed(3)}   I/Y\n`;
                  text += `0   PMT\n`;
                  text += `${formatCurrency(gameTruth.capA)}   FV\n`;
                  text += `CPT PV  →  ${formatCurrency(gameTruth.keepPPPM)}  (extra lump)\n`;
                  text += `PPPM Total at retirement = ${formatCurrency(gameTruth.capA)} + ${formatCurrency(gameTruth.keepPPPM)} = ${formatCurrency(gameTruth.totalPPPM)}\n`;
                  // Savings to reach PPPM total
                  text += `\nSavings — Annual deposits to reach PPPM total\n`;
                  text += `2ND CLR TVM\n`;
                  text += `${formatIntegerWithCommas(gameScenario.rwle)}   N\n`;
                  text += `${(gameScenario.r*100).toFixed(3)}   I/Y\n`;
                  text += `${formatCurrency(-gameScenario.pvcur)}   PV\n`;
                  text += `0   PMT\n`;
                  text += `${formatCurrency(gameTruth.totalPPPM)}   FV\n`;
                  text += `CPT PMT  →  ${formatCurrency(gameTruth.svPPPM)}\n`;
                }
                return (
                  <div className="mt-3 p-3 rounded-xl border bg-gray-50 text-lg text-gray-900 whitespace-pre-wrap">{text}</div>
                );
              })()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

