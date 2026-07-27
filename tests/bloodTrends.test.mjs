import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source=await readFile(new URL('../lib/bloodTrends.js',import.meta.url),'utf8');
const moduleUrl=`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const { aggregateMonthly, buildBiomarkerTrends, classifyDuplicate, parseReferenceRange, rangeStatus, scanFingerprint }=await import(moduleUrl);
let sequence=0;
const scan=(date,labs,id)=>({date,labs,id:id||`${date}-${sequence++}`});
const lab=(name,value,unit='g/dL',range='12-16')=>({name,value:String(value),unit,range});

test('each biomarker is aggregated independently regardless of report size',()=>{
 const many=Array.from({length:20},(_,index)=>lab(`Unknown ${index}`,index+1,'u','0-30'));
 const months=aggregateMonthly([scan('2026-07-01',[lab('HGB',10)]),scan('2026-07-20',[lab('Hemoglobin',14),...many])]);
 const hemoglobin=months[0].biomarkers.find(item=>item.biomarkerKey==='hemoglobin');
 assert.equal(hemoglobin.resultCount,2);assert.equal(hemoglobin.averageValue,12);assert.equal(months[0].biomarkers.length,21);
});
test('different biomarker sets never share an average',()=>{const month=aggregateMonthly([scan('2026-07-01',[lab('HGB',10)]),scan('2026-07-02',[lab('Platelets',200,'10^9/L','150-400')])])[0];assert.equal(month.biomarkers.length,2)});
test('one monthly result remains labeled with resultCount one',()=>{assert.equal(aggregateMonthly([scan('2026-07-01',[lab('HGB',10)])])[0].biomarkers[0].resultCount,1)});
test('unit mismatch and missing unit are not compared',()=>{const mismatch=buildBiomarkerTrends([scan('2026-06-01',[lab('Glucose',5,'mmol/L')]),scan('2026-07-01',[lab('Glucose',90,'mg/dL')])])[0];assert.equal(mismatch.comparisonStatus,'unit-mismatch');const missing=buildBiomarkerTrends([scan('2026-06-01',[lab('HGB',10,'')]),scan('2026-07-01',[lab('HGB',11,'')])])[0];assert.equal(missing.comparisonStatus,'missing-unit')});
test('zero previous value never produces an infinite percentage',()=>{const trend=buildBiomarkerTrends([scan('2026-06-01',[lab('HGB',0)]),scan('2026-07-01',[lab('HGB',2)])])[0];assert.equal(trend.change.percentage,null);assert.equal(trend.change.direction,'increased')});
test('range parsing and neutral statuses support missing, less-than, and greater-than',()=>{assert.deepEqual(parseReferenceRange('< 5'),{max:5});assert.deepEqual(parseReferenceRange('> 10'),{min:10});assert.equal(rangeStatus(lab('X',6,'u','< 5')),'above-provided-range');assert.equal(rangeStatus(lab('X',6,'u','')),'range-unavailable')});
test('aliases normalize without discarding unknown biomarkers',()=>{const trends=buildBiomarkerTrends([scan('2026-06-01',[lab('Hb',10)]),scan('2026-07-01',[lab('Haemoglobin',11),lab('Novel marker',3,'u','1-4')])]);assert.equal(trends.length,2);assert.equal(trends.find(item=>item.biomarkerKey==='hemoglobin').resultCount,2)});
test('exact duplicates ignore biomarker order and possible OCR duplicates are flagged',()=>{const a=scan('2026-07-01',[lab('HGB',10),lab('Platelets',200,'10^9/L','150-400')],'a');const reordered=scan('2026-07-01',[lab('Platelets',200,'10^9/L','150-400'),lab('Hemoglobin',10)],'b');assert.equal(scanFingerprint(a),scanFingerprint(reordered));assert.equal(classifyDuplicate(reordered,[a]).status,'exact-duplicate');const close=scan('2026-07-01',[lab('HGB',10.01),lab('Platelets',200,'10^9/L','150-400')]);assert.equal(classifyDuplicate(close,[a]).status,'possible-duplicate')});
test('same-day distinct values are preserved',()=>{const month=aggregateMonthly([scan('2026-07-01',[lab('HGB',10)]),scan('2026-07-01',[lab('HGB',11)])])[0];assert.equal(month.biomarkers[0].resultCount,2)});
test('each result uses its own printed range',()=>{const trend=buildBiomarkerTrends([scan('2026-06-01',[lab('HGB',11,'g/dL','10-12')]),scan('2026-07-01',[lab('HGB',11,'g/dL','12-16')])])[0];assert.equal(trend.rangeStatus,'below-provided-range');assert.equal(trend.previous.rangeStatus,'within-provided-range')});
