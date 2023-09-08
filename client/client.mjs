import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:8080';
const requestInterval = process.env.REQUEST_INTERVAL
  ? parseInt(process.env.REQUEST_INTERVAL)
  : 5000;

function makeString(length) {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

while (true) {
  try {
    const requestId = makeString(10);
    const requestUrl = `${apiBaseUrl}/${requestId}`;
    console.log(`[ client ] Sending GET to ${requestUrl} ...`);
    const response = await fetch(requestUrl);
    const responseJson = await response.json();
    console.log(`[ client ] Response - ${requestId}:`, responseJson);
  } catch (error) {
    console.error('[ client ] Error:', error);
  }
  console.log(
    `[ client ] Waiting ${requestInterval / 1000}s for next request...`
  );
  await new Promise((resolve) => setTimeout(resolve, requestInterval));
}
