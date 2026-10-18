'use strict';
const $=id=>document.getElementById(id);const editor=$('editor');const LEGACY_KEY='lolo_word_docs_v1';let profile=null;let KEY=null;let docs=[];let active=null;let autosaveTimer;const defaultHTML=editor.innerHTML;
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500)}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function safeText(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function stripUnsafe(html){const template=document.createElement('template');template.innerHTML=html;template.content.querySelectorAll('script,iframe,object,embed,form,link,meta,style').forEach(n=>n.remove());template.content.querySelectorAll('*').forEach(n=>{[...n.attributes].forEach(a=>{if(/^on/i.test(a.name)||(/^(href|src)$/i.test(a.name)&&/^(javascript:|data:text\/html)/i.test(a.value)))n.removeAttribute(a.name)})});return template.innerHTML}
function persist(){if(!KEY)return false;try{localStorage.setItem(KEY,JSON.stringify(docs));$('status').textContent='تم الحفظ ✓';return true}catch(e){$('status').textContent='تعذّر الحفظ: المساحة ممتلئة';toast('تعذّر الحفظ محليًا. نزّل نسخة HTML.');return false}}
function updateCount(){const text=editor.innerText.trim();$('wordCount').textContent=(text?text.split(/\s+/).length:0)+' كلمة'}
function writeCurrent(){if(!active)return;const d=docs.find(x=>x.id===active);if(!d)return;d.title=$('docTitle').value.trim()||'مستند بدون عنوان';d.html=editor.innerHTML;d.updated=Date.now();persist();renderDocs()}
function delayedSave(){ $('status').textContent='جارٍ الحفظ...';updateCount();clearTimeout(autosaveTimer);autosaveTimer=setTimeout(writeCurrent,600)}
function loadDoc(id){clearTimeout(autosaveTimer);if(active)writeCurrent();const d=docs.find(x=>x.id===id);if(!d)return;active=id;$('docTitle').value=d.title;editor.innerHTML=stripUnsafe(d.html);updateCount();renderDocs();$('status').textContent='جاهز للكتابة'}
function newDocument(){if(active)writeCurrent();const doc={id:uid(),title:'مستند بدون عنوان',html:'<p>ابدأ الكتابة هنا...</p>',updated:Date.now()};docs.unshift(doc);active=null;persist();loadDoc(doc.id);editor.focus()}
function renderDocs(){const root=$('docList');root.replaceChildren();docs.sort((a,b)=>b.updated-a.updated);for(const d of docs){const box=document.createElement('div');box.className='doc';const open=document.createElement('button');open.className='open';open.textContent=(d.id===active?'● ':'📄 ')+d.title;open.onclick=()=>loadDoc(d.id);const del=document.createElement('button');del.className='trash';del.title='حذف المستند';del.textContent='×';del.onclick=()=>{if(!confirm('حذف هذا المستند؟'))return;docs=docs.filter(x=>x.id!==d.id);if(active===d.id){active=null;if(docs.length)loadDoc(docs[0].id);else newDocument()}persist();renderDocs()};box.append(open,del);root.append(box)}}
function startProfile(name){
 if(active)writeCurrent();profile=name;KEY='lolo_word_docs_profile_'+name;docs=[];active=null;
 try{const parsed=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(parsed))docs=parsed.filter(d=>d&&typeof d.id==='string'&&typeof d.html==='string').map(d=>({...d,html:stripUnsafe(d.html)}))}catch{}
 if(docs.length){loadDoc(docs[0].id)}else{newDocument()}
 $('activeProfileName').textContent='المستخدم: '+name;$('profileGate').hidden=true;updateCount();toast('أهلًا '+name);
}
document.querySelectorAll('[data-profile]').forEach(b=>b.onclick=()=>startProfile(b.dataset.profile));
$('switchProfile').onclick=()=>{if(active)writeCurrent();$('profileGate').hidden=false};
$('migrateLegacy').onclick=()=>{if(!profile)return;let old=[];try{old=JSON.parse(localStorage.getItem(LEGACY_KEY)||'[]')}catch{};if(!Array.isArray(old)||!old.length)return toast('لا توجد مستندات قديمة على هذا المتصفح');if(!confirm('هل تريد نسخ مستندات النسخة القديمة إلى حساب '+profile+'؟'))return;const existing=new Set(docs.map(d=>d.id));let count=0;for(const d of old){if(d&&typeof d.html==='string'&&typeof d.id==='string'&&!existing.has(d.id)){docs.push({...d,id:uid(),html:stripUnsafe(d.html)});count++}}persist();renderDocs();toast('تم استرجاع '+count+' مستندات. النسخة القديمة ما زالت محفوظة.')};


