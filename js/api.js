const API = window.APP_CONFIG.GAS_API_URL;

async function gasGet(params) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API}?${qs}`);
  return res.json();
}

async function gasPost(payload) {
  const res = await fetch(API, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' }
  });
  return res.json();
}

async function getStudentByIC(ic) {
  return gasGet({ action: 'getStudent', ic });
}

async function createBill(parentIC, monthYear, amount, email) {
  return gasPost({ action: 'createBill', parentIC, monthYear, amount, email });
}

async function uploadReceipt(parentIC, monthYear, base64, fileName, mimeType, gatewayBillID) {
  return gasPost({
    action: 'uploadReceipt',
    parentIC,
    monthYear,
    receiptBase64: base64,
    fileName,
    mimeType,
    gatewayBillID
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
