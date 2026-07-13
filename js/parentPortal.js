async function lookupStudent() {
  const ic = document.getElementById('parent-ic').value.trim();
  if (!ic) return alert('Sila masukkan nombor IC.');

  const resp = await listStudentsByIC(ic);
  if (resp.error) return alert(resp.error);
  const students = resp.students || [];

  if (!students.length) { return alert('Pelajar tidak dijumpai.'); }

  if (students.length === 1) {
    showStudentDetail(students[0]);
  } else {
    showStudentSelector(students);
  }
}

function showStudentSelector(students) {
  // Show a minimal selector card ABOVE student-info, don't touch student-info internals
  var existing = document.getElementById('student-selector-wrap');
  if (existing) existing.remove();
  // Hide student-info until a student is selected
  document.getElementById('student-info').classList.add('hidden');
  
  var esc = function(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; };
  var opts = '<option value="">-- Pilih Pelajar --</option>' + students.map(function(s) {
    return '<option value="' + s.studentID + '">' + esc(s.studentName) + ' (' + esc(s.schoolLevel) + ')</option>';
  }).join('');
  
  var wrap = document.createElement('div');
  wrap.id = 'student-selector-wrap';
  wrap.className = 'bg-slate-800 rounded-2xl shadow-sm border border-slate-600 p-6 mb-6 card';
  wrap.innerHTML = '<p class="text-sm text-slate-400 mb-3">' + students.length + ' pelajar dijumpai. Pilih nama:</p><select id="student-selector" onchange="onStudentSelect()" class="border border-slate-600 bg-slate-700 text-slate-100 rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-amber-400">' + opts + '</select>';
  
  var infoDiv = document.getElementById('student-info');
  infoDiv.parentNode.insertBefore(wrap, infoDiv);
  window._multiStudents = students;
}

function onStudentSelect() {
  var sid = document.getElementById('student-selector').value;
  if (!sid || !window._multiStudents) return;
  var s = window._multiStudents.find(function(st) { return st.studentID === sid; });
  if (s) showStudentDetail(s);
}

function showStudentDetail(data) {
  state.student = data;
  // Remove selector wrap if present
  var selWrap = document.getElementById('student-selector-wrap');
  if (selWrap) selWrap.remove();
  
  var esc = function(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; };
  var subjHtml = '';
  if (data.enrollments && data.enrollments.length) {
    subjHtml = data.enrollments.map(function(e) { return '<span class="inline-block bg-slate-700 px-2 py-1 rounded text-xs mr-1 mb-1">' + esc(e.subject) + ' <b class="text-amber-400">RM' + Number(e.monthlyFee||0).toFixed(0) + '</b></span>'; }).join('');
  } else {
    subjHtml = '<span class="text-slate-500">-</span>';
  }
  var baseFee = Number(data.monthlyFee || data.monthlyTotal || 0);
  var specialFee = Number(data.specialFee || 0);
  var displayFee = baseFee + specialFee;
  var feeHtml = displayFee.toFixed(2);
  if (specialFee > 0) feeHtml += ' <span class="text-xs text-amber-400">(termasuk RM' + specialFee.toFixed(0) + ' tambahan)</span>';
  var hoursText = (data.enrollments && data.enrollments.length) ? ((data.enrollments[0].hoursPerMonth || '-') + ' jam/bulan') : '-';
  
  // Rebuild student-info completely so all elements are guaranteed to exist
  document.getElementById('student-info').innerHTML = 
    '<div class="flex items-start justify-between mb-4">' +
      '<div>' +
        '<h3 class="text-xl font-bold text-amber-400">' + esc(data.studentName) + '</h3>' +
        '<p class="text-sm text-slate-300">No. Telefon: <span>' + esc(data.parentPhone || '-') + '</span></p>' +
      '</div>' +
      '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400">Aktif</span>' +
    '</div>' +
    '<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">' +
      '<div class="bg-slate-700/50 rounded-xl p-4 border border-slate-600"><p class="text-xs text-slate-400 uppercase tracking-wide">Tahap</p><p class="font-semibold text-slate-200">' + esc(data.schoolLevel || '') + ' (Pakej)</p></div>' +
      '<div class="bg-slate-700/50 rounded-xl p-4 border border-slate-600"><p class="text-xs text-slate-400 uppercase tracking-wide">Jam / Kelas</p><p class="font-semibold text-slate-200">' + esc(hoursText) + '</p></div>' +
      '<div class="bg-slate-700/50 rounded-xl p-4 border border-slate-600 md:col-span-2"><p class="text-xs text-slate-300 uppercase tracking-wide">Subjek</p><p class="font-semibold text-slate-100">' + subjHtml + '</p></div>' +
    '</div>' +
    '<div class="bg-amber-500/10 rounded-xl p-5 border border-amber-500/30 mb-6 flex items-center justify-between">' +
      '<div><p class="text-sm text-amber-200 font-medium">Yuran Bulanan</p><p class="text-3xl font-bold text-amber-300">RM ' + feeHtml + '</p></div>' +
      '<div class="text-right"><p class="text-sm text-amber-200 font-medium">Yuran Pendaftaran</p><p class="text-xl font-bold text-amber-300">RM ' + Number(data.registrationFee||0).toFixed(2) + '</p></div>' +
    '</div>' +
    '<label class="block text-sm font-semibold mb-2">Bulan Bayaran</label>' +
    '<input id="payment-month" type="month" title="Bulan Bayaran" class="border border-slate-600 bg-slate-700 text-slate-100 rounded-xl px-3 py-3 w-full mb-5 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm" />' +
    '<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">' +
      '<button onclick="payWithFPX()" class="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-500 transition shadow-md flex items-center justify-center gap-2"><span>💳</span> Bayar dengan FPX</button>' +
      '<button onclick="showReceiptUpload()" class="w-full bg-slate-700 text-slate-200 py-3 rounded-xl font-medium hover:bg-slate-600 transition flex items-center justify-center gap-2"><span>📤</span> Muat Naik Resit</button>' +
    '</div>' +
    '<button onclick="showQRCode()" class="w-full bg-blue-950 text-amber-400 py-3 rounded-xl font-medium hover:bg-blue-900 transition shadow-md flex items-center justify-center gap-2"><span>📱</span> Bayar melalui QR Code</button>';
  
  document.getElementById('student-info').classList.remove('hidden');
  
  var now = new Date();
  var pm = document.getElementById('payment-month');
  if (pm) pm.value = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

  document.getElementById('qr-section').classList.add('hidden');
  document.getElementById('receipt-section').classList.add('hidden');
}

