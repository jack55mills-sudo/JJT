"use client";

import { useEffect, useState } from "react";
import SchedulePreview, { getUpcomingCustomEvents } from "./SchedulePreview";
import { useBrowserItems, type CustomEvent, type HomeInfo } from "./browser-data";
import HomeInformation from "./HomeInformation";
import Records from "./Records";
import { sampleRecords } from "./sample-records";
import AccountSettings from "./AccountSettings";
import InvitePreview from "./InvitePreview";
import Expenses, { EXPENSE_KEY, money, outstanding, type Expense } from "./Expenses";
import { sampleHousehold } from "./sample-household";
import { expenseOccurrences } from "./expense-schedule";
import SetupFlow, { type Household } from "./setup-flow";

type Section = "Home" | "Schedule" | "Rental" | "Money" | "Records" | "Settings";
const nav: { name: Section; icon: string }[] = [{name:"Home",icon:"⌂"},{name:"Schedule",icon:"▦"},{name:"Rental",icon:"▤"},{name:"Money",icon:"◫"},{name:"Records",icon:"▧"}];
const mobileNav = [nav[1], nav[2], nav[0], nav[3], nav[4]];
const sectionLabels: Record<Section, string> = { Home: "Home", Schedule: "Calendar", Rental: "Home Details", Money: "Expenses", Records: "Records", Settings: "Settings" };
const events = [{month:"SEP",day:"01",title:"September rent",detail:"$850 per roommate · Monthly",tag:"PAYMENT",tone:"peach"},{month:"SEP",day:"04",title:"Electricity bill",detail:"Split between 3 roommates",tag:"BILL",tone:"yellow"},{month:"SEP",day:"12",title:"Maintenance visit",detail:"Kitchen sink · 10:00 AM",tag:"HOME",tone:"sage"},{month:"NOV",day:"01",title:"Move-out notice",detail:"Review your lease before sending",tag:"LEASE",tone:"lavender"}];
function UpcomingEvents({ onNavigate, onOpenEvent }: { onNavigate: (section: Section) => void; onOpenEvent: (event: CustomEvent, date: string) => void }) {
 const {items,ready,error}=useBrowserItems<CustomEvent>("goodhouse-calendar-v1");
 const {items:expenses}=useBrowserItems<Expense>(EXPENSE_KEY);
 if(!ready)return <p className="custom-help">Loading upcoming events…</p>;
 if(error)return <p className="custom-error" role="alert">{error}</p>;
 const hasPersonalEvents=items.some(item=>item.kind==="event")||expenses.length>0;
 const today=new Date(); const dateKey=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
 const endDate=`${today.getFullYear()+1}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
 const seen=new Set<string>();
 const expenseEvents=expenseOccurrences(expenses,dateKey,endDate).filter(o=>{const series=o.expense.seriesId||o.expense.id;if(seen.has(series))return false;seen.add(series);return true;}).map(({expense:e,date,projected})=>({id:`expense:${e.id}:${date}`,date,title:e.name,detail:`${money(e.total)} · ${projected?"Estimated":"Due"}`,tone:"peach",expense:true,custom:undefined}));
 const personalEvents=[...getUpcomingCustomEvents(items),...expenseEvents].sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title)).slice(0,3);
 if(hasPersonalEvents&&!personalEvents.length)return <p className="custom-help">No upcoming events. Your chores are in the Calendar’s Month view.</p>;
 return <div className="home-event-list">{hasPersonalEvents?personalEvents.map(event=>{
  const day=new Date(event.date+"T00:00:00");
  return <button className="home-event" key={event.id} onClick={()=>event.custom?onOpenEvent(event.custom,event.date):onNavigate("Money")} aria-label={`${event.title}, ${event.detail}. Open ${event.custom?"Calendar":"Expenses"}`}><span className={`date ${event.tone}`}><span>{day.toLocaleDateString("en-US",{month:"short"}).toUpperCase()}</span><strong>{String(day.getDate()).padStart(2,"0")}</strong></span><span className="home-event-copy"><strong>{event.title}</strong><small>{event.detail} · This browser</small></span><span className="home-event-category">EVENT</span><span className="home-event-arrow" aria-hidden="true">→</span></button>;
 }):events.slice(0,3).map((event,index)=>{
  const destination: Section=index<2?"Money":"Schedule";
  return <button className="home-event" key={event.title} onClick={()=>onNavigate(destination)} aria-label={`${event.title}, ${event.detail}. Sample. Open ${sectionLabels[destination]}`}><span className={`date ${event.tone}`}><span>{event.month}</span><strong>{event.day}</strong></span><span className="home-event-copy"><strong>{event.title}</strong><small>{event.detail} · Sample</small></span><span className="home-event-category">{event.tag}</span><span className="home-event-arrow" aria-hidden="true">→</span></button>;
 })}</div>;
}
function HouseholdDropdown({ household, mobile=false }: { household: Household | null; mobile?: boolean }) {
 const names=household ? household.roommateNames.map(name=>name.trim()).filter(Boolean) : ["Alex Morgan", "John Smith", "Jane Doe"];
 return <details className={`household-dropdown${mobile?" household-dropdown-mobile":""}`}>
  <summary className="house"><span className="house-icon" aria-hidden="true">⌂</span><span className="house-copy"><b>{household?.homeName||"Maple House"}</b><small>{household?.roommateCount||"3"} roommates · San Luis Obispo</small></span><span className="house-arrow" aria-hidden="true">⌄</span></summary>
  <div className="household-members"><div className="household-members-title">{household ? "Names from setup" : "Sample roommates"}</div>{names.length ? <ul>{names.map((name,index)=><li key={`${name}-${index}`}><span className="household-member-avatar" aria-hidden="true">{name.charAt(0).toUpperCase()}</span><span>{name}</span></li>)}</ul> : <p>No roommate names added yet.</p>}<p className="household-members-note">Signup status isn’t available yet.</p></div>
 </details>;
}
function Heading({eyebrow,title,subtitle}:{eyebrow:string,title:string,subtitle:string}) {return <header className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div><div className="demo-pill"><span/> Sample household</div></header>}
function AppContent({savedHousehold,saveHousehold,setupError}: {savedHousehold:Household|null;saveHousehold:(items:Household[])=>boolean;setupError:string}) {
 const {items:expenseItems}=useBrowserItems<Expense>(EXPENSE_KEY);
 const [section,setSection]=useState<Section>("Home");
 const [calendarFocus,setCalendarFocus]=useState<{event:CustomEvent;date:string}|null>(null);
 const [question,setQuestion]=useState("");
 const [answer,setAnswer]=useState("");
 const [answerLinks,setAnswerLinks]=useState<Section[]>([]);
 const [selected,setSelected]=useState<string | null>(null);
 const [setupComplete,setSetupComplete]=useState(!!savedHousehold);
 const [hasVisitedDashboard,setHasVisitedDashboard]=useState(!!savedHousehold);
 const [household,setHousehold]=useState<Household | null>(savedHousehold);
 const rentShare=(Number(household?.rent)||2550)/Math.max(1,Number(household?.roommateCount)||3);
 const fmt=(value:number)=>"$"+value.toFixed(2);
 const estimatedTotal=rentShare+56.4;
 const formatDate=(value:string)=>new Date(value+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
 const costs=[{name:"Rent",amount:fmt(rentShare),sub:"Your share · due on the lease start date"},{name:"Electricity",amount:"$36.40",sub:"Sample estimate · due Sep 4"},{name:"Internet",amount:"$20.00",sub:"Sample estimate · due Sep 8"}];
 const ask=(q:string)=>{
  setQuestion(q);const text=q.toLowerCase();
  const respond=(message:string,...links:Section[])=>{setAnswer(message);setAnswerLinks(links);};
  const read=<T,>(key:string,fallback:T[]):T[]=>{try{const data:unknown=JSON.parse(window.localStorage.getItem(key)||"[]");return Array.isArray(data)?data as T[]:fallback;}catch{return fallback;}};
  const expenses=read<Expense>(EXPENSE_KEY,expenseItems), calendar=read<CustomEvent>("goodhouse-calendar-v1",[]), details=read<HomeInfo>("goodhouse-home-info-v1",[]);
  const queryWords:string[]=text.match(/[a-z0-9]+/g)||[]; const match=(label:string)=>{const words=label.toLowerCase().match(/[a-z0-9]+/g)||[];return words.length>0&&((` ${queryWords.join(" ")} `).includes(` ${words.join(" ")} `)||words.some(word=>word.length>=5&&queryWords.includes(word)));};
  const demo=/\bsample\b|\bexample\b|\bdemo\b/.test(text);
  if(demo&&/guest|visitor/.test(text))return respond(`Sample household: ${sampleHousehold.agreement.guests} Source: fictional household agreement. This is not your lease.`,"Rental");
  if(demo&&/\brent\b|electric|utilit/.test(text)){const record=sampleHousehold.expenses[/\brent\b/.test(text)?0:1];return respond(`Sample household: ${record.name} is ${money(record.total)}, due ${record.due}. Agreed shares: ${Object.entries(record.shares).map(([n,c])=>`${n} ${money(c)}`).join(", ")}. Payable to ${record.payer}. Source: fictional example expense record.`,"Money");}
  if(demo&&/notice/.test(text))return respond(`Fictional sample lease: it lists ${sampleHousehold.lease.noticeDays} days’ notice. This is not your lease or a legal determination.`,"Records");
  const info=details.find(i=>match(i.label));if(info)return respond(`${info.label}: ${info.note} Source: Home Details, saved on this browser.`,"Rental");
  const bill=[...expenses].sort((a,b)=>b.due.localeCompare(a.due)).find(e=>match(e.name)||(/\brent\b/.test(text)&&/rent/i.test(e.name))||(/electric|utilit/.test(text)&&/electric|utilit/i.test(e.name)));
  if(bill&&/due|when|next/.test(text)) {const now=new Date(), start=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`, end=`${now.getFullYear()+1}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`, root=bill.seriesId||bill.id; const occurrence=expenseOccurrences(expenses,start,end).find(o=>(o.expense.seriesId||o.expense.id)===root); if(occurrence){const entry=occurrence.expense;return respond(`${entry.name}: next due ${occurrence.date}, ${money(entry.total)} total${occurrence.projected?" (estimate based on the recurring expense)":""}. Shares: ${Object.entries(entry.shares).map(([n,c])=>`${n} ${money(c)}`).join(", ")}. Source: Expenses on this browser; not verified or shared.`,"Money","Schedule");} return respond(`${bill.name}: the recorded bill was due ${bill.due}. No later occurrence is recorded. Source: Expenses on this browser.`,"Money","Schedule");}
  if(bill){const person=Object.keys(bill.shares).find(n=>text.includes(n.toLowerCase())||(n.split(" ")[0].length>2&&text.includes(n.split(" ")[0].toLowerCase())));return respond(`${bill.name}: ${money(bill.total)} total for the bill dated ${bill.due}. ${person?`${person}’s agreed share is ${money(bill.shares[person])}${person===bill.payer?" (covered by payer)":`; ${money(outstanding(bill,person))} remains after confirmed or recorded payments`}.`:`Shares: ${Object.entries(bill.shares).map(([n,c])=>`${n} ${money(c)}`).join(", ")}.`} ${bill.payer==="Landlord / provider"?"Payable directly to landlord / provider.":`Reimburse ${bill.payer}.`} Source: Expenses on this browser; not verified or shared.`,"Money","Schedule");}
  const event=calendar.find(i=>match(i.title));if(event)return respond(`${event.title}: ${event.date}, assigned to ${event.owner}; ${event.repeat==="once"?"one time":`repeats ${event.repeat} from that date`}. Source: Calendar on this browser.`,"Schedule");
  const record=sampleRecords.find(i=>match(i.name));if(record&&/record|file|photo|document|receipt|lease|checklist|pdf/.test(text))return respond(`${record.name}: ${record.note} (${record.type}, ${record.date}). Source: fictional sample in Records; not an uploaded file.`,"Records");
  if(/guest|visitor/.test(text))return respond("I don’t have your guest policy. This preview cannot read your lease. Source: no guest rule has been entered.","Rental");
  if(/notice/.test(text))return respond("I don’t know your notice requirement. The walkthrough has a fictional example; it is not your lease. Check your lease and local tenant resources.","Records");
  if(/\brent\b/.test(text)&&/due|when|date/.test(text))return respond("I don’t know when your rent is due. A lease start date is not necessarily a rent due date. Add a rent expense to track it.","Money");
  if(/\brent\b/.test(text))return respond(`${household?"Your setup lists":"The sample home lists"} total monthly rent as ${fmt(Number(household?.rent||5000))}. Source: Home Details; not verified against a lease.`,"Rental","Money");
  if(/deposit/.test(text))return respond(`${household?"Your setup lists":"The sample home lists"} a deposit of ${fmt(Number(household?.deposit||2550))}. Source: Home Details; not verified against a lease.`,"Rental");
  if(/utilities|utility/.test(text))return respond(`Home Details lists ${household?.utilities||"Electricity, gas, and water"}. Source: ${household?"household setup":"sample household"}.`,"Rental","Money");
  if(household?.leaseStart&&household?.leaseEnd&&/lease/.test(text)&&/end|term/.test(text))return respond(`Your household setup lists the lease term as ${formatDate(household.leaseStart)} to ${formatDate(household.leaseEnd)}. Source: Home Details; not verified against a lease.`,"Rental");
  return respond("I couldn’t find a matching entry. Try including the name of an expense, calendar event, home detail, or sample record. This is a limited preview and cannot read real documents.");
 };
 return <><div hidden={setupComplete}><SetupFlow initialHousehold={savedHousehold} returning={hasVisitedDashboard} onFinish={(value)=>{saveHousehold([value]);setHousehold(value);setHasVisitedDashboard(true);setSetupComplete(true)}} onSkip={()=>{setHasVisitedDashboard(true);setSetupComplete(true)}}/></div>{setupComplete&&<div className="shell"><aside className="sidebar"><div className="brand"><span className="brand-mark">⌂</span><div>Goodhouse<small>YOUR RENTAL, SIMPLIFIED</small></div><button className="settings-trigger" onClick={()=>setSection("Settings")} aria-label="Settings" aria-current={section==="Settings"?"page":undefined}>⚙</button></div><div className="house-label">YOUR HOUSEHOLD</div><HouseholdDropdown household={household}/><div className="nav-label">WORKSPACE</div><nav aria-label="Main navigation">{nav.map(n=><button key={n.name} className={section===n.name?"active":""} onClick={()=>{setCalendarFocus(null);setSection(n.name);setSelected(null)}}><span className="nav-icon">{n.icon}</span>{sectionLabels[n.name]}{section===n.name&&<span className="nav-dot"/>}</button>)}</nav><div className="sidebar-bottom"><div className="side-tip"><span>✳</span><b>A better way to live together.</b><p>All the details of renting, together in one place.</p></div><div className="profile"><div className="avatar">A</div><div><b>Alex Morgan</b><small>Demo account</small></div><span>⋯</span></div></div></aside><main className="main"><div className="mobile-brand"><div><span>⌂</span> Goodhouse</div><button className="settings-trigger" onClick={()=>setSection("Settings")} aria-label="Settings" aria-current={section==="Settings"?"page":undefined}>⚙</button></div><HouseholdDropdown household={household} mobile/><div className="content">
 {setupError&&<p className="custom-error" role="alert">{setupError}</p>}
 {section==="Home"&&<><Heading eyebrow="YOUR HOUSEHOLD / OVERVIEW" title={"Welcome home, " + (household?.roommateNames[0]?.split(" ")[0] || "Alex") + "."} subtitle="Everything your household needs, right where you need it."/><section className="ai-home" aria-labelledby="ai-title"><div className="ai-label"><span className="ai-icon">✳</span><span>ASK GOODHOUSE</span><span className="ai-preview">PREVIEW · NO LIVE AI</span></div><h2 id="ai-title">What can I help you <em>find?</em></h2><p>Ask about your lease, expenses, or anything around your home.</p><form className="ai-form" onSubmit={e=>{e.preventDefault();if(question.trim())ask(question)}}><label className="sr-only" htmlFor="question">Ask about your household</label><input id="question" value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask anything about your home..."/><button type="button" className="ai-clear" aria-label="Clear question and answer" title="Clear question and answer" onClick={()=>{setQuestion("");setAnswer("");setAnswerLinks([]);document.getElementById("question")?.focus()}}>⌂</button><button aria-label="Submit question">Ask <span>↗</span></button></form><div className="ai-suggestions"><span>TRY ASKING</span><button onClick={()=>ask("When is rent due?")}>When is rent due? <span>↗</span></button><button onClick={()=>ask("What does our lease say about guests?")}>What is our guest policy? <span>↗</span></button><button onClick={()=>ask("When do we need to give notice?")}>When do we need to give notice? <span>↗</span></button></div>{answer&&<div className="ai-answer" role="status"><p>{answer}</p>{answerLinks.map(link=><button className="ai-source-link" key={link} onClick={()=>{setCalendarFocus(null);setSection(link)}}>Open {sectionLabels[link]} →</button>)}</div>}<div className="ai-helper">Prepared responses can find named browser entries and fictional samples. Try “What is the sample electricity bill?” No live AI or real lease reading.</div></section><section className="home-upcoming" aria-labelledby="home-upcoming-title"><div className="home-section-heading"><div><div className="eyebrow">YOUR HOUSEHOLD</div><h2 id="home-upcoming-title">Coming up</h2></div><button className="home-view-all" onClick={()=>{setCalendarFocus(null);setSection("Schedule")}}>View calendar <span aria-hidden="true">→</span></button></div><UpcomingEvents onNavigate={(next)=>{setCalendarFocus(null);setSection(next)}} onOpenEvent={(event,date)=>{setCalendarFocus({event,date});setSection("Schedule")}}/></section><div className="home-setup"><div><strong>Household setup</strong><span>Completed setup is saved on this browser.</span></div><button onClick={()=>setSetupComplete(false)}>Return to setup <span aria-hidden="true">→</span></button></div></>}
 {section==="Schedule"&&<SchedulePreview roommates={household?.roommateNames} focusEvent={calendarFocus} onExpenses={()=>setSection("Money")}/>}
 {section==="Rental"&&<><Heading eyebrow="YOUR HOUSEHOLD / HOME DETAILS" title="Lease & home details." subtitle="Find your lease information, landlord contact, and household details here."/><div className="detail-grid"><section className="panel full-panel"><div className="eyebrow">THE PLACE YOU CALL HOME</div><h3>{household?.homeName||"Maple House"}</h3><p className="muted">{household?.neighborhood||"Downtown"}, San Luis Obispo, CA</p><div className="details"><div><span>LEASE TERM</span><b>{household?formatDate(household.leaseStart)+" – "+formatDate(household.leaseEnd):"Jan 1 – Dec 31"}</b></div><div><span>MONTHLY RENT</span><b>${Number(household?.rent||5000).toLocaleString()} total</b></div><div><span>SECURITY DEPOSIT</span><b>${Number(household?.deposit||2550).toLocaleString()}</b></div><div><span>ROOMMATES</span><b>{household?.roommateCount||3} people</b></div></div><div className="notice"><b>Sample lease information</b><p>Your setup answers appear here for this session. Lease review is a fictional preview, and legal resources are limited to the linked California and SLO sources.</p></div></section><section className="panel full-panel"><div className="eyebrow">GOOD TO HAVE HANDY</div><h3>Household information</h3><button className="rental-setup-link" onClick={()=>setSetupComplete(false)}>Return to household setup →</button><div className="info-row"><span>Landlord contact</span><b>jordan@example.com</b></div><div className="info-row"><span>Wi-Fi network</span><b>MapleHouse_WiFi</b></div><div className="info-row"><span>Trash day</span><b>Tuesday morning</b></div><div className="info-row"><span>Utilities</span><b>{household?.utilities||"Electricity, gas, and water"}</b></div></section></div><HomeInformation/></>}
 {section==="Money"&&<Expenses roommates={household?.roommateNames?.filter(Boolean).length?household.roommateNames:["Alex Morgan", "John Smith", "Jane Doe"]}/>}
 {section==="Records"&&<Records/>}
 {section==="Settings"&&<><Heading eyebrow="YOUR HOUSEHOLD / SETTINGS" title="Settings." subtitle="Manage your household and understand how this demo works."/><AccountSettings/><InvitePreview householdName={household?.homeName||"Maple House"}/><section className="panel full-panel settings-panel" aria-labelledby="settings-household"><div className="eyebrow">YOUR HOUSEHOLD</div><h3 id="settings-household">Household setup</h3><p className="settings-description">Return to your move-in setup to continue or update your household details.</p><div className="settings-details"><div><span>HOUSEHOLD NAME</span><strong>{household?.homeName||"Maple House (sample)"}</strong></div><div><span>ROOMMATES</span><strong>{household ? `${household.roommateCount} people` : "3 people (sample)"}</strong><small>{household ? household.roommateNames.filter(Boolean).join(", ") || "No names added" : "Alex Morgan, John Smith, Jane Doe (sample)"}</small></div></div><button className="settings-primary" onClick={()=>setSetupComplete(false)}>Return to setup <span aria-hidden="true">→</span></button></section><section className="panel full-panel settings-panel" aria-labelledby="settings-about"><div className="eyebrow">GOODHOUSE PREVIEW</div><h3 id="settings-about">About this demo</h3><p className="settings-description">Completed setup, calendar entries, and extra home details are saved on this browser, not shared. Unfinished setup resets on refresh. The dashboard assistant and shared storage are not connected.</p></section></>}

 <footer>MADE FOR THE PLACE YOU CALL HOME <span>✳</span> <b>Demo · Custom entries stay on this browser</b></footer></div></main><nav className="mobile-nav" aria-label="Mobile navigation">{mobileNav.map(n=><button key={n.name} className={section===n.name?"active":""} onClick={()=>{setCalendarFocus(null);setSection(n.name);setSelected(null)}}><span>{n.icon}</span>{sectionLabels[n.name]}</button>)}</nav></div>}</>
}
export default function App() {
 const {items,ready,error,save}=useBrowserItems<Household>("goodhouse-household-v1");
 const [defaultsReady,setDefaultsReady]=useState(false);
 useEffect(()=>{
  if(!ready)return;
  try {
   const marker="goodhouse-demo-defaults-20261115";
   if(!window.localStorage.getItem(marker)){
    const current=items[0];
    if(current){const updated={...current,rent:current.rent==="2550"?"5000":current.rent,utilities:current.utilities==="Electricity and internet"?"Electricity, gas, and water":current.utilities};if((updated.rent!==current.rent||updated.utilities!==current.utilities)&&!save([updated,...items.slice(1)])){setDefaultsReady(true);return;}}
    window.localStorage.setItem(marker,"1");
   }
  } catch { /* Existing browser storage errors are shown by useBrowserItems. */ }
  setDefaultsReady(true);
 },[ready,items,save]);
 if(!ready||!defaultsReady)return <main className="setup-page"><p className="custom-help">Loading your household…</p></main>;
 const saved=items[0] ? {...items[0],roommateNames:items[0].roommateNames.map(name=>name==="Roommate 2"?"John Smith":name==="Roommate 3"?"Jane Doe":name)} : null;
 return <AppContent savedHousehold={saved} saveHousehold={save} setupError={error}/>;
}
