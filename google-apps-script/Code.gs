/**
 * RWA Connect Hub - Google Apps Script Backend
 *
 * This script acts as the backend API for the RWA Connect Hub app.
 * It uses Google Sheets as the database and Google Drive for file storage.
 *
 * SETUP:
 * 1. Create a Google Sheet with these tabs: Payments, Notices, Events, Members, Houses, Gallery, Committee, Documents
 * 2. Create a Google Drive folder for file uploads
 * 3. Set SPREADSHEET_ID and DRIVE_FOLDER_ID below
 * 4. Deploy as Web App: Execute as "Me", Access "Anyone"
 */

function getSpreadsheetId() {
  return PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || 'YOUR_SPREADSHEET_ID';
}

function getDriveFolderId() {
  return PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID') || 'YOUR_DRIVE_FOLDER_ID';
}

// ─── CORS & Request Handling ─────────────────────────────────────────────────

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    const action = e.parameter.action;
    let postData = {};

    if (e.postData && e.postData.contents) {
      postData = JSON.parse(e.postData.contents);
    }

    let result;
    switch (action) {
      // Payments
      case 'getPayments':       result = getAll('Payments'); break;
      case 'createPayment':     result = createRow('Payments', postData); break;
      case 'updatePayment':     result = updateRow('Payments', postData.id, postData); break;
      case 'deletePayment':     result = deleteRow('Payments', postData.id); break;

      // Notices
      case 'getNotices':        result = getAll('Notices'); break;
      case 'createNotice':      result = createRow('Notices', postData); break;
      case 'updateNotice':      result = updateRow('Notices', postData.id, postData); break;
      case 'deleteNotice':      result = deleteRow('Notices', postData.id); break;

      // Events
      case 'getEvents':         result = getAll('Events'); break;
      case 'createEvent':       result = createRow('Events', postData); break;
      case 'updateEvent':       result = updateRow('Events', postData.id, postData); break;
      case 'deleteEvent':       result = deleteRow('Events', postData.id); break;

      // Members
      case 'getMembers':        result = getAll('Members'); break;
      case 'createMember':      result = createRow('Members', postData); break;
      case 'updateMember':      result = updateRow('Members', postData.id, postData); break;
      case 'deleteMember':      result = deleteRow('Members', postData.id); break;

      // Houses
      case 'getHouses':         result = getAll('Houses'); break;
      case 'createHouse':       result = createRow('Houses', postData); break;
      case 'updateHouse':       result = updateRow('Houses', postData.id, postData); break;
      case 'deleteHouse':       result = deleteRow('Houses', postData.id); break;

      // Gallery
      case 'getGallery':        result = getAll('Gallery'); break;
      case 'createGallery':     result = createRow('Gallery', postData); break;
      case 'deleteGallery':     result = deleteRow('Gallery', postData.id); break;

      // Committee
      case 'getCommittee':      result = getAll('Committee'); break;
      case 'createCommittee':   result = createRow('Committee', postData); break;
      case 'updateCommittee':   result = updateRow('Committee', postData.id, postData); break;
      case 'deleteCommittee':   result = deleteRow('Committee', postData.id); break;

      // Documents
      case 'getDocuments':      result = getAll('Documents'); break;
      case 'createDocument':    result = createRow('Documents', postData); break;
      case 'deleteDocument':    result = deleteRow('Documents', postData.id); break;

      // File upload to Google Drive
      case 'uploadFile':        result = uploadFile(postData); break;

      // Init - create all sheet headers
      case 'initSheets':        result = initAllSheets(); break;

      default: result = { error: 'Unknown action: ' + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message, stack: err.stack }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─── Sheet Headers Definition ────────────────────────────────────────────────

const SHEET_HEADERS = {
  Payments:  ['id', 'name', 'phone', 'block', 'house_no', 'amount', 'payment_type', 'screenshot_url', 'status', 'remarks', 'created_at', 'updated_at', 'verified_at'],
  Notices:   ['id', 'title', 'content', 'type', 'file_url', 'file_name', 'file_size', 'is_active', 'created_at', 'updated_at'],
  Events:    ['id', 'title', 'description', 'event_date', 'start_time', 'end_time', 'location', 'brochure_url', 'brochure_name', 'is_active', 'created_at'],
  Members:   ['id', 'name', 'phone', 'block', 'house_no', 'email', 'photo_url', 'is_active', 'created_at'],
  Houses:    ['id', 'house_no', 'block', 'floor', 'type', 'member_id', 'member_name', 'member_phone'],
  Gallery:   ['id', 'title', 'category', 'image_url', 'created_at'],
  Committee: ['id', 'name', 'designation', 'phone', 'email', 'photo_url', 'bio', 'display_order', 'is_active'],
  Documents: ['id', 'title', 'category', 'file_url', 'file_name', 'file_size', 'file_type', 'created_at'],
};

// ─── Init Sheets ─────────────────────────────────────────────────────────────

function initAllSheets() {
  const ss = SpreadsheetApp.openById(getSpreadsheetId());
  const created = [];

  for (const [name, headers] of Object.entries(SHEET_HEADERS)) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      created.push(name);
    }
    // Set headers if first row is empty
    const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    if (!firstRow[0]) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  }

  // Remove default "Sheet1" if it exists and is empty
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && defaultSheet.getLastRow() <= 1 && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch(e) {}
  }

  return { success: true, created: created, message: 'All sheets initialized' };
}

// ─── Generic CRUD ────────────────────────────────────────────────────────────

