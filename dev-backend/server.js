const express = require('express');
const enableWs = require('express-ws')

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

const wsInstance = enableWs(app);

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

const configPath = path.join(__dirname, `data/config.json`);
try {
  const configData = fs.readFileSync(configPath, 'utf-8');
   config = JSON.parse(configData.toString());
} catch (err) {
  try {
    const fallbackPath = path.join(__dirname, 'testData/config.json');
    const configData = fs.readFileSync(fallbackPath, 'utf-8');
    config = JSON.parse(configData.toString());
  } catch (err) {
    throw new Error(`Couldn't load config file: ${err}`);
  }
}

const {dictionaryFile, templateFiles, toolFile, dataFiles, clientConfig} = config;

const dicPath = path.join(__dirname, dictionaryFile);
try {
  const dicdata = fs.readFileSync(dicPath, 'utf-8');
  dictionary = JSON.parse(dicdata.toString())['TypeDictionary'];
} catch (err) {
  throw new Error(`Couldn't load dictionary: ${err}`);
}


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
  return res.json({success: true, data: nodeArray, entryPoint: nodeArray[0]});
});

router.get("/config", (req, res) => {
  console.log(`serving config`);
  return res.json({success: true, data: config['clientConfig']});
});

router.get("/templates", (req, res) => {
  const constants =  [];
  const cards = [];
  try {
    templateFiles.forEach(fileName => {
      const data = fs.readFileSync(path.join(__dirname, fileName), 'utf-8');
      const templates = JSON.parse(data.toString());
      if (templates.constants) {
        constants.push(...templates.constants);
      }
      if (templates.cards) {
        cards.push(...templates.cards);
      }
    });
  } catch (err) {
    throw new Error(`Couldn't load data: ${err}`);
  }
  console.log(`serving cards`);
  return res.json({success: true, data: {constants, cards}});
});

router.get("/tools", (req, res) => {
  let tools;
  try {
    const data = fs.readFileSync(path.join(__dirname, toolFile), 'utf-8');
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


app.listen(API_PORT, function(){
  console.log('Development Control Center mock backend is running');
});

app.ws('/updates', (ws, req) => {
  ws.on('message', () => {
    ws.send(`ack`);
  })

  ws.on('close', () => {
    console.log('WebSocket was closed')
  })

  ws.isAlive = true;
  console.log(`WebSocket connected`);
  console.log(`url: ${req.url}`);

  ws.on('pong', () => {
    console.log('pong');
    ws.isAlive = true;
  });

  console.log(`Websocket opened`);
  const updated = {id: "TQC-10363",
    "core:name": "A Changed Ticket Name",
    "jira:status": "in progress",
    "jira:storypoints": 6,
    "jira:depends-on": "TQC-10354",
    "jira:team": "Platform",
    "jira:ticket-type": "Story",
    "jira:feature": "Fuzzy data support",
    "jira:sprint": "2020-07",
    "jira:release": "1.3",
    "core:url": "http://jira.com/TQC-10363"}

  setTimeout(() => ws.send(JSON.stringify({update: [updated]})), 5000);
});

setInterval(() => {
  wsInstance.getWss().clients.forEach((ws) => {

    if (!ws.isAlive) return ws.terminate();

    ws.isAlive = false;
    console.log('ping');
    ws.ping(null, false, null);
  });
}, 10000);
