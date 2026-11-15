"use client";
import { useState } from "react";
import { sampleRecords } from "./sample-records";

export default function Records() {
 const [search,setSearch]=useState(""); const [selected,setSelected]=useState<string|null>(null); const [message,setMessage]=useState(false);
 const filtered=sampleRecords.filter(item=>`${item.name} ${item.category} ${item.note} ${item.type}`.toLowerCase().includes(search.trim().toLowerCase()));
 const record=sampleRecords.find(item=>item.id===selected);
 return <>
  <header className="page-heading"><div><div className="eyebrow">YOUR HOUSEHOLD / RECORDS</div><h1>Records.</h1><p>Important household documents, PDFs, and photos, together.</p></div><div className="demo-pill"><span/> Sample records</div></header>
  <div className="page-intro"><span>✳</span><p>These examples show how records could be organized. Uploading, file storage, and sharing are not connected. Condition records do not guarantee a deposit return.</p></div>
  <section className="panel full-panel"><div className="records-toolbar"><label>Search records<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search sample records" type="search"/></label><button className="custom-primary" onClick={()=>setMessage(!message)}>+ Add record</button></div>{message&&<p className="custom-help" role="status">File upload and private or household sharing choices are coming later. No file is uploaded in this demo.</p>}
  {(["Lease & rental","Bills & receipts","Photos & condition"] as const).map(category=>{const items=filtered.filter(item=>item.category===category);if(!items.length)return null;return <div className="records-group" key={category}><div className="custom-section-head"><h3>{category}</h3><span className="count-pill">SAMPLE</span></div><div className="records-list">{items.map(item=><button className="records-item" key={item.id} onClick={()=>setSelected(item.id)}><span className={`records-file-icon ${item.type.includes("photo")?"sage":"peach"}`} aria-hidden="true">{item.type.includes("photo")?"▧":"▤"}</span><span className="records-item-copy"><b>{item.name}</b><small>{item.type} · {item.date}</small><small>{item.note}</small></span><span aria-hidden="true">→</span></button>)}</div></div>})}
  {!filtered.length&&<p className="custom-empty">No sample records match your search.</p>}
  {record&&<aside className="records-preview" aria-label="Sample record preview"><div className="custom-section-head"><div><div className="eyebrow">{record.type.toUpperCase()} · {record.date}</div><h3>{record.name}</h3></div><button className="custom-secondary" onClick={()=>setSelected(null)}>Close preview</button></div>{record.type.includes("photo")&&<div className="records-photo-example" aria-label="Illustrated placeholder for a sample photo">⌂ <span>Sample photo illustration</span></div>}<p>{record.preview}</p><p className="custom-help">Fictional preview, not a stored or uploaded file.</p></aside>}
  </section>
 </>;
}
