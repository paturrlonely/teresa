import axios from "axios";

async function j2download(url) {

  if (!url) throw new Error("URL is required");

  const ua =

    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36";

  const baseHeaders = {

    authority: "j2download.com",

    "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",

    "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132"',

    "sec-ch-ua-mobile": "?1",

    "sec-ch-ua-platform": '"Android"',

    "user-agent": ua,

  };

  try {

    // 1️⃣ ambil cookie & csrf

    const home = await axios.get("https://j2download.com", {

      headers: {

        ...baseHeaders,

        accept:

          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",

        "sec-fetch-dest": "document",

        "sec-fetch-mode": "navigate",

        "sec-fetch-site": "none",

        "upgrade-insecure-requests": "1",

      },

    });

    const setCookies = home.headers["set-cookie"];

    let cookies = "";

    let csrfToken = "";

    if (setCookies) {

      const cookieArray = [];

      for (const cookie of setCookies) {

        const part = cookie.split(";")[0];

        cookieArray.push(part);

        if (part.startsWith("csrf_token=")) {

          csrfToken = part.split("csrf_token=")[1];

        }

      }

      cookies = cookieArray.join("; ");

    }

    // 2️⃣ request API

    const result = await axios.post(

      "https://j2download.com/api/autolink",

      {

        data: { url, unlock: true },

      },

      {

        headers: {

          ...baseHeaders,

          accept: "application/json, text/plain, */*",

          "content-type": "application/json",

          cookie: cookies,

          origin: "https://j2download.com",

          referer: "https://j2download.com/id",

          "x-csrf-token": csrfToken,

        },

      }

    );

    return result.data;

  } catch (err) {

    throw new Error(err?.response?.data?.message || err.message);

  }

}

export default j2download;