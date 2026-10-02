const fs=require("fs"); const html=fs.readFileSync("tablero.html","utf8"); const script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const els={}; const mk=(id)=>els[id]||(els[id]={id,innerHTML:"",className:"",textContent:"",addEventListener(){},getAttribute(){return null},querySelectorAll(){return[]},setAttribute(){},removeAttribute(){}});
const sample={v:{spend:"100000",impr:"20000",clicks:"400",lpv:"300",vc:"260",atcM:"40",icM:"25",purM:"3",valM:"540000",ses:"350",sCart:"45",sChk:"28",sComp:"3",ord:"3",net:"520000",tot:"540000",ordA:"3",salA:"540000",ref:"0",newC:"3",nW:"3",cProd:"60000",cPack:"5000",cLabel:"15000",cOther:"0",rRate:"5",shopPct:"2",wPct:"2.65",wFix:"700",wIva:"19",minPur:"10",margin:"20"},c:[{n:"cmp_test",sp:"100000",pu:"3",rv:"540000"}]};
const store={"radaelli:tablero:v1":JSON.stringify(sample)};
global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v}};
global.document={getElementById:mk,addEventListener(){},createElement(){return{}},body:{appendChild(){},removeChild(){}}};
global.navigator={clipboard:{writeText:()=>Promise.resolve()}}; global.location={reload(){}};
new Function(script)();
const strip=h=>h.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
console.log("VERDICT:",strip(els.verdict.innerHTML));
console.log("Q:",strip(els.q.innerHTML).slice(0,900));
console.log("FUNNEL rows:",(els.funnel.innerHTML.match(/<tr>/g)||[]).length);
console.log("RECON:",strip(els.recon.innerHTML).slice(0,200));
console.log("CAMP:",strip(els.camp.innerHTML).slice(0,300));
// sin costos
store["radaelli:tablero:v1"]=JSON.stringify({v:{spend:"100000",ord:"3",ordA:"3",salA:"540000",net:"520000",tot:"540000",shopPct:"2",wPct:"2.65",wFix:"700",wIva:"19"},c:[{n:"",sp:"",pu:"",rv:""}]});
Object.keys(els).forEach(k=>delete els[k]); new Function(script)();
console.log("VERDICT (sin costos):",strip(els.verdict.innerHTML));
