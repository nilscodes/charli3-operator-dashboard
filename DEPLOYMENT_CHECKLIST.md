# Charli3 Dashboard - Deployment Checklist

Use this checklist when deploying to production.

---

## 📋 Pre-Deployment

### Configuration
- [ ] Copy `backend/config.example.yaml` to `backend/config.yaml`
- [ ] Update database credentials (production database)
- [ ] Generate strong API keys (32+ characters, use: `openssl rand -base64 32`)
- [ ] Configure all oracle node addresses
- [ ] Set oracle pair for each node
- [ ] Set appropriate Ada threshold for your operations
- [ ] Configure reward address
- [ ] Set token policy ID
- [ ] Add CoinGecko API key (optional, for higher rate limits)
- [ ] Review all configuration values

### Security Review
- [ ] Verify `config.yaml` is in `.gitignore` (already included)
- [ ] Ensure no sensitive data in code
- [ ] Review API key strength
- [ ] Confirm database user has minimum required permissions
- [ ] Check that database credentials are not in version control

### Dependencies
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Update outdated packages: `npm outdated`
- [ ] Test with production-like database
- [ ] Verify Cardano DB Sync is fully synchronized

---

## 🐳 Docker Deployment

### Build Preparation
- [ ] Ensure `backend/config.yaml` exists
- [ ] Review `docker-compose.yml` settings
- [ ] Set appropriate restart policies
- [ ] Configure port mappings (consider using non-default ports)

### Environment Variables
- [ ] Set `NODE_ENV=production` for backend
- [ ] Configure `CORS_ORIGIN` to your frontend domain
- [ ] Set `VITE_API_URL` to your backend URL (build arg)

### Docker Commands
```bash
# Build and start
docker-compose up -d --build

# Verify containers are running
docker-compose ps

# Check logs
docker-compose logs -f

# Test health endpoint
curl http://localhost:4000/health
```

### Verification
- [ ] Backend container is running
- [ ] Frontend container is running
- [ ] Backend responds to `/health` endpoint
- [ ] Frontend is accessible
- [ ] Can authenticate with API key
- [ ] Dashboard loads node data
- [ ] Reward balance displays
- [ ] Transaction history works

---

## 🖥️ Manual Deployment

### Backend Deployment

#### Build
```bash
cd backend
npm ci --only=production
npm run build
```

#### Environment Setup
```bash
export NODE_ENV=production
export CONFIG_PATH=./config.yaml  # Relative to backend folder
export PORT=4000
export CORS_ORIGIN=https://your-frontend-domain.com
```

#### Process Management
- [ ] Install PM2: `npm install -g pm2`
- [ ] Create PM2 ecosystem file
- [ ] Start with PM2: `pm2 start dist/index.js --name charli3-backend`
- [ ] Configure PM2 startup: `pm2 startup`
- [ ] Save PM2 list: `pm2 save`

#### Verification
- [ ] Backend is running: `pm2 status`
- [ ] Test health endpoint: `curl http://localhost:4000/health`
- [ ] Check logs: `pm2 logs charli3-backend`

### Frontend Deployment

