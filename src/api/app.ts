import express, { Express, Response, Request } from "express";
import cors from "cors";
import { router } from "./router";
export const app: Express = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/api", router);

app.get("/", (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to the API Server</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          text-align: center;
          padding: 20px;
        }
        h1 {
          color: #333;
        }
        a {
          display: block;
          margin: 10px 0;
          color: #1a73e8;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <h1>Welcome to the API Server</h1>
      <p>Routes:</p>
      <a href="/api/v1/stats?coin=bitcoin">Check recent stats for Bitcoin</a>
      <a href="/api/v1/stats?coin=ethereum">Check recent stats for Ethereum</a>
      <a href="/api/v1/stats?coin=matic-network">Check recent stats for Matic</a>
      <a href="/api/v1/deviation?coin=bitcoin">Get deviation for Bitcoin</a>
      <a href="/api/v1/deviation?coin=ethereum">Get deviation for Ethereum</a>
      <a href="/api/v1/deviation?coin=matic-network">Get deviation for Matic</a>
    </body>
    </html>
  `);
});

app.get("/health", (req: Request, res: Response) => {
  res.send("Server is up and running !!!");
});
