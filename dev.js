require("dotenv").config();
const fetch = require("node-fetch");

const PORT = process.env.PORT || 23286;
const FETCH_URL = `http://localhost:${PORT}`;

const fetcher = (url, options) => {
  return fetch(FETCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      options,
    }),
  });
};

const wait = (ms) =>
  new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  });

(async () => {
  for (let n = 0; n < 100; n++) {
    const res = await fetcher("https://example.net", {
      method: "GET",
      mode: "cors",
    });

    if (res.status === 200) {
      if (res.headers.get("content-type") === "application/json") {
        const resJson = await res.json();
        console.log("res.json()", resJson);
      } else {
        const resText = await res.text();
        console.log("res.text()", resText);
      }
    } else {
      console.log("res", res);
      const resText = await res.text();
      console.log("res.text()", resText);
    }
    await wait(50);
  }
})();