#### Build
```bash
cd frontend
export VITE_API_URL=https://your-api-domain.com/api
npm ci --only=production
npm run build
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    root /path/to/frontend/dist;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    
    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Deploy Steps
- [ ] Copy `frontend/dist` to web server
- [ ] Configure nginx with above settings
- [ ] Obtain SSL certificate (Let's Encrypt recommended)
- [ ] Test nginx config: `nginx -t`
- [ ] Reload nginx: `systemctl reload nginx`

#### Verification
- [ ] Frontend is accessible via HTTPS
- [ ] SSL certificate is valid
- [ ] All assets load correctly
- [ ] No console errors
- [ ] Can connect to backend API

---

## 🔒 Security Hardening

### Network Security
- [ ] Configure firewall rules (allow only necessary ports)
- [ ] Use HTTPS for all connections
- [ ] Configure proper CORS origins (no wildcards in production)
- [ ] Use reverse proxy for backend (nginx/Apache)
- [ ] Implement rate limiting

### Database Security
- [ ] Use read-only database credentials if possible
- [ ] Restrict database access to backend server IP only
- [ ] Use SSL/TLS for database connections
- [ ] Regular database backups
- [ ] Monitor database access logs

### Application Security
- [ ] Review and strengthen API keys
- [ ] Limit API key distribution
- [ ] Implement API request logging
- [ ] Monitor for suspicious activity
- [ ] Keep dependencies updated

### Server Security
- [ ] Keep OS updated
- [ ] Configure automatic security updates
- [ ] Disable unnecessary services
- [ ] Configure SSH properly (key-based auth, no root login)
- [ ] Set up intrusion detection (fail2ban)

---

## 📊 Monitoring & Logging

### Application Monitoring
- [ ] Set up health check monitoring (UptimeRobot, etc.)
- [ ] Configure log aggregation
- [ ] Set up error alerting
- [ ] Monitor API response times
- [ ] Track resource usage (CPU, RAM, disk)

### Logs to Monitor
- [ ] Backend application logs
- [ ] Nginx access logs
- [ ] Nginx error logs
- [ ] Database query logs
- [ ] System logs

### Alerts to Configure
- [ ] Service down alerts
- [ ] High error rate alerts
- [ ] Database connection failures
- [ ] Disk space warnings
- [ ] High memory/CPU usage

### Recommended Tools
- [ ] Grafana + Prometheus for metrics
- [ ] ELK Stack for log aggregation
- [ ] Sentry for error tracking
- [ ] New Relic or Datadog for APM

---

## 🔄 Backup Strategy

### What to Backup
- [ ] `backend/config.yaml` (store securely, encrypted)
- [ ] SSL certificates
- [ ] Application code (version control)
- [ ] Database connection credentials

### Backup Procedures
- [ ] Automate config backups
- [ ] Store backups in secure location
- [ ] Test backup restoration regularly
- [ ] Document recovery procedures

---

## 🚀 Performance Optimization

### Backend
- [ ] Enable database connection pooling (already configured)
- [ ] Implement caching for frequently accessed data
- [ ] Monitor query performance
- [ ] Optimize slow queries
- [ ] Consider read replicas for database

### Frontend
- [ ] Verify gzip compression is enabled
- [ ] Check asset caching headers
- [ ] Optimize images
- [ ] Use CDN for static assets
- [ ] Monitor bundle size

### Database
- [ ] Ensure proper indexes on queried columns
- [ ] Monitor query execution plans
- [ ] Regular VACUUM and ANALYZE
- [ ] Monitor connection pool usage

---

## 📱 Post-Deployment

### Immediate Checks (First 24 hours)
- [ ] Monitor error logs continuously
- [ ] Check API response times
- [ ] Verify all features work as expected
- [ ] Test from different networks
- [ ] Verify auto-refresh works
- [ ] Check memory leaks
- [ ] Monitor database connections

### First Week
- [ ] Review access patterns
- [ ] Optimize based on usage
- [ ] Gather user feedback
- [ ] Monitor for any issues
- [ ] Check backup processes

### Ongoing Maintenance
- [ ] Weekly dependency updates check
- [ ] Monthly security audit
- [ ] Regular backup testing
- [ ] Performance monitoring
- [ ] User access review

---

## 🆘 Rollback Plan

### If Deployment Fails

#### Docker
```bash
# Stop new containers
docker-compose down

# Revert to previous version
git checkout <previous-tag>

# Rebuild and start
docker-compose up -d --build
```

#### Manual
```bash
# Stop services
pm2 stop charli3-backend

# Revert code
git checkout <previous-tag>

# Rebuild
cd backend
npm run build

# Restart
pm2 restart charli3-backend
```

### Recovery Steps
- [ ] Document what went wrong
- [ ] Restore from backup if needed
- [ ] Test thoroughly before re-deploying
- [ ] Review deployment process

---

## ✅ Final Verification

Before considering deployment complete:

- [ ] All services are running
- [ ] Health checks are passing
- [ ] Monitoring is active
- [ ] Backups are configured
- [ ] Logs are being collected
- [ ] SSL certificates are valid
- [ ] All API endpoints work
- [ ] Frontend loads without errors
- [ ] Authentication works
- [ ] Data refreshes correctly
- [ ] Performance is acceptable
- [ ] Security measures are in place
- [ ] Documentation is updated
- [ ] Team is trained on operations

---

## 📞 Emergency Contacts

Document your emergency contacts:

- [ ] DevOps team contact
- [ ] Database administrator
- [ ] Security team
- [ ] On-call rotation
- [ ] Escalation procedures

---

## 📝 Production URLs

Document your production URLs:

- Frontend: `https://___________________________`
- Backend API: `https://___________________________`
- Monitoring Dashboard: `https://___________________________`
- Log Aggregation: `https://___________________________`

---

## 🎉 Deployment Complete!

Once all items are checked:

1. Mark deployment as complete in your project management system
2. Update team documentation
3. Send deployment notification to stakeholders
4. Monitor closely for first 24 hours
5. Schedule post-deployment review

**Congratulations on your deployment!** 🚀

