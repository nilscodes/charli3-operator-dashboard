# Charli3 Oracle Dashboard

A TypeScript-based dashboard application for monitoring Charli3 oracle node addresses, Ada balances, transaction history, and token balances.

## Features

- **Node Monitoring**: Track multiple oracle node addresses and their Ada balances
- **Balance Alerts**: Visual alerts when balances fall below configured thresholds
- **Transaction History**: View detailed transaction history with time-based filtering
- **Token Balance Tracking**: Monitor reward address token balances
- **Price Integration**: CoinGecko integration for token price tracking
- **Secure API**: API key authentication for all endpoints
- **Docker Support**: Full Docker and docker-compose setup

## Tech Stack

### Backend
- Express.js with TypeScript
- PostgreSQL (Cardano DB Sync)
- ESM modules with `.js` import extensions
- Helmet & CORS for security
- DTO validation with class-validator
- YAML configuration

### Frontend
- React 18 with TypeScript
- Chakra UI
- React Router
- Recharts for data visualization
- Axios for API calls
- Vite build tool

## Prerequisites

- Node.js 20+
- PostgreSQL with Cardano DB Sync v13.6.0.5
- Docker & Docker Compose (for containerized deployment)

## Configuration

Create a `config.yaml` file in the backend folder (see `backend/config.example.yaml` for structure):

```yaml
database:
  host: localhost
  port: 5432
  database: cardano
  user: your_user
  password: your_password

apiKeys:
  - your-api-key-1
  - your-api-key-2

adaThreshold: 100000000  # 100 ADA in lovelace

nodes:
  - address: addr1...
    pair: ADA/USD
  - address: addr1...
    pair: BTC/USD

rewardAddress: addr1...
tokenPolicy: a0b1c2d3...

priceProvider:
  type: coingecko
  tokenId: cardano
```

## Installation

### Development Setup

1. Install dependencies:
```bash
npm install
```

2. Install workspace dependencies:
```bash
npm install --workspaces
```

3. Start the backend (development):
```bash
npm run dev:backend
```

4. Start the frontend (development):
```bash
npm run dev:frontend
```

### Production Build

```bash
npm run build
```

### Docker Deployment

1. Build and start services:
```bash
docker-compose up -d
```

2. View logs:
```bash
docker-compose logs -f
```

3. Stop services:
```bash
docker-compose down
```

## API Endpoints

All endpoints require an `X-API-Key` header.

- `GET /api/nodes` - List all nodes with balances
- `GET /api/nodes/:address/balance` - Get detailed balance for a node
- `GET /api/nodes/:address/transactions` - Get transaction history (query params: fromDate, toDate)
- `GET /api/reward/balance` - Get reward address token balance
- `GET /api/reward/price` - Get current token price

## Frontend Routes

- `/` - Dashboard overview
- `/node/:address` - Detailed node analysis page

## Environment Variables

### Backend
- `CONFIG_PATH` - Path to config.yaml file (default: `./config.yaml` in backend folder)
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 4000)

### Frontend
- `VITE_API_URL` - Backend API URL (default: `http://localhost:4000`)

## License

Private - Charli3 Oracle Node Monitoring

