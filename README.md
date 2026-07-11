# Zool Tuisyen System — Implementation Guide

A tuition-center fee payment and student management web application.

- **Frontend:** HTML5 + Tailwind CSS + Vanilla JS, hosted on GitHub Pages / Vercel.
- **Backend:** Google Apps Script (GAS) bound to a Google Sheet.
- **File Storage:** Google Drive (receipts uploaded as base64).
- **Payment:** Local FPX gateway (ToyyibPay / Billplz).

> **Security note:** All API URLs and gateway secrets live in `config.js` (frontend) and GAS Script Properties (backend). The public GitHub repo contains **no secrets**.

---

## 1. Google Sheets Database Schema

Create a Google Sheet named **"Zool Tuisyen Database"** with three sheets:

### Sheet: `Students`

| Column | Header | Description |
|--------|--------|-------------|
| A | `studentID` | Auto-generated unique ID (e.g. `STU-0001`) |
| B | `parentIC` | Parent / guardian IC number (login key) |
| C | `parentName` | Parent / guardian name |
| D | `parentPhone` | WhatsApp / contact number |
| E | `studentName` | Student full name |
| F | `schoolLevel` | e.g. `Darjah 1-2`, `Darjah 3-6`, `UPKK`, `Tingkatan 1-4`, `Tingkatan 5`, `Personal Class` |
| G | `registrationFee` | One-time fee (e.g. `50`) |
| H | `registeredAt` | Timestamp |
| I | `status` | `Active` / `Inactive` |

### Sheet: `Enrollments`

| Column | Header | Description |
|--------|--------|-------------|
| A | `enrollmentID` | Auto-generated (e.g. `ENR-0001`) |
| B | `studentID` | Foreign key to `Students` |
| C | `subject` | e.g. `Matematik`, `B.Inggeris`, `Sejarah`, `Sains`, `Fizik`, `Kimia`, `Add Math`, `Prinsip Akaun`, `B.Melayu`, `Bahasa Arab`, `Jawi` |
| D | `monthlyFee` | Fee for this subject line item |
| E | `hoursPerMonth` | e.g. `4` or `5` |
| F | `createdAt` | Timestamp |
| G | `status` | `Active` / `Dropped` |

### Sheet: `Payments`

| Column | Header | Description |
|--------|--------|-------------|
| A | `paymentID` | Auto-generated (e.g. `PAY-0001`) |
| B | `studentID` | Foreign key |
| C | `parentIC` | For quick lookup |
| D | `monthYear` | e.g. `2026-07` |
| E | `amountDue` | Calculated total due |
| F | `amountPaid` | Amount actually paid |
| G | `paymentMethod` | `FPX` / `Cash` / `Bank Transfer` |
| H | `gatewayBillID` | Bill ID returned by ToyyibPay / Billplz |
| I | `gatewayStatus` | `pending`, `completed`, `failed` |
| J | `receiptURL` | Google Drive URL of uploaded receipt |
| K | `receiptFileName` | Original file name |
| L | `adminApproval` | `Pending` / `Approved` / `Rejected` |
| M | `adminNotes` | Optional notes |
| N | `createdAt` | Timestamp |
| O | `paidAt` | Timestamp from gateway callback |

---

## 2. Google Apps Script Backend

### 2.1 Create the project

1. Open the Google Sheet.
2. Go to **Extensions → Apps Script**.
3. Rename the project to `ZoolTuisyenBackend`.
4. In the GAS editor, go to **Project Settings → Script Properties**.
5. Add these properties:

| Property | Value |
|----------|-------|
| `DRIVE_FOLDER_ID` | The ID of the Google Drive folder where receipts will be saved. |
| `TOYYIBPAY_API_KEY` | Your ToyyibPay secret key (or Billplz API key). |
| `TOYYIBPAY_CATEGORY_CODE` | Your ToyyibPay category code. |
| `TOYYIBPAY_API_URL` | `https://toyyibpay.com/index.php/api/createBill` |
| `FRONTEND_URL` | Your GitHub Pages / Vercel URL, e.g. `https://yourname.github.io/zool-tuisyen` |

