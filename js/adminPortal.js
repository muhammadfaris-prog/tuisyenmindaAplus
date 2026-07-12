// Default package reference based on the PDF
const DEFAULT_PACKAGES = [
  { level: 'Tingkatan 5', subjects: 'Matematik, B.Inggeris, Sejarah, Sains, Fizik, Kimia, Add Math, Prinsip Akaun', hours: '5 jam', classSize: 'Maksimum 8', registration: 60, monthly: 80, note: 'RM 80 / subjek' },
  { level: 'Darjah 1 & 2', subjects: 'Matematik, B.Inggeris, Sains, Prinsip Akaun, Add Math', hours: '4 jam', classSize: 'Maksimum 8', registration: 50, monthly: 80, note: 'RM 80 / subjek' },
  { level: 'Tingkatan 1, 2, 3 & 4', subjects: 'Matematik, B.Melayu, B.Inggeris, Sains', hours: '4 jam', classSize: 'Maksimum 16', registration: 50, monthly: 0, note: '1 Subjek: RM40, 2: RM80, 3: RM90, 4: RM100 (Pakej Jimat)' },
  { level: 'UPKK', subjects: 'Matematik & B.Inggeris', hours: '4 jam', classSize: 'Maksimum 10', registration: 50, monthly: 40, note: 'RM 40 / subjek' },
  { level: 'Darjah 3, 4, 5 & 6', subjects: 'Kelas Membaca', hours: '-', classSize: 'Maksimum 6', registration: 30, monthly: 80, note: 'RM 80' },
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
      <input class="pkg-level border border-slate-600 bg-slate-700 text-slate-200 rounded-lg px-3 py-2" value="${escapeHtml(pkg.level)}" placeholder="Tahap" />
      <input class="pkg-subjects border border-slate-600 bg-slate-700 text-slate-200 rounded-lg px-3 py-2" value="${escapeHtml(pkg.subjects)}" placeholder="Subjek" />
      <input class="pkg-hours border border-slate-600 bg-slate-700 text-slate-200 rounded-lg px-3 py-2" value="${escapeHtml(pkg.hours)}" placeholder="Jam/Bulan" />
      <input class="pkg-class border border-slate-600 bg-slate-700 text-slate-200 rounded-lg px-3 py-2" value="${escapeHtml(pkg.classSize)}" placeholder="Saiz Kelas" />
      <input class="pkg-reg border border-slate-600 bg-slate-700 text-slate-200 rounded-lg px-3 py-2" type="number" value="${pkg.registration}" placeholder="Yuran Pendaftaran" />
      <input class="pkg-monthly border border-slate-600 bg-slate-700 text-slate-200 rounded-lg px-3 py-2" type="number" value="${pkg.monthly}" placeholder="Yuran Bulanan" />
      <input class="pkg-note border border-slate-600 bg-slate-700 text-slate-200 rounded-lg px-3 py-2 md:col-span-2" value="${escapeHtml(pkg.note)}" placeholder="Nota harga" />
    `;
    editor.appendChild(div);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="px-4 py-3 text-amber-400 font-bold">${idx + 1}</td>
      <td class="px-4 py-3 font-medium text-slate-200">${escapeHtml(pkg.level)}</td>
      <td class="px-4 py-3 text-slate-300">${escapeHtml(pkg.subjects)}</td>
      <td class="px-4 py-3 text-slate-300">${escapeHtml(pkg.hours)}</td>
      <td class="px-4 py-3 text-slate-300">${escapeHtml(pkg.classSize)}</td>
      <td class="px-4 py-3 text-slate-300">RM ${Number(pkg.registration).toFixed(2)}</td>
      <td class="px-4 py-3 text-slate-300">${pkg.monthly ? 'RM ' + Number(pkg.monthly).toFixed(2) : '-'}<br><span class="text-xs text-amber-400">${escapeHtml(pkg.note)}</span></td>
    `;
    preview.appendChild(tr);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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
  alert(res.success ? `Pelajar disimpan: ${res.studentID}` : res.error);
  if (res.success) {
    clearStudentForm();
    loadAdminData();
  }
}

