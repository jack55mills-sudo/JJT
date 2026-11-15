"use client";

import { useState, type FormEvent } from "react";

export type Household = {
  homeName: string;
  neighborhood: string;
  moveIn: string;
  leaseStart: string;
  leaseEnd: string;
  rent: string;
  deposit: string;
  roommateCount: string;
  roommateNames: string[];
  utilities: string;
};

const defaultHousehold: Household = {
  homeName: "Maple House",
  neighborhood: "Downtown",
  moveIn: "2027-01-01",
  leaseStart: "2027-01-01",
  leaseEnd: "2027-12-31",
  rent: "5000",
  deposit: "2550",
  roommateCount: "3",
  roommateNames: ["Alex Morgan", "John Smith", "Jane Doe"],
  utilities: "Electricity, gas, and water",
};

const sources = {
  city: {
    title: "Safe Housing for Renters & Landlords",
    publisher: "City of San Luis Obispo",
    url: "https://www.slocity.org/government/department-directory/community-development/renters-landlords",
  },
  courts: {
    title: "Guide to Security Deposits in California",
    publisher: "California Courts Self-Help",
    url: "https://selfhelp.courts.ca.gov/guide-security-deposits-california",
  },
  doj: {
    title: "Landlord-Tenant Issues",
    publisher: "California Department of Justice",
    url: "https://oag.ca.gov/tenants",
  },
  civilRights: {
    title: "Housing",
    publisher: "California Civil Rights Department",
    url: "https://calcivilrights.ca.gov/housing/",
  },
};

type SourceKey = keyof typeof sources;
type Answer = { text: string; sourceKeys: SourceKey[]; isSample?: boolean };

function SourceLink({ sourceKey }: { sourceKey: SourceKey }) {
  const source = sources[sourceKey];
  return (
    <a className="setup-source" href={source.url} target="_blank" rel="noreferrer">
      <span className="setup-source-icon">↗</span>
      <span><b>{source.title}</b><small>{source.publisher}</small></span>
    </a>
  );
}