> For Billplz, replace the ToyyibPay URL and payload keys accordingly.

### 2.2 `Code.gs`

Replace the default `Code.gs` content with the template below.

```javascript
// ============================================================
// Zool Tuisyen System — Google Apps Script Backend
// ============================================================

const SHEET_NAME_STUDENTS   = 'Students';
const SHEET_NAME_ENROLLMENTS = 'Enrollments';
const SHEET_NAME_PAYMENTS   = 'Payments';

// --- Helpers -------------------------------------------------

function getConfig(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

function getSheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function jsonResponse(data, statusCode) {
  statusCode = statusCode || 200;
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setResponseCode(statusCode)
    .setMimeType(ContentService.MimeType.JSON);
}

function generateID(prefix, row) {
  return prefix + '-' + String(row).padStart(4, '0');
}

function findRowByIC(ic) {
  const sheet = getSheet(SHEET_NAME_STUDENTS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim() === String(ic).trim()) {
      return { rowIndex: i + 1, record: data[i] };
    }
  }
  return null;
}

function getEnrollmentsByStudentID(studentID) {
  const sheet = getSheet(SHEET_NAME_ENROLLMENTS);
  const data = sheet.getDataRange().getValues();
  const out = [];
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim() === String(studentID).trim() && data[i][6] !== 'Dropped') {
      out.push({
        enrollmentID: data[i][0],
        subject: data[i][2],
        monthlyFee: data[i][3],
        hoursPerMonth: data[i][4]
      });
    }
  }
  return out;
}

function calculateMonthlyFee(studentID) {
  const enrollments = getEnrollmentsByStudentID(studentID);
  let total = 0;
  const subjects = [];
  enrollments.forEach(e => {
    total += Number(e.monthlyFee);
    subjects.push(e.subject);
  });
  return { total, subjects, enrollments };
}

// --- doGet / doPost entry points -----------------------------

function doGet(e) {
  const action = e.parameter.action;

  if (action === 'health') {
    return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
  }

  if (action === 'getStudent') {
    const ic = e.parameter.ic;
    if (!ic) return jsonResponse({ error: 'IC is required' }, 400);

    const found = findRowByIC(ic);
    if (!found) return jsonResponse({ error: 'Student not found' }, 404);

    const r = found.record;
    const feeInfo = calculateMonthlyFee(r[0]);

    return jsonResponse({
      studentID: r[0],
      parentIC: r[1],
      parentName: r[2],
      parentPhone: r[3],
      studentName: r[4],
      schoolLevel: r[5],
      registrationFee: r[6],
      status: r[8],
      monthlyTotal: feeInfo.total,
      subjects: feeInfo.subjects,
      enrollments: feeInfo.enrollments
    });
  }

  return jsonResponse({ error: 'Unknown action' }, 400);
}

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;

    // 1. CREATE BILL (FPX)
    if (action === 'createBill') {
      return handleCreateBill(params);
    }

    // 2. UPLOAD RECEIPT
    if (action === 'uploadReceipt') {
      return handleUploadReceipt(params);
    }

    // 3. ADMIN: ADD STUDENT
    if (action === 'addStudent') {
      return handleAddStudent(params);
    }

    // 4. ADMIN: ADD ENROLLMENT
    if (action === 'addEnrollment') {
      return handleAddEnrollment(params);
    }

    // 5. ADMIN: LIST PENDING RECEIPTS
    if (action === 'listPendingReceipts') {
      return handleListPendingReceipts(params);
    }

    // 6. ADMIN: APPROVE / REJECT RECEIPT
    if (action === 'updateReceiptStatus') {
      return handleUpdateReceiptStatus(params);
    }

    return jsonResponse({ error: 'Unknown action' }, 400);
  } catch (err) {
    return jsonResponse({ error: err.toString() }, 500);
  }
}

// --- Action handlers -----------------------------------------

function handleCreateBill(params) {
  const ic = params.parentIC;
  const monthYear = params.monthYear;
  const found = findRowByIC(ic);
  if (!found) return jsonResponse({ error: 'Student not found' }, 404);

  const r = found.record;
  const feeInfo = calculateMonthlyFee(r[0]);
  const amount = params.amount || feeInfo.total;

  const billName = `Yuran ${monthYear} - ${r[4]}`;
  const description = `Subjek: ${feeInfo.subjects.join(', ')}`;
  const returnUrl = `${getConfig('FRONTEND_URL')}/?page=payment-success&bill={bill_id}`;
  const callbackUrl = `${getConfig('FRONTEND_URL')}/api/gateway-callback.html`;

  const payload = {
    userSecretKey: getConfig('TOYYIBPAY_API_KEY'),
    categoryCode: getConfig('TOYYIBPAY_CATEGORY_CODE'),
    billName: billName,
    billDescription: description,
    billPriceSetting: 1,
    billPayorInfo: 1,
    billAmount: Math.round(amount * 100), // ToyyibPay uses cents
    billReturnUrl: returnUrl,
    billCallbackUrl: callbackUrl,
    billExternalReferenceNo: `${r[0]}|${monthYear}`,
    billTo: r[2],
    billEmail: params.email || 'parent@example.com',
    billPhone: r[3]
  };

  const options = {
    method: 'post',
    payload: payload
  };

  const response = UrlFetchApp.fetch(getConfig('TOYYIBPAY_API_URL'), options);
  const result = JSON.parse(response.getContentText());

  // Log pending payment
  const payments = getSheet(SHEET_NAME_PAYMENTS);
  const nextRow = payments.getLastRow() + 1;
  payments.appendRow([
    generateID('PAY', nextRow),
    r[0],
    ic,
    monthYear,
    amount,
    0,
    'FPX',
    result[1] ? result[1].BillCode : result.bill_code || '',
    'pending',
    '',
    '',
    'Pending',
    '',
    new Date().toISOString(),
    ''
  ]);

  return jsonResponse({
    success: true,
    gateway: 'toyyibpay',
    billCode: result[1] ? result[1].BillCode : result.bill_code,
    paymentURL: result[1] ? result[1].BillURL : result.bill_url,
    amount: amount
  });
}

function handleUploadReceipt(params) {
  const ic = params.parentIC;
  const monthYear = params.monthYear;
  const base64Data = params.receiptBase64;
  const fileName = params.fileName || 'receipt.png';
  const mimeType = params.mimeType || 'image/png';
  const gatewayBillID = params.gatewayBillID || '';

  if (!ic || !monthYear || !base64Data) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  // Decode and save to Drive
  const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
  const folder = DriveApp.getFolderById(getConfig('DRIVE_FOLDER_ID'));
  const file = folder.createFile(blob);
  const fileUrl = file.getUrl();

  // Find or create payment row
  const payments = getSheet(SHEET_NAME_PAYMENTS);
  const data = payments.getDataRange().getValues();
  let updated = false;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][2]).trim() === String(ic).trim() &&
        String(data[i][3]).trim() === String(monthYear).trim() &&
        (gatewayBillID === '' || String(data[i][7]).trim() === String(gatewayBillID).trim())) {
      payments.getRange(i + 1, 10).setValue(fileUrl);      // receiptURL
      payments.getRange(i + 1, 11).setValue(fileName);     // receiptFileName
      payments.getRange(i + 1, 12).setValue('Pending');    // adminApproval
      payments.getRange(i + 1, 14).setValue(new Date().toISOString()); // createdAt
      updated = true;
      break;
    }
  }

  if (!updated) {
    const nextRow = payments.getLastRow() + 1;
    payments.appendRow([
      generateID('PAY', nextRow),
      '',
      ic,
      monthYear,
      0,
      0,
      'Bank Transfer',
      gatewayBillID,
      'pending',
      fileUrl,
      fileName,
      'Pending',
      '',
      new Date().toISOString(),
      ''
    ]);
  }

  return jsonResponse({ success: true, receiptURL: fileUrl });
}

function handleAddStudent(params) {
  const sheet = getSheet(SHEET_NAME_STUDENTS);
  const nextRow = sheet.getLastRow() + 1;
  const studentID = generateID('STU', nextRow);

  sheet.appendRow([
    studentID,
    params.parentIC,
    params.parentName,
    params.parentPhone,
    params.studentName,
    params.schoolLevel,
    params.registrationFee || 0,
    new Date().toISOString(),
    'Active'
  ]);

  return jsonResponse({ success: true, studentID: studentID });
}

function handleAddEnrollment(params) {
  const sheet = getSheet(SHEET_NAME_ENROLLMENTS);
  const nextRow = sheet.getLastRow() + 1;
  const enrollmentID = generateID('ENR', nextRow);

  sheet.appendRow([
    enrollmentID,
    params.studentID,
    params.subject,
    params.monthlyFee,
    params.hoursPerMonth || 4,
    new Date().toISOString(),
    'Active'
  ]);

  return jsonResponse({ success: true, enrollmentID: enrollmentID });
}

function handleListPendingReceipts(params) {
  const sheet = getSheet(SHEET_NAME_PAYMENTS);
  const data = sheet.getDataRange().getValues();
  const out = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][11] === 'Pending' && data[i][9]) {
      out.push({
        paymentID: data[i][0],
        studentID: data[i][1],
        parentIC: data[i][2],
        monthYear: data[i][3],
        amountPaid: data[i][5],
        paymentMethod: data[i][6],
        gatewayBillID: data[i][7],
        receiptURL: data[i][9],
        receiptFileName: data[i][10],
        adminApproval: data[i][11],
        createdAt: data[i][13]
      });
    }
  }
  return jsonResponse({ success: true, receipts: out });
}

function handleUpdateReceiptStatus(params) {
  const sheet = getSheet(SHEET_NAME_PAYMENTS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(params.paymentID).trim()) {
      sheet.getRange(i + 1, 12).setValue(params.status);      // adminApproval
      sheet.getRange(i + 1, 13).setValue(params.notes || ''); // adminNotes
      if (params.status === 'Approved') {
        sheet.getRange(i + 1, 9).setValue('completed');         // gatewayStatus
        sheet.getRange(i + 1, 15).setValue(new Date().toISOString()); // paidAt
      }
      return jsonResponse({ success: true });
    }
  }
  return jsonResponse({ error: 'Payment not found' }, 404);
}
```

