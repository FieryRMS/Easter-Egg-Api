const express = require("express");
const router = express.Router();
const db = require("../libs/db");
const RegistrationOpen = parseInt(process.env.RegistrationOpen);
function ValidateTxt(s) // returns false if its not a letter number - _ , or a space
{
    //  ".", "#", "$", "[", or "]"
    for(var i=0;i<s.length;i++)
    {
        if(!( (s[i]>='a' && s[i]<='z') || 
              (s[i]>='0' && s[i]<='1') || 
               s[i]=='-' || 
               s[i]=='_' || 
               s[i]==',' ||
               s[i]==' '   ))
            return false;
    }
    return true;
}

function CheckPreviousClue(UserData, ClueData, res)
{
    var response = {
        // verdict : null,
        // cluetype : null,
        // task : null,
        // message : null,
        // image : null,
        // link : null
    };
    return new Promise( async(resolve, reject)=>{
        var RelatedData;
    try{
        RelatedData=await db.GetClueData(ClueData.relatedto);
    }
    catch (err){
        res.status(500).send(err);
        resolve(false);
    }
    if(RelatedData.index>=UserData.solved[RelatedData.cluetype].length || 
        ! UserData.solved[RelatedData.cluetype][RelatedData.index] )
    {
        response.verdict="wrong";
        response.task="message";
        response.message="wrong answer, try again!";
        res.status(200).json(response);
        resolve(false);
    }
    resolve(1);
    });
    
    
}

function ClueSolved(UserData, ClueData, res)
{
    var response = {
        // verdict : null,
        // cluetype : null,
        // task : null,
        // message : null,
        // image : null,
        // link : null
    };
    if(ClueData.index>=UserData.solved[ClueData.cluetype].length || 
        ! UserData.solved[ClueData.cluetype][ClueData.index] )
    {
        for(var i=UserData.solved.length; i<=ClueData.index; i++)
            UserData.solved.push(false);
        UserData.score[ClueData.cluetype]++, 
        UserData.solved[ClueData.cluetype][ClueData.index] = true;
        try{
            db.UpdateUser(UserData);
        }
        catch (err){
            response.message=err;
            res.status(500).json(response.message);
            return;
        }
    }
    {
        response.verdict="correct";
        response.cluetype=ClueData.cluetype;
        response.task=ClueData.task;
        response.message=ClueData.message;
        response.image=ClueData.image;
        response.link=ClueData.link;
    }
    res.status(200).json(response);
}

router.get("/:uid", async (req, res, next) =>{
    if(RegistrationOpen)
    {
        try{
            await db.RegisterUser(req.params.uid);
        }
        catch(err)
        {
            res.status(500).send(err);
        }
        res.status(200).send("registered");
    }
    else
    {
        next();
    }
})

router.get("/", (req, res, next) => { // Easter Egg home page
    res.status(200).send("Let the hunt begin");
});

router.patch("/", async (req, res, next) => { // for participants
    var uid=req.body.uid;
    var ans=req.body.ans;
    var response = {
        // verdict : null,
        // cluetype : null,
        // task : null,
        // message : null,
        // image : null,
        // link : null
    };
    
    uid=String(uid);
    ans=String(ans);
    if(!ValidateTxt(uid) || !ValidateTxt(ans)) //text validation
    {
        response.verdict="invalid";
        response.task="message";
        response.message="the user id or answer may contail illegal characters";
        res.status(400).json(response);
        return;
    }

    var UserData;
    try{
        UserData= await db.GetUserData(uid);
    }
    catch (err){
        response.verdict="failed";
        response.message=err;
        res.status(500).send(response);
        return;
    }
    if(UserData==null) //wrong id
    {
        response.verdict="invalid";
        response.task="message";
        response.message="the given user id does not exist";
        res.status(418).send(response);
        return;
    }

    var ClueData;
    try{
        ClueData= await db.GetClueData(ans);
    }
    catch (err){
        response.message=err;
        res.status(500).send(response);
        return;
    }
    if(ClueData==null) //wrong answer
    {
        response.verdict="wrong";
        response.task="message";
        response.message="wrong answer, try again!";
        res.status(200).json(response);
        return;
    }

    if(ClueData.relatedto != null) //check clue is related to another clue
    {
        if(! (await CheckPreviousClue(UserData, ClueData, res)))
            return;
    }

    ClueSolved(UserData,ClueData, res);
});

module.exports = router;