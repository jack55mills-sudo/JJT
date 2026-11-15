"use client";

import { useMemo, useState } from "react";
import "./schedule-preview.css";

type HouseholdEvent = { id: string; date: string; title: string; category: string; detail: string; owner: string; householdWide: boolean; note: string; tone: string };
const sampleEvents: HouseholdEvent[] = [
  {id:"rent",date:"2026-09-01",title:"September rent",category:"PAYMENT",detail:"Your share · $850",owner:"Everyone",householdWide:true,note:"The sample household’s rent is $2,550, divided equally between three roommates.",tone:"peach"},
  {id:"electric",date:"2026-09-04",title:"Electricity bill",category:"BILL",detail:"Your share · $36.40",owner:"Everyone",householdWide:true,note:"A sample shared utility bill for the household.",tone:"yellow"},
  {id:"repair",date:"2026-09-12",title:"Kitchen sink maintenance",category:"MAINTENANCE",detail:"10:00 AM · Kitchen",owner:"Alex",householdWide:false,note:"Alex is the contact for this sample maintenance visit.",tone:"sage"},
  {id:"notice",date:"2026-11-01",title:"Move-out notice",category:"LEASE",detail:"Review your lease terms",owner:"Everyone",householdWide:true,note:"Sample reminder only. Check the original lease and confirm applicable dates before taking action.",tone:"lavender"},
];
const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const weekdays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
function parseDate(date: string) { const [y,m,d]=date.split("-").map(Number); return new Date(y,m-1,d); }
function dateKey(year: number, month: number, day: number) { return `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`; }
function longDate(date: string) { return parseDate(date).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"}); }

export default function SchedulePreview() {
  const [view,setView]=useState<"upcoming"|"month">("upcoming");
  const [filter,setFilter]=useState<"everyone"|"me">("everyone");
  const [monthDate,setMonthDate]=useState(new Date(2026,8,1));
  const [selectedDay,setSelectedDay]=useState("2026-09-01");
  const [selectedEvent,setSelectedEvent]=useState<HouseholdEvent | null>(null);
  const visibleEvents=useMemo(()=>sampleEvents.filter(event=>filter==="everyone" || event.householdWide || event.owner==="Alex"),[filter]);
  const year=monthDate.getFullYear(), month=monthDate.getMonth();
  const firstDay=new Date(year,month,1).getDay(), daysInMonth=new Date(year,month+1,0).getDate();
  const days=Array.from({length:Math.ceil((firstDay+daysInMonth)/7)*7},(_,i)=>i-firstDay+1);
  function changeMonth(amount:number) { const next=new Date(year,month+amount,1); setMonthDate(next); setSelectedDay(dateKey(next.getFullYear(),next.getMonth(),1)); setSelectedEvent(null); }
  const selectedEvents=visibleEvents.filter(event=>event.date===selectedDay);
  return <div className="schedule-preview">
    <div className="schedule-heading"><div><div className="eyebrow">YOUR HOUSEHOLD / SCHEDULE</div><h1>Your schedule.</h1><p>All the important things, right where you need them.</p></div><span className="demo-pill"><span/> Sample household</span></div>
    <div className="schedule-toolbar"><div className="schedule-filters" aria-label="Show events"><button className={filter==="everyone"?"selected":""} onClick={()=>{setFilter("everyone");setSelectedEvent(null)}} aria-pressed={filter==="everyone"}>Everyone</button><button className={filter==="me"?"selected":""} onClick={()=>{setFilter("me");setSelectedEvent(null)}} aria-pressed={filter==="me"}>For me</button></div><span className="schedule-sample">✳ SAMPLE EVENTS · PREVIEW</span></div>
    <div className="schedule-next"><div className="schedule-next-icon">↗</div><div className="schedule-next-copy"><span>NEXT IN THIS SAMPLE</span><strong>September rent</strong><small>September 1 · Your share $850</small></div><button onClick={()=>setSelectedEvent(sampleEvents[0])}>View details <span>↗</span></button></div>
    <section className="schedule-card"><div className="schedule-card-head"><div><div className="eyebrow">A LITTLE LESS TO REMEMBER</div><h2>What’s happening</h2></div><span className="schedule-subtitle">Your household, in one place</span></div>
      <div className="schedule-view-row"><div className="schedule-views" aria-label="Schedule views"><button onClick={()=>setView("upcoming")} className={view==="upcoming"?"active":""} aria-pressed={view==="upcoming"}>Upcoming</button><button onClick={()=>setView("month")} className={view==="month"?"active":""} aria-pressed={view==="month"}>Month</button></div><span className="schedule-future">Day · Week · Year coming later</span></div>
      {view==="upcoming" ? <div className="schedule-list">{visibleEvents.map((event,index)=>{const date=parseDate(event.date);return <div className="schedule-list-wrap" key={event.id}>{(index===0||event.date.slice(0,7)!==visibleEvents[index-1].date.slice(0,7))&&<div className="schedule-month-label">{months[date.getMonth()]} {date.getFullYear()}</div>}<button className="schedule-event" onClick={()=>setSelectedEvent(event)}><span className={`schedule-event-date ${event.tone}`}><small>{weekdays[date.getDay()].toUpperCase()}</small><b>{String(date.getDate()).padStart(2,"0")}</b></span><span className="schedule-event-copy"><strong>{event.title}</strong><small>{event.detail}</small></span><span className="schedule-category">{event.category}</span><span className="schedule-arrow">↗</span></button></div>})}</div> : <div className="schedule-calendar"><div className="calendar-controls"><div><span className="calendar-month">{months[month]} {year}</span><span className="calendar-sample">Sample calendar</span></div><div className="calendar-arrows"><button aria-label="Previous month" onClick={()=>changeMonth(-1)}>‹</button><button aria-label="Next month" onClick={()=>changeMonth(1)}>›</button></div></div><div className="calendar-grid" role="grid" aria-label={`${months[month]} ${year}`}>{weekdays.map(day=><div className="calendar-weekday" key={day}>{day}</div>)}{days.map((day,i)=>{if(day<1||day>daysInMonth)return <div className="calendar-empty" key={`empty-${i}`}/>;const key=dateKey(year,month,day); const dayEvents=visibleEvents.filter(e=>e.date===key);const count=dayEvents.length;return <button key={key} className={`calendar-day ${selectedDay===key?"selected":""}`} onClick={()=>{setSelectedDay(key);setSelectedEvent(null)}} aria-label={`${months[month]} ${day}, ${year}${count?`, ${count} event${count===1?"":"s"}`:""}`} aria-pressed={selectedDay===key}><span>{day}</span>{count>0&&<><i aria-hidden="true"/><span className="calendar-event-labels" aria-hidden="true">{dayEvents.map(event=><span className={`calendar-event-label ${event.tone}`} key={event.id}>{event.title}</span>)}</span></>}</button>})}</div><div className="selected-day"><div className="eyebrow">{longDate(selectedDay).toUpperCase()}</div>{selectedEvents.length?selectedEvents.map(event=><button className="schedule-event" key={event.id} onClick={()=>setSelectedEvent(event)}><span className={`schedule-event-date ${event.tone}`}>✳</span><span className="schedule-event-copy"><strong>{event.title}</strong><small>{event.detail}</small></span><span className="schedule-category">{event.category}</span><span className="schedule-arrow">↗</span></button>):<p className="calendar-empty-message">No sample events on this day.</p>}</div></div>}
    </section>
    {selectedEvent&&<section className="schedule-detail" aria-label="Event details"><div className="schedule-detail-head"><div><div className="eyebrow">{selectedEvent.category} · SAMPLE EVENT</div><h2>{selectedEvent.title}</h2></div><button onClick={()=>setSelectedEvent(null)} aria-label="Close event details">×</button></div><div className="schedule-detail-grid"><div><span>WHEN</span><strong>{longDate(selectedEvent.date)}</strong></div><div><span>FOR</span><strong>{selectedEvent.owner}</strong></div></div><p>{selectedEvent.note}</p><small>This is a design preview. Events are fictional and cannot be edited or saved yet.</small></section>}
    <p className="schedule-footnote">A preview for exploring the design. Events and dates are fictional.</p>
  </div>;
}
