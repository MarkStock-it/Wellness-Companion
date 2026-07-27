import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source=await readFile(new URL('../lib/mealNutrition.js',import.meta.url),'utf8');
const moduleUrl=`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const {appendSnackLog,countLoggedMealSections,mealEntries,mealText,normalizeSnackLogs,removeSnackLog,snackLogsForDate,sumMealNutrition,updateSnackLog}=await import(moduleUrl);

test('legacy string and object snacks migrate into dated arrays without data loss',()=>{
 const stringLogs=normalizeSnackLogs('Apple','2026-07-27');
 assert.equal(stringLogs.length,1);assert.equal(stringLogs[0].detail,'Apple');assert.equal(stringLogs[0].date,'2026-07-27');assert.ok(stringLogs[0].id);
 const objectLogs=normalizeSnackLogs({detail:'Yogurt',nutrition:{calories:120,protein:8}},'2026-07-27');
 assert.deepEqual(objectLogs[0].nutrition,{calories:120,protein:8});
});

test('empty snack arrays are not treated as logged',()=>{
 assert.equal(mealText([]),'');assert.deepEqual(mealEntries([]),[]);assert.equal(countLoggedMealSections({Snacks:[]},'2026-07-27'),0);
});

test('multiple snacks count as one of four meal sections',()=>{
 const meals={Breakfast:'Oats',Lunch:'Soup',Dinner:'Fish',Snacks:[{id:'a',date:'2026-07-27',detail:'Apple'},{id:'b',date:'2026-07-27',detail:'Nuts'}]};
 assert.equal(countLoggedMealSections(meals,'2026-07-27'),4);
});

test('snack logs are separated by local day',()=>{
 const logs=[{id:'a',date:'2026-07-26',detail:'Apple'},{id:'b',date:'2026-07-27',detail:'Nuts'}];
 assert.deepEqual(snackLogsForDate(logs,'2026-07-27').map(log=>log.id),['b']);
});

test('nutrition totals include every snack entry',()=>{
 const total=sumMealNutrition([{detail:'First',nutrition:{calories:100,protein:3}},{detail:'Second',nutrition:{calories:160,protein:7}}]);
 assert.deepEqual(total,{calories:260,protein:10,count:2});
});

test('append, edit, and remove affect one snack without overwriting siblings',()=>{
 let logs=appendSnackLog([{id:'first',date:'2026-07-27',detail:'Apple'}],'Nuts',null,'2026-07-27');
 assert.equal(logs.length,2);const secondId=logs[1].id;
 logs=updateSnackLog(logs,secondId,'Yogurt',{calories:120,protein:8});
 assert.equal(logs[0].detail,'Apple');assert.equal(logs[1].detail,'Yogurt');
 logs=removeSnackLog(logs,secondId);
 assert.deepEqual(logs.map(log=>log.id),['first']);
});
