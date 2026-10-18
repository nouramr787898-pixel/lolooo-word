'use strict';
const $=id=>document.getElementById(id);const editor=$('editor');const LEGACY_KEY='lolo_word_docs_v1';let profile=null;let KEY=null;let docs=[];let active=null;let autosaveTimer;const defaultHTML=editor.innerHTML;
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500)}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function safeText(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function stripUnsafe(html){const template=document.createElement('template');template.innerHTML=html;template.content.querySelectorAll('script,iframe,object,embed,form,link,meta,style').forEach(n=>n.remove());template.content.querySelectorAll('*').forEach(n=>{[...n.attributes].forEach(a=>{if(/^on/i.test(a.name)||(/^(href|src)$/i.test(a.name)&&/^(javascript:|data:text\/html)/i.test(a.value)))n.removeAttribute(a.name)})});return template.innerHTML}
function persist(){if(!KEY)return false;try{localStorage.setItem(KEY,JSON.stringify(docs));$('status').textContent='تم الحفظ ✓';return true}catch(e){$('status').textContent='تعذّر الحفظ: المساحة ممتلئة';toast('تعذّر الحفظ المحلي؛ تأكدي من مساحة المتصفح ونزّلي PDF للاحتفاظ بنسخة.');return false}}
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
document.querySelectorAll('[data-profile]').forEach(b=>b.onclick=()=>requestProfile(b.dataset.profile));
$('switchProfile').onclick=()=>{if(active)writeCurrent();$('profileGate').hidden=false};
$('migrateLegacy').onclick=()=>{if(!profile)return;let old=[];try{old=JSON.parse(localStorage.getItem(LEGACY_KEY)||'[]')}catch{};if(!Array.isArray(old)||!old.length)return toast('لا توجد مستندات قديمة على هذا المتصفح');if(!confirm('هل تريد نسخ مستندات النسخة القديمة إلى حساب '+profile+'؟'))return;const existing=new Set(docs.map(d=>d.id));let count=0;for(const d of old){if(d&&typeof d.html==='string'&&typeof d.id==='string'&&!existing.has(d.id)){docs.push({...d,id:uid(),html:stripUnsafe(d.html)});count++}}persist();renderDocs();toast('تم استرجاع '+count+' مستندات. النسخة القديمة ما زالت محفوظة.')};


$('newDoc').onclick=newDocument;$('saveDoc').onclick=()=>{writeCurrent();toast('تم حفظ المستند في هذا المتصفح')};$('docTitle').addEventListener('input',delayedSave);editor.addEventListener('input',delayedSave);
function command(cmd,val){editor.focus();document.execCommand(cmd,false,val);delayedSave()}
document.querySelectorAll('[data-cmd]').forEach(b=>b.addEventListener('click',()=>command(b.dataset.cmd,null)));$('blockType').onchange=e=>command('formatBlock',e.target.value);$('fontName').onchange=e=>command('fontName',e.target.value);$('fontSize').onchange=e=>command('fontSize',e.target.value);$('textColor').oninput=e=>command('foreColor',e.target.value);$('rtlBtn').onclick=()=>{editor.dir='rtl';toast('اتجاه عربي')};$('ltrBtn').onclick=()=>{editor.dir='ltr';toast('English direction')};
$('addTable').onclick=()=>command('insertHTML','<table><tbody><tr><td>العمود الأول</td><td>العمود الثاني</td></tr><tr><td>المحتوى</td><td>المحتوى</td></tr></tbody></table><p></p>');$('addImage').onclick=()=>$('imageInput').click();$('imageInput').onchange=e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>1200000){toast('اختار صورة أقل من 1.2 ميجابايت لتجنب امتلاء مساحة الحفظ');return}const r=new FileReader();r.onload=()=>command('insertImage',r.result);r.readAsDataURL(f);e.target.value=''};
function download(name,body,type){const blob=new Blob([body],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000)}
function cleanName(s){return(s||'مستند').replace(/[\\/:*?"<>|]/g,'-').slice(0,80)}
// PDF direct download (no browser print dialog)
$('pdfBtn').onclick=async()=>{
  if(!active)return toast('افتحي مستندًا أولًا');
  writeCurrent();
  const btn=$('pdfBtn');const previous=btn.innerHTML;
  btn.disabled=true;btn.textContent='⏳ جارٍ تجهيز PDF...';
  let page;
  try{
    if(typeof window.html2pdf!=='function')throw new Error('مكتبة PDF لم تُحمّل؛ تأكدي من الإنترنت ثم أعيدي المحاولة.');
    page=document.createElement('div');page.className='pdf-export-page';
    page.dir=editor.dir||'rtl';
    page.style.cssText='width:700px;padding:32px 34px;background:white;color:#172344;font-family:Tahoma,Arial,sans-serif;line-height:1.85;box-sizing:border-box;';
    const title=document.createElement('h1');title.textContent=$('docTitle').value||'مستند';
    title.style.cssText='font-size:22px;margin:0 0 18px;text-align:center;overflow-wrap:anywhere;';
    const body=document.createElement('div');body.innerHTML=stripUnsafe(editor.innerHTML);
    body.style.cssText='font-size:15px;overflow-wrap:anywhere;';
    page.append(title,body);document.body.append(page);
    const filename=cleanName($('docTitle').value)+'.pdf';
    await window.html2pdf().set({
      margin: [8,8,8,8],filename,
      image:{type:'jpeg',quality:0.98},
      html2canvas:{scale:2,useCORS:true,backgroundColor:'#ffffff',scrollY:0,windowWidth:1000},
      jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},
      pagebreak:{mode:['css','legacy']}
    }).from(page).save();
    toast('تم تجهيز ملف PDF للتنزيل ✓');
  }catch(err){console.error(err);toast(err.message||'تعذّر تنزيل PDF، جرّبي مرة أخرى.');}
  finally{page?.remove();btn.disabled=false;btn.innerHTML=previous;}
};
$('generate').onclick=async()=>{
 const topic=$('topic').value.trim();if(!topic)return toast('اكتب طلبك أولًا');
 const endpoint=(window.LOLO_CONFIG?.geminiEndpoint||'').trim();
 if(!/^https:\/\//.test(endpoint)){$('aiStatus').textContent='يلزم إعداد رابط خدمة Gemini أولًا (config.js).';return}
 const btn=$('generate');btn.disabled=true;btn.textContent='جارٍ كتابة المحتوى...';$('aiStatus').textContent='جاري إعداد المحتوى بواسطة Nour Ai...';
 try{
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),65000);
 let response;
 try{response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:topic,mode:$('mode').value}),signal:controller.signal})}finally{clearTimeout(timeout)}
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(data.error||('تعذّر الاتصال: HTTP '+response.status));
 if(typeof data.text!=='string'||!data.text.trim())throw new Error('لم يتم إرجاع نص. جرّب مرة أخرى.');
 $('result').value=data.text;$('aiStatus').textContent='تم إنشاء المحتوى بنجاح.';
 }catch(e){$('aiStatus').textContent=e.name==='AbortError'?'انتهت مهلة الاتصال. حاول مرة أخرى.':'تعذّر توليد المحتوى: '+e.message}
 finally{btn.disabled=false;btn.innerHTML='<span class="icon" data-icon="wand-sparkles"></span> ✨ اكتب باستخدام Nour Ai';applyIcons(btn)}
};
$('copyResult').onclick=async()=>{const value=$('result').value;if(!value)return toast('أنشئ محتوى أولًا');try{await navigator.clipboard.writeText(value);toast('تم النسخ')}catch{$('result').select();document.execCommand('copy');toast('تم نسخ النص')}};
$('insertResult').onclick=()=>{const value=$('result').value.trim();if(!value)return toast('أنشئ محتوى أولًا');editor.focus();document.execCommand('insertHTML',false,'<p>'+safeText(value).replace(/\n/g,'<br>')+'</p>');delayedSave();toast('تمت الإضافة للمستند')};
window.addEventListener('beforeunload',()=>{if(active)writeCurrent()});

