const numberPattern = /-?\d+(?:[.,]\d+)?/g;

export function numericValue(value) {
  const match = String(value ?? '').replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

export function parseReferenceRange(range) {
  const text = String(range || '').trim().replace(/[–—]/g, '-').replace(/,/g, '.');
  if (!text) return null;
  const values = text.match(numberPattern)?.map(Number).filter(Number.isFinite) || [];
  if (/^(?:<|≤|up to|less than)/i.test(text) && values.length) return { max: values[0] };
  if (/^(?:>|≥|at least|more than)/i.test(text) && values.length) return { min: values[0] };
  if (values.length >= 2) {
    const [a,b] = values;
    return { min: Math.min(a,b), max: Math.max(a,b) };
  }
  return null;
}

export function scoreLab(lab) {
  const value = numericValue(lab.value);
  const range = parseReferenceRange(lab.range);
  if (!Number.isFinite(value) || !range) return null;
  const below = range.min !== undefined && value < range.min;
  const above = range.max !== undefined && value > range.max;
  if (!below && !above) return 100;
  const boundary = below ? range.min : range.max;
  const deviation = Math.abs(value - boundary) / Math.max(Math.abs(boundary), 1);
  return Math.max(0, Math.round(100 - deviation * 200));
}

export function scoreLabel(score) {
  if (!Number.isFinite(score)) return 'Not enough data';
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Fair';
  return 'Needs attention';
}

function normalizedLab(lab) {
  return [
    String(lab.name || '').trim().toLowerCase().replace(/\s+/g,' '),
    String(lab.value || '').trim().toLowerCase().replace(/\s+/g,''),
    String(lab.unit || '').trim().toLowerCase().replace(/\s+/g,''),
    String(lab.range || '').trim().toLowerCase().replace(/\s+/g,''),
  ].join('|');
}

function stableHash(value) {
  let hash = 2166136261;
  for (let index=0;index<value.length;index+=1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash,16777619);
  }
  return (hash>>>0).toString(36);
}

export function scanFingerprint(scan, sourceText = '') {
  const labs = (scan.labs || []).map(normalizedLab).sort().join('||');
  const source = String(sourceText).toLowerCase().replace(/\s+/g,' ').trim();
  return `scan-${stableHash(`${scan.date || ''}::${labs}::${source}`)}`;
}

export function ensureScanIdentity(scan) {
  return {
    ...scan,
    id: scan.id || scanFingerprint(scan),
    createdAt: scan.createdAt || `${scan.date || new Date().toISOString().slice(0,10)}T12:00:00.000Z`,
  };
}

function monthFor(scan) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(scan.date) ? scan.date : scan.createdAt?.slice(0,10);
  return date?.slice(0,7);
}

export function aggregateMonthly(scans) {
  const groups = new Map();
  scans.map(ensureScanIdentity).forEach(scan => {
    const month = monthFor(scan);
    if (!month) return;
    if (!groups.has(month)) groups.set(month,[]);
    groups.get(month).push(scan);
  });

  return [...groups.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([month,monthScans]) => {
    const scanScores = [];
    const biomarkers = new Map();
    monthScans.forEach(scan => {
      const scored = (scan.labs || []).map(lab => ({ lab, score: scoreLab(lab) })).filter(item=>item.score!==null);
      if (scored.length) scanScores.push(scored.reduce((sum,item)=>sum+item.score,0)/scored.length);
      scored.forEach(({lab,score}) => {
        const name = String(lab.name || '').trim();
        const unit = String(lab.unit || '').trim();
        const key = `${name.toLowerCase()}|${unit.toLowerCase()}`;
        if (!biomarkers.has(key)) biomarkers.set(key,{name,unit,values:[],scores:[]});
        const item = biomarkers.get(key);
        const value = numericValue(lab.value);
        if (Number.isFinite(value)) item.values.push(value);
        item.scores.push(score);
      });
    });
    const score = scanScores.length ? Math.round(scanScores.reduce((a,b)=>a+b,0)/scanScores.length) : null;
    return {
      month,
      score,
      label: scoreLabel(score),
      scanCount: monthScans.length,
      scoredScanCount: scanScores.length,
      scanIds: monthScans.map(scan=>scan.id),
      biomarkers: [...biomarkers.values()].map(item=>({
        name:item.name,unit:item.unit,count:item.values.length,
        average:item.values.length?item.values.reduce((a,b)=>a+b,0)/item.values.length:null,
        score:Math.round(item.scores.reduce((a,b)=>a+b,0)/item.scores.length),
      })).sort((a,b)=>a.name.localeCompare(b.name)),
      updatedAt: new Date().toISOString(),
    };
  });
}

export function compareMonths(current, previous) {
  if (!current || !previous || !Number.isFinite(current.score) || !Number.isFinite(previous.score)) {
    return { direction:'Not enough data', difference:null, percent:null, improved:[], worsened:[] };
  }
  const difference = current.score - previous.score;
  const percent = previous.score ? (difference/previous.score)*100 : 0;
  const prior = new Map(previous.biomarkers.map(item=>[`${item.name.toLowerCase()}|${item.unit.toLowerCase()}`,item]));
  const changes = current.biomarkers.map(item => {
    const old = prior.get(`${item.name.toLowerCase()}|${item.unit.toLowerCase()}`);
    return old ? { name:item.name, change:item.score-old.score } : null;
  }).filter(Boolean).sort((a,b)=>Math.abs(b.change)-Math.abs(a.change));
  return {
    direction:difference>2?'Improving':difference<-2?'Declining':'Stable',
    difference,
    percent,
    improved:changes.filter(item=>item.change>2),
    worsened:changes.filter(item=>item.change<-2),
  };
}
