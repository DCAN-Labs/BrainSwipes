const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const history = require('connect-history-api-fallback');
const app = express();
const port = 3000;
const staticFileMiddleware = express.static(path.join(__dirname + '/public'));
const serverFunctions = require('./src/serverFunctions');

app.use(staticFileMiddleware);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(history({
  disableDotRule: true
}));
app.use(staticFileMiddleware);

app.get('/', function(req, res) {
  res.render(path.join(__dirname + '/public/index.html'));
});

app.post('/Image', serverFunctions.image);
app.post('/setRoles', serverFunctions.setRoles);
app.post('/setNewUserRoles', serverFunctions.setNewUserRoles);
app.post('/getAllUsers', serverFunctions.getAllUsers);
app.post('/addStudy', serverFunctions.addStudy);
app.listen(port, () => {
  console.log(`BrainSwipes listening at http://localhost:${port}`)
})
