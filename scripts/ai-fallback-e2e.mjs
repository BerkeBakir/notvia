import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
const env={};for(const l of readFileSync(new URL("../.env.local",import.meta.url),"utf8").split("\n")){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m)env[m[1]]=m[2].replace(/^["']|["']$/g,"");}
const a=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});

// generateChat mantığı: Gemini -> Groq -> Cerebras -> OpenRouter -> Mistral
async function oai(name,base,key,model,prompt){const r=await fetch(`${base}/chat/completions`,{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${key}`},body:JSON.stringify({model,messages:[{role:"user",content:prompt}],temperature:0.3})});if(!r.ok)throw new Error(`${name} ${r.status}`);return (await r.json()).choices[0].message.content;}
async function gem(key,prompt){const m=new GoogleGenerativeAI(key).getGenerativeModel({model:"gemini-2.5-flash"});return (await m.generateContent(prompt)).response.text();}
async function generateChat(prompt){
  const chain=[["gemini",()=>gem(env.GEMINI_API_KEY,prompt)],
    ["groq",()=>oai("groq","https://api.groq.com/openai/v1",env.GROQ_API_KEY,"openai/gpt-oss-120b",prompt)],
    ["cerebras",()=>oai("cerebras","https://api.cerebras.ai/v1",env.CEREBRAS_API_KEY,"qwen-3.8-27b",prompt)]];
  let last;for(const [n,fn] of chain){try{const t=await fn();return {provider:n,text:t};}catch(e){console.log(`  [${n}] düştü: ${String(e).slice(0,60)}`);last=e;}}
  throw last;
}

// Embedding (Gemini) — kota dolabilir
let emb;
try{ const m=new GoogleGenerativeAI(env.GEMINI_API_KEY).getGenerativeModel({model:"gemini-embedding-001"});
  emb=(await m.embedContent({content:{role:"user",parts:[{text:"Big-O karmasikligi nedir?"}]},outputDimensionality:768})).embedding.values;
}catch(e){ console.log("Embedding kotası dolu, demo chunk ile devam:",String(e).slice(0,50)); }

let ctx;
if(emb){ const {data}=await a.rpc("match_note_chunks",{query_embedding:JSON.stringify(emb),match_count:3,filter_course_id:null}); ctx=(data||[]).map((m,i)=>`[Kaynak ${i+1}]\n${m.content}`).join("\n---\n"); }
else { const {data}=await a.from("note_chunks").select("content").limit(3); ctx=(data||[]).map((m,i)=>`[Kaynak ${i+1}]\n${m.content}`).join("\n---\n"); }

const prompt=`Notvia asistanisin. Kaynaklara dayanarak kisa yanitla.\n=== KAYNAKLAR ===\n${ctx}\n=== SORU ===\nBu notlar ne hakkinda, kisaca ozetle.`;
console.log("Fallback zinciri deneniyor...");
const r=await generateChat(prompt);
console.log(`\n✅ CEVAP VEREN SAĞLAYICI: ${r.provider}`);
console.log("CEVAP:",r.text.trim().slice(0,300));
