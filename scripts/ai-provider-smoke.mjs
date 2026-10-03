import { readFileSync } from "node:fs";
const env={};for(const l of readFileSync(new URL("../.env.local",import.meta.url),"utf8").split("\n")){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m)env[m[1]]=m[2].replace(/^["']|["']$/g,"");}
const Q = "Tek cümlede: Türkiye'nin başkenti neresidir?";
const tests = [
  ["groq","https://api.groq.com/openai/v1", env.GROQ_API_KEY, env.GROQ_MODEL||"openai/gpt-oss-120b"],
  ["cerebras","https://api.cerebras.ai/v1", env.CEREBRAS_API_KEY, env.CEREBRAS_MODEL||"qwen-3.8-27b"],
  ["openrouter","https://openrouter.ai/api/v1", env.OPENROUTER_API_KEY, env.OPENROUTER_MODEL||"qwen/qwen3.8-27b:free"],
  ["mistral","https://api.mistral.ai/v1", env.MISTRAL_API_KEY, env.MISTRAL_MODEL||"mistral-small-latest"],
];
for (const [name,base,key,model] of tests){
  if(!key){ console.log(name,"- key yok, atlandı"); continue; }
  try{
    const r = await fetch(`${base}/chat/completions`,{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${key}`},body:JSON.stringify({model,messages:[{role:"user",content:Q}],temperature:0})});
    if(!r.ok){ console.log(`❌ ${name} (${model}) -> HTTP ${r.status}: ${(await r.text()).slice(0,120)}`); continue; }
    const d = await r.json();
    const txt = d?.choices?.[0]?.message?.content?.trim()?.slice(0,80);
    console.log(`✅ ${name} (${model}) -> ${txt}`);
  }catch(e){ console.log(`❌ ${name} -> ${String(e).slice(0,100)}`); }
}
