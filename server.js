const http = require("http");
const app = require("./app");
const port = parseInt(process.env.PORT);
const server = http.createServer(app);
server.listen(port);