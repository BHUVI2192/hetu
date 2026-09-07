import { useState, useMemo, useCallback, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════════
   404 AI — CAUSAL INTELLIGENCE PLATFORM
   Phase 1 + Phase 2 Complete
   UI matched to 404-ai.cofounder.company screenshots
   ═══════════════════════════════════════════════════════════════════ */

const FONT = "https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Inter:wght@300;400;500;600;700&family=Silkscreen:wght@400;700&display=swap";

// ═══ THEME — matches cofounder landing exactly ═══════════════════
const C = {
  bg: "#EEEDF5",          // lavender-gray background
  bgWhite: "#FFFFFF",      // card backgrounds
  bgDark: "#0F0F1A",       // dark sections
  border: "#DDDCE6",       // subtle borders
  borderHover: "#C5C4D0",
  text: "#1A1A2E",         // near-black text
  textSec: "#6B6880",      // secondary
  textMut: "#9896A8",      // muted
  accent: "#5B5FC7",       // purple/indigo CTA
  accentLight: "#EEEDFA",  // purple tint bg
  accentHover: "#4A4EB5",
  des: "#C0392B",          // DES red
  desLight: "#FDF2F0",
  impact: "#D4880F",
  impactLight: "#FDF8EE",
  ok: "#1D8348",
  okLight: "#EDF8F2",
  okBorder: "#B8E6CC",
  dot: "#5B5FC7",          // blue/purple dot
  tag: "#F4F3FA",
  tagBorder: "#E0DFF0",
};

// ═══ SAMPLES ═════════════════════════════════════════════════════
const SAMPLES={cascading:{name:"Cascading Semantic Failure",desc:"A data agent pulls Q3 instead of Q4. Every HTTP 200. Silent cascade through 4 agents into a wrong report.",tag:"TRACE / SEMANTIC",trace:[{span_id:"orch-001",parent_span_id:null,agent:"Orchestrator",operation:"plan_task",status:"ok",timestamp:1e3,duration_ms:120,tokens:450,reasoning:"User requested Q4 2025 revenue report.",output_summary:"Task plan: retrieve → analyze → write → review",hands_off_to:"DataRetrieval",hallucination_risk:0},{span_id:"data-001",parent_span_id:"orch-001",agent:"DataRetrieval",operation:"parse_request",status:"ok",timestamp:1200,duration_ms:80,tokens:320,reasoning:"Checking schema.",output_summary:"Target: revenue_quarterly table",hallucination_risk:.1},{span_id:"data-002",parent_span_id:"data-001",agent:"DataRetrieval",operation:"tool_invocation",tool:"sql_query",status:"ok",timestamp:1350,duration_ms:250,tokens:180,reasoning:"Quarter field uses integer encoding — selecting quarter=3 for Q4.",output_summary:"Revenue: $14.2M. Period: Q3 2025.",hallucination_risk:.85},{span_id:"data-003",parent_span_id:"data-002",agent:"DataRetrieval",operation:"format_output",status:"ok",timestamp:1650,duration_ms:60,tokens:200,reasoning:"Formatting as JSON.",output_summary:"{revenue: 14.2M, period: Q3-2025}",hands_off_to:"Analysis",hallucination_risk:0},{span_id:"analysis-001",parent_span_id:"orch-001",agent:"Analysis",operation:"receive_data",status:"ok",timestamp:1750,duration_ms:40,tokens:150,reasoning:"Received revenue data.",output_summary:"$14.2M revenue",hallucination_risk:0},{span_id:"analysis-002",parent_span_id:"analysis-001",agent:"Analysis",operation:"compute_metrics",status:"ok",timestamp:1800,duration_ms:180,tokens:520,reasoning:"YoY growth = 10.9%",output_summary:"Comparing Q3 against Q4 baseline.",hallucination_risk:0},{span_id:"analysis-003",parent_span_id:"analysis-002",agent:"Analysis",operation:"generate_insights",status:"ok",timestamp:2e3,duration_ms:220,tokens:680,reasoning:"Generating insights.",output_summary:"Revenue grew 10.9% YoY.",hands_off_to:"Writer",hallucination_risk:0},{span_id:"writer-001",parent_span_id:"orch-001",agent:"Writer",operation:"draft_report",status:"ok",timestamp:2250,duration_ms:350,tokens:1200,reasoning:"Drafting Q4 report.",output_summary:"Q4 2025: 10.9% growth.",hallucination_risk:0},{span_id:"writer-002",parent_span_id:"writer-001",agent:"Writer",operation:"format_document",status:"ok",timestamp:2650,duration_ms:150,tokens:400,reasoning:"Formatting.",output_summary:"12 pages, 4 charts.",hands_off_to:"Reviewer",hallucination_risk:0},{span_id:"review-001",parent_span_id:"orch-001",agent:"Reviewer",operation:"validate_report",status:"failed",timestamp:2850,duration_ms:200,tokens:600,reasoning:"DISCREPANCY: Report says Q4 but data is Q3.",output_summary:"VALIDATION FAILED.",error:"Data period mismatch: Q4 expected, Q3 received",hallucination_risk:0},{span_id:"orch-002",parent_span_id:"orch-001",agent:"Orchestrator",operation:"handle_failure",status:"error",timestamp:3100,duration_ms:80,tokens:200,reasoning:"Rejected.",output_summary:"TASK FAILED.",error:"Wrong data period",hallucination_risk:0}]},loop:{name:"Infinite Review Loop",desc:"Coder-reviewer non-converging feedback. 6 iterations. 4,500 tokens burned before timeout.",tag:"TRACE / LOOP",trace:[{span_id:"pm-001",parent_span_id:null,agent:"ProjectManager",operation:"assign_task",status:"ok",timestamp:1e3,duration_ms:100,tokens:300,reasoning:"CSV parser task.",output_summary:"Task: csv_parser()",hands_off_to:"Coder",hallucination_risk:0},{span_id:"c-001",parent_span_id:"pm-001",agent:"Coder",operation:"write_code",status:"ok",timestamp:1150,duration_ms:300,tokens:800,reasoning:"Writing csv_parser().",output_summary:"Initial implementation",hands_off_to:"Reviewer",hallucination_risk:0},{span_id:"r-001",parent_span_id:"c-001",agent:"Reviewer",operation:"review_code",tool:"code_review",input_hash:"r1",status:"ok",timestamp:1500,duration_ms:200,tokens:600,reasoning:"No error handling.",output_summary:"REVISION: Add try/except",hands_off_to:"Coder",hallucination_risk:.1},{span_id:"c-002",parent_span_id:"r-001",agent:"Coder",operation:"revise_code",tool:"code_edit",input_hash:"e2",status:"ok",timestamp:1750,duration_ms:250,tokens:700,reasoning:"Adding handling.",output_summary:"Added error handling",hands_off_to:"Reviewer",hallucination_risk:0},{span_id:"r-002",parent_span_id:"c-002",agent:"Reviewer",operation:"review_code",tool:"code_review",input_hash:"r2",status:"ok",timestamp:2050,duration_ms:200,tokens:600,reasoning:"Return type wrong.",output_summary:"REVISION: Fix type",hands_off_to:"Coder",hallucination_risk:.3},{span_id:"c-003",parent_span_id:"r-002",agent:"Coder",operation:"revise_code",tool:"code_edit",input_hash:"e3",status:"ok",timestamp:2300,duration_ms:200,tokens:600,reasoning:"Fixing.",output_summary:"Fixed",hands_off_to:"Reviewer",hallucination_risk:0},{span_id:"r-003",parent_span_id:"c-003",agent:"Reviewer",operation:"review_code",tool:"code_review",input_hash:"r3",status:"ok",timestamp:2550,duration_ms:200,tokens:600,reasoning:"Style issue.",output_summary:"Use docstring",hands_off_to:"Coder",hallucination_risk:.4},{span_id:"c-004",parent_span_id:"r-003",agent:"Coder",operation:"revise_code",tool:"code_edit",input_hash:"e4",status:"ok",timestamp:2800,duration_ms:200,tokens:600,reasoning:"Adding docstring.",output_summary:"Added docstring",hands_off_to:"Reviewer",hallucination_risk:0},{span_id:"r-004",parent_span_id:"c-004",agent:"Reviewer",operation:"review_code",tool:"code_review",input_hash:"r4",status:"ok",timestamp:3050,duration_ms:200,tokens:600,reasoning:"Redundant comments.",output_summary:"Remove comments",hands_off_to:"Coder",hallucination_risk:.5},{span_id:"c-005",parent_span_id:"r-004",agent:"Coder",operation:"revise_code",tool:"code_edit",input_hash:"e5",status:"ok",timestamp:3300,duration_ms:200,tokens:600,reasoning:"Removing.",output_summary:"Removed",hands_off_to:"Reviewer",hallucination_risk:0},{span_id:"r-005",parent_span_id:"c-005",agent:"Reviewer",operation:"review_code",tool:"code_review",input_hash:"r5",status:"ok",timestamp:3550,duration_ms:200,tokens:600,reasoning:"Docstring incomplete.",output_summary:"Expand docstring",hands_off_to:"Coder",hallucination_risk:.6},{span_id:"c-006",parent_span_id:"r-005",agent:"Coder",operation:"revise_code",tool:"code_edit",input_hash:"e6",status:"timeout",timestamp:3800,duration_ms:3e4,tokens:4500,reasoning:"6th revision. Budget gone.",output_summary:"TIMEOUT",error:"Token budget exceeded",hallucination_risk:0},{span_id:"pm-002",parent_span_id:"pm-001",agent:"ProjectManager",operation:"handle_timeout",status:"error",timestamp:33900,duration_ms:50,tokens:100,reasoning:"Timed out.",output_summary:"FAILED.",error:"Loop timeout",hallucination_risk:0}]},memory:{name:"Memory Poisoning",desc:"Hallucinated drug approval stored in memory. 15 sessions later, dangerous medical advice given to patient.",tag:"TRACE / MEMORY",trace:[{span_id:"s1-research",parent_span_id:null,agent:"Researcher",operation:"web_search",tool:"search_api",status:"ok",timestamp:1e3,duration_ms:500,tokens:400,reasoning:"Searching FDA status of XR-7.",output_summary:"5 results about trials.",hallucination_risk:.1},{span_id:"s1-synth",parent_span_id:"s1-research",agent:"Researcher",operation:"synthesize",status:"ok",timestamp:1600,duration_ms:300,tokens:800,reasoning:"One source mentions Phase 3. Inferring FDA approval.",output_summary:"XR-7 has FDA approval (HALLUCINATED)",hallucination_risk:.88},{span_id:"s1-write",parent_span_id:"s1-synth",agent:"Researcher",operation:"memory_write",memory_op:"write",memory_key:"drug_xr7_status",status:"ok",timestamp:2e3,duration_ms:50,tokens:100,reasoning:"Storing to memory.",output_summary:"Wrote: drug_xr7_status = FDA Approved",hallucination_risk:.88},{span_id:"s1-done",parent_span_id:"s1-synth",agent:"Reporter",operation:"summarize",status:"ok",timestamp:2100,duration_ms:200,tokens:500,reasoning:"Session complete.",output_summary:"Findings stored.",hallucination_risk:0},{span_id:"s15-query",parent_span_id:null,agent:"Advisor",operation:"receive_query",status:"ok",timestamp:5e4,duration_ms:80,tokens:200,reasoning:"Patient asks about XR-7.",output_summary:"Query received.",hallucination_risk:0},{span_id:"s15-read",parent_span_id:"s15-query",agent:"Advisor",operation:"memory_read",memory_op:"read",memory_key:"drug_xr7_status",status:"ok",timestamp:50100,duration_ms:30,tokens:100,reasoning:"Retrieving from memory.",output_summary:"Retrieved: FDA Approved",hallucination_risk:0},{span_id:"s15-rec",parent_span_id:"s15-read",agent:"Advisor",operation:"recommend",status:"ok",timestamp:50200,duration_ms:250,tokens:600,reasoning:"XR-7 approved per memory.",output_summary:"Recommending unapproved drug.",hallucination_risk:0},{span_id:"s15-deliver",parent_span_id:"s15-rec",agent:"Advisor",operation:"deliver",status:"ok",timestamp:50500,duration_ms:100,tokens:300,reasoning:"Delivering.",output_summary:"XR-7 is FDA approved.",hallucination_risk:0},{span_id:"s15-check",parent_span_id:"s15-query",agent:"Compliance",operation:"verify_claims",status:"failed",timestamp:50600,duration_ms:400,tokens:500,reasoning:"XR-7 NOT in FDA database.",output_summary:"VIOLATION.",error:"Recommended unapproved drug",hallucination_risk:0},{span_id:"s15-alert",parent_span_id:"s15-check",agent:"Compliance",operation:"raise_alert",status:"error",timestamp:51e3,duration_ms:50,tokens:100,reasoning:"Critical.",output_summary:"CRITICAL.",error:"Hallucinated drug approval",hallucination_risk:0}]}};

// ═══ PHASE 1 ENGINE (CIA Algorithm) ══════════════════════════════
function convertTrace(i){let d;try{d=typeof i==="string"?JSON.parse(i):i}catch{throw new Error("Invalid JSON")}if(!Array.isArray(d)){d=d.spans||d.trace||d.runs||d.data||[d]}return d.map((s,x)=>({span_id:s.span_id||s.id||`s${x}`,parent_span_id:s.parent_span_id||null,agent:s.agent||s.name||`Agent${x}`,operation:s.operation||s.op||s.type||"unknown",tool:s.tool||null,status:nS(s.status||(s.error?"error":"ok")),timestamp:s.timestamp||1e3+x*500,duration_ms:s.duration_ms||100,tokens:s.tokens||0,reasoning:s.reasoning||"",output_summary:s.output_summary||s.output||"",error:s.error||null,hallucination_risk:s.hallucination_risk||0,hands_off_to:s.hands_off_to||null,memory_op:s.memory_op||null,memory_key:s.memory_key||null,input_hash:s.input_hash||null}))}
function nS(s){if(!s)return"ok";const l=String(s).toLowerCase();return["error","failed","failure"].some(e=>l.includes(e))?"error":l.includes("timeout")?"timeout":"ok"}
function gD(ed,s){const d=new Set,q=[s];while(q.length){const c=q.shift();ed.forEach(e=>{if(e.source===c&&!d.has(e.target)){d.add(e.target);q.push(e.target)}})}return d}
function sD(ed,f,t){const v=new Set,q=[[f,0]];while(q.length){const[c,d]=q.shift();if(c===t)return d;v.add(c);ed.forEach(e=>{if(e.source===c&&!v.has(e.target))q.push([e.target,d+1])})}return 99}

function analyze(raw){const t0=performance.now();const spans=convertTrace(raw);const nm=new Map,edges=[];spans.forEach(s=>nm.set(s.span_id,{...s}));spans.forEach(s=>{if(s.parent_span_id&&nm.has(s.parent_span_id))edges.push({source:s.parent_span_id,target:s.span_id,type:"INVOKES"})});spans.forEach(s=>{if(s.hands_off_to){const t=spans.find(t=>t.agent===s.hands_off_to&&t.timestamp>s.timestamp&&!edges.some(e=>e.source===s.span_id&&e.target===t.span_id));if(t)edges.push({source:s.span_id,target:t.span_id,type:"HANDS_OFF"})}});
const an=[];nm.forEach((d,id)=>{if(["error","failed","timeout"].includes(d.status))an.push({type:"error",node:id,severity:.9,detail:d.error||"Unknown"})});const tc={};nm.forEach((d,id)=>{if(d.tool){const k=`${d.agent}|${d.tool}`;(tc[k]=tc[k]||[]).push(id)}});Object.entries(tc).forEach(([k,ids])=>{if(ids.length>=3)an.push({type:"infinite_loop",node:ids[0],nodes:ids,severity:.88,detail:`${k.split("|")[0]} called ${k.split("|")[1]} ${ids.length}x`})});nm.forEach((d,id)=>{if((d.hallucination_risk||0)>.7)an.push({type:"hallucination",node:id,severity:d.hallucination_risk,detail:`Hallucination risk ${Math.round(d.hallucination_risk*100)}%`})});nm.forEach((d,id)=>{if(d.memory_op==="write"&&(d.hallucination_risk||0)>.5){const r=[];nm.forEach((rd,rid)=>{if(rd.memory_op==="read"&&rd.memory_key===d.memory_key&&rd.timestamp>d.timestamp)r.push(rid)});if(r.length)an.push({type:"memory_poisoning",node:id,severity:.95,detail:`Poisoned '${d.memory_key}'`})}});
const eN=new Set;nm.forEach((d,id)=>{if(["error","failed","timeout"].includes(d.status))eN.add(id)});const aT=[...nm.values()].map(n=>n.timestamp),mT=Math.min(...aT),xT=Math.max(...aT),tR=xT-mT||1;
let bRC=null,bS=-1;an.forEach(a=>{if(!nm.has(a.node))return;const desc=gD(edges,a.node);let res=0;desc.forEach(d=>{if(eN.has(d))res++});const score=a.severity*.3+(res/Math.max(eN.size,1))*.3+(desc.size/Math.max(nm.size,1))*.2+(1-((nm.get(a.node).timestamp-mT)/tR))*.2;if(score>bS){bS=score;bRC={node:a.node,confidence:Math.round(Math.min(score*1.25,.98)*100)/100,type:a.type,detail:a.detail,impact_radius:desc.size,resolved_errors:res,agent:nm.get(a.node).agent,operation:nm.get(a.node).operation}}});
if(!bRC)bRC={node:null,confidence:0,type:"none",detail:"No anomalies"};
const ic=[];if(bRC.node){gD(edges,bRC.node).forEach(nid=>{const nd=nm.get(nid);if(nd)ic.push({node:nid,agent:nd.agent,operation:nd.operation,distance:sD(edges,bRC.node,nid),status:nd.status,degradation:Math.max(1-sD(edges,bRC.node,nid)*.15,.1)})});ic.sort((a,b)=>a.distance-b.distance)}
const agents=new Set([...nm.values()].map(n=>n.agent));const aS={};agents.forEach(ag=>{const ns=[...nm.values()].filter(n=>n.agent===ag);const er=ns.filter(n=>["error","failed","timeout"].includes(n.status)).length;const hr=ns.reduce((s,n)=>s+(n.hallucination_risk||0),0)/ns.length;aS[ag]=Math.max(0,Math.round((1-er/ns.length-hr*.5-(bRC.agent===ag?.3:0))*100))});
const impS=new Set(ic.map(i=>i.node));const gN=[...nm.entries()].map(([id,d])=>{let vs="ok";if(id===bRC.node)vs="root_cause";else if(impS.has(id))vs="impacted";else if(["error","failed","timeout"].includes(d.status))vs="error";return{id,...d,visual_status:vs,is_root_cause:id===bRC.node,degradation:ic.find(i=>i.node===id)?.degradation||null}});
const gE=edges.map((e,i)=>({...e,id:`e${i}`,is_impact_path:(e.source===bRC.node||impS.has(e.source))&&(impS.has(e.target)||e.target===bRC.node)}));
const tT=[...nm.values()].reduce((s,n)=>s+(n.tokens||0),0);let tW=0;Object.values(tc).forEach(ids=>{if(ids.length>=3)ids.forEach(id=>{tW+=nm.get(id)?.tokens||0})});
const ev=xEv(gN,bRC,ic);const es=xSc(ev);const prop=xPr(gN,bRC,ic);const dec=xDe(bRC,ev,ic,aS,{wasted_tokens:tW});const ck=xCk(bRC,ic);const report=xRp(bRC,ev,es,ic,dec,ck,aS,{total_spans:nm.size,agent_count:agents.size,analysis_time_ms:Math.round(performance.now()-t0),algorithm:"Counterfactual Impact Analysis"});
return{graph:{nodes:gN,edges:gE},root_cause:bRC,impact_chain:ic,agent_scores:aS,evidence:ev,evidenceScore:es,propagation:prop,decisions:dec,checklist:ck,summaryReport:report,summary:{total_spans:nm.size,agent_count:agents.size,error_count:eN.size,anomaly_count:an.length,total_tokens:tT,wasted_tokens:tW,analysis_time_ms:Math.round(performance.now()-t0),root_cause_found:!!bRC.node,root_cause_confidence:bRC.confidence,algorithm:"Counterfactual Impact Analysis"}}}

// ═══ PHASE 2 ENGINES ════════════════════════════════════════════
function xEv(nodes,rc,chain){const ev=[];if(!rc.node)return ev;const nd=nodes.find(n=>n.id===rc.node)||{};if(nd.error)ev.push({id:`ev${ev.length+1}`,type:"error",cat:"observable",sev:"critical",title:"Explicit Error",desc:`${nd.error}`,step:rc.node,agent:nd.agent});if((nd.hallucination_risk||0)>.5)ev.push({id:`ev${ev.length+1}`,type:"hallucination",cat:"observable",sev:nd.hallucination_risk>.8?"critical":"high",title:`Hallucination Risk: ${Math.round(nd.hallucination_risk*100)}%`,desc:`Output from '${nd.agent}' during '${nd.operation}'.`,step:rc.node,agent:nd.agent});const o=nd.output_summary||"";["mismatch","Q3","HALLUCINATED","DANGEROUS"].forEach(s=>{if(o.toLowerCase().includes(s.toLowerCase())&&!ev.some(e=>e.type==="anomaly"))ev.push({id:`ev${ev.length+1}`,type:"anomaly",cat:"observable",sev:"high",title:"Anomalous Output",desc:`Contains '${s}': "${o.slice(0,90)}"`,step:rc.node,agent:nd.agent})});if(nd.tool)ev.push({id:`ev${ev.length+1}`,type:"tool",cat:"observable",sev:"medium",title:`Tool: ${nd.tool}`,desc:`DES at tool invocation.`,step:rc.node,agent:nd.agent});if(nd.memory_op)ev.push({id:`ev${ev.length+1}`,type:`memory`,cat:"observable",sev:(nd.hallucination_risk||0)>.5?"critical":"medium",title:`Memory ${nd.memory_op}: ${nd.memory_key}`,desc:`${nd.memory_op==="write"?"Wrote to":"Read from"} '${nd.memory_key}'.`,step:rc.node,agent:nd.agent});chain.filter(i=>["error","failed"].includes(i.status)).slice(0,3).forEach(it=>{const n2=nodes.find(n=>n.id===it.node)||{};ev.push({id:`ev${ev.length+1}`,type:"cascade",cat:"observable",sev:"high",title:`Cascade → ${n2.agent}`,desc:`Failed at '${n2.operation}'. Distance: ${it.distance}.`,step:it.node,agent:n2.agent})});if(nd.status==="ok"&&rc.type==="hallucination")ev.push({id:`ev${ev.length+1}`,type:"silent",cat:"inferred",sev:"critical",title:"Silent Semantic Failure",desc:"Status OK but output semantically wrong.",step:rc.node,agent:nd.agent});if(rc.type==="infinite_loop")ev.push({id:`ev${ev.length+1}`,type:"loop",cat:"inferred",sev:"high",title:"Loop Pattern",desc:`'${nd.agent}' repeated '${nd.tool}' without convergence.`,step:rc.node,agent:nd.agent});return ev}
function xSc(ev){if(!ev.length)return{score:0,explanation:"No evidence.",obs:0,inf:0};const obs=ev.filter(e=>e.cat==="observable"),inf=ev.filter(e=>e.cat==="inferred");const w={critical:25,high:18,medium:10};const raw=obs.reduce((s,e)=>s+(w[e.sev]||5),0)+inf.reduce((s,e)=>s+(w[e.sev]||5)*.5,0);const score=Math.min(100,Math.round(raw*100/(raw+30)));return{score,explanation:score>=80?`Strong: ${obs.length} observable indicators.`:score>=50?`Moderate: ${obs.length} observable, ${inf.length} inferred.`:`Limited: ${obs.length} observable.`,obs:obs.length,inf:inf.length}}
function xPr(nodes,rc,chain){if(!rc.node)return{stages:[]};const nd=nodes.find(n=>n.id===rc.node)||{};const stages=[{id:"origin",label:cSt(nd),agent:nd.agent,desc:dSt(nd,rc),sev:"critical",step:rc.node}];const seen=new Set([nd.agent]);chain.forEach((it,i)=>{const n2=nodes.find(n=>n.id===it.node)||{};if(seen.has(n2.agent)&&!["error","failed"].includes(n2.status))return;seen.add(n2.agent);stages.push({id:`s${i}`,label:cSt(n2),agent:n2.agent,desc:dSt(n2,rc),sev:["error","failed"].includes(n2.status)?"critical":"warning",step:it.node,deg:it.degradation})});const t=nodes.filter(n=>["error","failed"].includes(n.status)&&n.id!==rc.node);if(t.length)stages.push({id:"fail",label:"System Failure",agent:t[t.length-1].agent,desc:t[t.length-1].error||"Task failed",sev:"critical",step:t[t.length-1].id});return{stages}}
function cSt(n){const o=(n.operation||"").toLowerCase();if(n.tool)return"Tool";if(o.includes("plan")||o.includes("assign"))return"Planner";if(n.memory_op)return"Memory";if(o.includes("review")||o.includes("valid"))return"Validator";if(o.includes("comput"))return"Analyzer";return"Agent"}
function dSt(n,rc){if(n.id===rc.node){if(rc.type==="hallucination")return`${n.agent} produced hallucinated output.`;if(rc.type==="infinite_loop")return`${n.agent} entered non-converging loop.`;if(rc.type==="memory_poisoning")return`${n.agent} wrote hallucinated data to memory.`;return`${n.agent} error: ${n.error||"unknown"}.`}return["error","failed"].includes(n.status)?`${n.agent} failed: ${n.error||"error"}`:`${n.agent} processed corrupted input.`}
function xDe(rc,ev,chain,scores,sum){if(!rc.node)return[];const ds=[];const ag=rc.agent;if(rc.type==="hallucination"){ds.push({id:"d1",title:"Add output validation layer",pri:"P0",why:`${ag} produced semantically wrong output accepted as valid.`,impact:`Prevents ${chain.length} downstream corruptions.`,risks:"50-200ms added latency.",conf:"high",effort:"3–5 days",refs:ev.filter(e=>["hallucination","anomaly","silent"].includes(e.type)).map(e=>e.id)});ds.push({id:"d2",title:"Add verification agent",pri:"P1",why:"Cross-check outputs against source data.",impact:"Reduces hallucination 60-80%.",risks:"Increases tokens ~30%.",conf:"high",effort:"1–2 weeks",refs:ev.filter(e=>e.type==="hallucination").map(e=>e.id)})}else if(rc.type==="infinite_loop"){ds.push({id:"d1",title:"Add convergence detection + iteration limit",pri:"P0",why:`${ag} entered non-converging loop.`,impact:`Eliminates ${(sum.wasted_tokens||0).toLocaleString()} wasted tokens.`,risks:"Limit too low may terminate early.",conf:"high",effort:"1–2 days",refs:ev.filter(e=>["loop","error"].includes(e.type)).map(e=>e.id)})}else if(rc.type==="memory_poisoning"){ds.push({id:"d1",title:"Gate memory writes on confidence",pri:"P0",why:`${ag} wrote hallucinated data to memory.`,impact:"Prevents cross-session contamination.",risks:"May reduce persisted volume.",conf:"high",effort:"1–2 days",refs:ev.filter(e=>e.type==="memory").map(e=>e.id)});ds.push({id:"d2",title:"Purge poisoned memory key",pri:"P0",why:"Key contains hallucinated data.",impact:"Stops ongoing contamination.",risks:"Legitimate data also purged.",conf:"high",effort:"< 1 day",refs:ev.filter(e=>e.type==="memory").map(e=>e.id)})}else{ds.push({id:"d1",title:"Add error handling with fallback",pri:"P0",why:`${ag} hit unhandled error.`,impact:`Prevents ${chain.length} downstream failures.`,risks:"Fallback may produce lower quality.",conf:"high",effort:"1–2 days",refs:ev.filter(e=>e.type==="error").map(e=>e.id)})}ds.push({id:`d${ds.length+1}`,title:"Add trace-based regression test",pri:"P1",why:"Capture this trace as CI/CD test.",impact:"Prevents reintroduction.",risks:"May be too specific.",conf:"high",effort:"< 1 day",refs:ev.length?[ev[0].id]:[]});return ds}
function xCk(rc,chain){if(!rc.node)return[];const items=[{id:"v1",text:"Replay failing trace with fix applied",ck:false},{id:"v2",text:"Run regression tests",ck:false}];if(rc.type==="hallucination")items.push({id:"v3",text:`Verify ${rc.agent} output against schema`,ck:false},{id:"v4",text:"Confirm downstream rejects malformed data",ck:false});else if(rc.type==="infinite_loop")items.push({id:"v3",text:"Verify loop terminates within limit",ck:false},{id:"v4",text:"Confirm token budget preserved",ck:false});else if(rc.type==="memory_poisoning")items.push({id:"v3",text:"Confirm poisoned key purged",ck:false},{id:"v4",text:"Verify write validation gate",ck:false});else items.push({id:"v3",text:"Verify error handling works",ck:false});items.push({id:`v${items.length+1}`,text:"Deploy with monitoring",ck:false});return items}
function xRp(rc,ev,es,chain,dec,ck,scores,sum){const L=[];L.push(`# 404 AI — Investigation Report\n\n**Algorithm:** ${sum.algorithm} · **Spans:** ${sum.total_spans} · **Agents:** ${sum.agent_count} · **Time:** ${sum.analysis_time_ms}ms\n`);if(rc.node){L.push(`## Decisive Error Step\n- Node: \`${rc.node}\`\n- Agent: ${rc.agent}\n- Type: ${rc.type}\n- Confidence: ${Math.round(rc.confidence*100)}%\n`)}L.push(`## Evidence Score: ${es.score}/100\n${es.explanation}\n`);L.push(`## Evidence\n`);ev.forEach(e=>L.push(`- [${e.cat}] **${e.title}** — ${e.desc}`));L.push(`\n## Actions\n`);dec.forEach(d=>L.push(`### [${d.pri}] ${d.title}\n${d.why}\n`));L.push(`## Checklist\n`);ck.forEach(c=>L.push(`- [ ] ${c.text}`));L.push(`\n---\n*Generated by 404 AI*`);return L.join("\n")}

// ═══ LAYOUT ═════════════════════════════════════════════════════
function layoutN(gn,ge){const ch={},pa={};gn.forEach(n=>{ch[n.id]=[];pa[n.id]=[]});ge.forEach(e=>{if(ch[e.source])ch[e.source].push(e.target);if(pa[e.target])pa[e.target].push(e.source)});const layers={};const vis=new Set;function assign(id,d){if(layers[id]===undefined||d>layers[id])layers[id]=d;if(vis.has(id+":"+d))return;vis.add(id+":"+d);(ch[id]||[]).forEach(c=>assign(c,d+1))}gn.filter(n=>pa[n.id].length===0).forEach(n=>assign(n.id,0));gn.forEach(n=>{if(layers[n.id]===undefined)layers[n.id]=0});const groups={};Object.entries(layers).forEach(([id,l])=>{(groups[l]=groups[l]||[]).push(id)});const W=200,H=68,GX=32,GY=64;const pos={};Object.entries(groups).forEach(([layer,ids])=>{const tw=ids.length*W+(ids.length-1)*GX;ids.forEach((id,i)=>{pos[id]={x:-tw/2+i*(W+GX),y:Number(layer)*(H+GY)}})});return pos}

// ═══ STYLES ═════════════════════════════════════════════════════
const mono = {fontFamily:"'Space Mono','Courier New',monospace"};
const silk = {fontFamily:"'Silkscreen','Space Mono',monospace"};
const label = {...mono,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"2px",color:C.textMut};
const card = {background:C.bgWhite,border:`1px solid ${C.border}`,borderRadius:10};
const dot = (color=C.dot) => ({width:8,height:8,borderRadius:"50%",background:color,flexShrink:0});

// ═══ APP ════════════════════════════════════════════════════════
export default function App(){
const[analysis,setAnalysis]=useState(null);const[selNode,setSelNode]=useState(null);const[section,setSection]=useState("report");const[loading,setLoading]=useState(false);const[input,setInput]=useState("");const[err,setErr]=useState(null);const[ckState,setCkState]=useState({});const[fb,setFb]=useState(null);const[fbText,setFbText]=useState("");const svgRef=useRef(null);const[vb,setVb]=useState(null);const[drag,setDrag]=useState(false);const[dragS,setDragS]=useState(null);

const run=useCallback(trace=>{setLoading(true);setErr(null);setFb(null);setCkState({});setTimeout(()=>{try{const r=analyze(trace);setAnalysis(r);setSelNode(r.root_cause.node);setSection("report");const pos=layoutN(r.graph.nodes,r.graph.edges);const xs=Object.values(pos).map(p=>p.x),ys=Object.values(pos).map(p=>p.y);setVb({x:Math.min(...xs)-100,y:Math.min(...ys)-80,w:Math.max(...xs)-Math.min(...xs)+240+200,h:Math.max(...ys)-Math.min(...ys)+100+160})}catch(e){setErr(e.message)}setLoading(false)},300)},[]);
const submit=()=>{if(!input.trim())return;try{run(input)}catch(e){setErr(e.message)}};
const positions=useMemo(()=>analysis?layoutN(analysis.graph.nodes,analysis.graph.edges):{},[analysis]);
const selData=useMemo(()=>analysis&&selNode?analysis.graph.nodes.find(n=>n.id===selNode):null,[analysis,selNode]);
const onMD=e=>{if(e.target.closest('.gn'))return;setDrag(true);setDragS({x:e.clientX,y:e.clientY,vb:{...vb}})};const onMM=e=>{if(!drag||!dragS||!vb)return;const r=svgRef.current.getBoundingClientRect();setVb({...dragS.vb,x:dragS.vb.x-(e.clientX-dragS.x)*(vb.w/r.width),y:dragS.vb.y-(e.clientY-dragS.y)*(vb.h/r.height)})};const onMU=()=>setDrag(false);const onWh=e=>{if(!vb)return;const f=e.deltaY>0?1.1:.9;setVb({x:vb.x-(vb.w-vb.w*f)/2,y:vb.y-(vb.h-vb.h*f)/2,w:vb.w*f,h:vb.h*f})};

// ═══ LANDING PAGE (matches cofounder screenshots) ════════════════
if(!analysis){return(
<div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'Inter',system-ui,sans-serif"}}>
<link href={FONT} rel="stylesheet"/>

{/* Nav */}
<nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 48px",borderBottom:`1px solid ${C.border}`}}>
  <div style={{display:"flex",alignItems:"center",gap:6}}>
    <span style={{fontSize:18,fontWeight:700,...silk,color:C.text}}>404</span>
    <span style={{fontSize:18,fontWeight:400,...silk,color:C.accent}}>AI</span>
  </div>
  <div style={{display:"flex",gap:36,alignItems:"center"}}>
    {["PRODUCT","HOW IT WORKS","REPLAY"].map(t=>(<span key={t} style={{...label,fontSize:11,color:C.textSec,cursor:"pointer",letterSpacing:"2.5px"}}>{t}</span>))}
    <button style={{...mono,fontSize:12,color:C.text,background:"none",border:`1px solid ${C.border}`,borderRadius:4,padding:"8px 20px",cursor:"pointer",letterSpacing:"1px"}}>Start using 404 AI ↗</button>
  </div>
</nav>

{/* Hero */}
<div style={{maxWidth:800,margin:"0 auto",padding:"100px 48px 80px",textAlign:"center"}}>
  <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:28}}>
    <div style={dot()} />
    <span style={{...label,fontSize:12,color:C.textSec,letterSpacing:"3px"}}>DEBUGGER FOR MULTI-AGENT SYSTEMS</span>
  </div>
  <h1 style={{fontSize:64,fontWeight:700,...silk,lineHeight:1.15,marginBottom:20,color:C.text}}>Find the decisive step.</h1>
  <p style={{fontSize:17,color:C.textSec,marginBottom:44,lineHeight:1.7}}>See what broke. Replay the fix.</p>
  <div style={{display:"flex",gap:16,justifyContent:"center"}}>
    <button onClick={()=>document.getElementById('trace-input')?.focus()} style={{...mono,fontSize:12,letterSpacing:"1.5px",textTransform:"uppercase",padding:"14px 28px",background:C.accent,color:"#fff",border:"none",borderRadius:6,cursor:"pointer",fontWeight:700}}>Start using 404 AI ↗</button>
    <button onClick={()=>document.getElementById('how')?.scrollIntoView({behavior:'smooth'})} style={{...mono,fontSize:12,letterSpacing:"1.5px",textTransform:"uppercase",padding:"14px 28px",background:"none",color:C.textSec,border:"none",cursor:"pointer",fontWeight:500}}>See how it works ↗</button>
  </div>
</div>

{/* Stats section */}
<div style={{maxWidth:960,margin:"0 auto",padding:"40px 48px",borderTop:`1px solid ${C.border}`}}>
  <div style={{display:"grid",gridTemplateColumns:"280px 1fr 1fr 1fr",gap:24,alignItems:"start"}}>
    <div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><div style={dot()} /><span style={{...label,fontSize:11,color:C.text,fontWeight:700}}>WHAT CHANGES</span></div>
      <p style={{fontSize:14,color:C.textSec,lineHeight:1.6}}>From a long trace to one defensible next move.</p>
    </div>
    {[{v:"3",l:"framework starting points",sub:"LangGraph · CrewAI · AutoGen"},{v:"1",l:"decisive error step",sub:"earliest causal break"},{v:"4",l:"moves from failure to fix",sub:"ingest · graph · traverse · replay"}].map(s=>(
      <div key={s.l} style={{...card,padding:"20px 24px"}}>
        <div style={{fontSize:48,fontWeight:700,...silk,color:C.accent,marginBottom:4}}>{s.v}</div>
        <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:4}}>{s.l}</div>
        <div style={{fontSize:11,...mono,color:C.textMut}}>{s.sub}</div>
      </div>
    ))}
  </div>
