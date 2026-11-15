"use client";

import { useState, type FormEvent } from "react";
import { newId, useBrowserItems, type HomeInfo } from "./browser-data";
import "./customization.css";

export default function HomeInformation() {
 const {items,ready,error,save}=useBrowserItems<HomeInfo>("goodhouse-home-info-v1");
 const [editing,setEditing]=useState<string|null>(null);
 const [open,setOpen]=useState(false);
 const [label,setLabel]=useState("");
 const [note,setNote]=useState("");
 const [formError,setFormError]=useState("");
 const [deleteId,setDeleteId]=useState<string|null>(null);
 function start(item?:HomeInfo) { setEditing(item?.id??null);setLabel(item?.label??"");setNote(item?.note??"");setFormError("");setOpen(true); }
 function submit(event:FormEvent<HTMLFormElement>) { event.preventDefault(); const trimmedLabel=label.trim(), trimmedNote=note.trim(); if(!trimmedLabel||!trimmedNote){setFormError("Enter a label and information.");return;} const item={id:editing??newId(),label:trimmedLabel,note:trimmedNote}; const next=editing?items.map(old=>old.id===editing?item:old):[...items,item]; if(save(next)){setOpen(false);setEditing(null);} }
 function remove(item:HomeInfo) { if(save(items.filter(current=>current.id!==item.id)))setDeleteId(null); }
 return <section className="panel full-panel custom-info" aria-labelledby="custom-info-heading"><div className="custom-section-head"><div><div className="eyebrow">MAKE IT YOURS</div><h3 id="custom-info-heading">Additional home details</h3></div><button className="custom-primary" onClick={()=>start()} disabled={!ready}>+ Add information</button></div><p className="custom-help">Saved only in this browser, not shared with roommates. Avoid storing passwords or sensitive information.</p>{error&&<p className="custom-error" role="alert">{error}</p>}
 {open&&<form className="custom-form" onSubmit={submit}><h4>{editing?"Edit information":"Add information"}</h4><label>Label<input required maxLength={80} value={label} onChange={e=>setLabel(e.target.value)} placeholder="e.g. Parking instructions" /></label><label>Information<textarea required maxLength={1000} value={note} onChange={e=>setNote(e.target.value)} placeholder="Add a helpful note" rows={3}/></label>{formError&&<p className="custom-error" role="alert">{formError}</p>}<div className="custom-form-actions"><button type="submit" className="custom-primary">Save information</button><button type="button" className="custom-secondary" onClick={()=>setOpen(false)}>Cancel</button></div></form>}
 {items.length>0?<div className="custom-info-list">{items.map(item=><article className="custom-info-item" key={item.id}><div><strong>{item.label}</strong><p>{item.note}</p><small>Saved in this browser</small></div><div className="custom-item-actions"><button onClick={()=>start(item)} aria-label={`Edit ${item.label}`}>Edit</button>{deleteId===item.id?<><span className="custom-confirm">Delete this entry?</span><button onClick={()=>remove(item)} aria-label={`Confirm delete ${item.label}`}>Confirm delete</button><button onClick={()=>setDeleteId(null)}>Cancel</button></>:<button onClick={()=>setDeleteId(item.id)} aria-label={`Delete ${item.label}`}>Delete</button>}</div></article>)}</div>:<p className="custom-empty">No custom details yet. Add the information your household needs.</p>}
 </section>;
}
