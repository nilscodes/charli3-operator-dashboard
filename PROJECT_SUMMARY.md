# Charli3 Oracle Dashboard - Project Summary

## Overview

A complete TypeScript-based dashboard application for monitoring Charli3 oracle nodes, built with:
- **Backend**: Express.js (TypeScript, ESM) with PostgreSQL (Cardano DB Sync)
- **Frontend**: React 18 (TypeScript) with Chakra UI
- **Infrastructure**: Docker & Docker Compose support

## ✅ Implementation Complete

All planned features have been implemented according to the specification:

### Backend Features ✓
- ✅ Express server with TypeScript and ESM modules (`.js` import extensions)
- ✅ PostgreSQL database service for Cardano DB Sync v13.6.0.5
- ✅ YAML configuration file with validation
- ✅ API key authentication middleware
- ✅ Helmet and CORS security
- ✅ DTO validation with class-validator and class-transformer
- ✅ Price service interface with CoinGecko implementation
- ✅ RESTful API endpoints for nodes, balances, transactions, and rewards
- ✅ Comprehensive error handling

### Frontend Features ✓
- ✅ React 18 with TypeScript
- ✅ Chakra UI components
- ✅ API key authentication flow with modal
- ✅ Session storage for API keys
- ✅ Dashboard page with:
  - Node cards showing address, pair, and balances
  - Balance threshold alerts
  - Lifetime received/spent statistics
  - Reward address token balance and price
- ✅ Detailed node analysis page with:
  - Transaction history table
  - Time range filters
  - Transaction statistics
  - Recharts visualization
- ✅ React Router with protected routes
- ✅ Responsive layout

### Database Queries ✓
All queries implemented according to Cardano DB Sync schema:
- ✅ Current balance (unspent UTxOs)
- ✅ Lifetime received (all tx_out for address)
- ✅ Lifetime spent (consumed tx_out)
- ✅ Token balance (multi-asset with policy filter)
- ✅ Transaction history with date filtering
- ✅ Transaction statistics

### Infrastructure ✓
- ✅ Docker support for both frontend and backend
- ✅ docker-compose.yml with volume mount for config
- ✅ ESM module configuration
- ✅ TypeScript path aliases
- ✅ Environment variable support
- ✅ Multi-stage Docker builds
- ✅ Nginx for frontend production serving

## Project Structure

```
charli3-dashboard/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── loader.ts              # YAML config loader
│   │   ├── dto/
│   │   │   ├── AddressParamDto.ts     # Address validation
│   │   │   └── TransactionHistoryQueryDto.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts                # API key authentication
│   │   │   └── validation.ts          # DTO validation middleware
│   │   ├── routes/
│   │   │   ├── nodes.ts               # Node endpoints
│   │   │   └── reward.ts              # Reward endpoints
│   │   ├── services/
│   │   │   ├── database.ts            # PostgreSQL service
│   │   │   └── priceService.ts        # Price service interface
│   │   ├── types/
│   │   │   ├── config.ts              # Config types
│   │   │   └── database.ts            # Database types
│   │   └── index.ts                   # Application entry
│   ├── config.example.yaml            # Example configuration
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ApiKeyModal.tsx        # Auth modal
│   │   │   ├── NodeCard.tsx           # Node display card
│   │   │   └── RewardCard.tsx         # Reward display card
│   │   ├── hooks/
│   │   │   ├── useAuth.ts             # Auth hook
│   │   │   └── useQuery.ts            # Data fetching hook
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx          # Main dashboard
│   │   │   └── NodeDetail.tsx         # Detail analysis page
│   │   ├── services/
│   │   │   └── api.ts                 # API client
│   │   ├── types/
│   │   │   └── api.ts                 # API types
│   │   ├── utils/
│   │   │   └── format.ts              # Formatting utilities
│   │   ├── App.tsx                    # Root component
│   │   ├── main.tsx                   # Entry point
│   │   └── vite-env.d.ts             # Vite types
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── docker-compose.yml                 # Docker orchestration
├── package.json                       # Workspace root
├── .gitignore
├── .prettierrc
├── README.md                          # Main documentation
├── SETUP.md                           # Setup guide
└── PROJECT_SUMMARY.md                 # This file
```

## Key Technologies

### Backend Stack
- **Express.js 4.18** - Web framework
- **TypeScript 5.3** with ESNext/NodeNext modules
- **pg 8.11** - PostgreSQL client
- **js-yaml 4.1** - YAML configuration
- **class-validator 0.14** - DTO validation
- **class-transformer 0.5** - Object transformation
- **helmet 7.1** - Security headers
- **cors 2.8** - CORS middleware
- **axios 1.6** - HTTP client for CoinGecko

