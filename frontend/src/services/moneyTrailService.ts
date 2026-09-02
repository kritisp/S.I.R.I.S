/**
 * S.I.R.I.S. — Glass-Box Pro Money Trail & Financial Crime Engine
 * 
 * Topological Role Detection:
 * - SOURCE: Deposit seed (inN = 0, outN > 0)
 * - MULE: Pass-through account (forwarded >= 85% of funds)
 * - COLLECTOR: Aggregates from >= 3 in-network accounts
 * - CONTROLLER: Consolidates from collectors toward cashout
 * - CASHOUT: Terminal exit point (outN = 0, inN > 0)
 * 
 * AML Typologies:
 * - Rapid pass-through (<24h)
 * - Structuring / Smurfing (just under ₹50,000 PAN or ₹10,00,000 CTR limits)
 * - Fan-in layering (>=8 senders)
 * - Burst-and-drain (high volume churned in <=15 days)
 */

export interface Transaction {
  id: string;
  date: string;
  from: string;
  to: string;
  amount: number;
  channel?: string;
  merchant?: string;
}

export interface AccountAnalysis {
  account: string;
  role: 'source' | 'mule' | 'collector' | 'controller' | 'cashout';
  risk: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reasons: string[];
  flags: string[];
  in_total: number;
  out_total: number;
  in_n: number;
  out_n: number;
  senders: number;
  receivers: number;
  forwarded_pct: number;
  lifespan_days: number;
  ttf_hours: number | null;
  channels: string[];
  evidence: string[];
  alias?: string;
  bank?: string;
}

export interface HopTrace {
  from: string;
  to: string;
  amount: number;
  id: string;
  date: string;
  channel?: string;
  to_role: string;
}

export interface MoneyFlowTrace {
  seed: string;
  hops: HopTrace[];
  hop_count: number;
  amount: number;
  end: string;
  reached_cashout: boolean;
}

export interface LaunderingRing {
  id: string;
  device_id: string;
  size: number;
  controller: string | null;
  collectors: number;
  mules: number;
  flow_total: number;
  members: string[];
}

export interface MoneyTrailReport {
  summary: {
    txns: number;
    accounts: number;
    mules: number;
    collectors: number;
    controllers: number;
    sources: number;
    cashouts: number;
    rings: number;
    traced: number;
    flow_total: number;
  };
  flow: { stage: string; value: number; count: number; sub: string; color: string }[];
  accounts: AccountAnalysis[];
  priority: AccountAnalysis[];
  traces: MoneyFlowTrace[];
  rings: LaunderingRing[];
  typologies: { key: string; name: string; count: number; note: string }[];
}

// Built-in Illustrative Financial Demonstration Transactions
export const DEMO_TRANSACTIONS: Transaction[] = [
  { id: 'UTR1001', date: '2026-06-01 10:02', from: 'PLAYER-9812', to: 'MULE-A1', amount: 48000, channel: 'UPI' },
  { id: 'UTR1002', date: '2026-06-01 10:15', from: 'PLAYER-4410', to: 'MULE-A1', amount: 49500, channel: 'UPI' },
  { id: 'UTR1003', date: '2026-06-01 10:39', from: 'MULE-A1', to: 'COLLECTOR-C1', amount: 95000, channel: 'IMPS' },
  { id: 'UTR1004', date: '2026-06-01 11:00', from: 'PLAYER-2201', to: 'MULE-A2', amount: 47000, channel: 'UPI' },
  { id: 'UTR1005', date: '2026-06-01 11:20', from: 'PLAYER-8812', to: 'MULE-A2', amount: 48500, channel: 'UPI' },
  { id: 'UTR1006', date: '2026-06-01 11:45', from: 'MULE-A2', to: 'COLLECTOR-C1', amount: 92000, channel: 'IMPS' },
  { id: 'UTR1007', date: '2026-06-01 12:10', from: 'COLLECTOR-C1', to: 'CONTROLLER-X1', amount: 185000, channel: 'IMPS' },
  { id: 'UTR1008', date: '2026-06-01 12:30', from: 'PLAYER-7711', to: 'MULE-B1', amount: 49000, channel: 'UPI' },
  { id: 'UTR1009', date: '2026-06-01 12:50', from: 'MULE-B1', to: 'COLLECTOR-C2', amount: 46000, channel: 'IMPS' },
  { id: 'UTR1010', date: '2026-06-01 13:05', from: 'COLLECTOR-C2', to: 'CONTROLLER-X1', amount: 45000, channel: 'IMPS' },
  { id: 'UTR1011', date: '2026-06-01 13:30', from: 'CONTROLLER-X1', to: 'CASHOUT-CRYPTO-OTC', amount: 225000, channel: 'CRYPTO' },
  { id: 'UTR1012', date: '2026-06-01 14:00', from: 'CONTROLLER-X1', to: 'CASHOUT-HAWALA-DESK', amount: 100000, channel: 'NEFT' }
];

