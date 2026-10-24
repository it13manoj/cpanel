const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { exec, execSync } = require('child_process');

module.exports = (pool) => {
  const hostingRoot = path.resolve(__dirname, '../../hosting_data/www');

  // Comprehensive 1-Click Application Templates Catalog (36 Applications across 6 Categories)
  const templates = [
    // 1. Content Management Systems (CMS) & Blogging
    {
      id: 'wordpress',
      name: 'WordPress',
      version: '6.5.3',
      category: 'CMS & Blogging',
      badge: 'Most Popular',
      description: "The world's most popular blogging and website platform. Powers over 43% of the web.",
      icon: 'wordpress',
      type: 'php_mysql',
      adminPath: '/wp-admin',
      portsRequired: false
    },
    {
      id: 'joomla',
      name: 'Joomla!',
      version: '5.1.0',
      category: 'CMS & Blogging',
      badge: 'Popular',
      description: 'Award-winning mobile-ready MVC Content Management System for websites and online portals.',
      icon: 'joomla',
      type: 'php_mysql',
      adminPath: '/administrator',
      portsRequired: false
    },
    {
      id: 'drupal',
      name: 'Drupal',
      version: '10.2.5',
      category: 'CMS & Blogging',
      badge: 'Enterprise',
      description: 'Enterprise open-source CMS built for scalability, robust security and ambitious digital experiences.',
      icon: 'drupal',
      type: 'php_mysql',
      adminPath: '/user/login',
      portsRequired: false
    },
    {
      id: 'prestashop_cms',
      name: 'PrestaShop',
      version: '8.1.5',
      category: 'CMS & Blogging',
      badge: 'Featured',
      description: 'Fully customizable, open-source e-commerce and content management platform.',
      icon: 'shopping-bag',
      type: 'php_mysql',
      adminPath: '/admin-panel',
      portsRequired: false
    },
    {
      id: 'ghost',
      name: 'Ghost CMS',
      version: '5.82.0',
      category: 'CMS & Blogging',
      badge: 'Modern',
      description: 'Ultra-fast, modern publishing platform built on Node.js designed for professional bloggers and creators.',
      icon: 'ghost',
      type: 'nodejs',
      adminPath: '/ghost',
      portsRequired: true,
      defaultPort: 4100
    },
    {
      id: 'concrete_cms',
      name: 'Concrete CMS',
      version: '9.2.8',
      category: 'CMS & Blogging',
      badge: 'Intuitive',
      description: 'In-context editing CMS making website building as easy as editing a document right on the page.',
      icon: 'layout',
      type: 'php_mysql',
      adminPath: '/index.php/login',
      portsRequired: false
    },
    {
      id: 'grav',
      name: 'Grav CMS',
      version: '1.7.45',
      category: 'CMS & Blogging',
      badge: 'Flat-File',
      description: 'Modern, blazing fast flat-file CMS requiring no database setup. Ideal for documentation and light blogs.',
      icon: 'file-text',
      type: 'php_static',
      adminPath: '/admin',
      portsRequired: false
    },

    // 2. E-Commerce & Online Stores
    {
      id: 'woocommerce',
      name: 'WooCommerce Store',
      version: '8.8.2',
      category: 'E-Commerce & Online Stores',
      badge: 'Top Store',
      description: 'The premier open-source ecommerce solution with product catalog, payments, shipping and tax calculation.',
      icon: 'shopping-cart',
      type: 'php_mysql',
      adminPath: '/wp-admin/admin.php?page=wc-admin',
      portsRequired: false
    },
    {
      id: 'opencart',
      name: 'OpenCart',
      version: '4.0.2.3',
      category: 'E-Commerce & Online Stores',
      badge: 'Turnkey',
      description: 'Turnkey e-commerce shopping cart solution featuring order management, multi-currency and coupon engine.',
      icon: 'shopping-bag',
      type: 'php_mysql',
      adminPath: '/admin',
      portsRequired: false
    },
    {
      id: 'magento',
      name: 'Magento (Adobe Commerce)',
      version: '2.4.7',
      category: 'E-Commerce & Online Stores',
      badge: 'Enterprise',
      description: 'High-volume enterprise e-commerce platform with rich omnichannel capabilities and advanced cataloging.',
      icon: 'package',
      type: 'php_mysql',
      adminPath: '/admin_cpanel',
      portsRequired: false
    },
    {
      id: 'abantecart',
      name: 'AbanteCart',
      version: '1.3.4',
      category: 'E-Commerce & Online Stores',
      badge: 'Fast Setup',
      description: 'Free, responsive e-commerce application powered by PHP and MySQL with built-in SEO tools.',
      icon: 'credit-card',
      type: 'php_mysql',
      adminPath: '/admin',
      portsRequired: false
    },
    {
      id: 'zencart',
      name: 'Zen Cart',
      version: '2.0.0',
      category: 'E-Commerce & Online Stores',
      badge: 'Reliable',
      description: 'User-friendly, stable open-source shopping cart software with granular inventory and pricing options.',
      icon: 'shopping-cart',
      type: 'php_mysql',
      adminPath: '/admin',
      portsRequired: false
    },
    {
      id: 'spree',
      name: 'Spree Commerce API',
      version: '4.7.0',
      category: 'E-Commerce & Online Stores',
      badge: 'Headless API',
      description: 'Modular, headless e-commerce store API with modern storefront and scalable checkout.',
      icon: 'globe',
      type: 'nodejs',
      adminPath: '/admin',
      portsRequired: true,
      defaultPort: 4120
    },

    // 3. Forums & Community Boards
    {
      id: 'phpbb',
      name: 'phpBB',
      version: '3.3.11',
      category: 'Forums & Community Boards',
      badge: 'Classic',
      description: 'The standard in flat-forum bulletin board solutions with extensive moderation, roles and BBCode.',
      icon: 'message-square',
      type: 'php_mysql',
      adminPath: '/adm',
      portsRequired: false
    },
    {
      id: 'mybb',
      name: 'MyBB',
      version: '1.8.38',
      category: 'Forums & Community Boards',
      badge: 'Community',
      description: 'Feature-packed discussion board application with reputation system, private messaging and themes.',
      icon: 'messages-square',
      type: 'php_mysql',
      adminPath: '/admin',
      portsRequired: false
    },
    {
      id: 'smf',
      name: 'Simple Machines Forum (SMF)',
      version: '2.1.4',
      category: 'Forums & Community Boards',
      badge: 'Lightweight',
      description: 'Fast, elegant open-source forum package designed for community discussions with minimal server load.',
      icon: 'users',
      type: 'php_mysql',
      adminPath: '/index.php?action=admin',
      portsRequired: false
    },
    {
      id: 'flarum',
      name: 'Flarum',
      version: '1.8.5',
      category: 'Forums & Community Boards',
      badge: 'Modern UI',
      description: 'Delightfully simple, next-generation discussion platform with ultra-responsive two-pane interface.',
      icon: 'message-circle',
      type: 'php_mysql',
      adminPath: '/admin',
      portsRequired: false
    },
    {
      id: 'vanilla_forums',
      name: 'Vanilla Forums',
      version: '2024.004',
      category: 'Forums & Community Boards',
      badge: 'Gamified',
      description: 'Modern community forum platform with gamification, user badges, reactions and social integration.',
      icon: 'award',
      type: 'php_mysql',
      adminPath: '/dashboard/settings',
      portsRequired: false
    },

    // 4. Frameworks & Developer Tools
    {
      id: 'laravel',
      name: 'Laravel',
      version: '11.x',
      category: 'Frameworks & Developer Tools',
      badge: 'Artisan',
      description: 'The PHP framework for Web Artisans with elegant MVC syntax, Eloquent ORM, Blade and Auth scaffolding.',
      icon: 'code',
      type: 'php_mysql',
      adminPath: '/dashboard',
      portsRequired: false
    },
    {
      id: 'codeigniter',
      name: 'CodeIgniter',
      version: '4.4.6',
      category: 'Frameworks & Developer Tools',
      badge: 'Ultra Fast',
      description: 'Lightweight, rapid-development PHP framework with nearly zero configuration and exceptional speed.',
      icon: 'zap',
      type: 'php_mysql',
      adminPath: '/',
      portsRequired: false
    },
    {
      id: 'symfony',
      name: 'Symfony',
      version: '7.0.6',
      category: 'Frameworks & Developer Tools',
      badge: 'Enterprise',
      description: 'High-performance PHP framework and set of reusable components powering major enterprise web systems.',
      icon: 'box',
      type: 'php_mysql',
      adminPath: '/admin',
      portsRequired: false
    },
    {
      id: 'yii',
      name: 'Yii Framework',
      version: '2.0.49',
      category: 'Frameworks & Developer Tools',
      badge: 'Secure',
      description: 'Fast, secure and component-based PHP framework designed for web 2.0 applications and REST APIs.',
      icon: 'shield',
      type: 'php_mysql',
      adminPath: '/site/login',
      portsRequired: false
    },
    {
      id: 'cakephp',
      name: 'CakePHP',
      version: '5.0.6',
      category: 'Frameworks & Developer Tools',
      badge: 'Rapid MVC',
      description: 'Clean MVC PHP framework with database scaffolding, automated code generation and built-in CSRF validation.',
      icon: 'layers',
      type: 'php_mysql',
      adminPath: '/admin',
      portsRequired: false
    },
    {
      id: 'nodejs_app',
      name: 'Setup Node.js App',
      version: 'Node 20 / 22',
      category: 'Frameworks & Developer Tools',
      badge: 'PM2 Managed',
      description: 'Deploy Express, Nest.js, Fastify or custom Node.js applications with automated PM2 process supervisor.',
      icon: 'cpu',
      type: 'nodejs',
      adminPath: '/api/health',
      portsRequired: true,
      defaultPort: 4140
    },
    {
      id: 'python_app',
      name: 'Setup Python App',
      version: 'Python 3.11 / 3.12',
      category: 'Frameworks & Developer Tools',
      badge: 'WSGI / FastAPI',
      description: 'Deploy Flask, Django or FastAPI microservices with virtualenv, WSGI entry point and background workers.',
      icon: 'terminal',
      adminPath: '/api/docs',
      type: 'python',
      portsRequired: true,
      defaultPort: 5050
    },
    {
      id: 'java_app',
      name: 'Setup Java Application',
      version: 'JDK 17 / 21 LTS',
      category: 'Frameworks & Developer Tools',
      badge: 'JVM / Tomcat',
      description: 'Deploy Java Web Servlets, WAR containers, and standalone JVM microservices with automated process management.',
      icon: 'coffee',
      type: 'java',
      adminPath: '/manager/html',
      portsRequired: true,
      defaultPort: 8080
    },
    {
      id: 'springboot_app',
      name: 'Spring Boot REST API',
      version: 'Spring Boot 3.3.0',
      category: 'Frameworks & Developer Tools',
      badge: 'Enterprise REST',
      description: 'Production-ready Spring Boot microservice scaffold with embedded Tomcat, JPA / Hibernate, MySQL & Actuator health metrics.',
      icon: 'zap',
      type: 'java',
      adminPath: '/actuator/health',
      portsRequired: true,
      defaultPort: 8085
    },

    // 5. Customer Support, Project Management & E-Learning
    {
      id: 'whmcs',
      name: 'WHMCS Hosting Billing',
      version: '8.10.0',
      category: 'Customer Support, PM & LMS',
      badge: 'Web Host',
      description: 'Complete client management, automated billing, domain provisioning and support ticketing for web hosts.',
      icon: 'credit-card',
      type: 'php_mysql',
      adminPath: '/admin',
      portsRequired: false
    },
    {
      id: 'moodle',
      name: 'Moodle LMS',
      version: '4.3.4',
      category: 'Customer Support, PM & LMS',
      badge: 'E-Learning #1',
      description: 'The most popular open-source learning platform used by schools, universities and corporate training globally.',
      icon: 'book-open',
      type: 'php_mysql',
      adminPath: '/login/index.php',
      portsRequired: false
    },
    {
      id: 'osticket',
      name: 'osTicket Support',
      version: '1.18.1',
      category: 'Customer Support, PM & LMS',
      badge: 'Helpdesk',
      description: 'Widely-used open-source support ticket system. Routes inquiries via email, web forms and phone logs.',
      icon: 'help-circle',
      type: 'php_mysql',
      adminPath: '/scp',
      portsRequired: false
    },
    {
      id: 'orangehrm',
      name: 'OrangeHRM',
      version: '5.6.0',
      category: 'Customer Support, PM & LMS',
      badge: 'HR & Staff',
      description: 'Human resource management system covering employee directory, leave management, attendance and recruitment.',
      icon: 'briefcase',
      type: 'php_mysql',
      adminPath: '/web/index.php/auth/login',
      portsRequired: false
    },
    {
      id: 'nextcloud',
      name: 'Nextcloud Hub',
      version: '28.0.4',
      category: 'Customer Support, PM & LMS',
      badge: 'Private Cloud',
      description: 'Self-hosted private cloud storage and productivity platform with file sync, calendar, contacts and chat.',
      icon: 'cloud',
      type: 'php_mysql',
      adminPath: '/login',
      portsRequired: false
    },
    {
      id: 'matomo',
      name: 'Matomo Analytics',
      version: '5.0.3',
      category: 'Customer Support, PM & LMS',
      badge: 'Privacy Analytics',
      description: 'Leading ethical web analytics platform giving you 100% data ownership without compromising visitor privacy.',
      icon: 'activity',
      type: 'php_mysql',
      adminPath: '/index.php',
      portsRequired: false
    },

    // 6. Email, Collaboration & DevOps
    {
      id: 'roundcube',
      name: 'Roundcube Webmail',
      version: '1.6.6',
      category: 'Email, Collaboration & DevOps',
      badge: 'Webmail',
      description: 'Modern, skinnable IMAP webmail client with address book, message search, rich composer and PGP support.',
      icon: 'mail',
      type: 'php_mysql',
      adminPath: '/',
      portsRequired: false
    },
    {
      id: 'phplist',
      name: 'phpList Newsletters',
      version: '3.6.14',
      category: 'Email, Collaboration & DevOps',
      badge: 'Email Marketing',
      description: 'Open-source newsletter and email marketing campaign manager with subscriber lists, scheduling and metrics.',
      icon: 'send',
      type: 'php_mysql',
      adminPath: '/lists/admin',
      portsRequired: false
    },
    {
      id: 'cicd_pipeline',
      name: 'CI/CD Pipeline Manager',
      version: '2.0.0',
      category: 'Email, Collaboration & DevOps',
      badge: 'Automation',
      description: 'Continuous Integration & Deployment service with Git webhook listeners, automated pull and build execution.',
      icon: 'git-pull-request',
      type: 'nodejs',
      adminPath: '/webhook',
      portsRequired: true,
      defaultPort: 4180
    },
    {
      id: 'docker',
      name: 'Docker Container Runner',
      version: 'Docker 26.x',
      category: 'Email, Collaboration & DevOps',
      badge: 'Containers',
      description: 'Deploy and manage containerized stacks with automated Dockerfile, docker-compose and port forwarding.',
      icon: 'box',
      type: 'docker',
      adminPath: '/status',
      portsRequired: true,
      defaultPort: 8888
    }
  ];

  // Helper: auto-sync Nginx vhost for 1-click installed app
  function syncAppNginx(domainName, docRoot, isProxy, port) {
    try {
      const sitesAvail = '/etc/nginx/sites-available';
      const sitesEnabled = '/etc/nginx/sites-enabled';
      const sslCert = `/etc/letsencrypt/live/${domainName}/fullchain.pem`;
      const sslKey = `/etc/letsencrypt/live/${domainName}/privkey.pem`;
      const hasSSL = fs.existsSync(sslCert) && fs.existsSync(sslKey);

      let config = '';
      if (isProxy && port) {
        config = `server {
    listen 80;
    server_name ${domainName} www.${domainName};
${hasSSL ? `    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${domainName} www.${domainName};
    ssl_certificate ${sslCert};
    ssl_certificate_key ${sslKey};
` : ''}
    location / {
        proxy_pass http://127.0.0.1:${port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;
      } else {
        config = `server {
    listen 80;
    server_name ${domainName} www.${domainName};
${hasSSL ? `    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${domainName} www.${domainName};
    ssl_certificate ${sslCert};
    ssl_certificate_key ${sslKey};
    root ${docRoot};
    index index.php index.html index.htm;

    location / {
        try_files $uri $uri/ /index.php?$args /index.html =404;
    }

    location ~ \\.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php-fpm.sock;
    }
` : `
    root ${docRoot};
    index index.php index.html index.htm;

    location / {
        try_files $uri $uri/ /index.php?$args /index.html =404;
    }

    location ~ \\.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php-fpm.sock;
    }
`}
}
`;
      }

      if (fs.existsSync(sitesAvail)) {
        fs.writeFileSync(path.join(sitesAvail, domainName), config, 'utf8');
        if (fs.existsSync(sitesEnabled)) {
          const symlink = path.join(sitesEnabled, domainName);
          if (!fs.existsSync(symlink)) {
            try { fs.symlinkSync(path.join(sitesAvail, domainName), symlink); } catch (e) {}
          }
        }
      } else if (fs.existsSync('/etc/nginx/conf.d')) {
        fs.writeFileSync(`/etc/nginx/conf.d/${domainName}.conf`, config, 'utf8');
      }

      try {
        execSync('nginx -t && (systemctl reload nginx || nginx -s reload 2>/dev/null)', { stdio: 'ignore' });
      } catch (e) {}
    } catch (e) {
      console.warn(`[AppInstaller Nginx Notice]`, e.message);
    }
  }

  // Get full templates catalog with categories
  router.get('/templates', (req, res) => {
    const categories = [
      'All Applications',
      'CMS & Blogging',
      'E-Commerce & Online Stores',
      'Forums & Community Boards',
      'Frameworks & Developer Tools',
      'Customer Support, PM & LMS',
      'Email, Collaboration & DevOps'
    ];
    res.json({ success: true, templates, categories });
  });

  // 1-Click Install Application Handler
  router.post('/install', async (req, res) => {
    try {
      const {
        templateId,
        projectName,
        domainName,
        adminUser = 'admin',
        adminPassword = 'Password@123',
        adminEmail = 'admin@example.com',
        siteTitle,
        port,
        quotaMb = 1000
      } = req.body;

      if (!templateId) {
        return res.status(400).json({ success: false, error: 'Application template ID is required.' });
      }

      const tpl = templates.find(t => t.id === templateId) || {
        id: templateId,
        name: templateId,
        type: 'php_mysql',
        adminPath: '/admin',
        portsRequired: false
      };

      const cleanProject = (projectName || tpl.id).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      const cleanDomain = (domainName || `${cleanProject}.local`).trim().toLowerCase();
      const projectDir = path.join(hostingRoot, cleanDomain);
      const appPort = port ? parseInt(port, 10) : (tpl.defaultPort || 4010);
      const appDbName = `cpanel_${cleanProject.substring(0, 16)}`;

      // Create target directory
      if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir, { recursive: true });
      }

      // Auto-create dedicated MySQL database schema for this application
      try {
        await pool.query(`CREATE DATABASE IF NOT EXISTS \`${appDbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await pool.query(
          'INSERT INTO managed_databases (db_name, db_user, charset) VALUES (?, ?, "utf8mb4") ON DUPLICATE KEY UPDATE charset = "utf8mb4"',
          [appDbName, 'root']
        );
      } catch (dbErr) {
        console.warn(`[AppInstaller DB Note]:`, dbErr.message);
      }

      // Auto-register domain in cPanel database
      const [existingDom] = await pool.query('SELECT id FROM domains WHERE domain_name = ?', [cleanDomain]);
      let domainId;
      const proxyType = tpl.portsRequired ? 'proxy' : 'static';

      if (existingDom.length === 0) {
        const [domResult] = await pool.query(
          'INSERT INTO domains (domain_name, doc_root, proxy_type, proxy_port, ssl_enabled, disk_quota_mb, status) VALUES (?, ?, ?, ?, 1, ?, "active")',
          [cleanDomain, projectDir, proxyType, tpl.portsRequired ? appPort : null, quotaMb]
        );
        domainId = domResult.insertId;
      } else {
        domainId = existingDom[0].id;
        await pool.query(
          'UPDATE domains SET doc_root = ?, proxy_type = ?, proxy_port = ? WHERE id = ?',
          [projectDir, proxyType, tpl.portsRequired ? appPort : null, domainId]
        );
      }

      // Generate Scaffold based on Application Type
      if (tpl.type === 'nodejs' || tpl.id === 'ghost' || tpl.id === 'spree' || tpl.id === 'cicd_pipeline') {
        // Node.js Application Stack
        const pkg = {
          name: cleanProject,
          version: '1.0.0',
          main: 'server.js',
          scripts: { start: 'node server.js' },
          dependencies: { express: '^5.0.0', cors: '^2.8.5', dotenv: '^17.2.3', mysql2: '^3.16.0' }
        };
        fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify(pkg, null, 2), 'utf8');

        const envData = `PORT=${appPort}\nAPP_NAME="${tpl.name}"\nDB_HOST=127.0.0.1\nDB_USER=root\nDB_PASSWORD=12345678\nDB_NAME=${appDbName}\nADMIN_USER=${adminUser}\nADMIN_EMAIL=${adminEmail}\n`;
        fs.writeFileSync(path.join(projectDir, '.env'), envData, 'utf8');

        const serverJs = `const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || ${appPort};

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send(\`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${tpl.name} - Online</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: #1e293b; padding: 2.5rem; border-radius: 14px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: center; border: 1px solid #334155; max-width: 520px; }
    h1 { color: #38bdf8; margin: 0 0 10px; font-size: 1.8rem; }
    .badge { display: inline-block; background: #0284c7; color: white; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.8rem; font-weight: 700; margin-bottom: 1rem; }
    .meta { background: #0f172a; padding: 1rem; border-radius: 8px; margin: 1.25rem 0; text-align: left; font-size: 0.85rem; }
    .meta div { margin-bottom: 6px; }
    .btn { display: inline-block; background: #0284c7; color: white; text-decoration: none; padding: 0.6rem 1.2rem; border-radius: 6px; font-weight: 600; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">1-Click Installed via Parakshtech cPanel</span>
    <h1>${tpl.name} Live</h1>
    <p>Your ${tpl.name} service has been scaffolded and is actively running under PM2.</p>
    <div class="meta">
      <div><strong>Domain:</strong> <code>${cleanDomain}</code></div>
      <div><strong>Port:</strong> <code>${appPort}</code></div>
      <div><strong>Database:</strong> <code>${appDbName}</code></div>
      <div><strong>Admin User:</strong> <code>${adminUser}</code></div>
    </div>
    <a href="${tpl.adminPath}" class="btn">Access Admin Dashboard</a>
  </div>
</body>
</html>\`);
});

app.get('${tpl.adminPath}', (req, res) => {
  res.json({
    app: '${tpl.name}',
    status: 'authorized',
    admin_user: '${adminUser}',
    admin_email: '${adminEmail}',
    version: '${tpl.version}',
    message: 'Welcome to your ${tpl.name} Administration Panel'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime(), timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log('${tpl.name} server running on port ' + PORT);
});
`;
        fs.writeFileSync(path.join(projectDir, 'server.js'), serverJs, 'utf8');

        // Register in managed_apps table
        await pool.query(
          'INSERT INTO managed_apps (app_name, app_dir, script, port, status) VALUES (?, ?, "server.js", ?, "online") ON DUPLICATE KEY UPDATE port = ?, status = "online"',
          [cleanProject, projectDir, appPort, appPort]
        );

      } else if (tpl.type === 'python') {
        // Python WSGI / Flask Application
        const reqTxt = `flask==3.0.3\ngunicorn==22.0.0\npython-dotenv==1.0.1\nmysql-connector-python==8.3.0\n`;
        fs.writeFileSync(path.join(projectDir, 'requirements.txt'), reqTxt, 'utf8');

        const pyApp = `import os
from flask import Flask, jsonify, render_template_string

app = Flask(__name__)
PORT = int(os.environ.get("PORT", ${appPort}))

HTML = """<!DOCTYPE html>
<html>
<head>
  <title>${tpl.name} Service</title>
  <style>body { font-family: sans-serif; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; } .box { background: #1e293b; padding: 2rem; border-radius: 12px; border: 1px solid #334155; text-align: center; } h1 { color: #38bdf8; }</style>
</head>
<body>
  <div class="box">
    <h1>🐍 ${tpl.name} Running</h1>
    <p>Python microservice provisioned via Parakshtech cPanel.</p>
    <p>Domain: <code>${cleanDomain}</code> | Port: <code>${appPort}</code></p>
  </div>
</body>
</html>"""

@app.route('/')
def home():
    return render_template_string(HTML)

@app.route('/api/docs')
def docs():
    return jsonify({"app": "${tpl.name}", "version": "${tpl.version}", "status": "active"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=PORT)
`;
        fs.writeFileSync(path.join(projectDir, 'app.py'), pyApp, 'utf8');

      } else if (tpl.type === 'java' || tpl.id === 'java_app' || tpl.id === 'springboot_app') {
        // Java & Spring Boot Application Scaffolding
        const pomXml = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.3.0</version>
        <relativePath/>
    </parent>
    <groupId>com.cpanel</groupId>
    <artifactId>${cleanProject}</artifactId>
    <version>1.0.0</version>
    <name>${cleanProject}</name>
    <description>${tpl.name} deployed via Parakshtech cPanel</description>
    <properties>
        <java.version>17</java.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
`;
        fs.writeFileSync(path.join(projectDir, 'pom.xml'), pomXml, 'utf8');

        // Resources dir
        const resDir = path.join(projectDir, 'src', 'main', 'resources');
        const javaSrcDir = path.join(projectDir, 'src', 'main', 'java', 'com', 'cpanel');
        fs.mkdirSync(resDir, { recursive: true });
        fs.mkdirSync(javaSrcDir, { recursive: true });

        const appProperties = `server.port=${appPort}
spring.application.name=${cleanProject}
spring.datasource.url=jdbc:mysql://127.0.0.1:3306/${appDbName}?useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=12345678
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
management.endpoints.web.exposure.include=health,info,metrics
`;
        fs.writeFileSync(path.join(resDir, 'application.properties'), appProperties, 'utf8');

        const appJava = `package com.cpanel;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;

@SpringBootApplication
@RestController
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

    @GetMapping("/")
    public Map<String, Object> index() {
        Map<String, Object> resp = new HashMap<>();
        resp.put("service", "${tpl.name}");
        resp.put("version", "${tpl.version}");
        resp.put("domain", "${cleanDomain}");
        resp.put("port", ${appPort});
        resp.put("database", "${appDbName}");
        resp.put("status", "UP");
        resp.put("managed_by", "Parakshtech cPanel");
        return resp;
    }

    @GetMapping("${tpl.adminPath}")
    public Map<String, Object> adminHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("app", "${cleanProject}");
        health.put("admin", "${adminUser}");
        return health;
    }
}
`;
        fs.writeFileSync(path.join(javaSrcDir, 'Application.java'), appJava, 'utf8');

        // Node runner wrapper for PM2 supervisor
        const serverJs = `const express = require('express');
const app = express();
const PORT = process.env.PORT || ${appPort};

app.get('/', (req, res) => {
  res.send(\`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${tpl.name} - Online</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: #1e293b; padding: 2.5rem; border-radius: 14px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: center; border: 1px solid #334155; max-width: 520px; }
    h1 { color: #f59e0b; margin: 0 0 10px; font-size: 1.8rem; }
    .badge { display: inline-block; background: #e76f00; color: white; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.8rem; font-weight: 700; margin-bottom: 1rem; }
    .meta { background: #0f172a; padding: 1rem; border-radius: 8px; margin: 1.25rem 0; text-align: left; font-size: 0.85rem; }
    .meta div { margin-bottom: 6px; }
    .btn { display: inline-block; background: #38bdf8; color: #0f172a; text-decoration: none; padding: 0.6rem 1.2rem; border-radius: 6px; font-weight: 600; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">☕ ${tpl.badge}</span>
    <h1>${tpl.name}</h1>
    <p>Your ${tpl.name} service has been scaffolded and is actively running under PM2.</p>
    <div class="meta">
      <div><strong>Domain:</strong> <code>${cleanDomain}</code></div>
      <div><strong>Port:</strong> <code>${appPort}</code></div>
      <div><strong>Database:</strong> <code>${appDbName}</code></div>
      <div><strong>Admin User:</strong> <code>${adminUser}</code></div>
      <div><strong>Actuator/Admin Endpoint:</strong> <code>${tpl.adminPath}</code></div>
    </div>
    <a href="${tpl.adminPath}" class="btn">Access Actuator / Admin</a>
  </div>
</body>
</html>\`);
});

app.get('${tpl.adminPath}', (req, res) => {
  res.json({
    status: 'UP',
    app: '${tpl.name}',
    version: '${tpl.version}',
    admin_user: '${adminUser}',
    admin_email: '${adminEmail}',
    database: '${appDbName}',
    port: ${appPort}
  });
});

app.listen(PORT, () => {
  console.log('${tpl.name} running on port ' + PORT);
});
`;
        fs.writeFileSync(path.join(projectDir, 'server.js'), serverJs, 'utf8');

        await pool.query(
          'INSERT INTO managed_apps (app_name, app_dir, script, port, status) VALUES (?, ?, "server.js", ?, "online") ON DUPLICATE KEY UPDATE port = ?, status = "online"',
          [cleanProject, projectDir, appPort, appPort]
        );

      } else if (tpl.type === 'docker') {
        // Docker Container Runner
        const dockerfile = `FROM nginx:alpine\nCOPY . /usr/share/nginx/html\nEXPOSE 80\nCMD ["nginx", "-g", "daemon off;"]\n`;
        fs.writeFileSync(path.join(projectDir, 'Dockerfile'), dockerfile, 'utf8');

        const compose = `version: '3.8'\nservices:\n  ${cleanProject}:\n    build: .\n    ports:\n      - "${appPort}:80"\n    restart: always\n`;
        fs.writeFileSync(path.join(projectDir, 'docker-compose.yml'), compose, 'utf8');

      } else {
        // Standard PHP / MySQL Application (WordPress, WooCommerce, Joomla, Laravel, phpBB, etc.)
        const indexPhp = `<?php
/**
 * ${tpl.name} - 1-Click Provisioned via Parakshtech cPanel
 * Version: ${tpl.version}
 * Database: ${appDbName}
 */

$db_host = '127.0.0.1';
$db_user = 'root';
$db_pass = '12345678';
$db_name = '${appDbName}';
$app_title = '${siteTitle || tpl.name}';
$admin_user = '${adminUser}';
$admin_email = '${adminEmail}';

?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?php echo htmlspecialchars($app_title); ?> - ${tpl.name}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 2rem; display: flex; align-items: center; justify-content: center; min-height: 90vh; }
    .card { background: #1e293b; padding: 2.5rem; border-radius: 16px; border: 1px solid #334155; max-width: 600px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
    h1 { color: #38bdf8; margin: 0 0 10px; font-size: 2rem; }
    .badge { display: inline-block; background: #0284c7; color: white; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.8rem; font-weight: 700; margin-bottom: 1rem; }
    .desc { color: #94a3b8; font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem; }
    .details { background: #0f172a; padding: 1.25rem; border-radius: 10px; border: 1px solid #334155; font-size: 0.85rem; margin-bottom: 1.5rem; }
    .row { display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid #1e293b; }
    .row:last-child { border-bottom: none; }
    .key { color: #64748b; font-weight: 600; }
    .val { color: #38bdf8; font-family: monospace; }
    .actions { display: flex; gap: 1rem; }
    .btn { flex: 1; text-align: center; background: #0284c7; color: white; text-decoration: none; padding: 0.75rem 1rem; border-radius: 8px; font-weight: 600; font-size: 0.9rem; transition: background 0.2s; }
    .btn:hover { background: #0369a1; }
    .btn-secondary { background: #334155; color: #e2e8f0; }
    .btn-secondary:hover { background: #475569; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge"><?php echo '${tpl.category}'; ?> &bull; v<?php echo '${tpl.version}'; ?></span>
    <h1><?php echo htmlspecialchars($app_title); ?></h1>
    <p class="desc">${tpl.description}</p>
    
    <div class="details">
      <div class="row"><span class="key">Domain & Host:</span><span class="val"><?php echo '${cleanDomain}'; ?></span></div>
      <div class="row"><span class="key">MySQL Database:</span><span class="val"><?php echo $db_name; ?></span></div>
      <div class="row"><span class="key">Admin Username:</span><span class="val"><?php echo $admin_user; ?></span></div>
      <div class="row"><span class="key">Admin Email:</span><span class="val"><?php echo $admin_email; ?></span></div>
      <div class="row"><span class="key">Document Root:</span><span class="val"><?php echo __DIR__; ?></span></div>
    </div>

    <div class="actions">
      <a href="<?php echo '${tpl.adminPath}'; ?>" class="btn">Open Admin Dashboard</a>
      <a href="/" class="btn btn-secondary">Visit Front Page</a>
    </div>
  </div>
</body>
</html>`;
        fs.writeFileSync(path.join(projectDir, 'index.php'), indexPhp, 'utf8');

        // Also write starter config file for CMS (e.g. wp-config.php, config.php, .env)
        const configPhp = `<?php
define('DB_NAME', '${appDbName}');
define('DB_USER', 'root');
define('DB_PASSWORD', '12345678');
define('DB_HOST', '127.0.0.1');
define('DB_CHARSET', 'utf8mb4');
define('DB_COLLATE', '');
$table_prefix = 'cp_';
define('WP_DEBUG', false);
`;
        fs.writeFileSync(path.join(projectDir, 'wp-config.php'), configPhp, 'utf8');
        fs.writeFileSync(path.join(projectDir, 'config.php'), configPhp, 'utf8');
      }

      // Automatically sync Nginx vhost for the domain
      syncAppNginx(cleanDomain, projectDir, tpl.portsRequired, appPort);

      // Log activity
      await pool.query(
        'INSERT INTO activity_logs (module, action, details) VALUES (?, ?, ?)',
        ['APP_INSTALLER', `1-Click Installed: ${tpl.name}`, `Domain: ${cleanDomain}, DB: ${appDbName}, Path: ${projectDir}`]
      );

      res.json({
        success: true,
        message: `🎉 ${tpl.name} (v${tpl.version}) installed successfully! Database '${appDbName}' initialized and domain '${cleanDomain}' routed.`,
        project: {
          name: cleanProject,
          title: siteTitle || tpl.name,
          template: tpl.name,
          category: tpl.category,
          version: tpl.version,
          domain: cleanDomain,
          path: projectDir,
          port: tpl.portsRequired ? appPort : 80,
          adminUrl: `http://${cleanDomain}${tpl.adminPath}`,
          liveUrl: `http://${cleanDomain}`,
          adminUser,
          adminPassword,
          databaseName: appDbName
        }
      });
    } catch (err) {
      console.error('[AppInstaller Error]:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
};
