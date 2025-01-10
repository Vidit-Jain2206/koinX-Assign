// src/schedules/priceHistoryScheduler.ts
import cron from "node-cron";
import axios from "axios";
import { client, getDb } from "../config/connection";
import { ClientSession, Db, Document } from "mongodb";
import { APIERROR } from "../utils/apiError";

type CoinData = {
  coin_id: string;
  coin_name: string;
  price: number;
  marketCap: number;
  "24hChange": number;
  timestamp: Date;
};

const coinGeckoURl: string = process.env.COIN_GECKO_URL || "";
const coinGeckoApiKey: string = process.env.COIN_GECKO_API_KEY || "";

const validateCoinGeckoCred = () => {
  if (coinGeckoURl === "") throw new Error("Please specify coin gecko URL");
  if (coinGeckoApiKey === "")
    throw new Error("Please specify coin gecko API key");
};

const fetchCoinPrice = async (coinId: string): Promise<any> => {
  validateCoinGeckoCred();
  const url = `${coinGeckoURl}/markets?vs_currency=usd&ids=${coinId}`;

  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-cg-demo-api-key": coinGeckoApiKey,
    },
  };
  try {
    const { data } = await axios.get(url, options);
    if (data.length === 0) {
      return null;
    }
    return {
      price: data[0].current_price,
      marketCap: data[0].market_cap,
      twentyFourHourChange: data[0].price_change_24h,
    };
  } catch (error) {
    throw new APIERROR("Failed to fetch coin price", 500);
  }
};

const fetchCoinPriceInInterval = async (
  coinId: string,
  start: number,
  end: number
): Promise<any> => {
  validateCoinGeckoCred();
  const url = `${coinGeckoURl}/${coinId}/market_chart/range?vs_currency=usd&from=${Math.floor(
    start / 1000
  )}&to=${Math.floor(end / 1000)}`;
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-cg-demo-api-key": coinGeckoApiKey,
    },
  };

  try {
    const { data } = await axios.get(url, options);
    if (
      data.prices.length === 0 ||
      data.market_caps.length === 0 ||
      data.total_volumes.length === 0
    ) {
      return null;
    }
    return {
      price: data.prices[0][1],
      marketCap: data.market_caps[0][1],
      twentyFourHourChange: 0,
    };
  } catch (error) {}
};

/*
  I have used setInterval for maintaining the interval of 2 hours.
  Let's suppose I run my server at time :- 04:45:89 (hh:mm:s) it will fetch the data for this time and store it in the database.
  after that next request will go at time :- 06:45:89 (hh:mm:s) and so on.

  if I use node-cron, we will not getting the actual data 
  let's suppose I run my server at time :- 04:45:89 (hh:mm:s) it will fetch the data for this time and store it in the database.
  it will activate my cron job at 06:00:00 (hh:mm:s) and so on. so it will fetch the data of 06:00:00 (time) instead of 06:45:89

  So, I have used setInterval for maintaining the interval of 2 hours.
*/

export const startPriceHistoryScheduler = async () => {
  const now = Date.now();
  console.log("Running for the first time...", new Date(now));
  await updatePriceHistory(now);

  setInterval(async () => {
    // runs every 2 hours
    try {
      const time = Date.now();
      console.log("Running scheduled price history update...", new Date(time));
      await updatePriceHistory(time);
    } catch (error) {
      console.error("Error running price history update:", error);
    }
  }, 2 * 60 * 60 * 1000);
};

const updatePriceHistory = async (now: number) => {
  try {
    const db: Db = getDb();
    const coins = await db.collection("coins").find().toArray();
    const coinLastMetaData = await db.collection("coin_metadata").findOne(
      { job: "coindata" },
      {
        sort: { timestamp: -1 },
      }
    );
    let lastExecutionTime: number =
      coinLastMetaData?.timestamp.getTime() || now - 2 * 60 * 60 * 1000;

    // case:1 -> last updated data is at more than 2 hours
    // case:2 -> last updated data is at less or equal than 2 hours

    const timeDifference = Math.floor((now - lastExecutionTime) / 1000);
    console.log(timeDifference);
    if (timeDifference < 2 * 60 * 60) {
      //last fetched data is within 2 hours
      return;
    } else if (timeDifference === 2 * 60 * 60) {
      // ideal condition fetch the current data
      await updatePriceHistoryCurrent(coins, db, now);
    } else {
      // we need to fetch the missed intervals
      let start: number =
        coinLastMetaData?.timestamp.getTime() + 2 * 60 * 60 * 1000;
      const end: number = Date.now();

      while (start < end) {
        await updatePriceHistoryInInterval(coins, db, start);
        start += 2 * 60 * 60 * 1000;
      }

      if (start === end) {
        await updatePriceHistoryCurrent(coins, db, end);
      }
    }
  } catch (error: any) {
    throw new APIERROR(error.message, 500);
  }
};

const updatePriceHistoryCurrent = async (
  coins: Document[],
  db: Db,
  time: number
) => {
  try {
    const priceHistory: CoinData[] = [];

    for (const coin of coins) {
      const price: {
        price: number;
        marketCap: number;
        twentyFourHourChange: number;
      } = await fetchCoinPrice(coin.coin_id);

      if (price === null) {
        continue;
      }
      priceHistory.push({
        coin_id: coin.coin_id,
        coin_name: coin.coin_name,
        price: price.price,
        marketCap: price.marketCap,
        "24hChange": price.twentyFourHourChange,
        timestamp: new Date(),
      });
    }
    const session: ClientSession = client.startSession();

    try {
      session.withTransaction(async () => {
        await db.collection("price_history").insertMany(priceHistory);
        await db.collection("coin_metadata").insertOne({
          job: "coindata",
          timestamp: new Date(time),
        });
      });
      console.log("coindata updated");
    } finally {
      await session.endSession();
    }
  } catch (error: any) {
    throw new APIERROR(error.message, 500);
  }
};

const updatePriceHistoryInInterval = async (
  coins: Document[],
  db: Db,
  start: number
) => {
  try {
    const coinPrices: CoinData[] = [];
    for (const coin of coins) {
      const price: {
        price: number;
        marketCap: number;
        twentyFourHourChange: number;
      } = await fetchCoinPriceInInterval(
        coin.coin_id,
        start,
        start + 2 * 60 * 60 * 1000
      );

      if (price === null) {
        continue;
      }
      coinPrices.push({
        coin_id: coin.coin_id,
        coin_name: coin.coin_name,
        price: price.price,
        marketCap: price.marketCap,
        "24hChange": price.twentyFourHourChange,
        timestamp: new Date(start),
      });
    }
    const session: ClientSession = client.startSession();

    try {
      session.withTransaction(async () => {
        if (coinPrices.length > 0) {
          await db.collection("price_history").insertMany(coinPrices);
        }
        await db.collection("coin_metadata").insertOne({
          job: "coindata",
          timestamp: new Date(start),
        });
      });
      console.log("coindata updated");
    } finally {
      await session.endSession();
    }
  } catch (error: any) {
    throw new APIERROR(error.message, 500);
  }
};