### 2.3 Deploy as Web App

1. Click **Deploy → New deployment**.
2. Choose type **Web app**.
3. Execute as: **Me**.
4. Who has access: **Anyone**.
5. Copy the **Web App URL**.
6. Paste it into your frontend `config.js` as `GAS_API_URL`.

---

## 3. Frontend Project Structure

```
zool-tuisyen/
├── index.html
├── css/
│   └── (Tailwind via CDN)
├── js/
│   ├── config.js          <-- NOT committed with real secrets
│   ├── config.example.js  <-- safe template to commit
│   ├── api.js             <-- GAS communication layer
│   ├── app.js             <-- router & shared state
│   ├── parentPortal.js    <-- parent UI logic
│   └── adminPortal.js     <-- admin UI logic
└── .gitignore
```

### 3.1 `.gitignore`

```gitignore
node_modules/
.DS_Store
js/config.js
```

### 3.2 `js/config.example.js`

```javascript
// Copy this file to config.js and fill in your real values.
// config.js is ignored by Git.
window.APP_CONFIG = {
  GAS_API_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
  FRONTEND_URL: 'https://yourname.github.io/zool-tuisyen',
  // Optional: public gateway callback helper URL if hosted separately
  GATEWAY_CALLBACK_URL: 'https://yourname.github.io/zool-tuisyen/api/gateway-callback.html'
};
```

