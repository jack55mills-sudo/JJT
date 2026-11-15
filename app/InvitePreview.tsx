"use client";

import { useState } from "react";

export default function InvitePreview({ householdName }: { householdName:string }) {
 const [open,setOpen]=useState(false);
 const [email,setEmail]=useState("");
 const [recipient,setRecipient]=useState("");
 return <section className="panel full-panel settings-panel" aria-labelledby="invite-title">
  <div className="eyebrow">LIVING TOGETHER</div><h3 id="invite-title">Invite roommates</h3>
  <p className="settings-description">See how inviting someone to {householdName} could work.</p>
  <button type="button" className="settings-primary invite-trigger" aria-expanded={open} onClick={()=>{setOpen(!open);setRecipient("")}}>{open?"Close invitation preview":"Invite a roommate"}</button>
  {open&&<div className="invite-preview"><p><strong>Preview only.</strong> Invitations and shared household access are not connected yet. No email will be sent.</p><form className="account-form" onSubmit={e=>{e.preventDefault();setRecipient(email.trim())}}><label>Roommate’s email<input type="email" required value={email} onChange={e=>{setEmail(e.target.value);setRecipient("")}} placeholder="roommate@example.com" /></label><button className="custom-secondary" type="submit">Preview invitation</button></form>{recipient&&<div className="invite-example" role="status"><b>Example invitation to {recipient}</b><p>You’re invited to join {householdName} on goodhouse.</p><small>Example only · no invitation or join link was sent.</small></div>}</div>}
 </section>;
}
