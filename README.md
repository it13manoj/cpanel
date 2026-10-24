# 🌐 Parakshtech cPanel — Autonomous Server & Web Hosting Control Panel

A production-grade, self-hosted web hosting and server control panel built with **Node.js, Express, MySQL, Nginx, and React**. Replicates the official cPanel Paper Lantern interface with complete server management capabilities: Domain allocation, automated Nginx virtual hosts, automated Let's Encrypt SSL, DNS Zone Editor with authoritative nameservers (RFC-compliant Port 53), MySQL management, FTP permissions, 1-Click App Installer, Terminal, Quota management, and PM2 Process Supervisor.

---

## 🏗️ Architecture & Isolation

Parakshtech cPanel is engineered to run in complete isolation so it **never conflicts with existing live websites or services**:

| Service | Port(s) | Description |
| :--- | :--- | :--- |
| **Parakshtech cPanel (HTTP)** | `5200` | Isolated admin management dashboard |
| **Parakshtech cPanel (HTTPS)** | `5443` | Encrypted SSL admin management dashboard |
| **Nginx Web Server** | `80` & `443` | Handles all public web traffic, live sites, and hosted domains |
| **Authoritative DNS** | `53` (UDP/TCP) | Handles domain nameserver queries (`ns1` & `ns2`) |
| **MySQL Database** | `3306` | MySQL 8.0 database engine |

> [!IMPORTANT]
> **Zero Downtime Guarantee:** The cPanel server strictly binds to port `5200` and `5443`. It will **never** touch, hijack, or interrupt existing websites running on Nginx, Apache, Port 80, or Port 443 (e.g. `parakshtech.com`).

---

## 📋 System Prerequisites

Before running the installer, ensure your VPS (Ubuntu 20.04 / 22.04 / 24.04, Debian, CentOS, or AlmaLinux) has the standard hosting packages installed:

```bash
# Ubuntu / Debian 1-line prerequisite setup
sudo apt update -y && sudo apt install -y curl git nginx mysql-server certbot python3-certbot-nginx

# Install Node.js (v20 LTS) & PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

---

## ⚡ 1-Click Installation & Deployment

Deploying Parakshtech cPanel to a live Linux server takes under 2 minutes:

```bash
# 1. Open required ports in the firewall
sudo ufw allow 5200/tcp comment "cPanel HTTP"
sudo ufw allow 5443/tcp comment "cPanel HTTPS"
sudo ufw allow 80/tcp   comment "Public Web HTTP"
sudo ufw allow 443/tcp  comment "Public Web HTTPS"
sudo ufw allow 53/tcp   comment "DNS TCP"
sudo ufw allow 53/udp   comment "DNS UDP"
sudo ufw reload

# 2. Clone the repository into /var/www/html/cpanel
sudo mkdir -p /var/www/html
cd /var/www/html
sudo git clone https://github.com/it13manoj/cpanel.git
cd cpanel
sudo chown -R $USER:$USER /var/www/html/cpanel

# 3. Run the automated setup wizard
npm run setup
```

*(Alternatively, you can run `bash setup.sh`)*

---

## 💬 What the Setup Wizard Asks You

The interactive setup wizard asks **only** for your MySQL credentials:
1. `👉 Enter MySQL Database Username [root]:` *(Press Enter for default `root`)*
2. `👉 Enter MySQL Database Password:` *(Enter your MySQL root password)*

> 💡 **Non-Interactive / Unattended Setup:**  
> You can also run the setup completely unattended via flags:
> ```bash
> node setup.js --user=root --password=your_secure_password
> ```

---

## 🚀 What the Automated Setup Does For You

1. **MySQL Initialization:**
   - Tests local database connectivity.
   - Automatically creates the `cpanel` database.
   - Auto-creates all 9 schemas: `domains`, `dns_records`, `managed_databases`, `ftp_users`, `panel_users`, `installed_packages`, `managed_apps`, `cron_jobs`, and `activity_logs`.
   - Provisions default Superadmin credentials (`admin` / `admin123`).
2. **Environment File Generation (`.env`):**
   - Generates production `.env` with a secure randomized JWT secret, database credentials, and port configurations.
3. **Public Server IP Auto-Detection:**
   - Detects your VPS public IP address dynamically from the active network interface and external IP services.
4. **10-Year SSL Certificate Generation:**
   - Generates a 2048-bit RSA Private Key (`server/ssl/key.pem`) and X.509 Certificate (`server/ssl/cert.pem`) with Subject Alternative Names (SANs) for both your public server IP and `localhost`.
   - Also auto-detects and binds any existing Let's Encrypt certificates in `/etc/letsencrypt/live/`.
5. **PM2 Process Supervisor Setup:**
   - Registers and launches the cPanel backend as a persistent background daemon: `node-cpanel`.
   - Executes `pm2 save` and `pm2 startup` so cPanel starts automatically on system reboots.
6. **Pre-Compiled Production Frontend:**
   - Serves the compiled production React application from `build/` with zero extra build steps required.

---

## 🔑 Accessing Your Panel

Once installation completes, your panel is live immediately:

| Interface | URL | Description |
| :--- | :--- | :--- |
| **Public HTTP** | `http://<YOUR_SERVER_IP>:5200` | Standard web panel access |
| **Secure HTTPS** | `https://<YOUR_SERVER_IP>:5443` | Encrypted SSL panel access |
| **Local Access** | `http://localhost:5200` | Local server browser access |