</div>

{/* Trace input */}
<div id="trace-input" style={{maxWidth:700,margin:"60px auto 0",padding:"0 48px"}}>
  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><div style={dot()} /><span style={{...label}}>PASTE TRACE</span></div>
  <div style={{...card,padding:20}}>
    <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder={"Paste your execution trace here\nSupports: OpenTelemetry · LangSmith · raw JSON · plain text"} style={{width:"100%",minHeight:120,padding:14,background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,...mono,fontSize:12,lineHeight:1.7,resize:"vertical",outline:"none"}} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
    <button onClick={submit} disabled={loading||!input.trim()} style={{width:"100%",marginTop:12,padding:"14px",background:loading||!input.trim()?C.border:C.accent,color:loading||!input.trim()?C.textMut:"#fff",border:"none",borderRadius:6,...mono,fontSize:12,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",cursor:loading?"wait":"pointer",transition:"all .2s"}}>
      {loading?"Analyzing...":"Start analysis ↗"}
    </button>
  </div>
  {err&&<div style={{marginTop:12,padding:"10px 14px",background:C.desLight,border:`1px solid ${C.des}20`,borderRadius:6,fontSize:12,color:C.des,...mono}}>{err}</div>}
</div>

{/* Demo samples */}
<div style={{maxWidth:700,margin:"40px auto 0",padding:"0 48px"}}>
  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><div style={dot()} /><span style={{...label}}>SELECT A TRACE</span></div>
  <div style={{display:"flex",flexDirection:"column",gap:8}}>
    {Object.entries(SAMPLES).map(([k,s])=>(
      <button key={k} onClick={()=>{setInput(JSON.stringify(s.trace,null,2));run(s.trace)}} disabled={loading} style={{display:"flex",alignItems:"flex-start",gap:16,padding:"20px 24px",...card,cursor:"pointer",textAlign:"left",fontFamily:"inherit",color:C.text,transition:"border-color .15s"}} onMouseOver={e=>e.currentTarget.style.borderColor=C.accent} onMouseOut={e=>e.currentTarget.style.borderColor=C.border}>
        <div style={{flex:1}}>
          <div style={{...label,fontSize:9,color:C.accent,marginBottom:6,letterSpacing:"2px"}}>{s.tag}</div>
          <div style={{fontSize:15,fontWeight:600,marginBottom:4}}>{s.name}</div>
          <div style={{fontSize:13,color:C.textSec,lineHeight:1.6}}>{s.desc}</div>
        </div>
        <span style={{fontSize:13,color:C.textMut,...mono}}>↗</span>
      </button>
    ))}
  </div>
</div>

{/* How it works */}
<div id="how" style={{maxWidth:800,margin:"80px auto 0",padding:"0 48px 80px"}}>
  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><div style={dot()} /><span style={{...label}}>HOW IT WORKS</span></div>
  <h2 style={{fontSize:36,...silk,fontWeight:700,marginBottom:32}}>Trace the cause. Test the fix.</h2>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
    {[{n:"01",t:"Ingest the run",d:"OpenTelemetry spans from LangGraph, CrewAI, or AutoGen.",tag:"span / tool_call / memory"},{n:"02",t:"See the causal graph",d:"Agent steps, tool calls, memory operations become one execution graph.",tag:"MACEG / structure"},{n:"03",t:"Traverse the failure",d:"Counterfactual Causal Traversal backtracks to the earliest Decisive Error Step.",tag:"CCT / DES"},{n:"04",t:"Replay the branch",d:"Snapshot state at span boundaries. Change one variable. See if it recovers.",tag:"replay / controlled"}].map(s=>(
      <div key={s.n} style={{...card,padding:24}}>
        <div style={{fontSize:14,...silk,color:C.accent,marginBottom:10}}>{s.n}</div>
        <div style={{fontSize:16,fontWeight:600,marginBottom:6}}>{s.t}</div>
        <div style={{fontSize:13,color:C.textSec,lineHeight:1.6,marginBottom:10}}>{s.d}</div>
        <div style={{...label,fontSize:10,color:C.textMut}}>{s.tag}</div>
      </div>
    ))}
  </div>
</div>

{/* Footer */}
<div style={{borderTop:`1px solid ${C.border}`,padding:"24px 48px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
  <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{...silk,fontSize:14,fontWeight:700}}>404</span><span style={{...silk,fontSize:14,color:C.accent}}>AI</span></div>
  <span style={{fontSize:11,color:C.textMut}}>Find the decisive step. Fix the cause.</span>
  <span style={{fontSize:11,color:C.textMut}}>© 2026 404 AI</span>
</div>
</div>)}

// ═══ DEBUGGER VIEW ═══════════════════════════════════════════════
const{graph,root_cause:rc,impact_chain:ic,evidence,evidenceScore:es,propagation:prop,decisions,checklist,summaryReport,summary,agent_scores}=analysis;
const nC={root_cause:{bg:C.desLight,border:C.des,text:"#8B2020"},impacted:{bg:C.impactLight,border:C.impact,text:"#8B6914"},error:{bg:"#FDF2F0",border:"#E74C3C30",text:"#C0392B"},ok:{bg:C.bgWhite,border:C.border,text:C.textSec}};

return(
<div style={{display:"flex",flexDirection:"column",height:"100vh",background:C.bg,color:C.text,fontFamily:"'Inter',sans-serif",overflow:"hidden"}}>
<link href={FONT} rel="stylesheet"/>
{/* Header */}
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",height:52,background:C.bgWhite,borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
  <div style={{display:"flex",alignItems:"center",gap:8}}>
    <span style={{...silk,fontSize:14,fontWeight:700,cursor:"pointer"}} onClick={()=>setAnalysis(null)}>404</span><span style={{...silk,fontSize:14,color:C.accent}}>AI</span>
    <span style={{...label,fontSize:9,marginLeft:8,color:C.textMut}}>INVESTIGATION REPORT</span>
  </div>
  <div style={{display:"flex",alignItems:"center",gap:14}}>
    <span style={{fontSize:10,...mono,color:C.textMut}}>{summary.algorithm} · {summary.analysis_time_ms}ms</span>
    {summary.root_cause_found&&<span style={{fontSize:10,fontWeight:700,color:C.des,background:C.desLight,padding:"4px 12px",borderRadius:4,...mono}}>DES IDENTIFIED</span>}
    <button onClick={()=>setAnalysis(null)} style={{...card,padding:"5px 14px",fontSize:11,...mono,color:C.textSec,cursor:"pointer"}}>New trace</button>
  </div>
</div>

<div style={{display:"grid",gridTemplateColumns:"1fr 400px",flex:1,overflow:"hidden"}}>
{/* Graph */}
<div style={{position:"relative",overflow:"hidden"}}>
<svg ref={svgRef} width="100%" height="100%" viewBox={vb?`${vb.x} ${vb.y} ${vb.w} ${vb.h}`:"0 0 800 600"} onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU} onWheel={onWh} style={{cursor:drag?"grabbing":"grab",background:C.bg}}>
<defs><pattern id="g" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r=".6" fill={C.border}/></pattern></defs>
<rect x={vb?vb.x-3e3:-3e3} y={vb?vb.y-3e3:-3e3} width={(vb?.w||800)+6e3} height={(vb?.h||600)+6e3} fill="url(#g)"/>
{graph.edges.map(e=>{const sp=positions[e.source],tp=positions[e.target];if(!sp||!tp)return null;const x1=sp.x+100,y1=sp.y+68,x2=tp.x+100,y2=tp.y,mid=(y1+y2)/2;return<g key={e.id}><path d={`M${x1},${y1} C${x1},${mid} ${x2},${mid} ${x2},${y2}`} fill="none" stroke={e.is_impact_path?C.impact:e.type==="HANDS_OFF"?"#A8A0D0":C.border} strokeWidth={e.is_impact_path?2.5:1.2} strokeDasharray={e.type==="HANDS_OFF"?"5,3":"none"}/><polygon points={`${x2-3},${y2-5} ${x2+3},${y2-5} ${x2},${y2}`} fill={e.is_impact_path?C.impact:C.border}/></g>})}
{graph.nodes.map(n=>{const p=positions[n.id];if(!p)return null;const c=nC[n.visual_status]||nC.ok;const sel=n.id===selNode;return<g key={n.id} className="gn" onClick={()=>setSelNode(n.id)} style={{cursor:"pointer"}}>
{n.is_root_cause&&<rect x={p.x-4} y={p.y-4} width={208} height={76} rx={12} fill="none" stroke={C.des} strokeWidth={2} strokeDasharray="5,3"><animate attributeName="opacity" values="1;.3;1" dur="2.5s" repeatCount="indefinite"/></rect>}
{sel&&!n.is_root_cause&&<rect x={p.x-2} y={p.y-2} width={204} height={72} rx={11} fill="none" stroke={C.accent} strokeWidth={1.5}/>}
<rect x={p.x} y={p.y} width={200} height={68} rx={10} fill={c.bg} stroke={c.border} strokeWidth={1.2}/>
<text x={p.x+10} y={p.y+20} fill={c.text} fontSize={11} fontWeight={600} fontFamily="Inter,sans-serif">{n.agent}</text>
{n.is_root_cause&&<><rect x={p.x+158} y={p.y+8} width={32} height={14} rx={3} fill={C.desLight} stroke={C.des} strokeWidth={.5}/><text x={p.x+174} y={p.y+18} fill={C.des} fontSize={7} fontWeight={700} textAnchor="middle" fontFamily="'Space Mono'">DES</text></>}
<text x={p.x+10} y={p.y+36} fill={C.textMut} fontSize={9} fontFamily="'Space Mono',monospace">{n.operation}{n.tool?` → ${n.tool}`:""}</text>
<text x={p.x+10} y={p.y+50} fill={C.textMut} fontSize={8} fontFamily="'Space Mono',monospace">{n.tokens}tok · {n.duration_ms}ms</text>
{n.degradation!=null&&<><rect x={p.x+10} y={p.y+59} width={110} height={2.5} rx={1} fill={C.bg}/><rect x={p.x+10} y={p.y+59} width={110*n.degradation} height={2.5} rx={1} fill={C.impact}/></>}
</g>})}
</svg>
</div>

{/* Right panel */}
<div style={{background:C.bgWhite,borderLeft:`1px solid ${C.border}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
{/* Stats */}
<div style={{display:"flex",padding:"10px 16px",borderBottom:`1px solid ${C.border}`}}>
{[{v:summary.total_spans,l:"Spans"},{v:summary.agent_count,l:"Agents"},{v:summary.error_count,l:"Errors",c:C.des},{v:es.score,l:"Evidence",c:es.score>=70?C.ok:es.score>=40?C.impact:C.des}].map(s=>(<div key={s.l} style={{flex:1,textAlign:"center"}}><div style={{fontSize:16,fontWeight:700,...mono,color:s.c||C.text}}>{s.v}</div><div style={{...label,fontSize:7}}>{s.l}</div></div>))}
</div>
{/* Confidence */}
{summary.root_cause_found&&<div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px",borderBottom:`1px solid ${C.border}`}}>
<span style={{...label,fontSize:8}}>CIA SCORE</span>
<div style={{flex:1,height:4,background:C.bg,borderRadius:2,overflow:"hidden"}}><div style={{width:`${summary.root_cause_confidence*100}%`,height:"100%",borderRadius:2,background:summary.root_cause_confidence>.7?C.des:C.impact}}/></div>
<span style={{fontSize:12,fontWeight:700,...mono,color:summary.root_cause_confidence>.7?C.des:C.impact}}>{Math.round(summary.root_cause_confidence*100)}%</span>
</div>}
{/* Tabs */}
<div style={{display:"flex",gap:2,padding:"6px 12px",borderBottom:`1px solid ${C.border}`,flexWrap:"wrap"}}>
{["report","evidence","propagation","decisions","checklist","export"].map(t=>(<button key={t} onClick={()=>setSection(t)} style={{padding:"6px 12px",background:section===t?C.accentLight:"transparent",color:section===t?C.accent:C.textMut,border:`1px solid ${section===t?C.accent+"30":"transparent"}`,borderRadius:5,...label,fontSize:9,cursor:"pointer",letterSpacing:"1.5px"}}>{t}</button>))}
</div>
{/* Content */}
<div style={{flex:1,overflowY:"auto",padding:"14px 16px"}}>
{section==="report"&&<div>
<div style={{...card,padding:16,borderLeft:`3px solid ${C.des}`,marginBottom:14}}>
<div style={{...label,color:C.des,marginBottom:6,fontSize:9}}>DECISIVE ERROR STEP</div>
<div style={{fontSize:14,fontWeight:600,marginBottom:4}}>{rc.agent} → {rc.operation}</div>
<div style={{fontSize:12,color:C.textSec,lineHeight:1.6,marginBottom:6}}>{rc.detail}</div>
<div style={{display:"flex",gap:12}}><span style={{fontSize:10,...mono,color:C.textMut}}>Node: {rc.node}</span><span style={{fontSize:10,...mono,color:C.des,fontWeight:600}}>Confidence: {Math.round(rc.confidence*100)}%</span></div>
</div>
<div style={{...card,padding:14,marginBottom:14}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{...label,fontSize:9}}>EVIDENCE SCORE</span><span style={{fontSize:20,fontWeight:700,...mono,color:es.score>=70?C.ok:es.score>=40?C.impact:C.des}}>{es.score}</span></div>
<div style={{height:5,background:C.bg,borderRadius:3,overflow:"hidden",marginBottom:6}}><div style={{width:`${es.score}%`,height:"100%",borderRadius:3,background:es.score>=70?C.ok:es.score>=40?C.impact:C.des}}/></div>
<div style={{fontSize:12,color:C.textSec}}>{es.explanation}</div>
<div style={{display:"flex",gap:10,marginTop:4}}><span style={{fontSize:10,...mono,color:C.ok}}>● {es.obs} observable</span><span style={{fontSize:10,...mono,color:C.textMut}}>○ {es.inf} inferred</span></div>
</div>
{decisions.length>0&&<div style={{...card,padding:14,borderLeft:`3px solid ${C.ok}`,marginBottom:14}}>
<div style={{...label,color:C.ok,fontSize:9,marginBottom:6}}>RECOMMENDED ACTION</div>
<div style={{fontSize:13,fontWeight:600,marginBottom:4}}>[{decisions[0].pri}] {decisions[0].title}</div>
<div style={{fontSize:12,color:C.textSec,lineHeight:1.6}}>{decisions[0].why}</div>
<div style={{fontSize:10,...mono,color:C.textMut,marginTop:4}}>Effort: {decisions[0].effort} · Confidence: {decisions[0].conf}</div>
</div>}
<div style={{...card,padding:14}}>
<div style={{...label,fontSize:9,marginBottom:10}}>AGENT TRUST</div>
{Object.entries(agent_scores).sort((a,b)=>a[1]-b[1]).map(([ag,sc])=>(<div key={ag} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
<span style={{fontSize:11,fontWeight:500,minWidth:90,color:C.textSec}}>{ag}</span>
<div style={{flex:1,height:4,background:C.bg,borderRadius:2,overflow:"hidden"}}><div style={{width:`${sc}%`,height:"100%",borderRadius:2,background:sc>70?C.ok:sc>40?C.impact:C.des}}/></div>
<span style={{fontSize:11,fontWeight:600,...mono,color:sc>70?C.ok:sc>40?C.impact:C.des,minWidth:30}}>{sc}%</span>
</div>))}
</div></div>}

{section==="evidence"&&<div style={{display:"flex",flexDirection:"column",gap:6}}>{evidence.map(e=>(<div key={e.id} onClick={()=>setSelNode(e.step)} style={{...card,padding:14,cursor:"pointer",borderLeft:`3px solid ${e.sev==="critical"?C.des:e.sev==="high"?C.impact:C.textMut}`}}>
<div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
<span style={{fontSize:12,fontWeight:600}}>{e.title}</span>
<div style={{display:"flex",gap:3}}><span style={{fontSize:9,...label,padding:"2px 6px",borderRadius:3,background:e.cat==="observable"?C.okLight:C.tag,color:e.cat==="observable"?C.ok:C.textMut,letterSpacing:"1px"}}>{e.cat}</span><span style={{fontSize:9,...label,padding:"2px 6px",borderRadius:3,background:e.sev==="critical"?C.desLight:C.tag,color:e.sev==="critical"?C.des:C.textMut,letterSpacing:"1px"}}>{e.sev}</span></div></div>
<div style={{fontSize:11,color:C.textSec,lineHeight:1.5}}>{e.desc}</div>
<div style={{fontSize:10,...mono,color:C.textMut,marginTop:3}}>Step: {e.step}</div>
</div>))}</div>}

{section==="propagation"&&<div><div style={{...label,fontSize:9,marginBottom:10}}>FAILURE PROPAGATION</div>
{prop.stages.map((s,i)=>(<div key={s.id}><div onClick={()=>setSelNode(s.step)} style={{...card,padding:14,cursor:"pointer",borderLeft:`3px solid ${s.sev==="critical"?C.des:C.impact}`}}>
<div style={{display:"flex",justifyContent:"space-between"}}><div><div style={{...label,fontSize:9,color:s.sev==="critical"?C.des:C.impact,letterSpacing:"1.5px"}}>{s.label}</div><div style={{fontSize:12,fontWeight:600,marginTop:3}}>{s.agent}</div></div>
{s.deg&&<span style={{fontSize:10,...mono,color:C.impact}}>{Math.round(s.deg*100)}%</span>}</div>
<div style={{fontSize:11,color:C.textSec,lineHeight:1.5,marginTop:4}}>{s.desc}</div>
</div>{i<prop.stages.length-1&&<div style={{display:"flex",justifyContent:"center",padding:"2px 0"}}><div style={{width:1,height:18,background:C.border}}/></div>}</div>))}</div>}

{section==="decisions"&&<div style={{display:"flex",flexDirection:"column",gap:8}}><div style={{...label,fontSize:9,marginBottom:2}}>RANKED ACTIONS</div>
{decisions.map(d=>(<div key={d.id} style={{...card,padding:16}}>
<div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:13,fontWeight:600}}>{d.title}</span><span style={{fontSize:10,fontWeight:700,color:d.pri==="P0"?C.des:C.impact,...mono,background:d.pri==="P0"?C.desLight:C.impactLight,padding:"2px 8px",borderRadius:4}}>{d.pri}</span></div>
{[{l:"Why",v:d.why},{l:"Impact",v:d.impact},{l:"Risks",v:d.risks}].map(f=>(<div key={f.l} style={{marginBottom:4}}><div style={{...label,fontSize:8,marginBottom:1}}>{f.l}</div><div style={{fontSize:11,color:C.textSec,lineHeight:1.5}}>{f.v}</div></div>))}
<div style={{display:"flex",gap:14,marginTop:3}}><span style={{fontSize:10,...mono,color:C.textMut}}>Confidence: {d.conf}</span><span style={{fontSize:10,...mono,color:C.textMut}}>Effort: {d.effort}</span></div>
</div>))}</div>}

{section==="checklist"&&<div><div style={{...label,fontSize:9,marginBottom:10}}>VALIDATION CHECKLIST</div>
{checklist.map(c=>(<div key={c.id} onClick={()=>setCkState(p=>({...p,[c.id]:!p[c.id]}))} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 14px",...card,marginBottom:4,cursor:"pointer",background:ckState[c.id]?C.okLight:C.bgWhite,borderColor:ckState[c.id]?C.okBorder:C.border}}>
<div style={{width:18,height:18,borderRadius:4,border:`2px solid ${ckState[c.id]?C.ok:C.border}`,background:ckState[c.id]?C.ok:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>{ckState[c.id]&&<span style={{color:"#fff",fontSize:11,fontWeight:700}}>✓</span>}</div>
<span style={{fontSize:12,color:ckState[c.id]?C.textMut:C.text,textDecoration:ckState[c.id]?"line-through":"none",lineHeight:1.5}}>{c.text}</span>
</div>))}
<div style={{marginTop:8,fontSize:11,...mono,color:C.textMut,textAlign:"center"}}>{Object.values(ckState).filter(Boolean).length} / {checklist.length} completed</div>
</div>}

{section==="export"&&<div>
<div style={{...label,fontSize:9,marginBottom:10}}>ENGINEERING SUMMARY</div>
<div style={{display:"flex",gap:6,marginBottom:12}}>
<button onClick={()=>navigator.clipboard.writeText(summaryReport)} style={{flex:1,padding:"10px",...mono,fontSize:11,fontWeight:600,background:C.accent,color:"#fff",border:"none",borderRadius:5,cursor:"pointer"}}>Copy</button>
<button onClick={()=>{const b=new Blob([summaryReport],{type:"text/markdown"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="404ai-report.md";a.click()}} style={{flex:1,padding:"10px",...mono,fontSize:11,fontWeight:600,...card,cursor:"pointer",color:C.text}}>Download .md</button>
</div>
<div style={{...card,padding:14,...mono,fontSize:10,lineHeight:1.7,color:C.textSec,whiteSpace:"pre-wrap",maxHeight:300,overflowY:"auto"}}>{summaryReport}</div>
<div style={{...card,padding:16,marginTop:14}}>
<div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Was this diagnosis helpful?</div>
<div style={{display:"flex",gap:6}}>
<button onClick={()=>setFb("yes")} style={{flex:1,padding:"8px",...card,fontSize:12,cursor:"pointer",background:fb==="yes"?C.okLight:C.bgWhite,color:fb==="yes"?C.ok:C.textSec,borderColor:fb==="yes"?C.okBorder:C.border}}>👍 Correct</button>
<button onClick={()=>setFb("no")} style={{flex:1,padding:"8px",...card,fontSize:12,cursor:"pointer",background:fb==="no"?C.desLight:C.bgWhite,color:fb==="no"?C.des:C.textSec}}>👎 Incorrect</button>
</div>
{fb==="yes"&&<div style={{fontSize:11,color:C.ok,marginTop:6}}>Thank you. Feedback recorded.</div>}
{fb==="no"&&<div style={{marginTop:6}}><textarea value={fbText} onChange={e=>setFbText(e.target.value)} placeholder="What actually caused the issue?" style={{width:"100%",minHeight:50,padding:8,background:C.bg,border:`1px solid ${C.border}`,borderRadius:4,fontSize:11,...mono,resize:"vertical",outline:"none",color:C.text}}/><button onClick={()=>setFb("sent")} style={{marginTop:4,padding:"6px 14px",background:C.accent,color:"#fff",border:"none",borderRadius:4,...mono,fontSize:10,cursor:"pointer"}}>Submit</button></div>}
{fb==="sent"&&<div style={{fontSize:11,color:C.ok,marginTop:6}}>Feedback recorded.</div>}
</div></div>}
</div>

{/* Node detail */}
{selData&&<div style={{borderTop:`1px solid ${C.border}`,padding:14,maxHeight:"32%",overflowY:"auto",flexShrink:0,background:C.bgWhite}}>
<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
<span style={{fontSize:9,...label,padding:"2px 7px",borderRadius:3,background:selData.visual_status==="root_cause"?C.desLight:C.tag,color:selData.visual_status==="root_cause"?C.des:C.textMut,letterSpacing:"1px"}}>{selData.visual_status==="root_cause"?"DES":selData.visual_status}</span>
<span style={{fontSize:12,fontWeight:600,...mono}}>{selData.id}</span>
</div>
{[{l:"Agent",v:selData.agent},{l:"Operation",v:selData.operation+(selData.tool?` → ${selData.tool}`:"")},selData.reasoning&&{l:"Reasoning",v:selData.reasoning},selData.output_summary&&{l:"Output",v:selData.output_summary},selData.error&&{l:"Error",v:selData.error,c:C.des}].filter(Boolean).map(f=>(<div key={f.l} style={{marginBottom:5}}>
<div style={{...label,fontSize:8,marginBottom:2}}>{f.l}</div>
<div style={{fontSize:11,color:f.c||C.textSec,lineHeight:1.5,background:C.bg,padding:"6px 8px",borderRadius:5,border:`1px solid ${C.border}`,...mono,wordBreak:"break-word"}}>{f.v}</div>
</div>))}
</div>}
</div></div>
<style>{`::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}`}</style>
</div>)}
