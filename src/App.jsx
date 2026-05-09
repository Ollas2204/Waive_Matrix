import { useState, useEffect } from "react";

const WAIVE_DATA = {
  "Overdue Fees": {
    icon: "⏰", canWaive: true,
    gradient: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    tiers: [
      {
        label: "Hard Reasons", labelId: "Alasan Berat",
        accent: "#f43f5e", accentLight: "rgba(244,63,94,0.15)",
        dpdMin: 2, dpdMax: null, dpdLabel: "DPD ≥ 2",
        reasons: [
          { id: 1, icon: "🕊️", text: "Death", id_text: "Meninggal" },
          { id: 2, icon: "🏥", text: "Hard Sick (Stroke/Coma/Cancer/Covid) / Hard Accident / Long-term Sick", id_text: "Sakit Keras / Kecelakaan Berat / Sakit Jangka Panjang" },
          { id: 3, icon: "⚡", text: "Pending Payment – System Error", id_text: "Pending Payment karena System Error" },
          { id: 4, icon: "📋", text: "Terminated / Job Loss / Bankruptcy", id_text: "PHK / Kehilangan Pekerjaan / Bangkrut" },
          { id: 5, icon: "🌊", text: "Natural Disaster (Flood/Earthquake/Fire)", id_text: "Bencana Alam (Banjir/Gempa/Kebakaran)" },
          { id: 6, icon: "👨‍👩‍👧", text: "Close Family Sick (Mother/Spouse/Child/Parent)", id_text: "Keluarga Dekat Sakit (Ibu/Suami/Anak/Ortu)" },
          { id: 7, icon: "🎯", text: "Crash Program – Internal Collection", id_text: "Program Khusus Internal Collection (jika ada)" },
        ],
        waivePct: "100%", waiveAmt: "Rp 80.000",
        docs: ["Death Certificate / Surat Kematian","Official Certificate from Hospital / Specialist Doctor","Photo from Cboss & proof of payment","Termination letter from company / Surat PHK","Official announcement from government or mass media","Certificate of illness/hospitalization from hospital or doctor","Official emails from Local or Regional"],
      },
      {
        label: "Soft Reasons", labelId: "Alasan Ringan",
        accent: "#f59e0b", accentLight: "rgba(245,158,11,0.15)",
        dpdMin: 3, dpdMax: null, dpdLabel: "DPD > 2",
        reasons: [
          { id: 1, icon: "🤧", text: "Temporary Sick (Flu/Fever)", id_text: "Sakit Ringan (Demam/Flu/Batuk)" },
          { id: 2, icon: "📉", text: "Downgrade in Job", id_text: "Jabatan di Downgrade" },
          { id: 3, icon: "💸", text: "Decreased Revenue/Omzet (Self-employed)", id_text: "Omzet Menurun (Wiraswasta)" },
          { id: 4, icon: "🏦", text: "Run Out Money – Paid to Other Agencies", id_text: "Penghasilan Minim / Tagihan di Perusahaan Lain" },
          { id: 5, icon: "🎯", text: "Crash Program – Internal Collection", id_text: "Program Khusus Internal Collection (jika ada)" },
        ],
        waivePctPerReason: {1:"Max 50%",2:"Max 80%",3:"Max 80%",4:"Max 50%",5:"Max 100%"},
        waivePct: "50%–100%", waiveAmt: "Rp 64.000 (max)",
        docs: ["Official Certificate from Hospital / Specialist Doctor","Downgrade letter from company / Surat Downgrade","Certificate of incapacity from RT","Invoices or Loan Letters from related financial services","Official emails from Local or Regional"],
      },
    ],
  },
  "Payment Fee": {
    icon: "💳", canWaive: true,
    gradient: "linear-gradient(135deg,#06b6d4,#3b82f6)",
    tiers: [
      {
        label: "Hard Reasons", labelId: "Alasan Berat",
        accent: "#f43f5e", accentLight: "rgba(244,63,94,0.15)",
        dpdMin: 0, dpdMax: null, dpdLabel: "All DPD",
        reasons: [
          { id: 1, icon: "🕊️", text: "Death", id_text: "Meninggal" },
          { id: 2, icon: "🏥", text: "Hard Sick (Stroke/Coma/Cancer/Covid) / Hard Accident / Long-term Sick", id_text: "Sakit Keras / Kecelakaan Berat / Sakit Jangka Panjang" },
          { id: 3, icon: "⚡", text: "System Error", id_text: "Sistem Error" },
          { id: 4, icon: "📋", text: "Terminated from Work / Job Loss", id_text: "PHK / Kehilangan Pekerjaan" },
          { id: 5, icon: "🌊", text: "Natural Disaster (Flood/Earthquake/Fire)", id_text: "Bencana Alam (Banjir/Gempa/Kebakaran)" },
          { id: 6, icon: "📢", text: "Hard Complaint to Social Media & OJK", id_text: "Komplain Berat ke Social Media atau OJK" },
          { id: 7, icon: "🎯", text: "Crash Program (Conditional)", id_text: "Program Khusus (Kondisional)" },
        ],
        waivePct: "Max 100%", waiveAmt: "—",
        notes: "Waive hanya berlaku selama periode alasan. Wajib Approval SPV & Manager.",
        docs: ["Death Certificate / Surat Kematian","Official Certificate from Hospital / Specialist Doctor","Photo from Cboss & proof of payment","Termination letter from company / Surat PHK","Official announcement from government or mass media","Evidence of news in mass media or email from OJK","Official emails from Local or Regional"],
      },
    ],
  },
  "Membership Fee": { icon: "🪪", canWaive: false, gradient: "linear-gradient(135deg,#64748b,#475569)" },
  "Service Fee":    { icon: "🔧", canWaive: false, gradient: "linear-gradient(135deg,#64748b,#475569)" },
  "Interest":       { icon: "📊", canWaive: false, gradient: "linear-gradient(135deg,#64748b,#475569)" },
  "Principal":      { icon: "🏛️", canWaive: false, gradient: "linear-gradient(135deg,#64748b,#475569)" },
};

