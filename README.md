# 🌐 Autonomous Node.js cPanel & Server Control Panel

A production-grade, self-hosted web hosting and server control panel built with **Node.js, Express, MySQL, and React**. Replicates the official cPanel Paper Lantern interface with complete server management capabilities: Domain allocation, automated SSL generation, MySQL management, FTP permissions, 1-Click App Installer, Terminal, Quota management, and PM2 Node.js Process Manager.

---

## ⚡ 1-Click Live Server Setup (Via CMD / Terminal)

When deploying to your live server (Ubuntu, Debian, CentOS, RHEL, or Windows Server), you only need to run a single command. The installer will prompt you **only** for your MySQL Username and Password, and handle everything else automatically.

### 🐧 On Linux Server (Ubuntu / Debian / CentOS / EC2 / DigitalOcean)

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/cpanel.git
cd cpanel

# 2. Run the automated setup
npm run setup
```

*(Alternatively, you can run `bash setup.sh`)*

---

### 🪟 On Windows Server

Open Command Prompt (`cmd.exe`) or PowerShell as Administrator:

```cmd
git clone https://github.com/YOUR_USERNAME/cpanel.git
cd cpanel
npm run setup
```

*(Alternatively, double-click or run `setup.bat`)*

---

## 💬 What the Setup Asks You

During setup, you are prompted **only** for:
1. `👉 Enter MySQL Database Username [root]:` *(Press Enter for default `root`)*
2. `👉 Enter MySQL Database Password:` *(Enter your MySQL root password)*

> 💡 **Non-Interactive / Unattended Setup**:  
> You can also pass credentials directly via flags or environment variables:
> ```bash
> node setup.js --user=root --password=your_secure_password
> ```

---

## 🚀 What the Automated Setup Does For You

1. **MySQL Configuration**:
   - Tests connectivity to your local MySQL instance.
   - Automatically creates the `cpanel` database.
   - Initializes all 9 required tables (`domains`, `managed_databases`, `ftp_users`, `panel_users`, `installed_packages`, `managed_apps`, `cron_jobs`, `activity_logs`, `dns_records`).
   - Provisions default Superadmin credentials (`admin` / `admin123`).
2. **Environment File Generation**:
   - Generates production `.env` with auto-generated secure JWT secret, ports, and database credentials.
3. **Auto-SSL Certificate Generation**:
   - Detects your server's **Public IP address** (via external IP service or local interface).
   - Generates a 2048-bit RSA Private Key (`server/ssl/key.pem`) and X.509 Certificate (`server/ssl/cert.pem`) with Subject Alternative Names (SANs) for your server IP and `localhost`, valid for 10 years.
   - Configures Express to serve both **HTTP** (port 5200) and **HTTPS** (port 5443) concurrently.
4. **PM2 Process Supervisor Setup**:
   - Detects and installs PM2 globally (`npm install -g pm2`) if missing.
   - Registers and launches the cPanel backend as a persistent background daemon: `node-cpanel`.
   - Saves the process list so the panel restarts automatically on system reboots.
5. **Frontend Compilation**:
   - Compiles the React production bundle (`build/`) served statically by Express with 0 extra web server required.

---

## 🔑 Accessing Your Panel

Once the setup completes, your panel will be live immediately:

| Interface | URL | Description |
| :--- | :--- | :--- |
| **Public HTTP** | `http://<YOUR_SERVER_IP>:5200` | Standard web panel access |
| **Secure HTTPS** | `https://<YOUR_SERVER_IP>:5443` | Encrypted SSL panel access |
| **Localhost** | `http://localhost:5200` | Local server browser access |

### Default Super Admin Credentials:
- **Username**: `admin`
- **Password**: `admin123`

*(You can change your password anytime under the **User Manager** section)*

---

## 🛡️ Firewall / Port Configuration (If applicable)

If your server has a firewall enabled (`ufw` on Ubuntu or Security Groups on AWS/DigitalOcean), make sure to open the following ports:

```bash
# Ubuntu UFW
sudo ufw allow 5200/tcp comment "cPanel HTTP"
sudo ufw allow 5443/tcp comment "cPanel HTTPS"
sudo ufw allow 80/tcp   comment "Hosted Domains HTTP"
sudo ufw allow 443/tcp  comment "Hosted Domains HTTPS"
sudo ufw allow 3306/tcp comment "MySQL"
sudo ufw reload
```

---

## 🛠️ Server Management Commands

| Action | Command |
| :--- | :--- |
| **View Live Server Logs** | `pm2 logs node-cpanel` |
| **Restart cPanel Server** | `pm2 restart node-cpanel` |
| **Stop cPanel Server** | `pm2 stop node-cpanel` |
| **Check PM2 Status** | `pm2 status` |
| **Configure PM2 Auto-boot** | `pm2 startup` && `pm2 save` |

---

## 📦 Key Features Included

- **cPanel Paper Lantern & Jupiter UI**: Authentic design matching real hosting control panels.
- **Node.js App & PM2 Manager**: Deploy Node.js apps with auto-install dependencies (`npm install`), 1-click Start/Stop/Restart, and real-time logs modal.
- **Automated SSL Management**: Generate and bind SSL certificates to any allocated domain.
- **DNS Zone Editor & Nameservers**: Auto-generates authoritative nameservers (`ns1.<domain>`, `ns2.<domain>`) and manages A, CNAME, MX, and TXT records.
- **MySQL Database & User Manager**: Create schemas, users, grant permissions, and execute live queries via the SQL Console.
- **In-Browser File Manager**: Create, upload, edit, rename, extract zip archives, and inspect permissions.
- **Web Terminal Console**: Large real-world terminal emulator for executing server commands.
- **1-Click Application Installer**: Deploy WordPress, Express APIs, React apps, and static websites in 1 click.
- **Disk Quota & Space Isolation**: Monitor server storage, isolate storage per domain/user, and clean temp files.
