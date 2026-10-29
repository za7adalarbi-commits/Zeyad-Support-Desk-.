/* Zeyad Support Desk - client. No credentials are shipped in this file. */
const I18N = {
  ar: {
    appName:"Zeyad Support Desk", tagline:"مفكرة المكالمات والشكاوى والمتابعات", notConfigured:"غير مربوط بعد", connected:"متصل", settings:"الإعدادات",
    personalWorkspace:"مساحة عمل شخصية", heroTitle:"كل مكالمة، متابعة، وشكوى في مكان واحد.", heroText:"سجّل التفاصيل، حدّد موعد المتابعة، وصدّر تقرير المشكلة PDF عند الحاجة.", newEntry:"إضافة سجل",
    totalRecords:"إجمالي السجلات", allCallsAndCases:"مكالمات وشكاوى", openCases:"شكاوى مفتوحة", needFollowUp:"تحتاج متابعة", dueToday:"متابعات اليوم", remindersScheduled:"مواعيد متابعة مسجلة", overdue:"متابعات متأخرة", pastDue:"تجاوزت موعدها",
    searchPlaceholder:"ابحث بالعميل أو رقم الحجز أو الهاتف", allStatuses:"كل الحالات", statusNew:"جديدة", statusProgress:"قيد المتابعة", statusRental:"بانتظار شركة التأجير", statusCustomer:"بانتظار العميل", statusEscalated:"تحتاج تصعيد", statusResolved:"تم الحل",
    refresh:"تحديث", recordsTitle:"السجلات والمتابعات", recordsSubtitle:"اضغط على أي سجل لعرض تفاصيله.", loading:"جاري تحميل السجلات…", detailsTitle:"تفاصيل السجل", detailsSubtitle:"التحديثات بترتيبها الزمني.", chooseRecord:"اختر سجلًا من القائمة أو أضف سجلًا جديدًا.",
    privacyNote:"تنبيه: لا تستخدم بيانات عملاء حقيقية قبل موافقة شركتك على طريقة التخزين وصلاحيات الوصول.", settingsTitle:"إعدادات الربط", settingsDescription:"أدخل رابط تطبيق Google Apps Script ورمز الوصول. لن يتم تضمينهما في ملفات GitHub.", scriptUrl:"رابط تطبيق Apps Script المنشور", accessToken:"رمز الوصول الشخصي", tokenNotice:"الرابط والرمز يُحفظان في هذا المتصفح فقط. لا تضع الرمز داخل ملفات المشروع أو المستودع.", clearSettings:"مسح الإعدادات", saveSettings:"حفظ الإعدادات",
    newRecordTitle:"إضافة سجل جديد", editRecordTitle:"تعديل السجل", recordFormSubtitle:"سجّل بيانات الحجز والمكالمة والمتابعة القادمة.", recordType:"نوع السجل", callNote:"مذكرة مكالمة", complaint:"شكوى / مشكلة", customerName:"اسم العميل", customerPhone:"رقم العميل", bookingNumber:"رقم الحجز", identityNumber:"رقم الهوية (اختياري)", rentalCompany:"شركة التأجير", branchName:"اسم الفرع", deliveryDate:"تاريخ تسليم السيارة", status:"حالة المشكلة", reminderDate:"موعد التذكير", reminderEmail:"إيميل التذكير", issueTitle:"عنوان المشكلة / المكالمة", issueDetails:"تفاصيل المشكلة أو المكالمة", actionTaken:"الإجراء اللي اتعمل", nextAction:"المطلوب في المتابعة القادمة", updateNote:"ملاحظة / تحديث جديد (يُضاف للتاريخ)", cancel:"إلغاء", saveRecord:"حفظ السجل",
    noRecords:"لا توجد سجلات حتى الآن. أضف أول مكالمة أو شكوى.", noMatch:"لا توجد نتائج مطابقة.", call:"مكالمة", case:"شكوى", booking:"الحجز", phone:"الهاتف", company:"شركة التأجير", branch:"الفرع", delivery:"تسليم السيارة", reminder:"موعد المتابعة", reminderEmailLabel:"إيميل التذكير", issue:"التفاصيل", action:"الإجراء المتخذ", next:"الخطوة القادمة", history:"سجل التحديثات", created:"تم إنشاء السجل", updated:"تم تحديث السجل", edit:"تعديل", exportPdf:"تصدير PDF", delete:"حذف", deleteConfirm:"هل تريد حذف هذا السجل نهائيًا؟", saveSuccess:"تم حفظ السجل.", deleteSuccess:"تم حذف السجل.", settingsSaved:"تم حفظ الإعدادات.", settingsCleared:"تم مسح الإعدادات.", needSettings:"أدخل رابط Apps Script ورمز الوصول من الإعدادات أولًا.", connectionError:"تعذر الاتصال. راجع الرابط والرمز وإعدادات النشر.", saving:"جاري الحفظ…", loadingError:"تعذر تحميل السجلات.", localMode:"وضع تجريبي محلي", due:"مستحق اليوم", overdueLabel:"متأخر", noReminder:"لا يوجد موعد متابعة", pdfTitle:"تقرير تفاصيل المشكلة", generated:"تاريخ إنشاء التقرير", notSet:"غير محدد", reminderSaved:"تم تسجيل موعد المتابعة. يجب تفعيل المشغّل في Apps Script لإرسال البريد تلقائيًا.", reminderNoEmail:"أضف بريدًا إلكترونيًا لتلقي التذكير.", fillRequired:"يرجى تعبئة اسم العميل وعنوان السجل والتفاصيل.", confirmDelete:"تأكيد حذف السجل"
  },
  en: {
    appName:"Zeyad Support Desk", tagline:"Calls, cases and follow-up notebook", notConfigured:"Not connected", connected:"Connected", settings:"Settings",
    personalWorkspace:"PERSONAL WORKSPACE", heroTitle:"Every call, follow-up and case in one place.", heroText:"Capture details, schedule follow-ups and export a case report as PDF.", newEntry:"Add record",
    totalRecords:"Total records", allCallsAndCases:"Calls and cases", openCases:"Open cases", needFollowUp:"Need follow-up", dueToday:"Due today", remindersScheduled:"Scheduled follow-ups", overdue:"Overdue", pastDue:"Past their due time",
    searchPlaceholder:"Search customer, booking or phone", allStatuses:"All statuses", statusNew:"New", statusProgress:"In progress", statusRental:"Waiting rental company", statusCustomer:"Waiting customer", statusEscalated:"Escalated", statusResolved:"Resolved",
    refresh:"Refresh", recordsTitle:"Records & follow-ups", recordsSubtitle:"Select a record to view details.", loading:"Loading records…", detailsTitle:"Record details", detailsSubtitle:"Updates in chronological order.", chooseRecord:"Choose a record or add a new one.",
    privacyNote:"Important: Do not enter real customer data until your company approves the storage method and access controls.", settingsTitle:"Connection settings", settingsDescription:"Enter your deployed Google Apps Script URL and access token. They are not included in GitHub files.", scriptUrl:"Deployed Apps Script URL", accessToken:"Personal access token", tokenNotice:"The URL and token are saved only in this browser. Never place the token in project files or the repository.", clearSettings:"Clear settings", saveSettings:"Save settings",
    newRecordTitle:"Add a new record", editRecordTitle:"Edit record", recordFormSubtitle:"Add booking, call and next follow-up details.", recordType:"Record type", callNote:"Call note", complaint:"Complaint / case", customerName:"Customer name", customerPhone:"Customer phone", bookingNumber:"Booking number", identityNumber:"National ID (optional)", rentalCompany:"Rental company", branchName:"Branch name", deliveryDate:"Car delivery date", status:"Case status", reminderDate:"Reminder date & time", reminderEmail:"Reminder email", issueTitle:"Issue / call title", issueDetails:"Issue or call details", actionTaken:"Action taken", nextAction:"Next follow-up action", updateNote:"New note / update (added to history)", cancel:"Cancel", saveRecord:"Save record",
    noRecords:"No records yet. Add your first call or case.", noMatch:"No matching records.", call:"Call", case:"Case", booking:"Booking", phone:"Phone", company:"Rental company", branch:"Branch", delivery:"Car delivery", reminder:"Follow-up", reminderEmailLabel:"Reminder email", issue:"Details", action:"Action taken", next:"Next step", history:"Update history", created:"Record created", updated:"Record updated", edit:"Edit", exportPdf:"Export PDF", delete:"Delete", deleteConfirm:"Delete this record permanently?", saveSuccess:"Record saved.", deleteSuccess:"Record deleted.", settingsSaved:"Settings saved.", settingsCleared:"Settings cleared.", needSettings:"Add the Apps Script URL and access token in Settings first.", connectionError:"Could not connect. Check URL, token and deployment settings.", saving:"Saving…", loadingError:"Could not load records.", localMode:"Local demo mode", due:"Due today", overdueLabel:"Overdue", noReminder:"No follow-up scheduled", pdfTitle:"Case details report", generated:"Report generated", notSet:"Not set", reminderSaved:"Follow-up saved. Enable the Apps Script trigger to send email automatically.", reminderNoEmail:"Add an email address to receive reminders.", fillRequired:"Please enter customer name, record title and details.", confirmDelete:"Confirm delete"
  }
};
const $ = id => document.getElementById(id);
const fields = ["recordType","customerName","customerPhone","bookingNumber","identityNumber","rentalCompany","branchName","deliveryDate","status","reminderAt","reminderEmail","issueTitle","issueDetails","actionTaken","nextAction"];
let lang = localStorage.getItem("zsd_lang") || "ar";
let records = [];
let selectedId = null;
let busy = false;
const cfg = {
  get url(){return sessionStorage.getItem("zsd_script_url") || "";},
  get token(){return sessionStorage.getItem("zsd_access_token") || "";}
};
function t(key){return (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;}
function applyLanguage(){
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.querySelectorAll("[data-i18n]").forEach(el => {const key=el.dataset.i18n; if(I18N[lang][key]) el.textContent=I18N[lang][key];});
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {el.placeholder=t(el.dataset.i18nPlaceholder);});
  $("languageToggle").textContent = lang === "ar" ? "English" : "العربية";
  $("connectionStatus").textContent = cfg.url && cfg.token ? t("connected") : t("notConfigured");
  $("recordDialogTitle").textContent = $("recordId").value ? t("editRecordTitle") : t("newRecordTitle");
  renderRecords(); renderDetails();
}
function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),3200);}
function esc(s){return String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function fmtDate(v){if(!v)return t("notSet");const d=new Date(v);if(Number.isNaN(d.getTime()))return String(v);return new Intl.DateTimeFormat(lang==="ar"?"ar-EG":"en-GB",{dateStyle:"medium",timeStyle: v.includes("T")?"short":undefined}).format(d);}
function statusLabel(s){const map={"New":"statusNew","In progress":"statusProgress","Waiting rental company":"statusRental","Waiting customer":"statusCustomer","Escalated":"statusEscalated","Resolved":"statusResolved"};return t(map[s]||s||"statusNew");}
function typeLabel(s){return s==="Complaint"?t("case"):t("call");}
function isOpen(r){return r.status!=="Resolved";}
function reminderTime(r){if(!r.reminderAt)return null;const d=new Date(r.reminderAt);return Number.isNaN(d.getTime())?null:d;}
function updateStats(){
  const now=new Date(), today=now.toISOString().slice(0,10);
  $("statTotal").textContent=records.length;
  $("statOpen").textContent=records.filter(isOpen).length;
  $("statDue").textContent=records.filter(r=>{const d=reminderTime(r);return d&&d.toISOString().slice(0,10)===today&&isOpen(r);}).length;
  $("statOverdue").textContent=records.filter(r=>{const d=reminderTime(r);return d&&d<now&&isOpen(r);}).length;
  $("recordCount").textContent=records.length;
}
function filteredRecords(){
  const q=$("searchInput").value.trim().toLocaleLowerCase();
  const s=$("statusFilter").value;
  return records.filter(r=>(s==="all"||r.status===s)&&(!q||[r.customerName,r.customerPhone,r.bookingNumber,r.issueTitle,r.rentalCompany].some(x=>String(x||"").toLocaleLowerCase().includes(q)))).sort((a,b)=>new Date(b.updatedAt||b.createdAt||0)-new Date(a.updatedAt||a.createdAt||0));
}
function renderRecords(){
  if(!$("recordsList"))return;
  const list=filteredRecords();
  if(!records.length){$("recordsList").innerHTML=`<div class="empty-state">${esc(t("noRecords"))}</div>`;return;}
  if(!list.length){$("recordsList").innerHTML=`<div class="empty-state">${esc(t("noMatch"))}</div>`;return;}
  $("recordsList").innerHTML=list.map(r=>`<article class="record-item ${r.id===selectedId?"selected":""}" data-id="${esc(r.id)}" tabindex="0" role="button">
    <div class="record-top"><div><h4>${esc(r.issueTitle||t("notSet"))}</h4><div class="record-meta"><span>${esc(r.customerName||"")}</span><span>${esc(t("booking"))}: ${esc(r.bookingNumber||"—")}</span><span>${esc(typeLabel(r.recordType))}</span></div></div><span class="status-badge ${esc(r.status||"New")}">${esc(statusLabel(r.status))}</span></div>
    <p class="record-preview">${esc(r.issueDetails||"")}</p>
    <div class="record-meta"><span>${esc(fmtDate(r.updatedAt||r.createdAt||""))}</span><span>${r.reminderAt?`◷ ${esc(fmtDate(r.reminderAt))}`:esc(t("noReminder"))}</span></div></article>`).join("");
  $("recordsList").querySelectorAll(".record-item").forEach(el=>{const pick=()=>{selectedId=el.dataset.id;renderRecords();renderDetails();};el.addEventListener("click",pick);el.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();pick();}});});
}
function selectedRecord(){return records.find(r=>r.id===selectedId);}
function renderDetails(){
  const r=selectedRecord(), box=$("detailView");
  if(!r){box.className="detail-empty";box.innerHTML=`<span class="empty-icon">▤</span><p>${esc(t("chooseRecord"))}</p>`;return;}
  box.className="detail-body";
  const facts=[[t("phone"),r.customerPhone],[t("booking"),r.bookingNumber],[t("company"),r.rentalCompany],[t("branch"),r.branchName],[t("delivery"),r.deliveryDate?fmtDate(r.deliveryDate):""],[t("reminder"),r.reminderAt?fmtDate(r.reminderAt):""],[t("reminderEmailLabel"),r.reminderEmail]];
  const history=(r.history||[]).slice().sort((a,b)=>new Date(a.at)-new Date(b.at));
  box.innerHTML=`<div class="detail-actions"><button class="btn btn-secondary" id="editSelected">${esc(t("edit"))}</button><button class="btn btn-secondary" id="pdfSelected">${esc(t("exportPdf"))}</button><button class="btn btn-secondary danger" id="deleteSelected">${esc(t("delete"))}</button></div>
    <h2 class="detail-title" style="margin-top:16px">${esc(r.issueTitle||"")}</h2><div class="detail-meta"><span class="status-badge ${esc(r.status||"New")}">${esc(statusLabel(r.status))}</span><span class="status-badge">${esc(typeLabel(r.recordType))}</span><span class="record-meta">${esc(r.customerName||"")}</span></div>
    <div class="facts-grid">${facts.map(([k,v])=>`<div class="fact"><span>${esc(k)}</span><strong>${esc(v||"—")}</strong></div>`).join("")}</div>
    <section class="detail-section"><h4>${esc(t("issue"))}</h4><p>${esc(r.issueDetails||"—")}</p></section>
    <section class="detail-section"><h4>${esc(t("action"))}</h4><p>${esc(r.actionTaken||"—")}</p></section>
    <section class="detail-section"><h4>${esc(t("next"))}</h4><p>${esc(r.nextAction||"—")}</p></section>
    <section class="detail-section"><h4>${esc(t("history"))}</h4><div class="timeline">${history.length?history.map(h=>`<div class="timeline-item"><div class="timeline-date">${esc(fmtDate(h.at))} · ${esc(h.kind==="created"?t("created"):t("updated"))}</div><div class="timeline-text">${esc(h.note||"")}</div></div>`).join(""):`<p class="muted">${esc(t("notSet"))}</p>`}</div></section>`;
  $("editSelected").onclick=()=>openRecordForm(r);
  $("pdfSelected").onclick=()=>exportPdf(r);
  $("deleteSelected").onclick=()=>deleteRecord(r);
}
function openRecordForm(r=null){
  $("recordForm").reset();
  $("recordId").value=r?.id||"";
  $("recordDialogTitle").textContent=r?t("editRecordTitle"):t("newRecordTitle");
  fields.forEach(k=>{if(r&&r[k]!==undefined)$(k).value=r[k]??"";});
  $("updateNote").value="";
  $("recordDialog").showModal();
}
function readForm(){
  const r={};fields.forEach(k=>r[k]=$(k).value.trim());
  r.id=$("recordId").value||crypto.randomUUID();
  r.updatedAt=new Date().toISOString();
  return r;
}
async function api(action,payload={}){
  if(!cfg.url||!cfg.token)throw new Error("SETTINGS");
  const url=cfg.url;
  if(action==="list"){
    return new Promise((resolve,reject)=>{
      const callback="zsd_cb_"+Math.random().toString(36).slice(2);
      const script=document.createElement("script");
      const timer=setTimeout(()=>{cleanup();reject(new Error("TIMEOUT"));},20000);
      function cleanup(){clearTimeout(timer);delete window[callback];script.remove();}
      window[callback]=(result)=>{cleanup();if(result&&result.ok)resolve(result.data||[]);else reject(new Error(result?.error||"API"));};
      script.onerror=()=>{cleanup();reject(new Error("NETWORK"));};
      script.src=url+"?action=list&token="+encodeURIComponent(cfg.token)+"&callback="+callback+"&_="+Date.now();
      document.body.appendChild(script);
    });
  }
  // Writes use a hidden form POST to avoid browser preflight. Response is intentionally not read.
  return new Promise((resolve,reject)=>{
    const iframe=document.createElement("iframe");
    const target="zsd_frame_"+Math.random().toString(36).slice(2);
    iframe.name=target;iframe.style.display="none";document.body.appendChild(iframe);
    const form=document.createElement("form");form.method="POST";form.action=url;form.target=target;form.style.display="none";
    const data={action,token:cfg.token,payload:JSON.stringify(payload)};
    Object.entries(data).forEach(([name,value])=>{const input=document.createElement("input");input.type="hidden";input.name=name;input.value=value;form.appendChild(input);});
    document.body.appendChild(form);form.submit();form.remove();
    setTimeout(()=>{iframe.remove();resolve({ok:true});},1800);
  });
}
async function loadRecords(){
  if(!cfg.url||!cfg.token){records=[];updateStats();renderRecords();renderDetails();$("connectionStatus").textContent=t("notConfigured");return;}
  $("connectionStatus").textContent=t("loading");
  try{records=await api("list");$("connectionStatus").textContent=t("connected");updateStats();renderRecords();renderDetails();}
  catch(e){$("connectionStatus").textContent=t("notConfigured");toast(t(e.message==="SETTINGS"?"needSettings":"loadingError"));records=[];updateStats();renderRecords();renderDetails();}
}
async function saveRecord(){
  if(busy)return;
  const r=readForm();
  if(!r.customerName||!r.issueTitle||!r.issueDetails){toast(t("fillRequired"));return;}
  if(!cfg.url||!cfg.token){toast(t("needSettings"));return;}
  busy=true;$("saveRecordBtn").disabled=true;$("saveRecordBtn").textContent=t("saving");
  const old=records.find(x=>x.id===r.id);
  const note=$("updateNote").value.trim();
  r.createdAt=old?.createdAt||new Date().toISOString();
  r.history=old?.history||[];
  if(!old)r.history.push({at:r.createdAt,kind:"created",note:`${t("created")}: ${r.issueTitle}`});
  if(note)r.history.push({at:new Date().toISOString(),kind:"updated",note});
  else if(old)r.history.push({at:new Date().toISOString(),kind:"updated",note:r.actionTaken||r.nextAction||t("updated")});
  try{
    await api(old?"update":"create",r);
    $("recordDialog").close();selectedId=r.id;
    // Wait for Apps Script write to complete before reading fresh data.
    setTimeout(()=>loadRecords(),1000);
    toast(r.reminderAt&&r.reminderEmail?t("reminderSaved"):t("saveSuccess"));
  }catch(e){toast(t("connectionError"));}
  finally{busy=false;$("saveRecordBtn").disabled=false;$("saveRecordBtn").textContent=t("saveRecord");}
}
async function deleteRecord(r){
  if(!confirm(t("deleteConfirm")))return;
  try{await api("delete",{id:r.id});selectedId=null;setTimeout(()=>loadRecords(),1000);toast(t("deleteSuccess"));}
  catch(e){toast(t("connectionError"));}
}
function exportPdf(r){
  const history=(r.history||[]).slice().sort((a,b)=>new Date(a.at)-new Date(b.at));
  const html=`<!doctype html><html lang="${lang}" dir="${lang==="ar"?"rtl":"ltr"}"><head><meta charset="utf-8"><title>${esc(t("pdfTitle"))}</title><style>
  body{font-family:Arial,sans-serif;color:#172b3d;padding:28px;line-height:1.55}h1{font-size:23px;color:#10243a;border-bottom:3px solid #0d9488;padding-bottom:12px}h2{font-size:17px;margin-top:22px;color:#0d7169}.meta{color:#66798a;font-size:12px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.item{border:1px solid #dfe7ee;border-radius:7px;padding:9px}.label{font-size:11px;color:#66798a}.value{font-size:13px;white-space:pre-wrap;overflow-wrap:anywhere}.section{border-top:1px solid #dfe7ee;padding-top:10px;margin-top:15px}.history{border-inline-start:2px solid #0d9488;padding-inline-start:12px;margin-top:10px}.event{margin:0 0 13px}.date{font-size:11px;color:#66798a}.note{white-space:pre-wrap;font-size:13px}@media print{body{padding:0}.no-print{display:none}}</style></head><body>
  <h1>${esc(t("pdfTitle"))}</h1><p class="meta">${esc(t("generated"))}: ${esc(fmtDate(new Date().toISOString()))}</p><h2>${esc(r.issueTitle||"")}</h2><p class="meta">${esc(r.customerName||"")} · ${esc(statusLabel(r.status))} · ${esc(typeLabel(r.recordType))}</p>
  <div class="grid">${[[t("customerName"),r.customerName],[t("phone"),r.customerPhone],[t("booking"),r.bookingNumber],[t("identityNumber"),r.identityNumber],[t("company"),r.rentalCompany],[t("branch"),r.branchName],[t("delivery"),r.deliveryDate],[t("status"),statusLabel(r.status)],[t("reminder"),r.reminderAt?fmtDate(r.reminderAt):""],[t("reminderEmailLabel"),r.reminderEmail]].map(([k,v])=>`<div class="item"><div class="label">${esc(k)}</div><div class="value">${esc(v||"—")}</div></div>`).join("")}</div>
  <div class="section"><h2>${esc(t("issue"))}</h2><div class="value">${esc(r.issueDetails||"—")}</div></div><div class="section"><h2>${esc(t("action"))}</h2><div class="value">${esc(r.actionTaken||"—")}</div></div><div class="section"><h2>${esc(t("next"))}</h2><div class="value">${esc(r.nextAction||"—")}</div></div>
  <div class="section"><h2>${esc(t("history"))}</h2><div class="history">${history.map(h=>`<div class="event"><div class="date">${esc(fmtDate(h.at))}</div><div class="note">${esc(h.note||"")}</div></div>`).join("")||"—"}</div></div>
  <p class="meta">${esc(t("appName"))}</p><button class="no-print" onclick="window.print()">${lang==="ar"?"طباعة / حفظ PDF":"Print / Save as PDF"}</button><script>window.onload=()=>setTimeout(()=>window.print(),400)<\/script></body></html>`;
  const win=window.open("","_blank");if(!win){toast(lang==="ar"?"اسمح بالنوافذ المنبثقة لتصدير PDF.":"Allow pop-ups to export PDF.");return;}
  win.document.open();win.document.write(html);win.document.close();
}
document.querySelectorAll("[data-close-dialog]").forEach(btn=>btn.addEventListener("click",()=>$(btn.dataset.closeDialog).close()));
$("languageToggle").addEventListener("click",()=>{lang=lang==="ar"?"en":"ar";localStorage.setItem("zsd_lang",lang);applyLanguage();});
$("settingsBtn").addEventListener("click",()=>{$("scriptUrl").value=cfg.url;$("accessToken").value=cfg.token;$("settingsDialog").showModal();});
$("settingsForm").addEventListener("submit",e=>{e.preventDefault();const url=$("scriptUrl").value.trim(),token=$("accessToken").value.trim();if(url&&token){sessionStorage.setItem("zsd_script_url",url);sessionStorage.setItem("zsd_access_token",token);}else{sessionStorage.removeItem("zsd_script_url");sessionStorage.removeItem("zsd_access_token");}$("settingsDialog").close();$("connectionStatus").textContent=cfg.url&&cfg.token?t("connected"):t("notConfigured");toast(t("settingsSaved"));loadRecords();});
$("clearSettingsBtn").addEventListener("click",()=>{sessionStorage.removeItem("zsd_script_url");sessionStorage.removeItem("zsd_access_token");$("scriptUrl").value="";$("accessToken").value="";$("settingsDialog").close();toast(t("settingsCleared"));loadRecords();});
$("newCaseBtn").addEventListener("click",()=>openRecordForm());
$("recordForm").addEventListener("submit",e=>{e.preventDefault();saveRecord();});
$("refreshBtn").addEventListener("click",loadRecords);
$("searchInput").addEventListener("input",renderRecords);
$("statusFilter").addEventListener("change",renderRecords);
applyLanguage();loadRecords();
