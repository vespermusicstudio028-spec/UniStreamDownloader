

const cobaltInstances = [
  "https://api.qwkuns.me",
  "https://apicobalt.mgytr.top",
  "https://nuko-c.meowing.de",
  "https://cobaltapi.kittycat.boo",
  "https://grapefruit.clxxped.lol",
  "https://cobalt.alpha.wolfy.love",
  "https://api.cobalt.tools",
  "https://cobalt.tools"
];

async function test() {
  const url = "https://www.youtube.com/watch?v=zk4r9LvMTOo";
  for (const instance of cobaltInstances) {
    try {
      const endpoint = instance.endsWith("/api/json") ? instance : `${instance}/`;
      console.log(`Testing: ${endpoint}`);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        body: JSON.stringify({
          url: url,
          videoQuality: "1080",
          downloadMode: "auto",
          filenameStyle: "basic"
        })
      });
      console.log(`Status: ${res.status}`);
      if (res.ok) {
        const json = await res.json();
        console.log("Success data:", json);
      } else {
        const text = await res.text();
        console.log("Error text:", text.substring(0, 200));
      }
    } catch (err: any) {
      console.log(`Error connecting to ${instance}: ${err.message}`);
    }
  }
}

test();
