const fs = require('fs');
const express = require('express');
const app = express();
const port = 3000;
var bodyParser = require("body-parser");
var UI5AppGen = require("./ui5-app-gen");

// middlewares
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));

// views
app.get("/",function(req, res){
    res.render("form");
});
app.post("/",function(req, res){
    // key mappings
    const tNameMappings = {
        "app-name": "APP_NAME",
        "app-id": "APP_ID",
        "app-title": "APP_TITLE",
        "app-theme": "APP_THEME",
        "app-version": "APP_VERSION",
        "ui5-min-version": "UI5_MIN_VERSION",
        "ui5-version": "UI5_VERSION",
    };

    // set values
    var defaultMappings = UI5AppGen.getAppMappings();
    Object.entries(tNameMappings).forEach((pEntry) => {
        if (req.body[pEntry[0]]) {
            defaultMappings[pEntry[1]] = req.body[pEntry[0]];
        }
    });

    // download zip file
    new UI5AppGen(defaultMappings).sendZipStream(res);
});

// start server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});