#!node
const http = require("http");
const { exec } = require("child_process");
const PORT = process.env.WEBHOOK_PORT || 4174;
const SECRET = process.env.WEBHOOK_SECRET || "ar-match-deploy-2026";

http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/deploy") {
    let body = "";
    req.on("data", d => body += d);
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        if (data.secret !== SECRET) {
          res.writeHead(403); return res.end("bad secret");
        }
        console.log("Deploy triggered:", new Date().toISOString());
        exec("bash ./scripts/deploy.sh", (err, stdout, stderr) => {
          console.log(stdout || stderr || "ok");
        });
        res.writeHead(200); res.end("deploying...");
      } catch(e) {
        res.writeHead(400); res.end("bad request");
      }
    });
  } else {
    res.writeHead(200, {"Content-Type":"text/plain"});
    res.end("AR Match Catch webhook OK");
  }
}).listen(PORT, "0.0.0.0", () => console.log("Webhook on :" + PORT));
