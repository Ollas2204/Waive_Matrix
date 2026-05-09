import { useState, useEffect, useRef } from "react";

// ─── DATA SOURCE ──────────────────────────────────────────────
// Combined from 2 sheets: Sheet1 (Overdue Fees) + Sheet2 (Payment Fee Waive Matrix)
const WAIVE_DATA = {
  "Overdue Fees": {
    icon: "⏰", tag: "OVRD_FEE",
    canWaive: true,
    tiers: [
      {
        label: "Hard Reasons", tag: "TIER::HARD",
        badgeColor: "#ff2d55",
        dpdMin: 2, dpdMax: null, dpdLabel: "DPD ≥ 2",
        reasons: [
          { id: 1, icon: "☠", text: "Death", id_text: "Meninggal" },
          { id: 2, icon: "🏥", text: "Hard Sick (Stroke/Coma/Cancer/Covid) / Hard Accident / Long-term Sick", id_text: "Sakit Keras / Kecelakaan Berat / Sakit Jangka Panjang" },
          { id: 3, icon: "⚠", text: "Pending Payment – System Error", id_text: "Pending Payment karena System Error" },
          { id: 4, icon: "📋", text: "Terminated / Job Loss / Bankruptcy", id_text: "PHK / Kehilangan Pekerjaan / Bangkrut" },
          { id: 5, icon: "🌊", text: "Natural Disaster (Flood / Earthquake / Fire)", id_text: "Bencana Alam (Banjir / Gempa / Kebakaran)" },
          { id: 6, icon: "👨‍👩‍👧", text: "Close Family Sick (Mother/Spouse/Child/Parent)", id_text: "Keluarga Dekat Sakit (Ibu/Suami/Anak/Ortu)" },
          { id: 7, icon: "🎯", text: "Crash Program – Internal Collection", id_text: "Program Khusus Internal Collection (jika ada)" },
        ],
        waivePct: "100%", waiveAmt: "Rp 80.000",
        docs: [
          "Death Certificate / Surat Kematian",
          "Official Certificate from Hospital / Specialist Doctor",
          "Photo from Cboss & proof of payment",
          "Termination letter from company / Surat PHK",
          "Official announcement from government or mass media",
          "Certificate of illness/hospitalization from hospital or doctor",
          "Official emails from Local or Regional",
        ],
      },
      {
        label: "Soft Reasons", tag: "TIER::SOFT",
        badgeColor: "#f7b731",
        dpdMin: 3, dpdMax: null, dpdLabel: "DPD > 2",
        reasons: [
          { id: 1, icon: "🤧", text: "Temporary Sick (Flu / Fever)", id_text: "Sakit Ringan (Demam / Flu / Batuk)" },
          { id: 2, icon: "📉", text: "Downgrade in Job", id_text: "Jabatan di Downgrade" },
          { id: 3, icon: "💸", text: "Decreased Revenue / Omzet (Self-employed)", id_text: "Omzet Menurun (Wiraswasta)" },
          { id: 4, icon: "🏦", text: "Run Out Money – Paid to Other Agencies", id_text: "Penghasilan Minim / Tagihan di Perusahaan Lain" },
          { id: 5, icon: "🎯", text: "Crash Program – Internal Collection", id_text: "Program Khusus Internal Collection (jika ada)" },
        ],
        waivePctPerReason: { 1: "Max 50%", 2: "Max 80%", 3: "Max 80%", 4: "Max 50%", 5: "Max 100%" },
        waivePct: "50%–100%", waiveAmt: "Rp 64.000 (max)",
        docs: [
          "Official Certificate from Hospital / Specialist Doctor",
          "Downgrade letter from company / Surat Downgrade",
          "Certificate of incapacity from RT",
          "Invoices or Loan Letters from related financial services",
          "Official emails from Local or Regional",
        ],
      },
    ],
  },
  "Payment Fee": {
    icon: "💳", tag: "PAY_FEE",
    canWaive: true,
    tiers: [
      {
        label: "Hard Reasons", tag: "TIER::HARD",
        badgeColor: "#ff2d55",
        dpdMin: 0, dpdMax: null, dpdLabel: "All DPD",
        reasons: [
          { id: 1, icon: "☠", text: "Death", id_text: "Meninggal" },
          { id: 2, icon: "🏥", text: "Hard Sick (Stroke/Coma/Cancer/Covid) / Hard Accident / Long-term Sick", id_text: "Sakit Keras / Kecelakaan Berat / Sakit Jangka Panjang" },
          { id: 3, icon: "⚠", text: "System Error", id_text: "Sistem Error" },
          { id: 4, icon: "📋", text: "Terminated from Work / Job Loss", id_text: "PHK / Kehilangan Pekerjaan" },
          { id: 5, icon: "🌊", text: "Natural Disaster (Flood / Earthquake / Fire)", id_text: "Bencana Alam (Banjir / Gempa / Kebakaran)" },
          { id: 6, icon: "📢", text: "Hard Complaint to Social Media & OJK", id_text: "Komplain Berat ke Social Media atau OJK" },
          { id: 7, icon: "🎯", text: "Crash Program (Conditional)", id_text: "Program Khusus (Kondisional)" },
        ],
        waivePct: "Max 100%", waiveAmt: "—",
        notes: "Waive hanya berlaku selama periode alasan · Wajib Approval SPV & Manager",
        docs: [
          "Death Certificate / Surat Kematian",
          "Official Certificate from Hospital / Specialist Doctor",
          "Photo from Cboss & proof of payment",
          "Termination letter from company / Surat PHK",
          "Official announcement from government or mass media",
          "Evidence of news in mass media or email from OJK",
          "Official emails from Local or Regional",
        ],
      },
    ],
  },
  "Membership Fee": { icon: "🪪", tag: "MEMB_FEE", canWaive: false },
  "Service Fee":    { icon: "🔧", tag: "SRVC_FEE", canWaive: false },
  "Interest":       { icon: "📊", tag: "INTRST",   canWaive: false },
  "Principal":      { icon: "🏛", tag: "PRNCPL",   canWaive: false },
};

