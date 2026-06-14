import { useState, useEffect, useRef } from "react";

const DEFAULT_REST = 60;

const DEFAULT_WORKOUTS = [
  {
    id: "w1", name: "Ganzkörper", emoji: "⚡",
    exercises: [
      { id: "e1", name: "Warm-up",        sets: 1, unit: "5 min" },
      { id: "e2", name: "Kniebeugen",     sets: 3, unit: "12 Wdh." },
      { id: "e3", name: "Liegestütze",    sets: 3, unit: "10 Wdh." },
      { id: "e4", name: "Ausfallschritte",sets: 3, unit: "10 je Seite" },
      { id: "e5", name: "Plank",          sets: 3, unit: "30 sek" },
    ]
  },
  {
    id: "w2", name: "Rücken & Core", emoji: "🧘",
    exercises: [
      { id: "e6",  name: "Warm-up",    sets: 1, unit: "5 min" },
      { id: "e7",  name: "Vogel-Hund", sets: 3, unit: "10 je Seite" },
      { id: "e8",  name: "Brücke",     sets: 3, unit: "15 Wdh." },
      { id: "e9",  name: "Seitstütz",  sets: 2, unit: "30 sek je Seite" },
      { id: "e10", name: "Kreuzheben", sets: 3, unit: "8 Wdh." },
    ]
  },
  {
    id: "w3", name: "Oberkörper", emoji: "💪",
    exercises: [
      { id: "e11", name: "Warm-up",            sets: 1, unit: "5 min" },
      { id: "e12", name: "Liegestütze",         sets: 4, unit: "12 Wdh." },
      { id: "e13", name: "Rudern",              sets: 3, unit: "10 Wdh." },
      { id: "e14", name: "Schulterdrücken",     sets: 3, unit: "10 Wdh." },
      { id: "e15", name: "Trizeps Dips",        sets: 3, unit: "12 Wdh." },
    ]
  },
];

// ── Storage (localStorage) ─────────────────────────────────
function loadWorkouts() {
  try {
    const raw = localStorage.getItem("ft-workouts");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function saveWorkouts(workouts) {
  try { localStorage.setItem("ft-workouts", JSON.stringify(workouts)); } catch {}
}

// ── Helpers ───────────────────────────────────────────────
function uid() { return "x" + Date.now() + Math.random().toString(36).slice(2, 5); }
function fmt(s) {
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

// ── Design tokens ─────────────────────────────────────────
const T = {
  bg:       "#0C0C0E",
  card:     "#131315",
  card2:    "#1A1A1D",
  card3:    "#202024",
  border:   "#252528",
  borderHi: "#32323A",
  text:     "#DDDBD6",
  sub:      "#5C5C66",
  muted:    "#2E2E34",
  accent:   "#B8A898",
  accentDim:"#3A342E",
  ok:       "#4A7A58",
  okDim:    "#1E3226",
  okText:   "#82C49A",
};

const F = "'Inter', -apple-system, sans-serif";
const LABEL = { fontSize: 10, fontWeight: 600, letterSpacing: 1.6, color: T.sub, textTransform: "uppercase" };

// ── Ring ─────────────────────────────────────────────────
function Ring({ pct, size = 72, stroke = 5, color = T.accent }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.muted} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${c * pct / 100} ${c}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.4s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size > 100 ? 22 : 13, fontWeight: 600, color: pct === 100 ? T.okText : T.text, letterSpacing: -0.3 }}>
          {pct}%
        </span>
      </div>
    </div>
  );
}

// ── Bottom Sheet ─────────────────────────────────────────
function Sheet({ children, onClose }) {
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      zIndex: 200, backdropFilter: "blur(8px)", animation: "scrim .18s ease",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: T.card, borderRadius: "22px 22px 0 0",
        padding: "0 22px 48px", width: "100%", maxWidth: 480,
        animation: "sheetUp .22s cubic-bezier(.22,1,.36,1)",
        border: `1px solid ${T.border}`, borderBottom: "none",
      }}>
        <div style={{ width: 32, height: 3, background: T.muted, borderRadius: 2, margin: "14px auto 26px" }} />
        {children}
      </div>
    </div>
  );
}

