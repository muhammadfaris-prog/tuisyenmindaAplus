async function lookupStudent() {
  const ic = document.getElementById('parent-ic').value.trim();
  if (!ic) return alert('Sila masukkan nombor IC.');

  const data = await getStudentByIC(ic);
  if (data.error) return alert(data.error);

  state.student = data;
  document.getElementById('student-info').classList.remove('hidden');
  document.getElementById('info-name').textContent = data.studentName;
  document.getElementById('info-phone').textContent = data.parentPhone || '-';
  document.getElementById('info-level').textContent = data.schoolLevel;
  document.getElementById('info-subjects').textContent = data.subjects.join(', ');
  document.getElementById('info-fee').textContent = data.monthlyTotal.toFixed(2);
  document.getElementById('info-reg').textContent = Number(data.registrationFee || 0).toFixed(2);

  // Default month = current month
  const now = new Date();
  document.getElementById('payment-month').value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Hide QR/receipt sections when a new student is looked up
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
  document.getElementById('receipt-section').classList.remove('hidden');
  if (billCode) state.pendingBill = billCode;
  document.getElementById('receipt-section').scrollIntoView({ behavior: 'smooth' });
}

async function submitReceipt() {
  const fileInput = document.getElementById('receipt-file');
  if (!fileInput.files[0]) return alert('Sila pilih fail resit.');
  if (!state.student) return alert('Sila semak IC terlebih dahulu.');

  const file = fileInput.files[0];
  const reader = new FileReader();
  reader.onload = async function () {
    const base64 = reader.result.split(',')[1];
    const monthYear = document.getElementById('payment-month').value;
    const res = await uploadReceipt(
      state.student.parentIC,
      monthYear,
      base64,
      file.name,
      file.type,
      state.pendingBill || ''
    );
    const msg = document.getElementById('receipt-msg');
    if (res.success) {
      msg.textContent = 'Resit berjaya dihantar. Terima kasih!';
      msg.className = 'mt-3 text-sm font-medium text-emerald-600';
    } else {
      msg.textContent = 'Ralat: ' + res.error;
      msg.className = 'mt-3 text-sm font-medium text-red-500';
    }
  };
  reader.readAsDataURL(file);
}
