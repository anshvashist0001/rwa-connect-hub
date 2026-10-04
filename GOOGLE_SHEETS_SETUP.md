# Google Sheets and Drive adapter

This adapter is an experimental alternative storage path. It currently has no
server-side authorization for write actions. Do not deploy it with private
resident records, payment evidence or real credentials. Use an isolated sheet
and test files when evaluating it.

## Configure a test instance

1. Create an empty Google spreadsheet and a dedicated Drive folder.
2. Copy `google-apps-script/Code.gs` into a new Apps Script project.
3. Add script properties `SPREADSHEET_ID` and `DRIVE_FOLDER_ID` using the IDs of
   those test resources.
4. Deploy a web app under your Google account. The current frontend expects a
   callable endpoint without Google sign-in, so a public deployment exposes its
   supported actions. Restrict the data to disposable test content.
5. Call `YOUR_WEB_APP_URL?action=initSheets` to create the entity tabs.
6. Set `VITE_GOOGLE_SCRIPT_URL` in the frontend `.env` and restart Vite.

The script stores entity rows in Sheets and uploads files to Drive. Files are
made accessible to anyone with the link. The frontend still sends admin login to
the Express API; configuring Sheets alone does not supply authentication.

## Verify behavior

Create a test notice, refresh its public page, and inspect the corresponding
sheet row. Upload a non-sensitive test file and inspect its Drive permissions.
Check failures explicitly: some frontend pages fall back to local browser data,
which can hide a failed request.

After editing Apps Script, create a new deployment version and update or retain
the endpoint URL as appropriate. Clear `VITE_GOOGLE_SCRIPT_URL` to return to the
Express adapter. Existing Google data is not migrated into PostgreSQL automatically.

## Missing deployment requirements

Server-side authentication, action-level authorization, input validation, private
file handling, rate limiting, concurrency control and tested backups are needed
before this could store real association data. No deployed Google integration
has been verified by the repository's local tests.
