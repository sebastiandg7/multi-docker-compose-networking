# Multi Docker Compose Networking

This repo demonstrates how services running in different docker-compose configs, attached to the same docker network, can communicate with each other while exposing required ports to the host machine.

This configuration can serve as an example to run backend services in a docker-compose file & SSR web applications in a separate docker-compose file.

## Prerequisites

1. Docker & Docker Compose.

2. Create the `multi-compose-net` docker network (`bridge` mode)

```bash
docker network create multi-compose-net
``` 

## Running the services


| - | Server | Client|
| - | - | - |
| **Build** | `docker compose -f server/docker-compose.yml build` | `docker compose -f client/docker-compose.yml build` |
| **Start** | `docker compose -f server/docker-compose.yml up` | `docker compose -f client/docker-compose.yml up` |

You should get an output similar to:

Server
```bash
➜ docker compose -f server/docker-compose.yml up
[+] Running 1/0
 ✔ Container demo-backend-server-api-1  Created                            0.0s 
Attaching to demo-backend-server-api-1
demo-backend-server-api-1  | [ ready ] on http://0.0.0.0:8080
demo-backend-server-api-1  | [ request ] GET /FjsY9bH3ad
demo-backend-server-api-1  | [ response ] 200 { msg: 'Hello World FjsY9bH3ad' }
demo-backend-server-api-1  | [ request ] GET /mr8mU2LDEI
demo-backend-server-api-1  | [ response ] 200 { msg: 'Hello World mr8mU2LDEI' }
```

Client
```bash
➜ docker compose -f client/docker-compose.yml up
[+] Running 1/0
 ✔ Container demo-frontend-client-1  Created                                               0.0s 
Attaching to demo-frontend-client-1
demo-frontend-client-1  | [ client ] Sending GET to http://demo-server-api:8080/FjsY9bH3ad ...
demo-frontend-client-1  | [ client ] Response - FjsY9bH3ad: { msg: 'Hello World FjsY9bH3ad' }
demo-frontend-client-1  | [ client ] Waiting 10s for next request...
demo-frontend-client-1  | [ client ] Sending GET to http://demo-server-api:8080/mr8mU2LDEI ...
demo-frontend-client-1  | [ client ] Response - mr8mU2LDEI: { msg: 'Hello World mr8mU2LDEI' }
demo-frontend-client-1  | [ client ] Waiting 10s for next request...
```

## How it works?

<details>
<summary>Click to expand</summary>

Both server and client `docker-compose.yml` add their services to the `multi-compose-net` network.

```yml
version: '3.8'

services:
#   blablabla:

networks:
default:
    name: multi-compose-net
    external: true
```

(optional) The server `docker-compose.yml` sets an explicit hostname for the api service.

```diff
version: '3.8'

services:
server-api:
+   hostname: demo-server-api
    build:
    context: ./
    dockerfile: Dockerfile
    ports:
    - 8080:8080
    environment:
    - PORT=8080
    - HOST=0.0.0.0
    - NODE_ENV=production
    command: ['node', 'server.mjs']

networks:
    # blabla
```

The client `docker-compose.yml`, via an environment variable,sets the exact same hostname in the target URL to send the requests to.

```diff
version: '3.8'

services:
client:
    build:
    context: ./
    dockerfile: Dockerfile
    environment:
+     - API_BASE_URL=http://demo-server-api:8080
    - REQUEST_INTERVAL=10000
    command: ['node', 'client.mjs']

networks:
    # blabla
```

When the services are running, you can check all of them are attached to the same network.

```bash
docker network inspect multi-compose-net
```

Output:
```diff
[
    {
        "Name": "multi-compose-net",
        "Id": "b7906ffe264c6fda784cdd161b03c8c0b49dad1ac2c79c3305c0b9794febd78a",
        "Created": "2023-09-08T03:31:38.911731353Z",
        "Scope": "local",
        "Driver": "bridge",
        "EnableIPv6": false,
        "IPAM": {
            "Driver": "default",
            "Options": {},
            "Config": [
                {
                    "Subnet": "172.20.0.0/16",
                    "Gateway": "172.20.0.1"
                }
            ]
        },
        "Internal": false,
        "Attachable": false,
        "Ingress": false,
        "ConfigFrom": {
            "Network": ""
        },
        "ConfigOnly": false,
+       "Containers": {
+           "7ff1878e7596ddba148dee2a495cda5964371b9e70344baffad875d7e205258e": {
+               "Name": "demo-frontend-client-1",
+               "EndpointID": "01f0e5fc3c82c696ef38188e10bf08236504a4ca5e5c909836f8a62d6fdf5038",
+               "MacAddress": "02:42:ac:14:00:03",
+               "IPv4Address": "172.20.0.3/16",
+               "IPv6Address": ""
+           },
+           "8d0090974c1a497aa50618cb0b00fa1bd198d646ef9ec6b2cf06bb7bea241aa1": {
+               "Name": "demo-backend-server-api-1",
+               "EndpointID": "cff9ed426db97df95f7eedcf64076f849676d3d1fed30c404b80d3cb84aa38fc",
+               "MacAddress": "02:42:ac:14:00:02",
+               "IPv4Address": "172.20.0.2/16",
+               "IPv6Address": ""
+           }
+       },
        "Options": {},
        "Labels": {}
    }
]
```

That is what makes the communication possible.
</details>

## What about the web browser side of the SSR web app?

If you happen to be sending requests to the API from the browser side, the host machine won't be able to solve the hostname in `http://demo-server-api:8080`.

To solve this problem, your SSR app can be aware of two URLs for the same API service. One for the SSR runtime and other one for the web browser runtime.

```diff
version: '3.8'

services:
client:
    build:
    context: ./
    dockerfile: Dockerfile
    environment:
+     - API_BASE_URL_SSR=http://demo-server-api:8080
+     - API_BASE_URL_BROWSER=http://localhost:8080
    - REQUEST_INTERVAL=10000
    command: ['node', 'client.mjs']

networks:
    # blabla
```

For this to work, make sure the `server-api` configuration uses the [ports](https://docs.docker.com/compose/compose-file/compose-file-v3/#ports) options instead of the [expose](https://docs.docker.com/compose/compose-file/compose-file-v3/#expose) one, this will expose ports to the docker network and also map them to the host machine.

With this config and the proper application code changes, requests sent from the SSR container will resolve to the right IP inside the docker network and requests sent from the web browser (to `localhost`) will also reach the desired `server-api` container.

## License

This project is licensed under the **MIT License**.

See [**LICENSE**](LICENSE) for more information.