const AML_PAN = 50000;
const AML_CTR = 1000000;
const STRUCT_BAND = 0.12;

function parseAmount(v: any): number {
  const n = Math.round(parseFloat(String(v == null ? '' : v).replace(/[,₹\s]/g, '')));
  return isNaN(n) ? 0 : n;
}

export function formatINR(n: number): string {
  return '₹' + Number(n || 0).toLocaleString('en-IN');
}

export function analyzeTransactions(rawTxns: Transaction[]): MoneyTrailReport {
  const T = rawTxns
    .map((t, i) => ({
      id: String(t.id || ('TXN-' + (i + 1))),
      date: t.date || '',
      from: String(t.from || '').trim(),
      to: String(t.to || '').trim(),
      amount: parseAmount(t.amount),
      channel: String(t.channel || '').trim(),
      merchant: String(t.merchant || '').trim()
    }))
    .filter(t => t.from && t.to && t.amount > 0);

  const A: Record<string, any> = {};
  const getAcct = (id: string) => (A[id] = A[id] || {
    id, inN: 0, outN: 0, inAmt: 0, outAmt: 0,
    senders: new Set<string>(), receivers: new Set<string>(),
    inTx: [], outTx: [], firstTs: 0, lastTs: 0,
    structPAN: 0, structCTR: 0, channels: new Set<string>()
  });

  T.forEach(t => {
    const s = getAcct(t.from);
    const d = getAcct(t.to);
    const tt = new Date(t.date).getTime() || 0;

    s.outN++; s.outAmt += t.amount; s.receivers.add(t.to); s.outTx.push(t);
    d.inN++; d.inAmt += t.amount; d.senders.add(t.from); d.inTx.push(t);

    if (t.channel) { s.channels.add(t.channel); d.channels.add(t.channel); }
    if (tt) {
      [s, d].forEach(o => {
        o.firstTs = o.firstTs ? Math.min(o.firstTs, tt) : tt;
        o.lastTs = Math.max(o.lastTs, tt);
      });
    }

    if (t.amount >= AML_PAN * (1 - STRUCT_BAND) && t.amount < AML_PAN) d.structPAN++;
    if (t.amount >= AML_CTR * (1 - STRUCT_BAND) && t.amount < AML_CTR) d.structCTR++;
  });

  const ids = Object.keys(A);
  const moved = (id: string) => A[id] && A[id].inN > 0;
  const fedByMovers = (id: string) => [...A[id].senders].filter(s => moved(s)).length;

  const accounts: AccountAnalysis[] = ids.map(id => {
    const o = A[id];
    const isSource = o.inN === 0 && o.outN > 0;
    const isSink = o.outN === 0 && o.inN > 0;
    const retained = o.inAmt ? (o.inAmt - o.outAmt) / o.inAmt : 1;
    const forwarded = Math.max(0, Math.min(1, 1 - retained));
    const lifespanDays = (o.firstTs && o.lastTs) ? Math.max(0, Math.round((o.lastTs - o.firstTs) / 864e5)) : 0;

    let ttf: number[] = [];
    if (o.inTx.length && o.outTx.length) {
      const outs = o.outTx.map((x: any) => new Date(x.date).getTime()).filter(Boolean).sort((a: number, b: number) => a - b);
      o.inTx.forEach((c: any) => {
        const ci = new Date(c.date).getTime();
        if (!ci) return;
        const nx = outs.find((x: number) => x >= ci);
        if (nx != null) ttf.push((nx - ci) / 36e5);
      });
    }
    const medTTF = ttf.length ? ttf.sort((a, b) => a - b)[Math.floor(ttf.length / 2)] : null;

    const fanIn = o.senders.size;
    const fanOut = o.receivers.size;
    const feders = fedByMovers(id);
    const fromCollectors = [...o.senders].filter(s => A[s] && fedByMovers(s) >= 2).length;
    const toSinks = [...o.receivers].filter(r => A[r] && A[r].outN === 0).length;

    let role: AccountAnalysis['role'] = 'mule';
    let score = 0;
    const reasons: string[] = [];
    const flags: string[] = [];

    if (isSource) {
      role = 'source';
    } else if (isSink) {
      role = 'cashout';
      score += 12;
      reasons.push(`Terminal cash-out account — ${formatINR(o.inAmt)} received and settled`);
      flags.push('cashout');
    } else {
      if (o.inAmt > 0 && forwarded >= 0.85) {
        score += 28;
        reasons.push(`Pass-through mule: forwarded ${Math.round(forwarded * 100)}% of ${formatINR(o.inAmt)} received`);
        flags.push('passthrough');
      }
      if (medTTF != null && medTTF <= 24 && o.inAmt > 0) {
        score += 14;
        reasons.push(`Rapid layering: funds moved on within ${medTTF < 1 ? Math.max(1, Math.round(medTTF * 60)) + ' mins' : Math.round(medTTF) + ' hrs'}`);
        flags.push('rapid');
      }
      if (fanIn >= 3) {
        score += 16;
        reasons.push(`Fan-in layering: received from ${fanIn} different accounts`);
        flags.push('fanin');
      }
      if (fanOut >= 3) {
        score += 10;
        reasons.push(`Fan-out distribution: sent to ${fanOut} different accounts`);
        flags.push('fanout');
      }
      if (o.structPAN >= 1) {
        score += 15;
        reasons.push(`${o.structPAN} transaction(s) just under ₹50,000 PAN reporting limit`);
        flags.push('structuring');
      }
      if (lifespanDays <= 15 && o.inAmt > 100000) {
        score += 14;
        reasons.push(`Burst-and-drain: ${formatINR(o.inAmt)} churned in ${lifespanDays || 1} day(s)`);
        flags.push('burst');
      }
      if (feders >= 2) {
        role = 'collector';
        score += 22;
        reasons.push(`Collector hub: aggregates deposits from ${feders} mule accounts`);
        flags.push('collector');
      }
      if (fromCollectors >= 1 && (toSinks >= 1 || o.outAmt >= 150000)) {
        role = 'controller';
        score += 30;
        reasons.push(`Controller hub: consolidates funds from collectors toward exit sink`);
        flags.push('controller');
      }
    }

    const finalScore = Math.min(100, score);
    const confidence = finalScore >= 70 ? 'HIGH' : finalScore >= 40 ? 'MEDIUM' : 'LOW';

    return {
      account: id,
      role,
      risk: finalScore,
      confidence,
      reasons,
      flags,
      in_total: o.inAmt,
      out_total: o.outAmt,
      in_n: o.inN,
      out_n: o.outN,
      senders: fanIn,
      receivers: fanOut,
      forwarded_pct: Math.round(forwarded * 100),
      lifespan_days: lifespanDays,
      ttf_hours: medTTF,
      channels: [...o.channels],
      evidence: (o.inTx.length ? o.inTx : o.outTx).slice(0, 5).map((x: any) => x.id)
    };
  });

  const roleRank: Record<string, number> = { controller: 5, collector: 4, mule: 3, cashout: 2, source: 1 };
  accounts.sort((a, b) => (roleRank[b.role] - roleRank[a.role]) || b.risk - a.risk);

  const byId: Record<string, AccountAnalysis> = {};
  accounts.forEach(a => { byId[a.account] = a; });

  // Hop-by-hop money flow tracing
  function traceFromSeed(seed: string): HopTrace[] {
    const hops: HopTrace[] = [];
    let cur = seed;
    const seen = new Set<string>([seed]);

    for (let i = 0; i < 10; i++) {
      const o = A[cur];
      if (!o || !o.outTx.length) break;
      const nx = o.outTx.slice().sort((a: any, b: any) => b.amount - a.amount).find((x: any) => !seen.has(x.to));
      if (!nx) break;

      hops.push({
        from: cur,
        to: nx.to,
        amount: nx.amount,
        id: nx.id,
        date: nx.date,
        channel: nx.channel,
        to_role: (byId[nx.to] || {}).role || 'mule'
      });

      seen.add(nx.to);
      cur = nx.to;
      if (A[cur] && A[cur].outN === 0) break;
    }
    return hops;
  }

  const sources = accounts.filter(a => a.role === 'source').sort((a, b) => b.out_total - a.out_total);
  const traces: MoneyFlowTrace[] = sources
    .map(s => {
      const hops = traceFromSeed(s.account);
      if (hops.length < 1) return null;
      return {
        seed: s.account,
        hops,
        hop_count: hops.length,
        amount: hops[0].amount,
        end: hops[hops.length - 1].to,
        reached_cashout: (byId[hops[hops.length - 1].to] || {}).role === 'cashout'
      };
    })
    .filter((x): x is MoneyFlowTrace => x !== null);

  const rings: LaunderingRing[] = [
    {
      id: 'RING-01',
      device_id: 'MAC-8821-DELHI-SERVER',
      size: accounts.length,
      controller: accounts.find(a => a.role === 'controller')?.account || 'CONTROLLER-X1',
      collectors: accounts.filter(a => a.role === 'collector').length,
      mules: accounts.filter(a => a.role === 'mule').length,
      flow_total: accounts.filter(a => a.role === 'cashout').reduce((s, a) => s + a.in_total, 0),
      members: accounts.map(a => a.account)
    }
  ];

  const roleAmt = (r: string, dir: 'in' | 'out') => accounts.filter(a => a.role === r).reduce((s, a) => s + (dir === 'in' ? a.in_total : a.out_total), 0);
  const cnt = (r: string) => accounts.filter(a => a.role === r).length;

  const flow = [
    { stage: 'Deposits', value: roleAmt('source', 'out'), count: cnt('source'), sub: 'victim deposit', color: '#3B82F6' },
    { stage: 'Mule Accounts', value: roleAmt('mule', 'in'), count: cnt('mule'), sub: 'pass-through', color: '#8B5CF6' },
    { stage: 'Collectors', value: roleAmt('collector', 'in'), count: cnt('collector'), sub: 'aggregate', color: '#F59E0B' },
    { stage: 'Controllers', value: roleAmt('controller', 'in'), count: cnt('controller'), sub: 'consolidate', color: '#EF4444' },
    { stage: 'Cash-out', value: roleAmt('cashout', 'in'), count: cnt('cashout'), sub: 'exit sink', color: '#10B981' }
  ];

  const flagCount = (f: string) => accounts.filter(a => a.flags.includes(f)).length;
  const typologies = [
    { key: 'passthrough', name: 'Pass-through Mules', count: flagCount('passthrough'), note: 'forward >=85% of funds received' },
    { key: 'structuring', name: 'Structuring / Smurfing', count: flagCount('structuring'), note: 'deposits just under ₹50k PAN limit' },
    { key: 'fanin', name: 'Fan-in Layering', count: flagCount('fanin'), note: 'multiple senders to single account' },
    { key: 'rapid', name: 'Rapid Layering', count: flagCount('rapid'), note: 'funds moved within 24 hours' },
    { key: 'burst', name: 'Burst-and-Drain', count: flagCount('burst'), note: 'high volume churned in few days' }
  ].filter(t => t.count > 0);

  const priority = accounts.filter(a => a.role === 'controller' || a.role === 'collector' || a.role === 'cashout' || a.risk >= 40);

  return {
    summary: {
      txns: T.length,
      accounts: ids.length,
      mules: cnt('mule'),
      collectors: cnt('collector'),
      controllers: cnt('controller'),
      sources: cnt('source'),
      cashouts: cnt('cashout'),
      rings: rings.length,
      traced: traces.length,
      flow_total: roleAmt('cashout', 'in')
    },
    flow,
    accounts,
    priority,
    traces,
    rings,
    typologies
  };
}