export default function SetupFlow({
  onFinish,
  onSkip,
  returning = false,
  initialHousehold,
}: {
  returning?: boolean;
  initialHousehold?: Household | null;
  onFinish: (household: Household) => void;
  onSkip: () => void;
}) {
  const [step, setStep] = useState(0);
  const [household, setHousehold] = useState(initialHousehold ?? defaultHousehold);
  const [fileName, setFileName] = useState("");
  const [sampleReady, setSampleReady] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);
  const [planStep, setPlanStep] = useState(0);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);

  const update = <K extends keyof Household,>(key: K, value: Household[K]) =>
    setHousehold((current) => ({ ...current, [key]: value }));

  const updateRoommateCount = (value: string) => {
    const count = Math.min(6, Math.max(1, Number(value) || 1));
    setHousehold((current) => ({
      ...current,
      roommateCount: String(count),
      roommateNames: Array.from({ length: count }, (_, index) => current.roommateNames[index] || ""),
    }));
  };

  const ask = (prompt: string) => {
    const text = prompt.trim();
    if (!text) return;
    setQuestion(text);
    const normalized = text.toLowerCase();

    if (/deposit|security/.test(normalized)) {
      setAnswer({
        text: "This preview can’t decide what a landlord may keep from a particular deposit. California Courts explains the deposit process. Save your move-in condition notes and compare any question against the signed lease; ask a qualified local adviser if you need help with your situation.",
        sourceKeys: ["courts", "city"],
      });
    } else if (/repair|maintenance|mold|leak|habitability/.test(normalized)) {
      setAnswer({
        text: "For local renter and safe-housing resources, start with the City of San Luis Obispo’s Safe Housing page. Keep dated photos and copies of messages about a repair. This preview doesn’t determine whether a condition meets a legal standard.",
        sourceKeys: ["city", "doj"],
      });
    } else if (/discrimin|fair housing|accommodation/.test(normalized)) {
      setAnswer({
        text: "The California Civil Rights Department explains fair-housing protections and how to find help. This preview can point you to that official information, but it can’t assess an individual claim.",
        sourceKeys: ["civilRights", "city"],
      });
    } else if (/lease|rent|notice|guest|utility|utilities/.test(normalized)) {
      setAnswer({
        text: "The fictional sample lease in this preview lists monthly rent of $5,000, a $2,550 deposit, a January 1–December 31, 2027 term, and a 60-day notice period. These are example terms only; they were not extracted from your file and are not legal guidance.",
        sourceKeys: [],
        isSample: true,
      });
    } else {
      setAnswer({
        text: "I can’t verify that from the limited approved sources in this demo, so I won’t guess. Try a question about deposits, repairs, fair housing, or the fictional sample lease.",
        sourceKeys: [],
      });
    }
  };

  const handleQuestion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    ask(question);
  };

  const checklistItems = [
    {title:"Document your home’s condition", description:"Walk through each room and take dated photos of existing marks or damage. Keep a copy for your records.", next:"In this preview, Records shows sample condition notes. Photo upload is not connected yet."},
    {title:"Plan your utilities", description:"Confirm which utilities need to be set up, when service starts, and who will pay each bill.", next:`Your setup lists: ${household.utilities || "No utilities added yet"}. You can update this in household setup.`},
    {title:"Keep important contacts handy", description:"Gather your landlord’s and maintenance contact details, including how to reach them for an urgent repair.", next:"After setup, use Add information in Home Details to save a contact on this browser."},
    {title:"Agree on shared costs", description:"Talk with your roommates about how rent and shared bills will be divided and how you’ll pay each other.", next:"After setup, add an expense to record agreed shares. Payment tracking stays on this browser in this preview."},
    {title:"Add your first rent date", description:"Check the actual rent due date in your agreement. The lease start date is not necessarily the date rent is due.", next:"After setup, add rent in Expenses with a due date; it will appear in Calendar."},
  ];
  const currentPlan = checklistItems[planStep];
  const advancePlan = (done:boolean) => {
    if(done) setChecked(current=>current.includes(currentPlan.title)?current:[...current,currentPlan.title]);
    if(planStep < checklistItems.length-1) setPlanStep(planStep+1); else setStep(6);
  };

  const progress = Math.min(step, 5);

  return (
    <main className="setup-page">
      <div className="setup-topbar">
        <a className="setup-brand" href="#" onClick={(event) => event.preventDefault()}><span>⌂</span> Goodhouse</a>
        <span className="setup-location"><span /> SAN LUIS OBISPO, CALIFORNIA</span>
        <button className="setup-skip" onClick={onSkip}>{returning ? "Back to dashboard" : "Skip setup"}</button>
      </div>

      <div className="setup-wrap">
        {step > 0 && step < 6 && (
          <div className="setup-progress">
            <div className="setup-progress-meta"><span>MOVE-IN SETUP</span><span>STEP {step} OF 5</span></div>
            <div className="setup-progress-track"><span style={{ width: (progress / 5) * 100 + "%" }} /></div>
          </div>
        )}

        {step === 0 && (
          <section className="setup-welcome">
            <div className="setup-kicker"><span>✳</span> A CALMER START TO RENTING</div>
            <h1>Let’s get your<br /><em>house in order.</em></h1>
            <p className="setup-lead">A few quick steps to bring your move-in details, lease notes, and roommate plans together.</p>
            <div className="setup-welcome-cards">
              <div><span>01</span><b>Set up your household</b><small>Just the details you need to start.</small></div>
              <div><span>02</span><b>Walk through a lease</b><small>Try a clearly labeled sample preview.</small></div>
              <div><span>03</span><b>Make a move-in plan</b><small>Leave with a practical checklist.</small></div>
            </div>
            <div className="setup-welcome-note"><b>Built for San Luis Obispo.</b> Guidance previews link to selected government and court resources. No live AI or shared storage is connected.</div>
            <button className="setup-primary" onClick={() => setStep(1)}>Set up my household <span>→</span></button>
            <button className="setup-secondary" onClick={onSkip}>Go straight to the demo dashboard</button>
          </section>
        )}

        {step === 1 && (
          <section className="setup-card">
            <div className="setup-kicker"><span>✳</span> YOUR HOUSEHOLD</div>
            <h1>Start with the basics.</h1>
            <p className="setup-lead">This demo is focused on San Luis Obispo. Add only what you want to see reflected in your preview.</p>
            <div className="setup-grid">
              <label className="setup-field setup-readonly"><span>LOCATION</span><b>San Luis Obispo, California</b><small>Local guidance is limited to this area.</small></label>
              <label className="setup-field"><span>NEIGHBORHOOD <i>OPTIONAL</i></span><input value={household.neighborhood} onChange={(event) => update("neighborhood", event.target.value)} placeholder="e.g. Downtown" /></label>
              <label className="setup-field"><span>HOUSEHOLD NAME</span><input value={household.homeName} onChange={(event) => update("homeName", event.target.value)} placeholder="e.g. Maple House" /></label>
              <label className="setup-field"><span>MOVE-IN DATE</span><input type="date" value={household.moveIn} onChange={(event) => update("moveIn", event.target.value)} /></label>
              <label className="setup-field"><span>LEASE START</span><input type="date" value={household.leaseStart} onChange={(event) => update("leaseStart", event.target.value)} /></label>
              <label className="setup-field"><span>LEASE END</span><input type="date" value={household.leaseEnd} onChange={(event) => update("leaseEnd", event.target.value)} /></label>
              <label className="setup-field"><span>TOTAL MONTHLY RENT</span><div className="setup-money"><b>$</b><input inputMode="decimal" value={household.rent} onChange={(event) => update("rent", event.target.value)} /></div></label>
              <label className="setup-field"><span>SECURITY DEPOSIT</span><div className="setup-money"><b>$</b><input inputMode="decimal" value={household.deposit} onChange={(event) => update("deposit", event.target.value)} /></div></label>
              <label className="setup-field"><span>ROOMMATES INCLUDING YOU</span><select value={household.roommateCount} onChange={(event) => updateRoommateCount(event.target.value)}>{[1, 2, 3, 4, 5, 6].map((count) => <option key={count} value={count}>{count}</option>)}</select></label>
              <label className="setup-field"><span>UTILITIES TO TRACK</span><input value={household.utilities} onChange={(event) => update("utilities", event.target.value)} placeholder="e.g. Electricity and internet" /></label>
            </div>
            <div className="setup-actions"><button className="setup-back" onClick={() => setStep(0)}>← Back</button><button className="setup-primary" onClick={() => setStep(2)}>Add roommates <span>→</span></button></div>
          </section>
        )}

        {step === 2 && (
          <section className="setup-card">
            <div className="setup-kicker"><span>✳</span> YOUR HOUSEHOLD</div>
            <h1>Who’s moving in?</h1>
            <p className="setup-lead">Setup names stay on this browser once you finish setup. They are not shared with roommates.</p>
            <div className="setup-roommates">
              {household.roommateNames.map((name, index) => (
                <label className="setup-field" key={index}><span>{index === 0 ? "YOU" : "ROOMMATE " + (index + 1)}</span><input value={name} onChange={(event) => update("roommateNames", household.roommateNames.map((current, nameIndex) => nameIndex === index ? event.target.value : current))} placeholder={index === 0 ? "Your name" : "Roommate name (optional)"} /></label>
              ))}
            </div>
            <div className="setup-note"><span>✳</span><p>Later, roommates could join with an invite and help manage shared household tasks. This prototype only previews the setup.</p></div>
            <div className="setup-actions"><button className="setup-back" onClick={() => setStep(1)}>← Back</button><button className="setup-primary" onClick={() => setStep(3)}>Continue to lease <span>→</span></button></div>
          </section>
        )}

        {step === 3 && (
          <section className="setup-card">
            <div className="setup-kicker"><span>✳</span> LEASE WALKTHROUGH</div>
            <h1>Bring your lease along.</h1>
            <p className="setup-lead">See how a lease review could feel. For this prototype, analysis uses a fictional sample lease only.</p>
            <div className="setup-upload">
              <div className="setup-upload-icon">↥</div>
              <div><b>Choose a lease PDF</b><small>Your file is not uploaded or analyzed in this preview.</small></div>
              <label className="setup-file-button">Choose file<input type="file" accept="application/pdf,.pdf" onChange={(event) => setFileName(event.target.files?.[0]?.name || "")} /></label>
              {fileName && <div className="setup-file-name">Selected for upload preview: <b>{fileName}</b><br />It stays on this screen; the sample lease below is what the demo reviews.</div>}
            </div>
            <div className="setup-sample">
              <span className="setup-sample-badge">FASTEST PATH</span>
              <div><b>Use the sample lease</b><p>A fictional California lease with example rent, deposit, dates, and notice terms.</p></div>
              <button className={sampleReady ? "setup-selected" : "setup-outline"} onClick={() => setSampleReady(true)}>{sampleReady ? "Sample selected ✓" : "Use sample lease"}</button>
            </div>
            <div className="setup-privacy"><b>Privacy in this demo</b><span>No file leaves your browser. The sample walkthrough is prepared in the app and does not use an AI service.</span></div>
            <div className="setup-actions"><button className="setup-back" onClick={() => setStep(2)}>← Back</button><button className="setup-primary" onClick={() => { setSampleReady(true); setStep(4); }}>Continue with sample <span>→</span></button></div>
          </section>
        )}

        {step === 4 && (
          <section className="setup-card setup-review">
            <div className="setup-kicker"><span>✳</span> LEASE WALKTHROUGH</div>
            <div className="setup-review-title"><div><h1>A clearer first look.</h1><p className="setup-lead">This is what the lease helper could show, using approved sources and clear references.</p></div><span className="setup-preview-label">AI PREVIEW · NO LIVE AI</span></div>
            <div className="setup-review-grid">
              <div className="setup-lease-summary">
                <div className="setup-summary-header"><span className="setup-doc-icon">▤</span><div><b>Sample lease</b><small>Fictional example · not your file</small></div><span className="setup-example-tag">SAMPLE</span></div>
                <div className="setup-summary-row"><span>Monthly rent</span><b>$5,000</b></div>
                <div className="setup-summary-row"><span>Security deposit</span><b>$2,550</b></div>
                <div className="setup-summary-row"><span>Lease term</span><b>Jan 1 – Dec 31, 2027</b></div>
                <div className="setup-summary-row"><span>Notice period listed</span><b>60 days</b></div>
                <div className="setup-caution">These are fictional sample terms, not extracted from an uploaded lease and not legal advice. A lease term may not describe the full law that applies to a renter.</div>
              </div>
              <div className="setup-qa">
                <div className="setup-ai-head"><span>✳</span><div><b>Ask the preview</b><small>Prepared examples, grounded in selected sources</small></div></div>
                <div className="setup-prompts"><button onClick={() => ask("How do I track my deposit?")}>How do I track my deposit?</button><button onClick={() => ask("What if I need a repair?")}>What if I need a repair?</button><button onClick={() => ask("Where can I learn about fair housing?")}>Where can I learn about fair housing?</button></div>
                <form className="setup-ask" onSubmit={handleQuestion}><label className="sr-only" htmlFor="setup-question">Ask a question</label><input id="setup-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about the sample lease or SLO..." /><button aria-label="Ask the preview">↗</button></form>
                {answer && <div className="setup-answer" role="status"><b>Preview response</b><p>{answer.text}</p>{answer.isSample && <div className="setup-source demo-source"><span className="setup-source-icon">▤</span><span><b>Fictional sample lease</b><small>Example text prepared for this demo</small></span></div>}{answer.sourceKeys.length > 0 && <div className="setup-answer-sources">{answer.sourceKeys.map((key) => <SourceLink key={key} sourceKey={key} />)}</div>}</div>}
                <div className="setup-source-boundary">The demo uses a short, selected source list—not an open-web search. If the answer isn’t supported, it says so.</div>
              </div>
            </div>
            <div className="setup-sources">
              <div><div className="setup-kicker">APPROVED STARTING SOURCES</div><p>Official local, court, and state resources chosen for this demo.</p></div>
              <div className="setup-source-list">{(["city", "courts", "doj", "civilRights"] as SourceKey[]).map((key) => <SourceLink key={key} sourceKey={key} />)}</div>
            </div>
            <div className="setup-actions"><button className="setup-back" onClick={() => setStep(3)}>← Back</button><button className="setup-primary" onClick={() => setStep(5)}>Make a move-in plan <span>→</span></button></div>
          </section>
        )}

        {step === 5 && (
          <section className="setup-card" aria-labelledby="plan-title">
            <div className="setup-kicker"><span>✳</span> MOVE-IN PLAN · {planStep + 1} OF {checklistItems.length}</div>
            <h1 id="plan-title">{currentPlan.title}.</h1>
            <p className="setup-lead">{currentPlan.description}</p>
            <div className="setup-plan-help"><b>How goodhouse can help</b><p>{currentPlan.next}</p></div>
            <p className="setup-plan-status">{checked.includes(currentPlan.title) ? "Marked done in this session." : "These are suggestions, not legal requirements."} Your plan selections aren’t saved after a refresh.</p>
            <div className="setup-plan-buttons"><button className="setup-primary" onClick={()=>advancePlan(true)}>Mark done and {planStep===checklistItems.length-1?"finish":"continue"} <span>→</span></button><button className="setup-back" onClick={()=>advancePlan(false)}>Skip this step</button></div>
            <div className="setup-actions"><button className="setup-back" onClick={()=>planStep>0?setPlanStep(planStep-1):setStep(4)}>← Back</button><button className="setup-back" onClick={()=>setStep(6)}>Skip move-in plan</button></div>
          </section>
        )}

        {step === 6 && (
          <section className="setup-finish">
            <div className="setup-finish-mark">✓</div>
            <div className="setup-kicker"><span>✳</span> YOUR MOVE-IN PREVIEW</div>
            <h1>You’re ready to<br /><em>make yourself at home.</em></h1>
            <p className="setup-lead">We’ve brought your setup details into a sample household dashboard. Your setup answers will be saved on this browser when you open the dashboard.</p>
            <div className="setup-finish-card"><span className="setup-home-icon">⌂</span><div><b>{household.homeName || "Your household"}</b><small>{household.neighborhood || "San Luis Obispo"} · {household.roommateCount} {Number(household.roommateCount) === 1 ? "roommate" : "roommates"}</small></div><span className="setup-finish-check">✓</span></div>
            <button className="setup-primary" onClick={() => onFinish(household)}>Open my dashboard <span>→</span></button><button className="setup-secondary setup-edit" onClick={() => setStep(1)}>Edit setup details</button>
            <p className="setup-fine-print">Demo only · Completed setup is saved in this browser · No shared backend connected</p>
          </section>
        )}
      </div>
    </main>
  );
}
