const db = require("../libs/db");


const WindowMs = parseInt(process.env.WindowMs);
const MaxReqs = parseInt(process.env.MaxReqs);
const BanPeriod = parseInt(process.env.BanPeriod);
const MaxWarns = parseInt(process.env.MaxWarns);
const MaxOffences = parseInt(process.env.MaxOffences);
const SpamIncrement = parseInt(process.env.SpamIncrement);
const SpamIncrementOffence = parseInt(process.env.SpamIncrementOffence);
const SendBanHeaders = parseInt(process.env.SendBanHeaders);

async function BanHandler(req, res, next)
{
    var ip = req.ip || req.socket.remoteAddress;
    var BanStatus = {};
    try{
        BanStatus = await db.GetBanStatus(ip);
    }
    catch(err){
        console.log(err);
        next();
        return;
    }
    
    if(BanStatus == null)
    {
        BanStatus = {
        uids:[],
        Start: Date.now(),
        RemainingReqs : MaxReqs,
        WarningsLeft : MaxWarns,
        isBanned : false,
        offences : 0
        }
    }
    if(BanStatus.offences>=MaxOffences)
    {
        if(SendBanHeaders) res.set(BanStatus);
        res.status(429).json({
            verdict : "invalid",
            task : "message",
            message : "welp! Looks like you got perma banned by our systems"
            +  ", if you think this was a mistake, feel free to contact us at contact@pihacks.net",
            });
        db.UpdateIp(ip,BanStatus);
        return;
    }
    if(BanStatus.isBanned)
    {
        if(Date.now() - BanStatus.Start < BanPeriod)
        {
            let UnBanTime = new Date(BanStatus.Start + BanPeriod);
            UnBanTime = UnBanTime.toLocaleString("en-US",{ timeZone: 'Asia/Almaty' })
            if(SendBanHeaders) res.set(BanStatus);
            res.status(429).json({
                verdict : "invalid",
                task : "message",
                message : "Hey!, seems like you have been sending too many requests!\n" + 
                "After repeated offences, our systems have put you in a timeout corner until " + UnBanTime 
                +  ", if you think this was a mistake, feel free to contact us at contact@pihacks.net",
            });
            return;
        }
        else
        {
            BanStatus.isBanned=false;
            BanStatus.WarningsLeft=0;
            BanStatus.RemainingReqs = MaxReqs;
            BanStatus.Start = Date.now();
        }
    }
    if(Date.now() - BanStatus.Start >= WindowMs)
    {
        BanStatus.RemainingReqs = MaxReqs;
        BanStatus.Start=Date.now();
    }
    if(BanStatus.RemainingReqs>0)
    {
        BanStatus.RemainingReqs--;
        db.UpdateIp(ip, BanStatus);
    }
    else if(BanStatus.RemainingReqs==0)
    {
        BanStatus.WarningsLeft--;
        BanStatus.RemainingReqs--;
    }
    if(BanStatus.WarningsLeft<0)
    {
        BanStatus.isBanned=true;
        BanStatus.Start=Date.now();
        BanStatus.offences++;
        if(BanStatus.offences>=MaxOffences)
        {
            if(SendBanHeaders) res.set(BanStatus);
            res.status(429).json({
                verdict : "invalid",
                task : "message",
                message : "welp! Looks like you got perma banned"
                +  ", if you think this was a mistake, feel free to contact us at contact@pihacks.net",
                });
            db.UpdateIp(ip,BanStatus);
            return;
        }
        let UnBanTime = new Date(BanStatus.Start + BanPeriod);
        UnBanTime = UnBanTime.toLocaleString("en-US",{timeZone: 'Asia/Almaty'})
        if(SendBanHeaders) res.set(BanStatus);
        res.status(429).json({
            verdict : "invalid",
            task : "message",
            message : "Hey!, seems like you have been sending too many requests!\n" + 
            "After repeated offences, our systems have put you in a timeout corner until " + UnBanTime 
            +  ", if you think this was a mistake, feel free to contact us at contact@pihacks.net",
            });
        db.UpdateIp(ip,BanStatus);
        return;
    }
    if(BanStatus.RemainingReqs<0)
    {
        BanStatus.Start+=SpamIncrement;
        BanStatus.offences+=(1/SpamIncrementOffence);
        if(SendBanHeaders) res.set(BanStatus);
        if(Date.now()>BanStatus.Start)
        {
            var WaitTime=Math.ceil((WindowMs-(Date.now() - BanStatus.Start))/(1000*60));
        }
        else
        {
            var WaitTime=Math.ceil((WindowMs+(BanStatus.Start-Date.now()))/(1000*60));
        }
        res.status(429).json({
            verdict : "invalid",
            task : "message",
            message : "Hey!, seems like you have been sending too many requests!\n" +
            "We understand you might be excited about the event" + 
            "but keep in mind we need to process a lot of requests from other participants too\n" +  
            "please wait "+String(WaitTime) + "min(s) before sending another request. " + 
            "if you think this was a mistake, feel free to contact us at contact@pihacks.net",
        });
        db.UpdateIp(ip,BanStatus);
        return;
    }
    if(SendBanHeaders) res.set(BanStatus);
    db.UpdateIp(ip,BanStatus);
    next();
}

module.exports = BanHandler;