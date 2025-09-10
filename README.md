# QR Attendance — quick start

## Local (dev)

1. Clone repo
2. `npm install`
3. `npm run dev` (requires nodemon) or `npm start`
4. Open http://localhost:3000

The app serves client from `/client` and the API at `/api`.

### Create QR codes
You can create QR codes encoding the teacher's name or a JSON payload like:

`{"name":"Jane Doe","id":"T-001"}`

Scan using the Scan page — the server will record entries to `attendance.json`.

### Export
Click Export to download an Excel file `attendance.xlsx` of recorded entries.

## Deploy to production
Push the repository to GitHub. Use a cloud host (Render, Railway, Heroku) to deploy the Node server (it serves the frontend too). Configure the service to install dependencies and run `npm start`.
# qr-attendance