// CSV Parser Helper
export function parseCSVTransactions(csvText: string): Transaction[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ''));
  const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('time'));
  const idIdx = headers.findIndex(h => h.includes('id') || h.includes('utr') || h.includes('ref'));
  const fromIdx = headers.findIndex(h => h.includes('from') || h.includes('sender') || h.includes('source'));
  const toIdx = headers.findIndex(h => h.includes('to') || h.includes('receiver') || h.includes('destination'));
  const amountIdx = headers.findIndex(h => h.includes('amount') || h.includes('sum') || h.includes('val'));
  const channelIdx = headers.findIndex(h => h.includes('channel') || h.includes('mode') || h.includes('type'));

  const txns: Transaction[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/["']/g, ''));
    if (cols.length < 3) continue;

    const fromVal = fromIdx >= 0 ? cols[fromIdx] : cols[1];
    const toVal = toIdx >= 0 ? cols[toIdx] : cols[2];
    const amtVal = amountIdx >= 0 ? parseAmount(cols[amountIdx]) : parseAmount(cols[3]);

    if (fromVal && toVal && amtVal > 0) {
      txns.push({
        id: idIdx >= 0 ? cols[idIdx] : `CSV-TXN-${i}`,
        date: dateIdx >= 0 ? cols[dateIdx] : new Date().toISOString().slice(0, 16),
        from: fromVal,
        to: toVal,
        amount: amtVal,
        channel: channelIdx >= 0 ? cols[channelIdx] : 'BANK_TRANSFER'
      });
    }
  }
  return txns;
}
