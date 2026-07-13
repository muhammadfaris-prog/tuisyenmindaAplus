// Default package reference based on the PDF
const DEFAULT_PACKAGES = [
  { level: 'Tingkatan 5', subjects: 'Matematik, B.Inggeris, Sejarah, Sains, Fizik, Kimia, Add Math, Prinsip Akaun', hours: '5 jam', classSize: 'Maksimum 8', registration: 60, monthly: 80, note: 'RM 80 / subjek' },
  { level: 'Darjah 1 & 2', subjects: 'Matematik, B.Inggeris, Sains, Prinsip Akaun, Add Math', hours: '4 jam', classSize: 'Maksimum 8', registration: 50, monthly: 80, note: 'RM 80 / subjek' },
  { level: 'Tingkatan 1, 2, 3 & 4', subjects: 'Matematik, B.Melayu, B.Inggeris, Sains', hours: '4 jam', classSize: 'Maksimum 16', registration: 50, monthly: 80, note: 'RM 80 / subjek' },
  { level: 'UPKK', subjects: 'Matematik & B.Inggeris', hours: '4 jam', classSize: 'Maksimum 10', registration: 50, monthly: 40, note: 'RM 40 / subjek' },
  { level: 'Darjah 3, 4, 5 & 6', subjects: 'Matematik, B.Inggeris, Sains, B.Melayu', hours: '4 jam', classSize: 'Maksimum 10', registration: 30, monthly: 0, note: '1 Subjek: RM40, 2: RM80, 3: RM90, 4: RM100 (Pakej Jimat)' },
  { level: 'Kelas Membaca', subjects: 'Bahasa Arab & Jawi', hours: '4 jam', classSize: 'Maksimum 10', registration: 50, monthly: 60, note: 'RM 60 / subjek' },
  { level: 'Personal Class (1 to 1)', subjects: 'Any', hours: 'Minimum 1 jam/minggu', classSize: 'Maksimum 2', registration: 30, monthly: 0, note: 'T4-5: RM60/jam, T1-3: RM50/jam, D1-6: RM40/jam' }
];

let currentPackages = [];
let allStudents = [];
let allEnrollments = [];

function loadPackages() {
  const saved = localStorage.getItem('zool_packages');
  currentPackages = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(DEFAULT_PACKAGES));
}

function savePackages() {
  const editor = document.getElementById('packages-editor');
  const rows = editor.querySelectorAll('.package-row');
  currentPackages = [];
  rows.forEach(row => {
    currentPackages.push({
      level: row.querySelector('.pkg-level').value,
      subjects: row.querySelector('.pkg-subjects').value,
      hours: row.querySelector('.pkg-hours').value,
      classSize: row.querySelector('.pkg-class').value,
      registration: Number(row.querySelector('.pkg-reg').value),
      monthly: Number(row.querySelector('.pkg-monthly').value),
      note: row.querySelector('.pkg-note').value
    });
  });
  localStorage.setItem('zool_packages', JSON.stringify(currentPackages));
  renderPackagesEditor();
  alert('Pakej berjaya disimpan.');
}

function deletePackage(idx) {
  if (!confirm('PADAM terus pakej ini?')) return;
  loadPackages();
  currentPackages.splice(idx, 1);
  localStorage.setItem('zool_packages', JSON.stringify(currentPackages));
  renderPackagesEditor();
  populatePackageDropdown();
}

function addBlankPackage() {
  loadPackages();
  currentPackages.push({ level: '', subjects: '', hours: '', classSize: '', registration: 0, monthly: 0, note: '' });
  localStorage.setItem('zool_packages', JSON.stringify(currentPackages));
  renderPackagesEditor();
}

function resetPackages() {
  if (!confirm('Tetapkan semula pakej ke default dari PDF?')) return;
  currentPackages = JSON.parse(JSON.stringify(DEFAULT_PACKAGES));
  localStorage.setItem('zool_packages', JSON.stringify(currentPackages));
  renderPackagesEditor();
}

