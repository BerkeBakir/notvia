import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
const env={};for(const l of readFileSync(new URL("../.env.local",import.meta.url),"utf8").split("\n")){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m)env[m[1]]=m[2].replace(/^["']|["']$/g,"");}
const a=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const g=new GoogleGenerativeAI(env.GEMINI_API_KEY);
const em=g.getGenerativeModel({model:"gemini-embedding-001"});
const cm=g.getGenerativeModel({model:"gemini-2.5-flash"});
const DEMO="00000000-0000-0000-0000-00000000dede";
const embed=async t=>(await em.embedContent({content:{role:"user",parts:[{text:t}]},outputDimensionality:768})).embedding.values;

// Geçici ders (hoca bilgili)
const { data: dep } = await a.from("departments").select("id").limit(1).single();
const { data: course } = await a.from("courses").insert({department_id:dep.id,name:"META TEST Dersi",instructor:"Prof. Dr. Ayşe Yılmaz"}).select("id,name,instructor").single();
const { data: note } = await a.from("notes").insert({user_id:DEMO,title:"Giris Notu",description:"m",file_url:"https://x/none.pdf",type:"note",course_id:course.id}).select("id").single();

// ingest.ts metadata-chunk mantigi (icerikte hoca GEÇMIYOR, sadece metadata'da)
const body = "Bu derste toplama ve carpma islemlerinin temel ozellikleri anlatilir. Degismeli ozellik onemlidir.";
const meta = `Not başlığı: Giris Notu. Ders: ${course.name}. Öğretim üyesi: ${course.instructor}.`;
const all=[meta, body];
for(let i=0;i<all.length;i++){ const v=await embed(all[i]); await a.from("note_chunks").insert({note_id:note.id,course_id:course.id,content:i===0?all[i]:`Giris Notu\n\n${all[i]}`,embedding:JSON.stringify(v)}); }

const q="Bu dersin öğretim üyesi kimdir?";
const qv=await embed(q);
const { data: matches } = await a.rpc("match_note_chunks",{query_embedding:JSON.stringify(qv),match_count:12,filter_course_id:course.id});
const ctx=(matches||[]).map((m,i)=>`[Kaynak ${i+1}]\n${m.content}`).join("\n\n---\n\n");
const prompt=`Notvia asistanisin. Kaynaklara dayanarak Turkce yanitla, uydurma.\n=== KAYNAKLAR ===\n${ctx}\n=== SORU ===\n${q}`;
const ans=await cm.generateContent(prompt);
console.log("SORU:",q);
console.log("CEVAP:",ans.response.text().trim());

// temizlik
await a.from("note_chunks").delete().eq("course_id",course.id);
await a.from("notes").delete().eq("course_id",course.id);
await a.from("courses").delete().eq("id",course.id);
console.log("(temizlendi)");
