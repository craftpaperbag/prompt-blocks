import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  User, BookOpen, FileCode, MessageSquare, Briefcase, HelpCircle,
  FileText, Code, Database, Link, Info,
  PenTool, BarChart2, AlignLeft, GitCompare, Languages, Wrench,
  Table, Braces, ListOrdered, List, Type,
  Shield, Volume2, Hash, Globe, Ban, Users, Award,
  Zap, GitBranch, Repeat, UserCheck, Layers, Sparkles,
  GripVertical, ChevronUp, ChevronDown, Copy, Trash2, Edit3, Check, Plus, X, Save, LogOut, LogIn, Clipboard,
  ToggleLeft, ToggleRight, MessageCircle, Settings,
} from "lucide-react";

const ST = {
  async get(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
  async set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
  async del(k) { try { localStorage.removeItem(k); return true; } catch { return false; } },
};

const Auth = {
  async login(email) { const code = Math.floor(100000 + Math.random() * 900000).toString(); await ST.set(`auth:p:${email}`, { code, ts: Date.now() }); return code; },
  async verify(email, code) { const p = await ST.get(`auth:p:${email}`); if (!p) return false; if (p.code === code && Date.now() - p.ts < 600000) { await ST.set("auth:u", { email, ts: Date.now() }); await ST.del(`auth:p:${email}`); return true; } return false; },
  async getUser() { return await ST.get("auth:u"); },
  async logout() { await ST.del("auth:u"); },
};

const uid = () => crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36);
const extractVars = (t) => { const m = t.match(/{([^}]+)}/g) || []; return [...new Set(m.map(x => x.slice(1, -1)))]; };

const C = {
  bg: "#111114", surface: "#18181B", surface2: "#1E1E22", surface3: "#27272B",
  border: "#2E2E33", text: "#E4E4E7", dim: "#71717A", accent: "#58A6FF",
  green: "#4ADE80", red: "#F87171",
};

const CAT = {
  role:       { color: "#60A5FA", bg: "#60A5FA10", label: "役割",     desc: "AIの立場・専門性",    Icon: User },
  input:      { color: "#4ADE80", bg: "#4ADE8010", label: "入力",     desc: "AIに渡す素材・データ", Icon: FileText },
  task:       { color: "#C084FC", bg: "#C084FC10", label: "タスク",   desc: "実行してほしいこと",   Icon: PenTool },
  output:     { color: "#FBBF24", bg: "#FBBF2410", label: "出力形式", desc: "回答のフォーマット",   Icon: Layers },
  constraint: { color: "#F472B6", bg: "#F472B610", label: "制約",     desc: "守るべきルール",      Icon: Shield },
  technique:  { color: "#22D3EE", bg: "#22D3EE10", label: "テクニック", desc: "プロンプト技法",   Icon: Zap },
};

const BI = {
  r1: User, r2: BookOpen, r3: FileCode, r4: MessageSquare, r5: Briefcase, r6: HelpCircle,
  i1: FileText, i2: Code, i3: Database, i4: Link, i5: Info, i6: MessageCircle,
  t1: PenTool, t2: BarChart2, t3: AlignLeft, t4: GitCompare, t5: Languages, t6: Wrench, t7: MessageSquare,
  o1: Type, o2: Table, o3: Braces, o4: ListOrdered, o5: List, o6: AlignLeft,
  c1: Volume2, c2: Hash, c3: Globe, c4: Ban, c5: Users, c6: Award,
  x1: GitBranch, x2: Sparkles, x3: Award, x4: Repeat, x5: UserCheck, x6: Layers,
};

