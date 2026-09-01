'use client';

import { useEffect, useMemo, useState } from 'react';
import { demoAccount, demoSignals, demoPositions, demoDecisions } from '../lib/demo.js';

const tabs = ['Overview','Intelligence','Portfolio','Paper Orders','Journal','Settings'];

function money(n){ return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(Number(n||0)); }
function pct(n){ return `${Number(n||0)>=0?'+':''}${Number(n||0).toFixed(2)}%`; }

export default function Home(){
  const [tab,setTab]=useState('Overview');
  const [health,setHealth]=useState(null);
  const [news,setNews]=useState([]);
  const [selected,setSelected]=useState(demoSignals[0]);
  const [analysis,setAnalysis]=useState(null);
  const [busy,setBusy]=useState(false);

  useEffect(()=>{
    const load=async()=>{
      try{ setHealth(await fetch('/api/health',{cache:'no-store'}).then(r=>r.json())); }catch{}
      try{ const n=await fetch('/api/news',{cache:'no-store'}).then(r=>r.json()); setNews(n.news||[]); }catch{}
    };
    load();
    const id=setInterval(load,60000);
    return()=>clearInterval(id);
  },[]);

  const mode=health?.mode||'demo';
  const liveNews=useMemo(()=>news.slice(0,12),[news]);

  async function analyzeSignal(item){
    setBusy(true); setSelected(item); setAnalysis(null);
    try{
      const res=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({symbol:item.symbol,headline:item.headline||item.event,context:item.summary||''})});
      setAnalysis(await res.json());
    }catch(e){ setAnalysis({error:String(e)}); }
    finally{setBusy(false);}
  }

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
      <div className="sidebarFoot"><div className={`statusDot ${mode==='alpaca-paper'?'on':''}`}></div><div><b>{mode==='alpaca-paper'?'Alpaca Paper':'Demo Mode'}</b><span>Live trading disabled</span></div></div>
    </aside>

    <section className="content">
      <header className="topbar"><div><p className="eyebrow">MARKET COMMAND CENTER</p><h1>{tab}</h1></div><div className="topActions"><span className="pill safe">PAPER ONLY</span><span className={`pill ${health?.killSwitch?'danger':'safe'}`}>Kill switch: {health?.killSwitch?'ON':'OFF'}</span></div></header>

      {tab==='Overview' && <>
        <section className="metrics">{metrics.map(([k,v,c])=><div className="metric" key={k}><span>{k}</span><strong className={c}>{v}</strong></div>)}</section>
        <div className="grid2">
          <section className="panel"><PanelHead title="Top Opportunities" sub="AI-ranked demo opportunities"/><div className="tableWrap"><table><thead><tr><th>Symbol</th><th>Event</th><th>Move</th><th>AI</th><th>Status</th></tr></thead><tbody>{demoSignals.map(s=><tr key={s.id} onClick={()=>analyzeSignal(s)}><td><b>{s.symbol}</b><small>{s.company}</small></td><td>{s.event}</td><td className={s.move>=0?'positive':'negative'}>{pct(s.move)}</td><td>{s.confidence}% · {s.impact}</td><td><span className={`badge ${s.status.toLowerCase()}`}>{s.status}</span></td></tr>)}</tbody></table></div></section>
          <section className="panel"><PanelHead title="Risk Status" sub="Deterministic controls override AI"/><div className="riskGrid">
            <Risk label="Live trading" value="Disabled" good/>
            <Risk label="Auto paper execution" value={health?.autoExecutionEnabled?'Enabled':'Off'} good={!health?.autoExecutionEnabled}/>
            <Risk label="Max order" value="$2,500" good/>
            <Risk label="Max position" value="10% equity" good/>
            <Risk label="Daily loss cap" value="2%" good/>
            <Risk label="Open positions cap" value="8" good/>
          </div><div className="notice">AI can recommend. It cannot size orders, change limits, bypass the kill switch, or access a live broker endpoint.</div></section>
        </div>
        <div className="grid2">
          <section className="panel"><PanelHead title="Open Paper Positions" sub="Demo until Alpaca paper credentials are configured"/><div className="tableWrap"><table><thead><tr><th>Symbol</th><th>Qty</th><th>Avg</th><th>Price</th><th>Unrealized</th></tr></thead><tbody>{demoPositions.map(p=><tr key={p.symbol}><td><b>{p.symbol}</b></td><td>{p.qty}</td><td>{money(p.avg)}</td><td>{money(p.price)}</td><td className={p.pnl>=0?'positive':'negative'}>{money(p.pnl)}</td></tr>)}</tbody></table></div></section>
          <section className="panel"><PanelHead title="Recent Decisions" sub="Paper-trading audit preview"/><div className="feed">{demoDecisions.map((d,i)=><div className="feedRow" key={i}><span>{d.time}</span><b>{d.symbol}</b><div><strong>{d.type}</strong><small>{d.detail}</small></div></div>)}</div></section>
        </div>
      </>}

      {tab==='Intelligence' && <div className="grid2 intelligenceGrid">
        <section className="panel"><PanelHead title="News Intelligence" sub={mode==='alpaca-paper'?'Latest Alpaca market news':'Connect Alpaca paper credentials to load live market news'}/>{liveNews.length? <div className="newsList">{liveNews.map(n=><button key={n.id} className="newsCard" onClick={()=>analyzeSignal({symbol:n.symbols?.[0]||'SPY',headline:n.headline,summary:n.summary})}><div><span>{n.source}</span><time>{new Date(n.createdAt).toLocaleTimeString()}</time></div><strong>{n.headline}</strong><small>{(n.symbols||[]).join(' · ')}</small></button>)}</div>:<div className="empty">No live news feed configured yet. The app remains in safe demo mode.</div>}</section>
        <section className="panel analysisPanel"><PanelHead title="AI Research" sub={selected?.symbol?`Selected: ${selected.symbol}`:'Select an intelligence item'}/>{busy?<div className="empty">Analyzing supplied market context…</div>:analysis?<Analysis a={analysis}/>:<div className="empty">Select a signal or news item to generate a structured research memo.</div>}</section>
      </div>}

      {tab==='Portfolio' && <section className="panel"><PanelHead title="Paper Portfolio" sub="Long-only · live trading disabled"/><div className="metrics compact">{metrics.slice(0,4).map(([k,v,c])=><div className="metric" key={k}><span>{k}</span><strong className={c}>{v}</strong></div>)}</div><div className="tableWrap"><table><thead><tr><th>Symbol</th><th>Quantity</th><th>Average entry</th><th>Current</th><th>Market value</th><th>P&L</th></tr></thead><tbody>{demoPositions.map(p=><tr key={p.symbol}><td><b>{p.symbol}</b></td><td>{p.qty}</td><td>{money(p.avg)}</td><td>{money(p.price)}</td><td>{money(p.value)}</td><td className={p.pnl>=0?'positive':'negative'}>{money(p.pnl)}</td></tr>)}</tbody></table></div></section>}

      {tab==='Paper Orders' && <section className="panel"><PanelHead title="Paper Order Gateway" sub="Server-authoritative risk engine"/><div className="empty large"><b>Paper execution is {health?.paperExecutionEnabled?'enabled':'locked'}.</b><p>Orders are accepted only after server-side Alpaca paper account checks, exposure limits, daily loss limits, long-only inventory checks, stale-signal checks and duplicate blocking.</p><code>POST /api/paper-order</code><p>Keep PAPER_EXECUTION_ENABLED=false until you have reviewed demo signals and connected a paper account.</p></div></section>}

      {tab==='Journal' && <section className="panel"><PanelHead title="Trade Journal" sub="Every decision should be explainable"/><div className="feed journal">{demoDecisions.concat(demoDecisions).map((d,i)=><div className="feedRow" key={i}><span>{d.time}</span><b>{d.symbol}</b><div><strong>{d.type}</strong><small>{d.detail}</small></div></div>)}</div></section>}

      {tab==='Settings' && <section className="settingsGrid">
        <div className="panel"><PanelHead title="Execution" sub="Safe defaults"/><Setting label="Broker mode" value={mode==='alpaca-paper'?'Alpaca Paper':'Demo'}/><Setting label="Live trading" value="Permanently disabled"/><Setting label="Paper execution" value={health?.paperExecutionEnabled?'Enabled':'Disabled'}/><Setting label="Auto paper execution" value={health?.autoExecutionEnabled?'Enabled':'Disabled'}/><Setting label="Kill switch" value={health?.killSwitch?'ACTIVE':'Off'}/></div>
        <div className="panel"><PanelHead title="AI + Data" sub="Configuration status"/><Setting label="OpenAI" value={health?.aiConfigured?'Configured':'Demo fallback'}/><Setting label="Alpaca market data" value={mode==='alpaca-paper'?'Configured':'Not configured'}/><Setting label="News refresh" value="60 seconds"/><Setting label="Live-money endpoint" value="Not present in code"/></div>
      </section>}

      <footer>Research and paper trading only. Not financial advice. Live trading is disabled. Simulated results do not guarantee future performance.</footer>
    </section>
  </main>
}

function PanelHead({title,sub}){return <div className="panelHead"><div><h2>{title}</h2><p>{sub}</p></div></div>}
function Risk({label,value,good}){return <div className="risk"><span>{label}</span><b className={good?'positive':''}>{value}</b></div>}
function Setting({label,value}){return <div className="setting"><span>{label}</span><b>{value}</b></div>}
function Analysis({a}){ if(a.error)return <div className="empty negative">{a.error}</div>; return <div className="analysis"><div className="analysisScore"><span className={`signal ${String(a.signal||'HOLD').toLowerCase()}`}>{a.signal}</span><b>{a.confidence}% confidence</b><b>{a.impact}/10 impact</b></div><h3>{a.summary}</h3><p>{a.thesis}</p><div className="analysisBlock"><span>Risks</span><ul>{(a.risks||[]).map((r,i)=><li key={i}>{r}</li>)}</ul></div><div className="analysisBlock"><span>Invalidation</span><p>{a.invalidation}</p></div><div className="analysisBlock"><span>Priced in?</span><p>{a.pricedIn}</p></div>{a.demo&&<span className="pill warning">DEMO ANALYSIS</span>}</div>}