function getSheet(name) {
  const ss = SpreadsheetApp.openById(getSpreadsheetId());
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    // Auto-create sheet with headers
    sheet = ss.insertSheet(name);
    const headers = SHEET_HEADERS[name];
    if (headers) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

function getAll(sheetName) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const rows = [];

  for (let i = 1; i < data.length; i++) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      let val = data[i][j];
      // Convert Date objects to ISO strings
      if (val instanceof Date) {
        val = val.toISOString();
      }
      // Parse booleans
      if (val === 'TRUE' || val === true) val = true;
      if (val === 'FALSE' || val === false) val = false;
      // Parse numbers for id, floor, member_id, display_order
      if (['id', 'floor', 'member_id', 'display_order'].includes(headers[j]) && val !== '' && val !== null) {
        val = Number(val);
      }
      row[headers[j]] = val === '' ? null : val;
    }
    rows.push(row);
  }

  // Return newest first
  rows.reverse();
  return rows;
}

function getNextId(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return 1;

  const idCol = data[0].indexOf('id');
  let maxId = 0;
  for (let i = 1; i < data.length; i++) {
    const id = parseInt(data[i][idCol]) || 0;
    if (id > maxId) maxId = id;
  }
  return maxId + 1;
}

function createRow(sheetName, data) {
  const sheet = getSheet(sheetName);
  const headers = SHEET_HEADERS[sheetName];
  const id = getNextId(sheet);
  const now = new Date().toISOString();

  // Set defaults
  data.id = id;
  if (headers.includes('created_at') && !data.created_at) data.created_at = now;
  if (headers.includes('updated_at') && !data.updated_at) data.updated_at = now;
  if (headers.includes('is_active') && data.is_active === undefined) data.is_active = true;
  if (headers.includes('status') && !data.status) data.status = 'pending';

  const row = headers.map(h => {
    const val = data[h];
    if (val === undefined || val === null) return '';
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    return val;
  });

  sheet.appendRow(row);

  // Return created object
  const result = {};
  headers.forEach((h, i) => {
    let v = row[i];
    if (v === 'TRUE') v = true;
    if (v === 'FALSE') v = false;
    if (v === '') v = null;
    result[h] = v;
  });
  result.id = id;
  return result;
}

function updateRow(sheetName, id, data) {
  const sheet = getSheet(sheetName);
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const idCol = headers.indexOf('id');
  const now = new Date().toISOString();

  if (data.updated_at === undefined && headers.includes('updated_at')) {
    data.updated_at = now;
  }

  for (let i = 1; i < allData.length; i++) {
    if (parseInt(allData[i][idCol]) === parseInt(id)) {
      // Update each column
      for (let j = 0; j < headers.length; j++) {
        const key = headers[j];
        if (key === 'id') continue; // Don't overwrite id
        if (data[key] !== undefined) {
          let val = data[key];
          if (typeof val === 'boolean') val = val ? 'TRUE' : 'FALSE';
          if (val === null) val = '';
          sheet.getRange(i + 1, j + 1).setValue(val);
          allData[i][j] = val;
        }
      }

      // Return updated object
      const result = {};
      headers.forEach((h, j) => {
        let v = allData[i][j];
        if (v === 'TRUE' || v === true) v = true;
        if (v === 'FALSE' || v === false) v = false;
        if (v === '') v = null;
        if (v instanceof Date) v = v.toISOString();
        result[h] = v;
      });
      result.id = parseInt(id);
      return result;
    }
  }
  return { error: 'Row not found', id: id };
}

function deleteRow(sheetName, id) {
  const sheet = getSheet(sheetName);
  const allData = sheet.getDataRange().getValues();
  const idCol = allData[0].indexOf('id');

  for (let i = 1; i < allData.length; i++) {
    if (parseInt(allData[i][idCol]) === parseInt(id)) {
      sheet.deleteRow(i + 1);
      return { success: true, id: id };
    }
  }
  return { error: 'Row not found', id: id };
}

// ─── File Upload to Google Drive ─────────────────────────────────────────────

function uploadFile(data) {
  const folder = DriveApp.getFolderById(getDriveFolderId());

  // Create subfolder if specified
  let targetFolder = folder;
  if (data.subfolder) {
    const subfolders = folder.getFoldersByName(data.subfolder);
    if (subfolders.hasNext()) {
      targetFolder = subfolders.next();
    } else {
      targetFolder = folder.createFolder(data.subfolder);
    }
  }

  // Decode base64 file
  const blob = Utilities.newBlob(
    Utilities.base64Decode(data.base64),
    data.mimeType,
    data.fileName
  );

  const file = targetFolder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const fileId = file.getId();
  // Use direct download/view URL
  const viewUrl = 'https://drive.google.com/uc?export=view&id=' + fileId;
  const thumbnailUrl = 'https://drive.google.com/uc?export=view&id=' + fileId;

  return {
    success: true,
    fileId: fileId,
    fileName: data.fileName,
    fileSize: file.getSize(),
    viewUrl: viewUrl,
    thumbnailUrl: thumbnailUrl,
    mimeType: data.mimeType,
  };
}

// ─── Utility: Setup Script Properties ────────────────────────────────────────

function setConfig(spreadsheetId, driveFolderId) {
  const props = PropertiesService.getScriptProperties();
  if (spreadsheetId) props.setProperty('SPREADSHEET_ID', spreadsheetId);
  if (driveFolderId) props.setProperty('DRIVE_FOLDER_ID', driveFolderId);
  return { success: true, message: 'Configuration saved' };
}
