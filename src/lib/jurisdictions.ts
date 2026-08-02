export type CountryCode = "US" | "CA" | "GB";

export const COUNTRIES: { code: CountryCode; name: string; regionLabel: string }[] = [
  { code: "US", name: "United States", regionLabel: "State" },
  { code: "CA", name: "Canada", regionLabel: "Province or territory" },
  { code: "GB", name: "United Kingdom", regionLabel: "UK nation" },
];

export const REGIONS: Record<CountryCode, { code: string; name: string }[]> = {
  US: [
    ["AL","Alabama"],["AK","Alaska"],["AZ","Arizona"],["AR","Arkansas"],["CA","California"],
    ["CO","Colorado"],["CT","Connecticut"],["DE","Delaware"],["FL","Florida"],["GA","Georgia"],
    ["HI","Hawaii"],["ID","Idaho"],["IL","Illinois"],["IN","Indiana"],["IA","Iowa"],
    ["KS","Kansas"],["KY","Kentucky"],["LA","Louisiana"],["ME","Maine"],["MD","Maryland"],
    ["MA","Massachusetts"],["MI","Michigan"],["MN","Minnesota"],["MS","Mississippi"],["MO","Missouri"],
    ["MT","Montana"],["NE","Nebraska"],["NV","Nevada"],["NH","New Hampshire"],["NJ","New Jersey"],
    ["NM","New Mexico"],["NY","New York"],["NC","North Carolina"],["ND","North Dakota"],["OH","Ohio"],
    ["OK","Oklahoma"],["OR","Oregon"],["PA","Pennsylvania"],["RI","Rhode Island"],["SC","South Carolina"],
    ["SD","South Dakota"],["TN","Tennessee"],["TX","Texas"],["UT","Utah"],["VT","Vermont"],
    ["VA","Virginia"],["WA","Washington"],["WV","West Virginia"],["WI","Wisconsin"],["WY","Wyoming"],
    ["DC","District of Columbia"],
  ].map(([code, name]) => ({ code, name })),
  CA: [
    ["AB","Alberta"],["BC","British Columbia"],["MB","Manitoba"],["NB","New Brunswick"],
    ["NL","Newfoundland and Labrador"],["NS","Nova Scotia"],["NT","Northwest Territories"],
    ["NU","Nunavut"],["ON","Ontario"],["PE","Prince Edward Island"],["QC","Quebec"],
    ["SK","Saskatchewan"],["YT","Yukon"],
  ].map(([code, name]) => ({ code, name })),
  GB: [
    ["ENG","England"],["SCT","Scotland"],["WLS","Wales"],["NIR","Northern Ireland"],
  ].map(([code, name]) => ({ code, name })),
};
