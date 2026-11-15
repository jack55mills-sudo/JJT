export type SampleRecord = { id:string; name:string; category:string; type:string; date:string; note:string; preview:string };
export const sampleRecords:SampleRecord[] = [
 {id:"lease",name:"Sample rental lease",category:"Lease & rental",type:"Sample PDF",date:"Jan 1, 2027",note:"Fictional lease walkthrough",preview:"Fictional example: the lease walkthrough lists a 60-day notice period. This is a demo summary, not a real lease or legal advice."},
 {id:"checklist",name:"Move-in checklist",category:"Lease & rental",type:"Sample document",date:"Jan 1, 2027",note:"Keys, utilities, and inspection reminders",preview:"Example checklist: collect keys, record utility readings, and document the condition of each room."},
 {id:"utility",name:"Electricity bill",category:"Bills & receipts",type:"Sample PDF",date:"Sep 4, 2027",note:"Example monthly utility bill",preview:"Fictional utility bill. Add an expense in Expenses to track real amounts and splits in this browser."},
 {id:"receipt",name:"Shared supplies receipt",category:"Bills & receipts",type:"Sample receipt",date:"Sep 8, 2027",note:"Example household purchase",preview:"Fictional receipt for shared household supplies."},
 {id:"kitchen",name:"Kitchen counter",category:"Photos & condition",type:"Sample photo",date:"Jan 1, 2027",note:"Existing mark on countertop",preview:"Fictional condition note: a mark was present on the countertop at move-in. This illustration is not an uploaded photo."},
 {id:"living",name:"Living room wall",category:"Photos & condition",type:"Sample photo",date:"Jan 1, 2027",note:"Wall condition at move-in",preview:"Fictional condition note: a small wall mark was recorded at move-in. This illustration is not an uploaded photo."},
];