function renderPackagesEditor() {
  loadPackages();
  const editor = document.getElementById('packages-editor');
  const preview = document.getElementById('packages-preview');
  if (!editor || !preview) return;

  editor.innerHTML = '';
  preview.innerHTML = '';

  currentPackages.forEach((pkg, idx) => {
    const div = document.createElement('div');
    div.className = 'package-row bg-slate-700/50 rounded-xl p-4 border border-slate-600 grid grid-cols-1 md:grid-cols-2 gap-3';
    div.innerHTML = `
      <div class="md:col-span-2 flex items-center gap-2 mb-1">
        <span class="text-xs font-bold text-amber-400 bg-slate-700 w-6 h-6 rounded-full flex items-center justify-center">${idx + 1}</span>
        <span class="text-xs text-slate-400">Pakej #${idx + 1}</span>
      </div>
      <div><label class="text-xs text-slate-500">Tahap</label><input class="pkg-level border border-slate-600 bg-slate-700 text-slate-200 rounded-lg px-3 py-2 w-full" value="${escapeHtml(pkg.level)}" placeholder="Tahap" /></div>
      <div class="md:col-span-2"><label class="text-xs text-slate-500">Subjek (pisah guna koma)</label><input class="pkg-subjects border border-slate-600 bg-slate-700 text-slate-200 rounded-lg px-3 py-2 w-full" value="${escapeHtml(pkg.subjects)}" placeholder="Subjek" /></div>
      <div><label class="text-xs text-slate-500">Jam / Bulan</label><input class="pkg-hours border border-slate-600 bg-slate-700 text-slate-200 rounded-lg px-3 py-2 w-full" value="${escapeHtml(pkg.hours)}" placeholder="Jam/Bulan" /></div>
      <div><label class="text-xs text-slate-500">Saiz Kelas</label><input class="pkg-class border border-slate-600 bg-slate-700 text-slate-200 rounded-lg px-3 py-2 w-full" value="${escapeHtml(pkg.classSize)}" placeholder="Saiz Kelas" /></div>
      <div><label class="text-xs text-slate-500">Yuran Pendaftaran (RM)</label><input class="pkg-reg border border-slate-600 bg-slate-700 text-slate-200 rounded-lg px-3 py-2 w-full" type="number" value="${pkg.registration}" placeholder="0" /></div>
      <div><label class="text-xs text-slate-500">Yuran Bulanan (RM/subjek)</label><input class="pkg-monthly border border-slate-600 bg-slate-700 text-slate-200 rounded-lg px-3 py-2 w-full" type="number" value="${pkg.monthly}" placeholder="0" /></div>
      <div class="md:col-span-2"><label class="text-xs text-slate-500">Nota Harga</label><input class="pkg-note border border-slate-600 bg-slate-700 text-slate-200 rounded-lg px-3 py-2 w-full" value="${escapeHtml(pkg.note)}" placeholder="cth: RM 80 / subjek" /></div>
    `;
    editor.appendChild(div);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="px-4 py-3 text-amber-400 font-bold">${idx + 1}</td>
      <td class="px-4 py-3 font-medium text-slate-200">${escapeHtml(pkg.level)}</td>
      <td class="px-4 py-3 text-slate-300">${escapeHtml(pkg.subjects)}</td>
      <td class="px-4 py-3 text-slate-300">${escapeHtml(pkg.hours)}</td>
      <td class="px-4 py-3 text-slate-300">${escapeHtml(pkg.classSize)}</td>
      <td class="px-4 py-3 text-slate-300"><span class="text-xs text-slate-500">Yuran Pendaftaran:</span><br>RM ${Number(pkg.registration).toFixed(2)}</td>
      <td class="px-4 py-3 text-slate-300"><span class="text-xs text-slate-500">Yuran Bulanan:</span><br>${pkg.monthly ? 'RM ' + Number(pkg.monthly).toFixed(2) : '-'}<br><span class="text-xs text-amber-400">${escapeHtml(pkg.note)}</span></td>
    `;
    preview.appendChild(tr);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Populate package dropdown in registration form
function populatePackageDropdown() {
  const sel = document.getElementById('a-package');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Pilih Pakej --</option>';
  loadPackages();
  currentPackages.forEach((pkg, idx) => {
    sel.innerHTML += `<option value="${idx}" data-level="${escapeHtml(pkg.level)}" data-reg="${pkg.registration}" data-monthly="${pkg.monthly}" data-note="${escapeHtml(pkg.note)}" data-subjects="${escapeHtml(pkg.subjects)}">${escapeHtml(pkg.level)} (RM${pkg.monthly || 'pakej'}/subjek)</option>`;
  });
}

// When package is selected, auto-fill school level, reg fee + show subject checkboxes
function onPackageChange() {
  const sel = document.getElementById('a-package');
  const opt = sel.selectedOptions[0];
  const cboxDiv = document.getElementById('a-subjects-checkboxes');
  const calcDiv = document.getElementById('a-monthly-calc');
  
  if (!opt || !opt.value) {
    document.getElementById('a-schoolLevel').value = '';
    document.getElementById('a-regFee').value = '';
    if (cboxDiv) cboxDiv.classList.add('hidden');
    if (calcDiv) calcDiv.classList.add('hidden');
    return;
  }
  document.getElementById('a-schoolLevel').value = opt.dataset.level || '';
  document.getElementById('a-regFee').value = opt.dataset.reg || '0';
  
  // Show subject checkboxes
  const subjects = (opt.dataset.subjects || '').split(',').map(s => s.trim()).filter(s => s);
  const monthly = Number(opt.dataset.monthly);
  const note = opt.dataset.note || '';
  
  if (cboxDiv && subjects.length) {
    cboxDiv.classList.remove('hidden');
    cboxDiv.innerHTML = '<label class=\"text-xs text-slate-400 block mb-1\">Pilih Subjek (tick):</label>' +
      subjects.map((s, i) => '<label class=\"inline-flex items-center mr-3 mb-1 cursor-pointer\"><input type=\"checkbox\" class=\"a-subj-cb mr-1\" value=\"' + i + '\" onchange=\"updateMonthlyCalc()\" checked> <span class=\"text-sm text-slate-200\">' + escapeHtml(s) + '</span></label>').join('');
  }
  
  if (calcDiv) {
    calcDiv.classList.remove('hidden');
    updateMonthlyCalc();
  }
}

function updateMonthlyCalc() {
  const sel = document.getElementById('a-package');
  const opt = sel ? sel.selectedOptions[0] : null;
  if (!opt || !opt.value) return;
  const monthly = Number(opt.dataset.monthly);
  const note = opt.dataset.note || '';
  const checked = document.querySelectorAll('.a-subj-cb:checked').length;
  let fee = 0;
  if (monthly > 0) {
    fee = checked * monthly;
  } else {
    const totalMatch = note.match(new RegExp(checked + '\\s*:\\s*RM(\\d+)', 'i'));
    fee = totalMatch ? Number(totalMatch[1]) : 0;
  }
  document.getElementById('a-monthly-calc').innerHTML = '💰 Yuran Bulanan: <b class=\"text-lg\">RM' + fee + '</b> (' + checked + ' subjek × RM' + (monthly || 'tiered') + ')';
}

async function submitStudent() {
  const startMonthInput = document.getElementById('a-startMonth').value;
  const student = {
    parentIC: document.getElementById('a-parentIC').value,
    parentName: document.getElementById('a-parentName').value,
    parentPhone: document.getElementById('a-parentPhone').value,
    studentName: document.getElementById('a-studentName').value,
    schoolLevel: document.getElementById('a-schoolLevel').value,
    registrationFee: document.getElementById('a-regFee').value,
    startMonth: startMonthInput || new Date().toISOString().slice(0, 7)
  };

  // Basic validation
  if (!student.parentIC || !student.studentName) {
    alert('Sila isi sekurang-kurangnya IC Ibu Bapa dan Nama Pelajar.');
    return;
  }

  const res = await addStudent(student);
  if (res.error) {
    alert('Ralat: ' + res.error);
    return;
  }
  // Delete old enrollments + create new ones from selected package
  const pkgSel = document.getElementById('a-package');
  const pkgOpt = pkgSel ? pkgSel.selectedOptions[0] : null;
  let monthlyFee = 0;
  if (pkgOpt && pkgOpt.dataset.subjects) {
    // Delete existing enrollments for this student first
    await deleteEnrollmentsByStudent(res.studentID);
    const allSubjects = pkgOpt.dataset.subjects.split(',').map(s => s.trim()).filter(s => s);
    // Only enroll checked subjects
    const checkedCbs = document.querySelectorAll('.a-subj-cb:checked');
    const selectedSubjects = [];
    checkedCbs.forEach(cb => {
      const idx = parseInt(cb.value);
      if (idx >= 0 && idx < allSubjects.length) selectedSubjects.push(allSubjects[idx]);
    });
    if (!selectedSubjects.length) selectedSubjects.push(allSubjects[0]); // at least 1
    const monthly = Number(pkgOpt.dataset.monthly);
    const note = pkgOpt.dataset.note || '';
    if (monthly > 0) {
      monthlyFee = selectedSubjects.length * monthly;
      for (const subj of selectedSubjects) {
        await addEnrollment({ studentID: res.studentID, subject: subj, monthlyFee: monthly, hoursPerMonth: 4 });
      }
    } else {
      const totalMatch = note.match(new RegExp(selectedSubjects.length + '\\\\s*:\\\\s*RM(\\\\d+)', 'i'));
      monthlyFee = totalMatch ? Number(totalMatch[1]) : 0;
      await addEnrollment({ studentID: res.studentID, subject: selectedSubjects.join(', '), monthlyFee: monthlyFee, hoursPerMonth: 4 });
    }
    await updateStudent(res.studentID, { monthlyFee: monthlyFee });
  }
  alert(res.success ? `Pelajar disimpan: ${res.studentID}. Yuran bulanan: RM${monthlyFee}.` : res.error);
  if (res.success) {
    clearStudentForm();
    loadAdminData();
  }
}

function clearStudentForm() {
  ['a-parentIC', 'a-parentName', 'a-parentPhone', 'a-studentName', 'a-schoolLevel', 'a-regFee', 'a-startMonth'].forEach(id => {
    document.getElementById(id).value = '';
  });
  const pkg = document.getElementById('a-package');
  if (pkg) pkg.value = '';
  const cboxDiv = document.getElementById('a-subjects-checkboxes');
  if (cboxDiv) cboxDiv.classList.add('hidden');
  const calcDiv = document.getElementById('a-monthly-calc');
  if (calcDiv) calcDiv.classList.add('hidden');
  document.getElementById('a-startMonth').value = new Date().toISOString().slice(0, 7);
}

async function submitEnrollment() {
  const enrollment = {
    studentID: document.getElementById('a-studentID').value,
    subject: document.getElementById('a-subject').value,
    monthlyFee: document.getElementById('a-monthlyFee').value,
    hoursPerMonth: document.getElementById('a-hours').value
  };
  const res = await addEnrollment(enrollment);
  alert(res.success ? `Subjek ditambah: ${res.enrollmentID}` : res.error);
  if (res.success) {
    document.getElementById('a-studentID').value = '';
    document.getElementById('a-subject').value = '';
    document.getElementById('a-monthlyFee').value = '';
    document.getElementById('a-hours').value = '';
    loadAdminData();
  }
}

async function loadAdminData() {
  await loadStudentsList();
  await loadEnrollmentsList();
  await loadPendingReceipts();
  if (state.adminTab === 'payments') loadPaymentTracker();
}

function filterStudents() {
  const query = document.getElementById('student-search').value.trim().toLowerCase();
  renderStudents(allStudents.filter(s =>
    (s.studentName || '').toLowerCase().includes(query) ||
    (s.studentID || '').toLowerCase().includes(query) ||
    (s.parentIC || '').toString().toLowerCase().includes(query) ||
    (s.parentName || '').toLowerCase().includes(query) ||
    (s.schoolLevel || '').toLowerCase().includes(query)
  ));
}

async function loadStudentsList() {
  const container = document.getElementById('students-list');
  if (!container) return;
  container.innerHTML = '<p class="text-sm text-slate-400">Memuatkan...</p>';
  const data = await listStudents();
  if (data.error) {
    container.innerHTML = `<p class="text-sm text-red-500">Ralat memuatkan pelajar: ${data.error}</p>`;
    return;
  }
  allStudents = data.students || [];
  // Hide inactive students
  allStudents = allStudents.filter(s => s.status !== 'Inactive');
  filterStudents();
}

function renderStudents(students) {
  const container = document.getElementById('students-list');
  if (!students.length) {
    container.innerHTML = '<p class="text-sm text-slate-400">Tiada pelajar.</p>';
    return;
  }
  container.innerHTML = '';
  students.forEach((s, idx) => {
    const div = document.createElement('div');
    div.className = 'border border-slate-600 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-700/50';
    div.innerHTML = `
      <div class="flex items-start gap-3">
        <span class="text-xs font-bold text-amber-400 bg-slate-700 w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">${idx + 1}</span>
        <div>
          <p class="font-semibold text-slate-100">${escapeHtml(s.studentName)} <span class="text-xs font-normal text-slate-300">(${escapeHtml(s.studentID)})</span></p>
          <p class="text-sm text-slate-300">${escapeHtml(s.schoolLevel)} • RM${Number(s.monthlyFee||0).toFixed(0)}/bln • ${escapeHtml(s.parentName)} • IC: ${escapeHtml(String(s.parentIC))}</p>
          <p class="text-xs text-slate-400">Mula yuran: ${formatMonthYear(s.startMonth)}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs px-2 py-1 rounded-full ${s.status === 'Active' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-600 text-slate-300'}">${escapeHtml(s.status)}</span>
        <button onclick="editStudent('${escapeHtml(s.studentID)}')" class="text-xs bg-blue-900 text-amber-300 px-3 py-1 rounded-lg hover:bg-blue-800 transition font-medium">Edit</button>        <button onclick="removeStudent('${escapeHtml(s.studentID)}')" class="text-xs bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-500 transition font-medium">Buang</button>      </div>
    `;
    container.appendChild(div);
  });
}

// --- Edit Student Modal ---
function editStudent(studentID) {
  const s = allStudents.find(st => st.studentID === studentID);
  if (!s) return;

  // Check if modal already exists
  let modal = document.getElementById('edit-student-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'edit-student-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/40';
    modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
    document.body.appendChild(modal);
  }

  loadPackages();
  const pkgOpts = currentPackages.map((pkg, i) => 
    '<option value="' + i + '" ' + (pkg.level === s.schoolLevel ? 'selected' : '') + '>' + escapeHtml(pkg.level) + ' (RM' + (pkg.monthly || 'pakej') + '/subjek)</option>'
  ).join('');

  modal.innerHTML = `
    <div class="bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-lg mx-4 fade-in max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-bold text-amber-400">Edit Pelajar</h3>
        <button onclick="document.getElementById('edit-student-modal').remove()" class="text-slate-400 hover:text-red-400 text-xl">&times;</button>
      </div>
      <p class="text-sm text-slate-400 mb-4">Student ID: <strong>${escapeHtml(s.studentID)}</strong></p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div><label class="text-xs text-slate-400">IC Ibu Bapa</label><input id="edit-parentIC" class="border border-slate-600 bg-slate-700 text-slate-100 rounded-xl px-3 py-2 w-full" value="${escapeHtml(String(s.parentIC))}" /></div>
        <div><label class="text-xs text-slate-400">Nama Ibu Bapa</label><input id="edit-parentName" class="border border-slate-600 bg-slate-700 text-slate-100 rounded-xl px-3 py-2 w-full" value="${escapeHtml(s.parentName)}" /></div>
        <div><label class="text-xs text-slate-400">No. Telefon</label><input id="edit-parentPhone" class="border border-slate-600 bg-slate-700 text-slate-100 rounded-xl px-3 py-2 w-full" value="${escapeHtml(s.parentPhone)}" /></div>
        <div><label class="text-xs text-slate-400">Nama Pelajar</label><input id="edit-studentName" class="border border-slate-600 bg-slate-700 text-slate-100 rounded-xl px-3 py-2 w-full" value="${escapeHtml(s.studentName)}" /></div>
        <div class="md:col-span-2"><label class="text-xs text-slate-400">Pilih Pakej</label><select id="edit-package" onchange="onEditPkgChange()" class="border border-slate-600 bg-slate-700 text-slate-100 rounded-xl px-3 py-2 w-full"><option value="">-- Pilih Pakej --</option>${pkgOpts}</select></div>
        <div><label class="text-xs text-slate-400">Tahap (auto)</label><input id="edit-schoolLevel" readonly class="border border-slate-600 bg-slate-600 text-slate-300 rounded-xl px-3 py-2 w-full" value="${escapeHtml(s.schoolLevel||'')}" /></div>
        <div><label class="text-xs text-slate-400">Yuran Pendaftaran (auto)</label><input id="edit-regFee" type="number" readonly class="border border-slate-600 bg-slate-600 text-slate-300 rounded-xl px-3 py-2 w-full" value="${Number(s.registrationFee||0)}" /></div>
        <div><label class="text-xs text-slate-400">Bulan Mula</label><input id="edit-startMonth" type="month" class="border border-slate-600 bg-slate-700 text-slate-100 rounded-xl px-3 py-2 w-full" value="${escapeHtml(s.startMonth || '')}" /></div>
        <div><label class="text-xs text-slate-400">Status</label><select id="edit-status" class="border border-slate-600 bg-slate-700 text-slate-100 rounded-xl px-3 py-2 w-full"><option value="Active" ${s.status==='Active'?'selected':''}>Aktif</option><option value="Inactive" ${s.status==='Inactive'?'selected':''}>Tidak Aktif</option></select></div>
      </div>
      <div id="edit-subjects-checkboxes" class="mt-3 hidden"></div>
      <div id="edit-monthly-calc" class="mt-3 hidden text-sm text-amber-400 font-medium"></div>
      <div class="flex gap-3 mt-5">
        <button onclick="saveEditStudent('${escapeHtml(s.studentID)}')" class="flex-1 bg-blue-950 text-amber-400 py-2.5 rounded-xl font-medium hover:bg-blue-900 transition">Simpan</button>
        <button onclick="document.getElementById('edit-student-modal').remove()" class="flex-1 bg-slate-600 text-slate-200 py-2.5 rounded-xl font-medium hover:bg-slate-500 transition">Batal</button>
      </div>
    </div>
  `;
  // Trigger package change to show checkboxes
  setTimeout(onEditPkgChange, 100);
}

function onEditPkgChange() {
  var sel = document.getElementById('edit-package');
  var cboxDiv = document.getElementById('edit-subjects-checkboxes');
  var calcDiv = document.getElementById('edit-monthly-calc');
  if (!sel || !sel.value) { if(cboxDiv)cboxDiv.classList.add('hidden'); if(calcDiv)calcDiv.classList.add('hidden'); return; }
  var pkg = currentPackages[parseInt(sel.value)];
  if (!pkg) return;
  document.getElementById('edit-schoolLevel').value = pkg.level || '';
  document.getElementById('edit-regFee').value = pkg.registration || 0;
  var subjects = (pkg.subjects || '').split(',').map(function(s){return s.trim();}).filter(function(s){return s;});
  if (cboxDiv && subjects.length) {
    cboxDiv.classList.remove('hidden');
    cboxDiv.innerHTML = '<label class=\"text-xs text-slate-400 block mb-1\">Pilih Subjek:</label>' +
      subjects.map(function(s,i){return '<label class=\"inline-flex items-center mr-3 mb-1 cursor-pointer\"><input type=\"checkbox\" class=\"edit-subj-cb mr-1\" value=\"'+i+'\" onchange=\"onEditCalc()\" checked> <span class=\"text-sm text-slate-200\">'+escapeHtml(s)+'</span></label>';}).join('');
  }
  if (calcDiv) { calcDiv.classList.remove('hidden'); onEditCalc(); }
}

function onEditCalc() {
  var sel = document.getElementById('edit-package');
  if (!sel || !sel.value) return;
  var pkg = currentPackages[parseInt(sel.value)];
  if (!pkg) return;
  var monthly = Number(pkg.monthly);
  var note = pkg.note || '';
  var checked = document.querySelectorAll('.edit-subj-cb:checked').length;
  var fee = 0;
  if (monthly > 0) { fee = checked * monthly; }
  else { var m = note.match(new RegExp(checked + '\\\\s*:\\\\s*RM(\\\\d+)', 'i')); fee = m ? Number(m[1]) : 0; }
  document.getElementById('edit-monthly-calc').innerHTML = '💰 Yuran Bulanan: <b class=\"text-lg\">RM' + fee + '</b> (' + checked + ' subjek)';
}

async function saveEditStudent(studentID) {
  const updates = {
    parentIC: document.getElementById('edit-parentIC').value,
    parentName: document.getElementById('edit-parentName').value,
    parentPhone: document.getElementById('edit-parentPhone').value,
    studentName: document.getElementById('edit-studentName').value,
    schoolLevel: document.getElementById('edit-schoolLevel').value,
    registrationFee: document.getElementById('edit-regFee').value,
    startMonth: document.getElementById('edit-startMonth').value,
    status: document.getElementById('edit-status').value,
    specialFee: document.getElementById('edit-specialFee').value
  };
  const res = await updateStudent(studentID, updates);
  if (res.error) {
    alert('Ralat: ' + res.error);
    return;
  }
  alert('Pelajar dikemaskini.');
  document.getElementById('edit-student-modal').remove();
  loadAdminData();
}

async function removeStudent(studentID) {
  if (!confirm('PADAM terus pelajar ini? Tindakan ini tidak boleh undur.')) return;
  const res = await deleteStudent(studentID);
  if (res.error) { alert('Ralat: ' + res.error); return; }
  alert('Pelajar dipadam.');
  loadAdminData();
}

function filterEnrollments() {
  const query = document.getElementById('enrollment-search').value.trim().toLowerCase();
  renderEnrollments(allEnrollments.filter(e =>
    (e.subject || '').toLowerCase().includes(query) ||
    (e.studentID || '').toLowerCase().includes(query)
  ));
}

// --- Edit / Remove Enrollment ---
function editEnrollment(enrollmentID) {
  const e = allEnrollments.find(en => en.enrollmentID === enrollmentID);
  if (!e) return;

  let modal = document.getElementById('edit-enrollment-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'edit-enrollment-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/40';
    modal.onclick = function(ev) { if (ev.target === modal) modal.remove(); };
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 fade-in">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-bold text-amber-400">Edit Subjek</h3>
        <button onclick="document.getElementById('edit-enrollment-modal').remove()" class="text-slate-400 hover:text-red-400 text-xl">&times;</button>
      </div>
      <p class="text-sm text-slate-400 mb-4">Enrollment ID: <strong>${escapeHtml(e.enrollmentID)}</strong></p>
      <div class="space-y-3">
        <div>
          <label class="text-xs text-slate-400">Subjek</label>
          <select id="edit-enroll-subject" class="border border-slate-600 bg-slate-700 text-slate-100 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-400">
            <option value="">Pilih Subjek</option>
            ${['Matematik','B.Inggeris','Sejarah','Sains','Fizik','Kimia','Add Math','Prinsip Akaun','B.Melayu','Bahasa Arab','Jawi'].map(s => `<option ${s === e.subject ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="text-xs text-slate-400">Yuran Bulanan (RM)</label>
          <input id="edit-enroll-fee" type="number" class="border border-slate-600 bg-slate-700 text-slate-100 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-400" value="${Number(e.monthlyFee||0)}" />
        </div>
        <div>
          <label class="text-xs text-slate-400">Jam Sebulan</label>
          <input id="edit-enroll-hours" type="number" class="border border-slate-600 bg-slate-700 text-slate-100 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-400" value="${Number(e.hoursPerMonth||4)}" />
        </div>
        <div>
          <label class="text-xs text-slate-400">Status</label>
          <select id="edit-enroll-status" class="border border-slate-600 bg-slate-700 text-slate-100 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-400">
            <option value="Active" ${e.status === 'Active' ? 'selected' : ''}>Aktif</option>
            <option value="Dropped" ${e.status === 'Dropped' ? 'selected' : ''}>Gugur</option>
          </select>
        </div>
      </div>
      <div class="flex gap-3 mt-5">
        <button onclick="saveEditEnrollment('${escapeHtml(e.enrollmentID)}')" class="flex-1 bg-blue-950 text-amber-400 py-2.5 rounded-xl font-medium hover:bg-blue-900 transition">Simpan</button>
        <button onclick="document.getElementById('edit-enrollment-modal').remove()" class="flex-1 bg-slate-600 text-slate-200 py-2.5 rounded-xl font-medium hover:bg-slate-500 transition">Batal</button>
      </div>
    </div>
  `;
}

async function saveEditEnrollment(enrollmentID) {
  const updates = {
    subject: document.getElementById('edit-enroll-subject').value,
    monthlyFee: document.getElementById('edit-enroll-fee').value,
    hoursPerMonth: document.getElementById('edit-enroll-hours').value,
    status: document.getElementById('edit-enroll-status').value
  };
  const res = await updateEnrollment(enrollmentID, updates);
  if (res.error) { alert('Ralat: ' + res.error); return; }
  alert('Subjek dikemaskini.');
  document.getElementById('edit-enrollment-modal').remove();
  loadAdminData();
}

async function removeEnrollment(enrollmentID) {
  if (!confirm('PADAM terus subjek ini?')) return;
  const res = await deleteEnrollment(enrollmentID);
  if (res.error) { alert('Ralat: ' + res.error); return; }
  loadAdminData();
}

async function loadEnrollmentsList() {
  const container = document.getElementById('enrollments-list');
  if (!container) return;
  container.innerHTML = '<p class="text-sm text-slate-400">Memuatkan...</p>';
  const data = await listEnrollments();
  if (data.error) {
    container.innerHTML = `<p class="text-sm text-red-500">Ralat memuatkan subjek: ${data.error}</p>`;
    return;
  }
  allEnrollments = data.enrollments || [];
  filterEnrollments();
}

function renderEnrollments(enrollments) {
  const container = document.getElementById('enrollments-list');
  // Filter out Dropped
  const active = enrollments.filter(e => e.status !== 'Dropped');
  if (!active.length) {
    container.innerHTML = '<p class="text-sm text-slate-400">Tiada subjek aktif.</p>';
    return;
  }
  // Group by studentID
  const grouped = {};
  active.forEach(e => {
    if (!grouped[e.studentID]) grouped[e.studentID] = { id: e.studentID, subs: [], totalFee: 0 };
    grouped[e.studentID].subs.push(e);
    grouped[e.studentID].totalFee += Number(e.monthlyFee || 0);
  });
  const groups = Object.values(grouped);

  container.innerHTML = '';
  groups.forEach((g, idx) => {
    const subjTags = g.subs.map(e => '<span class="inline-block bg-slate-600 px-2 py-1 rounded text-xs mr-1 mb-1">' + escapeHtml(e.subject) + ' <b class="text-amber-400">RM' + Number(e.monthlyFee).toFixed(0) + '</b></span>').join('');
    const div = document.createElement('div');
    div.className = 'border border-slate-600 rounded-xl p-4 bg-slate-700/50';
    div.innerHTML = `
      <div class="flex items-start justify-between mb-2">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-amber-400 bg-slate-700 w-6 h-6 rounded-full flex items-center justify-center shrink-0">${idx + 1}</span>
          <span class="font-semibold text-slate-100">${escapeHtml(g.id)}</span>
          <span class="text-sm text-amber-400 font-medium">RM${g.totalFee.toFixed(0)}/bulan</span>
        </div>
      </div>
      <div class="flex flex-wrap ml-8">${subjTags}</div>
      <div class="flex gap-2 mt-2 ml-8">
        <button onclick="editStudentEnrollments('${escapeHtml(g.id)}')" class="text-xs bg-blue-900 text-amber-400 px-2 py-1 rounded-lg hover:bg-blue-800 transition">Tambah/Ganti Pakej</button>
        <button onclick="deleteAllEnrollments('${escapeHtml(g.id)}')" class="text-xs bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-500 transition">Buang Semua</button>
      </div>
    `;
    container.appendChild(div);
  });
}

function editStudentEnrollments(studentID) {
  // Find the student
  const st = allStudents.find(s => s.studentID === studentID);
  if (!st) return;

  let modal = document.getElementById('change-package-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'change-package-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/40';
    modal.onclick = function(ev) { if (ev.target === modal) modal.remove(); };
    document.body.appendChild(modal);
  }

  loadPackages();
  const pkgOpts = currentPackages.map((pkg, i) => 
    '<option value="' + i + '" ' + (pkg.level === st.schoolLevel ? 'selected' : '') + '>' + escapeHtml(pkg.level) + ' (' + pkg.subjects + ')</option>'
  ).join('');

  modal.innerHTML = `
    <div class="bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 fade-in">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-bold text-amber-400">Tukar Pakej</h3>
        <button onclick="document.getElementById('change-package-modal').remove()" class="text-slate-400 hover:text-red-400 text-xl">&times;</button>
      </div>
      <p class="text-sm text-slate-400 mb-4">Pelajar: <strong class="text-slate-200">${escapeHtml(st.studentName)} (${escapeHtml(st.studentID)})</strong><br>Tahap semasa: ${escapeHtml(st.schoolLevel)}</p>
      <div class="mb-4">
        <label class="text-xs text-slate-400">Pilih Pakej Baru</label>
        <select id="change-pkg-select" onchange="onChangePkgSelect()" class="border border-slate-600 bg-slate-700 text-slate-100 rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-amber-400">
          <option value="">-- Pilih Pakej --</option>
          ${pkgOpts}
        </select>
      </div>
      <div id="change-pkg-checkboxes" class="mb-4 hidden"></div>
      <div id="change-pkg-calc" class="mb-4 hidden text-sm text-amber-400 font-medium"></div>
      <div class="mb-4">
        <label class="text-xs text-slate-400 block mb-1">Mod</label>
        <select id="change-pkg-mode" class="border border-slate-600 bg-slate-700 text-slate-100 rounded-xl px-3 py-2 w-full text-sm">
          <option value="add">Tambah Pakej (kekal subjek lama)</option>
          <option value="replace">Ganti Pakej (buang subjek lama)</option>
        </select>
      </div>
      <div class="flex gap-3">
        <button onclick="applyPackageChange('${escapeHtml(studentID)}')" class="flex-1 bg-blue-950 text-amber-400 py-2.5 rounded-xl font-medium hover:bg-blue-900 transition">Simpan</button>
        <button onclick="document.getElementById('change-package-modal').remove()" class="flex-1 bg-slate-600 text-slate-200 py-2.5 rounded-xl font-medium hover:bg-slate-500 transition">Batal</button>
      </div>
    </div>
  `;
}

async function applyPackageChange(studentID) {
  var sel = document.getElementById('change-pkg-select');
  if (!sel || !sel.value) return alert('Sila pilih pakej.');
  var pkg = currentPackages[parseInt(sel.value)];
  if (!pkg) return;
  var mode = document.getElementById('change-pkg-mode');
  var isReplace = mode && mode.value === 'replace';

  var allSubjects = (pkg.subjects || '').split(',').map(function(s){return s.trim();}).filter(function(s){return s;});
  var checkedCbs = document.querySelectorAll('.chg-subj-cb:checked');
  var selectedSubjects = [];
  if (checkedCbs.length) {
    checkedCbs.forEach(function(cb){ var i=parseInt(cb.value); if(i>=0 && i<allSubjects.length) selectedSubjects.push(allSubjects[i]); });
  } else {
    selectedSubjects = allSubjects;
  }
  if (!selectedSubjects.length) selectedSubjects.push(allSubjects[0]);

  // Replace mode: delete old enrollments first
  if (isReplace) {
    var delRes = await deleteEnrollmentsByStudent(studentID);
    if (delRes.error) { alert('Ralat buang subjek lama: ' + delRes.error + '. Sila deploy GAS backend.'); return; }
  }

  var monthly = Number(pkg.monthly);
  var note = pkg.note || '';
  var newFee = 0;
  for (var s=0; s<selectedSubjects.length; s++) {
    var subjFee = monthly > 0 ? monthly : 0;
    await addEnrollment({ studentID: studentID, subject: selectedSubjects[s], monthlyFee: subjFee, hoursPerMonth: 4 });
    newFee += subjFee;
  }
  // For tiered packages, create combined enrollment instead
  if (monthly === 0) {
    var totalMatch = note.match(new RegExp(selectedSubjects.length + '\\s*:\\s*RM(\\d+)', 'i'));
    newFee = totalMatch ? Number(totalMatch[1]) : 0;
    await addEnrollment({ studentID: studentID, subject: selectedSubjects.join(', '), monthlyFee: newFee, hoursPerMonth: 4 });
  }

  // Update student: if replace, set to new package fee; if add, sum all
  var totalMonthly = newFee;
  if (!isReplace) {
    // Fetch current enrollments to sum
    var st = allStudents.find(function(s){return s.studentID === studentID;});
    totalMonthly = (Number(st ? st.monthlyFee : 0) || 0) + newFee;
  }
  await updateStudent(studentID, { schoolLevel: pkg.level, registrationFee: pkg.registration, monthlyFee: totalMonthly });
  
  alert((isReplace ? 'Pakej diganti!' : 'Pakej ditambah!') + ' ' + selectedSubjects.length + ' subjek, RM' + totalMonthly + '/bulan.');
  document.getElementById('change-package-modal').remove();
  loadAdminData();
}

function onChangePkgSelect() {
  var sel = document.getElementById('change-pkg-select');
  var cboxDiv = document.getElementById('change-pkg-checkboxes');
  var calcDiv = document.getElementById('change-pkg-calc');
  if (!sel || !sel.value) { if(cboxDiv)cboxDiv.classList.add('hidden'); if(calcDiv)calcDiv.classList.add('hidden'); return; }
  var pkg = currentPackages[parseInt(sel.value)];
  if (!pkg) return;
  var subjects = (pkg.subjects || '').split(',').map(function(s){return s.trim();}).filter(function(s){return s;});
  if (cboxDiv && subjects.length) {
    cboxDiv.classList.remove('hidden');
    cboxDiv.innerHTML = '<label class=\"text-xs text-slate-400 block mb-1\">Pilih Subjek (tick):</label>' +
      subjects.map(function(s,i){return '<label class=\"inline-flex items-center mr-3 mb-1 cursor-pointer\"><input type=\"checkbox\" class=\"chg-subj-cb mr-1\" value=\"'+i+'\" onchange=\"updateChangeCalc()\" checked> <span class=\"text-sm text-slate-200\">'+escapeHtml(s)+'</span></label>';}).join('');
  }
  if (calcDiv) { calcDiv.classList.remove('hidden'); updateChangeCalc(); }
}

function updateChangeCalc() {
  var sel = document.getElementById('change-pkg-select');
  if (!sel || !sel.value) return;
  var pkg = currentPackages[parseInt(sel.value)];
  if (!pkg) return;
  var monthly = Number(pkg.monthly);
  var note = pkg.note || '';
  var checked = document.querySelectorAll('.chg-subj-cb:checked').length;
  var fee = 0;
  if (monthly > 0) { fee = checked * monthly; }
  else { var m = note.match(new RegExp(checked + '\\\\s*:\\\\s*RM(\\\\d+)', 'i')); fee = m ? Number(m[1]) : 0; }
  document.getElementById('change-pkg-calc').innerHTML = '💰 Yuran Bulanan: <b class=\"text-lg\">RM' + fee + '</b> (' + checked + ' subjek)';
}

async function deleteAllEnrollments(studentID) {
  if (!confirm('PADAM semua subjek untuk ' + studentID + '?')) return;
  const res = await deleteEnrollmentsByStudent(studentID);
  if (res.error) { alert('Ralat: ' + res.error); return; }
  loadAdminData();
}

// --- Payment Tracker ---
let paymentSummaryData = null;

async function loadPaymentTracker() {
  const container = document.getElementById('payments-tracker');
  if (!container) return;
  container.innerHTML = '<p class="text-sm text-slate-400 text-center py-8">Memuatkan data bayaran...</p>';
  const data = await getPaymentSummary();
  if (data.error) {
    container.innerHTML = '<p class="text-sm text-red-500">Ralat: ' + data.error + '</p>';
    return;
  }
  paymentSummaryData = data;
  renderPaymentTracker('all');
}

function renderPaymentTracker(filterMonth) {
  const container = document.getElementById('payments-tracker');
  if (!container || !paymentSummaryData) return;

  const { months, students } = paymentSummaryData;
  const displayMonths = filterMonth === 'all' ? months : months.filter(m => m === filterMonth);

  // Build month filter dropdown
  let monthFilterHTML = '<select id="payment-month-filter" onchange="renderPaymentTracker(this.value)" class="border border-slate-600 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">';
  monthFilterHTML += '<option value="all" ' + (filterMonth === 'all' ? 'selected' : '') + '>Semua Bulan</option>';
  months.forEach(m => {
    const label = formatMonthYear(m);
    monthFilterHTML += '<option value="' + m + '" ' + (filterMonth === m ? 'selected' : '') + '>' + label + '</option>';
  });
  monthFilterHTML += '</select>';

  // Summary stats: only count months on/after each student's startMonth
  let totalPaid = 0, totalPending = 0, totalUnpaid = 0;
  students.forEach(st => {
    const start = st.startMonth || months[0];
    months.forEach(m => {
      if (m < start) return; // before billing starts
      const status = st.monthStatus[m];
      if (status === 'Approved') totalPaid++;
      else if (status === 'Pending') totalPending++;
      else totalUnpaid++;
    });
  });

  let html = `
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4">
      <div class="flex gap-3 text-sm flex-wrap">
        <span class="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full font-medium">Lulus: ${totalPaid}</span>
        <span class="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full font-medium">Menunggu: ${totalPending}</span>
        <span class="bg-red-500/20 text-red-300 px-3 py-1 rounded-full font-medium">Belum: ${totalUnpaid}</span>
      </div>
      <div class="flex gap-2">
        <input id="payment-student-search" type="text" oninput="filterPaymentTracker()" placeholder="Cari nama pelajar..." class="border border-slate-600 bg-slate-700 text-slate-100 rounded-xl px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-amber-400" />
        ${monthFilterHTML}
      </div>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-sm text-left">
        <thead class="bg-slate-700 text-slate-100 uppercase text-xs">
          <tr>
            <th class="px-3 py-3 rounded-l-lg sticky left-0 bg-slate-700">#</th>
            <th class="px-3 py-3">Pelajar</th>
            <th class="px-3 py-3">Tahap</th>
            <th class="px-3 py-3">Yuran (RM)</th>`;

  displayMonths.forEach(m => {
    html += '<th class="px-3 py-3 text-center">' + formatMonthYear(m) + '</th>';
  });

  html += '<th class="px-3 py-3 rounded-r-lg text-center">Bulan Dibayar</th></tr></thead><tbody class="divide-y divide-slate-600">';

  students.forEach((st, idx) => {
    const start = st.startMonth || months[0];
    // Collect paid months for summary
    const paidMonths = [];
    displayMonths.forEach(m => {
      if (st.monthStatus[m] === 'Approved') paidMonths.push(formatMonthYear(m));
    });

    html += '<tr class="hover:bg-slate-700/50">';
    html += '<td class="px-3 py-3 text-amber-300 font-bold sticky left-0 bg-slate-800">' + (idx + 1) + '</td>';
    html += '<td class="px-3 py-3 font-medium text-slate-100">' + escapeHtml(st.studentName) + '<br><span class="text-xs text-slate-300">' + escapeHtml(st.studentID) + '</span></td>';
    html += '<td class="px-3 py-3 text-slate-300">' + escapeHtml(st.schoolLevel) + '</td>';
    html += '<td class="px-3 py-3 font-medium text-amber-300">' + Number(st.monthlyFee).toFixed(2) + '</td>';

    displayMonths.forEach(m => {
      if (m < start) {
        html += '<td class="px-3 py-3 text-center"><span class="text-slate-500" title="Sebelum mula yuran">—</span></td>';
        return;
      }
      const status = st.monthStatus[m];
      const detail = st.paymentDetails[m];
      if (status === 'Approved') {
        const paid = detail && detail.amountPaid ? Number(detail.amountPaid).toFixed(0) : Number(st.monthlyFee).toFixed(0);
        html += '<td class="px-3 py-3 text-center"><span title="' + formatMonthYear(m) + ' - Lulus (RM ' + paid + ')" class="text-amber-300 font-bold">RM' + paid + '</span></td>';
      } else if (status === 'Pending') {
        html += '<td class="px-3 py-3 text-center"><span title="' + formatMonthYear(m) + ' - Menunggu" class="text-yellow-300">⏳</span></td>';
      } else {
        html += '<td class="px-3 py-3 text-center"><span class="text-slate-300">—</span></td>';
      }
    });

    html += '<td class="px-3 py-3 text-xs text-slate-300">' + (paidMonths.length ? paidMonths.join(', ') : '—') + '</td>';
    html += '</tr>';
  });

  html += '</tbody></table></div>';

  if (!students.length) {
    html = '<p class="text-sm text-slate-400 text-center py-8">Tiada pelajar aktif.</p>';
  }

  container.innerHTML = html;
}

function formatMonthYear(ym) {
  if (!ym) return '';
  var str = String(ym);
  // Handle full Date strings from Google Sheets (e.g. "Thu Oct 01 2026 00:00:00 GMT+0800")
  if (str.indexOf('GMT') !== -1 || str.indexOf('00:00:00') !== -1) {
    var d = new Date(str);
    if (!isNaN(d.getTime())) {
      var mn = ['', 'Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogos', 'Sep', 'Okt', 'Nov', 'Dis'];
      return mn[d.getMonth() + 1] + ' ' + d.getFullYear();
    }
  }
  // Standard "YYYY-MM" format
  var parts = str.split('-');
  if (parts.length === 2) {
    var monthNames = ['', 'Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogos', 'Sep', 'Okt', 'Nov', 'Dis'];
    var m = parseInt(parts[1]);
    if (m >= 1 && m <= 12) return monthNames[m] + ' ' + parts[0];
  }
  return str;
}

function filterPaymentTracker() {
  const query = document.getElementById('payment-student-search');
  if (!query) return;
  // Store query and re-render
  const filterMonth = document.getElementById('payment-month-filter') ? document.getElementById('payment-month-filter').value : 'all';
  renderPaymentTrackerFiltered(filterMonth, query.value.trim().toLowerCase());
}

function renderPaymentTrackerFiltered(filterMonth, searchQuery) {
  if (!paymentSummaryData) return;
  const { months, students } = paymentSummaryData;

  // Filter students by name
  const filtered = searchQuery
    ? students.filter(s => (s.studentName || '').toLowerCase().includes(searchQuery) || (s.studentID || '').toLowerCase().includes(searchQuery))
    : students;

  // Temporarily replace students and render
  const origStudents = paymentSummaryData.students;
  paymentSummaryData.students = filtered;
  renderPaymentTracker(filterMonth);
  paymentSummaryData.students = origStudents;
  // Restore search box value
  const q = document.getElementById('payment-student-search');
  if (q) q.value = searchQuery;
}

async function loadPendingReceipts() {
  const container = document.getElementById('pending-receipts');
  if (!container) return;
  container.innerHTML = '<p class="text-sm text-slate-400">Memuatkan...</p>';
  const data = await listPendingReceipts();
  if (data.error) {
    container.innerHTML = `<p class="text-sm text-red-500">Ralat memuatkan resit: ${data.error}</p>`;
    return;
  }
  if (!data.receipts || !data.receipts.length) {
    container.innerHTML = '<p class="text-sm text-slate-400">Tiada resit menunggu.</p>';
    return;
  }

  container.innerHTML = '';
  data.receipts.forEach(r => {
    const div = document.createElement('div');
    div.className = 'border border-slate-600 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-700/50';
    div.innerHTML = `
      <div>
        <p class="font-semibold text-slate-100">${escapeHtml(r.studentID || r.parentIC)} — ${escapeHtml(r.monthYear)}</p>
        <p class="text-sm text-slate-400">Kaedah: ${escapeHtml(r.paymentMethod)} | Jumlah: RM ${Number(r.amountPaid || 0).toFixed(2)}</p>
        <a href="${r.receiptURL}" target="_blank" class="text-amber-400 text-sm hover:underline">Lihat Resit</a>
      </div>
      <div class="flex gap-2">
        <button onclick="approve('${escapeHtml(r.paymentID)}', 'Approved')" class="bg-blue-900 text-amber-400 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition">Lulus</button>
        <button onclick="approve('${escapeHtml(r.paymentID)}', 'Rejected')" class="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-500 transition">Tolak</button>
      </div>
    `;
    container.appendChild(div);
  });
}

async function approve(paymentID, status) {
  const notes = prompt('Nota admin (optional):') || '';
  const res = await updateReceiptStatus(paymentID, status, notes);
  alert(res.success ? 'Status dikemaskini.' : res.error);
  // Clear cache so payment tracker + receipt list reload fresh
  paymentSummaryData = null;
  await loadAdminData();
  if (state.adminTab === 'payments') {
    await loadPaymentTracker();
  }
}