// ── App ──────────────────────────────────────────────────
export default function App() {
  const [screen,     setScreen]     = useState("home");
  const [workouts,   setWorkouts]   = useState(DEFAULT_WORKOUTS);
  const [loaded,     setLoaded]     = useState(false);
  const [activeId,   setActiveId]   = useState(null);
  const [sessionEx,  setSessionEx]  = useState([]);
  const [elapsed,    setElapsed]    = useState(0);
  const [running,    setRunning]    = useState(false);
  const [restDur,    setRestDur]    = useState(DEFAULT_REST);
  const [restActive, setRestActive] = useState(false);
  const [restLeft,   setRestLeft]   = useState(DEFAULT_REST);
  const [editWO,     setEditWO]     = useState(null);
  const [showFinish, setShowFinish] = useState(false);
  const [showRest,   setShowRest]   = useState(false);
  const [restInput,  setRestInput]  = useState(String(DEFAULT_REST));
  const [dragId,     setDragId]     = useState(null);

  const elRef  = useRef(); const restRef = useRef();
  const t0     = useRef();
  const drag   = useRef({ active: false, id: null, timer: null, startY: 0 });

useEffect(() => {
  document.documentElement.style.overflow = 'hidden';
  document.documentElement.style.height = '100%';
  document.body.style.overflow = 'hidden';
  document.body.style.height = '100%';
  document.body.style.position = 'fixed';
  document.body.style.width = '100%';
}, []);

  
  // Load from localStorage
  useEffect(() => {
    const saved = loadWorkouts();
    if (saved?.length) setWorkouts(saved);
    setLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => { if (loaded) saveWorkouts(workouts); }, [workouts, loaded]);

  // Workout timer
  useEffect(() => {
    if (running) {
      t0.current = Date.now() - elapsed * 1000;
      elRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - t0.current) / 1000)), 500);
    } else clearInterval(elRef.current);
    return () => clearInterval(elRef.current);
  }, [running]);

  // Rest timer
  useEffect(() => {
    if (restActive) {
      restRef.current = setInterval(() => {
        setRestLeft(r => {
          if (r <= 1) {
            clearInterval(restRef.current);
            setRestActive(false); setRestLeft(restDur);
            navigator.vibrate?.([70, 40, 70, 40, 140]);
            return restDur;
          }
          return r - 1;
        });
      }, 1000);
    } else clearInterval(restRef.current);
    return () => clearInterval(restRef.current);
  }, [restActive, restDur]);

  // ── Session ──
  const startWorkout = (w) => {
    setActiveId(w.id);
    setSessionEx(w.exercises.map(e => ({ ...e, completedSets: Array(e.sets).fill(false) })));
    setElapsed(0); setRunning(false); setRestActive(false); setRestLeft(restDur);
    setScreen("workout");
  };

  const handleSetTap = (exId, si) => {
    setSessionEx(exs => exs.map(ex => {
      if (ex.id !== exId) return ex;
      const next = ex.completedSets.findIndex(s => !s);
      const last = ex.completedSets.lastIndexOf(true);
      if (si === next) {
        const u = [...ex.completedSets]; u[si] = true;
        setRestLeft(restDur); setRestActive(true);
        if (!running) setRunning(true);
        return { ...ex, completedSets: u };
      } else if (si === last) {
        const u = [...ex.completedSets]; u[si] = false;
        setRestActive(false); setRestLeft(restDur);
        return { ...ex, completedSets: u };
      }
      return ex;
    }));
  };

  const doFinish = () => { setRunning(false); setRestActive(false); setShowFinish(false); setScreen("summary"); };
  const doReset  = () => { setScreen("home"); setActiveId(null); setSessionEx([]); setElapsed(0); };

  // ── Edit ──
  const newWO    = () => { setEditWO({ id: "w" + Date.now(), name: "Neues Workout", emoji: "🏋️", exercises: [] }); setScreen("edit"); };
  const openEdit = w  => { setEditWO(JSON.parse(JSON.stringify(w))); setScreen("edit"); };
  const saveEdit = () => {
    setWorkouts(ws => ws.find(w => w.id === editWO.id)
      ? ws.map(w => w.id === editWO.id ? editWO : w)
      : [...ws, editWO]);
    setScreen("home");
  };
  const addEx = ()       => setEditWO(w => ({ ...w, exercises: [...w.exercises, { id: uid(), name: "", sets: 3, unit: "Wdh." }] }));
  const updEx = (id,f,v) => setEditWO(w => ({ ...w, exercises: w.exercises.map(e => e.id === id ? { ...e, [f]: v } : e) }));
  const remEx = id       => setEditWO(w => ({ ...w, exercises: w.exercises.filter(e => e.id !== id) }));
  const delWO = ()       => { setWorkouts(ws => ws.filter(w => w.id !== editWO.id)); setScreen("home"); };

  // ── Drag to reorder ──
  const onTS = (e, id) => {
    drag.current.timer = setTimeout(() => {
      navigator.vibrate?.(30);
      drag.current.active = true; drag.current.id = id;
      drag.current.startY = e.touches[0].clientY;
      setDragId(id);
    }, 420);
  };
  const onTM = (e) => {
    clearTimeout(drag.current.timer);
    if (!drag.current.active || !editWO) return;
    e.preventDefault();
    const step = Math.round((e.touches[0].clientY - drag.current.startY) / 58);
    if (step !== 0) {
      const exs  = [...editWO.exercises];
      const from = exs.findIndex(e => e.id === drag.current.id);
      if (from === -1) return;
      const to = Math.max(0, Math.min(exs.length - 1, from + step));
      if (to !== from) {
        const [item] = exs.splice(from, 1); exs.splice(to, 0, item);
        setEditWO(w => ({ ...w, exercises: exs }));
        drag.current.startY = e.touches[0].clientY;
      }
    }
  };
  const onTE = () => { clearTimeout(drag.current.timer); drag.current.active = false; drag.current.id = null; setDragId(null); };

  const saveRest = () => {
    const v = Math.max(10, Math.min(300, parseInt(restInput) || 60));
    setRestDur(v); setRestLeft(v); setRestInput(String(v)); setShowRest(false);
  };

  // ── Derived ──
  const totalSets = sessionEx.reduce((a, e) => a + e.sets, 0);
  const doneSets  = sessionEx.reduce((a, e) => a + e.completedSets.filter(Boolean).length, 0);
  const pct       = totalSets === 0 ? 0 : Math.round(doneSets / totalSets * 100);
  const restPct   = Math.round((restDur - restLeft) / restDur * 100);
  const currId    = sessionEx.find(e => e.completedSets.some(s => !s))?.id;
  const activeWO  = workouts.find(w => w.id === activeId);

  const inp = {
    background: T.card2, border: `1px solid ${T.border}`, borderRadius: 10,
    padding: "9px 12px", color: T.text, fontFamily: F, fontSize: 14, outline: "none", width: "100%",
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
overflowY: "auto", background: T.bg, color: T.text, fontFamily: F
 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .btn { cursor: pointer; border: none; background: none; transition: all .11s ease; font-family: ${F}; }
        .btn:active { transform: scale(.96); opacity: .85; }
        input::placeholder { color: ${T.sub}; opacity: .5; }
        input:focus { border-color: ${T.accent} !important; outline: none; }
        @keyframes scrim    { from{opacity:0} to{opacity:1} }
        @keyframes sheetUp  { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn  { from{opacity:0;transform:translateX(14px)} to{opacity:1;transform:translateX(0)} }
        @keyframes flicker  { 0%,100%{opacity:1} 50%{opacity:.4} }
        .fade-up  { animation: fadeUp  .28s ease both; }
        .slide-in { animation: slideIn .22s ease both; }
        .flicker  { animation: flicker 1.2s ease infinite; }
        * { overscroll-behavior: none; }
        body { background: #0C0C0E; }
#root {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  box-sizing: border-box;
}
        ::-webkit-scrollbar { width: 0; }
        input[type=number]::-webkit-inner-spin-button { opacity: 1; }
      `}</style>

      {/* ── Sheet: Finish ── */}
      {showFinish && (
        <Sheet onClose={() => setShowFinish(false)}>
          <p style={{ ...LABEL, marginBottom: 10 }}>Training beenden</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: T.text, marginBottom: 10, lineHeight: 1.25 }}>
            {pct === 100 ? "Alles erledigt 🎉" : `Noch ${totalSets - doneSets} Sätze offen`}
          </p>
          <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.65, marginBottom: 26 }}>
            {pct === 100
              ? "Alle Sätze abgehakt – Training jetzt abschließen?"
              : `${pct}% abgeschlossen. Trotzdem beenden?`}
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn" onClick={() => setShowFinish(false)} style={{
              flex: 1, background: T.card2, borderRadius: 14, padding: "13px",
              color: T.sub, fontSize: 14, fontWeight: 500, border: `1px solid ${T.border}`,
            }}>Zurück</button>
            <button className="btn" onClick={doFinish} style={{
              flex: 1, background: pct === 100 ? T.ok : T.accent,
              color: pct === 100 ? "#fff" : "#0C0C0E",
              borderRadius: 14, padding: "13px", fontSize: 14, fontWeight: 600,
            }}>{pct === 100 ? "Abschließen" : "Trotzdem beenden"}</button>
          </div>
        </Sheet>
      )}

      {/* ── Sheet: Rest settings ── */}
      {showRest && (
        <Sheet onClose={() => setShowRest(false)}>
          <p style={{ ...LABEL, marginBottom: 10 }}>Pause zwischen Sätzen</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: T.text, marginBottom: 20 }}>Pausenzeit</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {[30, 60, 90, 120].map(v => (
              <button key={v} className="btn" onClick={() => setRestInput(String(v))} style={{
                flex: 1, background: restInput === String(v) ? T.accent : T.card2,
                color: restInput === String(v) ? "#0C0C0E" : T.sub,
                border: `1px solid ${restInput === String(v) ? T.accent : T.border}`,
                borderRadius: 10, padding: "9px 0", fontSize: 13, fontWeight: 600,
              }}>{v}s</button>
            ))}
          </div>
          <div style={{ position: "relative", marginBottom: 22 }}>
            <input type="number" min="10" max="300" value={restInput}
              onChange={e => setRestInput(e.target.value)}
              style={{ ...inp, textAlign: "center", fontSize: 24, fontWeight: 700, padding: "14px" }} />
            <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: T.sub }}>sek</span>
          </div>
          <button className="btn" onClick={saveRest} style={{
            width: "100%", background: T.accent, color: "#0C0C0E",
            borderRadius: 14, padding: "14px", fontSize: 14, fontWeight: 700,
          }}>Speichern</button>
        </Sheet>
      )}

      {/* ════════════════ HOME ════════════════ */}
      {screen === "home" && (
        <div className="fade-up" style={{ maxWidth: 480, margin: "0 auto", padding: "52px 20px 40px" }}>
          <p style={{ ...LABEL, marginBottom: 8 }}>Fitness Tracker</p>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: T.text, letterSpacing: -0.5, lineHeight: 1.1, marginBottom: 34 }}>
            Deine Workouts
          </h1>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {workouts.map((w, i) => {
              const ts = w.exercises.reduce((a, e) => a + e.sets, 0);
              return (
                <div key={w.id} className="fade-up" style={{
                  background: T.card, borderRadius: 18, border: `1px solid ${T.border}`,
                  animationDelay: `${i * .06}s`,
                }}>
                  <div style={{ padding: "16px 18px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                      <div style={{ width: 44, height: 44, background: T.card2, borderRadius: 12,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 22, flexShrink: 0, border: `1px solid ${T.border}` }}>
                        {w.emoji}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 16, fontWeight: 600, color: T.text, letterSpacing: -0.2 }}>{w.name}</p>
                        <p style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>{w.exercises.length} Übungen · {ts} Sätze</p>
                      </div>
                      <button className="btn" onClick={() => openEdit(w)} style={{
                        background: T.card2, borderRadius: 8, padding: "6px 12px",
                        color: T.sub, fontSize: 12, fontWeight: 500, border: `1px solid ${T.border}`,
                      }}>Edit</button>
                    </div>
                    <button className="btn" onClick={() => startWorkout(w)} style={{
                      width: "100%", background: T.card3, color: T.text,
                      borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 600,
                      border: `1px solid ${T.borderHi}`,
                    }}>Starten →</button>
                  </div>
                </div>
              );
            })}
          </div>
          <button className="btn" onClick={newWO} style={{
            marginTop: 12, width: "100%", background: "transparent",
            border: `1px dashed ${T.border}`, borderRadius: 16, padding: "14px",
            color: T.sub, fontSize: 13, fontWeight: 500,
          }}>+ Neues Workout</button>
        </div>
      )}

      {/* ════════════════ EDIT ════════════════ */}
      {screen === "edit" && editWO && (
        <div className="slide-in" style={{ maxWidth: 480, margin: "0 auto", padding: "48px 20px 40px" }}>
          <button className="btn" onClick={() => setScreen("home")} style={{
            color: T.accent, fontSize: 13, fontWeight: 500, marginBottom: 24,
          }}>← Zurück</button>
          <p style={{ ...LABEL, marginBottom: 10 }}>Workout bearbeiten</p>
          <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
            <input value={editWO.emoji || "💪"} onChange={e => setEditWO(w => ({ ...w, emoji: e.target.value }))}
              style={{ ...inp, width: 50, textAlign: "center", fontSize: 22, padding: "7px 4px" }} />
            <input value={editWO.name} onChange={e => setEditWO(w => ({ ...w, name: e.target.value }))}
              style={{ ...inp, flex: 1, fontSize: 16, fontWeight: 600 }} />
          </div>
          <p style={{ ...LABEL, marginBottom: 10 }}>Übungen · Halten zum Sortieren</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 10 }}>
            {editWO.exercises.map(ex => (
              <div key={ex.id}
                onTouchStart={e => onTS(e, ex.id)} onTouchMove={onTM} onTouchEnd={onTE}
                style={{
                  background: dragId === ex.id ? T.card3 : T.card2,
                  border: `1px solid ${dragId === ex.id ? T.accent : T.border}`,
                  borderRadius: 12, padding: "10px 12px",
                  display: "flex", alignItems: "center", gap: 8,
                  transform: dragId === ex.id ? "scale(1.02)" : "scale(1)",
                  transition: "all .13s ease", touchAction: "none",
                  boxShadow: dragId === ex.id ? "0 10px 28px rgba(0,0,0,.5)" : "none",
                }}>
                <span style={{ color: T.muted, fontSize: 16, cursor: "grab", userSelect: "none", flexShrink: 0 }}>⠿</span>
                <input value={ex.name} onChange={e => updEx(ex.id, "name", e.target.value)} placeholder="Übungsname"
                  style={{ ...inp, flex: 1, padding: "6px 9px", fontSize: 13, background: T.card, border: `1px solid ${T.border}` }} />
                <input type="number" min="1" max="10" value={ex.sets}
                  onChange={e => updEx(ex.id, "sets", parseInt(e.target.value) || 1)}
                  style={{ ...inp, width: 44, padding: "6px 5px", textAlign: "center", fontSize: 13, background: T.card, border: `1px solid ${T.border}` }} />
                <span style={{ fontSize: 11, color: T.sub, flexShrink: 0 }}>×</span>
                <input value={ex.unit} onChange={e => updEx(ex.id, "unit", e.target.value)} placeholder="Einheit"
                  style={{ ...inp, width: 84, padding: "6px 8px", fontSize: 12, background: T.card, border: `1px solid ${T.border}` }} />
                <button className="btn" onClick={() => remEx(ex.id)}
                  style={{ color: T.sub, fontSize: 20, padding: "0 3px", lineHeight: 1, flexShrink: 0 }}>×</button>
              </div>
            ))}
          </div>
          <button className="btn" onClick={addEx} style={{
            width: "100%", background: "transparent", border: `1px dashed ${T.border}`,
            borderRadius: 12, padding: "10px", color: T.sub, fontSize: 13, fontWeight: 500, marginBottom: 28,
          }}>+ Übung hinzufügen</button>
          <div style={{ display: "flex", gap: 10 }}>
            {workouts.find(w => w.id === editWO.id) && (
              <button className="btn" onClick={delWO} style={{
                background: T.card2, border: `1px solid ${T.border}`, borderRadius: 12,
                padding: "12px 16px", color: "#C0504A", fontSize: 13, fontWeight: 500,
              }}>Löschen</button>
            )}
            <button className="btn" onClick={saveEdit} style={{
              flex: 1, background: T.accent, color: "#0C0C0E",
              borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700,
            }}>Speichern</button>
          </div>
        </div>
      )}

      {/* ════════════════ WORKOUT ════════════════ */}
      {screen === "workout" && (
        <div className="fade-up" style={{ maxWidth: 480, margin: "0 auto", paddingBottom: 52 }}>
          {/* Sticky header */}
          <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`,
          paddingTop: "calc(env(safe-area-inset-top) + 20px)",
paddingLeft: "20px", paddingRight: "20px", paddingBottom: "16px",
position: "sticky", top: 0, zIndex: 10
  }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <p style={{ ...LABEL, marginBottom: 5 }}>{activeWO?.name}</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: T.text, letterSpacing: -0.4, lineHeight: 1 }}>
                  {pct === 100 ? "Fertig 🎉" : `${doneSets} / ${totalSets} Sätze`}
                </p>
              </div>
              <Ring pct={pct} size={68} stroke={5} color={pct === 100 ? T.okText : T.accent} />
            </div>
            <div style={{ height: 2, background: T.muted, borderRadius: 1, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, borderRadius: 1,
                background: pct === 100 ? T.okText : T.accent,
                transition: "width 0.4s ease, background 0.3s" }} />
            </div>
          </div>

          <div style={{ padding: "14px 20px 0" }}>
            {/* Timer */}
            <div style={{ background: T.card, borderRadius: 18, border: `1px solid ${T.border}`,
              marginBottom: 12, overflow: "hidden" }}>
              <div style={{ padding: "16px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ ...LABEL, marginBottom: 4 }}>Workout-Zeit</p>
                    <p className={running && !restActive ? "flicker" : ""} style={{
                      fontFamily: "'SF Mono','Courier New',monospace",
                      fontSize: 46, fontWeight: 700, lineHeight: 1, letterSpacing: -1,
                      color: running ? T.accent : T.text,
                    }}>{fmt(elapsed)}</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                    <button className="btn" onClick={() => setRunning(r => !r)} style={{
                      background: running ? T.card2 : T.accent,
                      color: running ? T.text : "#0C0C0E",
                      border: running ? `1px solid ${T.border}` : "none",
                      borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 600,
                    }}>{running ? "Pause" : elapsed > 0 ? "Weiter" : "Start"}</button>
                    <button className="btn" onClick={() => setShowRest(true)} style={{
                      color: T.sub, fontSize: 11, fontWeight: 500, padding: "1px 0",
                    }}>⏱ {restDur}s Pause</button>
                  </div>
                </div>
              </div>
              {/* Rest timer */}
              {restActive && (
                <div style={{ borderTop: `1px solid ${T.border}` }}>
                  {/* Depleting bar */}
                  <div style={{ height: 3, background: T.muted, position: "relative", overflow: "hidden" }}>
                    <div style={{
                      position: "absolute", top: 0, left: 0, height: "100%",
                      width: `${100 - restPct}%`,
                      background: `linear-gradient(90deg, ${T.okText}66, ${T.okText})`,
                      transition: "width 1s linear",
                      borderRadius: "0 2px 2px 0",
                    }} />
                  </div>
                  <div style={{ padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ ...LABEL, color: T.okText, letterSpacing: 1.4 }}>Pause</p>
                    <p style={{ fontFamily: "'SF Mono','Courier New',monospace",
                      fontSize: 22, fontWeight: 700, color: T.okText, letterSpacing: -0.5 }}>{fmt(restLeft)}</p>
                    <button className="btn" onClick={() => { setRestActive(false); setRestLeft(restDur); }} style={{
                      background: T.card2, border: `1px solid ${T.border}`, borderRadius: 8,
                      padding: "5px 12px", color: T.sub, fontSize: 11, fontWeight: 500,
                    }}>Skip</button>
                  </div>
                </div>
              )}
            </div>

            {/* Exercises */}
            <p style={{ ...LABEL, marginBottom: 8 }}>Übungen</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sessionEx.map((ex, i) => {
                const isDone   = ex.completedSets.every(Boolean);
                const isCurr   = ex.id === currId;
                const doneN    = ex.completedSets.filter(Boolean).length;
                const nextIdx  = ex.completedSets.findIndex(s => !s);
                const lastDone = ex.completedSets.lastIndexOf(true);
                return (
                  <div key={ex.id} style={{
                    background: isDone ? T.okDim : isCurr ? T.accentDim : T.card,
                    border: `1px solid ${isDone ? T.ok + "66" : isCurr ? T.accent + "55" : T.border}`,
                    borderRadius: 16, overflow: "hidden",
                    animation: `fadeUp .28s ease ${i * .05}s both`,
                  }}>
                    <div style={{ display: "flex" }}>
                      <div style={{ width: 3, background: isDone ? T.okText : isCurr ? T.accent : "transparent", flexShrink: 0 }} />
                      <div style={{ flex: 1, padding: "13px 15px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 11 }}>
                          <div>
                            <p style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.2,
                              color: isDone ? T.okText : T.text,
                              textDecoration: isDone ? "line-through" : "none" }}>{ex.name}</p>
                            <p style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{ex.unit} · {doneN}/{ex.sets} Sätze</p>
                          </div>
                          {isDone && (
                            <div style={{ width: 24, height: 24, background: T.ok, borderRadius: "50%",
                              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                                <path d="M1 4.5L4 7.5L10 1.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          )}
                          {isCurr && !isDone && (
                            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.2, color: T.accent,
                              background: T.accentDim, border: `1px solid ${T.accent}44`,
                              borderRadius: 20, padding: "2px 8px" }}>JETZT</span>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          {ex.completedSets.map((done, si) => {
                            const isNext   = si === nextIdx;
                            const isLocked = !done && !isNext;
                            return (
                              <button key={si}
                                className={isLocked ? "" : "btn"}
                                onClick={() => handleSetTap(ex.id, si)}
                                disabled={isLocked}
                                style={{
                                  flex: 1, height: 36, borderRadius: 9,
                                  background: done ? T.ok : isNext ? T.card3 : T.card2,
                                  border: `1px solid ${done ? T.ok + "aa" : isNext ? T.accent + "66" : T.border}`,
                                  display: "flex", flexDirection: "column",
                                  alignItems: "center", justifyContent: "center",
                                  cursor: isLocked ? "default" : "pointer",
                                  opacity: isLocked ? .28 : 1,
                                }}>
                                <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: .8,
                                  color: done ? "#fff" : isNext ? T.accent : T.sub, marginBottom: 2 }}>S{si + 1}</span>
                                {done ? (
                                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                                    <path d="M1 3.5L3.4 6L8 1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                ) : (
                                  <div style={{ width: 5, height: 5, borderRadius: 1.5,
                                    background: isNext ? T.accent : T.muted, opacity: isNext ? 1 : .6 }} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="btn" onClick={() => setShowFinish(true)} style={{
              marginTop: 18, width: "100%",
              background: pct === 100 ? T.ok : T.card,
              color: pct === 100 ? "#fff" : T.sub,
              border: `1px solid ${pct === 100 ? T.ok + "aa" : T.border}`,
              borderRadius: 16, padding: "14px", fontSize: 14, fontWeight: 600,
            }}>{pct === 100 ? "Training abschließen 🏆" : "Training beenden →"}</button>
          </div>
        </div>
      )}

      {/* ════════════════ SUMMARY ════════════════ */}
      {screen === "summary" && (
        <div className="fade-up" style={{ maxWidth: 480, margin: "0 auto", padding: "52px 20px 40px" }}>
          <p style={{ ...LABEL, marginBottom: 10 }}>Ergebnis</p>
          <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.05,
            marginBottom: 6, color: pct === 100 ? T.okText : T.accent }}>
            {pct === 100 ? "Perfekt. 🏆" : `${pct}% geschafft`}
          </h1>
          <p style={{ fontSize: 13, color: T.sub, marginBottom: 32 }}>{activeWO?.name}</p>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
            <Ring pct={pct} size={130} stroke={8} color={pct === 100 ? T.okText : T.accent} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
            {[
              { label: "Zeit",     value: fmt(elapsed) },
              { label: "Sätze",   value: `${doneSets}/${totalSets}` },
              { label: "Übungen", value: `${sessionEx.filter(e => e.completedSets.every(Boolean)).length}/${sessionEx.length}` },
              { label: "Workout", value: activeWO?.emoji || "💪" },
            ].map(s => (
              <div key={s.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "14px 16px" }}>
                <p style={{ ...LABEL, marginBottom: 8 }}>{s.label}</p>
                <p style={{ fontSize: 26, fontWeight: 700, color: T.text, letterSpacing: -0.3 }}>{s.value}</p>
              </div>
            ))}
          </div>
          <p style={{ ...LABEL, marginBottom: 8 }}>Übersicht</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 26 }}>
            {sessionEx.map(ex => {
              const d    = ex.completedSets.filter(Boolean).length;
              const full = d === ex.sets;
              return (
                <div key={ex.id} style={{ padding: "11px 14px", background: T.card,
                  borderRadius: 12, border: `1px solid ${full ? T.ok + "44" : T.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: d > 0 ? 7 : 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: full ? T.okText : d > 0 ? T.text : T.sub }}>
                      {full && "✓ "}{ex.name}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: full ? T.okText : d > 0 ? T.accent : T.sub }}>
                      {d}/{ex.sets}
                    </span>
                  </div>
                  {d > 0 && (
                    <div style={{ display: "flex", gap: 3 }}>
                      {ex.completedSets.map((s, i) => (
                        <div key={i} style={{ flex: 1, height: 3, borderRadius: 1.5, background: s ? T.ok : T.muted }} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn" onClick={doReset} style={{
              flex: 1, background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 14, padding: "13px", color: T.sub, fontSize: 14, fontWeight: 500,
            }}>Übersicht</button>
            <button className="btn" onClick={() => { const w = workouts.find(w => w.id === activeId); if (w) startWorkout(w); }} style={{
              flex: 1, background: T.accent, color: "#0C0C0E",
              borderRadius: 14, padding: "13px", fontSize: 14, fontWeight: 700,
            }}>Nochmal →</button>
          </div>
        </div>
      )}
    </div>
  );
}