### 3.3 `js/api.js`

```javascript
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

async function listPendingReceipts() {
  return gasPost({ action: 'listPendingReceipts' });
}

async function updateReceiptStatus(paymentID, status, notes) {
  return gasPost({ action: 'updateReceiptStatus', paymentID, status, notes });
}
```

### 3.4 `js/app.js`

```javascript
const state = {
  page: 'parent',
  student: null,
  pendingBill: null
};

function navigate(page) {
  state.page = page;
  render();
}

function render() {
  document.getElementById('parent-portal').classList.add('hidden');
  document.getElementById('admin-portal').classList.add('hidden');

  if (state.page === 'parent') {
    document.getElementById('parent-portal').classList.remove('hidden');
  } else if (state.page === 'admin') {
    document.getElementById('admin-portal').classList.remove('hidden');
    loadAdminData();
  }
}

// Simple router from URL ?page=...
const urlParams = new URLSearchParams(window.location.search);
const pageParam = urlParams.get('page');
if (pageParam === 'payment-success') {
  state.page = 'parent';
  // Show receipt upload step automatically
  setTimeout(() => showReceiptUpload(urlParams.get('bill')), 100);
}

render();
```

### 3.5 `index.html`

```html
<!DOCTYPE html>
<html lang="ms">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Zool Tuisyen — Portal Yuran</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="js/config.js"></script>
</head>
<body class="bg-slate-50 text-slate-800">
  <nav class="bg-emerald-700 text-white p-4 shadow">
    <div class="max-w-4xl mx-auto flex justify-between items-center">
      <h1 class="font-bold text-lg">Zool Tuisyen</h1>
      <div class="space-x-2">
        <button onclick="navigate('parent')" class="px-3 py-1 rounded hover:bg-emerald-600">Ibu Bapa</button>
        <button onclick="navigate('admin')" class="px-3 py-1 rounded hover:bg-emerald-600">Admin</button>
      </div>
    </div>
  </nav>

  <main class="max-w-4xl mx-auto p-4">
    <!-- PARENT PORTAL -->
    <section id="parent-portal">
      <div class="bg-white rounded-xl shadow p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">Portal Ibu Bapa</h2>
        <label class="block text-sm font-medium mb-1">Nombor Kad Pengenalan (IC)</label>
        <div class="flex gap-2">
          <input id="parent-ic" type="text" placeholder="e.g. 800101-01-1234" class="border rounded px-3 py-2 w-full" />
          <button onclick="lookupStudent()" class="bg-emerald-700 text-white px-4 py-2 rounded hover:bg-emerald-600">Semak</button>
        </div>
      </div>

      <div id="student-info" class="hidden bg-white rounded-xl shadow p-6 mb-6">
        <h3 class="text-lg font-semibold mb-2" id="info-name"></h3>
        <p class="text-sm text-slate-600 mb-1">Tahap: <span id="info-level"></span></p>
        <p class="text-sm text-slate-600 mb-1">Subjek: <span id="info-subjects"></span></p>
        <p class="text-sm text-slate-600 mb-4">Yuran Bulanan: <strong>RM <span id="info-fee"></span></strong></p>

        <label class="block text-sm font-medium mb-1">Bulan Bayaran</label>
        <input id="payment-month" type="month" class="border rounded px-3 py-2 w-full mb-4" />

        <button onclick="payWithFPX()" class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-500 mb-3">Bayar dengan FPX</button>
        <button onclick="showReceiptUpload()" class="w-full bg-slate-200 text-slate-800 py-2 rounded hover:bg-slate-300">Muat Naik Resit</button>
      </div>

      <div id="receipt-section" class="hidden bg-white rounded-xl shadow p-6">
        <h3 class="text-lg font-semibold mb-2">Muat Naik Resit Pembayaran</h3>
        <input id="receipt-file" type="file" accept="image/*,.pdf" class="border rounded px-3 py-2 w-full mb-4" />
        <button onclick="submitReceipt()" class="bg-emerald-700 text-white px-4 py-2 rounded hover:bg-emerald-600">Hantar Resit</button>
        <p id="receipt-msg" class="mt-2 text-sm"></p>
      </div>
    </section>

    <!-- ADMIN PORTAL -->
    <section id="admin-portal" class="hidden">
      <div class="bg-white rounded-xl shadow p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">Daftar Pelajar Baru</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input id="a-parentIC" placeholder="IC Ibu Bapa" class="border rounded px-3 py-2" />
          <input id="a-parentName" placeholder="Nama Ibu Bapa" class="border rounded px-3 py-2" />
          <input id="a-parentPhone" placeholder="No. Telefon" class="border rounded px-3 py-2" />
          <input id="a-studentName" placeholder="Nama Pelajar" class="border rounded px-3 py-2" />
          <select id="a-schoolLevel" class="border rounded px-3 py-2">
            <option value="">Pilih Tahap</option>
            <option>Darjah 1 & 2</option>
            <option>Darjah 3, 4, 5 & 6</option>
            <option>UPKK</option>
            <option>Tingkatan 1, 2, 3 & 4</option>
            <option>Tingkatan 5</option>
            <option>Kelas Membaca</option>
            <option>Personal Class (1 to 1)</option>
          </select>
          <input id="a-regFee" placeholder="Yuran Pendaftaran" type="number" class="border rounded px-3 py-2" />
        </div>
        <button onclick="submitStudent()" class="mt-4 bg-emerald-700 text-white px-4 py-2 rounded hover:bg-emerald-600">Simpan Pelajar</button>
      </div>

      <div class="bg-white rounded-xl shadow p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">Tambah Subjek</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input id="a-studentID" placeholder="Student ID" class="border rounded px-3 py-2" />
          <select id="a-subject" class="border rounded px-3 py-2">
            <option value="">Pilih Subjek</option>
            <option>Matematik</option>
            <option>B.Inggeris</option>
            <option>Sejarah</option>
            <option>Sains</option>
            <option>Fizik</option>
            <option>Kimia</option>
            <option>Add Math</option>
            <option>Prinsip Akaun</option>
            <option>B.Melayu</option>
            <option>Bahasa Arab</option>
            <option>Jawi</option>
          </select>
          <input id="a-monthlyFee" placeholder="Yuran Bulanan" type="number" class="border rounded px-3 py-2" />
          <input id="a-hours" placeholder="Jam Sebulan" type="number" class="border rounded px-3 py-2" />
        </div>
        <button onclick="submitEnrollment()" class="mt-4 bg-emerald-700 text-white px-4 py-2 rounded hover:bg-emerald-600">Tambah Subjek</button>
      </div>

      <div class="bg-white rounded-xl shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Resit Menunggu Pengesahan</h2>
        <div id="pending-receipts" class="space-y-3"></div>
      </div>
    </section>
  </main>

  <script src="js/api.js"></script>
  <script src="js/parentPortal.js"></script>
  <script src="js/adminPortal.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

### 3.6 `js/parentPortal.js`

```javascript
async function lookupStudent() {
  const ic = document.getElementById('parent-ic').value.trim();
  if (!ic) return alert('Sila masukkan nombor IC.');

  const data = await getStudentByIC(ic);
  if (data.error) return alert(data.error);

  state.student = data;
  document.getElementById('student-info').classList.remove('hidden');
  document.getElementById('info-name').textContent = data.studentName;
  document.getElementById('info-level').textContent = data.schoolLevel;
  document.getElementById('info-subjects').textContent = data.subjects.join(', ');
  document.getElementById('info-fee').textContent = data.monthlyTotal.toFixed(2);

  // Default month = current month
  const now = new Date();
  document.getElementById('payment-month').value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
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

function showReceiptUpload(billCode) {
  document.getElementById('receipt-section').classList.remove('hidden');
  if (billCode) state.pendingBill = billCode;
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
    document.getElementById('receipt-msg').textContent = res.success
      ? 'Resit berjaya dihantar. Terima kasih!'
      : 'Ralat: ' + res.error;
  };
  reader.readAsDataURL(file);
}
```

### 3.7 `js/adminPortal.js`

```javascript
async function submitStudent() {
  const student = {
    parentIC: document.getElementById('a-parentIC').value,
    parentName: document.getElementById('a-parentName').value,
    parentPhone: document.getElementById('a-parentPhone').value,
    studentName: document.getElementById('a-studentName').value,
    schoolLevel: document.getElementById('a-schoolLevel').value,
    registrationFee: document.getElementById('a-regFee').value
  };
  const res = await addStudent(student);
  alert(res.success ? `Pelajar disimpan: ${res.studentID}` : res.error);
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
}

