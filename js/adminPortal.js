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
    div.className = 'package-row bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3';
    div.innerHTML = `
      <input class="pkg-level border rounded-lg px-3 py-2" value="${escapeHtml(pkg.level)}" placeholder="Tahap" />
      <input class="pkg-subjects border rounded-lg px-3 py-2" value="${escapeHtml(pkg.subjects)}" placeholder="Subjek" />
      <input class="pkg-hours border rounded-lg px-3 py-2" value="${escapeHtml(pkg.hours)}" placeholder="Jam/Bulan" />
      <input class="pkg-class border rounded-lg px-3 py-2" value="${escapeHtml(pkg.classSize)}" placeholder="Saiz Kelas" />
      <input class="pkg-reg border rounded-lg px-3 py-2" type="number" value="${pkg.registration}" placeholder="Yuran Pendaftaran" />
      <input class="pkg-monthly border rounded-lg px-3 py-2" type="number" value="${pkg.monthly}" placeholder="Yuran Bulanan" />
      <input class="pkg-note border rounded-lg px-3 py-2 md:col-span-2" value="${escapeHtml(pkg.note)}" placeholder="Nota harga" />
    `;
    editor.appendChild(div);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="px-4 py-3 font-medium text-slate-800">${escapeHtml(pkg.level)}</td>
      <td class="px-4 py-3 text-slate-600">${escapeHtml(pkg.subjects)}</td>
      <td class="px-4 py-3 text-slate-600">${escapeHtml(pkg.hours)}</td>
      <td class="px-4 py-3 text-slate-600">${escapeHtml(pkg.classSize)}</td>
      <td class="px-4 py-3 text-slate-600">RM ${Number(pkg.registration).toFixed(2)}</td>
      <td class="px-4 py-3 text-slate-600">${pkg.monthly ? 'RM ' + Number(pkg.monthly).toFixed(2) : '-'}<br><span class="text-xs text-emerald-600">${escapeHtml(pkg.note)}</span></td>
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
  const student = {
    parentIC: document.getElementById('a-parentIC').value,
    parentName: document.getElementById('a-parentName').value,
    parentPhone: document.getElementById('a-parentPhone').value,
    studentName: document.getElementById('a-studentName').value,
    schoolLevel: document.getElementById('a-schoolLevel').value,
    registrationFee: document.getElementById('a-regFee').value
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
  ['a-parentIC', 'a-parentName', 'a-parentPhone', 'a-studentName', 'a-schoolLevel', 'a-regFee'].forEach(id => {
    document.getElementById(id).value = '';
  });
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
  container.innerHTML = '<p class="text-sm text-slate-500">Memuatkan...</p>';
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
    container.innerHTML = '<p class="text-sm text-slate-500">Tiada pelajar.</p>';
    return;
  }
  container.innerHTML = '';
  students.forEach(s => {
    const div = document.createElement('div');
    div.className = 'border border-slate-100 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-50';
    div.innerHTML = `
      <div>
        <p class="font-semibold text-slate-800">${escapeHtml(s.studentName)} <span class="text-xs font-normal text-slate-500">(${escapeHtml(s.studentID)})</span></p>
        <p class="text-sm text-slate-600">${escapeHtml(s.schoolLevel)} • ${escapeHtml(s.parentName)} • ${escapeHtml(s.parentPhone)} • IC: ${escapeHtml(String(s.parentIC))}</p>
      </div>
      <span class="text-xs px-2 py-1 rounded-full ${s.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}">${escapeHtml(s.status)}</span>
    `;
    container.appendChild(div);
  });
}

function filterEnrollments() {
  const query = document.getElementById('enrollment-search').value.trim().toLowerCase();
  renderEnrollments(allEnrollments.filter(e =>
    (e.subject || '').toLowerCase().includes(query) ||
    (e.studentID || '').toLowerCase().includes(query)
  ));
}

async function loadEnrollmentsList() {
  const container = document.getElementById('enrollments-list');
  if (!container) return;
  container.innerHTML = '<p class="text-sm text-slate-500">Memuatkan...</p>';
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
    container.innerHTML = '<p class="text-sm text-slate-500">Tiada subjek.</p>';
    return;
  }
  container.innerHTML = '';
  enrollments.forEach(e => {
    const div = document.createElement('div');
    div.className = 'border border-slate-100 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-50';
    div.innerHTML = `
      <div>
        <p class="font-semibold text-slate-800">${escapeHtml(e.subject)}</p>
        <p class="text-sm text-slate-600">${escapeHtml(e.studentID)} • RM ${Number(e.monthlyFee).toFixed(2)} • ${escapeHtml(e.hoursPerMonth)} jam/bulan</p>
      </div>
      <span class="text-xs px-2 py-1 rounded-full ${e.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}">${escapeHtml(e.status)}</span>
    `;
    container.appendChild(div);
  });
}

async function loadPendingReceipts() {
  const container = document.getElementById('pending-receipts');
  if (!container) return;
  container.innerHTML = '<p class="text-sm text-slate-500">Memuatkan...</p>';
  const data = await listPendingReceipts();
  if (data.error) {
    container.innerHTML = `<p class="text-sm text-red-500">Ralat memuatkan resit: ${data.error}</p>`;
    return;
  }
  if (!data.receipts || !data.receipts.length) {
    container.innerHTML = '<p class="text-sm text-slate-500">Tiada resit menunggu.</p>';
    return;
  }

  container.innerHTML = '';
  data.receipts.forEach(r => {
    const div = document.createElement('div');
    div.className = 'border border-slate-100 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-50';
    div.innerHTML = `
      <div>
        <p class="font-semibold text-slate-800">${escapeHtml(r.studentID || r.parentIC)} — ${escapeHtml(r.monthYear)}</p>
        <p class="text-sm text-slate-600">Kaedah: ${escapeHtml(r.paymentMethod)} | Jumlah: RM ${Number(r.amountPaid || 0).toFixed(2)}</p>
        <a href="${r.receiptURL}" target="_blank" class="text-blue-600 text-sm hover:underline">Lihat Resit</a>
      </div>
      <div class="flex gap-2">
        <button onclick="approve('${escapeHtml(r.paymentID)}', 'Approved')" class="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-500 transition">Lulus</button>
        <button onclick="approve('${escapeHtml(r.paymentID)}', 'Rejected')" class="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-400 transition">Tolak</button>
      </div>
    `;
    container.appendChild(div);
  });
}

async function approve(paymentID, status) {
  const notes = prompt('Nota admin (optional):') || '';
  const res = await updateReceiptStatus(paymentID, status, notes);
  alert(res.success ? 'Status dikemaskini.' : res.error);
  loadAdminData();
}
