const express = require('express');
const app = express();
const API_PORT = 3001;
const bodyParser = require('body-parser');
const router = express.Router();
let tickets;
let tests;
let dictionary;

const NUM_CARDS = 300;

const fs = require('fs');
const path = require('path');

// app.use(function(req, res, next) {
//   console.log('%s %s %s', req.method, req.url, req.path);
//   next();
// });


app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

const csv2array = function (csvString) {

  const lines = csvString.indexOf('\r\n') > -1 ?
      csvString.split('\r\n') :
      csvString.split('\n');
  const rows = lines.map(line => line.split(',').map(cell => cell.trim()));
  const headerRow = rows.splice(0,1)[0];
  const type = headerRow[0];
  headerRow[0] = 'id';
  return {type, headerRow, valueRows: rows.filter(row => row.length > 1)}
};

const compressArray = function (jsonArray) {
  const headerRow = Object.keys(jsonArray[0]);
  const type = jsonArray[0].type;
  return {
    type, headerRow, valueRows: jsonArray.map(object => headerRow.map(key => object[key]))
  }
};

router.get("/dictionary", (req, res) => {
  return res.json({success: true, data: dictionary});
});

router.get("/data", (req, res) => {
  const type = req.query && req.query.type;
  console.log(`requested: ${type}`);
  switch (type) {
    case 'jira:ticket':
      return res.json({success: true, data: tickets});
    case 'dcc:test':
      return res.json({success: true, data: tests});
    default:
      return res.json({success: false, message: `unknown entity type: ${type}`});
  }
});

router.get("/views", (req, res) => {
  let cards;
  try {
    const data = fs.readFileSync(path.join(__dirname, 'groupDesigns.json'), {encoding: 'utf-8'});
    views = JSON.parse(data);
  } catch (err) {
    throw new Error(`Couldn't load data: ${err}`);
  }
  console.log(`serving group cards`);
  return res.json({success: true, data: views});
});

router.get("/cards", (req, res) => {
  let cards;
  try {
    const data = fs.readFileSync(path.join(__dirname, 'cards.json'), {encoding: 'utf-8'});
    cards = JSON.parse(data)['cards'];
  } catch (err) {
    throw new Error(`Couldn't load data: ${err}`);
  }
  console.log(`serving cards`);
  return res.json({success: true, data: cards});
});

router.get("/navigation", (req, res) => {
  let navigation;
  try {
    const data = fs.readFileSync(path.join(__dirname, 'navigation.json'), {encoding: 'utf-8'});
    navigation = JSON.parse(data);
  } catch (err) {
    throw new Error(`Couldn't load data: ${err}`);
  }
  console.log(`serving navigation`);
  return res.json({success: true, data: navigation});
});

app.use(express.static('static'));

app.use("/api", router);

const parentDir = __dirname.substring(0, __dirname.lastIndexOf(path.sep));

app.use(express.static(path.join(parentDir, 'build')));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const dicPath = path.join(__dirname, 'dictionary.json');
try {
  const dicdata = fs.readFileSync(dicPath, {encoding: 'utf-8'});
  dictionary = JSON.parse(dicdata)['TypeDictionary'];
} catch (err) {
  throw new Error(`Couldn't load dictionary: ${err}`);
}

const randomNum = function (maxVal) {
  return Math.floor(Math.random() * maxVal);
};

const randomVal = function (array) {
  return array[randomNum(array.length)];
};

const ticketArray = [];
for (let i = 0; i < NUM_CARDS; i++) {
  ticketArray.push({
    id: `JRA-${i}`,
    type: `jira:ticket`,
    'jira:ticket-type': randomVal(['bug', 'story']),
    'jira:status': randomVal(['unassigned', 'open', 'in progress', 'in review', 'validate', 'closed'])
  });
}

tickets = compressArray(ticketArray);

// try {
//   const ticketdata = fs.readFileSync(path.join(__dirname, 'tickets.csv'), {encoding: 'utf-8'});
//   tickets = csv2array(ticketdata);
// } catch(err) {
//   throw new Error(`Couldn't load tickets: ${err}`);
// }

try {
  const testdata = fs.readFileSync(path.join(__dirname, 'tests.csv'), {encoding: 'utf-8'});
  tests = csv2array(testdata);
} catch (err) {
  throw new Error(`Couldn't load tests: ${err}`);
}

app.listen(API_PORT, function(){
  console.log('Development Control Center mock backend is running');
});