async function loadAdminData() {
  const container = document.getElementById('pending-receipts');
  container.innerHTML = '<p class="text-sm text-slate-500">Memuatkan...</p>';
  const data = await listPendingReceipts();
  if (data.error || !data.receipts.length) {
    container.innerHTML = '<p class="text-sm text-slate-500">Tiada resit menunggu.</p>';
    return;
  }

  container.innerHTML = '';
  data.receipts.forEach(r => {
    const div = document.createElement('div');
    div.className = 'border rounded p-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3';
    div.innerHTML = `
      <div>
        <p class="font-medium">${r.studentID || r.parentIC} — ${r.monthYear}</p>
        <p class="text-sm text-slate-600">Kaedah: ${r.paymentMethod} | Jumlah: RM ${Number(r.amountPaid || 0).toFixed(2)}</p>
        <a href="${r.receiptURL}" target="_blank" class="text-blue-600 text-sm underline">Lihat Resit</a>
      </div>
      <div class="flex gap-2">
        <button onclick="approve('${r.paymentID}', 'Approved')" class="bg-emerald-600 text-white px-3 py-1 rounded text-sm hover:bg-emerald-500">Lulus</button>
        <button onclick="approve('${r.paymentID}', 'Rejected')" class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-400">Tolak</button>
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
```

---

## 4. FPX Payment Flow

```
┌─────────────┐      1. lookup IC      ┌─────────────────┐
│   Parent    │ ───────────────────────▶ │  GitHub Pages   │
│   Browser   │                        │   Frontend      │
└─────────────┘                        └─────────────────┘
                                              │
                                              │ 2. fetch student
                                              │    (doGet)
                                              ▼
                                       ┌─────────────────┐
                                       │  Google Apps    │
                                       │    Script       │
                                       │  (reads Sheet)  │
                                       └─────────────────┘
                                              │
                                              │ 3. return student + fee
                                              ▼
                                       ┌─────────────────┐
                                       │   Frontend      │
                                       │ shows Pay button│
                                       └─────────────────┘
                                              │
                                              │ 4. createBill (doPost)
                                              ▼
                                       ┌─────────────────┐
                                       │  Google Apps    │
                                       │    Script       │
                                       │ calls ToyyibPay │
                                       └─────────────────┘
                                              │
                                              │ 5. create bill
                                              ▼
                                       ┌─────────────────┐
                                       │  ToyyibPay /    │
                                       │   Billplz       │
                                       └─────────────────┘
                                              │
                                              │ 6. paymentURL
                                              ▼
                                       ┌─────────────────┐
                                       │   Parent        │
                                       │ completes FPX   │
                                       └─────────────────┘
                                              │
                                              │ 7. redirect to returnUrl
                                              │    + callback to callbackUrl
                                              ▼
                                       ┌─────────────────┐
                                       │  Frontend / GAS │
                                       │  marks pending  │
                                       │  upload receipt │
                                       └─────────────────┘
```

### Step-by-step

1. **Parent enters IC.** Frontend calls `doGet?action=getStudent&ic=...`.
2. **GAS validates** the IC against the `Students` sheet and returns student details + calculated monthly fee.
3. **Parent clicks "Bayar dengan FPX".** Frontend calls `doPost` with `action=createBill`.
4. **GAS calls ToyyibPay** (or Billplz) with the secret key, category code, amount, return URL, and callback URL.
5. **Gateway returns a `bill_code` and `bill_url`.** GAS logs a pending row in `Payments`.
6. **Parent is redirected** to the gateway payment page, completes FPX, and is sent back to the frontend `returnUrl`.
7. **Parent uploads receipt.** Frontend base64-encodes the file and sends it to `doPost` `action=uploadReceipt`. GAS decodes it, saves it to Drive, and writes the Drive URL into the `Payments` sheet.
8. **Admin reviews** pending receipts in the Admin Portal and approves/rejects them.

### Callback note

ToyyibPay sends a server-side callback to `billCallbackUrl`. Because GitHub Pages is static, you have two options:

- **Option A (recommended):** Use the GAS Web App itself as the callback URL. Add a `doPost` action `gatewayCallback` that reads the callback payload and updates the `Payments` sheet.
- **Option B:** Use a lightweight Vercel serverless function or a second GAS Web App to receive the callback and forward it to your main sheet.

For simplicity, the templates above rely on the **return URL** to trigger receipt upload; the admin then manually approves the receipt.

---

## 5. Subject & Fee Reference (from PDF)

| Level | Subjects | Hours/Subject/Month | Class Size | Registration | Monthly Fee |
|-------|----------|---------------------|------------|--------------|-------------|
| Tingkatan 5 | Matematik, B.Inggeris, Sejarah, Sains, Fizik, Kimia, Add Math, Prinsip Akaun | 5 jam | max 8 | RM 60 | RM 80 / subjek |
| Darjah 1 & 2 | Matematik, B.Inggeris, Sains, Prinsip Akaun, Add Math | 4 jam | max 8 | RM 50 | RM 80 / subjek |
| Tingkatan 1–4 | Matematik, B.Melayu, B.Inggeris, Sains | 4 jam | max 16 | RM 50 | 1: RM40, 2: RM80, 3: RM90, 4: RM100 |
| UPKK | Matematik & B.Inggeris | 4 jam | max 10 | RM 50 | RM 40 / subjek |
| Darjah 3–6 | (reading class) | - | max 6 | RM 30 | RM 80 |
| Kelas Membaca | Bahasa Arab & Jawi | 4 jam | max 10 | RM 50 | RM 60 / subjek |
| Personal Class (1-to-1) | Any | min 1 jam/minggu | max 2 | RM 30 | T4-5: RM60/jam, T1-3: RM50/jam, D1-6: RM40/jam |

Use this table when entering enrollments in the Admin Portal.

---

## 6. Deployment Checklist

- [ ] Create Google Sheet with the three sheets and headers.
- [ ] Create Google Drive folder for receipts and copy its ID.
- [ ] Create GAS project, paste `Code.gs`, set Script Properties.
- [ ] Deploy GAS as Web App (Anyone access) and copy URL.
- [ ] Create frontend repo, copy `config.example.js` to `config.js`, paste GAS URL.
- [ ] Push to GitHub (make sure `config.js` is in `.gitignore`).
- [ ] Enable GitHub Pages or deploy to Vercel.
- [ ] Test parent IC lookup, FPX bill creation, receipt upload, and admin approval.

---

## 7. Security Summary

| Secret | Where it lives | Safe? |
|--------|--------------|-------|
| GAS Web App URL | `js/config.js` (ignored by Git) | ✅ Not in repo |
| ToyyibPay API key | GAS Script Properties | ✅ Never leaves GAS |
| Drive Folder ID | GAS Script Properties | ✅ Never leaves GAS |
| Gateway callback auth | GAS `doPost` handler + gateway signature | ✅ Server-side only |

The repository itself contains only templates (`config.example.js`) and generic code. It is safe to publish publicly.
