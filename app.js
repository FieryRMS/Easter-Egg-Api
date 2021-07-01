const express = require("express");
const app = express();
const easter_egg_hunt = require("./api/routes/easter-egg-hunt");
const BanHandler = require("./api/routes/BanHandler");
app.use(express.json());

app.enable('trust proxy');
app.use(BanHandler);

app.use("/easter-egg-hunt", easter_egg_hunt);

app.get("/", (req, res, next) =>{
    res.status(200).send("nothing to see, shuu shuu");
});


module.exports = app;