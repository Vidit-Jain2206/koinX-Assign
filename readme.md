# Cryptocurrency Tracker

This project implements a cryptocurrency tracker with the following features:

- A background job to fetch the current price, market cap, and 24-hour change for Bitcoin, Matic, and Ethereum from the CoinGecko API.
- An API to retrieve the latest statistics for a specific cryptocurrency.
- An API to calculate the standard deviation of the price for the last 100 records of a specified cryptocurrency.

---

## Features

### Task 1: Background Job

The background job runs every 2 hours to fetch data for the following cryptocurrencies:
- Bitcoin (ID: `bitcoin`)
- Matic (ID: `matic-network`)
- Ethereum (ID: `ethereum`)

It fetches:
- **Current Price in USD**
- **Market Cap in USD**
- **24-hour Price Change (%)**

The job stores this data in a database for further analysis.

---

### Task 2: Cryptocurrency Statistics API

**Endpoint**: `/api/v1/stats`  
**Method**: `GET`  
**Query Parameters**:
```json
{
  "coin": "bitcoin"  // Accepted values: `bitcoin`, `matic-network`, `ethereum`
}
```

### Task 3: Cryptocurrency Deviation API

**Endpoint**: `/api/v1/deviation`  
**Method**: `GET`  
**Query Parameters**:
```json
{
  "coin": "bitcoin"  // Accepted values: `bitcoin`, `matic-network`, `ethereum`
}
```

## How to Run

1. **Clone the repository**:  
   ```bash
   git clone {githubUrl}
   cd koinX_Assign
   ```
2. **Install dependencies**:
   ```bash
   npm install 
   ```
3. **Add env variables**:
   ```env
    COINGECKO_API_URL=
    COINGECKO_API_KEY=
    DATABASE_URL=
    ```
4. **Run the application**:
   ```bash
   npm run start
   ```
5. **Access the apis**:
   ``` 
    GET /api/v1/stats?coin=bitcoin
    GET /api/v1/deviation?coin=bitcoin
   ```

