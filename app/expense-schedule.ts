import type { Expense } from "./Expenses";

function dateParts(value:string) { return value.split("-").map(Number); }
export function monthOccurrence(start:string, year:number, month:number):string | null {
 const [sy,sm,day]=dateParts(start);
 if(year*12+month < sy*12+(sm-1)) return null;
 const last=new Date(year,month+1,0).getDate();
 return `${year}-${String(month+1).padStart(2,"0")}-${String(Math.min(day,last)).padStart(2,"0")}`;
}
export type ExpenseOccurrence={expense:Expense;date:string; projected:boolean};
export function expenseOccurrences(expenses:Expense[], from:string, through:string):ExpenseOccurrence[] {
 const result:ExpenseOccurrence[]=[];
 for(const expense of expenses){
  if(expense.due>=from&&expense.due<=through)result.push({expense,date:expense.due,projected:false});
  if(expense.repeat!=="monthly")continue;
  const [fy,fm]=dateParts(from),[ty,tm]=dateParts(through);
  for(let i=fy*12+fm-1;i<=ty*12+tm-1;i++){
   const date=monthOccurrence(expense.due,Math.floor(i/12),i%12);
   if(!date||date===expense.due||date<from||date>through)continue;
   if(expenses.some(e=>e.seriesId===expense.id&&e.due===date))continue;
   result.push({expense,date,projected:true});
  }
 }
 return result.sort((a,b)=>a.date.localeCompare(b.date)||a.expense.name.localeCompare(b.expense.name));
}
