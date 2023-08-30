const http = require('node:http');

function main() {
    const hostname = process.argv[2];
    const port = process.argv[3];

    if (hostname && port) {
      const options = {
        hostname,
        port,
        path: '/firebaseBackup',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      req.write('');
      req.end();
    } else {
        console.log("Required argument missing.\nExample command: node firebaseBackup.js hostname port");
    }
}

main();