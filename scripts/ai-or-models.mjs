import { readFileSync } from "node:fs";
const env={};for(const l of readFileSync(new URL("../.env.local",import.meta.url),"utf8").split("\n")){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m)env[m[1]]=m[2].replace(/^["']|["']$/g,"");}
const r=await fetch("https://openrouter.ai/api/v1/models",{headers:{authorization:`Bearer ${env.OPENROUTER_API_KEY}`}});
const d=await r.json();
const free=(d.data||[]).filter(m=>m.id.endsWith(":free")).map(m=>m.id);
console.log("OpenRouter ücretsiz model sayısı:",free.length);
console.log(free.filter(i=>/qwen|llama|deepseek|gemma|mistral/i.test(i)).slice(0,20).join("\n"));
