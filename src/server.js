import http from "http";

/**
 * Starts a local HTTP server for the Dev UI.
 * @param {number} port - The port to listen on.
 */
export async function startDevServer(port = 3000) {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<h1>EnvGuard Dev UI</h1><p>Dashboard coming soon...</p>");
  });

  server.listen(port, () => {
    console.log(`\n🚀 [envguard] Dev UI running at http://localhost:${port}`);
    console.log("Press Ctrl+C to stop.\n");
  });
}