const STEP_LABELS = ["Tipe Fee","DPD","Alasan","Hasil"];
const STEP_COLORS = ["#6366f1","#06b6d4","#8b5cf6","#10b981"];

export default function App() {
  const [step, setStep]             = useState(0);
  const [waiveType, setWaiveType]   = useState(null);
  const [dpd, setDpd]               = useState(null);
  const [reasonTier, setReasonTier] = useState(null);
  const [reasonId, setReasonId]     = useState(null);
  const [dpdInput, setDpdInput]     = useState("");
  const [lang, setLang]             = useState("ID");
  const [copied, setCopied]         = useState(false);
  const [animKey, setAnimKey]       = useState(0);

  const data          = waiveType ? WAIVE_DATA[waiveType] : null;
  const filteredTiers = data?.tiers?.filter(tier => {
    if (!dpd) return true;
    const n = parseInt(dpd);
    return n >= (tier.dpdMin ?? 0) && n <= (tier.dpdMax ?? Infinity);
  });
  const resultTier   = data?.tiers?.[reasonTier];
  const resultReason = resultTier?.reasons?.find(r => r.id === reasonId);
  const waivePct     = (resultTier?.waivePctPerReason && resultReason)
    ? (resultTier.waivePctPerReason[resultReason.id] || resultTier.waivePct)
    : (resultTier?.waivePct || "—");

  const T = (en, id) => lang === "ID" ? id : en;

  const go = (s) => { setAnimKey(k => k+1); setStep(s); };

  const reset = () => {
    setWaiveType(null); setDpd(null); setReasonTier(null);
    setReasonId(null); setDpdInput(""); go(0);
  };

  const selectType   = (type) => { setWaiveType(type); go(WAIVE_DATA[type].canWaive ? 1 : 3); };
  const selectDpd    = (val)  => { setDpd(val); go(2); };
  const selectReason = (tIdx, rId) => { setReasonTier(tIdx); setReasonId(rId); go(3); };

  const handleCopy = () => {
    if (!resultTier) return;
    const lines = [
      "=== WAIVE DECISION RESULT ===",
      "Fee Type   : " + waiveType,
      "DPD        : " + dpd + " hari (" + resultTier.dpdLabel + ")",
      "Waive %    : " + waivePct,
      "Max Amount : " + (resultTier.waiveAmt || "—"),
      resultReason ? ("Reason : [" + resultReason.id + "] " + (lang==="ID" ? resultReason.id_text : resultReason.text)) : "",
      resultTier.notes ? ("NOTICE : " + resultTier.notes) : "",
      "", "--- Dokumen ---",
      ...(resultTier.docs||[]).map((d,i) => (i+1)+". "+d),
      "", "© Olla Bot — Waive Matrix",
    ].filter(Boolean);
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  const accentColor = STEP_COLORS[step];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans',sans-serif;background:#0d0d1a;color:#f1f5f9;min-height:100vh}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes glow{0%,100%{opacity:0.5}50%{opacity:1}}
        .fade-up{animation:fadeUp 0.3s cubic-bezier(.34,1.2,.64,1) both}
        .slide-in{animation:slideIn 0.22s ease both}

        .btn-type{
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.08);
          border-radius:14px;padding:16px 18px;
          text-align:left;width:100%;cursor:pointer;
          transition:all 0.18s;color:#f1f5f9;
          font-family:'Plus Jakarta Sans',sans-serif;
        }
        .btn-type:hover{
          background:rgba(255,255,255,0.09);
          border-color:rgba(255,255,255,0.2);
          transform:translateY(-2px);
          box-shadow:0 8px 24px rgba(0,0,0,0.3);
        }
        .btn-reason{
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.08);
          border-radius:12px;padding:14px 16px;
          text-align:left;width:100%;cursor:pointer;
          transition:all 0.18s;color:#f1f5f9;
          font-family:'Plus Jakarta Sans',sans-serif;
        }
        .btn-reason:hover{
          background:rgba(255,255,255,0.08);
          border-color:rgba(255,255,255,0.18);
          transform:translateX(6px);
        }
        .btn-dpd{
          background:rgba(255,255,255,0.05);
          border:1px solid rgba(255,255,255,0.1);
          border-radius:10px;padding:9px 18px;
          font-size:15px;font-weight:700;color:#cbd5e1;
          cursor:pointer;transition:all 0.15s;
          font-family:'Plus Jakarta Sans',sans-serif;
        }
        .btn-dpd:hover{
          background:rgba(255,255,255,0.12);
          color:#fff;border-color:rgba(255,255,255,0.25);
          transform:translateY(-2px);
        }
        input[type=number]{
          background:rgba(255,255,255,0.06);
          border:1px solid rgba(255,255,255,0.12);
          border-radius:12px;padding:13px 18px;
          font-size:16px;color:#f1f5f9;outline:none;
          width:100%;transition:all 0.2s;
          font-family:'Plus Jakarta Sans',sans-serif;
          font-weight:600;
        }
        input[type=number]:focus{
          border-color:rgba(255,255,255,0.35);
          background:rgba(255,255,255,0.09);
          box-shadow:0 0 0 3px rgba(255,255,255,0.05);
        }
        input::placeholder{color:rgba(255,255,255,0.25);font-weight:400}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:10px}
      `}</style>

      {/* BG blobs */}
      <div style={{position:"fixed",inset:0,overflow:"hidden",zIndex:0,pointerEvents:"none"}}>
        <div style={{position:"absolute",top:"-20%",left:"-10%",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(99,102,241,0.18) 0%,transparent 70%)"}}/>
        <div style={{position:"absolute",bottom:"-15%",right:"-10%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(139,92,246,0.15) 0%,transparent 70%)"}}/>
        <div style={{position:"absolute",top:"40%",right:"20%",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(6,182,212,0.1) 0%,transparent 70%)"}}/>
      </div>

      <div style={{minHeight:"100vh",padding:"28px 16px 80px",position:"relative",zIndex:1}}>
        <div style={{maxWidth:580,margin:"0 auto"}}>

          {/* Header */}
          <div style={{marginBottom:32,display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
            <div>
              <div style={{
                display:"inline-flex",alignItems:"center",gap:8,
                background:"rgba(99,102,241,0.15)",border:"1px solid rgba(99,102,241,0.3)",
                borderRadius:100,padding:"4px 14px",marginBottom:12,
              }}>
                <span style={{fontSize:10,fontWeight:700,color:"#a5b4fc",letterSpacing:2,textTransform:"uppercase"}}>Olla Bot</span>
              </div>
              <h1 style={{
                fontSize:30,fontWeight:800,letterSpacing:-0.5,
                background:"linear-gradient(135deg,#e0e7ff,#c7d2fe,#a5b4fc)",
                WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
              }}>Waive Matrix 🎯</h1>
              <p style={{fontSize:14,color:"rgba(255,255,255,0.45)",marginTop:6,fontWeight:500}}>
                {T("Determine waive eligibility step by step","Tentukan eligibilitas waive langkah demi langkah")}
              </p>
            </div>

            {/* Lang + Reset */}
            <div style={{display:"flex",flexDirection:"column",gap:8,alignItems:"flex-end"}}>
              <button onClick={() => setLang(l => l==="ID"?"EN":"ID")} style={{
                background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",
                borderRadius:10,padding:"7px 14px",fontSize:13,fontWeight:700,color:"#e2e8f0",
                cursor:"pointer",transition:"all 0.15s",fontFamily:"inherit",
              }}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.12)"}}
                onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.07)"}}
              >
                {lang==="ID"?"🇮🇩 ID":"🇬🇧 EN"}
              </button>
              {step > 0 && (
                <button onClick={reset} style={{
                  background:"transparent",border:"none",
                  fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.3)",
                  cursor:"pointer",fontFamily:"inherit",
                }}
                  onMouseEnter={e=>{e.currentTarget.style.color="rgba(255,255,255,0.6)"}}
                  onMouseLeave={e=>{e.currentTarget.style.color="rgba(255,255,255,0.3)"}}
                >↺ Reset</button>
              )}
            </div>
          </div>

          {/* Step bar */}
          <div style={{display:"flex",gap:0,marginBottom:28,background:"rgba(255,255,255,0.04)",borderRadius:14,padding:6}}>
            {STEP_LABELS.map((s,i) => (
              <div key={s} style={{
                flex:1,textAlign:"center",padding:"8px 4px",borderRadius:10,
                background: i===step ? "rgba(255,255,255,0.1)" : "transparent",
                transition:"all 0.3s",
              }}>
                <div style={{
                  fontSize:11,fontWeight:700,letterSpacing:0.5,
                  color: i<step ? "#10b981" : i===step ? STEP_COLORS[i] : "rgba(255,255,255,0.25)",
                }}>
                  {i<step ? "✓ " : (i+1)+". "}{s}
                </div>
              </div>
            ))}
          </div>

          {/* Main card */}
          <div key={animKey} className="fade-up" style={{
            background:"rgba(255,255,255,0.05)",
            border:"1px solid rgba(255,255,255,0.1)",
            borderRadius:20,padding:"28px 24px",
            backdropFilter:"blur(20px)",
            boxShadow:"0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}>

            {/* Top accent line */}
            <div style={{
              height:3,borderRadius:100,
              background: data?.gradient || `linear-gradient(90deg,${accentColor},${accentColor}88)`,
              marginBottom:22,
              boxShadow: "0 0 12px " + accentColor + "66",
            }}/>

            {/* STEP 0 */}
            {step===0 && (
              <div>
                <h2 style={{fontSize:20,fontWeight:800,marginBottom:4,color:"#f1f5f9"}}>
                  {T("Select Fee Type","Pilih Tipe Fee")} 🗂️
                </h2>
                <p style={{fontSize:14,color:"rgba(255,255,255,0.45)",marginBottom:22,fontWeight:500}}>
                  {T("Which fee type is being evaluated?","Tipe fee apa yang sedang dievaluasi?")}
                </p>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {Object.entries(WAIVE_DATA).map(([type,d],i)=>(
                    <button key={type} className="btn-type slide-in"
                      onClick={()=>selectType(type)}
                      style={{animationDelay:i*0.06+"s"}}
                    >
                      <div style={{display:"flex",alignItems:"center",gap:14}}>
                        <div style={{
                          width:44,height:44,borderRadius:12,flexShrink:0,
                          background:d.gradient||"rgba(255,255,255,0.1)",
                          display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,
                        }}>{d.icon}</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:15,fontWeight:700,color:"#f1f5f9",marginBottom:3}}>{type}</div>
                          <div style={{fontSize:12,fontWeight:600,color: d.canWaive?"#34d399":"#f87171"}}>
                            {d.canWaive ? T("✓ Eligible for waive","✓ Dapat di-waive") : T("✕ Cannot be waived","✕ Tidak dapat di-waive")}
                          </div>
                        </div>
                        <span style={{color:"rgba(255,255,255,0.2)",fontSize:20}}>›</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 1 */}
            {step===1 && (
              <div>
                <h2 style={{fontSize:20,fontWeight:800,marginBottom:4,color:"#f1f5f9"}}>
                  {T("Days Past Due","Berapa Hari DPD?")} 📅
                </h2>
                <p style={{fontSize:14,color:"rgba(255,255,255,0.45)",marginBottom:22,fontWeight:500}}>
                  {waiveType} · {T("Enter days overdue","Masukkan jumlah hari keterlambatan")}
                </p>
                <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:20}}>
                  {[1,2,3,5,7,14,30,60].map((p,i)=>(
                    <button key={p} className="btn-dpd slide-in"
                      onClick={()=>selectDpd(p)}
                      style={{animationDelay:i*0.05+"s"}}
                    >{p} {T("days","hari")}</button>
                  ))}
                </div>
                <div style={{display:"flex",gap:10}}>
                  <input type="number" min={1} max={999}
                    placeholder={T("Or type DPD number...","Atau ketik angka DPD...")}
                    value={dpdInput}
                    onChange={e=>setDpdInput(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&dpdInput&&selectDpd(parseInt(dpdInput))}
                  />
                  <button onClick={()=>dpdInput&&selectDpd(parseInt(dpdInput))}
                    disabled={!dpdInput}
                    style={{
                      padding:"13px 22px",borderRadius:12,border:"none",
                      background:dpdInput?"linear-gradient(135deg,#06b6d4,#3b82f6)":"rgba(255,255,255,0.08)",
                      color:dpdInput?"#fff":"rgba(255,255,255,0.3)",
                      fontSize:15,fontWeight:700,cursor:dpdInput?"pointer":"default",
                      fontFamily:"inherit",transition:"all 0.2s",flexShrink:0,
                      boxShadow:dpdInput?"0 4px 16px rgba(6,182,212,0.4)":"none",
                    }}
                  >{T("Next","Lanjut")} →</button>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step===2 && (
              <div>
                <h2 style={{fontSize:20,fontWeight:800,marginBottom:4,color:"#f1f5f9"}}>
                  {T("Customer's Reason","Alasan Customer")} 💬
                </h2>
                <p style={{fontSize:14,color:"rgba(255,255,255,0.45)",marginBottom:22,fontWeight:500}}>
                  {waiveType} · DPD <span style={{color:"#06b6d4",fontWeight:700}}>{dpd}</span> {T("days","hari")}
                </p>
                {!filteredTiers?.length ? (
                  <NotEligible reason={T("DPD does not meet minimum threshold.","DPD tidak memenuhi syarat minimum untuk tier manapun.")} onReset={reset} T={T}/>
                ) : filteredTiers.map((tier,tIdx)=>{
                  const actualIdx = data.tiers.indexOf(tier);
                  return (
                    <div key={tIdx} style={{marginBottom:20}}>
                      <div style={{
                        display:"inline-flex",alignItems:"center",gap:8,
                        background:tier.accentLight,border:"1px solid "+tier.accent+"44",
                        borderRadius:100,padding:"5px 14px",marginBottom:12,
                      }}>
                        <span style={{fontSize:12,fontWeight:700,color:tier.accent}}>
                          {lang==="ID"?tier.labelId:tier.label}
                        </span>
                        <span style={{fontSize:11,color:tier.accent+"99",fontWeight:500}}>· {tier.dpdLabel}</span>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:7}}>
                        {tier.reasons.map((r,ri)=>(
                          <button key={r.id} className="btn-reason slide-in"
                            onClick={()=>selectReason(actualIdx,r.id)}
                            style={{animationDelay:ri*0.06+"s"}}
                          >
                            <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                              <div style={{
                                width:36,height:36,borderRadius:10,flexShrink:0,
                                background:tier.accentLight,display:"flex",
                                alignItems:"center",justifyContent:"center",fontSize:18,
                              }}>{r.icon}</div>
                              <div style={{flex:1}}>
                                <div style={{fontSize:14,fontWeight:700,color:"#f1f5f9",marginBottom:2,lineHeight:1.4}}>
                                  {lang==="ID"?r.id_text:r.text}
                                </div>
                                <div style={{fontSize:12,color:"rgba(255,255,255,0.35)",lineHeight:1.4}}>
                                  {lang==="ID"?r.text:r.id_text}
                                </div>
                              </div>
                              <span style={{color:"rgba(255,255,255,0.2)",fontSize:18,flexShrink:0}}>›</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* STEP 3 */}
            {step===3 && (
              <div>
                {!data?.canWaive ? (
                  <NotEligible
                    reason={T(waiveType+" cannot be waived per policy.",waiveType+" tidak dapat di-waive sesuai kebijakan.")}
                    onReset={reset} T={T}
                  />
                ) : (
                  <>
                    {/* Eligible banner */}
                    <div style={{
                      background:"linear-gradient(135deg,rgba(16,185,129,0.15),rgba(5,150,105,0.1))",
                      border:"1px solid rgba(16,185,129,0.3)",
                      borderRadius:14,padding:"16px 18px",marginBottom:20,
                      display:"flex",alignItems:"center",gap:14,
                    }}>
                      <div style={{
                        width:52,height:52,borderRadius:"50%",flexShrink:0,
                        background:"linear-gradient(135deg,#10b981,#059669)",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:24,boxShadow:"0 4px 16px rgba(16,185,129,0.4)",
                      }}>✓</div>
                      <div>
                        <div style={{fontSize:18,fontWeight:800,color:"#34d399",letterSpacing:-0.3}}>
                          {T("Eligible for Waive! 🎉","Eligible untuk Waive! 🎉")}
                        </div>
                        <div style={{fontSize:13,color:"rgba(52,211,153,0.7)",marginTop:3,fontWeight:500}}>
                          {T("Customer qualifies for waive approval","Customer memenuhi syarat untuk mendapatkan waive")}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                      {[
                        {label:T("Fee Type","Tipe Fee"), val:waiveType, grad:"linear-gradient(135deg,#6366f1,#8b5cf6)"},
                        {label:T("DPD","DPD"), val:dpd+" "+T("days","hari")+" ("+resultTier?.dpdLabel+")", grad:"linear-gradient(135deg,#06b6d4,#3b82f6)"},
                        {label:T("Waive %","% Waive"), val:waivePct, grad:"linear-gradient(135deg,#10b981,#059669)"},
                        {label:T("Max Amount","Nominal Max"), val:resultTier?.waiveAmt||"—", grad:"linear-gradient(135deg,#f59e0b,#ef4444)"},
                      ].map((item,i)=>(
                        <div key={i} style={{
                          background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",
                          borderRadius:12,padding:"13px 14px",overflow:"hidden",position:"relative",
                        }}>
                          <div style={{
                            position:"absolute",top:0,left:0,right:0,height:2,
                            background:item.grad,
                          }}/>
                          <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",fontWeight:600,marginBottom:5,textTransform:"uppercase",letterSpacing:0.8}}>{item.label}</div>
                          <div style={{fontSize:15,fontWeight:800,color:"#f1f5f9",lineHeight:1.3}}>{item.val}</div>
                        </div>
                      ))}
                    </div>

                    {/* Reason */}
                    {resultReason && (
                      <div style={{
                        background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",
                        borderRadius:12,padding:"13px 14px",marginBottom:12,
                      }}>
                        <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",fontWeight:600,textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>
                          {T("Matched Reason","Alasan Terpilih")}
                        </div>
                        <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                          <span style={{fontSize:20}}>{resultReason.icon}</span>
                          <div>
                            <div style={{fontSize:14,fontWeight:700,color:"#f1f5f9",lineHeight:1.4}}>
                              {lang==="ID"?resultReason.id_text:resultReason.text}
                            </div>
                            <div style={{fontSize:12,color:"rgba(255,255,255,0.3)",marginTop:2,lineHeight:1.4}}>
                              {lang==="ID"?resultReason.text:resultReason.id_text}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {resultTier?.notes && (
                      <div style={{
                        background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.25)",
                        borderRadius:12,padding:"11px 14px",marginBottom:12,
                        fontSize:13,color:"#fcd34d",lineHeight:1.6,fontWeight:500,
                      }}>⚠️ {resultTier.notes}</div>
                    )}

                    {/* Docs */}
                    {resultTier?.docs && (
                      <div style={{marginBottom:20}}>
                        <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:0.8,marginBottom:12}}>
                          📎 {T("Required Documents","Dokumen yang Diperlukan")}
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:7}}>
                          {resultTier.docs.map((doc,i)=>(
                            <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                              <span style={{
                                minWidth:24,height:24,borderRadius:7,flexShrink:0,
                                background:"rgba(99,102,241,0.2)",border:"1px solid rgba(99,102,241,0.3)",
                                display:"flex",alignItems:"center",justifyContent:"center",
                                fontSize:11,fontWeight:800,color:"#a5b4fc",marginTop:1,
                              }}>{i+1}</span>
                              <span style={{fontSize:14,color:"rgba(255,255,255,0.7)",lineHeight:1.5,fontWeight:500}}>{doc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{display:"flex",gap:10}}>
                      <button onClick={handleCopy} style={{
                        flex:1,padding:"13px",borderRadius:12,
                        border:"1px solid "+(copied?"rgba(16,185,129,0.4)":"rgba(255,255,255,0.12)"),
                        background:copied?"rgba(16,185,129,0.15)":"rgba(255,255,255,0.06)",
                        color:copied?"#34d399":"rgba(255,255,255,0.7)",
                        fontSize:14,fontWeight:700,cursor:"pointer",
                        transition:"all 0.2s",fontFamily:"inherit",
                      }}>
                        {copied ? "✓ "+T("Copied!","Tersalin!") : "📋 "+T("Copy Result","Salin Hasil")}
                      </button>
                      <button onClick={reset} style={{
                        flex:1,padding:"13px",borderRadius:12,border:"none",
                        background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
                        color:"#fff",fontSize:14,fontWeight:700,
                        cursor:"pointer",fontFamily:"inherit",
                        boxShadow:"0 4px 16px rgba(99,102,241,0.4)",
                        transition:"all 0.2s",
                      }}>
                        🔄 {T("New Check","Cek Baru")}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Back */}
          {step > 0 && step < 3 && (
            <div style={{marginTop:14}}>
              <button onClick={()=>go(step-1)} style={{
                background:"transparent",border:"1px solid rgba(255,255,255,0.1)",
                borderRadius:10,padding:"9px 18px",fontSize:14,fontWeight:600,
                color:"rgba(255,255,255,0.4)",cursor:"pointer",fontFamily:"inherit",
                transition:"all 0.15s",
              }}
                onMouseEnter={e=>{e.currentTarget.style.color="rgba(255,255,255,0.7)";e.currentTarget.style.borderColor="rgba(255,255,255,0.2)"}}
                onMouseLeave={e=>{e.currentTarget.style.color="rgba(255,255,255,0.4)";e.currentTarget.style.borderColor="rgba(255,255,255,0.1)"}}
              >← {T("Back","Kembali")}</button>
            </div>
          )}

          {/* Footer */}
          <div style={{textAlign:"center",marginTop:32,fontSize:12,color:"rgba(255,255,255,0.2)",fontWeight:500}}>
            © Olla Bot · Waive Matrix
          </div>

        </div>
      </div>
    </>
  );
}

function NotEligible({reason,onReset,T}) {
  return (
    <div style={{textAlign:"center",padding:"16px 0"}}>
      <div style={{
        width:64,height:64,borderRadius:"50%",margin:"0 auto 16px",
        background:"rgba(244,63,94,0.15)",border:"1px solid rgba(244,63,94,0.3)",
        display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,
      }}>✕</div>
      <div style={{fontSize:20,fontWeight:800,color:"#f43f5e",marginBottom:8}}>
        {T("Not Eligible","Tidak Eligible")}
      </div>
      <div style={{fontSize:14,color:"rgba(255,255,255,0.4)",marginBottom:24,lineHeight:1.6,fontWeight:500}}>
        {reason}
      </div>
      <button onClick={onReset} style={{
        padding:"12px 28px",borderRadius:12,
        background:"rgba(244,63,94,0.15)",border:"1px solid rgba(244,63,94,0.3)",
        color:"#f87171",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
        transition:"all 0.15s",
      }}
        onMouseEnter={e=>{e.currentTarget.style.background="rgba(244,63,94,0.25)"}}
        onMouseLeave={e=>{e.currentTarget.style.background="rgba(244,63,94,0.15)"}}
      >
        🔄 {T("Try Again","Coba Lagi")}
      </button>
    </div>
  );
}