$('newDoc').onclick=newDocument;$('saveDoc').onclick=()=>{writeCurrent();toast('تم حفظ المستند في هذا المتصفح')};$('docTitle').addEventListener('input',delayedSave);editor.addEventListener('input',delayedSave);
function command(cmd,val){editor.focus();document.execCommand(cmd,false,val);delayedSave()}
document.querySelectorAll('[data-cmd]').forEach(b=>b.addEventListener('click',()=>command(b.dataset.cmd,null)));$('blockType').onchange=e=>command('formatBlock',e.target.value);$('fontName').onchange=e=>command('fontName',e.target.value);$('fontSize').onchange=e=>command('fontSize',e.target.value);$('textColor').oninput=e=>command('foreColor',e.target.value);$('rtlBtn').onclick=()=>{editor.dir='rtl';toast('اتجاه عربي')};$('ltrBtn').onclick=()=>{editor.dir='ltr';toast('English direction')};
$('addTable').onclick=()=>command('insertHTML','<table><tbody><tr><td>العمود الأول</td><td>العمود الثاني</td></tr><tr><td>المحتوى</td><td>المحتوى</td></tr></tbody></table><p></p>');$('addImage').onclick=()=>$('imageInput').click();$('imageInput').onchange=e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>1200000){toast('اختار صورة أقل من 1.2 ميجابايت لتجنب امتلاء مساحة الحفظ');return}const r=new FileReader();r.onload=()=>command('insertImage',r.result);r.readAsDataURL(f);e.target.value=''};
function download(name,body,type){const blob=new Blob([body],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000)}
function cleanName(s){return(s||'مستند').replace(/[\\/:*?"<>|]/g,'-').slice(0,80)}
$('downloadHtml').onclick=()=>{writeCurrent();download(cleanName($('docTitle').value)+'.html','<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><title>'+safeText($('docTitle').value)+'</title><body style="font-family:Tahoma,Arial;line-height:1.8">'+stripUnsafe(editor.innerHTML)+'</body></html>','text/html;charset=utf-8');toast('تم تنزيل نسخة HTML')};
$('pdfBtn').onclick=()=>{writeCurrent();toast('اختار Save as PDF من نافذة الطباعة');window.print()};$('importBtn').onclick=()=>$('fileImport').click();$('fileImport').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>2000000){toast('الملف كبير جدًا');return}const content=await f.text();newDocument();$('docTitle').value=f.name.replace(/\.(txt|html?)$/i,'');editor.innerHTML=/\.txt$/i.test(f.name)?'<p>'+safeText(content).replace(/\n/g,'<br>')+'</p>':stripUnsafe(content.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1]||content);writeCurrent();e.target.value='';toast('تم الاستيراد')};
$('generate').onclick=async()=>{
 const topic=$('topic').value.trim();if(!topic)return toast('اكتب طلبك أولًا');
 const endpoint=(window.LOLO_CONFIG?.geminiEndpoint||'').trim();
 if(!/^https:\/\//.test(endpoint)){$('aiStatus').textContent='يلزم إعداد رابط خدمة Gemini أولًا (config.js).';return}
 const btn=$('generate');btn.disabled=true;btn.textContent='جارٍ كتابة المحتوى...';$('aiStatus').textContent='جاري الاتصال بـ Gemini...';
 try{
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),65000);
 let response;
 try{response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:topic,mode:$('mode').value}),signal:controller.signal})}finally{clearTimeout(timeout)}
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(data.error||('تعذّر الاتصال: HTTP '+response.status));
 if(typeof data.text!=='string'||!data.text.trim())throw new Error('Gemini لم يرجع نصًا. جرّب مرة أخرى.');
 $('result').value=data.text;$('aiStatus').textContent='تم إنشاء المحتوى بنجاح.';
 }catch(e){$('aiStatus').textContent=e.name==='AbortError'?'انتهت مهلة الاتصال. حاول مرة أخرى.':'تعذّر توليد المحتوى: '+e.message}
 finally{btn.disabled=false;btn.textContent='✨ اكتب باستخدام Gemini'}
};
$('copyResult').onclick=async()=>{const value=$('result').value;if(!value)return toast('أنشئ محتوى أولًا');try{await navigator.clipboard.writeText(value);toast('تم النسخ')}catch{$('result').select();document.execCommand('copy');toast('تم نسخ النص')}};
$('insertResult').onclick=()=>{const value=$('result').value.trim();if(!value)return toast('أنشئ محتوى أولًا');editor.focus();document.execCommand('insertHTML',false,'<p>'+safeText(value).replace(/\n/g,'<br>')+'</p>');delayedSave();toast('تمت الإضافة للمستند')};
window.addEventListener('beforeunload',()=>{if(active)writeCurrent()});