const CATEGORIES = [
  { id: "role", blocks: [
    { id: "r1", label: "専門家", content: "あなたは{分野}の専門家です。専門知識と実務経験に基づいて回答してください。" },
    { id: "r2", label: "先生", content: "あなたは{科目}の優秀な教師です。初学者にもわかりやすく段階的に教えてください。" },
    { id: "r3", label: "レビュアー", content: "あなたは経験豊富なレビュアーです。品質・正確性・改善点の観点で評価してください。" },
    { id: "r4", label: "ライター", content: "あなたはプロのライターです。{ジャンル}に精通し、読者を惹きつける文章を書きます。" },
    { id: "r5", label: "コンサルタント", content: "あなたは{業界}のコンサルタントです。データと論理に基づいた実践的な提案をしてください。" },
    { id: "r6", label: "アシスタント", content: "あなたは優秀なビジネスアシスタントです。正確で簡潔な情報を提供してください。" },
  ]},
  { id: "input", blocks: [
    { id: "i1", label: "テキスト", content: "【入力テキスト】\n{テキストをここに貼り付け}" },
    { id: "i2", label: "コード", content: "【入力コード】\n`{言語}\n{コードをここに貼り付け}\n`" },
    { id: "i3", label: "データ", content: "【入力データ】\n{データをここに貼り付け}" },
    { id: "i4", label: "URL/参照", content: "【参照元】\nURL: {URL}\n内容の要点: {要点}" },
    { id: "i5", label: "状況説明", content: "【現在の状況】\n{状況の説明}\n\n【背景】\n{背景情報}" },
    { id: "i6", label: "会話ログ", content: "【会話ログ】\n{会話の内容をここに貼り付け}" },
  ]},
  { id: "task", blocks: [
    { id: "t1", label: "作成", content: "以下を作成してください：\n{作成するもの}" },
    { id: "t2", label: "分析", content: "以下を分析してください：\n{分析の観点}" },
    { id: "t3", label: "要約", content: "上記の内容を{文字数}字以内で要約してください。" },
    { id: "t4", label: "比較", content: "以下を比較し、それぞれの長所・短所を明示してください：\n- {対象A}\n- {対象B}" },
    { id: "t5", label: "翻訳", content: "上記を{目標言語}に翻訳してください。ニュアンスを保ちつつ自然な表現に。" },
    { id: "t6", label: "修正・改善", content: "上記の問題点を特定し、改善案を提示してください。" },
    { id: "t7", label: "質問応答", content: "上記について以下の質問に答えてください：\n{質問}" },
  ]},
  { id: "output", blocks: [
    { id: "o1", label: "Markdown", content: "Markdown形式で出力してください。見出し・リスト・コードブロックを適切に使用。" },
    { id: "o2", label: "テーブル", content: "テーブル形式で出力：\n| {カラム1} | {カラム2} | {カラム3} |" },
    { id: "o3", label: "JSON", content: "JSON形式で出力してください。キー名は{言語}で。" },
    { id: "o4", label: "ステップ", content: "番号付きステップ形式で出力。各ステップに具体的なアクションを含めてください。" },
    { id: "o5", label: "箇条書き", content: "箇条書きで簡潔に出力。各項目1〜2文以内。" },
    { id: "o6", label: "文章", content: "自然な文章形式で出力してください。段落を適切に分けてください。" },
  ]},
  { id: "constraint", blocks: [
    { id: "c1", label: "トーン", content: "トーン：{丁寧/カジュアル/技術的/ビジネス}\nです・ます調で統一してください。" },
    { id: "c2", label: "文字数", content: "出力は{文字数}字{以内/程度}にしてください。" },
    { id: "c3", label: "言語", content: "日本語で出力。専門用語は英語を括弧内に併記してください。" },
    { id: "c4", label: "禁止事項", content: "【やらないでください】\n- {禁止事項1}\n- {禁止事項2}" },
    { id: "c5", label: "対象レベル", content: "対象読者は{初心者/中級者/上級者}です。それに合わせた説明を。" },
    { id: "c6", label: "品質基準", content: "以下の基準を満たしてください：\n- 正確性: {基準}\n- 網羅性: {基準}\n- 実用性: {基準}" },
  ]},
  { id: "technique", blocks: [
    { id: "x1", label: "思考手順 (CoT)", content: "回答前にステップバイステップで思考過程を示してください。" },
    { id: "x2", label: "Few-shot 例示", content: "【例1】\n入力: {入力例1}\n出力: {出力例1}\n\n上記の例に倣い出力してください：" },
    { id: "x3", label: "自己評価", content: "回答後、正確性・網羅性・わかりやすさを各5点で自己採点し改善点があれば修正版を出力。" },
    { id: "x4", label: "反復改善", content: "まず初稿を出力し、次に自分で批判的にレビューして改善版を出力してください。" },
    { id: "x5", label: "ペルソナ", content: "以下のペルソナになりきって回答：\n- 名前: {名前}\n- 性格: {性格}\n- 口調: {口調}" },
    { id: "x6", label: "構造化出力", content: "回答を以下の構造で出力：\n## 要約（3行以内）\n## 詳細\n## 次のアクション" },
  ]},
];

