/* app.js
   - Keeps same data structure (users, attendance, grades, schedule) in localStorage
   - Admin features: sidebar, manage students (search + pagination), attendance, grades, schedule, import/export
   - Student view shows square avatar (admin-uploaded)
   - Light/Dark theme saved in localStorage
*/

const LS_KEYS = {
  USERS: 'csr_users_v1',
  ATT: 'csr_attendance_v1',
  GRADES: 'csr_grades_v1',
  SCHED: 'csr_schedule_v1',
  THEME: 'csr_theme_v1'
};

const ADMIN = { username: 'admin', password: 'admin123' };

/* ---------- DOM references ---------- */
const loginView = document.getElementById('loginView');
const dashboard = document.getElementById('dashboard');
const loginRole = document.getElementById('loginRole');
const loginId = document.getElementById('loginId');
const loginPass = document.getElementById('loginPass');
const loginBtn = document.getElementById('loginBtn');
const loadDemoBtn = document.getElementById('loadDemoBtn');
const logoutBtn = document.getElementById('logoutBtn');
const themeToggle = document.getElementById('themeToggle');
const sidebar = document.getElementById('sidebar');
const tabs = [...document.querySelectorAll('.nav-item')];
const mainTitle = document.getElementById('mainTitle');
const mainSubtitle = document.getElementById('mainSubtitle');
const content = document.getElementById('content');
const globalQuickPills = document.getElementById('globalQuickPills');
const sidebarUserName = document.getElementById('sidebarUserName');
const sidebarUserMeta = document.getElementById('sidebarUserMeta');
const userAvatarSmall = document.getElementById('userAvatarSmall');

/* ---------- App state ---------- */
let state = { role: null, user: null }; // user object when student; {username:'admin'} when admin
let manageStudentsPagination = { page: 1, perPage: 10, filter: '' };

