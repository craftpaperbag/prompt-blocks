import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  User, BookOpen, FileCode, MessageSquare, Briefcase, HelpCircle,
  FileText, Code, Database, Link, Info,
  PenTool, BarChart2, AlignLeft, GitCompare, Languages, Wrench,
  Table, Braces, ListOrdered, List, Type,
  Shield, Volume2, Hash, Globe, Ban, Users, Award,
  Zap, GitBranch, Repeat, UserCheck, Layers, Sparkles,
  GripVertical, ChevronUp, ChevronDown, Copy, Trash2, Edit3, Check, Plus, X, Save, LogOut, LogIn, Clipboard,
  ToggleLeft, ToggleRight, MessageCircle, Settings, ExternalLink,
  Sun, Moon,
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

const DARK = {
  bg: "#111114", surface: "#18181B", surface2: "#1E1E22", surface3: "#27272B",
  border: "#2E2E33", text: "#E4E4E7", dim: "#71717A", accent: "#58A6FF",
  accentFg: "#111114", green: "#4ADE80", red: "#F87171",
};

const LIGHT = {
  bg: "#F5F5F7", surface: "#FFFFFF", surface2: "#F0F0F2", surface3: "#E5E5EA",
  border: "#D1D1D6", text: "#1C1C1E", dim: "#8E8E93", accent: "#007AFF",
  accentFg: "#FFFFFF", green: "#34C759", red: "#FF3B30",
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
  const [showInfo, setShowInfo] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem("pb-theme") !== "light"; } catch { return true; }
  });
  const blockRefs = useRef([]);
  const canvasEndRef = useRef(null);

  const C = isDark ? DARK : LIGHT;

  const inp = useMemo(() => ({ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", color: C.text, fontSize: 15, width: "100%", fontFamily: "'Inter','Noto Sans JP',sans-serif", transition: "border-color 0.15s" }), [C]);
  const gb = useMemo(() => ({ background: "none", border: "none", color: C.dim, cursor: "pointer", fontSize: 14, padding: "8px 12px", borderRadius: 8, display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit", transition: "color 0.12s", whiteSpace: "nowrap" }), [C]);
  const tb = useMemo(() => ({ background: "none", border: "none", color: C.dim, cursor: "pointer", padding: "6px 7px", borderRadius: 6, display: "flex", alignItems: "center" }), [C]);
  const pb = useMemo(() => ({ background: C.accent, color: C.accentFg, border: "none", borderRadius: 8, padding: "12px 0", width: "100%", marginTop: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }), [C]);
  const ov = useMemo(() => ({ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }), []);
  const ml = useMemo(() => ({ background: C.surface, borderRadius: 16, padding: 24, maxWidth: 440, width: "100%", border: `1px solid ${C.border}`, boxShadow: `0 24px 64px ${isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.15)"}` }), [C, isDark]);

  useEffect(() => { const ck = () => setIsMobile(window.innerWidth < 768); ck(); window.addEventListener("resize", ck); return () => window.removeEventListener("resize", ck); }, []);
  useEffect(() => { (async () => { const u = await Auth.getUser(); if (u) { setUser(u); await loadData(u.email); } })(); }, []);
  useEffect(() => { try { localStorage.setItem("pb-theme", isDark ? "dark" : "light"); } catch {} }, [isDark]);

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

  const GetIcon = ({ id, size = 17, color }) => { const Ic = BI[id] || Sparkles; return <Ic size={size} color={color} />; };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: C.bg, color: C.text, fontFamily: "'Inter',-apple-system,'Noto Sans JP',sans-serif", overflow: "hidden" }}
    onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>

      {toast && <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 9999, padding: "10px 24px", borderRadius: 10, background: C.green, color: isDark ? C.bg : "#FFFFFF", fontSize: 15, fontWeight: 700, boxShadow: `0 6px 24px ${isDark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.15)"}`, animation: "slideDown 0.25s ease" }}>{toast}</div>}

      <header style={{ zIndex: 100, background: C.surface, borderBottom: `1px solid ${C.border}`, padding: isMobile ? "10px 14px" : "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: `${C.accent}18`, display: "flex", alignItems: "center", justifyContent: "center" }}><Layers size={20} color={C.accent} /></div>
          <span style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, letterSpacing: "-0.02em" }}>Prompt Blocks</span>
          <span style={{ fontSize: 11, color: C.dim, background: `${C.accent}15`, padding: "3px 8px", borderRadius: 5, fontWeight: 600 }}>モック版</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setIsDark(d => !d)} style={gb} title={isDark ? "ライトモードに切替" : "ダークモードに切替"}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={() => setShowInfo(true)} style={gb} title="このサービスについて"><Info size={18} /></button>
          <button onClick={() => setShowSaved(true)} style={gb}><Save size={17} />{savedPrompts.length > 0 && <span style={{ fontSize: 13, color: C.dim }}>{savedPrompts.length}</span>}</button>
          {user ? (
            <>
              {!isMobile && <span style={{ fontSize: 13, color: C.dim, maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</span>}
              <button onClick={handleLogout} style={gb}><LogOut size={17} /></button>
            </>
          ) : <button onClick={() => setAuthScreen(true)} style={{ ...gb, color: C.accent }}><LogIn size={17} /><span style={{ fontSize: 14 }}>ログイン</span></button>}
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", flexDirection: isMobile ? "column" : "row", overflow: "hidden" }}>
        {/* CANVAS */}
        {(!isMobile || mobileView === "build") && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0, borderRight: isMobile ? "none" : `1px solid ${C.border}` }}>
            <div style={{ padding: isMobile ? "8px 12px" : "10px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 8, alignItems: "center", background: C.surface, flexShrink: 0, overflowX: "auto" }}>
              <input value={currentName} onChange={e => setCurrentName(e.target.value)} placeholder="プロンプト名..." style={{ ...inp, flex: 1, minWidth: 80, maxWidth: isMobile ? 140 : 200, padding: "8px 12px" }} />
              <button onClick={savePrompt} style={gb} disabled={!canvas.length}><Save size={17} /></button>
              {canvas.length > 0 && hasVars && (
                <button onClick={() => setVarMode(!varMode)} style={{ ...gb, color: varMode ? C.accentFg : C.accent, background: varMode ? C.accent : "transparent", borderRadius: 8, padding: "6px 14px", gap: 6 }}>
                  {varMode ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}
                  <span style={{ fontSize: 14 }}>穴埋め</span>
                  {filledCount > 0 && <span style={{ fontSize: 12, opacity: 0.7 }}>{filledCount}/{allVars.length}</span>}
                </button>
              )}
              <button onClick={copyOutput} style={gb} disabled={!canvas.length}>{copied ? <Check size={17} color={C.green} /> : <Clipboard size={17} />}</button>
              <button onClick={() => { setCanvas([]); setVarMode(false); setVarValues({}); }} style={gb} disabled={!canvas.length}><Trash2 size={16} /></button>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: varMode && !isMobile ? "row" : "column", overflow: "hidden" }}>
              <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 10 : 16, display: "flex", flexDirection: "column", gap: 8, minHeight: 0 }}>
                {!canvas.length ? (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `2px dashed ${C.border}`, borderRadius: 14, padding: 32 }}>
                    <Layers size={40} color={C.dim} strokeWidth={1.5} />
                    <p style={{ fontSize: 16, fontWeight: 600, margin: "12px 0 4px", color: C.dim }}>キャンバス</p>
                    <p style={{ fontSize: 14, color: C.dim, textAlign: "center", opacity: 0.7 }}>{isMobile ? "下のカテゴリからブロックを選んで積み上げ" : "右のカテゴリからブロックを選んで積み上げ"}</p>
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
                          style={{ background: C.surface2, border: `1px solid ${isDragging ? th.color : C.border}`, borderLeft: `4px solid ${th.color}`, borderRadius: 10, overflow: "hidden", opacity: isDragging ? 0.65 : 1, animation: canvasFlash === block.instanceId ? "blockFlash 0.5s ease" : undefined, flexShrink: 0, transition: "opacity 0.15s, border-color 0.15s", transform: isDragging ? "scale(1.02)" : "none" }}>
                          <div style={{ display: "flex", alignItems: "center", padding: "8px 12px", gap: 8 }}>
                            <span onTouchStart={e => onTouchStart(idx, e)} style={{ cursor: "grab", opacity: 0.35, touchAction: "none", display: "flex", padding: 3 }}><GripVertical size={17} /></span>
                            <span style={{ color: th.color, display: "flex" }}><CatIc size={15} /></span>
                            <span style={{ fontSize: 13, color: C.dim }}>{block.catLabel}</span>
                            <span style={{ fontSize: 12, color: C.dim, opacity: 0.5 }}>›</span>
                            <span style={{ fontSize: 14, fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{block.label}</span>
                            {!varMode && (
                              <div style={{ display: "flex", gap: 2 }}>
                                {idx > 0 && <button onClick={() => moveBlock(idx, idx - 1)} style={tb}><ChevronUp size={16} /></button>}
                                {idx < canvas.length - 1 && <button onClick={() => moveBlock(idx, idx + 1)} style={tb}><ChevronDown size={16} /></button>}
                                <button onClick={() => isEd ? saveEdit(block.instanceId) : startEdit(block)} style={tb}>{isEd ? <Check size={16} /> : <Edit3 size={16} />}</button>
                                <button onClick={() => dupBlock(block.instanceId)} style={tb}><Copy size={16} /></button>
                                <button onClick={() => removeFromCanvas(block.instanceId)} style={{ ...tb, color: C.red }}><X size={16} /></button>
                              </div>
                            )}
                          </div>
                          {isEd ? (
                            <textarea value={editContent} onChange={e => setEditContent(e.target.value)} style={{ width: "100%", background: C.bg, border: "none", color: C.text, padding: 12, fontSize: 14, fontFamily: "monospace", minHeight: 80, resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6 }} autoFocus />
                          ) : (
                            <div onClick={() => !varMode && startEdit(block)} style={{ padding: "6px 12px 10px", fontSize: 14, lineHeight: 1.6, color: C.dim, whiteSpace: "pre-wrap", cursor: varMode ? "default" : "text", fontFamily: "monospace" }}>
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
                <div style={{ width: isMobile ? "100%" : 300, maxHeight: isMobile ? "34vh" : undefined, flex: isMobile ? "0 0 auto" : "0 0 300px", background: C.surface, borderLeft: isMobile ? "none" : `1px solid ${C.border}`, borderTop: isMobile ? `1px solid ${C.border}` : "none", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <div style={{ padding: "12px 18px", borderBottom: `1px solid ${C.border}`, flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}><ToggleRight size={17} color={C.accent} /> 穴埋め入力</span>
                    <span style={{ fontSize: 13, color: filledCount === allVars.length && allVars.length > 0 ? C.green : C.dim, fontWeight: 600 }}>{filledCount === allVars.length && allVars.length > 0 ? "完了" : `${filledCount}/${allVars.length}`}</span>
                  </div>
                  <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
                    {allVars.map((v, i) => {
                      const filled = !!varValues[v.name]?.trim();
                      return (
                        <div key={v.name}>
                          <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, fontSize: 14, fontWeight: 600, color: filled ? C.green : C.text }}>{v.name}{filled && <Check size={14} color={C.green} />}</label>
                          <input value={varValues[v.name] || ""} onChange={e => setVarValues(p => ({ ...p, [v.name]: e.target.value }))} placeholder={`${v.name}...`} style={{ ...inp, borderColor: filled ? `${C.green}40` : C.border, fontSize: 14, padding: "8px 12px" }} autoFocus={i === 0} />
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ padding: "10px 16px", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
                    <button onClick={copyOutput} style={{ background: C.accent, color: C.accentFg, border: "none", borderRadius: 8, padding: "10px 0", width: "100%", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit" }}>
                      {copied ? <><Check size={17} /> コピー済み</> : <><Clipboard size={17} /> 完成プロンプトをコピー</>}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {canvas.length > 0 && !varMode && (
              <div style={{ padding: "8px 18px", borderTop: `1px solid ${C.border}`, background: C.surface, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: C.dim, display: "flex", alignItems: "center", gap: 6 }}><Layers size={14} /> {canvas.length}ブロック{hasVars ? ` · ${allVars.length}箇所の穴埋め` : ""}</span>
                <button onClick={copyOutput} style={gb}>{copied ? <><Check size={15} color={C.green} /><span style={{ fontSize: 13 }}>コピー済み</span></> : <><Clipboard size={15} /><span style={{ fontSize: 13 }}>コピー</span></>}</button>
              </div>
            )}
          </div>
        )}

        {/* BLOCK SELECTOR */}
        {(!isMobile || mobileView === "build") && !varMode && (
          <div style={{ flex: isMobile ? "0 0 auto" : "0 1 360px", maxWidth: isMobile ? undefined : 360, maxHeight: isMobile ? "42vh" : undefined, background: C.surface, borderTop: isMobile ? `1px solid ${C.border}` : "none", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", flexWrap: "wrap", borderBottom: `1px solid ${C.border}`, flexShrink: 0, background: C.surface }}>
              {Object.entries(CAT).map(([id, cat]) => {
                const sel = selectedCat === id;
                return (
                  <button key={id} onClick={() => setSelectedCat(sel ? null : id)}
                    style={{ background: sel ? cat.bg : "transparent", border: "none", borderBottom: `2px solid ${sel ? cat.color : "transparent"}`, padding: isMobile ? "10px 10px" : "10px 0", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, color: sel ? cat.color : C.dim, transition: "all 0.12s", flex: "1 1 calc(100% / 3)", minWidth: 0 }}>
                    <cat.Icon size={isMobile ? 20 : 22} />
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
              {!selectedCat ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 24 }}>
                  <ChevronUp size={24} color={C.dim} /><p style={{ fontSize: 14, color: C.dim, textAlign: "center", margin: "8px 0 0" }}>カテゴリを選択</p>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: 13, color: selCat.color, padding: "4px 8px 8px", fontWeight: 600, margin: 0 }}>{selCat.desc}</p>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr", gap: 6 }}>
                    {blocksForCat.map(block => {
                      const isCustom = block.id.startsWith("u-");
                      const bVars = extractVars(block.content);
                      return (
                        <button key={block.id} onClick={() => addToCanvas(block, selectedCat)}
                          style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: isMobile ? "12px" : "12px 14px", cursor: "pointer", display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? 6 : 10, textAlign: "left", color: C.text, transition: "all 0.12s", fontFamily: "inherit", width: "100%" }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = selCat.color + "66"} onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                          <div style={{ width: 36, height: 36, borderRadius: 9, background: selCat.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${selCat.color}22` }}>
                            <GetIcon id={block.id} size={17} color={selCat.color} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 15, fontWeight: 600 }}>{block.label}</span>
                              {isCustom && <span style={{ fontSize: 11, background: C.surface3, color: C.dim, padding: "2px 6px", borderRadius: 4 }}>カスタム</span>}
                              {bVars.length > 0 && <span style={{ fontSize: 11, color: C.accent, opacity: 0.7 }}>{bVars.length}箇所</span>}
                            </div>
                            {!isMobile && <div style={{ fontSize: 13, color: C.dim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>{block.content.slice(0, 50)}</div>}
                          </div>
                          {isCustom && <span onClick={e => { e.stopPropagation(); deleteCustomBlock(selectedCat, block.id); }} style={{ color: C.dim, cursor: "pointer", padding: 4, display: "flex" }}><Trash2 size={15} /></span>}
                        </button>
                      );
                    })}
                    <button onClick={() => { setNewBlockCat(selectedCat); setShowNewBlock(true); }}
                      style={{ background: "transparent", border: `1px dashed ${C.border}`, borderRadius: 10, padding: 14, cursor: "pointer", color: C.dim, fontSize: 14, fontWeight: 600, fontFamily: "inherit", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "color 0.12s", gridColumn: isMobile ? "1 / -1" : undefined }}
                      onMouseEnter={e => e.currentTarget.style.color = selCat.color} onMouseLeave={e => e.currentTarget.style.color = C.dim}>
                      <Plus size={17} /> ブロックを追加
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {isMobile && mobileView === "saved" && (
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}><Save size={20} /> 保存済み</h3>
            {!user ? <div style={{ textAlign: "center", padding: 36 }}><p style={{ color: C.dim, marginBottom: 14, fontSize: 15 }}>ログインして保存機能を利用</p><button onClick={() => setAuthScreen(true)} style={{ ...gb, color: C.accent }}>ログイン</button></div>
            : !savedPrompts.length ? <p style={{ color: C.dim, textAlign: "center", padding: 36, fontSize: 15 }}>まだ保存されたプロンプトはありません</p>
            : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{savedPrompts.map(p => <SC key={p.id} p={p} onLoad={loadPrompt} onDelete={deletePrompt} C={C} />)}</div>}
          </div>
        )}
      </div>

      {showSaved && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "flex-end" }} onClick={() => setShowSaved(false)}>
          <div style={{ width: isMobile ? "88%" : 400, height: "100%", background: C.surface, borderLeft: `1px solid ${C.border}`, overflowY: "auto", padding: 22, boxShadow: `-8px 0 40px ${isDark ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.1)"}` }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}><h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}><Save size={20} /> 保存済み</h3><button onClick={() => setShowSaved(false)} style={tb}><X size={20} /></button></div>
            {!user ? <div style={{ textAlign: "center", padding: 36 }}><p style={{ color: C.dim, marginBottom: 14, fontSize: 15 }}>ログインして保存機能を利用</p><button onClick={() => { setAuthScreen(true); setShowSaved(false); }} style={{ ...gb, color: C.accent }}>ログイン</button></div>
            : !savedPrompts.length ? <p style={{ color: C.dim, fontSize: 15 }}>まだ保存されたプロンプトはありません</p>
            : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{savedPrompts.map(p => <SC key={p.id} p={p} onLoad={loadPrompt} onDelete={deletePrompt} C={C} />)}</div>}
          </div>
        </div>
      )}

      {isMobile && (
        <div style={{ flexShrink: 0, background: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", padding: "6px 0 env(safe-area-inset-bottom, 6px)" }}>
          {[{ key: "build", Ic: Layers, label: "つくる" }, { key: "saved", Ic: Save, label: "保存済み" }].map(t => (
            <button key={t.key} onClick={() => setMobileView(t.key)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: mobileView === t.key ? C.accent : C.dim, padding: "5px 0" }}>
              <t.Ic size={20} /><span style={{ fontSize: 12, fontWeight: 600 }}>{t.label}</span>
            </button>
          ))}
        </div>
      )}

      {authScreen && (
        <div style={ov} onClick={() => setAuthScreen(false)}>
          <div style={ml} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 700 }}>{authStep === "email" ? "ログイン" : "認証コード"}</h2>
            <p style={{ margin: "0 0 16px", fontSize: 14, color: C.dim }}>{authStep === "email" ? "メールアドレスを入力" : `${email} に送信されたコード`}</p>
            {authStep === "email" ? (
              <><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={inp} onKeyDown={e => e.key === "Enter" && handleSendCode()} autoFocus /><button onClick={handleSendCode} style={pb}>認証コードを送信</button></>
            ) : (
              <>
                <div style={{ background: C.surface3, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 14 }}>デモ認証コード: <strong style={{ color: C.accent, fontFamily: "monospace", letterSpacing: 2 }}>{sentCode}</strong><br /><span style={{ fontSize: 12, color: C.dim }}>※ 本番ではメールで送信</span></div>
                <input type="text" value={verCode} onChange={e => setVerCode(e.target.value)} placeholder="6桁のコード" maxLength={6} style={{ ...inp, textAlign: "center", fontSize: 24, letterSpacing: 8, fontFamily: "monospace" }} onKeyDown={e => e.key === "Enter" && handleVerify()} autoFocus />
                <button onClick={handleVerify} style={pb}>認証する</button>
                <button onClick={() => { setAuthStep("email"); setSentCode(null); }} style={{ ...gb, width: "100%", marginTop: 8, justifyContent: "center" }}>戻る</button>
              </>
            )}
            {authError && <p style={{ color: C.red, fontSize: 14, marginTop: 8 }}>{authError}</p>}
          </div>
        </div>
      )}

      {showNewBlock && (
        <div style={ov} onClick={() => setShowNewBlock(false)}>
          <div style={ml} onClick={e => e.stopPropagation()}>
            {(() => { const cat = CAT[newBlockCat] || CAT.role; return (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: cat.bg, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${cat.color}22` }}><cat.Icon size={20} color={cat.color} /></div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>「{cat.label}」にブロック追加</h2>
                </div>
                <input value={newBlockData.label} onChange={e => setNewBlockData({ ...newBlockData, label: e.target.value })} placeholder="ブロック名" style={{ ...inp, marginBottom: 10 }} autoFocus />
                <textarea value={newBlockData.content} onChange={e => setNewBlockData({ ...newBlockData, content: e.target.value })} placeholder={"テンプレートを入力\n{項目名}で穴埋め箇所を作れます"} style={{ ...inp, minHeight: 120, resize: "vertical", fontFamily: "monospace", fontSize: 14 }} />
                <p style={{ fontSize: 13, color: C.dim, margin: "10px 0 0" }}>{"{"}項目名{"}"} → あとから入力できます</p>
                <button onClick={addCustomBlock} style={{ ...pb, background: cat.color }} disabled={!newBlockData.label || !newBlockData.content}>保存</button>
              </>
            ); })()}
          </div>
        </div>
      )}

      {showInfo && (
        <div style={ov} onClick={() => setShowInfo(false)}>
          <div style={{ ...ml, maxWidth: 520, maxHeight: "85vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${C.accent}18`, display: "flex", alignItems: "center", justifyContent: "center" }}><Layers size={24} color={C.accent} /></div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Prompt Blocks</h2>
                  <span style={{ fontSize: 12, color: C.dim, background: `${C.accent}15`, padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>モック版</span>
                </div>
              </div>
              <button onClick={() => setShowInfo(false)} style={tb}><X size={20} /></button>
            </div>

            <div style={{ background: C.surface2, borderRadius: 12, padding: 18, marginBottom: 16, border: `1px solid ${C.border}` }}>
              <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: C.accent }}>このサービスについて</h3>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: C.text }}>
                プロンプトの構成要素を「ブロック」として保存し、レゴのように組み合わせることで、効率的にプロンプトを作成できるツールです。
              </p>
              <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.7, color: C.dim }}>
                ソフトウェアのインストール不要。ブラウザだけで誰でもすぐに使えます。
              </p>
            </div>

            <div style={{ background: C.surface2, borderRadius: 12, padding: 18, marginBottom: 16, border: `1px solid ${C.border}` }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 17, fontWeight: 700, color: C.green }}>使い方ガイド</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { step: "1", title: "カテゴリを選ぶ", desc: "右側（モバイルでは下部）の6つのカテゴリ（役割・入力・タスク・出力形式・制約・テクニック）から、使いたい種類を選びます。" },
                  { step: "2", title: "ブロックを追加", desc: "表示されたブロック一覧から、使いたいブロックをタップするとキャンバスに追加されます。複数のブロックを組み合わせましょう。" },
                  { step: "3", title: "穴埋めを入力", desc: "ブロック内の {項目名} の部分は、「穴埋め」ボタンから具体的な値を入力できます。" },
                  { step: "4", title: "コピーして使う", desc: "完成したプロンプトをコピーボタンでクリップボードにコピーし、お好きなAIツールに貼り付けて使えます。" },
                ].map(item => (
                  <div key={item.step} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${C.green}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 700, fontSize: 15, color: C.green }}>{item.step}</div>
                    <div>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{item.title}</p>
                      <p style={{ margin: "4px 0 0", fontSize: 14, lineHeight: 1.6, color: C.dim }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: C.surface2, borderRadius: 12, padding: 18, marginBottom: 16, border: `1px solid ${C.border}` }}>
              <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: "#C084FC" }}>便利な機能</h3>
              <ul style={{ margin: 0, padding: "0 0 0 20px", fontSize: 14, lineHeight: 2, color: C.dim }}>
                <li>ブロックの<strong style={{ color: C.text }}>並び替え</strong>（ドラッグ、または上下ボタン）</li>
                <li>ブロック内容の<strong style={{ color: C.text }}>編集</strong>（鉛筆アイコン、またはテキストをクリック）</li>
                <li>ブロックの<strong style={{ color: C.text }}>複製</strong>・<strong style={{ color: C.text }}>削除</strong></li>
                <li><strong style={{ color: C.text }}>カスタムブロック</strong>の作成・保存</li>
                <li>ログインすると<strong style={{ color: C.text }}>プロンプトの保存・読み込み</strong>が可能</li>
              </ul>
            </div>

            <a href="https://github.com/craftpaperbag" target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 18px", textDecoration: "none", color: C.text, fontSize: 15, fontWeight: 600, transition: "border-color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.accent} onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
              <Globe size={20} color={C.accent} />
              作成者の GitHub を見る
              <ExternalLink size={15} color={C.dim} />
            </a>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box}body{margin:0}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
        @keyframes slideDown{from{opacity:0;transform:translate(-50%,-12px)}to{opacity:1;transform:translate(-50%,0)}}
        @keyframes blockFlash{0%{box-shadow:0 0 0 0 rgba(88,166,255,0.4)}50%{box-shadow:0 0 14px 3px rgba(88,166,255,0.2)}100%{box-shadow:0 0 0 0 rgba(88,166,255,0)}}
        textarea:focus,input:focus{outline:none;border-color:${C.accent}!important}
        button:disabled{opacity:0.35;cursor:not-allowed}
      `}</style>
    </div>
  );
}

function SC({ p, onLoad, onDelete, C }) {
  return (
    <div style={{ background: C.surface2, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 16, fontWeight: 600 }}>{p.name}</span><span style={{ fontSize: 12, color: C.dim }}>{new Date(p.createdAt).toLocaleDateString("ja-JP")}</span></div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", margin: "8px 0 10px" }}>
        {p.blocks.map((b, i) => { const cat = CAT[b.catId] || CAT.technique; return <span key={i} style={{ fontSize: 12, background: cat.bg, color: cat.color, padding: "3px 8px", borderRadius: 5, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><cat.Icon size={12} /> {b.label}</span>; })}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={() => onLoad(p)} style={{ background: C.accent, color: C.accentFg, border: "none", borderRadius: 8, padding: "8px 0", flex: 1, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>読み込む</button>
        <button onClick={() => onDelete(p.id)} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", padding: "6px 10px", display: "flex", alignItems: "center" }}><Trash2 size={17} /></button>
      </div>
    </div>
  );
}
