import { readFileSync } from "node:fs";
const env={};for(const l of readFileSync(new URL("../.env.local",import.meta.url),"utf8").split("\n")){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m)env[m[1]]=m[2].replace(/^["']|["']$/g,"");}
async function* streamOai(base,key,model,prompt){
  const res=await fetch(`${base}/chat/completions`,{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${key}`},body:JSON.stringify({model,messages:[{role:"user",content:prompt}],stream:true})});
  if(!res.ok||!res.body)throw new Error("HTTP "+res.status);
  const reader=res.body.getReader(),dec=new TextDecoder();let buf="";
  while(true){const {done,value}=await reader.read();if(done)break;buf+=dec.decode(value,{stream:true});const lines=buf.split("\n");buf=lines.pop()??"";
    for(const l of lines){const t=l.trim();if(!t.startsWith("data:"))continue;const p=t.slice(5).trim();if(p==="[DONE]")return;try{const j=JSON.parse(p);const d=j?.choices?.[0]?.delta?.content;if(d)yield d;}catch{}}}
}
process.stdout.write("Groq akışı: ");
let chunks=0;
for await (const d of streamOai("https://api.groq.com/openai/v1",env.GROQ_API_KEY,"openai/gpt-oss-120b","Üç cümlede ikili arama ağacını anlat.")){process.stdout.write(d);chunks++;}
console.log(`\n\n[${chunks} parça halinde aktı — streaming çalışıyor]`);
