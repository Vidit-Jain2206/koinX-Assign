import { Request, Response } from "express";
import { getDb } from "../../config/connection";
import { Db } from "mongodb";
import { APIERROR } from "../../utils/apiError";

export const addCoins = async (req: Request, res: Response) => {
  try {
    const db: Db = getDb();
    const coins = await db.collection("coins").insertMany([
      {
        coin_name: "BITCOIN",
        coin_id: "bitcoin",
      },
      {
        coin_name: "ETHEREUM",
        coin_id: "ethereum",
      },
      {
        coin_name: "MATICNETWORK",
        coin_id: "matic-network",
      },
    ]);
    res.status(201).json({ message: "Coins added successfully", coins });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
    return;
  }
};

export const getDeviatons = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const db: Db = getDb();
    const { coin } = req.query;

    if (!coin) {
      throw new APIERROR("CoinId is required", 403);
    }

    const prices = await db
      .collection("price_history")
      .aggregate([
        { $match: { coin_id: coin } },
        { $sort: { timestamp: -1 } },
        { $limit: 100 },
        {
          $group: {
            _id: null,
            prices: { $push: "$price" },
            avgPrice: { $avg: "$price" },
          },
        },
        {
          $project: {
            _id: 0,
            avgPrice: 1,
            standardDeviation: {
              $sqrt: {
                $divide: [
                  {
                    $sum: {
                      $map: {
                        input: "$prices",
                        as: "price",
                        in: {
                          $pow: [{ $subtract: ["$$price", "$avgPrice"] }, 2],
                        },
                      },
                    },
                  },
                  { $size: "$prices" },
                ],
              },
            },
          },
        },
      ])
      .toArray();

    if (prices.length === 0) {
      throw new APIERROR(
        "No recent price history found for the specified coin",
        404
      );
    }
    res.status(200).json({
      coin_id: coin,
      avgPrice: prices[0]?.avgPrice,
      standardDeviation: prices[0]?.standardDeviation,
    });
  } catch (error) {
    if (error instanceof APIERROR) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: "Internal Server Error" });
    return;
  }
};

export const getRecentStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { coin } = req.query;
    if (!coin) {
      throw new APIERROR("CoinId is required", 400);
    }
    const db: Db = getDb();
    const recentStats = await db.collection("price_history").findOne(
      { coin_id: coin },
      {
        sort: { timestamp: -1 },
        projection: {
          _id: 0,
          price: 1,
          marketCap: 1,
          "24hChange": 1,
          timestamp: 1,
        },
      }
    );
    if (!recentStats) {
      throw new APIERROR("No Record found", 400);
    }
    res.status(200).json({
      coin: coin,
      recentStats: recentStats,
    });
  } catch (error) {
    if (error instanceof APIERROR) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: "Internal Server Error" });
    return;
  }
};