function clearStudentForm() {
  ['a-parentIC', 'a-parentName', 'a-parentPhone', 'a-studentName', 'a-schoolLevel', 'a-regFee', 'a-startMonth'].forEach(id => {
    document.getElementById(id).value = '';
  });
  // Default start month to current month
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
          <p class="text-sm text-slate-300">${escapeHtml(s.schoolLevel)} • ${escapeHtml(s.parentName)} • ${escapeHtml(s.parentPhone)} • IC: ${escapeHtml(String(s.parentIC))}</p>
          <p class="text-xs text-slate-400">Mula yuran: ${formatMonthYear(s.startMonth)}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs px-2 py-1 rounded-full ${s.status === 'Active' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-600 text-slate-300'}">${escapeHtml(s.status)}</span>
        <button onclick="editStudent('${escapeHtml(s.studentID)}')" class="text-xs bg-blue-900 text-amber-300 px-3 py-1 rounded-lg hover:bg-blue-800 transition font-medium">Edit</button>
      </div>
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

  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg mx-4 fade-in max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-bold text-amber-400">Edit Pelajar</h3>
        <button onclick="document.getElementById('edit-student-modal').remove()" class="text-slate-400 hover:text-red-500 text-xl">&times;</button>
      </div>
      <p class="text-sm text-slate-400 mb-4">Student ID: <strong>${escapeHtml(s.studentID)}</strong></p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label class="text-xs text-slate-400">IC Ibu Bapa</label>
          <input id="edit-parentIC" class="border border-slate-600 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-400" value="${escapeHtml(String(s.parentIC))}" />
        </div>
        <div>
          <label class="text-xs text-slate-400">Nama Ibu Bapa</label>
          <input id="edit-parentName" class="border border-slate-600 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-400" value="${escapeHtml(s.parentName)}" />
        </div>
        <div>
          <label class="text-xs text-slate-400">No. Telefon</label>
          <input id="edit-parentPhone" class="border border-slate-600 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-400" value="${escapeHtml(s.parentPhone)}" />
        </div>
        <div>
          <label class="text-xs text-slate-400">Nama Pelajar</label>
          <input id="edit-studentName" class="border border-slate-600 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-400" value="${escapeHtml(s.studentName)}" />
        </div>
        <div>
          <label class="text-xs text-slate-400">Tahap</label>
          <select id="edit-schoolLevel" class="border border-slate-600 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-400">
            <option value="">Pilih Tahap</option>
            ${['Darjah 1 & 2','Darjah 3, 4, 5 & 6','UPKK','Tingkatan 1, 2, 3 & 4','Tingkatan 5','Kelas Membaca','Personal Class (1 to 1)'].map(lv => `<option ${lv === s.schoolLevel ? 'selected' : ''}>${lv}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="text-xs text-slate-400">Yuran Pendaftaran (RM)</label>
          <input id="edit-regFee" type="number" class="border border-slate-600 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-400" value="${Number(s.registrationFee||0)}" />
        </div>
        <div>
          <label class="text-xs text-slate-400">Bulan Mula Yuran</label>
          <input id="edit-startMonth" type="month" class="border border-slate-600 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-400" value="${escapeHtml(s.startMonth || '')}" />
        </div>
        <div>
          <label class="text-xs text-slate-400">Status</label>
          <select id="edit-status" class="border border-slate-600 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-400">
            <option value="Active" ${s.status === 'Active' ? 'selected' : ''}>Aktif</option>
            <option value="Inactive" ${s.status === 'Inactive' ? 'selected' : ''}>Tidak Aktif</option>
          </select>
        </div>
      </div>
      <div class="flex gap-3 mt-5">
        <button onclick="saveEditStudent('${escapeHtml(s.studentID)}')" class="flex-1 bg-blue-950 text-amber-400 py-2.5 rounded-xl font-medium hover:bg-blue-900 transition">Simpan</button>
        <button onclick="document.getElementById('edit-student-modal').remove()" class="flex-1 bg-slate-600 text-slate-700 py-2.5 rounded-xl font-medium hover:bg-slate-300 transition">Batal</button>
      </div>
    </div>
  `;
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
    status: document.getElementById('edit-status').value
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
  if (!confirm('Buang subjek ini? Status akan ditukar ke Dropped.')) return;
  const res = await updateEnrollment(enrollmentID, { status: 'Dropped' });
  if (res.error) { alert('Ralat: ' + res.error); return; }
  alert('Subjek dibuang.');
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
  if (!enrollments.length) {
    container.innerHTML = '<p class="text-sm text-slate-400">Tiada subjek.</p>';
    return;
  }
  container.innerHTML = '';
  enrollments.forEach((e, idx) => {
    const div = document.createElement('div');
    div.className = 'border border-slate-600 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-700/50';
    div.innerHTML = `
      <div class="flex items-start gap-3">
        <span class="text-xs font-bold text-amber-400 bg-slate-700 w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">${idx + 1}</span>
        <div>
          <p class="font-semibold text-slate-100">${escapeHtml(e.subject)} <span class="text-xs text-slate-400">(${escapeHtml(e.enrollmentID)})</span></p>
          <p class="text-sm text-slate-300">${escapeHtml(e.studentID)} • RM ${Number(e.monthlyFee).toFixed(2)} • ${escapeHtml(e.hoursPerMonth)} jam/bulan</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs px-2 py-1 rounded-full ${e.status === 'Active' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-600 text-slate-300'}">${escapeHtml(e.status)}</span>
        <button onclick="editEnrollment('${escapeHtml(e.enrollmentID)}')" class="text-xs bg-blue-900 text-amber-400 px-2 py-1 rounded-lg hover:bg-blue-800 transition">Edit</button>
        <button onclick="removeEnrollment('${escapeHtml(e.enrollmentID)}')" class="text-xs bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-500 transition">Buang</button>
      </div>
    `;
    container.appendChild(div);
  });
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
