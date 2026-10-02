const j=require("./ship_raw.json");
for(const p of j.deliveryProfiles.nodes){console.log("PROFILE",p.name,p.default);
 for(const g of p.profileLocationGroups)for(const z of g.locationGroupZones.nodes){
  const provs=z.zone.countries.map(c=>c.name+":"+(c.provinces||[]).length).join(",");
  console.log(" ZONE",z.zone.name,provs);
  for(const m of z.methodDefinitions.nodes){
   const price=m.rateProvider.price?m.rateProvider.price.amount:m.rateProvider.__typename;
   const cond=(m.methodConditions||[]).map(c=>c.field+" "+c.operator+" "+(c.conditionCriteria.amount||"")).join(";");
   console.log("   ",m.name,m.active,price,cond);}}}
