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
    'Students': ['studentID', 'parentIC', 'parentName', 'parentPhone', 'studentName', 'schoolLevel', 'registrationFee', 'registeredAt', 'status', 'startMonth'],
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
  // GAS web apps (deployed as 'Anyone') automatically add CORS headers for simple requests.
  // The frontend uses Content-Type: text/plain to avoid triggering a CORS preflight.
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
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
      startMonth: r[9] || '',
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

    // 9. ADMIN: UPDATE STUDENT
    if (action === 'updateStudent') {
      return handleUpdateStudent(params);
    }

    // 10. ADMIN: PAYMENT SUMMARY (monthly tracking)
    if (action === 'paymentSummary') {
      return handlePaymentSummary(params);
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

function getOrCreateReceiptFolder() {
  const configuredId = getConfig('DRIVE_FOLDER_ID');
  if (configuredId) {
    try {
      return DriveApp.getFolderById(configuredId);
    } catch (e) {
      // configured ID is invalid — fall through
    }
  }
  // Fallback: use/create 'Zool Receipts' folder in user's Drive
  const folders = DriveApp.getFoldersByName('Zool Receipts');
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder('Zool Receipts');
}

function handleUploadReceipt(params) {
  const ic = params.parentIC;
  const monthYear = params.monthYear;
  const base64Data = params.receiptBase64;
  const fileName = params.fileName || 'receipt.png';
  const mimeType = params.mimeType || 'image/png';
  const gatewayBillID = params.gatewayBillID || '';
  const amountPaid = Number(params.amountPaid || 0);

  if (!ic || !monthYear || !base64Data) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  // Decode and save to Drive (with fallback folder)
  const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
  const folder = getOrCreateReceiptFolder();
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
      payments.getRange(i + 1, 6).setValue(amountPaid);    // amountPaid
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
      amountPaid,
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
  const now = new Date();
  const startMonth = params.startMonth || (now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0'));

  sheet.appendRow([
    studentID,
    params.parentIC,
    params.parentName,
    params.parentPhone,
    params.studentName,
    params.schoolLevel,
    params.registrationFee || 0,
    now.toISOString(),
    'Active',
    startMonth
  ]);

  return jsonResponse({ success: true, studentID: studentID });
}

function handleUpdateStudent(params) {
  const sheet = getSheet(SHEET_NAME_STUDENTS);
  const data = sheet.getDataRange().getValues();
  const studentID = params.studentID;
  if (!studentID) return jsonResponse({ error: 'studentID is required' }, 400);

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(studentID).trim()) {
      const row = i + 1;
      // Update fields that are provided (non-empty)
      if (params.parentIC !== undefined)       sheet.getRange(row, 2).setValue(params.parentIC);
      if (params.parentName !== undefined)     sheet.getRange(row, 3).setValue(params.parentName);
      if (params.parentPhone !== undefined)    sheet.getRange(row, 4).setValue(params.parentPhone);
      if (params.studentName !== undefined)    sheet.getRange(row, 5).setValue(params.studentName);
      if (params.schoolLevel !== undefined)    sheet.getRange(row, 6).setValue(params.schoolLevel);
      if (params.registrationFee !== undefined) sheet.getRange(row, 7).setValue(params.registrationFee);
      if (params.startMonth !== undefined)       sheet.getRange(row, 10).setValue(params.startMonth);
      if (params.status !== undefined)         sheet.getRange(row, 9).setValue(params.status);
      return jsonResponse({ success: true, studentID: studentID });
    }
  }
  return jsonResponse({ error: 'Student not found' }, 404);
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
      status: data[i][8],
      startMonth: data[i][9] || ''
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

function handlePaymentSummary(params) {
  const studentsSheet = getSheet(SHEET_NAME_STUDENTS);
  const paymentsSheet = getSheet(SHEET_NAME_PAYMENTS);
  const studentData = studentsSheet.getDataRange().getValues();
  const paymentData = paymentsSheet.getDataRange().getValues();

  // Helper: normalize monthYear to "YYYY-MM" (Google Sheets may auto-convert to Date objects)
  function normMonth(val) {
    if (!val) return '';
    if (val instanceof Date) {
      return val.getFullYear() + '-' + String(val.getMonth() + 1).padStart(2, '0');
    }
    var s = String(val).trim();
    if (s.indexOf('GMT') !== -1 || s.indexOf('00:00:00') !== -1) {
      var d = new Date(s);
      if (!isNaN(d.getTime())) {
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      }
    }
    return s;
  }

  // Collect active students
  const students = [];
  for (let i = 1; i < studentData.length; i++) {
    if (studentData[i][8] === 'Active') {
      students.push({
        studentID: String(studentData[i][0]),
        studentName: studentData[i][4] || '',
        schoolLevel: studentData[i][5] || '',
        parentIC: String(studentData[i][1] || ''),
        parentName: studentData[i][2] || '',
        parentPhone: studentData[i][3] || '',
        registrationFee: studentData[i][6] || 0,
        startMonth: studentData[i][9] || ''
      });
    }
  }

  // Collect payments indexed by studentID + monthYear
  const paymentMap = {};
  const allMonths = new Set();
  for (let i = 1; i < paymentData.length; i++) {
    const sid = String(paymentData[i][1] || '');
    const month = normMonth(paymentData[i][3]);
    if (!month) continue;
    allMonths.add(month);
    const key = sid + '|' + month;
    if (!paymentMap[key]) {
      paymentMap[key] = {
        studentID: sid,
        monthYear: month,
        amountDue: Number(paymentData[i][4] || 0),
        amountPaid: Number(paymentData[i][5] || 0),
        paymentMethod: paymentData[i][6] || '',
        adminApproval: paymentData[i][11] || '',
        receiptURL: paymentData[i][9] || '',
        paidAt: paymentData[i][14] || ''
      };
    } else {
      // Merge: keep the latest/best status
      const existing = paymentMap[key];
      if (paymentData[i][11] === 'Approved') existing.adminApproval = 'Approved';
      if (paymentData[i][9]) existing.receiptURL = paymentData[i][9];
      if (paymentData[i][14]) existing.paidAt = paymentData[i][14];
      existing.amountPaid += Number(paymentData[i][5] || 0);
    }
  }

  // Always include all 12 months of the current year
  const now = new Date();
  const currentYear = now.getFullYear();
  for (let m = 1; m <= 12; m++) {
    allMonths.add(currentYear + '-' + String(m).padStart(2, '0'));
  }

  // Sort months
  const months = Array.from(allMonths).sort();

  // Build per-student payment status
  const studentPayments = students.map(st => {
    // Calculate monthly fee from enrollments
    const feeInfo = calculateMonthlyFee(st.studentID);
    const monthlyFee = feeInfo.total;

    const monthStatus = {};
    const paymentDetails = {};
    months.forEach(m => {
      const key = st.studentID + '|' + m;
      const p = paymentMap[key];
      monthStatus[m] = p ? p.adminApproval || 'Pending' : null;
      paymentDetails[m] = p || null;
    });

    return {
      studentID: st.studentID,
      studentName: st.studentName,
      schoolLevel: st.schoolLevel,
      parentName: st.parentName,
      monthlyFee: monthlyFee,
      startMonth: st.startMonth || (currentYear + '-01'),
      monthStatus: monthStatus,
      paymentDetails: paymentDetails
    };
  });

  return jsonResponse({
    success: true,
    months: months,
    students: studentPayments
  });
}
