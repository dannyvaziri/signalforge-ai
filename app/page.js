'use client';

import { useEffect, useMemo, useState } from 'react';
import { demoAccount, demoSignals, demoPositions, demoDecisions } from '../lib/demo.js';
import { brokers } from '../lib/brokers.js';

const tabs = ['Overview','Intelligence','Portfolio','Paper Orders','Journal','Settings'];
const presets = [
  { id:'conservative', name:'Conservative', sub:'Smaller paper positions · highest signal threshold', order:'$500', position:'3%', loss:'0.75%', confidence:'93%' },
  { id:'balanced', name:'Balanced', sub:'Measured paper risk for normal testing', order:'$1,000', position:'5%', loss:'1%', confidence:'90%', recommended:true },
  { id:'growth', name:'Growth', sub:'Larger paper positions with tighter guardrails than the global cap', order:'$1,500', position:'7.5%', loss:'1.5%', confidence:'88%' },
];

function money(n){ return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(Number(n||0)); }
function pct(n){ return `${Number(n||0)>=0?'+':''}${Number(n||0).toFixed(2)}%`; }

export default function Home(){
  const [tab,setTab]=useState('Overview');
  const [health,setHealth]=useState(null);
  const [news,setNews]=useState([]);
  const [selected,setSelected]=useState(demoSignals[0]);
  const [analysis,setAnalysis]=useState(null);
  const [busy,setBusy]=useState(false);
  const [status,setStatus]=useState(null);
  const [preset,setPreset]=useState('balanced');
  const [notice,setNotice]=useState('');

  async function loadStatus(){
    try{ setStatus(await fetch('/api/onboarding/status',{cache:'no-store'}).then(r=>r.json())); }catch{ setStatus({authenticated:false,user:null,broker:null,auto:{active:false}}); }
  }

  useEffect(()=>{
    loadStatus();
    const params=new URLSearchParams(window.location.search);
    if(params.get('auth')==='google-config') setNotice('Google sign-in needs its OAuth keys added to Hostinger before this button can go live.');
    if(params.get('auth')==='google-error') setNotice('Google sign-in did not complete. Try again.');
    if(params.get('broker')==='alpaca-config') setNotice('Alpaca paper OAuth needs the app client ID and secret added to Hostinger.');
    if(params.get('broker')==='alpaca-error') setNotice('The Alpaca paper connection did not complete. Try again.');
    if(params.get('broker')==='connected') setNotice('Alpaca Paper connected successfully.');
  },[]);

  useEffect(()=>{
    if(!status?.authenticated) return;
    const load=async()=>{
      try{ setHealth(await fetch('/api/health',{cache:'no-store'}).then(r=>r.json())); }catch{}
      try{ const n=await fetch('/api/news',{cache:'no-store'}).then(r=>r.json()); setNews(n.news||[]); }catch{}
    };
    load();
    const id=setInterval(load,60000);
    return()=>clearInterval(id);
  },[status?.authenticated]);

  const mode=status?.broker?.paper?'alpaca-paper':(health?.mode||'demo');
  const liveNews=useMemo(()=>news.slice(0,12),[news]);
  const onboardingStep=!status?.authenticated?1:!status?.broker?2:!status?.auto?.active?3:4;

  async function startAuto(){
    setBusy(true); setNotice('');
    try{
      const res=await fetch('/api/auto/config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({preset,active:true})});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||'Could not start paper auto mode.');
      await loadStatus();
    }catch(e){setNotice(String(e.message||e));}
    finally{setBusy(false);}
  }

  async function logout(){
    await fetch('/api/auth/logout',{method:'POST'}).catch(()=>{});
    setStatus({authenticated:false,user:null,broker:null,auto:{active:false}});
    setTab('Overview');
  }

  async function analyzeSignal(item){
    setBusy(true); setSelected(item); setAnalysis(null);
    try{
      const res=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({symbol:item.symbol,headline:item.headline||item.event,context:item.summary||''})});
      setAnalysis(await res.json());
    }catch(e){ setAnalysis({error:String(e)}); }
    finally{setBusy(false);}
  }

  if(!status) return <main className="onboarding"><div className="loadingCard"><div className="logo">SF</div><b>Loading SignalForge…</b></div></main>;
  if(onboardingStep<4) return <Onboarding step={onboardingStep} status={status} preset={preset} setPreset={setPreset} startAuto={startAuto} busy={busy} notice={notice}/>;

  const metrics=[
    ['Paper Equity',money(demoAccount.equity),'neutral'],
    ["Today's P&L",money(demoAccount.dayPnl),'positive'],
    ['Buying Power',money(demoAccount.buyingPower),'neutral'],
    ['Open Positions',demoAccount.openPositions,'neutral'],
    ['AI Signals',demoAccount.signalsToday,'neutral'],
    ['Risk Rejected',demoAccount.rejectedToday,'warning'],
  ];

  return <main className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="logo">SF</div><div><strong>SignalForge</strong><span>AI PAPER TRADER</span></div></div>
      <nav>{tabs.map(t=><button key={t} onClick={()=>setTab(t)} className={tab===t?'active':''}>{t}</button>)}</nav>
      <div className="sidebarFoot"><div className="statusDot on"></div><div><b>{status.broker?.name} Paper</b><span>{status.auto?.preset} auto strategy armed</span></div></div>
    </aside>

    <section className="content">
      <header className="topbar"><div><p className="eyebrow">MARKET COMMAND CENTER</p><h1>{tab}</h1></div><div className="topActions"><span className="pill safe">PAPER ONLY</span><span className="pill safe">AUTO: {String(status.auto?.preset||'balanced').toUpperCase()}</span><button className="textButton" onClick={logout}>Sign out</button></div></header>

      {tab==='Overview' && <>
        <section className="welcomeStrip"><div><span className="eyebrow">SIGNED IN AS</span><b>{status.user?.name||status.user?.email}</b></div><div><span>Broker</span><b>{status.broker?.name} Paper</b></div><div><span>Strategy</span><b>{status.auto?.preset}</b></div><div><span>Live money</span><b className="positive">Disabled</b></div></section>
        <section className="metrics">{metrics.map(([k,v,c])=><div className="metric" key={k}><span>{k}</span><strong className={c}>{v}</strong></div>)}</section>
        <div className="grid2">
          <section className="panel"><PanelHead title="Top Opportunities" sub="AI-ranked paper opportunities"/><div className="tableWrap"><table><thead><tr><th>Symbol</th><th>Event</th><th>Move</th><th>AI</th><th>Status</th></tr></thead><tbody>{demoSignals.map(s=><tr key={s.id} onClick={()=>analyzeSignal(s)}><td><b>{s.symbol}</b><small>{s.company}</small></td><td>{s.event}</td><td className={s.move>=0?'positive':'negative'}>{pct(s.move)}</td><td>{s.confidence}% · {s.impact}</td><td><span className={`badge ${s.status.toLowerCase()}`}>{s.status}</span></td></tr>)}</tbody></table></div></section>
          <section className="panel"><PanelHead title="Risk Status" sub="Deterministic controls override AI"/><div className="riskGrid">
            <Risk label="Live trading" value="Disabled" good/>
            <Risk label="Auto paper strategy" value="Armed" good/>
            <Risk label="Preset" value={status.auto?.preset||'balanced'} good/>
            <Risk label="Broker" value={`${status.broker?.name} Paper`} good/>
            <Risk label="Global max order" value="$2,500" good/>
            <Risk label="Open positions cap" value="8" good/>
          </div><div className="notice">The onboarding flow only authorizes paper-mode connections in this deployment. Live-money execution remains outside this build.</div></section>
        </div>
        <div className="grid2">
          <section className="panel"><PanelHead title="Open Paper Positions" sub="Paper portfolio preview"/><div className="tableWrap"><table><thead><tr><th>Symbol</th><th>Qty</th><th>Avg</th><th>Price</th><th>Unrealized</th></tr></thead><tbody>{demoPositions.map(p=><tr key={p.symbol}><td><b>{p.symbol}</b></td><td>{p.qty}</td><td>{money(p.avg)}</td><td>{money(p.price)}</td><td className={p.pnl>=0?'positive':'negative'}>{money(p.pnl)}</td></tr>)}</tbody></table></div></section>
          <section className="panel"><PanelHead title="Recent Decisions" sub="Paper-trading audit preview"/><div className="feed">{demoDecisions.map((d,i)=><div className="feedRow" key={i}><span>{d.time}</span><b>{d.symbol}</b><div><strong>{d.type}</strong><small>{d.detail}</small></div></div>)}</div></section>
        </div>
      </>}

      {tab==='Intelligence' && <div className="grid2 intelligenceGrid">
        <section className="panel"><PanelHead title="News Intelligence" sub={liveNews.length?'Latest connected market news':'No live feed configured yet'}/>{liveNews.length? <div className="newsList">{liveNews.map(n=><button key={n.id} className="newsCard" onClick={()=>analyzeSignal({symbol:n.symbols?.[0]||'SPY',headline:n.headline,summary:n.summary})}><div><span>{n.source}</span><time>{new Date(n.createdAt).toLocaleTimeString()}</time></div><strong>{n.headline}</strong><small>{(n.symbols||[]).join(' · ')}</small></button>)}</div>:<div className="empty">Connect the configured market-data credentials to populate live intelligence.</div>}</section>
        <section className="panel analysisPanel"><PanelHead title="AI Research" sub={selected?.symbol?`Selected: ${selected.symbol}`:'Select an intelligence item'}/>{busy?<div className="empty">Analyzing supplied market context…</div>:analysis?<Analysis a={analysis}/>:<div className="empty">Select a signal or news item to generate a structured research memo.</div>}</section>
      </div>}

      {tab==='Portfolio' && <section className="panel"><PanelHead title="Paper Portfolio" sub="Long-only · live trading disabled"/><div className="metrics compact">{metrics.slice(0,4).map(([k,v,c])=><div className="metric" key={k}><span>{k}</span><strong className={c}>{v}</strong></div>)}</div><div className="tableWrap"><table><thead><tr><th>Symbol</th><th>Quantity</th><th>Average entry</th><th>Current</th><th>Market value</th><th>P&L</th></tr></thead><tbody>{demoPositions.map(p=><tr key={p.symbol}><td><b>{p.symbol}</b></td><td>{p.qty}</td><td>{money(p.avg)}</td><td>{money(p.price)}</td><td>{money(p.value)}</td><td className={p.pnl>=0?'positive':'negative'}>{money(p.pnl)}</td></tr>)}</tbody></table></div></section>}

      {tab==='Paper Orders' && <section className="panel"><PanelHead title="Paper Order Gateway" sub="Server-authoritative risk engine"/><div className="empty large"><b>Auto strategy: {status.auto?.preset}</b><p>The user onboarding preference is saved and the connected broker is restricted to paper mode. Continuous server-side scheduling is the next backend layer; the current deployment does not claim to trade while the app is offline.</p><code>POST /api/paper-order</code></div></section>}

      {tab==='Journal' && <section className="panel"><PanelHead title="Trade Journal" sub="Every decision should be explainable"/><div className="feed journal">{demoDecisions.concat(demoDecisions).map((d,i)=><div className="feedRow" key={i}><span>{d.time}</span><b>{d.symbol}</b><div><strong>{d.type}</strong><small>{d.detail}</small></div></div>)}</div></section>}

      {tab==='Settings' && <section className="settingsGrid">
        <div className="panel"><PanelHead title="Account + Broker" sub="Onboarding status"/><Setting label="Sign-in" value="Google"/><Setting label="Account" value={status.user?.email}/><Setting label="Broker" value={`${status.broker?.name} Paper`}/><Setting label="Live trading" value="Disabled"/></div>
        <div className="panel"><PanelHead title="Automation" sub="Paper strategy"/><Setting label="Preset" value={status.auto?.preset}/><Setting label="Strategy status" value={status.auto?.active?'Armed':'Off'}/><Setting label="AI" value={health?.aiConfigured?'Configured':'Demo fallback'}/><Setting label="Always-on worker" value="Not enabled yet"/></div>
      </section>}

      <footer>Research and paper trading only. Not financial advice. Live trading is disabled. Simulated results do not guarantee future performance.</footer>
    </section>
  </main>
}

