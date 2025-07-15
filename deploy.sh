#!/bin/bash

# Library Management System - VPS Deployment Script
# This script automates the deployment process on a VPS server

set -e  # Exit on any error

echo "🚀 Starting Library Management System deployment..."

# Configuration
PROJECT_NAME="library-management"
PROJECT_DIR="/var/www/$PROJECT_NAME"
SERVICE_USER="www-data"
PYTHON_VERSION="python3"
VENV_DIR="$PROJECT_DIR/venv"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root (sudo ./deploy.sh)"
    exit 1
fi

# Update system packages
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install required system packages
print_status "Installing system dependencies..."
apt install -y python3 python3-pip python3-venv python3-dev \
    nginx postgresql postgresql-contrib redis-server \
    supervisor git curl ufw fail2ban

# Create project directory
print_status "Setting up project directory..."
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# Create Python virtual environment
print_status "Creating Python virtual environment..."
$PYTHON_VERSION -m venv $VENV_DIR
source $VENV_DIR/bin/activate

# Upgrade pip
pip install --upgrade pip setuptools wheel

# Install Python dependencies
if [ -f "requirements.txt" ]; then
    print_status "Installing Python dependencies..."
    pip install -r requirements.txt
else
    print_warning "requirements.txt not found, installing basic dependencies..."
    pip install flask gunicorn psycopg2-binary flask-sqlalchemy flask-login
fi

# Set up environment variables
print_status "Setting up environment configuration..."
if [ ! -f ".env" ]; then
    cp env.template .env
    print_warning "Please edit .env file with your configuration:"
    print_warning "- Set SECRET_KEY to a secure random string"
    print_warning "- Configure database credentials"
    print_warning "- Set up email settings for password reset"
fi

# Create uploads directory
mkdir -p uploads logs
chown -R $SERVICE_USER:$SERVICE_USER $PROJECT_DIR

# Set up PostgreSQL database
print_status "Setting up PostgreSQL database..."
sudo -u postgres psql -c "CREATE DATABASE library_db;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE USER library_user WITH PASSWORD 'secure_password';" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE library_db TO library_user;" 2>/dev/null || true

# Initialize database
print_status "Initializing database..."
export FLASK_CONFIG=vps
$VENV_DIR/bin/python -c "
from app import app, db
from models import User
with app.app_context():
    db.create_all()
    # Create default admin user if not exists
    admin = User.query.filter_by(username='admin').first()
    if not admin:
        admin = User(username='admin', role='admin', is_active=True, is_verified=True)
        admin.set_password('admin123')  # Change this!
        db.session.add(admin)
        db.session.commit()
        print('Default admin user created: admin/admin123')
    else:
        print('Admin user already exists')
"

# Create Gunicorn configuration
print_status "Creating Gunicorn configuration..."
cat > gunicorn.conf.py << 'EOF'
# Gunicorn configuration for Library Management System

bind = "127.0.0.1:8000"
workers = 4
worker_class = "sync"
worker_connections = 1000
timeout = 120
keepalive = 2
max_requests = 1000
max_requests_jitter = 100
preload_app = True
user = "www-data"
group = "www-data"
tmp_upload_dir = None
secure_scheme_headers = {"X-FORWARDED-PROTOCOL": "ssl", "X-FORWARDED-PROTO": "https", "X-FORWARDED-SSL": "on"}
forwarded_allow_ips = "*"

# Logging
accesslog = "/var/www/library-management/logs/gunicorn_access.log"
errorlog = "/var/www/library-management/logs/gunicorn_error.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'
EOF

# Create systemd service
print_status "Creating systemd service..."
cat > /etc/systemd/system/library-management.service << EOF
[Unit]
Description=Library Management System
After=network.target

[Service]
Type=forking
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$PROJECT_DIR
Environment=PATH=$VENV_DIR/bin
Environment=FLASK_CONFIG=vps
ExecStart=$VENV_DIR/bin/gunicorn --config gunicorn.conf.py wsgi:application
ExecReload=/bin/kill -s HUP \$MAINPID
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Create Nginx configuration
print_status "Creating Nginx configuration..."
cat > /etc/nginx/sites-available/library-management << 'EOF'
server {
    listen 80;
    server_name your-domain.com;  # Change this to your domain
    
    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    location /login {
        limit_req zone=login burst=3 nodelay;
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/ {
        limit_req zone=api burst=10 nodelay;
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /static/ {
        alias /var/www/library-management/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /uploads/ {
        alias /var/www/library-management/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }
    
    # Security
    location ~ /\. {
        deny all;
    }
    
    location ~* \.(sql|env|py|pyc|pyo|log)$ {
        deny all;
    }
}
EOF

# Enable Nginx site
ln -sf /etc/nginx/sites-available/library-management /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Configure firewall
print_status "Configuring firewall..."
ufw --force enable
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow 5432  # PostgreSQL (if remote access needed)

# Configure fail2ban
print_status "Configuring fail2ban..."
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

# Start services
print_status "Starting services..."
systemctl daemon-reload
systemctl enable library-management
systemctl start library-management
systemctl enable nginx
systemctl restart nginx
systemctl enable fail2ban
systemctl start fail2ban
systemctl enable redis
systemctl start redis

# Check service status
print_status "Checking service status..."
systemctl status library-management --no-pager
systemctl status nginx --no-pager

print_status "✅ Deployment completed successfully!"
echo ""
print_warning "Important next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Change default admin password (admin/admin123)"
echo "3. Update Nginx server_name with your domain"
echo "4. Set up SSL with Let's Encrypt (certbot)"
echo "5. Configure email settings for password reset"
echo ""
print_status "Application should be running at: http://your-server-ip"
print_status "Default admin login: admin / admin123" 