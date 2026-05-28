import ngrok from "@expo/ngrok";

async function run() {
  const runId = process.env.DEBUG_RUN_ID || "pre-fix";

  // #region agent log
  fetch("http://127.0.0.1:7628/ingest/ea2c8fea-a9dd-41e7-8022-0660e1d4b349", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "113479" },
    body: JSON.stringify({ sessionId: "113479", runId, hypothesisId: "H1", location: "mobile/scripts/debug-ngrok-tunnel.mjs:8", message: "debug_start", data: { node: process.version, cwd: process.cwd() }, timestamp: Date.now() })
  }).catch(() => {});
  // #endregion

  try {
    const pingStart = Date.now();
    await fetch("https://tunnel.us.ngrok.com", { method: "HEAD" });
    // #region agent log
    fetch("http://127.0.0.1:7628/ingest/ea2c8fea-a9dd-41e7-8022-0660e1d4b349", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "113479" },
      body: JSON.stringify({ sessionId: "113479", runId, hypothesisId: "H2", location: "mobile/scripts/debug-ngrok-tunnel.mjs:20", message: "ngrok_cloud_head_ok", data: { ms: Date.now() - pingStart }, timestamp: Date.now() })
    }).catch(() => {});
    // #endregion
  } catch (e) {
    // #region agent log
    fetch("http://127.0.0.1:7628/ingest/ea2c8fea-a9dd-41e7-8022-0660e1d4b349", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "113479" },
      body: JSON.stringify({ sessionId: "113479", runId, hypothesisId: "H2", location: "mobile/scripts/debug-ngrok-tunnel.mjs:29", message: "ngrok_cloud_head_fail", data: { error: String(e?.message || e) }, timestamp: Date.now() })
    }).catch(() => {});
    // #endregion
  }

  try {
    const v = await ngrok.getVersion();
    // #region agent log
    fetch("http://127.0.0.1:7628/ingest/ea2c8fea-a9dd-41e7-8022-0660e1d4b349", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "113479" },
      body: JSON.stringify({ sessionId: "113479", runId, hypothesisId: "H3", location: "mobile/scripts/debug-ngrok-tunnel.mjs:42", message: "ngrok_binary_ok", data: { version: v }, timestamp: Date.now() })
    }).catch(() => {});
    // #endregion
  } catch (e) {
    // #region agent log
    fetch("http://127.0.0.1:7628/ingest/ea2c8fea-a9dd-41e7-8022-0660e1d4b349", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "113479" },
      body: JSON.stringify({ sessionId: "113479", runId, hypothesisId: "H3", location: "mobile/scripts/debug-ngrok-tunnel.mjs:51", message: "ngrok_binary_fail", data: { error: String(e?.message || e) }, timestamp: Date.now() })
    }).catch(() => {});
    // #endregion
  }

  try {
    const start = Date.now();
    await Promise.race([
      ngrok.connect({ port: 8081 }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("connect_timeout_20s")), 20000))
    ]);
    // #region agent log
    fetch("http://127.0.0.1:7628/ingest/ea2c8fea-a9dd-41e7-8022-0660e1d4b349", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "113479" },
      body: JSON.stringify({ sessionId: "113479", runId, hypothesisId: "H4", location: "mobile/scripts/debug-ngrok-tunnel.mjs:67", message: "ngrok_connect_ok", data: { ms: Date.now() - start }, timestamp: Date.now() })
    }).catch(() => {});
    // #endregion
  } catch (e) {
    // #region agent log
    fetch("http://127.0.0.1:7628/ingest/ea2c8fea-a9dd-41e7-8022-0660e1d4b349", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "113479" },
      body: JSON.stringify({ sessionId: "113479", runId, hypothesisId: "H4", location: "mobile/scripts/debug-ngrok-tunnel.mjs:76", message: "ngrok_connect_fail", data: { error: String(e?.message || e) }, timestamp: Date.now() })
    }).catch(() => {});
    // #endregion
  } finally {
    try { await ngrok.kill(); } catch {}
  }

  try {
    const metro = await fetch("http://127.0.0.1:8081");
    // #region agent log
    fetch("http://127.0.0.1:7628/ingest/ea2c8fea-a9dd-41e7-8022-0660e1d4b349", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "113479" },
      body: JSON.stringify({ sessionId: "113479", runId, hypothesisId: "H5", location: "mobile/scripts/debug-ngrok-tunnel.mjs:91", message: "metro_probe_ok", data: { status: metro.status }, timestamp: Date.now() })
    }).catch(() => {});
    // #endregion
  } catch (e) {
    // #region agent log
    fetch("http://127.0.0.1:7628/ingest/ea2c8fea-a9dd-41e7-8022-0660e1d4b349", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "113479" },
      body: JSON.stringify({ sessionId: "113479", runId, hypothesisId: "H5", location: "mobile/scripts/debug-ngrok-tunnel.mjs:100", message: "metro_probe_fail", data: { error: String(e?.message || e) }, timestamp: Date.now() })
    }).catch(() => {});
    // #endregion
  }
}

run().catch(() => {});