function Onboarding({step,status,preset,setPreset,startAuto,busy,notice}){
  return <main className="onboarding">
    <section className="onboardWrap">
      <header className="onboardHeader"><div className="brand"><div className="logo">SF</div><div><strong>SignalForge</strong><span>AI PAPER TRADER</span></div></div><span className="pill safe">PAPER ONLY</span></header>
      <div className="onboardHero"><p className="eyebrow">START IN MINUTES</p><h1>Set up automated paper trading in 3 steps.</h1><p>Create your account, securely connect a supported broker, then choose how you want SignalForge to manage paper-trading risk.</p></div>
      <div className="stepRail">
        <Step n="1" title="Account" text="Sign in securely" active={step===1} done={step>1}/>
        <Step n="2" title="Broker" text="Connect an account" active={step===2} done={step>2}/>
        <Step n="3" title="Auto trading" text="Choose your strategy" active={step===3} done={false}/>
      </div>
      {notice && <div className="onboardNotice">{notice}</div>}

      {step===1 && <section className="setupPanel splitSetup">
        <div><p className="eyebrow">STEP 1 OF 3</p><h2>Create or sign in to your account</h2><p>Your SignalForge account keeps your broker connection and paper strategy tied to you.</p><a className="googleButton" href="/api/auth/google/start"><span className="googleG">G</span> Continue with Google</a><button className="disabledAuth" disabled>Continue with email <span>Coming soon</span></button><small>Google authentication uses OAuth. SignalForge never receives your Google password.</small></div>
        <div className="securityCard"><b>Built for safe onboarding</b><ul><li>Encrypted server-side session cookie</li><li>Broker credentials never stored in browser JavaScript</li><li>Live-money trading disabled in this deployment</li></ul></div>
      </section>}

      {step===2 && <section className="setupPanel">
        <div className="setupTitle"><div><p className="eyebrow">STEP 2 OF 3</p><h2>Connect your broker</h2><p>Choose from popular brokerages with official API, OAuth, sandbox, or agent-integration paths.</p></div><div className="userChip"><span>{status.user?.name||status.user?.email}</span><b>Google ✓</b></div></div>
        <div className="brokerGrid">{brokers.map(b=><div className={`brokerCard ${b.status}`} key={b.id}><div className="brokerTop"><div className="brokerLogo">{b.short}</div><span className={`brokerBadge ${b.status}`}>{b.badge}</span></div><h3>{b.name}</h3><p>{b.description}</p><div className="brokerMeta"><span>{b.connection}</span><small>{b.note}</small></div>{b.id==='alpaca'?<a className="connectButton" href="/api/broker/alpaca/start">Connect Alpaca Paper</a>:<button className="connectButton muted" disabled>{b.status==='paper-locked'?'Locked in paper-only build':'Coming soon'}</button>}</div>)}</div>
      </section>}

      {step===3 && <section className="setupPanel">
        <div className="setupTitle"><div><p className="eyebrow">STEP 3 OF 3</p><h2>Choose how auto trading should work</h2><p>One screen, three controls: SignalForge finds opportunities, risk rules decide what qualifies, and only paper orders can be submitted.</p></div><div className="userChip"><span>{status.broker?.name}</span><b>Paper connected ✓</b></div></div>
        <div className="howGrid"><How n="01" title="AI scans" text="Market news and signals are ranked for potential impact."/><How n="02" title="Risk checks" text="Position size, drawdown, confidence and exposure limits are enforced."/><How n="03" title="Paper execution" text="Qualified orders can go only to the connected paper account in this build."/></div>
        <div className="presetTitle"><h3>Pick your paper strategy</h3><p>You can change this later.</p></div>
        <div className="presetGrid">{presets.map(p=><button className={`presetCard ${preset===p.id?'selected':''}`} onClick={()=>setPreset(p.id)} key={p.id}><div><b>{p.name}</b>{p.recommended&&<span>Recommended</span>}</div><p>{p.sub}</p><dl><div><dt>Max order</dt><dd>{p.order}</dd></div><div><dt>Max position</dt><dd>{p.position}</dd></div><div><dt>Daily loss cap</dt><dd>{p.loss}</dd></div><div><dt>AI confidence</dt><dd>{p.confidence}+</dd></div></dl></button>)}</div>
        <div className="startRow"><div><b>Live trading stays disabled.</b><span>This starts your paper strategy preference; always-on server scheduling is a separate backend feature.</span></div><button className="startButton" onClick={startAuto} disabled={busy}>{busy?'Starting…':'Start auto paper mode'}</button></div>
      </section>}
    </section>
  </main>
}

