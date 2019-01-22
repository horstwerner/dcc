const express = require('express');
const app = express();
const API_PORT = 3001;
const bodyParser = require('body-parser');
const router = express.Router();
let tickets;
let tests;
let dictionary;

const fs = require('fs');
const path = require('path');

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

router.get("/getDictionary", (req, res) => {
  return res.json({success: true, data: dictionary});
});

router.get("/getData", (req, res) => {
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

app.use("/api", router);

const dicPath = path.join(__dirname, 'dictionary.json');
fs.readFile(dicPath, {encoding: 'utf-8'}, function (err, data) {
  if (!err) {
    dictionary = JSON.parse(data)['TypeDictionary'];
  } else {
    throw new Error(`Couldn't load dictionary: ${err}`);
  }
});

fs.readFile(path.join(__dirname, 'tickets.csv'), {encoding: 'utf-8'}, function(err, data){
  if (!err) {
    tickets = csv2array(data);
  } else {
    throw new Error(`Couldn't load data: ${err}`);
  }
});

fs.readFile(path.join(__dirname, 'tests.csv'), {encoding: 'utf-8'}, function(err, data){
  if (!err) {
    tests = csv2array(data);
  } else {
    throw new Error(`Couldn't load data: ${err}`);
  }
});

app.listen(API_PORT, function(){
  console.log('Development Control Center mock backend is running');
});
