const express = require('express');
const app = express();
const API_PORT = 3001;
const bodyParser = require('body-parser');
const router = express.Router();
let config;
let dictionary;
const tablesByType = {};
const nodeArray = [];

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

// noinspection JSUnusedLocalSymbols
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
  if (tablesByType[type]) {
    return res.json({success: true, data: tablesByType[type]});
  } else {
    return res.json({success: false, message: `unknown entity type: ${type}`});
  }
});

router.get("/graph", (req, res) => {
  console.log(`serving graph`);
  return res.json({success: true, data: nodeArray});
});

router.get("/config", (req, res) => {
  console.log(`serving config`);
  return res.json({success: true, data: config['clientConfig']});
});

router.get("/cards", (req, res) => {
  let templates;
  try {
    const data = fs.readFileSync(path.join(__dirname, 'cards.json'), 'utf-8');
    templates = JSON.parse(data.toString());
  } catch (err) {
    throw new Error(`Couldn't load data: ${err}`);
  }
  console.log(`serving cards`);
  return res.json({success: true, data: templates});
});

router.get("/tools", (req, res) => {
  let tools;
  try {
    const data = fs.readFileSync(path.join(__dirname, 'tools.json'), 'utf-8');
    tools = JSON.parse(data.toString());
  } catch (err) {
    throw new Error(`Couldn't load data: ${err}`);
  }
  console.log(`serving tools`);
  return res.json({success: true, data: tools});
});

app.use(express.static('static'));
app.use("/api", router);

const parentDir = __dirname.substring(0, __dirname.lastIndexOf(path.sep));

app.use(express.static(path.join(parentDir, 'build')));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const configPath = path.join(__dirname, 'config.json');
try {
  const configData = fs.readFileSync(configPath, 'utf-8');
   config = JSON.parse(configData.toString());
} catch (err) {
  throw new Error(`Couldn't load config file: ${err}`);
}

const dicPath = path.join(__dirname, 'dictionary.json');
try {
  const dicdata = fs.readFileSync(dicPath, 'utf-8');
  dictionary = JSON.parse(dicdata.toString())['TypeDictionary'];
} catch (err) {
  throw new Error(`Couldn't load dictionary: ${err}`);
}

const {dataFiles, clientConfig} = config;
if (!dataFiles) {
  throw new Error(`Missing key 'dataFiles' in config.json`);
}
if (!clientConfig) {
  throw new Error(`Missing key 'clientConfig' in config.json`);
}

dataFiles.forEach(fileName => {
  const extension = fileName.split('.')[1];
  try {
    const data = fs.readFileSync(path.join(__dirname, fileName), 'utf-8');
    switch (extension) {
      case 'csv': {
        const table = csv2array(data.toString());
        tablesByType[table.type] = table;
        break;
      }
      case 'json': {
        const subGraph = JSON.parse(data.toString());
        nodeArray.push(...subGraph['graph']);
        break;
      }
    }
  } catch(err) {
    throw new Error(`Couldn't load tickets: ${err}`);
  }
});

app.listen(API_PORT, function(){
  console.log('Development Control Center mock backend is running');
});
