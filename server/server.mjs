import { createServer } from 'http';

const hostname = process.env.HOST || '0.0.0.0';
const port = process.env.PORT ? parseInt(process.env.PORT) : 8080;

async function main() {
  const server = createServer((req, res) => {
    console.log('[ request ]', req.method, req.url);
    const urlFirstPath = req.url.split('/')[1];
    const resBody = { msg: 'Hello World ' + urlFirstPath };
    res.end(JSON.stringify(resBody));
    console.log('[ response ]', res.statusCode, resBody);
  });

  server.listen(port, hostname);
  console.log(`[ ready ] on http://${hostname}:${port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