/* ---------- Utilities ---------- */
function read(key){ try{ return JSON.parse(localStorage.getItem(key) || 'null'); }catch(e){ return null; } }
function write(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
function ensureStorage(){
  if(!localStorage.getItem(LS_KEYS.USERS)){
    loadDemoData();
  }
}
function nowDate(){ return new Date().toISOString().slice(0,10); }
function fullName(u){ return `${u.firstName} ${u.lastName}`; }

/* ---------- Theme ---------- */
function applyTheme(t){
  document.documentElement.setAttribute('data-theme', t==='dark' ? 'dark' : 'light');
  localStorage.setItem(LS_KEYS.THEME, t);
  themeToggle.textContent = t==='dark' ? '☀️' : '🌙';
}
function initTheme(){
  const stored = localStorage.getItem(LS_KEYS.THEME) || 'light';
  applyTheme(stored);
}
themeToggle?.addEventListener('click', ()=>{
  const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

/* ---------- Demo data ---------- */
function loadDemoData(){
  const users = [
    { id:'12-1234-567', firstName:'Juan', lastName:'Dela Cruz', track:'ICT', birth:'2005-05-31', avatar:null },
    { id:'13-1111-888', firstName:'Maria', lastName:'Santos', track:'ICT', birth:'2005-08-12', avatar:null },
    { id:'14-2222-333', firstName:'Ana', lastName:'Reyes', track:'ICT', birth:'2005-01-10', avatar:null },
    { id:'15-3333-444', firstName:'Mark', lastName:'Lopez', track:'ICT', birth:'2005-02-02', avatar:null }
  ];
  const attendance = [
    { userId:'12-1234-567', date:'2025-08-09', status:'Absent' },
    { userId:'12-1234-567', date:'2025-08-08', status:'Tardy' },
    { userId:'13-1111-888', date:'2025-08-08', status:'Absent' }
  ];
  const grades = [
    { userId:'12-1234-567', schoolYear:'2024-2025', semester:'1st Semester', subject:'Math', grade:90 },
    { userId:'12-1234-567', schoolYear:'2024-2025', semester:'1st Semester', subject:'English', grade:88 }
  ];
  const sched = [
    { subject:'Math', time:'8:00 - 9:00', days:'Mon-Fri', room:'101', teacher:'Mr. Cruz' },
    { subject:'English', time:'9:00 - 10:00', days:'Mon-Fri', room:'102', teacher:'Ms. Santos' }
  ];
  write(LS_KEYS.USERS, users);
  write(LS_KEYS.ATT, attendance);
  write(LS_KEYS.GRADES, grades);
  write(LS_KEYS.SCHED, sched);
  alert('Demo data loaded.');
}

/* ---------- Login / Logout ---------- */
loginBtn.addEventListener('click', handleLogin);
loadDemoBtn.addEventListener('click', loadDemoData);
logoutBtn?.addEventListener('click', handleLogout);

function handleLogin(){
  const role = loginRole.value;
  const id = loginId.value.trim();
  const pass = loginPass.value.trim();
  if(role === 'admin'){
    if(id === ADMIN.username && pass === ADMIN.password){
      state = { role:'admin', user:{ username: ADMIN.username } };
      enterDashboard();
    } else { alert('Invalid admin credentials'); }
    return;
  }
  const users = read(LS_KEYS.USERS) || [];
  const u = users.find(x=>x.id === id);
  if(!u){ alert('Student ID not found'); return; }
  const mmdd = (u.birth || '').split('-').slice(1).join('');
  const expected = `${u.id}-${mmdd}`;
  if(pass === expected){ state = { role:'student', user: u }; enterDashboard(); } else { alert('Invalid student password (ID-MMDD)'); }
}

function handleLogout(){
  state = { role:null, user:null };
  dashboard.classList.add('hidden');
  loginView.classList.remove('hidden');
  content.innerHTML = '';
  clearSidebarUser();
}

/* ---------- Enter dashboard ---------- */
function enterDashboard(){
  loginView.classList.add('hidden');
  dashboard.classList.remove('hidden');
  if(state.role === 'admin'){
    setSidebarUser('Administrator', 'Admin');
    buildSidebar(); openView('home');
  } else {
    setSidebarUser(fullName(state.user), `${state.user.id} • ${state.user.track}`, state.user.avatar);
    buildSidebar(); openView('home');
  }
  renderQuickPills();
}

/* ---------- Sidebar & navigation ---------- */
function setSidebarUser(name, meta, avatarData=null){
  sidebarUserName.textContent = name;
  sidebarUserMeta.textContent = meta;
  if(avatarData){
    userAvatarSmall.innerHTML = `<img src="${avatarData}" class="thumb" alt="avatar">`;
  } else {
    userAvatarSmall.innerHTML = `<div class="avatar-small-placeholder">${(name||'')[0]||'G'}</div>`;
  }
}

function clearSidebarUser(){
  sidebarUserName.textContent = 'Guest';
  sidebarUserMeta.textContent = '';
  userAvatarSmall.innerHTML = `<div class="avatar-small-placeholder">G</div>`;
}

/* attach nav events */
tabs.forEach(btn => btn.addEventListener('click', ()=>{
  tabs.forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  openView(btn.getAttribute('data-view'));
}));

/* ---------- Views (load into #content) ---------- */
function openView(view){
  mainTitle.textContent = {
    home: 'Admin Home',
    manageStudents: 'Manage Students',
    attendance: 'Attendance',
    grades: 'Grades',
    schedule: 'Schedule',
    importExport: 'Import / Export'
  }[view] || 'View';
  mainSubtitle.textContent = {
    home: 'Overview & quick actions',
    manageStudents: 'Add, edit, search, upload profile pictures',
    attendance: 'Manage attendance records',
    grades: 'Manage grades',
    schedule: 'Manage class schedule',
    importExport: 'Backup & restore data'
  }[view] || '';
  // route
  if(view === 'home') renderHome();
  else if(view === 'manageStudents') renderManageStudents();
  else if(view === 'attendance') renderAttendanceAdmin();
  else if(view === 'grades') renderGradesAdmin();
  else if(view === 'schedule') renderScheduleAdmin();
  else if(view === 'importExport') renderImportExport();
  // update quick pills
  renderQuickPills();
}

/* ---------- Quick pills (top right) ---------- */
function renderQuickPills(){
  const users = read(LS_KEYS.USERS) || [];
  const att = read(LS_KEYS.ATT) || [];
  const grades = read(LS_KEYS.GRADES) || [];
  const sched = read(LS_KEYS.SCHED) || [];
  globalQuickPills.innerHTML = `
    <div class="pill">${users.length} students</div>
    <div class="pill">${att.length} attendance</div>
    <div class="pill">${grades.length} grades</div>
    <div class="pill">${sched.length} schedule</div>
  `;
}

/* ---------- HOME ---------- */
function renderHome(){
  const users = read(LS_KEYS.USERS) || [];
  const att = read(LS_KEYS.ATT) || [];
  const grades = read(LS_KEYS.GRADES) || [];
  const sched = read(LS_KEYS.SCHED) || [];
  content.innerHTML = `
    <div class="card">
      <h4>System Summary</h4>
      <div class="muted">Quick overview</div>
      <div style="display:flex;gap:12px;margin-top:12px;flex-wrap:wrap">
        <div class="pill">${users.length} students</div>
        <div class="pill">${att.length} attendance</div>
        <div class="pill">${grades.length} grades</div>
        <div class="pill">${sched.length} schedule items</div>
      </div>
      <div class="hr"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn primary" onclick="openView('manageStudents')">Manage Students</button>
        <button class="btn ghost" onclick="openView('attendance')">Attendance</button>
        <button class="btn ghost" onclick="openView('grades')">Grades</button>
      </div>
    </div>
  `;
}

/* ---------- MANAGE STUDENTS (search + pagination + upload avatar) ---------- */
function renderManageStudents(){
  const users = read(LS_KEYS.USERS) || [];
  manageStudentsPagination.filter = manageStudentsPagination.filter || '';
  manageStudentsPagination.page = manageStudentsPagination.page || 1;
  const filter = manageStudentsPagination.filter.toLowerCase();

  // search & filtered list
  const filtered = users.filter(u => {
    if(!filter) return true;
    return u.id.toLowerCase().includes(filter) || (u.firstName + ' ' + u.lastName).toLowerCase().includes(filter);
  });

  const total = filtered.length;
  const perPage = manageStudentsPagination.perPage;
  const page = Math.min(Math.max(1, manageStudentsPagination.page), Math.ceil(Math.max(1,total)/perPage));
  manageStudentsPagination.page = page;
  const start = (page-1)*perPage;
  const pageItems = filtered.slice(start, start+perPage);

  // build rows
  const rows = pageItems.map((u, idx) => {
    const idxGlobal = start + idx;
    const avatarThumb = u.avatar ? `<img src="${u.avatar}" alt="" class="thumb">` : '';
    return `
      <tr>
        <td>${avatarThumb} <strong>${u.id}</strong></td>
        <td>${fullName(u)}</td>
        <td>${u.track}</td>
        <td class="actions">
          <button class="btn ghost" onclick="editStudent(${idxGlobal})">Edit</button>
          <button class="btn ghost" onclick="uploadStudentPhoto(${idxGlobal})">Upload Photo</button>
          <button class="btn danger" onclick="deleteStudent(${idxGlobal})">Delete</button>
        </td>
      </tr>
    `;
  }).join('') || `<tr><td colspan="4" class="muted">No students found</td></tr>`;

  // pagination controls
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  let pagesHtml = '';
  const maxButtons = 7;
  const startPage = Math.max(1, Math.min(page - Math.floor(maxButtons/2), totalPages - maxButtons + 1));
  for(let p = startPage; p <= Math.min(totalPages, startPage + maxButtons -1); p++){
    pagesHtml += `<button class="page-btn ${p===page ? 'active' : ''}" onclick="setManageStudentsPage(${p})">${p}</button>`;
  }

  content.innerHTML = `
    <div class="card">
      <h4>Students</h4>
      <div class="muted">Add a new student, search, upload photos, and paginate</div>

      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
        <input id="ms_search" class="input" placeholder="Search by ID or name" value="${manageStudentsPagination.filter || ''}" />
        <select id="ms_perpage" class="input" style="max-width:120px;">
          <option ${perPage===5 ? 'selected' : ''}>5</option>
          <option ${perPage===10 ? 'selected' : ''}>10</option>
          <option ${perPage===20 ? 'selected' : ''}>20</option>
        </select>
        <button class="btn primary" id="ms_add">Add New Student</button>
      </div>

      <div style="overflow:auto; margin-top:12px;">
        <table class="table">
          <thead><tr><th>ID</th><th>Name</th><th>Track</th><th>Actions</th></tr></thead>
          <tbody id="ms_table_body">${rows}</tbody>
        </table>
      </div>

      <div class="pagination" style="margin-top:10px;">
        <button class="page-btn" onclick="setManageStudentsPage(1)">«</button>
        <button class="page-btn" onclick="setManageStudentsPage(${Math.max(1,page-1)})">‹</button>
        ${pagesHtml}
        <button class="page-btn" onclick="setManageStudentsPage(${Math.min(totalPages,page+1)})">›</button>
        <button class="page-btn" onclick="setManageStudentsPage(${totalPages})">»</button>
        <div style="margin-left:8px" class="muted">Page ${page} of ${totalPages}</div>
      </div>
    </div>
  `;

  // attach handlers
  document.getElementById('ms_search').addEventListener('input', (e)=> {
    manageStudentsPagination.filter = e.target.value;
    manageStudentsPagination.page = 1;
    renderManageStudents();
  });
  document.getElementById('ms_perpage').addEventListener('change', (e)=> {
    manageStudentsPagination.perPage = parseInt(e.target.value,10);
    manageStudentsPagination.page = 1;
    renderManageStudents();
  });
  document.getElementById('ms_add').addEventListener('click', ()=> showAddStudentForm());
}

/* manage students helpers */
function setManageStudentsPage(p){
  manageStudentsPagination.page = p;
  renderManageStudents();
}

/* add student form (modal-like within content) */
function showAddStudentForm(editIndex = null){
  const users = read(LS_KEYS.USERS) || [];
  let editUser = null;
  if(editIndex !== null) editUser = users[editIndex];

  content.innerHTML = `
    <div class="card">
      <h4>${editUser ? 'Edit Student' : 'Add Student'}</h4>
      <div class="row" style="margin-top:8px;">
        <input id="stu_id" class="input" placeholder="ID (e.g. 12-1234-567)" value="${editUser ? editUser.id : ''}" ${editUser ? 'disabled' : ''} />
        <input id="stu_first" class="input" placeholder="First name" value="${editUser ? editUser.firstName : ''}" />
      </div>
      <div class="row" style="margin-top:8px;">
        <input id="stu_last" class="input" placeholder="Last name" value="${editUser ? editUser.lastName : ''}" />
        <input id="stu_track" class="input" placeholder="Track e.g. ICT" value="${editUser ? editUser.track : ''}" />
      </div>
      <div style="margin-top:8px;">
        <label class="muted tiny">Birthdate</label>
        <input id="stu_birth" type="date" class="input" value="${editUser ? editUser.birth : ''}" />
      </div>
      <div style="margin-top:8px; display:flex; gap:8px;">
        <input id="stu_avatar" type="file" accept="image/*" />
      </div>
      <div style="margin-top:10px; display:flex; gap:8px;">
        <button class="btn primary" id="saveStudentBtn">${editUser ? 'Save changes' : 'Add student'}</button>
        <button class="btn ghost" id="cancelStudentBtn">Cancel</button>
      </div>
    </div>
  `;
  document.getElementById('cancelStudentBtn').addEventListener('click', ()=> openView('manageStudents'));
  document.getElementById('saveStudentBtn').addEventListener('click', async ()=>{
    const id = document.getElementById('stu_id').value.trim();
    const first = document.getElementById('stu_first').value.trim();
    const last = document.getElementById('stu_last').value.trim();
    const track = document.getElementById('stu_track').value.trim() || 'ICT';
    const birth = document.getElementById('stu_birth').value;
    const fileEl = document.getElementById('stu_avatar');
    if(!id || !first || !last || !birth){ alert('Please fill all fields'); return; }
    const users = read(LS_KEYS.USERS) || [];
    if(!editUser && users.some(u=>u.id === id)){ alert('ID already exists'); return; }
    let avatarData = editUser ? editUser.avatar : null;
    if(fileEl && fileEl.files && fileEl.files[0]){
      avatarData = await fileToDataURL(fileEl.files[0]);
    }
    if(editUser){
      // update existing user by id
      const idx = users.findIndex(u=>u.id === editUser.id);
      users[idx] = { ...users[idx], firstName: first, lastName: last, track, birth, avatar: avatarData };
    } else {
      users.push({ id, firstName: first, lastName: last, track, birth, avatar: avatarData });
    }
    write(LS_KEYS.USERS, users);
    openView('manageStudents');
    renderQuickPills();
  });
}

/* edit by index */
function editStudent(idx){
  const users = read(LS_KEYS.USERS) || [];
  if(!users[idx]) return;
  // show add/edit form prefilled
  const user = users[idx];
  content.innerHTML = `
    <div class="card">
      <h4>Edit Student: ${user.id}</h4>
      <div class="row" style="margin-top:8px;">
        <input id="stu_first" class="input" placeholder="First name" value="${user.firstName}" />
        <input id="stu_last" class="input" placeholder="Last name" value="${user.lastName}" />
      </div>
      <div class="row" style="margin-top:8px;">
        <input id="stu_track" class="input" placeholder="Track e.g. ICT" value="${user.track}" />
        <input id="stu_birth" type="date" class="input" value="${user.birth}" />
      </div>
      <div style="margin-top:8px">
        <label class="muted tiny">Change Photo (admin only)</label>
        <input id="stu_avatar" type="file" accept="image/*" />
      </div>
      <div style="margin-top:10px; display:flex; gap:8px;">
        <button class="btn primary" id="saveEditBtn">Save</button>
        <button class="btn ghost" id="cancelEditBtn">Cancel</button>
      </div>
    </div>
  `;
  document.getElementById('cancelEditBtn').addEventListener('click', ()=> openView('manageStudents'));
  document.getElementById('saveEditBtn').addEventListener('click', async ()=>{
    const first = document.getElementById('stu_first').value.trim();
    const last = document.getElementById('stu_last').value.trim();
    const track = document.getElementById('stu_track').value.trim();
    const birth = document.getElementById('stu_birth').value;
    const fileEl = document.getElementById('stu_avatar');
    let avatarData = user.avatar;
    if(fileEl && fileEl.files && fileEl.files[0]) avatarData = await fileToDataURL(fileEl.files[0]);
    const users = read(LS_KEYS.USERS) || [];
    users[idx] = { ...users[idx], firstName: first, lastName: last, track, birth, avatar: avatarData };
    write(LS_KEYS.USERS, users);
    openView('manageStudents');
    renderQuickPills();
  });
}

/* delete student by index */
function deleteStudent(idx){
  if(!confirm('Delete student and all their records?')) return;
  const users = read(LS_KEYS.USERS) || [];
  const id = users[idx].id;
  users.splice(idx,1);
  write(LS_KEYS.USERS, users);
  // cascade delete attendance & grades
  write(LS_KEYS.ATT, (read(LS_KEYS.ATT)||[]).filter(a=>a.userId !== id));
  write(LS_KEYS.GRADES, (read(LS_KEYS.GRADES)||[]).filter(g=>g.userId !== id));
  openView('manageStudents');
  renderQuickPills();
}

/* upload student photo by index (admin-only) */
function uploadStudentPhoto(idx){
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/*';
  input.onchange = async (e) => {
    const f = e.target.files[0];
    if(!f) return;
    const dataUrl = await fileToDataURL(f);
    const users = read(LS_KEYS.USERS) || [];
    if(!users[idx]){ alert('Student not found'); return; }
    users[idx].avatar = dataUrl;
    write(LS_KEYS.USERS, users);
    openView('manageStudents');
    renderQuickPills();
    alert('Photo uploaded.');
  };
  input.click();
}

/* helper to convert file -> data URL */
function fileToDataURL(file){
  return new Promise((resolve, reject)=>{
    const r = new FileReader();
    r.onload = e => resolve(e.target.result);
    r.onerror = e => reject(e);
    r.readAsDataURL(file);
  });
}

/* ---------- ATTENDANCE ADMIN ---------- */
function renderAttendanceAdmin(){
  const att = read(LS_KEYS.ATT) || [];
  const users = read(LS_KEYS.USERS) || [];
  const rows = att.map((a,i)=>`<tr>
    <td>${a.userId}</td><td>${a.date}</td><td>${a.status}</td>
    <td class="actions"><button class="btn danger" onclick="deleteAttendance(${i})">Delete</button></td></tr>`).join('') || `<tr><td colspan="4" class="muted">No attendance records</td></tr>`;
  content.innerHTML = `
    <div class="card">
      <h4>Attendance</h4>
      <div class="muted">View and add attendance</div>
      <div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap;">
        <select id="attUser" class="input">${users.map(u=>`<option value="${u.id}">${u.id} • ${u.firstName}</option>`).join('')}</select>
        <input id="attDate" type="date" class="input" value="${nowDate()}" style="max-width:160px;" />
        <select id="attStatus" class="input" style="max-width:140px;"><option>Present</option><option>Absent</option><option>Tardy</option></select>
        <button class="btn primary" id="addAttBtn">Add</button>
      </div>
      <div style="overflow:auto; margin-top:12px;">
        <table class="table"><thead><tr><th>Student</th><th>Date</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table>
      </div>
    </div>
  `;
  document.getElementById('addAttBtn').addEventListener('click', ()=>{
    const userId = document.getElementById('attUser').value;
    const date = document.getElementById('attDate').value;
    const status = document.getElementById('attStatus').value;
    if(!date){ alert('Pick a date'); return; }
    const arr = read(LS_KEYS.ATT) || [];
    arr.push({ userId, date, status });
    write(LS_KEYS.ATT, arr); renderAttendanceAdmin(); renderQuickPills();
  });
}
function deleteAttendance(i){
  const arr = read(LS_KEYS.ATT) || [];
  if(!arr[i]) return;
  if(!confirm('Delete attendance record?')) return;
  arr.splice(i,1); write(LS_KEYS.ATT, arr); renderAttendanceAdmin(); renderQuickPills();
}

/* ---------- GRADES ADMIN ---------- */
function renderGradesAdmin(){
  const grades = read(LS_KEYS.GRADES) || [];
  const users = read(LS_KEYS.USERS) || [];
  const rows = grades.map((g,i)=>`<tr>
    <td>${g.userId}</td><td>${g.schoolYear}</td><td>${g.semester}</td><td>${g.subject}</td>
    <td><input type="number" value="${g.grade}" onchange="editGrade(${i}, this.value)" style="width:80px" /></td>
    <td class="actions"><button class="btn danger" onclick="deleteGrade(${i})">Delete</button></td>
  </tr>`).join('') || `<tr><td colspan="6" class="muted">No grade records</td></tr>`;
  content.innerHTML = `
    <div class="card">
      <h4>Grades</h4>
      <div class="muted">Add or edit grades</div>
      <div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap;">
        <select id="gUser" class="input">${users.map(u=>`<option value="${u.id}">${u.id} • ${u.firstName}</option>`).join('')}</select>
        <input id="gSY" class="input" placeholder="2024-2025" style="max-width:160px;" />
        <select id="gSem" class="input" style="max-width:160px;"><option>1st Semester</option><option>2nd Semester</option></select>
        <input id="gSubject" class="input" placeholder="Subject" style="max-width:180px;" />
        <input id="gValue" type="number" class="input" placeholder="Grade" style="max-width:120px;" />
        <button class="btn primary" id="addGradeBtn">Add</button>
      </div>
      <div style="overflow:auto; margin-top:12px;">
        <table class="table"><thead><tr><th>Student</th><th>SY</th><th>Sem</th><th>Subject</th><th>Grade</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table>
      </div>
    </div>
  `;
  document.getElementById('addGradeBtn').addEventListener('click', ()=>{
    const userId = document.getElementById('gUser').value;
    const sy = document.getElementById('gSY').value.trim() || '2024-2025';
    const sem = document.getElementById('gSem').value;
    const subj = document.getElementById('gSubject').value.trim();
    const val = parseInt(document.getElementById('gValue').value,10);
    if(!subj || isNaN(val)){ alert('Enter subject and numeric grade'); return; }
    const arr = read(LS_KEYS.GRADES) || [];
    arr.push({ userId, schoolYear: sy, semester: sem, subject: subj, grade: val });
    write(LS_KEYS.GRADES, arr); renderGradesAdmin(); renderQuickPills();
  });
}
function editGrade(i, value){
  const arr = read(LS_KEYS.GRADES) || [];
  arr[i].grade = parseInt(value,10) || 0; write(LS_KEYS.GRADES, arr);
}
function deleteGrade(i){
  const arr = read(LS_KEYS.GRADES) || [];
  if(!arr[i]) return; if(!confirm('Delete grade?')) return; arr.splice(i,1); write(LS_KEYS.GRADES, arr); renderGradesAdmin(); renderQuickPills();
}

/* ---------- SCHEDULE ADMIN ---------- */
function renderScheduleAdmin(){
  const arr = read(LS_KEYS.SCHED) || [];
  const rows = arr.map((s,i)=>`<tr><td>${s.subject}</td><td>${s.time}</td><td>${s.days}</td><td>${s.room}</td><td>${s.teacher}</td><td class="actions"><button class="btn danger" onclick="deleteSchedule(${i})">Delete</button></td></tr>`).join('') || `<tr><td colspan="6" class="muted">No schedule</td></tr>`;
  content.innerHTML = `
    <div class="card">
      <h4>Schedule</h4>
      <div class="muted">Manage class schedule</div>
      <div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap;">
        <input id="sSubject" class="input" placeholder="Subject" />
        <input id="sTime" class="input" placeholder="Time (8:00 - 9:00)" />
        <input id="sDays" class="input" placeholder="Days e.g. Mon-Fri" />
        <input id="sRoom" class="input" placeholder="Room" />
        <input id="sTeacher" class="input" placeholder="Teacher" />
        <button class="btn primary" id="addSchedBtn">Add</button>
      </div>
      <div style="overflow:auto; margin-top:12px;">
        <table class="table"><thead><tr><th>Subject</th><th>Time</th><th>Days</th><th>Room</th><th>Teacher</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table>
      </div>
    </div>
  `;
  document.getElementById('addSchedBtn').addEventListener('click', ()=>{
    const subject = document.getElementById('sSubject').value.trim();
    const time = document.getElementById('sTime').value.trim();
    const days = document.getElementById('sDays').value.trim();
    const room = document.getElementById('sRoom').value.trim();
    const teacher = document.getElementById('sTeacher').value.trim();
    if(!subject || !time){ alert('Subject and time required'); return; }
    const arr = read(LS_KEYS.SCHED) || [];
    arr.push({ subject, time, days, room, teacher });
    write(LS_KEYS.SCHED, arr); renderScheduleAdmin(); renderQuickPills();
  });
}
function deleteSchedule(i){
  const arr = read(LS_KEYS.SCHED) || [];
  if(!arr[i]) return; if(!confirm('Delete schedule item?')) return; arr.splice(i,1); write(LS_KEYS.SCHED, arr); renderScheduleAdmin(); renderQuickPills();
}

/* ---------- IMPORT / EXPORT ---------- */
function renderImportExport(){
  content.innerHTML = `
    <div class="card">
      <h4>Import / Export Data</h4>
      <div class="muted">Backup or restore the entire database (users, attendance, grades, schedule)</div>
      <div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap;">
        <button class="btn primary" onclick="exportDatabase()">Export JSON</button>
        <label class="btn ghost" style="cursor:pointer;">
          Import JSON <input id="importFile" type="file" accept="application/json" style="display:none" onchange="importDatabase(event)">
        </label>
        <button class="btn ghost" onclick="clearAll()">Reset Local Data</button>
      </div>
      <div class="hr"></div>
      <div class="muted">Import notes: importing replaces current data. Export before importing if you want a backup.</div>
    </div>
  `;
}

function exportDatabase(){
  const payload = {
    users: read(LS_KEYS.USERS) || [],
    attendance: read(LS_KEYS.ATT) || [],
    grades: read(LS_KEYS.GRADES) || [],
    schedule: read(LS_KEYS.SCHED) || []
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'csr_export.json'; a.click();
  URL.revokeObjectURL(url);
}
function importDatabase(e){
  const file = (e.target && e.target.files && e.target.files[0]) || null;
  if(!file){ alert('No file selected'); return; }
  const reader = new FileReader();
  reader.onload = function(ev){
    try{
      const obj = JSON.parse(ev.target.result);
      // minimal validation and mapping
      write(LS_KEYS.USERS, obj.users || []);
      write(LS_KEYS.ATT, obj.attendance || []);
      write(LS_KEYS.GRADES, obj.grades || []);
      write(LS_KEYS.SCHED, obj.schedule || []);
      alert('Import successful (replaced current data).');
      openView('home'); renderQuickPills();
    }catch(err){ alert('Invalid JSON: ' + err.message); }
  };
  reader.readAsText(file);
  if(e.target) e.target.value = '';
}

/* ---------- Student dashboard (student flow) ---------- */
/* For simplicity we reuse the admin content area but show student info when logged as student */
function openStudentDashboard(){
  // show student view in main content
  const u = state.user;
  setSidebarUser(fullName(u), `${u.id} • ${u.track}`, u.avatar);
  const avatarHtml = u.avatar ? `<img src="${u.avatar}" class="avatar" alt="avatar">` : `<div class="avatar-placeholder">${(u.firstName||'')[0]}${(u.lastName||'')[0]}</div>`;
  content.innerHTML = `
    <div class="card">
      <div style="display:flex; gap:16px; align-items:center">
        <div style="min-width:150px; text-align:center">${avatarHtml}</div>
        <div style="flex:1">
          <div class="muted">Student Information</div>
          <div style="margin-top:8px; font-weight:700; font-size:18px">${fullName(u)}</div>
          <div class="muted" style="margin-top:6px">${u.id} • ${u.track}</div>
          <div class="hr"></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <div class="pill">${countAbsences(u.id)} absences</div>
            <div class="pill">${getGradesCount(u.id)} grades</div>
          </div>
        </div>
      </div>
    </div>
  `;
  // below, add student-specific tabs (Schedule, Attendance, Grades) as simpler buttons
  content.innerHTML += `
    <div class="card" style="margin-top:12px;">
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn ghost" onclick="renderStudentSchedule()">Schedule</button>
        <button class="btn ghost" onclick="renderStudentAttendance()">Attendance</button>
        <button class="btn ghost" onclick="renderStudentGrades()">Grades</button>
      </div>
    </div>
  `;
}

/* Student views */
function renderStudentSchedule(){
  const sched = read(LS_KEYS.SCHED) || [];
  const rows = sched.map(s=>`<tr><td>${s.subject}</td><td>${s.time}</td><td>${s.days}</td><td>${s.room}</td><td>${s.teacher}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">No schedule</td></tr>';
  content.innerHTML = `<div class="card"><h4>Schedule</h4><div style="overflow:auto"><table class="table"><thead><tr><th>Subject</th><th>Time</th><th>Days</th><th>Room</th><th>Teacher</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
function renderStudentAttendance(){
  const uid = state.user.id;
  const att = (read(LS_KEYS.ATT) || []).filter(a=>a.userId === uid).sort((a,b)=>b.date.localeCompare(a.date));
  const rows = att.map(a=>`<li style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.04);display:flex;justify-content:space-between"><span>${a.date}</span><span>${a.status}</span></li>`).join('') || '<li class="muted">No records</li>';
  content.innerHTML = `<div class="card"><h4>Attendance</h4><ul style="list-style:none;padding:0;margin-top:8px">${rows}</ul></div>`;
}
function renderStudentGrades(){
  const uid = state.user.id;
  const gradesAll = (read(LS_KEYS.GRADES) || []).filter(g=>g.userId === uid);
  const rows = gradesAll.map(g=>`<tr><td>${g.subject}</td><td>${g.grade}</td></tr>`).join('') || '<tr><td colspan="2" class="muted">No grades</td></tr>';
  content.innerHTML = `<div class="card"><h4>Grades</h4><div style="overflow:auto"><table class="table"><thead><tr><th>Subject</th><th>Grade</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}

/* ---------- helpers ---------- */
function countAbsences(userId){ return (read(LS_KEYS.ATT)||[]).filter(a=>a.userId===userId && a.status==='Absent').length; }
function getGradesCount(userId){ return (read(LS_KEYS.GRADES)||[]).filter(g=>g.userId===userId).length; }

/* ---------- utility/admin actions ---------- */
function openView(v){
  // if student logged in and tries to open admin views, show student home instead
  if(state.role === 'student'){
    openStudentDashboard();
    return;
  }
  openViewInternal(v);
}
function openViewInternal(view){ openView(view); } // placeholder to satisfy earlier code references

/* NOTE: openView already defined above to route. Keep compatibility */
window.openView = openView; // keep function available globally

/* clear all data (admin) */
function clearAll(){
  if(!confirm('Clear all local data?')) return;
  localStorage.removeItem(LS_KEYS.USERS);
  localStorage.removeItem(LS_KEYS.ATT);
  localStorage.removeItem(LS_KEYS.GRADES);
  localStorage.removeItem(LS_KEYS.SCHED);
  alert('Data cleared. Reloading.');
  location.reload();
}

/* On page boot */
(function boot(){
  initTheme();
  ensureStorage();
  // set default tab to 'home' if admin later logs in
})();

