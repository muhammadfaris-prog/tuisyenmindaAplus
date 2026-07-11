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

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const headers = {
    'Students': ['studentID', 'parentIC', 'parentName', 'parentPhone', 'studentName', 'schoolLevel', 'registrationFee', 'registeredAt', 'status'],
    'Enrollments': ['enrollmentID', 'studentID', 'subject', 'monthlyFee', 'hoursPerMonth', 'createdAt', 'status'],
    'Payments': ['paymentID', 'studentID', 'parentIC', 'monthYear', 'amountDue', 'amountPaid', 'paymentMethod', 'gatewayBillID', 'gatewayStatus', 'receiptURL', 'receiptFileName', 'adminApproval', 'adminNotes', 'createdAt', 'paidAt']
  };
  Object.keys(headers).forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    sheet.clear();
    sheet.appendRow(headers[name]);
    sheet.getRange(1, 1, 1, headers[name].length).setFontWeight('bold');
  });
  return 'Sheets created/reset successfully.';
}

function jsonResponse(data, statusCode) {
  statusCode = statusCode || 200;
  // HtmlService is needed because ContentService.TextOutput lacks setHeader()
  const output = HtmlService.createHtmlOutput(JSON.stringify(data))
    .setHeader('Content-Type', 'application/json')
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    .setHeader('Access-Control-Max-Age', '86400')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  return output;
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
        hoursPerMonth: data[i][4],
        status: data[i][6]
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
    // Handle CORS preflight (OPTIONS) — browser sends empty body
    if (!e.postData || !e.postData.contents || e.postData.contents.trim() === '') {
      return jsonResponse({ status: 'ok', message: 'CORS preflight acknowledged' });
    }

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

    // 5. ADMIN: LIST STUDENTS
    if (action === 'listStudents') {
      return handleListStudents(params);
    }

    // 6. ADMIN: LIST ENROLLMENTS
    if (action === 'listEnrollments') {
      return handleListEnrollments(params);
    }

    // 7. ADMIN: LIST PENDING RECEIPTS
    if (action === 'listPendingReceipts') {
      return handleListPendingReceipts(params);
    }

    // 8. ADMIN: APPROVE / REJECT RECEIPT
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

function handleListStudents(params) {
  const sheet = getSheet(SHEET_NAME_STUDENTS);
  const data = sheet.getDataRange().getValues();
  const out = [];
  for (let i = 1; i < data.length; i++) {
    out.push({
      studentID: data[i][0],
      parentIC: data[i][1],
      parentName: data[i][2],
      parentPhone: data[i][3],
      studentName: data[i][4],
      schoolLevel: data[i][5],
      registrationFee: data[i][6],
      status: data[i][8]
    });
  }
  return jsonResponse({ success: true, students: out });
}

function handleListEnrollments(params) {
  const sheet = getSheet(SHEET_NAME_ENROLLMENTS);
  const data = sheet.getDataRange().getValues();
  const out = [];
  for (let i = 1; i < data.length; i++) {
    out.push({
      enrollmentID: data[i][0],
      studentID: data[i][1],
      subject: data[i][2],
      monthlyFee: data[i][3],
      hoursPerMonth: data[i][4],
      status: data[i][6]
    });
  }
  return jsonResponse({ success: true, enrollments: out });
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
