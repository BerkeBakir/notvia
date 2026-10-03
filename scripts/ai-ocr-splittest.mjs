import { readFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";
const env={};for(const l of readFileSync(new URL("../.env.local",import.meta.url),"utf8").split("\n")){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m)env[m[1]]=m[2].replace(/^["']|["']$/g,"");}
const url="https://voygjydsvrouvnevaqjw.supabase.co/storage/v1/object/public/notes/0f44cd72-9e18-4da7-ad16-1a8e325ef60f/1791063776886-say_sal_tasar_m_full_.pdf";
const res=await fetch(url); const buf=Buffer.from(await res.arrayBuffer());
console.log("Dosya boyutu:", (buf.byteLength/1024/1024).toFixed(1), "MB");
const MAX=8*1024*1024, MAXP=120;
const src=await PDFDocument.load(buf,{ignoreEncryption:true});
console.log("Sayfa sayısı:", src.getPageCount());
const total=Math.min(src.getPageCount(),MAXP);
const batches=[]; let start=0;
while(start<total){ let end=start,last=null;
  while(end<total){ const d=await PDFDocument.create(); const ps=await d.copyPages(src,Array.from({length:end+1-start},(_,i)=>start+i)); ps.forEach(p=>d.addPage(p)); const b=await d.save(); if(b.byteLength>MAX&&end>start)break; last=b; end++; }
  if(last)batches.push(last.byteLength); if(end===start)end=start+1; start=end;
}
console.log("Parça sayısı:", batches.length);
console.log("Parça boyutları (MB):", batches.map(b=>(b/1024/1024).toFixed(1)).join(", "));
