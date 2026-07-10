let plans = JSON.parse(localStorage.getItem('plans')) || [];
let deferredPrompt;

// 1. TABS SWITCHING
document.querySelectorAll('.tabBtn').forEach(btn=>{
  btn.onclick = ()=> {
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.tabBtn').forEach(b=>b.classList.remove('active'));
    document.getElementById(btn.dataset.tab).classList.add('active');
    btn.classList.add('active');
    loadData();
  }
});

// 2. INSTALL PWA BUTTON
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('installBtn').classList.remove('hidden');
});
document.getElementById('installBtn').onclick = async ()=>{
  if(deferredPrompt){
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    document.getElementById('installBtn').classList.add('hidden');
  }
}

// 3. SAVE PLAN + AUTO DIARY ENTRY
document.getElementById('saveBtn').onclick = ()=>{
  if(!teacherName.value ||!topic.value ||!date.value){ alert('Name, Date, Topic لازمی ہیں'); return; }

  let plan = {
    id: Date.now(),
    teacher: teacherName.value,
    subject: subject.value, class: class.value, section: section.value,
    date: date.value, period: period.value, topic: topic.value,
    outcome: outcome.value, method: method.value, aids: aids.value,
    assessment: assessment.value, homework: homework.value,
    status: 'Completed', score: 45, remarks: 'Excellent'
  };
  plans.push(plan);

  // Auto Diary Entry
  let diaryEntry = `${plan.date} - Period ${plan.period}: ${plan.topic} پڑھایا۔ Method: ${plan.method}`;
  diary.push({id: Date.now(), teacher: plan.teacher, date: plan.date, entry: diaryEntry});

  localStorage.setItem('plans', JSON.stringify(plans));
  localStorage.setItem('diary', JSON.stringify(diary));
  alert('Plan + Diary Entry Saved!');
  clearForm();
  loadData();
}

// 4. AI AUTO GENERATE
document.getElementById('aiBtn').onclick = ()=>{
  if(!topic.value){ alert('پہلے Topic لکھیں'); return; }
  outcome.value = `Students will understand the concept of ${topic.value} and apply it.`;
  method.value = `Lecture, Q/A, Group Activity`;
  aids.value = `Chart, Marker, Textbook, Multimedia`;
  assessment.value = `Oral Questions + Class Work`;
  homework.value = `Write 5 key points about ${topic.value}`;
}

// 5. LOAD, SEARCH, EDIT, DELETE
function loadData(){
  // Teacher List
  let tPlans = plans;
  let searchVal = document.getElementById('search')?.value.toLowerCase() || '';
  tPlans = tPlans.filter(p=>p.topic.toLowerCase().includes(searchVal) || p.teacher.toLowerCase().includes(searchVal));

  document.getElementById('lessonList').innerHTML = tPlans.map(p=>`
    <div class="plan card">
      <b>${p.date} | ${p.subject} | ${p.topic}</b><br>
      Class: ${p.class}-${p.section} | Period: ${p.period}<br>
      <button onclick="editPlan(${p.id})">Edit</button>
      <button onclick="delPlan(${p.id})">Delete</button>
      <button onclick="printPlan(${p.id})">Print</button>
      <button onclick="pdfPlan(${p.id})">PDF</button>
    </div>`).join('') || '<p>کوئی پلان نہیں ملا</p>';

  // Head Teacher List
  let hPlans = plans;
  let searchT = document.getElementById('searchTeacher')?.value.toLowerCase() || '';
  let filterD = document.getElementById('filterDate')?.value || '';
  hPlans = hPlans.filter(p=>p.teacher.toLowerCase().includes(searchT) && (filterD=='' || p.date==filterD));

  document.getElementById('allPlans').innerHTML = hPlans.map(p=>`
    <div class="plan card">
      <b>${p.teacher}</b> - ${p.date}<br>
      Topic: ${p.topic}<br>
      Score: ${p.score}/45
      <select onchange="updateRemark(${p.id}, this.value)">
        <option ${p.remarks=='Excellent'?'selected':''}>Excellent</option>
        <option ${p.remarks=='Very Good'?'selected':''}>Very Good</option>
        <option ${p.remarks=='Good'?'selected':''}>Good</option>
        <option ${p.remarks=='Average'?'selected':''}>Average</option>
        <option ${p.remarks=='Needs Improvement'?'selected':''}>Needs Improvement</option>
      </select>
    </div>`).join('') || '<p>کوئی ڈیٹا نہیں</p>';

  updateDashboard();
}

function editPlan(id){
  let p = plans.find(x=>x.id==id);
  Object.keys(p).forEach(k=>{ if(document.getElementById(k)) document.getElementById(k).value = p[k]; });
  delPlan(id); // Edit = Delete old + Save new
  document.getElementById('teacher').scrollIntoView();
}
function delPlan(id){ plans = plans.filter(p=>p.id!=id); localStorage.setItem('plans',JSON.stringify(plans)); loadData();}
function clearForm(){ document.querySelectorAll('#teacher input, #teacher textarea').forEach(i=>i.value=''); }

// 6. PRINT
function printPlan(id){
  let p = plans.find(x=>x.id==id);
  let w = window.open();
  w.document.write(`<h1>Lesson Plan</h1><pre>${JSON.stringify(p,null,2)}</pre>`);
  w.print();
}

// 7. PDF EXPORT
function pdfPlan(id){
  let p = plans.find(x=>x.id==id);
  let data = `GHS Lesson Plan\nTeacher: ${p.teacher}\nDate: ${p.date}\nTopic: ${p.topic}\nOutcome: ${p.outcome}\nMethod: ${p.method}\nHomework: ${p.homework}`;
  let blob = new Blob([data], {type: 'text/plain'});
  let url = URL.createObjectURL(blob);
  let a = document.createElement('a');
  a.href = url; a.download = `${p.teacher}-${p.date}.txt`;
  a.click(); // Simple PDF. For real PDF use jsPDF library
  alert('PDF Download ہو گئی');
}

// 8. HEAD TEACHER REMARKS + SCORE
function updateRemark(id, val){
  let p = plans.find(x=>x.id==id);
  p.remarks = val;
  p.score = val=='Excellent'?45 : val=='Very Good'?40 : val=='Good'?35 : val=='Average'?30 : 25;
  localStorage.setItem('plans',JSON.stringify(plans));
  updateDashboard();
}

// 9. DASHBOARD + MONTHLY REPORT
function updateDashboard(){
  let today = new Date().toISOString().split('T')[0];
  document.getElementById('totalTeachers').innerText = [...new Set(plans.map(p=>p.teacher))].length;
  document.getElementById('todayPlans').innerText = plans.filter(p=>p.date==today).length;
  document.getElementById('pending').innerText = plans.filter(p=>p.status!='Completed').length;
  let totalScore = plans.reduce((a,b)=>a+b.score,0);
  document.getElementById('avgScore').innerText = plans.length? Math.round(totalScore/plans.length) : 0;
}

// 10. SEARCH LISTENERS
document.getElementById('search')?.addEventListener('input', loadData);
document.getElementById('searchTeacher')?.addEventListener('input', loadData);
document.getElementById('filterDate')?.addEventListener('change', loadData);

loadData();