export default function PromptBuilder() {
  const [user, setUser] = useState(null);
  const [authScreen, setAuthScreen] = useState(false);
  const [email, setEmail] = useState("");
  const [verCode, setVerCode] = useState("");
  const [sentCode, setSentCode] = useState(null);
  const [authStep, setAuthStep] = useState("email");
  const [authError, setAuthError] = useState("");
  const [userBlocks, setUserBlocks] = useState({});
  const [canvas, setCanvas] = useState([]);
  const [savedPrompts, setSavedPrompts] = useState([]);
  const [currentName, setCurrentName] = useState("");
  const [selectedCat, setSelectedCat] = useState(null);
  const [editingBlock, setEditingBlock] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState("build");
  const [showSaved, setShowSaved] = useState(false);
  const [canvasFlash, setCanvasFlash] = useState(null);
  const [showNewBlock, setShowNewBlock] = useState(false);
  const [newBlockCat, setNewBlockCat] = useState(null);
  const [newBlockData, setNewBlockData] = useState({ label: "", content: "" });
  const [varMode, setVarMode] = useState(false);
  const [varValues, setVarValues] = useState({});
  const [dragIdx, setDragIdx] = useState(null);
  const [touchDragState, setTouchDragState] = useState(null);
  const blockRefs = useRef([]);
  const canvasEndRef = useRef(null);

  useEffect(() => { const ck = () => setIsMobile(window.innerWidth < 768); ck(); window.addEventListener("resize", ck); return () => window.removeEventListener("resize", ck); }, []);
  useEffect(() => { (async () => { const u = await Auth.getUser(); if (u) { setUser(u); await loadData(u.email); } })(); }, []);

  const loadData = async (em) => { const d = await ST.get(`data:${em}`); if (d) { if (d.userBlocks) setUserBlocks(d.userBlocks); if (d.savedPrompts) setSavedPrompts(d.savedPrompts); } };
  const persist = useCallback(async (ub, sp) => { if (!user) return; await ST.set(`data:${user.email}`, { userBlocks: ub ?? userBlocks, savedPrompts: sp ?? savedPrompts }); }, [user, userBlocks, savedPrompts]);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const handleSendCode = async () => { if (!email.includes("@")) { setAuthError("有効なメールアドレスを入力"); return; } setAuthError(""); setSentCode(await Auth.login(email)); setAuthStep("verify"); };
  const handleVerify = async () => { if (await Auth.verify(email, verCode)) { setUser({ email, ts: Date.now() }); setAuthScreen(false); setAuthStep("email"); setVerCode(""); setSentCode(null); await loadData(email); showToast("ログインしました"); } else setAuthError("コードが正しくありません"); };
  const handleLogout = async () => { await Auth.logout(); setUser(null); setUserBlocks({}); setSavedPrompts([]); showToast("ログアウトしました"); };

  const getCatBlocks = (catId) => { const cat = CATEGORIES.find(c => c.id === catId); return [...(cat ? cat.blocks : []), ...(userBlocks[catId] || [])]; };

  const addToCanvas = (block, catId) => {
    const c = CAT[catId]; const inst = { ...block, instanceId: uid(), catId, catLabel: c.label, theme: c };
    setCanvas(p => [...p, inst]); setCanvasFlash(inst.instanceId); setTimeout(() => setCanvasFlash(null), 600);
    setTimeout(() => canvasEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 50);
  };
  const removeFromCanvas = (iid) => setCanvas(p => p.filter(b => b.instanceId !== iid));
  const moveBlock = (from, to) => { setCanvas(p => { const n = [...p]; const [it] = n.splice(from, 1); n.splice(to, 0, it); return n; }); };
  const startEdit = (b) => { setEditingBlock(b.instanceId); setEditContent(b.content); };
  const saveEdit = (iid) => { setCanvas(p => p.map(b => b.instanceId === iid ? { ...b, content: editContent } : b)); setEditingBlock(null); };
  const dupBlock = (iid) => { const b = canvas.find(x => x.instanceId === iid); if (b) { const i = canvas.indexOf(b); setCanvas(p => [...p.slice(0, i + 1), { ...b, instanceId: uid() }, ...p.slice(i + 1)]); } };

  const onTouchStart = (idx, e) => { if (varMode) return; const t = e.touches[0]; setTouchDragState({ idx, startY: t.clientY, moved: false }); };
  const onTouchMove = (e) => {
    if (!touchDragState) return;
    const t = e.touches[0];
    if (Math.abs(t.clientY - touchDragState.startY) > 8) {
      setTouchDragState(p => ({ ...p, moved: true }));
      for (let i = 0; i < blockRefs.current.length; i++) {
        const el = blockRefs.current[i]; if (!el) continue;
        const r = el.getBoundingClientRect();
        if (t.clientY > r.top && t.clientY < r.bottom && i !== touchDragState.idx) {
          moveBlock(touchDragState.idx, i); setTouchDragState(p => ({ ...p, idx: i })); break;
        }
      }
    }
  };
  const onTouchEnd = () => setTouchDragState(null);
  const handleDragStart = (i) => setDragIdx(i);
  const handleDragOver = (e, i) => { e.preventDefault(); if (dragIdx !== null && dragIdx !== i) { moveBlock(dragIdx, i); setDragIdx(i); } };
  const handleDragEnd = () => setDragIdx(null);

  const allVars = useMemo(() => { const vs = []; canvas.forEach(b => extractVars(b.content).forEach(v => { if (!vs.some(x => x.name === v)) vs.push({ name: v, theme: b.theme }); })); return vs; }, [canvas]);
  const getFilledOutput = useCallback(() => { let o = canvas.map(b => b.content).join("\n\n"); Object.entries(varValues).forEach(([k, v]) => { if (v) o = o.replaceAll(`{${k}}`, v); }); return o; }, [canvas, varValues]);
  const filledCount = allVars.filter(v => varValues[v.name]?.trim()).length;
  const hasVars = allVars.length > 0;
  const copyOutput = () => { navigator.clipboard?.writeText(getFilledOutput()); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const savePrompt = async () => { if (!user) { setAuthScreen(true); return; } if (!canvas.length) return; const nm = currentName.trim() || `プロンプト ${savedPrompts.length + 1}`; const p = { id: uid(), name: nm, blocks: canvas.map(({ instanceId, ...r }) => r), createdAt: Date.now() }; const nx = [p, ...savedPrompts]; setSavedPrompts(nx); await persist(userBlocks, nx); setCurrentName(""); showToast("保存しました"); };
  const loadPrompt = (p) => { setCanvas(p.blocks.map(b => ({ ...b, instanceId: uid() }))); setCurrentName(p.name); setShowSaved(false); setVarMode(false); setVarValues({}); if (isMobile) setMobileView("build"); showToast("読み込みました"); };
  const deletePrompt = async (id) => { const nx = savedPrompts.filter(p => p.id !== id); setSavedPrompts(nx); await persist(userBlocks, nx); };
  const addCustomBlock = async () => { if (!newBlockData.label || !newBlockData.content || !newBlockCat) return; const b = { id: `u-${uid()}`, label: newBlockData.label, content: newBlockData.content }; const nx = { ...userBlocks, [newBlockCat]: [...(userBlocks[newBlockCat] || []), b] }; setUserBlocks(nx); if (user) await persist(nx, savedPrompts); setNewBlockData({ label: "", content: "" }); setShowNewBlock(false); showToast("ブロック保存しました"); };
  const deleteCustomBlock = async (catId, bId) => { const nx = { ...userBlocks, [catId]: (userBlocks[catId] || []).filter(b => b.id !== bId) }; setUserBlocks(nx); if (user) await persist(nx, savedPrompts); };

  const blocksForCat = selectedCat ? getCatBlocks(selectedCat) : [];
  const selCat = CAT[selectedCat] || CAT.role;

  const renderContent = (text) => text.split(/({[^}]+})/g).map((part, i) => {
    const m = part.match(/^{(.+)}$/);
    if (m) { const f = varValues[m[1]]; return f ? <span key={i} style={{ color: C.green, fontWeight: 600 }}>{f}</span> : <span key={i} style={{ color: C.accent, opacity: 0.8 }}>{part}</span>; }
    return <span key={i}>{part}</span>;
  });

  const GetIcon = ({ id, size = 14, color }) => { const Ic = BI[id] || Sparkles; return <Ic size={size} color={color} />; };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: C.bg, color: C.text, fontFamily: "'Inter',-apple-system,'Noto Sans JP',sans-serif", overflow: "hidden" }}
    onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>

      {toast && <div style={{ position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 9999, padding: "7px 18px", borderRadius: 8, background: C.green, color: C.bg, fontSize: 12, fontWeight: 700, boxShadow: "0 6px 24px rgba(0,0,0,0.5)", animation: "slideDown 0.25s ease" }}>{toast}</div>}

      <header style={{ zIndex: 100, background: C.surface, borderBottom: `1px solid ${C.border}`, padding: isMobile ? "8px 12px" : "8px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: `${C.accent}18`, display: "flex", alignItems: "center", justifyContent: "center" }}><Layers size={16} color={C.accent} /></div>
          <span style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, letterSpacing: "-0.02em" }}>Prompt Blocks</span>
          <span style={{ fontSize: 9, color: C.dim, background: `${C.accent}15`, padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>モック版</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => setShowSaved(true)} style={gb}><Save size={14} />{savedPrompts.length > 0 && <span style={{ fontSize: 10, color: C.dim }}>{savedPrompts.length}</span>}</button>
          {user ? (
            <>
              {!isMobile && <span style={{ fontSize: 10, color: C.dim, maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</span>}
              <button onClick={handleLogout} style={gb}><LogOut size={13} /></button>
            </>
          ) : <button onClick={() => setAuthScreen(true)} style={{ ...gb, color: C.accent }}><LogIn size={13} /><span style={{ fontSize: 11 }}>ログイン</span></button>}
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", flexDirection: isMobile ? "column" : "row", overflow: "hidden" }}>
        {/* CANVAS */}
        {(!isMobile || mobileView === "build") && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, borderRight: isMobile ? "none" : `1px solid ${C.border}` }}>
            <div style={{ padding: isMobile ? "6px 10px" : "8px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 5, alignItems: "center", background: C.surface, flexShrink: 0, overflowX: "auto" }}>
              <input value={currentName} onChange={e => setCurrentName(e.target.value)} placeholder="プロンプト名..." style={{ ...inp, flex: 1, minWidth: 60, maxWidth: isMobile ? 110 : 160, padding: "5px 8px" }} />
              <button onClick={savePrompt} style={gb} disabled={!canvas.length}><Save size={14} /></button>
              {canvas.length > 0 && hasVars && (
                <button onClick={() => setVarMode(!varMode)} style={{ ...gb, color: varMode ? C.bg : C.accent, background: varMode ? C.accent : "transparent", borderRadius: 6, padding: "4px 10px", gap: 4 }}>
                  {varMode ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                  <span style={{ fontSize: 11 }}>穴埋め</span>
                  {filledCount > 0 && <span style={{ fontSize: 9, opacity: 0.7 }}>{filledCount}/{allVars.length}</span>}
                </button>
              )}
              <button onClick={copyOutput} style={gb} disabled={!canvas.length}>{copied ? <Check size={14} color={C.green} /> : <Clipboard size={14} />}</button>
              <button onClick={() => { setCanvas([]); setVarMode(false); setVarValues({}); }} style={gb} disabled={!canvas.length}><Trash2 size={13} /></button>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: varMode && !isMobile ? "row" : "column", overflow: "hidden" }}>
              <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 8 : 14, display: "flex", flexDirection: "column", gap: 5, minHeight: 0 }}>
                {!canvas.length ? (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `2px dashed ${C.border}`, borderRadius: 12, padding: 24 }}>
                    <Layers size={32} color={C.dim} strokeWidth={1.5} />
                    <p style={{ fontSize: 13, fontWeight: 600, margin: "10px 0 2px", color: C.dim }}>キャンバス</p>
                    <p style={{ fontSize: 11, color: C.dim, textAlign: "center", opacity: 0.7 }}>{isMobile ? "↓ カテゴリ → ブロックで積み上げ" : "→ カテゴリ → ブロックで積み上げ"}</p>
                  </div>
                ) : (
                  <>
                    {canvas.map((block, idx) => {
                      const isEd = editingBlock === block.instanceId;
                      const th = block.theme || CAT.technique;
                      const isDragging = dragIdx === idx || (touchDragState?.moved && touchDragState?.idx === idx);
                      const CatIc = th.Icon;
                      return (
                        <div key={block.instanceId} ref={el => blockRefs.current[idx] = el}
                          draggable={!isEd && !isMobile} onDragStart={() => handleDragStart(idx)} onDragOver={e => handleDragOver(e, idx)} onDragEnd={handleDragEnd}
                          style={{ background: C.surface2, border: `1px solid ${isDragging ? th.color : C.border}`, borderLeft: `3px solid ${th.color}`, borderRadius: 8, overflow: "hidden", opacity: isDragging ? 0.65 : 1, animation: canvasFlash === block.instanceId ? "blockFlash 0.5s ease" : undefined, flexShrink: 0, transition: "opacity 0.15s, border-color 0.15s", transform: isDragging ? "scale(1.02)" : "none" }}>
                          <div style={{ display: "flex", alignItems: "center", padding: "5px 8px", gap: 5 }}>
                            <span onTouchStart={e => onTouchStart(idx, e)} style={{ cursor: "grab", opacity: 0.35, touchAction: "none", display: "flex", padding: 2 }}><GripVertical size={14} /></span>
                            <span style={{ color: th.color, display: "flex" }}><CatIc size={12} /></span>
                            <span style={{ fontSize: 10, color: C.dim }}>{block.catLabel}</span>
                            <span style={{ fontSize: 9, color: C.dim, opacity: 0.5 }}>›</span>
                            <span style={{ fontSize: 11, fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{block.label}</span>
                            {!varMode && (
                              <div style={{ display: "flex", gap: 1 }}>
                                {idx > 0 && <button onClick={() => moveBlock(idx, idx - 1)} style={tb}><ChevronUp size={12} /></button>}
                                {idx < canvas.length - 1 && <button onClick={() => moveBlock(idx, idx + 1)} style={tb}><ChevronDown size={12} /></button>}
                                <button onClick={() => isEd ? saveEdit(block.instanceId) : startEdit(block)} style={tb}>{isEd ? <Check size={12} /> : <Edit3 size={12} />}</button>
                                <button onClick={() => dupBlock(block.instanceId)} style={tb}><Copy size={12} /></button>
                                <button onClick={() => removeFromCanvas(block.instanceId)} style={{ ...tb, color: C.red }}><X size={12} /></button>
                              </div>
                            )}
                          </div>
                          {isEd ? (
                            <textarea value={editContent} onChange={e => setEditContent(e.target.value)} style={{ width: "100%", background: C.bg, border: "none", color: C.text, padding: 8, fontSize: 11, fontFamily: "monospace", minHeight: 60, resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.5 }} autoFocus />
                          ) : (
                            <div onClick={() => !varMode && startEdit(block)} style={{ padding: "4px 8px 6px", fontSize: 11, lineHeight: 1.45, color: C.dim, whiteSpace: "pre-wrap", cursor: varMode ? "default" : "text", fontFamily: "monospace" }}>
                              {varMode ? renderContent(block.content) : block.content}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div ref={canvasEndRef} />
                  </>
                )}
              </div>

              {varMode && canvas.length > 0 && (
                <div style={{ width: isMobile ? "100%" : 260, maxHeight: isMobile ? "34vh" : undefined, flex: isMobile ? "0 0 auto" : "0 0 260px", background: C.surface, borderLeft: isMobile ? "none" : `1px solid ${C.border}`, borderTop: isMobile ? `1px solid ${C.border}` : "none", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <div style={{ padding: "9px 14px", borderBottom: `1px solid ${C.border}`, flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}><ToggleRight size={14} color={C.accent} /> 穴埋め入力</span>
                    <span style={{ fontSize: 10, color: filledCount === allVars.length && allVars.length > 0 ? C.green : C.dim, fontWeight: 600 }}>{filledCount === allVars.length && allVars.length > 0 ? "✓ 完了" : `${filledCount}/${allVars.length}`}</span>
                  </div>
                  <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 12 }}>
                    {allVars.map((v, i) => {
                      const filled = !!varValues[v.name]?.trim();
                      return (
                        <div key={v.name}>
                          <label style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4, fontSize: 11, fontWeight: 600, color: filled ? C.green : C.text }}>{v.name}{filled && <Check size={10} color={C.green} />}</label>
                          <input value={varValues[v.name] || ""} onChange={e => setVarValues(p => ({ ...p, [v.name]: e.target.value }))} placeholder={`${v.name}...`} style={{ ...inp, borderColor: filled ? `${C.green}40` : C.border, fontSize: 12, padding: "6px 8px" }} autoFocus={i === 0} />
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ padding: "8px 12px", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
                    <button onClick={copyOutput} style={{ background: C.accent, color: C.bg, border: "none", borderRadius: 7, padding: "8px 0", width: "100%", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontFamily: "inherit" }}>
                      {copied ? <><Check size={14} /> コピー済み</> : <><Clipboard size={14} /> 完成プロンプトをコピー</>}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {canvas.length > 0 && !varMode && (
              <div style={{ padding: "5px 14px", borderTop: `1px solid ${C.border}`, background: C.surface, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10, color: C.dim, display: "flex", alignItems: "center", gap: 4 }}><Layers size={11} /> {canvas.length}ブロック{hasVars ? ` · ${allVars.length}箇所の穴埋め` : ""}</span>
                <button onClick={copyOutput} style={gb}>{copied ? <><Check size={12} color={C.green} /><span style={{ fontSize: 10 }}>コピー済み</span></> : <><Clipboard size={12} /><span style={{ fontSize: 10 }}>コピー</span></>}</button>
              </div>
            )}
          </div>
        )}

        {/* BLOCK SELECTOR */}
        {(!isMobile || mobileView === "build") && !varMode && (
          <div style={{ width: isMobile ? "100%" : 320, flex: isMobile ? "0 0 auto" : "0 0 320px", maxHeight: isMobile ? "42vh" : undefined, background: C.surface, borderTop: isMobile ? `1px solid ${C.border}` : "none", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", flexWrap: "wrap", borderBottom: `1px solid ${C.border}`, flexShrink: 0, background: C.surface }}>
              {Object.entries(CAT).map(([id, cat]) => {
                const sel = selectedCat === id;
                return (
                  <button key={id} onClick={() => setSelectedCat(sel ? null : id)}
                    style={{ background: sel ? cat.bg : "transparent", border: "none", borderBottom: `2px solid ${sel ? cat.color : "transparent"}`, padding: isMobile ? "7px 8px" : "7px 0", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: sel ? cat.color : C.dim, transition: "all 0.12s", flex: "1 1 calc(100% / 3)", minWidth: 0 }}>
                    <cat.Icon size={isMobile ? 15 : 16} />
                    <span style={{ fontSize: 9, fontWeight: 700 }}>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
              {!selectedCat ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 20 }}>
                  <ChevronUp size={20} color={C.dim} /><p style={{ fontSize: 11, color: C.dim, textAlign: "center", margin: "6px 0 0" }}>カテゴリを選択</p>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: 10, color: selCat.color, padding: "2px 6px 6px", fontWeight: 600, margin: 0 }}>{selCat.desc}</p>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr", gap: 5 }}>
                    {blocksForCat.map(block => {
                      const isCustom = block.id.startsWith("u-");
                      const bVars = extractVars(block.content);
                      return (
                        <button key={block.id} onClick={() => addToCanvas(block, selectedCat)}
                          style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 9, padding: isMobile ? "10px" : "9px 11px", cursor: "pointer", display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? 5 : 8, textAlign: "left", color: C.text, transition: "all 0.12s", fontFamily: "inherit", width: "100%" }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = selCat.color + "66"} onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                          <div style={{ width: 28, height: 28, borderRadius: 7, background: selCat.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${selCat.color}22` }}>
                            <GetIcon id={block.id} size={14} color={selCat.color} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 12, fontWeight: 600 }}>{block.label}</span>
                              {isCustom && <span style={{ fontSize: 8, background: C.surface3, color: C.dim, padding: "1px 4px", borderRadius: 3 }}>カスタム</span>}
                              {bVars.length > 0 && <span style={{ fontSize: 8, color: C.accent, opacity: 0.7 }}>{bVars.length}箇所</span>}
                            </div>
                            {!isMobile && <div style={{ fontSize: 10, color: C.dim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>{block.content.slice(0, 50)}</div>}
                          </div>
                          {isCustom && <span onClick={e => { e.stopPropagation(); deleteCustomBlock(selectedCat, block.id); }} style={{ color: C.dim, cursor: "pointer", padding: 2, display: "flex" }}><Trash2 size={11} /></span>}
                        </button>
                      );
                    })}
                    <button onClick={() => { setNewBlockCat(selectedCat); setShowNewBlock(true); }}
                      style={{ background: "transparent", border: `1px dashed ${C.border}`, borderRadius: 9, padding: 10, cursor: "pointer", color: C.dim, fontSize: 11, fontWeight: 600, fontFamily: "inherit", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, transition: "color 0.12s", gridColumn: isMobile ? "1 / -1" : undefined }}
                      onMouseEnter={e => e.currentTarget.style.color = selCat.color} onMouseLeave={e => e.currentTarget.style.color = C.dim}>
                      <Plus size={13} /> ブロックを追加
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {isMobile && mobileView === "saved" && (
          <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}><Save size={16} /> 保存済み</h3>
            {!user ? <div style={{ textAlign: "center", padding: 30 }}><p style={{ color: C.dim, marginBottom: 12, fontSize: 12 }}>ログインして保存機能を利用</p><button onClick={() => setAuthScreen(true)} style={{ ...gb, color: C.accent }}>ログイン</button></div>
            : !savedPrompts.length ? <p style={{ color: C.dim, textAlign: "center", padding: 30, fontSize: 12 }}>まだ保存されたプロンプトはありません</p>
            : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{savedPrompts.map(p => <SC key={p.id} p={p} onLoad={loadPrompt} onDelete={deletePrompt} />)}</div>}
          </div>
        )}
      </div>

      {showSaved && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "flex-end" }} onClick={() => setShowSaved(false)}>
          <div style={{ width: isMobile ? "88%" : 360, height: "100%", background: C.surface, borderLeft: `1px solid ${C.border}`, overflowY: "auto", padding: 18, boxShadow: "-8px 0 40px rgba(0,0,0,0.4)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}><h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}><Save size={16} /> 保存済み</h3><button onClick={() => setShowSaved(false)} style={tb}><X size={16} /></button></div>
            {!user ? <div style={{ textAlign: "center", padding: 30 }}><p style={{ color: C.dim, marginBottom: 12, fontSize: 12 }}>ログインして保存機能を利用</p><button onClick={() => { setAuthScreen(true); setShowSaved(false); }} style={{ ...gb, color: C.accent }}>ログイン</button></div>
            : !savedPrompts.length ? <p style={{ color: C.dim, fontSize: 12 }}>まだ保存されたプロンプトはありません</p>
            : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{savedPrompts.map(p => <SC key={p.id} p={p} onLoad={loadPrompt} onDelete={deletePrompt} />)}</div>}
          </div>
        </div>
      )}

      {isMobile && (
        <div style={{ flexShrink: 0, background: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", padding: "5px 0 env(safe-area-inset-bottom, 5px)" }}>
          {[{ key: "build", Ic: Layers, label: "つくる" }, { key: "saved", Ic: Save, label: "保存済み" }].map(t => (
            <button key={t.key} onClick={() => setMobileView(t.key)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, color: mobileView === t.key ? C.accent : C.dim, padding: "3px 0" }}>
              <t.Ic size={16} /><span style={{ fontSize: 9, fontWeight: 600 }}>{t.label}</span>
            </button>
          ))}
        </div>
      )}

      {authScreen && (
        <div style={ov} onClick={() => setAuthScreen(false)}>
          <div style={ml()} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>{authStep === "email" ? "ログイン" : "認証コード"}</h2>
            <p style={{ margin: "0 0 14px", fontSize: 11, color: C.dim }}>{authStep === "email" ? "メールアドレスを入力" : `${email} に送信されたコード`}</p>
            {authStep === "email" ? (
              <><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={inp} onKeyDown={e => e.key === "Enter" && handleSendCode()} autoFocus /><button onClick={handleSendCode} style={pb}>認証コードを送信</button></>
            ) : (
              <>
                <div style={{ background: C.surface3, border: `1px solid ${C.border}`, borderRadius: 7, padding: "8px 12px", marginBottom: 12, fontSize: 11 }}>デモ認証コード: <strong style={{ color: C.accent, fontFamily: "monospace", letterSpacing: 2 }}>{sentCode}</strong><br /><span style={{ fontSize: 9, color: C.dim }}>※ 本番ではメールで送信</span></div>
                <input type="text" value={verCode} onChange={e => setVerCode(e.target.value)} placeholder="6桁のコード" maxLength={6} style={{ ...inp, textAlign: "center", fontSize: 20, letterSpacing: 8, fontFamily: "monospace" }} onKeyDown={e => e.key === "Enter" && handleVerify()} autoFocus />
                <button onClick={handleVerify} style={pb}>認証する</button>
                <button onClick={() => { setAuthStep("email"); setSentCode(null); }} style={{ ...gb, width: "100%", marginTop: 6, justifyContent: "center" }}>戻る</button>
              </>
            )}
            {authError && <p style={{ color: C.red, fontSize: 11, marginTop: 6 }}>{authError}</p>}
          </div>
        </div>
      )}

      {showNewBlock && (
        <div style={ov} onClick={() => setShowNewBlock(false)}>
          <div style={ml()} onClick={e => e.stopPropagation()}>
            {(() => { const cat = CAT[newBlockCat] || CAT.role; return (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: cat.bg, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${cat.color}22` }}><cat.Icon size={16} color={cat.color} /></div>
                  <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>「{cat.label}」にブロック追加</h2>
                </div>
                <input value={newBlockData.label} onChange={e => setNewBlockData({ ...newBlockData, label: e.target.value })} placeholder="ブロック名" style={{ ...inp, marginBottom: 8 }} autoFocus />
                <textarea value={newBlockData.content} onChange={e => setNewBlockData({ ...newBlockData, content: e.target.value })} placeholder={"テンプレートを入力\n{項目名}で穴埋め箇所を作れます"} style={{ ...inp, minHeight: 100, resize: "vertical", fontFamily: "monospace", fontSize: 11 }} />
                <p style={{ fontSize: 10, color: C.dim, margin: "8px 0 0" }}>{"{"}項目名{"}"} → あとから入力できます</p>
                <button onClick={addCustomBlock} style={{ ...pb, background: cat.color }} disabled={!newBlockData.label || !newBlockData.content}>保存</button>
              </>
            ); })()}
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box}body{margin:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px}
        @keyframes slideDown{from{opacity:0;transform:translate(-50%,-12px)}to{opacity:1;transform:translate(-50%,0)}}
        @keyframes blockFlash{0%{box-shadow:0 0 0 0 rgba(88,166,255,0.4)}50%{box-shadow:0 0 14px 3px rgba(88,166,255,0.2)}100%{box-shadow:0 0 0 0 rgba(88,166,255,0)}}
        textarea:focus,input:focus{outline:none;border-color:${C.accent}!important}
        button:disabled{opacity:0.35;cursor:not-allowed}
      `}</style>
    </div>
  );
}

function SC({ p, onLoad, onDelete }) {
  return (
    <div style={{ background: "#1E1E22", borderRadius: 10, padding: 12, border: "1px solid #2E2E33" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span><span style={{ fontSize: 9, color: "#71717A" }}>{new Date(p.createdAt).toLocaleDateString("ja-JP")}</span></div>
      <div style={{ display: "flex", gap: 3, flexWrap: "wrap", margin: "6px 0 8px" }}>
        {p.blocks.map((b, i) => { const cat = CAT[b.catId] || CAT.technique; return <span key={i} style={{ fontSize: 9, background: cat.bg, color: cat.color, padding: "2px 6px", borderRadius: 4, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}><cat.Icon size={9} /> {b.label}</span>; })}
      </div>
      <div style={{ display: "flex", gap: 5 }}>
        <button onClick={() => onLoad(p)} style={{ background: "#58A6FF", color: "#111114", border: "none", borderRadius: 6, padding: "6px 0", flex: 1, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>読み込む</button>
        <button onClick={() => onDelete(p.id)} style={{ background: "none", border: "none", color: "#71717A", cursor: "pointer", padding: "5px 8px", display: "flex", alignItems: "center" }}><Trash2 size={13} /></button>
      </div>
    </div>
  );
}

const inp = { background: "#111114", border: "1px solid #2E2E33", borderRadius: 7, padding: "7px 10px", color: "#E4E4E7", fontSize: 12, width: "100%", fontFamily: "'Inter','Noto Sans JP',sans-serif", transition: "border-color 0.15s" };
const gb = { background: "none", border: "none", color: "#71717A", cursor: "pointer", fontSize: 12, padding: "5px 8px", borderRadius: 6, display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit", transition: "color 0.12s", whiteSpace: "nowrap" };
const tb = { background: "none", border: "none", color: "#71717A", cursor: "pointer", padding: "3px 4px", borderRadius: 4, display: "flex", alignItems: "center" };
const pb = { background: "#58A6FF", color: "#111114", border: "none", borderRadius: 7, padding: "9px 0", width: "100%", marginTop: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" };
const ov = { position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 12 };
const ml = () => ({ background: "#18181B", borderRadius: 14, padding: 20, maxWidth: 400, width: "100%", border: "1px solid #2E2E33", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" });
