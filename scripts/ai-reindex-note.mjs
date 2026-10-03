import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractText, getDocumentProxy } from "unpdf";
import { PDFDocument } from "pdf-lib";

const env={};for(const l of readFileSync(new URL("../.env.local",import.meta.url),"utf8").split("\n")){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m)env[m[1]]=m[2].replace(/^["']|["']$/g,"");}
const admin=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const genAI=new GoogleGenerativeAI(env.GEMINI_API_KEY);
const em=genAI.getGenerativeModel({model:"gemini-embedding-001"});
const vis=genAI.getGenerativeModel({model:"gemini-2.5-flash"});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const embed=async t=>{for(let i=0;i<5;i++){try{const r=await em.embedContent({content:{role:"user",parts:[{text:t}]},outputDimensionality:768});await sleep(350);return r.embedding.values;}catch(e){if(String(e).includes("429")){console.log("  embed 429, 40sn bekle");await sleep(40000);}else throw e;}}throw new Error("embed fail");};
const chunkText=(t,size=1500,ov=200)=>{const c=t.trim();if(!c)return[];if(c.length<=size)return[c];const st=size-ov,o=[];for(let s=0;s<c.length;s+=st){o.push(c.slice(s,s+size));if(s+size>=c.length)break;}return o;};

const NOTE_ID="2a5cfa5e-7d0b-40dd-a6f5-006e17d011bb";
const { data: note }=await admin.from("notes").select("id,title,file_url,course_id").eq("id",NOTE_ID).single();
console.log("Not:",note.title);
const buf=Buffer.from(await (await fetch(note.file_url)).arrayBuffer());

// 1) metin katmanı
const pdf=await getDocumentProxy(new Uint8Array(buf));
const { text }=await extractText(pdf,{mergePages:true});
let full=(Array.isArray(text)?text.join("\n"):text).trim();
const src=await PDFDocument.load(buf,{ignoreEncryption:true});
const pages=src.getPageCount();
console.log(`Metin katmanı: ${full.length} karakter / ${pages} sayfa (${(full.length/pages).toFixed(0)} krk/sayfa)`);

// 2) taranmış → OCR (bölerek)
if(full.length/pages<80){
  console.log("→ Taranmış tespit edildi, OCR başlıyor...");
  const MAX=8*1024*1024, MAXP=120, total=Math.min(pages,MAXP);
  const batches=[]; let start=0;
  while(start<total){let end=start,last=null;while(end<total){const d=await PDFDocument.create();const ps=await d.copyPages(src,Array.from({length:end+1-start},(_,i)=>start+i));ps.forEach(p=>d.addPage(p));const b=await d.save();if(b.byteLength>MAX&&end>start)break;last=b;end++;}if(last)batches.push(last);if(end===start)end=start+1;start=end;}
  console.log(`  ${batches.length} parçaya bölündü (ilk ${total} sayfa)`);
  let ocr="";
  for(let i=0;i<batches.length;i++){
    for(let a=0;a<4;a++){try{const r=await vis.generateContent([{inlineData:{mimeType:"application/pdf",data:Buffer.from(batches[i]).toString("base64")}},{text:"Bu PDF taranmış ders notu sayfaları içeriyor. İçindeki TÜM metni olduğu gibi düz metin olarak çıkar. Yorum ekleme."}]);ocr+="\n\n"+(r.response.text()||"");console.log(`  parça ${i+1}/${batches.length} OCR'landı (+${(r.response.text()||"").length} krk)`);await sleep(2000);break;}catch(e){if(String(e).includes("429")){console.log("  OCR 429, 45sn bekle");await sleep(45000);}else{console.log("  parça hata:",String(e).slice(0,80));break;}}}
  }
  full=(full+"\n\n"+ocr).trim();
}
console.log("Toplam metin:",full.length,"karakter");
console.log("\n--- OCR METİN ÖRNEĞİ (ilk 600) ---\n"+full.slice(0,600));

// 3) chunk + embed + index
const meta=`Not başlığı: ${note.title}.`;
const all=[meta,...chunkText(full)];
console.log("\nChunk:",all.length,"- embedding...");
await admin.from("note_chunks").delete().eq("note_id",note.id);
const rows=[];
for(let i=0;i<all.length;i++){const v=await embed(all[i]);rows.push({note_id:note.id,course_id:note.course_id,content:i===0?all[i]:`${note.title}\n\n${all[i]}`,embedding:JSON.stringify(v)});if((i+1)%20===0)console.log(`  ${i+1}/${all.length}`);}
for(let i=0;i<rows.length;i+=50){const e=await admin.from("note_chunks").insert(rows.slice(i,i+50));if(e.error)throw new Error(e.error.message);}
await admin.from("notes").update({ai_indexed:true}).eq("id",note.id);
console.log("İNDEKSLENDİ. Toplam chunk:",all.length);
