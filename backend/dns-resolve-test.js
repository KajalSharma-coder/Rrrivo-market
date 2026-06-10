const dns = require("dns").promises;
(async () => {
  try {
    const res = await dns.resolveSrv(
      "_mongodb._tcp.cluster0.gn6gc7k.mongodb.net",
    );
    console.log("resolveSrv result:", res);
  } catch (err) {
    console.error("resolveSrv error:", err);
  }
})();