async function payWithFPX() {
  if (!state.student) return;
  const monthYear = document.getElementById('payment-month').value;
  if (!monthYear) return alert('Sila pilih bulan.');

  const result = await createBill(state.student.parentIC, monthYear, state.student.monthlyTotal, '');
  if (result.error) return alert(result.error);

  state.pendingBill = result.billCode;
  window.location.href = result.paymentURL;
}

function showQRCode() {
  if (!state.student) return alert('Sila semak IC terlebih dahulu.');
  document.getElementById('qr-section').classList.remove('hidden');
  document.getElementById('qr-amount').textContent = state.student.monthlyTotal.toFixed(2);
  document.getElementById('qr-section').scrollIntoView({ behavior: 'smooth' });
}

function showReceiptUpload(billCode) {
  // Ensure month is selected before allowing upload
  const monthYear = document.getElementById('payment-month').value;
  if (!monthYear) {
    alert('Sila pilih BULAN bayaran terlebih dahulu sebelum muat naik resit.');
    document.getElementById('payment-month').focus();
    return;
  }
  document.getElementById('receipt-section').classList.remove('hidden');
  // Display selected month
  const disp = document.getElementById('receipt-month-display');
  if (disp) {
    const parts = monthYear.split('-');
    const monthNames = ['', 'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
    disp.textContent = monthNames[parseInt(parts[1])] + ' ' + parts[0];
  }
  if (billCode) state.pendingBill = billCode;
  document.getElementById('receipt-section').scrollIntoView({ behavior: 'smooth' });
}

async function submitReceipt() {
  const fileInput = document.getElementById('receipt-file');
  if (!fileInput.files[0]) return alert('Sila pilih fail resit.');
  if (!state.student) return alert('Sila semak IC terlebih dahulu.');

  const monthYear = document.getElementById('payment-month').value;
  if (!monthYear) return alert('Sila pilih BULAN bayaran sebelum hantar resit.');

  const amountInput = document.getElementById('receipt-amount');
  const amountPaid = parseFloat(amountInput ? amountInput.value : 0);
  if (amountInput && (!amountInput.value || isNaN(amountPaid) || amountPaid <= 0)) {
    return alert('Sila masukkan amaun yang dibayar (RM).');
  }

  // Show loading state
  const btn = document.querySelector('#receipt-section .bg-blue-950');
  const msg = document.getElementById('receipt-msg');
  if (btn) {
    btn.textContent = '⏳ Sedang memuat naik...';
    btn.disabled = true;
  }
  if (msg) { msg.textContent = 'Memuat naik resit...'; msg.className = 'mt-3 text-sm font-medium text-amber-400'; }

  const file = fileInput.files[0];
  const reader = new FileReader();
  reader.onload = async function () {
    const base64 = reader.result.split(',')[1];
    const res = await uploadReceipt(
      state.student.parentIC,
      monthYear,
      base64,
      file.name,
      file.type,
      state.pendingBill || '',
      amountPaid || 0
    );
    if (res.success) {
      if (msg) { msg.textContent = 'Resit berjaya dihantar. Terima kasih!'; msg.className = 'mt-3 text-sm font-medium text-emerald-400'; }
      if (amountInput) amountInput.value = '';
      fileInput.value = '';
    } else {
      if (msg) { msg.textContent = 'Ralat: ' + res.error; msg.className = 'mt-3 text-sm font-medium text-red-400'; }
    }
    if (btn) {
      btn.textContent = 'Hantar Resit';
      btn.disabled = false;
    }
  };
  reader.readAsDataURL(file);
}
