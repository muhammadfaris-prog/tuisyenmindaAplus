const API = window.APP_CONFIG.GAS_API_URL;

async function gasGet(params) {
  try {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${API}?${qs}`);
    if (!res.ok) return { error: `HTTP ${res.status}: ${res.statusText}` };
    return res.json();
  } catch (err) {
    console.error('gasGet failed:', err);
    return { error: 'Rangkaian gagal. Sila cuba lagi.' };
  }
}

async function gasPost(payload) {
  try {
    // Use text/plain to avoid CORS preflight — GAS web apps handle simple requests automatically
    const res = await fetch(API, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'text/plain' }
    });
    if (!res.ok) return { error: 'HTTP ' + res.status + ': ' + res.statusText };
    return res.json();
  } catch (err) {
    console.error('gasPost failed:', err);
    return { error: 'Rangkaian gagal. Sila cuba lagi.' };
  }
}

async function getStudentByIC(ic) {
  return gasGet({ action: 'getStudent', ic });
}

async function createBill(parentIC, monthYear, amount, email) {
  return gasPost({ action: 'createBill', parentIC, monthYear, amount, email });
}

async function uploadReceipt(parentIC, monthYear, base64, fileName, mimeType, gatewayBillID, amountPaid) {
  return gasPost({
    action: 'uploadReceipt',
    parentIC,
    monthYear,
    receiptBase64: base64,
    fileName,
    mimeType,
    gatewayBillID,
    amountPaid: amountPaid || 0
  });
}

async function addStudent(student) {
  return gasPost({ action: 'addStudent', ...student });
}

async function addEnrollment(enrollment) {
  return gasPost({ action: 'addEnrollment', ...enrollment });
}

async function listStudents() {
  return gasPost({ action: 'listStudents' });
}

async function listEnrollments() {
  return gasPost({ action: 'listEnrollments' });
}

async function listPendingReceipts() {
  return gasPost({ action: 'listPendingReceipts' });
}

async function updateReceiptStatus(paymentID, status, notes) {
  return gasPost({ action: 'updateReceiptStatus', paymentID, status, notes });
}

async function updateStudent(studentID, updates) {
  return gasPost({ action: 'updateStudent', studentID, ...updates });
}

async function getPaymentSummary() {
  return gasPost({ action: 'paymentSummary' });
}
