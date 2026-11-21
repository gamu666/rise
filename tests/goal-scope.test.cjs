const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../manager-role-workflows.js'),'utf8'),goalSource=fs.readFileSync(path.join(__dirname,'../manager-goals.js'),'utf8'),directorSource=fs.readFileSync(path.join(__dirname,'../manager-director-views.js'),'utf8');
// The goal page follows the real Ulaanbaatar calendar (2026-11-21), so the fixture registers its students today;
// a registration on the same day number of the previous month must not count towards this month.
const [y,m,d]=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Ulaanbaatar'}).format(new Date()).split('-').map(Number),pad=n=>String(n).padStart(2,'0');
const today=`${y}.${pad(m)}.${pad(d)}`,lastMonth=m===1?`${y-1}.12.${pad(d)}`:`${y}.${pad(m-1)}.${pad(d)}`;
const members=[{id:'a',name:'A',rank:1,branch:'One',targets:{revenue:[2000000,5000000,10000000]},students:[{registered:today,paid:1000000}]},{id:'b',name:'B',rank:1,branch:'One',students:[{registered:today,paid:500000}]},{id:'c',name:'C',rank:1,branch:'Two',students:[{registered:today,paid:750000},{registered:lastMonth,paid:999999}]}];
const context={window:{},members,branches:['One','Two'],level:4,byId:id=>members.find(m=>m.id===id),openMember(){},workspaceSelect(){},studentOwner:'branch:all',goalToday:d,goalEmptyDay:day=>({day,amount:0,count:0,tasks:0})};vm.createContext(context);vm.runInContext("let goalOwner='branch:all',goalMember=null;let previewDays=[];",context);
vm.runInContext(source.split(/\r?\n/).find(l=>l.includes('window.RISE_GOAL_OWNER_CONTEXT=')),context);vm.runInContext(source.split(/\r?\n/).find(l=>l.includes('window.RISE_ROLE_OPEN_MEMBER=openMember;')),context);
vm.runInContext(goalSource.slice(goalSource.indexOf(' function dailyStats(m){'),goalSource.indexOf(' function buckets()')),context);
const owner=()=>context.window.RISE_GOAL_OWNER_CONTEXT(),stats=()=>vm.runInContext("previewDays=window.RISE_GOAL_OWNER_CONTEXT().days;dailyStats('revenue')",context);
assert.equal(owner().targets.revenue[0],4000000);assert.equal(owner().targets.revenue[1],11000000);assert.equal(owner().targets.revenue[2],26000000);assert.equal(stats().pct,56);
assert.equal(owner().days.find(x=>x.day===d).amount,2250000,'last month’s registration on the same day number is left out');
context.window.RISE_ROLE_SHOW_GOAL('a');assert.equal(owner().managerRows.length,1);assert.equal(owner().selectedManager.id,'a');assert.equal(owner().targets.revenue[0],2000000);assert.equal(stats().pct,50);
context.window.RISE_ROLE_RETURN_BRANCH();assert.equal(owner().managerRows.length,2);assert.equal(owner().targets.revenue[0],3000000);assert.equal(stats().pct,50);
assert.ok(goalSource.includes('ownerContext.targets?.[metric]?.[i]||target'));assert.ok(goalSource.includes('goal-payment-records'));assert.ok(source.includes('choices=level===4?branchChoices:'));
// the general director's Сурагчид lists managers with their income (the hook it calls is defined) and opens their goal detail
assert.ok(directorSource.includes('window.RISE_DIRECTOR_STUDENT_SUMMARY=()=>'));assert.ok(directorSource.includes("row.onclick=()=>window.RISE_ROLE_SHOW_GOAL?.(m.id)"));
console.log('PASS: personal targets, branch target sum, all-branch sum, same denominator for chart/rings, current month only, manager drill-down, branch return and the director manager-income list');