### Default Superadmin Credentials:
- **Username:** `admin`
- **Password:** `admin123`

*(You can change your password or create additional users anytime in the **User Manager** section).*

---

## 🌐 Hosting Domains & Automated Nginx Synchronization

Parakshtech cPanel features **Full Automatic Web Server Synchronization**:

### 1. Adding a Domain in the Panel:
1. Open the cPanel dashboard at `http://<YOUR_SERVER_IP>:5200`.
2. Navigate to **Domains & VHosts** (or click **Domains** in the sidebar).
3. Enter your domain (e.g. `gaurishankartemple.com`).
4. Click **Provision & Allocate Domain**.

### 2. What Happens Automatically Behind the Scenes:
- **Document Root Provisioned:** Creates the website folder at `/var/www/html/cpanel/hosting_data/www/<domain>/`.
- **Starter HTML Created:** Generates a branded `index.html` starter page.
- **Nginx Config Generated:** Writes `/etc/nginx/sites-available/<domain>` and creates a symlink in `/etc/nginx/sites-enabled/<domain>`.
- **Nginx Reloaded:** Automatically tests (`nginx -t`) and reloads Nginx so the domain is live on Port 80 immediately.
- **Let's Encrypt SSL Provisioned:** Automatically triggers Certbot in the background to issue a free SSL certificate for `https://<domain>`.
- **DNS Records Seeded:** Pre-populates the DNS zone with `A`, `CNAME`, `MX`, and `NS` records pointing to your public server IP.

### 3. Uploading Your Website Files:
1. Open **File Manager** from the cPanel dashboard.
2. Navigate to `/hosting_data/www/<domain>/`.
3. Upload your website files (`index.html`, `style.css`, images, or zip archive).
4. Extract zip files directly in the browser with 1 click.

---

## 🛰️ Custom Nameservers & DNS Delegation (GoDaddy, Namecheap, Hostinger)

Parakshtech cPanel includes an RFC-compliant **Authoritative DNS Nameserver** running on Port 53 (UDP/TCP).

To point your domain to your cPanel server using **Nameservers (NS)** instead of A records:

### Step 1: Register Glue Records (Host Names) at Your Registrar
Because your nameserver uses your own domain (e.g. `ns1.yourdomain.com`), your registrar requires Glue Records:
1. Log in to your domain registrar (GoDaddy, Namecheap, Hostinger, etc.).
2. Go to **DNS** -> **Host Names** (or **Glue Records** / **Child Nameservers**).
3. Add two host names pointing to your public server IP:
   - **Host:** `ns1` &rarr; **IP Address:** `<YOUR_SERVER_IP>`
   - **Host:** `ns2` &rarr; **IP Address:** `<YOUR_SERVER_IP>`
4. Save the host names.

### Step 2: Update Your Domain Nameservers
1. In your registrar's DNS settings, switch from default registrar nameservers to **Custom Nameservers**.
2. Enter:
   - `ns1.yourdomain.com`
   - `ns2.yourdomain.com`
3. Save. All DNS queries for your domain and subdomains will now be answered directly by your Parakshtech cPanel server!

---

## 🔄 Updating cPanel (1-Command Update)

Whenever new features or patches are released on GitHub, update your server in 10 seconds:

```bash
cd /var/www/html/cpanel
git pull origin main
pm2 restart node-cpanel
```

---

## 🛠️ Handy Server Management Commands

| Action | Command |
| :--- | :--- |
| **View Live cPanel Logs** | `pm2 logs node-cpanel` |
| **Restart cPanel Daemon** | `pm2 restart node-cpanel` |
| **Stop cPanel Daemon** | `pm2 stop node-cpanel` |
| **Check Process Status** | `pm2 status` |
| **Test Nginx Configuration** | `sudo nginx -t` |
| **Reload Nginx Server** | `sudo systemctl reload nginx` |
| **Renew All SSL Certificates** | `sudo certbot renew` |
| **Check MySQL Status** | `sudo systemctl status mysql` |

---

## 🛡️ Troubleshooting & FAQs

### Q: Why does my browser say "Not Secure"?
- **Accessing via IP Address:** SSL certificates only validate domain names (e.g. `https://parakshtech.com`). Accessing via raw IP (`https://173.212.235.87`) will always show a certificate warning.
- **Browser SSL Cache:** If a temporary certificate was recently replaced, open an **Incognito / Private tab** or clear browser cache to load the new Let's Encrypt certificate.
- **Certbot Renewal:** Ensure your certificate is active: `sudo certbot certificates`.

### Q: Why did a domain show "Cannot GET /"?
This occurs if Port 443 falls back to a default backend because Nginx does not yet have an SSL block for that domain. Run:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo systemctl reload nginx
```

### Q: How do I change the default port (5200)?
Edit `/var/www/html/cpanel/.env` and update `PORT=5200` to your desired port, open the port in UFW, and run `pm2 restart node-cpanel`.

---

## 📄 License

MIT License. Designed and maintained by Parakshtech. Replicate, deploy, and scale freely.
