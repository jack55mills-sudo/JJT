"use client";

import { useMemo, useState, type FormEvent } from "react";
import { newId, useBrowserItems, type CustomEvent, type Repeat } from "./browser-data";
import { EXPENSE_KEY, money, type Expense } from "./Expenses";
import { expenseOccurrences } from "./expense-schedule";
import "./schedule-preview.css";
import "./customization.css";

type HouseholdEvent = { id: string; date: string; title: string; category: string; detail: string; owner: string; householdWide: boolean; note: string; tone: string; custom?: CustomEvent; expense?: boolean; expenseShares?:Record<string,number>; expenseTotal?:number; expenseSeries?:string };
const sampleEvents: HouseholdEvent[] = [
  {id:"rent",date:"2026-09-01",title:"September rent",category:"PAYMENT",detail:"Your share · $850",owner:"Everyone",householdWide:true,note:"The sample household’s rent is $2,550, divided equally between three roommates.",tone:"peach"},
  {id:"electric",date:"2026-09-04",title:"Electricity bill",category:"BILL",detail:"Your share · $36.40",owner:"Everyone",householdWide:true,note:"A sample shared utility bill for the household.",tone:"yellow"},
  {id:"repair",date:"2026-09-12",title:"Kitchen sink maintenance",category:"MAINTENANCE",detail:"10:00 AM · Kitchen",owner:"Alex",householdWide:false,note:"Alex is the contact for this sample maintenance visit.",tone:"sage"},
  {id:"notice",date:"2026-11-01",title:"Move-out notice",category:"LEASE",detail:"Review your lease terms",owner:"Everyone",householdWide:true,note:"Sample reminder only. Check the original lease and confirm applicable dates before taking action.",tone:"lavender"},
];
const months=["January","February","March","April","May","June","July","August","September","October","November","December"];
const weekdays=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
function parseDate(value:string){const [y,m,d]=value.split("-").map(Number);return new Date(y,m-1,d);}
function dateKey(year:number,month:number,day:number){return `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;}
function dateString(date:Date){return dateKey(date.getFullYear(),date.getMonth(),date.getDate());}
function longDate(value:string){return parseDate(value).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});}
function matchesDate(event:CustomEvent, date:string){
 if(date<event.date)return false;
 if(event.repeat==="once")return date===event.date;
 const [sy,sm,sd]=event.date.split("-").map(Number),[y,m,d]=date.split("-").map(Number);
 if(event.repeat==="weekly")return (Date.UTC(y,m-1,d)-Date.UTC(sy,sm-1,sd))%604800000===0;
 return d===Math.min(sd,new Date(y,m,0).getDate());
}
function occurrence(event:CustomEvent,date:string):HouseholdEvent{return {id:`${event.id}:${date}`,date,title:event.title,category:event.kind==="chore"?"CHORE":"EVENT",detail:`${event.owner} · ${event.repeat==="once"?"One time":event.repeat==="weekly"?"Weekly":"Monthly"}`,owner:event.owner,householdWide:event.owner==="Everyone",note:event.repeat==="once"?"One-time event.":`Repeats ${event.repeat}. Editing or deleting affects the whole series.`,tone:event.kind==="chore"?"sage":"lavender",custom:event};}
function occurrencesBetween(event:CustomEvent,from:Date,to:Date,limit=1000){const result:HouseholdEvent[]=[];const day=new Date(from.getFullYear(),from.getMonth(),from.getDate());while(day<=to&&result.length<limit){const key=dateString(day);if(matchesDate(event,key))result.push(occurrence(event,key));day.setDate(day.getDate()+1);}return result;}

export function getUpcomingCustomEvents(items:CustomEvent[], now=new Date()):HouseholdEvent[]{
 const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
 const end=new Date(today.getFullYear()+1,today.getMonth(),today.getDate());
 return items.filter(item=>item.kind==="event").flatMap(item=>{
  if(item.repeat==="once")return item.date>=dateString(today)?[occurrence(item,item.date)]:[];
  const start=parseDate(item.date)>today?parseDate(item.date):today;
  const through=start>end?new Date(start.getFullYear()+1,start.getMonth(),start.getDate()):end;
  return occurrencesBetween(item,start,through,1);
 }).sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title));
}

export default function SchedulePreview({roommates=["Alex Morgan","John Smith","Jane Doe"], focusEvent, onExpenses}:{roommates?:string[];focusEvent?:{event:CustomEvent;date:string}|null;onExpenses?:()=>void}) {
 const {items,ready,error,save}=useBrowserItems<CustomEvent>("goodhouse-calendar-v1");
 const {items:expenses}=useBrowserItems<Expense>(EXPENSE_KEY);

 const people=roommates.map(name=>name.trim()).filter(Boolean);
 const [view,setView]=useState<"upcoming"|"month">(focusEvent?"month":"upcoming");
 const [filter,setFilter]=useState<"everyone"|"me">("everyone");
 const [monthDate,setMonthDate]=useState(()=>focusEvent?parseDate(focusEvent.date):new Date());
 const [selectedDay,setSelectedDay]=useState(focusEvent?.date??dateString(new Date()));
 const [selectedEvent,setSelectedEvent]=useState<HouseholdEvent|null>(()=>focusEvent?occurrence(focusEvent.event,focusEvent.date):null);
 const [formOpen,setFormOpen]=useState(false);
 const [editing,setEditing]=useState<string|null>(null);
 const [title,setTitle]=useState("");
 const [kind,setKind]=useState<"event"|"chore">("event");
 const [date,setDate]=useState("");
 const [owner,setOwner]=useState("Everyone");
 const [repeat,setRepeat]=useState<Repeat>("once");
 const [formError,setFormError]=useState("");
 const [confirmDelete,setConfirmDelete]=useState(false);
 const year=monthDate.getFullYear(),month=monthDate.getMonth();
 const today=new Date(), monthStart=dateString(new Date(year,month,1)), monthEnd=dateString(new Date(year,month+1,0));
 const todayKey=dateString(today), nextYear=dateString(new Date(today.getFullYear()+1,today.getMonth(),today.getDate()));
 const from=monthStart<todayKey?monthStart:todayKey, through=monthEnd>nextYear?monthEnd:nextYear;
 const expenseEvents:HouseholdEvent[]=expenseOccurrences(expenses,from,through).map(({expense:e,date,projected})=>({id:`expense:${e.id}:${date}`,date,title:e.name,category:"BILL",detail:`${money(e.total)} · ${projected?"Estimated":"Due"}`,owner:"Everyone",householdWide:true,note:projected?"Monthly estimate based on the original expense. Open Expenses to create and review this month’s actual bill before recording payments.":"Expense saved in this browser. Open Expenses to record payments.",tone:"peach",expense:true,expenseShares:e.shares,expenseTotal:e.total,expenseSeries:e.seriesId||e.id}));
 const firstDay=new Date(year,month,1).getDay(),daysInMonth=new Date(year,month+1,0).getDate();
 const days=Array.from({length:Math.ceil((firstDay+daysInMonth)/7)*7},(_,i)=>i-firstDay+1);
 const visible=(event:HouseholdEvent)=>filter==="everyone"||event.householdWide||event.owner===people[0]||(!people.length&&event.owner==="Alex");
 const upcoming=useMemo(()=>{const seen=new Set<string>();const bills=expenseEvents.filter(e=>{if(e.date<todayKey)return false; const series=e.expenseSeries||e.id;if(seen.has(series))return false;seen.add(series);return true;});return [...sampleEvents.filter(e=>e.date>=todayKey),...bills,...getUpcomingCustomEvents(items)].sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title));},[items,expenses,year,month]);
 const calendarEvents=useMemo(()=>[...sampleEvents.filter(e=>parseDate(e.date).getFullYear()===year&&parseDate(e.date).getMonth()===month),...items.flatMap(item=>occurrencesBetween(item,new Date(year,month,1),new Date(year,month+1,0))),...expenseEvents.filter(e=>parseDate(e.date).getFullYear()===year&&parseDate(e.date).getMonth()===month)],[items,expenses,year,month]);
 const visibleUpcoming=upcoming.filter(visible),visibleCalendar=calendarEvents.filter(visible);
 const selectedEvents=visibleCalendar.filter(event=>event.date===selectedDay);
 function changeMonth(amount:number){const next=new Date(year,month+amount,1);setMonthDate(next);setSelectedDay(dateKey(next.getFullYear(),next.getMonth(),1));setSelectedEvent(null);}
 function openForm(item?:CustomEvent){setConfirmDelete(false);setEditing(item?.id??null);setTitle(item?.title??"");setKind(item?.kind??"event");setDate(item?.date??dateString(new Date()));setOwner(item?.owner??"Everyone");setRepeat(item?.repeat??"once");setFormError("");setFormOpen(true);}
 function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!title.trim()||!date){setFormError("Enter a name and date.");return;}const item:CustomEvent={id:editing??newId(),title:title.trim(),kind,date,owner,repeat};const next=editing?items.map(old=>old.id===editing?item:old):[...items,item];if(save(next)){const d=parseDate(date);setMonthDate(new Date(d.getFullYear(),d.getMonth(),1));setSelectedDay(date);setSelectedEvent(occurrence(item,date));if(item.kind==="chore")setView("month");setFormOpen(false);}}
 function remove(item:CustomEvent){if(save(items.filter(current=>current.id!==item.id))){setSelectedEvent(null);setConfirmDelete(false);}}
 return <div className="schedule-preview">
  <div className="schedule-heading"><div><div className="eyebrow">YOUR HOUSEHOLD / CALENDAR</div><h1>Your calendar.</h1><p>All the important things, right where you need them.</p></div><span className="demo-pill"><span/> Sample household</span></div>
  <div className="custom-section-head calendar-add"><p className="custom-help">Your entries are saved only in this browser and are not shared with roommates.</p><button className="custom-primary" onClick={()=>openForm()} disabled={!ready}>+ Add event or chore</button></div>
  {error&&<p className="custom-error" role="alert">{error}</p>}
  {formOpen&&<form className="custom-form calendar-form" onSubmit={submit}><h2>{editing?"Edit event or chore":"Add event or chore"}</h2><label>Name<input required maxLength={100} value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Clean the bathroom"/></label><div className="custom-fields"><label>Type<select value={kind} onChange={e=>setKind(e.target.value as "event"|"chore")}><option value="event">Event</option><option value="chore">Chore</option></select></label><label>Date<input type="date" required value={date} onChange={e=>setDate(e.target.value)}/></label><label>Assigned to<select value={owner} onChange={e=>setOwner(e.target.value)}><option value="Everyone">Everyone</option>{people.filter(name=>name!=="Everyone").map((name,index)=><option key={`${name}-${index}`} value={name}>{name}</option>)}{owner!=="Everyone"&&!people.includes(owner)&&<option value={owner}>{owner}</option>}</select></label><label>Repeat<select value={repeat} onChange={e=>setRepeat(e.target.value as Repeat)}><option value="once">Does not repeat</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label></div>{repeat==="monthly"&&<p className="custom-help">If a month is shorter than the selected day, it repeats on that month’s last day.</p>}{editing&&repeat!=="once"&&<p className="custom-help">Changes apply to the entire series.</p>}{formError&&<p className="custom-error" role="alert">{formError}</p>}<div className="custom-form-actions"><button type="submit" className="custom-primary">Save {kind}</button><button type="button" className="custom-secondary" onClick={()=>setFormOpen(false)}>Cancel</button></div></form>}
  <div className="schedule-toolbar"><div className="schedule-filters" aria-label="Show events"><button className={filter==="everyone"?"selected":""} onClick={()=>{setFilter("everyone");setSelectedEvent(null)}} aria-pressed={filter==="everyone"}>Everyone</button><button className={filter==="me"?"selected":""} onClick={()=>{setFilter("me");setSelectedEvent(null)}} aria-pressed={filter==="me"}>For me</button></div><span className="schedule-sample">✳ SAMPLE &amp; BROWSER ENTRIES</span></div><p className="custom-help">“For me” uses the first roommate in the current setup; the first name is used as a preview identity.</p>
  <section className="schedule-card"><div className="schedule-card-head"><div><div className="eyebrow">A LITTLE LESS TO REMEMBER</div><h2>What’s happening</h2></div><span className="schedule-subtitle">Your household, in one place</span></div><div className="schedule-view-row"><div className="schedule-views" aria-label="Schedule views"><button onClick={()=>{setView("upcoming");setSelectedEvent(null)}} className={view==="upcoming"?"active":""} aria-pressed={view==="upcoming"}>Upcoming</button><button onClick={()=>{setView("month");setSelectedEvent(null)}} className={view==="month"?"active":""} aria-pressed={view==="month"}>Month</button></div><span className="schedule-future">Day · Week · Year coming later</span></div>
  {view==="upcoming"?<div className="schedule-list">{visibleUpcoming.map((event,index)=>{const day=parseDate(event.date);return <div className="schedule-list-wrap" key={event.id}>{(index===0||event.date.slice(0,7)!==visibleUpcoming[index-1].date.slice(0,7))&&<div className="schedule-month-label">{months[day.getMonth()]} {day.getFullYear()}</div>}<button className="schedule-event" onClick={()=>{setConfirmDelete(false);setSelectedEvent(event)}}><span className={`schedule-event-date ${event.tone}`}><small>{weekdays[day.getDay()].toUpperCase()}</small><b>{String(day.getDate()).padStart(2,"0")}</b></span><span className="schedule-event-copy"><strong>{event.title}</strong><small>{event.detail} · {event.custom||event.expense?"This browser":"Sample"}</small></span><span className="schedule-category">{event.category}</span><span className="schedule-arrow">↗</span></button></div>})}{!visibleUpcoming.length&&<p className="calendar-empty-message">No events to show.</p>}<p className="custom-help">Upcoming shows events once. Chores and all repeating dates are shown in Month view.</p></div>:<div className="schedule-calendar"><div className="calendar-controls"><div><span className="calendar-month">{months[month]} {year}</span></div><div className="calendar-arrows"><button aria-label="Previous month" onClick={()=>changeMonth(-1)}>‹</button><button aria-label="Next month" onClick={()=>changeMonth(1)}>›</button></div></div><div className="calendar-grid" role="grid" aria-label={`${months[month]} ${year}`}>{weekdays.map(day=><div className="calendar-weekday" key={day}>{day}</div>)}{days.map((day,i)=>{if(day<1||day>daysInMonth)return <div className="calendar-empty" key={`empty-${i}`}/>;const key=dateKey(year,month,day),dayEvents=visibleCalendar.filter(e=>e.date===key),count=dayEvents.length;return <button key={key} className={`calendar-day ${selectedDay===key?"selected":""}`} onClick={()=>{setSelectedDay(key);setSelectedEvent(null)}} aria-label={`${months[month]} ${day}, ${year}${count?`, ${count} event${count===1?"":"s"}`:""}`} aria-pressed={selectedDay===key}><span>{day}</span>{count>0&&<><i aria-hidden="true"/><span className="calendar-event-labels" aria-hidden="true">{dayEvents.map(event=><span className={`calendar-event-label ${event.tone}`} key={event.id}>{event.title}</span>)}</span></>}</button>})}</div><div className="selected-day"><div className="eyebrow">{longDate(selectedDay).toUpperCase()}</div>{selectedEvents.length?selectedEvents.map(event=><button className="schedule-event" key={event.id} onClick={()=>{setConfirmDelete(false);setSelectedEvent(event)}}><span className={`schedule-event-date ${event.tone}`}>✳</span><span className="schedule-event-copy"><strong>{event.title}</strong><small>{event.detail} · {event.custom||event.expense?"This browser":"Sample"}</small></span><span className="schedule-category">{event.category}</span><span className="schedule-arrow">↗</span></button>):<p className="calendar-empty-message">No events on this day.</p>}</div></div>}</section>
  {selectedEvent&&<section className="schedule-detail" aria-label="Event details"><div className="schedule-detail-head"><div><div className="eyebrow">{selectedEvent.category} · {selectedEvent.custom||selectedEvent.expense?"SAVED IN THIS BROWSER":"SAMPLE EVENT"}</div><h2>{selectedEvent.title}</h2></div><button onClick={()=>setSelectedEvent(null)} aria-label="Close event details">×</button></div><div className="schedule-detail-grid"><div><span>WHEN</span><strong>{longDate(selectedEvent.date)}</strong></div><div><span>FOR</span><strong>{selectedEvent.owner}</strong></div>{selectedEvent.expenseTotal!==undefined&&<div><span>TOTAL</span><strong>{money(selectedEvent.expenseTotal)}</strong></div>}</div><p>{selectedEvent.note}</p>{selectedEvent.expenseShares&&<div className="schedule-detail-grid"><div><span>AGREED SHARES</span>{Object.entries(selectedEvent.expenseShares).map(([name,cents])=><strong key={name}>{name}: {money(cents)}</strong>)}</div></div>}{selectedEvent.custom?<div className="custom-item-actions"><button onClick={()=>openForm(selectedEvent.custom)}>Edit</button>{confirmDelete?<><span className="custom-confirm">Delete {selectedEvent.custom.repeat!=="once"?"the entire series":"this event"}?</span><button onClick={()=>remove(selectedEvent.custom!)}>Confirm delete</button><button onClick={()=>setConfirmDelete(false)}>Cancel</button></>:<button onClick={()=>setConfirmDelete(true)}>Delete</button>}</div>:selectedEvent.expense?<button className="custom-secondary" onClick={onExpenses}>Open Expenses</button>:<small>This is a fictional sample event.</small>}</section>}
 </div>;
}
