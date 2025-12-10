# Charli3 Dashboard - Quick Start Guide

## 🚀 Installation (5 minutes)

### Step 1: Install Dependencies

```bash
npm install
```

This will automatically install dependencies for both frontend and backend workspaces.

### Step 2: Configure the Application

```bash
# Copy example configuration to backend folder
cp backend/config.example.yaml backend/config.yaml

# Edit with your settings
# Minimum required changes:
# 1. Update database.* fields with your Cardano DB Sync credentials
# 2. Add at least one API key to apiKeys array
# 3. Add at least one node address with pair
# 4. Set rewardAddress and tokenPolicy
```

**Example minimal backend/config.yaml:**

```yaml
database:
  host: localhost
  port: 5432
  database: cardano
  user: cardano
  password: your_password

apiKeys:
  - my-secret-key-12345

adaThreshold: 100000000  # 100 ADA

nodes:
  - address: addr1qxy...your_actual_address
    pair: ADA/USD

rewardAddress: addr1qre...your_reward_address
tokenPolicy: abc123...your_token_policy_hex

priceProvider:
  type: coingecko
  tokenId: cardano
```

### Step 3: Run the Application

**Option A: Development Mode (Recommended for first run)**

```bash
# Terminal 1: Start backend
npm run dev:backend

# Terminal 2: Start frontend  
npm run dev:frontend
```

**Option B: Docker (Production-ready)**

```bash
docker-compose up -d
```

### Step 4: Access the Dashboard

1. Open your browser to: **http://localhost:3000**
2. Enter one of your API keys from `backend/config.yaml`
3. View your oracle nodes and balances!

## 📋 Verification Checklist

After installation, verify:

- [ ] Backend starts without errors on port 4000
- [ ] Frontend starts without errors on port 3000
- [ ] You can access http://localhost:3000
- [ ] API key modal appears
- [ ] After entering API key, dashboard loads
- [ ] Node cards display with correct addresses
- [ ] Balance information loads
- [ ] Clicking "View Details" opens detail page
- [ ] Transaction history loads on detail page

## 🔧 Common Issues & Solutions

### ❌ Database Connection Failed

**Error**: `Failed to connect to database`

**Solution**:
```bash
# Test your database connection
psql -h localhost -U cardano -d cardano

# Verify Cardano DB Sync is running
docker ps | grep cardano-db-sync

# Check config.yaml database settings
```

### ❌ Invalid API Key

**Error**: `Invalid API key`

**Solution**:
- Check that the API key in backend/config.yaml matches what you entered
- No quotes needed in YAML array
- Clear browser session storage and try again

### ❌ Port Already in Use

**Error**: `Port 4000 already in use`

**Solution**:
```bash
# Option 1: Change port
export PORT=4001
npm run dev:backend

# Option 2: Kill existing process
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:4000 | xargs kill -9
```

### ❌ Frontend Cannot Connect to Backend

**Error**: Network errors in browser console

**Solution**:
```bash
# Check backend is running
curl http://localhost:4000/health

# Verify VITE_API_URL in frontend/.env
# Should be: VITE_API_URL=http://localhost:4000/api

# Restart frontend
cd frontend
npm run dev
```

## 🐳 Docker Quick Reference

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart a service
docker-compose restart backend

# Stop all services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# View running containers
docker-compose ps
```

## 📊 Using the Dashboard

### Main Dashboard

- **Node Cards**: Display each configured oracle node
  - Address (truncated, full address shown on hover)
  - Oracle pair as badge
  - Current balance with threshold warning if applicable
  - Lifetime received/spent totals
  - "View Details" button for in-depth analysis

- **Reward Card**: Shows reward address token balance
  - Token quantity
  - Current price from CoinGecko
  - Total value in USD

- **Auto-Refresh**: Data refreshes automatically every 30 seconds

### Node Detail Page

- **Balance Overview**: Current, received, and spent totals
- **Date Range Filter**: Select custom time window for analysis
- **Transaction Statistics**: Count, total received, total spent
- **Transaction Chart**: Visual representation of transaction volume
- **Transaction Table**: Detailed transaction list with:
  - Transaction hash
  - Date and time
  - Amount in ADA

### Navigation

- Click node address to go to detail page
- Click "Back to Dashboard" to return
- Browser back/forward buttons work as expected

## 🔐 Security Notes

1. **API Keys**: Never commit `backend/config.yaml` to version control (already in .gitignore)
2. **Database**: Use read-only database credentials if possible
3. **Production**: 
   - Use HTTPS with reverse proxy
   - Change default ports
   - Use strong API keys (32+ characters)
   - Restrict CORS origins in production

## 📚 Next Steps

1. **Customize Configuration**
   - Add all your oracle node addresses
   - Set appropriate Ada threshold for your needs
   - Configure multiple API keys for different users

2. **Production Deployment**
   - See `SETUP.md` for detailed production deployment guide
   - Configure SSL/TLS certificates
   - Set up monitoring and alerting
   - Regular backups of configuration

3. **Extend Functionality**
   - The codebase is modular and easy to extend
   - Add custom price providers
   - Add new metrics to dashboard
   - Customize UI theme

## 🆘 Getting Help

If you encounter issues:

1. Check `SETUP.md` for detailed troubleshooting
2. Review `PROJECT_SUMMARY.md` for architecture overview
3. Check logs:
   ```bash
   # Backend logs (development)
   npm run dev:backend
   
   # Docker logs
   docker-compose logs backend
   docker-compose logs frontend
   ```

## 📞 Support

For Charli3-specific oracle configuration and setup, refer to Charli3 documentation.

---

**Ready to monitor your oracle nodes!** 🎉

