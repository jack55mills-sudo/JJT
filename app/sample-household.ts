// Fictional records for the simulated assistant, never mixed with a user's household.
export const sampleHousehold = {
  name: "Maple House",
  agreement: { guests: "Overnight guests are discussed with roommates in advance." },
  lease: { noticeDays: 60 },
  expenses: [
    { name:"Rent", total:500000, due:"September 1", payer:"Landlord / provider", shares:{"Alex Morgan":200000,"John Smith":150000,"Jane Doe":150000} },
    { name:"Electricity", total:12000, due:"September 4", payer:"Alex Morgan", shares:{"Alex Morgan":4000,"John Smith":4000,"Jane Doe":4000} },
  ],
};
