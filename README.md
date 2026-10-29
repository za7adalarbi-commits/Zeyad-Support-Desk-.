# Zeyad Support Desk

A small Arabic/English personal support notebook for calls, bookings, complaints, follow-up reminders and PDF case reports.

## Architecture

- **Frontend:** static HTML/CSS/JavaScript hosted on GitHub Pages.
- **Storage:** Google Sheets through Google Apps Script.
- **Email reminders:** a time-driven Apps Script trigger checks due reminders every 15 minutes and sends Gmail messages.
- **PDF:** opens a print-ready case report. Choose **Save as PDF** in the browser print dialog.

> Important: GitHub Pages is public static hosting. Never commit customer data, tokens, passwords, or service credentials. Before entering real customer information, get your employer's approval for the data storage and access model. The Apps Script web app endpoint configured as “Anyone” is internet-accessible and the token is only a simple access gate, not enterprise-grade authentication.

## 1. Create the Google Sheet

1. Sign in to the Google account that should own the records and send reminders.
2. Create a new Google Sheet, for example `Zeyad Support Desk Data`.
3. Copy the spreadsheet ID from its URL. It is the part between `/d/` and `/edit`.

## 2. Create the Apps Script backend

1. Open [Google Apps Script](https://script.google.com/), create a new project.
2. Replace the editor contents with `apps-script/Code.gs`.
3. In **Project Settings → Script properties**, add:
   - `SHEET_ID` = your spreadsheet ID
   - `ACCESS_TOKEN` = a long random secret (at least 32 random characters). Keep it out of GitHub.
4. In the editor, select `setup` and click **Run**. Approve the requested Google Sheets and Gmail permissions. This creates the `Records` sheet and installs a 15-minute reminder trigger.
5. Deploy → **New deployment** → select **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Deploy and copy the web app URL ending in `/exec`.
7. If you edit the script later, create a new version under **Deploy → Manage deployments → Edit → New version → Deploy**.

The “Anyone” deployment is needed for the static GitHub Pages front end to call the endpoint without Google sign-in. It means anyone who obtains the endpoint URL can reach it, but valid reads/writes require the access token. For sensitive production/customer data, use an organization-approved authenticated backend instead of this simple personal setup. Avoid placing identity numbers in records unless necessary and explicitly approved.

## 3. Publish the frontend on GitHub Pages

1. Create a GitHub repository named `zeyad-support-desk`. For the safest source management, you may make the repository private; check current GitHub Pages availability and plan rules for private repositories before relying on it. Do not put secrets in source code even in a private repo.
2. Upload only these frontend files to the repository root:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `.nojekyll`
3. Do **not** upload actual customer records, spreadsheet exports, access tokens, or other secrets.
4. In the repository, open **Settings → Pages**.
5. Under Build and deployment, choose **Deploy from a branch**, select `main` and `/(root)`, then Save.
6. Wait for GitHub Pages to publish the site. Its URL will look like `https://YOUR-USERNAME.github.io/zeyad-support-desk/`.

## 4. Connect the website

1. Open the published GitHub Pages URL.
2. Click **Settings** in the website.
3. Paste the Apps Script `/exec` URL and the `ACCESS_TOKEN` you stored in Script Properties.
4. Click Save settings, then Refresh.
5. Create a test record with fictional data first. Confirm it appears in the Google Sheet.
6. Set a reminder a few minutes in the future and an email address you control. The time trigger checks every 15 minutes, so email may arrive later than the exact time.
7. Confirm the email arrives. If it does not, open Apps Script → **Executions** and check errors and Gmail sending limits.

The website stores the endpoint URL and token in the current browser tab's `sessionStorage` (not in the repository). They are cleared when that browser session ends. Do not use the website on a shared/public computer.

## 5. Using the site

- Use **Add record** for a call note or complaint.
- Add each new call/update in the “New note / update” field. It is appended to the record's timeline.
- Set status and next follow-up date/time.
- Select a record and choose **Export PDF**. The print dialog opens; choose **Save as PDF**.
- The dashboard shows open cases, reminders due today, and overdue reminders.

## Notes and limitations

- Browser PDF generation uses the browser's print-to-PDF feature. This avoids a paid PDF service.
- The Apps Script trigger runs approximately every 15 minutes, not at the exact minute. Google quotas apply.
- The current MVP is designed for one personal user and a small number of records. It does not implement user accounts, row-level permissions, or a full audit/security layer.
- This frontend's read API uses JSONP (the token is in the request URL) and the backend is publicly reachable. This is a trade-off for static hosting without a server. Because URLs may be logged, this design is **not recommended for sensitive customer/identity data**. For real production customer data, use an employer-approved authenticated backend and access controls.
- Do not include customer data in GitHub issues, commits, or repository files.
- The app requires internet access for Google Sheets/Gmail and the Google Fonts stylesheet. The core static page can be hosted on GitHub Pages.
