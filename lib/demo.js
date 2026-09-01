export const demoAccount = {
  equity: 25742.18,
  buyingPower: 14820.22,
  dayPnl: 381.44,
  openPositions: 4,
  signalsToday: 73,
  rejectedToday: 65,
};

export const demoSignals = [
  { id:'sig-1', symbol:'NVDA', company:'NVIDIA', event:'Earnings / guidance', sentiment:'Bullish', impact:9.2, confidence:93, move:2.8, status:'APPROVED', age:'2m' },
  { id:'sig-2', symbol:'AAPL', company:'Apple', event:'Guidance revision', sentiment:'Bearish', impact:8.8, confidence:91, move:-1.7, status:'REVIEW', age:'4m' },
  { id:'sig-3', symbol:'MSFT', company:'Microsoft', event:'Cloud contract', sentiment:'Bullish', impact:8.4, confidence:89, move:1.1, status:'APPROVED', age:'6m' },
  { id:'sig-4', symbol:'TSLA', company:'Tesla', event:'Factory announcement', sentiment:'Bullish', impact:7.2, confidence:81, move:5.9, status:'REJECTED', age:'3m' },
];

export const demoPositions = [
  { symbol:'NVDA', qty:8, avg:166.20, price:171.88 },
  { symbol:'MSFT', qty:5, avg:512.40, price:518.22 },
  { symbol:'AMZN', qty:8, avg:229.18, price:231.03 },
  { symbol:'JPM', qty:7, avg:304.55, price:306.14 },
].map((p) => ({ ...p, pnl: Number(((p.price - p.avg) * p.qty).toFixed(2)), value:Number((p.price*p.qty).toFixed(2)) }));

export const demoDecisions = [
  { time:'21:01', symbol:'NVDA', type:'PAPER ORDER SENT', detail:'Risk checks passed · demo/paper only' },
  { time:'20:58', symbol:'TSLA', type:'REJECTED', detail:'Impact score below auto-execution threshold' },
  { time:'20:54', symbol:'AAPL', type:'HOLD', detail:'Awaiting market confirmation' },
  { time:'20:47', symbol:'MSFT', type:'APPROVED', detail:'Confidence 89% · impact 8.4' },
];