// ─── TYPEWRITER HOOK ──
function useTypewriter(text, speed = 28, trigger = true) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (!trigger) return;
    setDisplayed("");
    let i = 0;
    const t = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(t);
    }, speed);
    return () => clearInterval(t);
  }, [text, trigger]);
  return displayed;
}

// ─── SCANLINE OVERLAY ──
function Scanlines() {
  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9998,
      backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
      animation: "scanMove 8s linear infinite",
    }} />
  );
}

// ─── MATRIX RAIN (subtle bg) ──
function MatrixBg() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const cols = Math.floor(canvas.width / 18);
    const drops = Array(cols).fill(1);
    const chars = "01アイウエオカキクケコWAIVEDPD%MATRIX";
    let raf;
    const draw = () => {
      ctx.fillStyle = "rgba(0,8,0,0.06)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00ff4115";
      ctx.font = "13px monospace";
      drops.forEach((y, i) => {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(ch, i * 18, y * 18);
        if (y * 18 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, opacity: 0.4, zIndex: 0, pointerEvents: "none" }} />;
}

// ─── GLITCH TEXT ──
function GlitchText({ text, size = 32, color = "#00ff41" }) {
  return (
    <div style={{ position: "relative", display: "inline-block", lineHeight: 1 }}>
      <span style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: size, color, letterSpacing: 2,
        textShadow: `0 0 10px ${color}, 0 0 30px ${color}55`,
        animation: "glitchMain 4s infinite",
        position: "relative", zIndex: 1,
      }}>{text}</span>
      <span style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: size, color: "#ff003c",
        position: "absolute", top: 0, left: 0, letterSpacing: 2,
        animation: "glitchR 4s infinite",
        opacity: 0.7, zIndex: 0,
        clipPath: "polygon(0 30%, 100% 30%, 100% 50%, 0 50%)",
      }}>{text}</span>
      <span style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: size, color: "#00cfff",
        position: "absolute", top: 0, left: 0, letterSpacing: 2,
        animation: "glitchB 4s infinite",
        opacity: 0.7, zIndex: 0,
        clipPath: "polygon(0 60%, 100% 60%, 100% 75%, 0 75%)",
      }}>{text}</span>
    </div>
  );
}

// ─── PROGRESS BAR ──
function ProgressBar({ current, total }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontFamily: "monospace", fontSize: 10, color: "#00ff41", letterSpacing: 2 }}>
          PROGRESS
        </span>
        <span style={{ fontFamily: "monospace", fontSize: 10, color: "#00ff41" }}>{pct}%</span>
      </div>
      <div style={{ height: 4, background: "#0a1a0a", border: "1px solid #00ff4133", borderRadius: 2 }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: "linear-gradient(90deg, #00ff41, #00cfff)",
          borderRadius: 2,
          boxShadow: "0 0 8px #00ff41",
          transition: "width 0.5s ease",
        }} />
      </div>
    </div>
  );
}

