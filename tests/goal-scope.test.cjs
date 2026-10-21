const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../manager-role-workflows.js'),'utf8'),goalSource=fs.readFileSync(path.join(__dirname,'../manager-goals.js'),'utf8');
const members=[{id:'a',name:'A',rank:1,branch:'One',targets:{revenue:[2000000,5000000,10000000]},students:[{registered:'2026.10.16',paid:1000000}]},{id:'b',name:'B',rank:1,branch:'One',students:[{registered:'2026.10.16',paid:500000}]},{id:'c',name:'C',rank:1,branch:'Two',students:[{registered:'2026.10.16',paid:750000}]}];
const context={window:{},members,branches:['One','Two'],level:4,byId:id=>members.find(m=>m.id===id),openMember(){},workspaceSelect(){},studentOwner:'branch:all'};vm.createContext(context);vm.runInContext("let goalOwner='branch:all',goalMember=null;let previewDays=[];",context);
vm.runInContext(source.split(/\r?\n/).find(l=>l.includes('window.RISE_GOAL_OWNER_CONTEXT=')),context);vm.runInContext(source.split(/\r?\n/).find(l=>l.includes('window.RISE_ROLE_OPEN_MEMBER=openMember;')),context);
vm.runInContext(goalSource.slice(goalSource.indexOf(' function dailyStats(m){'),goalSource.indexOf(' function buckets()')),context);
const owner=()=>context.window.RISE_GOAL_OWNER_CONTEXT(),stats=()=>vm.runInContext("previewDays=window.RISE_GOAL_OWNER_CONTEXT().days;dailyStats('revenue')",context);
assert.equal(owner().targets.revenue[0],4000000);assert.equal(owner().targets.revenue[1],11000000);assert.equal(owner().targets.revenue[2],26000000);assert.equal(stats().pct,56);
context.window.RISE_ROLE_SHOW_GOAL('a');assert.equal(owner().managerRows.length,1);assert.equal(owner().selectedManager.id,'a');assert.equal(owner().targets.revenue[0],2000000);assert.equal(stats().pct,50);
context.window.RISE_ROLE_RETURN_BRANCH();assert.equal(owner().managerRows.length,2);assert.equal(owner().targets.revenue[0],3000000);assert.equal(stats().pct,50);
assert.ok(goalSource.includes('ownerContext.targets?.[metric]?.[i]||target'));assert.ok(goalSource.includes('goal-payment-records'));assert.ok(source.includes('choices=level===4?branchChoices:'));
console.log('PASS: personal targets, branch target sum, all-branch sum, same denominator for chart/rings, manager drill-down and branch return');