### Frontend Stack
- **React 18.2** - UI library
- **TypeScript 5.3** - Type safety
- **Chakra UI 2.8** - Component library
- **React Router 6.20** - Routing
- **Recharts 2.10** - Charts
- **Axios 1.6** - HTTP client
- **Vite 5.0** - Build tool
- **date-fns 3.0** - Date utilities

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Frontend production server
- **ESLint** - Code linting
- **Prettier** - Code formatting

## Configuration

The application uses a single `backend/config.yaml` file with:

1. **Database Configuration** - PostgreSQL connection to Cardano DB Sync
2. **API Keys** - List of valid authentication keys
3. **Ada Threshold** - Minimum balance alert threshold (lovelace)
4. **Node Configurations** - List of addresses with oracle pair
5. **Reward Address** - Token balance monitoring
6. **Token Policy** - Policy ID for token tracking
7. **Price Provider** - CoinGecko configuration

See `backend/config.example.yaml` for detailed structure and examples.

## API Endpoints

All endpoints require `X-API-Key` header authentication.

### Node Management
- `GET /api/nodes` - List all configured nodes with balances
- `GET /api/nodes/:address/balance` - Get detailed balance info
- `GET /api/nodes/:address/transactions` - Get transaction history (with date filters)

### Reward Tracking
- `GET /api/reward/balance` - Get token balance for reward address
- `GET /api/reward/price` - Get current token price from CoinGecko

### System
- `GET /health` - Health check (no auth required)

## Database Schema Support

The application correctly queries Cardano DB Sync v13.6.0.5 schema:

- **tx_out** - Transaction outputs (with consumed_by_tx_id tracking)
- **tx** - Transactions
- **block** - Block data with timestamps
- **multi_asset** - Native asset definitions
- **ma_tx_out** - Multi-asset transaction outputs

All queries use proper parameterization to prevent SQL injection.

## Security Features

1. **API Key Authentication** - Required for all API endpoints
2. **Helmet Middleware** - HTTP security headers
3. **CORS Configuration** - Cross-origin resource sharing control
4. **DTO Validation** - Input validation with class-validator
5. **Parameterized Queries** - SQL injection prevention
6. **Session Storage** - API keys stored securely in browser session

## Getting Started

### Quick Start (Development)

```bash
# 1. Install dependencies
npm install --workspaces

# 2. Configure application
cp backend/config.example.yaml backend/config.yaml
# Edit backend/config.yaml with your settings

# 3. Run development servers
npm run dev:backend  # Terminal 1
npm run dev:frontend # Terminal 2

# 4. Access dashboard
# Open http://localhost:3000
```

### Docker Deployment

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

See `SETUP.md` for detailed setup instructions and troubleshooting.

## Future Extensibility

The architecture supports easy extension:

### Price Providers
Add new price providers by implementing `IPriceService`:
```typescript
class CustomPriceService implements IPriceService {
  async getPrice(tokenId: string): Promise<number> {
    // Custom implementation
  }
}
```

### Oracle Pair Metadata
The configuration can be extended to include:
- Display names
- Base/quote asset information
- Links to public oracle dashboards
- Additional metadata

### Additional Metrics
The detail page can easily add:
- More chart types
- Different time aggregations
- Advanced filtering
- Export functionality

## Validation & Testing

The application includes:
- TypeScript strict mode for compile-time type safety
- DTO validation for runtime input validation
- ESLint configuration for code quality
- Proper error handling and logging

## Development Notes

### ESM Modules
The backend uses ESM with:
- All imports include `.js` extensions
- `"type": "module"` in package.json
- TypeScript `module: "nodenext"`

### Path Aliases
Backend uses TypeScript path aliases:
- `@config/*` → `src/config/*`
- `@middleware/*` → `src/middleware/*`
- `@services/*` → `src/services/*`
- `@routes/*` → `src/routes/*`
- `@dto/*` → `src/dto/*`
- `@types/*` → `src/types/*`

Frontend uses:
- `@/*` → `src/*`

### Build Process
- Backend: TypeScript compilation with `tsc` + `tsc-alias` for path resolution
- Frontend: Vite bundling with React plugin

## Deployment Considerations

### Production Checklist
- [ ] Update `backend/config.yaml` with production database credentials
- [ ] Generate secure API keys
- [ ] Set production environment variables
- [ ] Configure CORS_ORIGIN for your domain
- [ ] Use reverse proxy (nginx/Apache) for SSL termination
- [ ] Set up monitoring and logging
- [ ] Regular database backups
- [ ] Keep Cardano DB Sync synchronized

### Environment Variables

**Backend:**
- `CONFIG_PATH` - Path to config file (default: `./config.yaml` in backend folder)
- `PORT` - Server port (default: 4000)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Allowed CORS origin

**Frontend:**
- `VITE_API_URL` - Backend API URL (build time)

## License & Usage

This is a private project for Charli3 oracle node monitoring. All rights reserved.

---

**Project Status**: ✅ Complete and ready for deployment

**Last Updated**: December 2025

