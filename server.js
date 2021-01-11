require("dotenv").config();
const express = require("express");
const http = require("http");
const compression = require("compression");
const cors = require("cors");
const fetch = require("node-fetch");

const MS_PER = process.env.MS_PER
  ? Math.max(parseInt(process.env.MS_PER, 10), 200)
  : 1000;
const MAX_REQUESTS = process.env.MAX_REQUESTS
  ? Math.min(parseInt(process.env.MAX_REQUESTS, 10), 100)
  : 50;
const PORT = process.env.PORT || 23286;

const limit = {
  counter: 0,
  lastUpdate: Date.now(),
};

const rateLimited = () => {
  const { counter, lastUpdate } = limit;
  const now = Date.now();
  const elapsed = now - lastUpdate;
  const reduced = Math.floor(elapsed / MS_PER);
  const newCounter = Math.max(counter - reduced, 0);
  if (newCounter < MAX_REQUESTS) {
    limit.counter = newCounter + 1;
    limit.lastUpdate = now;
    return false;
  }
  return true;
};

const app = express();
const server = http.createServer(app);

app.use(compression());
app.use(express.json());
app.use(cors());

app.post("/", async (req, res, _next) => {
  if (rateLimited()) {
    res.set({
      "access-control-expose-headers": "X-Ms-Per-Request",
      "X-Ms-Per-Request": MS_PER,
    });
    res.statusMessage = "Too many requests";
    res.status(429).end();
    return;
  }

  try {
    const { url, options } = req.body;

    const res2 = await fetch(url, options);

    if (!res2.ok) {
      console.log("res2", res2);
      console.log("text", await res2.text());
      res.status(res2.status);
      res.send(await res2.text());
      return;
    }

    const contentType = res2.headers.get("content-type");
    const contentLength = res2.headers.get("content-length");
    if (contentType === "application/json" && contentLength > 0) {
      res.json(await res2.json());
      return;
    } else {
      res.send(await res2.text());
    }
  } catch (e) {
    res.statusMessage = e.message;
    res.status(500).end();
  }
});

server.listen(PORT, () => {
  console.log(`${new Date()} Website server listening on ${PORT}.`);
});