// ─── TERMINAL LINE ──
function TermLine({ prefix = ">", text, color = "#00ff41", delay = 0, dim = false }) {
  return (
    <div style={{
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: 11, color: dim ? "#3a5a3a" : color,
      marginBottom: 2, letterSpacing: 0.5,
      animation: `fadeIn 0.3s ${delay}s both`,
    }}>
      <span style={{ color: dim ? "#2a4a2a" : "#00ff4188" }}>{prefix} </span>{text}
    </div>
  );
}

// ─── MAIN APP ──
export default function App() {
  const [step, setStep]             = useState("waive_type");
  const [waiveType, setWaiveType]   = useState(null);
  const [dpd, setDpd]               = useState(null);
  const [reasonTier, setReasonTier] = useState(null);
  const [reasonId, setReasonId]     = useState(null);
  const [history, setHistory]       = useState([]);
  const [dpdInput, setDpdInput]     = useState("");
  const [animKey, setAnimKey]       = useState(0);
  const [bootDone, setBootDone]     = useState(false);
  const [hoveredKey, setHoveredKey] = useState(null);
  const [lang, setLang]             = useState("EN");
  const [copied, setCopied]         = useState(false);

  const t = (en, id) => lang === "ID" ? id : en;

  const buildCopyText = () => {
    if (!resultTier || !data) return "";
    const waivePct = (resultTier.waivePctPerReason && resultReason)
      ? (resultTier.waivePctPerReason[resultReason.id] || resultTier.waivePct)
      : (resultTier.waivePct || "-");
    const lines = [
      "=== WAIVE DECISION RESULT ===",
      \`Fee Type   : \${waiveType}\`,
      \`DPD        : \${dpd} hari (\${resultTier.dpdLabel})\`,
      \`Waive %    : \${waivePct}\`,
      \`Max Amount : \${resultTier.waiveAmt || "-"}\`,
      resultReason ? \`Reason     : [\${resultReason.id}] \${lang === "ID" ? resultReason.id_text : resultReason.text}\` : "",
      resultTier.notes ? \`NOTICE     : \${resultTier.notes}\` : "",
      "",
      "--- Required Documents ---",
      ...(resultTier.docs || []).map((d, i) => \`\${i + 1}. \${d}\`),
      "",
      "© OLLA_BOT · WAIVE_MATRIX_ENGINE",
    ].filter(l => l !== null);
    return lines.join("\n");
  };

  const handleCopy = () => {
    const text = buildCopyText();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  useEffect(() => { setTimeout(() => setBootDone(true), 1200); }, []);

  const data         = waiveType ? WAIVE_DATA[waiveType] : null;
  const filteredTiers = data?.tiers?.filter(tier => {
    if (!dpd) return true;
    const n   = parseInt(dpd);
    const min = tier.dpdMin ?? 0;
    const max = tier.dpdMax ?? Infinity;
    return n >= min && n <= max;
  });
  const resultTier   = data?.tiers?.[reasonTier];
  const resultReason = resultTier?.reasons?.find(r => r.id === reasonId);

  const bump = () => setAnimKey(k => k + 1);
  const go   = (s) => { bump(); setStep(s); };

  const selectWaiveType = (type) => {
    setWaiveType(type);
    setHistory([...history, "waive_type"]);
    if (!WAIVE_DATA[type].canWaive) go("result"); else go("dpd");
  };
  const selectDpd = (val) => {
    setDpd(val); setHistory([...history, "dpd"]); go("reason");
  };
  const selectReason = (tierIdx, rId) => {
    setReasonTier(tierIdx); setReasonId(rId);
    setHistory([...history, "reason"]); go("result");
  };
  const goBack = () => {
    const prev = [...history]; const last = prev.pop();
    setHistory(prev); bump();
    if (last === "waive_type")   { setWaiveType(null); setStep("waive_type"); }
    else if (last === "dpd")     { setDpd(null); setStep("dpd"); }
    else if (last === "reason")  { setReasonTier(null); setReasonId(null); setStep("reason"); }
  };
  const reset = () => {
    bump(); setStep("waive_type"); setWaiveType(null); setDpd(null);
    setReasonTier(null); setReasonId(null); setHistory([]); setDpdInput("");
  };

  const steps    = ["waive_type", "dpd", "reason", "result"];
  const stepIdx  = steps.indexOf(step);

  const NEON  = "#00ff41";
  const CYAN  = "#00cfff";
  const RED   = "#ff2d55";
  const GOLD  = "#f7b731";
  const DIM   = "#1a2e1a";
  const BG    = "#030b03";
  const PANEL = "#060f06";
  const BORDER = "#00ff4122";

  // ── Boot screen ──
  if (!bootDone) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "monospace" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');`}</style>
        <MatrixBg />
        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <div style={{ color: NEON, fontSize: 12, letterSpacing: 4, marginBottom: 16, animation: "blink 0.8s infinite" }}>
            INITIALIZING WAIVE_MATRIX_v2.0...
          </div>
          <div style={{ color: "#3a5a3a", fontSize: 11 }}>Loading decision engine...</div>
        </div>
        <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:${BG};color:${NEON};font-family:'Share Tech Mono',monospace}
        ::selection{background:#00ff4133;color:#00ff41}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:#000}
        ::-webkit-scrollbar-thumb{background:#00ff4155;border-radius:2px}

        @keyframes scanMove{from{background-position:0 0}to{background-position:0 100px}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes popIn{0%{opacity:0;transform:scale(0.92) translateY(12px)}70%{transform:scale(1.02)}100%{opacity:1;transform:none}}
        @keyframes glitchMain{0%,90%,100%{transform:none}92%{transform:skewX(-2deg) translateX(2px)}94%{transform:skewX(1deg) translateX(-1px)}96%{transform:none}}
        @keyframes glitchR{0%,90%,100%{transform:none;opacity:0}92%{transform:translateX(3px);opacity:0.8}94%{transform:translateX(-2px);opacity:0.5}96%{opacity:0}}
        @keyframes glitchB{0%,91%,100%{transform:none;opacity:0}93%{transform:translateX(-3px);opacity:0.8}95%{transform:translateX(1px);opacity:0.4}96%{opacity:0}}
        @keyframes neonPulse{0%,100%{box-shadow:0 0 4px ${NEON}55,inset 0 0 4px ${NEON}11}50%{box-shadow:0 0 12px ${NEON}88,inset 0 0 8px ${NEON}22}}
        @keyframes scanLine{0%{top:-10%}100%{top:110%}}
        @keyframes cursor{0%,100%{opacity:1}50%{opacity:0}}

        .card{animation:popIn 0.35s cubic-bezier(.34,1.2,.64,1) both}
        .fade-item{animation:fadeIn 0.25s ease both}

        .btn-waive{
          background:${PANEL};border:1px solid ${BORDER};color:#3a6a3a;
          cursor:pointer;transition:all 0.15s;text-align:left;
          font-family:'Share Tech Mono',monospace;
        }
        .btn-waive.active:hover{
          background:#001a00;border-color:${NEON};color:${NEON};
          box-shadow:0 0 12px ${NEON}44,inset 0 0 8px ${NEON}0a;
          transform:translateX(4px);
        }
        .btn-waive.inactive:hover{
          border-color:${RED}55;color:${RED}88;
        }
        .btn-reason{
          background:${PANEL};border:1px solid ${BORDER};
          cursor:pointer;transition:all 0.15s;text-align:left;
          font-family:'Share Tech Mono',monospace;
        }
        .btn-reason:hover{
          background:#001a00;border-color:${NEON};
          box-shadow:0 0 10px ${NEON}33;transform:translateX(6px);
        }
        .btn-dpd{
          background:transparent;border:1px solid #00ff4133;color:#3a6a3a;
          cursor:pointer;font-family:'Share Tech Mono',monospace;font-size:12px;
          transition:all 0.15s;padding:6px 14px;border-radius:2px;
        }
        .btn-dpd:hover{background:#00ff410a;border-color:${NEON};color:${NEON};box-shadow:0 0 8px ${NEON}44;}
        .btn-exec{
          background:linear-gradient(135deg,#003300,#001a00);
          border:1px solid ${NEON};color:${NEON};
          cursor:pointer;font-family:'Share Tech Mono',monospace;
          transition:all 0.15s;
          animation:neonPulse 2s infinite;
        }
        .btn-exec:hover{background:#003300;box-shadow:0 0 20px ${NEON}66;}
        .btn-exec:disabled{opacity:0.3;cursor:default;animation:none;border-color:#1a3a1a;}
        input{
          background:#000;border:1px solid #00ff4133;color:${NEON};
          font-family:'Share Tech Mono',monospace;outline:none;
          transition:all 0.2s;
        }
        input:focus{border-color:${NEON};box-shadow:0 0 8px ${NEON}44;}
        input::placeholder{color:#1a4a1a;}
      `}</style>

      <Scanlines />
      <MatrixBg />

      <div style={{ minHeight: "100vh", padding: "20px 16px 60px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 620, margin: "0 auto" }}>

          {/* ── HEADER ── */}
          <div style={{ marginBottom: 28, borderBottom: `1px solid ${BORDER}`, paddingBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ fontSize: 10, color: "#3a6a3a", letterSpacing: 3, marginBottom: 6 }}>
                  OLLA_BOT // WAIVE_MATRIX_ENGINE v2.0
                </div>
                <GlitchText text="WAIVE.EXE" size={28} color={NEON} />
                <div style={{ fontSize: 10, color: "#3a6a3a", marginTop: 6, letterSpacing: 1 }}>
                  &gt; Decision tree initialized · {Object.keys(WAIVE_DATA).length} fee types loaded
                </div>
              </div>
              <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <div style={{
                  fontSize: 9, color: NEON, letterSpacing: 2, border: `1px solid ${BORDER}`,
                  padding: "3px 8px", display: "inline-block",
                }}>STEP {stepIdx + 1}/4</div>
                <div style={{ fontSize: 9, color: "#3a6a3a", letterSpacing: 1 }}>
                  {["SELECT_TYPE", "INPUT_DPD", "SELECT_REASON", "OUTPUT_RESULT"][stepIdx]}
                </div>
                <button
                  onClick={() => setLang(l => l === "EN" ? "ID" : "EN")}
                  style={{
                    background: "transparent", border: `1px solid ${NEON}55`,
                    color: NEON, cursor: "pointer", padding: "3px 10px",
                    fontSize: 10, fontFamily: "monospace", letterSpacing: 2,
                    transition: "all 0.15s", borderRadius: 2,
                    boxShadow: lang === "ID" ? `0 0 8px ${NEON}55` : "none",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = NEON; e.currentTarget.style.boxShadow = `0 0 8px ${NEON}55`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = `${NEON}55`; e.currentTarget.style.boxShadow = lang === "ID" ? `0 0 8px ${NEON}55` : "none"; }}
                >
                  [{lang === "EN" ? "EN→ID" : "ID→EN"}]
                </button>
              </div>
            </div>

            {/* Progress */}
            <div style={{ marginTop: 16 }}>
              <ProgressBar current={stepIdx + 1} total={4} />
              <div style={{ display: "flex", gap: 4 }}>
                {["TYPE", "DPD", "REASON", "RESULT"].map((s, i) => (
                  <div key={s} style={{
                    flex: 1, height: 2,
                    background: i <= stepIdx ? NEON : "#0a1a0a",
                    boxShadow: i <= stepIdx ? `0 0 6px ${NEON}` : "none",
                    transition: "all 0.4s",
                  }} />
                ))}
              </div>
              <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                {["TYPE", "DPD", "REASON", "RESULT"].map((s, i) => (
                  <div key={s} style={{
                    flex: 1, fontSize: 8, color: i === stepIdx ? NEON : "#1a3a1a",
                    letterSpacing: 1, fontFamily: "monospace",
                  }}>{s}</div>
                ))}
              </div>
            </div>
          </div>

          {/* ── MAIN CARD ── */}
          <div key={animKey} className="card" style={{
            background: PANEL,
            border: `1px solid ${BORDER}`,
            padding: "22px 20px",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Corner decorations */}
            {[{t:0,l:0},{t:0,r:0},{b:0,l:0},{b:0,r:0}].map((pos,i) => (
              <div key={i} style={{
                position:"absolute",width:10,height:10,
                borderTop: (pos.t===0) ? `2px solid ${NEON}` : "none",
                borderBottom: (pos.b===0) ? `2px solid ${NEON}` : "none",
                borderLeft: (pos.l===0) ? `2px solid ${NEON}` : "none",
                borderRight: (pos.r===0) ? `2px solid ${NEON}` : "none",
                top: pos.t===0 ? 6 : "auto", bottom: pos.b===0 ? 6 : "auto",
                left: pos.l===0 ? 6 : "auto", right: pos.r===0 ? 6 : "auto",
              }}/>
            ))}

            {/* Scan line sweep */}
            <div style={{
              position:"absolute",left:0,right:0,height:2,
              background:`linear-gradient(90deg,transparent,${NEON}33,transparent)`,
              animation:"scanLine 3s linear infinite",pointerEvents:"none",
            }}/>

            {/* ── STEP 1: TYPE SELECT ── */}
            {step === "waive_type" && (
              <div>
                <TermLine prefix="$" text="SELECT_FEE_TYPE --interactive" />
                <TermLine prefix=">" text="Choose waive category to evaluate:" color="#3a6a3a" />
                <div style={{ height: 1, background: BORDER, margin: "14px 0" }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {Object.entries(WAIVE_DATA).map(([type, d], i) => (
                    <button key={type}
                      className={`btn-waive ${d.canWaive ? "active" : "inactive"} fade-item`}
                      onClick={() => selectWaiveType(type)}
                      style={{
                        padding: "12px 14px", borderRadius: 2,
                        animationDelay: `${i * 0.07}s`,
                        borderColor: d.canWaive ? BORDER : `${RED}22`,
                      }}
                    >
                      <div style={{ fontSize: 9, color: d.canWaive ? "#3a6a3a" : "#4a1a1a", marginBottom: 4, letterSpacing: 2 }}>
                        [{d.tag}]
                      </div>
                      <div style={{ fontSize: 13, color: d.canWaive ? "#5a9a5a" : "#4a2a2a", fontWeight: "bold", marginBottom: 3 }}>
                        {d.icon} {type}
                      </div>
                      <div style={{ fontSize: 9, letterSpacing: 1, color: d.canWaive ? "#00ff4166" : "#ff2d5555" }}>
                        {d.canWaive ? "STATUS: WAIVABLE" : "STATUS: NOT_ELIGIBLE"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 2: DPD INPUT ── */}
            {step === "dpd" && (
              <div>
                <TermLine prefix="$" text={`fee_type="${waiveType}" dpd=?`} />
                <TermLine prefix=">" text="Input Days Past Due (integer):" color="#3a6a3a" />
                <div style={{ height: 1, background: BORDER, margin: "14px 0" }} />

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 9, color: "#3a6a3a", letterSpacing: 2, marginBottom: 8 }}>// QUICK SELECT</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {[1, 2, 3, 5, 7, 14, 30, 60].map((p, i) => (
                      <button key={p} className="btn-dpd fade-item"
                        onClick={() => selectDpd(p)}
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        DPD_{p}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ height: 1, background: BORDER, margin: "14px 0" }} />
                <div style={{ fontSize: 9, color: "#3a6a3a", letterSpacing: 2, marginBottom: 8 }}>// MANUAL INPUT</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ color: NEON, fontSize: 14 }}>›</span>
                  <input
                    type="number" min={1} max={999}
                    placeholder="dpd_value..."
                    value={dpdInput}
                    onChange={e => setDpdInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && dpdInput && selectDpd(parseInt(dpdInput))}
                    style={{ flex: 1, padding: "10px 12px", fontSize: 14, borderRadius: 2 }}
                  />
                  <button className="btn-exec"
                    onClick={() => dpdInput && selectDpd(parseInt(dpdInput))}
                    disabled={!dpdInput}
                    style={{ padding: "10px 18px", fontSize: 13, borderRadius: 2 }}
                  >EXEC →</button>
                </div>
              </div>
            )}

            {/* ── STEP 3: REASON ── */}
            {step === "reason" && (
              <div>
                <TermLine prefix="$" text={`evaluate --type="${waiveType}" --dpd=${dpd}`} />
                <TermLine prefix=">" text={`DPD=${dpd} · Matching eligible tiers...`} color="#3a6a3a" />
                <div style={{ height: 1, background: BORDER, margin: "14px 0" }} />

                {!filteredTiers?.length ? (
                  <NotEligible reason={`DPD=${dpd} tidak memenuhi threshold minimum untuk tier manapun.`} onReset={reset} />
                ) : (
                  filteredTiers.map((tier, tIdx) => {
                    const actualIdx = data.tiers.indexOf(tier);
                    return (
                      <div key={tIdx} style={{ marginBottom: 20 }}>
                        <div style={{
                          display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
                        }}>
                          <div style={{ height: 1, flex: 1, background: `${tier.badgeColor}33` }} />
                          <span style={{
                            fontSize: 9, color: tier.badgeColor, letterSpacing: 2,
                            border: `1px solid ${tier.badgeColor}55`, padding: "2px 8px",
                            fontFamily: "monospace",
                          }}>{tier.tag} · {tier.dpdLabel}</span>
                          <div style={{ height: 1, flex: 1, background: `${tier.badgeColor}33` }} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {tier.reasons.map((r, ri) => (
                            <button key={r.id} className="btn-reason fade-item"
                              onClick={() => selectReason(actualIdx, r.id)}
                              style={{
                                padding: "10px 12px", borderRadius: 2,
                                animationDelay: `${ri * 0.06}s`,
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                                <span style={{
                                  minWidth: 22, color: NEON, fontSize: 12,
                                  fontFamily: "monospace", opacity: 0.5, marginTop: 1,
                                }}>[{r.id.toString().padStart(2, "0")}]</span>
                                <div>
                                  <div style={{ fontSize: 12, color: "#5a9a5a", marginBottom: 2 }}>
                                    {r.icon} {lang === "ID" ? r.id_text : r.text}
                                  </div>
                                  <div style={{ fontSize: 10, color: "#2a5a2a", letterSpacing: 0.5 }}>
                                    // {lang === "ID" ? r.text : r.id_text}
                                  </div>
                                </div>
                                <span style={{ marginLeft: "auto", color: "#1a4a1a", fontSize: 14 }}>›</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── STEP 4: RESULT ── */}
            {step === "result" && (
              <div>
                {!data?.canWaive ? (
                  <NotEligible
                    reason={`${waiveType} → canWaive: false. Tipe ini tidak dapat di-waive sesuai kebijakan.`}
                    onReset={reset}
                  />
                ) : (
                  <>
                    {/* Eligible header */}
                    <div style={{
                      border: `1px solid ${NEON}`,
                      background: "#001a00",
                      padding: "14px 16px", marginBottom: 18,
                      boxShadow: `0 0 20px ${NEON}22, inset 0 0 20px ${NEON}08`,
                      position: "relative", overflow: "hidden",
                    }}>
                      <div style={{
                        position: "absolute", top: 0, left: 0, right: 0, height: 1,
                        background: `linear-gradient(90deg,transparent,${NEON},transparent)`,
                      }} />
                      <div style={{ fontSize: 9, color: "#3a6a3a", letterSpacing: 3, marginBottom: 6 }}>
                        OUTPUT · WAIVE_ENGINE
                      </div>
                      <div style={{
                        fontFamily: "'Orbitron', monospace", fontSize: 20,
                        color: NEON, letterSpacing: 2,
                        textShadow: `0 0 10px ${NEON}, 0 0 30px ${NEON}55`,
                      }}>
                        ✓ ELIGIBLE · APPROVED
                      </div>
                      <div style={{ fontSize: 10, color: "#3a8a3a", marginTop: 4, letterSpacing: 1 }}>
                        &gt; {t("Customer qualifies for waive approval", "Customer memenuhi syarat untuk mendapatkan waive")}
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                      {[
                        { key: "FEE_TYPE",  val: waiveType,    c: CYAN },
                        { key: "DPD_VALUE", val: `${dpd} hari (${resultTier?.dpdLabel})`, c: GOLD },
                        { key: "WAIVE_PCT", val: (resultTier?.waivePctPerReason && resultReason)
                            ? (resultTier.waivePctPerReason[resultReason.id] || resultTier.waivePct)
                            : (resultTier?.waivePct || "–"), c: NEON },
                        { key: "MAX_AMNT",  val: resultTier?.waiveAmt || "–", c: "#aa88ff" },
                      ].map((item, i) => (
                        <div key={i} className="fade-item" style={{
                          background: "#000", border: `1px solid ${item.c}33`,
                          padding: "10px 12px", borderRadius: 2,
                          animationDelay: `${i * 0.08}s`,
                        }}>
                          <div style={{ fontSize: 9, color: `${item.c}77`, letterSpacing: 2, marginBottom: 4 }}>
                            {item.key}
                          </div>
                          <div style={{
                            fontSize: 13, color: item.c, fontFamily: "monospace",
                            textShadow: `0 0 8px ${item.c}55`,
                          }}>{item.val}</div>
                        </div>
                      ))}
                    </div>

                    {/* Selected reason */}
                    {resultReason && (
                      <div className="fade-item" style={{
                        background: "#000", border: `1px solid ${BORDER}`,
                        padding: "12px 14px", marginBottom: 14,
                        animationDelay: "0.32s",
                      }}>
                        <div style={{ fontSize: 9, color: "#3a6a3a", letterSpacing: 2, marginBottom: 8 }}>
                          MATCHED_REASON
                        </div>
                        <div style={{ fontSize: 12, color: "#5a9a5a", marginBottom: 4 }}>
                          [{resultReason.id.toString().padStart(2,"0")}] {resultReason.icon} {resultReason.text}
                        </div>
                        <div style={{ fontSize: 10, color: "#2a5a2a" }}>// {resultReason.id_text}</div>
                      </div>
                    )}

                    {/* Warning note */}
                    {resultTier?.notes && (
                      <div className="fade-item" style={{
                        background: "#1a0800", border: `1px solid ${GOLD}44`,
                        padding: "10px 14px", marginBottom: 14, fontSize: 11,
                        color: GOLD, animationDelay: "0.38s",
                        boxShadow: `0 0 8px ${GOLD}22`,
                      }}>
                        ⚠ NOTICE: {resultTier.notes}
                      </div>
                    )}

                    {/* Documents */}
                    {resultTier?.docs && (
                      <div className="fade-item" style={{ animationDelay: "0.44s" }}>
                        <div style={{ fontSize: 9, color: "#3a6a3a", letterSpacing: 2, marginBottom: 10 }}>
                          REQUIRED_DOCS[] = [
                        </div>
                        {resultTier.docs.map((doc, i) => (
                          <div key={i} style={{
                            display: "flex", gap: 10, marginBottom: 6, paddingLeft: 12,
                          }}>
                            <span style={{ color: "#1a5a1a", fontSize: 11, minWidth: 22, fontFamily: "monospace" }}>
                              {i},
                            </span>
                            <span style={{ fontSize: 11, color: "#3a7a3a", letterSpacing: 0.3 }}>{doc}</span>
                          </div>
                        ))}
                        <div style={{ fontSize: 9, color: "#3a6a3a", letterSpacing: 2, marginTop: 4 }}>]</div>
                      </div>
                    )}

                    {/* Copy + Reset */}
                    <div style={{ display: "flex", gap: 8, marginTop: 20 }} className="fade-item">
                      <button onClick={handleCopy} style={{
                        flex: 1, padding: "13px", fontSize: 12, borderRadius: 2,
                        letterSpacing: 2, fontFamily: "monospace", cursor: "pointer",
                        background: copied ? "#003300" : "transparent",
                        border: `1px solid ${copied ? NEON : NEON + "55"}`,
                        color: copied ? NEON : NEON + "99",
                        transition: "all 0.2s",
                        boxShadow: copied ? `0 0 12px ${NEON}55` : "none",
                        animationDelay: "0.52s",
                      }}>
                        {copied ? "✓ COPIED!" : "$ ./copy_result.sh"}
                      </button>
                      <button className="btn-exec" onClick={reset} style={{
                        flex: 1, padding: "13px", fontSize: 12,
                        borderRadius: 2, letterSpacing: 2,
                        animationDelay: "0.56s",
                      }}>
                        $ ./reset.sh
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── NAV ── */}
          {step !== "waive_type" && step !== "result" && (
            <div style={{ marginTop: 10 }}>
              <button onClick={goBack} style={{
                background: "transparent", border: `1px solid ${BORDER}`,
                color: "#3a6a3a", cursor: "pointer", padding: "6px 14px",
                fontSize: 11, fontFamily: "monospace", letterSpacing: 1,
                transition: "all 0.15s", borderRadius: 2,
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = NEON; e.currentTarget.style.color = NEON; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = "#3a6a3a"; }}
              >
                ← BACK
              </button>
            </div>
          )}

          {/* ── FOOTER ── */}
          <div style={{
            textAlign: "center", marginTop: 28, paddingTop: 14,
            borderTop: `1px solid ${BORDER}`,
          }}>
            <span style={{ fontSize: 9, color: "#1a4a1a", letterSpacing: 3, fontFamily: "monospace" }}>
              © OLLA_BOT · WAIVE_MATRIX_ENGINE · ALL RIGHTS RESERVED
            </span>
          </div>

        </div>
      </div>
    </>
  );
}

// ─── NOT ELIGIBLE ──
function NotEligible({ reason, onReset }) {
  return (
    <div style={{ textAlign: "center", padding: "16px 0" }}>
      <div style={{
        border: "1px solid #ff2d5544", background: "#0f0000",
        padding: "16px 20px", marginBottom: 20,
        boxShadow: "0 0 20px #ff2d5522",
      }}>
        <div style={{
          fontFamily: "'Orbitron',monospace", fontSize: 18,
          color: "#ff2d55", letterSpacing: 2, marginBottom: 6,
          textShadow: "0 0 10px #ff2d55",
        }}>
          ✕ NOT_ELIGIBLE
        </div>
        <div style={{ fontSize: 10, color: "#5a2a2a", letterSpacing: 1, lineHeight: 1.6 }}>
          ERROR: {reason}
        </div>
      </div>
      <button onClick={onReset} style={{
        background: "#0f0000", border: "1px solid #ff2d5566",
        color: "#ff2d55", cursor: "pointer", padding: "10px 24px",
        fontSize: 12, fontFamily: "monospace", letterSpacing: 2,
        transition: "all 0.15s", borderRadius: 2,
      }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 12px #ff2d5544"; e.currentTarget.style.background = "#1a0000"; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "#0f0000"; }}
      >
        $ ./retry.sh
      </button>
    </div>
  );
}
