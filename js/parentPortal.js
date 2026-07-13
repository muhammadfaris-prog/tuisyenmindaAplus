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
  document.getElementById('student-info').classList.remove('hidden');
  var esc = function(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; };
  var opts = '<option value=\"\">-- Pilih Pelajar --</option>' + students.map(function(s) {
    return '<option value=\"' + s.studentID + '\">' + esc(s.studentName) + ' (' + esc(s.schoolLevel) + ')</option>';
  }).join('');
  // Prepend selector without destroying existing detail elements
  var container = document.getElementById('student-info');
  var existing = document.getElementById('student-selector-wrap');
  if (existing) existing.remove();
  var wrap = document.createElement('div');
  wrap.id = 'student-selector-wrap';
  wrap.className = 'bg-slate-700/50 rounded-xl p-4 mb-4';
  wrap.innerHTML = '<p class=\"text-sm text-slate-400 mb-2\">' + students.length + ' pelajar dijumpai. Pilih nama:</p><select id=\"student-selector\" onchange=\"onStudentSelect()\" class=\"border border-slate-600 bg-slate-700 text-slate-100 rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-amber-400\">' + opts + '</select>';
  container.insertBefore(wrap, container.firstChild);
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
  // Remove selector wrap if present (from multi-student lookup)
  var selWrap = document.getElementById('student-selector-wrap');
  if (selWrap) selWrap.remove();
  document.getElementById('student-info').classList.remove('hidden');
  document.getElementById('info-name').textContent = data.studentName;
  document.getElementById('info-phone').textContent = data.parentPhone || '-';
  document.getElementById('info-level').textContent = (data.schoolLevel || '') + ' (Pakej)';
  var esc = function(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; };
  var subjHtml = '';
  if (data.enrollments && data.enrollments.length) {
    subjHtml = data.enrollments.map(function(e) { return '<span class=\"inline-block bg-slate-700 px-2 py-1 rounded text-xs mr-1 mb-1\">' + esc(e.subject) + ' <b class=\"text-amber-400\">RM' + Number(e.monthlyFee).toFixed(0) + '</b></span>'; }).join('');
  } else {
    subjHtml = '<span class=\"text-slate-500\">-</span>';
  }
  document.getElementById('info-subjects').innerHTML = subjHtml;
  var baseFee = Number(data.monthlyFee || data.monthlyTotal || 0);
  var specialFee = Number(data.specialFee || 0);
  var displayFee = baseFee + specialFee;
  var feeHtml = displayFee.toFixed(2);
  if (specialFee > 0) feeHtml += ' <span class=\"text-xs text-amber-400\">(termasuk RM' + specialFee.toFixed(0) + ' tambahan)</span>';
  document.getElementById('info-fee').innerHTML = feeHtml;
  document.getElementById('info-reg').textContent = Number(data.registrationFee || 0).toFixed(2);
  // Show jam info from first enrollment
  if (data.enrollments && data.enrollments.length) {
    document.getElementById('info-hours').textContent = (data.enrollments[0].hoursPerMonth || '-') + ' jam/bulan';
  }

  var now = new Date();
  document.getElementById('payment-month').value = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

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