// Interactive profile greetings and lightweight UI icons (all local, no external icon library)
const ICON_PATHS={
'sparkles':'<path d="m12 3 1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9L12 3Z"/><path d="m19 17 .7 1.3L21 19l-1.3.7L19 21l-.7-1.3L17 19l1.3-.7L19 17Z"/>',
'heart':'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
'sun':'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>',
'smile':'<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01M15 9h.01"/>',
'file-plus-2':'<path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v18Z"/><path d="M14 2v6h6M12 12v6m-3-3h6"/>',
'save':'<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M7 3v6h10V3M7 21v-8h10v8"/>',
'users':'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
'file-down':'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M12 12v7m-4-4 4 4 4-4"/>',
'download':'<path d="M12 3v12m-4-4 4 4 4-4M5 17v4h14v-4"/>',
'upload':'<path d="M12 16V4m-4 4 4-4 4 4M4 17v4h16v-4"/>',
'archive-restore':'<rect x="3" y="3" width="18" height="5" rx="1"/><path d="M5 8v12h14V8M9 14a3 3 0 1 1 3 3h-2m0 0 2-2m-2 2 2 2"/>',
'copy':'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
'file-input':'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M2 15h12m-3-3 3 3-3 3"/>',
'image':'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
'table-2':'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/>',
'wand-sparkles':'<path d="m3 21 11-11m-7-7 1 2m7-2-1 2m6 7-2-1M5 11l-2-1m8 8 2 2M15 7l2 2"/><path d="m12 5 7 7"/>',
'align-right':'<path d="M4 6h16M10 10h10M4 14h16M10 18h10"/>',
'align-left':'<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>',
'folder-open':'<path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v3"/><path d="M3 10h18l-3 10H6L3 10Z"/>',
'notebook-pen':'<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 2v20m3-15h6m-6 4h4m-3 7 6-6"/>',
'arrow-left':'<path d="m12 19-7-7 7-7M5 12h14"/>',
'lock-keyhole':'<rect x="4" y="10" width="16" height="12" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 15v3"/>',
'unlock-keyhole':'<rect x="4" y="10" width="16" height="12" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0M12 15v3"/>'};
function applyIcons(scope=document){scope.querySelectorAll('[data-icon]').forEach(el=>{const markup=ICON_PATHS[el.dataset.icon];if(!markup)return;el.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round">'+markup+'</svg>'})}
let pendingProfile='';
function requestProfile(name){if(name==='أسماء'){$('passwordError').textContent='';$('profilePassword').value='';$('passwordOverlay').hidden=false;$('profilePassword').focus();pendingProfile=name}else{finishProfile(name)}}
$('passwordForm').addEventListener('submit',e=>{e.preventDefault();if($('profilePassword').value!=='na'){$('passwordError').textContent='كلمة السر غير صحيحة، جربي مرة تانية';return}$('passwordOverlay').hidden=true;finishProfile('أسماء')});
$('cancelPassword').onclick=()=>{$('passwordOverlay').hidden=true;$('profilePassword').value=''};
const greetings={
'أسماء':{title:'أهلًا بيكي يا لولوووو يا حبيبتي 💜',subtitle:'بحبكك يا حبيبتي ❤️',emoji:'🎆'},
'حماتي':{title:'أهلًا وسهلًا! 💐',subtitle:'حماتك في عينك 😄',emoji:'🎉'},
'جودي':{title:'أهلًا يا جوجوووو! 🎀',subtitle:'نورتي لولووو وورد يا جوجو',emoji:'🥳'},
'حبيبة':{title:'أهلًا بيكي يا حبيبة! 💗',subtitle:'حبيبة ولا بيبه بقى المرة دي؟ 😂',emoji:'😆'}};
function finishProfile(name){startProfile(name);const msg=greetings[name];$('welcomeTitle').textContent=msg.title;$('welcomeSubtitle').textContent=msg.subtitle;$('welcomeEmoji').textContent=msg.emoji;const c=$('confetti');c.replaceChildren();for(let i=0;i<28;i++){let s=document.createElement('span');s.style.setProperty('--x',(i*37%100)+'%');s.style.setProperty('--delay',(i*71%850)+'ms');s.style.setProperty('--color',['#3055c7','#c047bf','#e9a7ed','#8d62d6','#ffc361'][i%5]);c.appendChild(s)}$('welcomeOverlay').hidden=false}
$('welcomeContinue').onclick=()=>{$('welcomeOverlay').hidden=true;editor.focus()};
applyIcons();

// Study-break section: same Gemini Worker endpoint; no public API key
const jokeButton=$('breakJokeBtn');
if(jokeButton)jokeButton.addEventListener('click',async()=>{
  const endpoint=(window.LOLO_CONFIG?.geminiEndpoint||'').trim();
  const status=$('breakJokeStatus'),output=$('breakJokeResult');
  if(!/^https:\/\//.test(endpoint)){status.textContent='Nour Ai مش متصل حاليًا.';return;}
  jokeButton.disabled=true;status.textContent='Nour Ai بيحضّر نكتة خفيفة...';
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),45000);
  try{
    const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({prompt:'قول نكتة عربية مصرية قصيرة ولطيفة مناسبة للطلاب عن المذاكرة أو الكتب، بدون تجريح أو ألفاظ غير لائقة. اكتب النكتة فقط.'}),signal:ctrl.signal});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw Error(data.error||'تعذر الحصول على النكتة');
    output.textContent=data.text?.trim()||'جربي مرة تانية 😄';status.textContent='';
  }catch(e){status.textContent=e.name==='AbortError'?'الطلب استغرق وقتًا طويلًا، جربي مرة أخرى.':'تعذّر الاتصال الآن؛ جربي بعد شوية.';}
  finally{clearTimeout(timer);jokeButton.disabled=false;}
});
