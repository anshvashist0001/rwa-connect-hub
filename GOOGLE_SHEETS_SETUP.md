# Google Sheets + Drive Integration Setup

Use Google Sheets as your database and Google Drive for file storage — no PostgreSQL or Express backend needed.

---

## Step 1: Create a Google Sheet

1. Go to [sheets.new](https://sheets.new) and create a new spreadsheet
2. Name it something like **"RWA Connect Hub Data"**
3. Copy the **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
   ```

## Step 2: Create a Google Drive Folder

1. Go to [Google Drive](https://drive.google.com)
2. Create a new folder called **"RWA Uploads"**
3. Copy the **Folder ID** from the URL:
   ```
   https://drive.google.com/drive/folders/FOLDER_ID_HERE
   ```

## Step 3: Create the Google Apps Script

1. Go to [script.google.com](https://script.google.com) and create a **New Project**
2. Name it **"RWA Connect Hub API"**
3. Delete the default code in `Code.gs`
4. Copy the entire contents of `google-apps-script/Code.gs` from this project and paste it in
5. Click **Save**

## Step 4: Set Script Properties

1. In the Apps Script editor, go to **Project Settings** (gear icon)
2. Scroll to **Script Properties** and add:

   | Property          | Value                  |
   |-------------------|------------------------|
   | `SPREADSHEET_ID`  | Your spreadsheet ID    |
   | `DRIVE_FOLDER_ID` | Your Drive folder ID   |

## Step 5: Deploy as Web App

1. Click **Deploy > New deployment**
2. Click the gear icon and select **Web app**
3. Set:
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy**
5. **Authorize** the permissions when prompted (click "Advanced" > "Go to RWA Connect Hub API" if you see a warning)
6. Copy the **Web app URL** (looks like `https://script.google.com/macros/s/ABC.../exec`)

## Step 6: Initialize the Sheet Tabs

Open this URL in your browser to create all sheet tabs automatically:
```
YOUR_WEB_APP_URL?action=initSheets
```

You should see: `{"success":true,"created":[...],"message":"All sheets initialized"}`

This creates these tabs with headers: **Payments, Notices, Events, Members, Houses, Gallery, Committee, Documents**

## Step 7: Configure the Frontend

Create a `.env` file in the project root (copy from `.env.example`):

```env
# Set your Google Apps Script Web App URL
VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

Restart the dev server (`npm run dev`). The app will now read/write everything to Google Sheets and upload files to Google Drive.

---

## How It Works

| Feature | Storage |
|---------|---------|
| Payments, Members, Houses, Committee | Google Sheets (one tab per entity) |
| Notices, Events (text data) | Google Sheets |
| Gallery images | Google Drive (`gallery/` subfolder) |
| Payment screenshots | Google Drive (`screenshots/` subfolder) |
| Notice attachments | Google Drive (`notices/` subfolder) |
| Event brochures | Google Drive (`events/` subfolder) |
| Documents (PDFs, etc.) | Google Drive (`documents/` subfolder) |
| Member/Committee photos | Google Drive (`members/` / `committee/` subfolders) |

All uploaded files are set to "Anyone with link can view" for public access.

---

## Updating the Deployment

After making changes to the Apps Script code:

1. Go to **Deploy > Manage deployments**
2. Click the **edit** (pencil) icon on your deployment
3. Set Version to **New version**
4. Click **Deploy**

---

## Troubleshooting

- **CORS errors**: Make sure "Who has access" is set to "Anyone"
- **Permission denied**: Re-authorize the script (Deploy > Manage deployments > edit > Deploy)
- **Slow responses**: Google Apps Script has ~1-3s cold start; subsequent calls are faster
- **File upload fails**: Check Drive folder permissions and that DRIVE_FOLDER_ID is correct
- **Data not showing**: Visit `YOUR_URL?action=getPayments` in browser to verify data exists
