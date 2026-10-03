import { readFileSync } from "node:fs";
const env={};for(const l of readFileSync(new URL("../.env.local",import.meta.url),"utf8").split("\n")){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m)env[m[1]]=m[2].replace(/^["']|["']$/g,"");}
async function list(name,base,key,filter){
  try{
    const r=await fetch(`${base}/models`,{headers:{authorization:`Bearer ${key}`}});
    if(!r.ok){console.log(`\n${name}: HTTP ${r.status}`);return;}
    const d=await r.json();
    const ids=(d.data||d.models||[]).map(m=>m.id||m.name).filter(Boolean);
    console.log(`\n=== ${name} (${ids.length} model) ===`);
    console.log(ids.filter(i=>filter.test(i)).slice(0,15).join("\n") || ids.slice(0,15).join("\n"));
  }catch(e){console.log(name,"hata",String(e).slice(0,80));}
}
await list("groq","https://api.groq.com/openai/v1",env.GROQ_API_KEY,/llama|qwen|gpt|deepseek/i);
await list("cerebras","https://api.cerebras.ai/v1",env.CEREBRAS_API_KEY,/llama|qwen/i);
