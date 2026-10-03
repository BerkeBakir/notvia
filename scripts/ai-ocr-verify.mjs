import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
const env={};for(const l of readFileSync(new URL("../.env.local",import.meta.url),"utf8").split("\n")){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m)env[m[1]]=m[2].replace(/^["']|["']$/g,"");}
const a=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const em=new GoogleGenerativeAI(env.GEMINI_API_KEY).getGenerativeModel({model:"gemini-embedding-001"});
const COURSE=(await a.from("notes").select("course_id").eq("id","2a5cfa5e-7d0b-40dd-a6f5-006e17d011bb").single()).data.course_id;
const q="Sayısal Tasarım dersinin öğretim üyesi kim ve hangi konular işleniyor?";
let emb;for(let i=0;i<5;i++){try{emb=(await em.embedContent({content:{role:"user",parts:[{text:q}]},outputDimensionality:768})).embedding.values;break;}catch(e){if(String(e).includes("429")){console.log("embed 429 bekle");await new Promise(r=>setTimeout(r,40000));}else throw e;}}
const {data:matches}=await a.rpc("match_note_chunks_v2",{query_embedding:JSON.stringify(emb),match_count:6,filter_course_id:COURSE,filter_note_ids:null});
const ctx=matches.map((m,i)=>`[Kaynak ${i+1}]\n${m.content}`).join("\n---\n");
const prompt=`Notvia asistanisin. Kaynaklara dayanarak Turkce yanitla, uydurma.\n${ctx}\n\nSORU: ${q}`;
// Groq fallback
const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${env.GROQ_API_KEY}`},body:JSON.stringify({model:"openai/gpt-oss-120b",messages:[{role:"user",content:prompt}],temperature:0.2})});
const d=await r.json();
console.log("SORU:",q);
console.log("en iyi benzerlik:",matches[0]?.similarity?.toFixed(3));
console.log("\nCEVAP (Groq):\n"+(d.choices?.[0]?.message?.content||JSON.stringify(d).slice(0,200)));
