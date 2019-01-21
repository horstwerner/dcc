const express = require('express');
const app = express();
const API_PORT = 3001;
const bodyParser = require('body-parser');
const router = express.Router();
let demoData = "no demo data loaded";
let dictionary;

const fs = require('fs');
const path = require('path');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

const csv2array = function (csvString) {

  const lines = csvString.split('\n');
  const rows = lines.map(line => line.split(','));
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
  return res.json({success: true, data: demoData});
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

const dataPath = path.join(__dirname, 'data.csv');
fs.readFile(dataPath, {encoding: 'utf-8'}, function(err,data){
  if (!err) {
    demoData = csv2array(data);
  } else {
    throw new Error(`Couldn't load data: ${err}`);
  }
});

app.listen(API_PORT, function(){
  console.log('Development Control Center mock backend is running');
});
