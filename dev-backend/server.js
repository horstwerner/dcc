const express = require('express');
const app = express();
const API_PORT = 3001;
const bodyParser = require('body-parser');
const router = express.Router();
let demoData = "no demo data loaded";

const fs = require('fs'),
    path = require('path'),
    filePath = path.join(__dirname, 'data.csv');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

router.get("/getData", (req, res) => {
  return res.json({success: true, data: demoData});
});

app.use("/api", router);

app.listen(API_PORT, function(){
  fs.readFile(filePath, {encoding: 'utf-8'}, function(err,data){
    if (!err) {
      console.log('received data: ' + data);
      demoData = data;
    } else {
      console.log(err);
    }
  });
  console.log('Development Control Center mock backend is running');
});