function Step({n,title,text,active,done}){return <div className={`step ${active?'active':''} ${done?'done':''}`}><span>{done?'✓':n}</span><div><b>{title}</b><small>{text}</small></div></div>}
function How({n,title,text}){return <div className="howCard"><span>{n}</span><h3>{title}</h3><p>{text}</p></div>}
function PanelHead({title,sub}){return <div className="panelHead"><div><h2>{title}</h2><p>{sub}</p></div></div>}
function Risk({label,value,good}){return <div className="risk"><span>{label}</span><b className={good?'positive':''}>{value}</b></div>}
function Setting({label,value}){return <div className="setting"><span>{label}</span><b>{value}</b></div>}
function Analysis({a}){ if(a.error)return <div className="empty negative">{a.error}</div>; return <div className="analysis"><div className="analysisScore"><span className={`signal ${String(a.signal||'HOLD').toLowerCase()}`}>{a.signal}</span><b>{a.confidence}% confidence</b><b>{a.impact}/10 impact</b></div><h3>{a.summary}</h3><p>{a.thesis}</p><div className="analysisBlock"><span>Risks</span><ul>{(a.risks||[]).map((r,i)=><li key={i}>{r}</li>)}</ul></div><div className="analysisBlock"><span>Invalidation</span><p>{a.invalidation}</p></div><div className="analysisBlock"><span>Priced in?</span><p>{a.pricedIn}</p></div>{a.demo&&<span className="pill warning">DEMO ANALYSIS</span>}</div>}
