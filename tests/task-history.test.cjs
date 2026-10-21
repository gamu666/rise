const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../manager-task-details.js'),'utf8');
const recordFn=source.slice(source.indexOf(' function records(){'),source.indexOf(' const dayKey='));
const card={dataset:{task:'call'},querySelector:s=>({h3:{textContent:'Залгах'},p:{textContent:'Тайлбар'},'.task-head small':{textContent:'My Task'},'.task-head h3':{textContent:'Залгах'}}[s])};
function records(level){const ctx={level,host:{querySelectorAll:()=>[card]},selfName:()=> 'Менежер А',loadLocal:(key,f)=>key==='rise-manager-task-states'?{call:{state:'done',completedAt:'2026-10-21T02:00:00Z'}}:f,sessionStorage:{getItem:()=>JSON.stringify([{id:'sent',title:'Илгээсэн ажил',recipient:'Менежер Б',createdAt:'2026-10-21T01:00:00Z'}])}};vm.runInNewContext(recordFn+';result=records()',ctx);return ctx.result;}
assert.equal(records(1).length,1);assert.equal(records(1)[0].state,'done');assert.equal(records(1)[0].description,'Тайлбар');assert.equal(records(1)[0].sender,'Менежер А');
for(const role of [2,3,4]){const list=records(role);assert.equal(list.length,2);assert.equal(list[1].recipient,'Менежер Б');assert.equal(list[1].state,'active');assert.equal(list[1].direction,'Илгээсэн');}
const dateFns=source.slice(source.indexOf(' const dayKey='),source.indexOf(' function render(){'));
class Clock extends Date{constructor(...args){super(...(args.length?args:['2026-10-21T05:00:00Z']));}static now(){return new Clock().getTime();}}
for(const [period,start]of [['day','2026-10-21'],['week','2026-10-19'],['month','2026-10-01']]){const ctx={period,Date:Clock,Intl};vm.runInNewContext(dateFns+';result=range()',ctx);assert.equal(ctx.result.start,start);assert.equal(ctx.result.end,'2026-10-21');}
assert(source.includes("level===1?[['done','Дуусгасан task-ууд']]"));assert(source.includes("n.inert=open"));
console.log('PASS: role task states, sender/recipient, hidden-front description, completion date and Ulaanbaatar day/week/month ranges');
