# Charli3 Dashboard Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v20 or higher
- **npm** or **yarn**
- **PostgreSQL** with Cardano DB Sync v13.6.0.5 installed and synchronized
- **Docker** and **Docker Compose** (for containerized deployment)

## Quick Start

### 1. Clone and Install Dependencies

```bash
# Install root workspace dependencies
npm install

# Install all workspace dependencies (frontend + backend)
npm install --workspaces
```

### 2. Configure the Application

```bash
# Copy the example configuration file to backend folder
cp backend/config.example.yaml backend/config.yaml

# Edit backend/config.yaml with your settings
# - Update database connection details
# - Add your API keys
# - Configure node addresses and pair
# - Set reward address and token policy
```

### 3. Run Development Servers

**Option A: Run both servers separately**

```bash
# Terminal 1: Start backend (port 4000)
npm run dev:backend

# Terminal 2: Start frontend (port 3000)
npm run dev:frontend
```

**Option B: Using Docker Compose**

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Access the Dashboard

Open your browser and navigate to:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000

You'll be prompted to enter an API key from your `backend/config.yaml` file.

## Configuration Details

### Database Setup

The backend connects to a PostgreSQL database running Cardano DB Sync. Update these fields in `backend/config.yaml`:

```yaml
database:
  host: localhost        # Database host
  port: 5432            # Database port
  database: cardano     # Database name
  user: your_user       # Database user
  password: your_pass   # Database password
```

### API Keys

Add one or more API keys that users will use to authenticate:

```yaml
apiKeys:
  - your-secret-key-1
  - your-secret-key-2
```

### Oracle Nodes

Configure the oracle node addresses you want to monitor:

```yaml
nodes:
  - address: addr1qxy...  # Full Cardano address
    pair: ADA/USD
  - address: addr1qab...
    pair: BTC/USD
```

### Ada Threshold

Set the minimum balance threshold (in lovelace). Nodes below this will show warnings:

```yaml
adaThreshold: 100000000  # 100 ADA
```

### Reward Address

Configure the reward address and token to monitor:

```yaml
rewardAddress: addr1qre...
tokenPolicy: a0b1c2d3...  # Hex-encoded policy ID
```

### Price Provider

Configure CoinGecko for token price tracking:

```yaml
priceProvider:
  type: coingecko
  tokenId: cardano  # CoinGecko token ID
  # apiKey: optional_api_key  # For higher rate limits
```

## Development

### Backend Development

The backend uses:
- **ESM modules** with `.js` import extensions
- **TypeScript** with path aliases
- **Express.js** with Helmet and CORS
- **class-validator** for DTO validation

```bash
cd backend
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm run start    # Start production server
```

### Frontend Development

The frontend uses:
- **React 18** with TypeScript
- **Chakra UI** for components
- **Vite** for fast development
- **React Router** for navigation

```bash
cd frontend
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Production Deployment

### Using Docker Compose

1. Update `config.yaml` with production settings
2. Update environment variables in `docker-compose.yml` if needed
3. Deploy:

```bash
docker-compose up -d
```

### Manual Deployment

1. Build both projects:

```bash
npm run build
```

2. Set environment variables:

```bash
# Backend
export NODE_ENV=production
export CONFIG_PATH=/path/to/config.yaml
export PORT=4000
export CORS_ORIGIN=https://your-domain.com

# Frontend (build time)
export VITE_API_URL=https://api.your-domain.com
```

3. Start the backend:

```bash
cd backend
node dist/index.js
```

4. Serve the frontend build:

Use nginx, Apache, or any static file server to serve the `frontend/dist` directory.

## API Endpoints

All endpoints require an `X-API-Key` header.

### Nodes
- `GET /api/nodes` - List all nodes with balances
- `GET /api/nodes/:address/balance` - Get balance for specific address
- `GET /api/nodes/:address/transactions` - Get transaction history
  - Query params: `fromDate` (ISO 8601), `toDate` (ISO 8601)

### Rewards
- `GET /api/reward/balance` - Get reward address token balance
- `GET /api/reward/price` - Get current token price

### Health Check
- `GET /health` - Health check endpoint (no auth required)

## Troubleshooting

### Database Connection Issues

1. Verify PostgreSQL is running and accessible
2. Check that Cardano DB Sync is fully synchronized
3. Verify database credentials in `backend/config.yaml`
4. Test connection: `psql -h HOST -U USER -d DATABASE`

### API Key Authentication Fails

1. Ensure API key is correctly configured in `backend/config.yaml`
2. Check that you're providing the key in the `X-API-Key` header
3. Verify the key matches exactly (no extra spaces)

### Frontend Cannot Connect to Backend

1. Check that backend is running on the correct port
2. Verify `VITE_API_URL` environment variable
3. Check CORS settings in backend
4. Verify API key is stored in sessionStorage

### Docker Issues

1. Ensure backend/config.yaml exists before running docker-compose
2. Check container logs: `docker-compose logs backend`
3. Verify port mappings are not conflicting
4. Rebuild images after code changes: `docker-compose up -d --build`

## License

Private - Charli3 Oracle Node Monitoring

