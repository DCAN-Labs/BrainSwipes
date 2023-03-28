const http = require('node:http');

function main() {
    const dataset = process.argv[2];
    const hostname = process.argv[3];
    const port = process.argv[4];

    if (dataset && hostname && port) {
        const postData = JSON.stringify({
            'dataset': dataset,
          });
          const options = {
            hostname,
            port,
            path: '/s3List',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData),
            },
          };
          const req = http.request(options, (res) => {
            console.log(`STATUS: ${res.statusCode}`);
            console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
              console.log(`BODY: ${chunk}`);
            });
            res.on('end', () => {
              console.log('No more data in response.');
            });
          });
          
          req.on('error', (e) => {
            console.error(`problem with request: ${e.message}`);
          });
          
          // Write data to request body
          req.write(postData);
          req.end();
    } else {
        console.log("Required argument missing.\nExample command: node s32firebase.js dataset hostname port");
    }
}

main();