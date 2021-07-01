const firebase = require("firebase/app");
require("firebase/database");
let firebaseConfig = {
    apiKey: process.env.apiKey,
    authDomain: process.env.authDomain,
    databaseURL: process.env.databaseURL,
    projectId: process.env.projectId,
    storageBucket: process.env.projectId,
    messagingSenderId: process.env.messagingSenderId,
    appId: process.env.appId,
    measurementId: process.env.measurementId
};
firebase.initializeApp(firebaseConfig);
var database = firebase.database();

const dbTimeOut=process.env.dbTimeOut || 5000;
database.ref().on("value", ()=>{});

function RegisterUser(uid)
{
    return new Promise(( resolve, reject ) =>{
        database.ref("/users/" + uid).set({
                uid : uid,
                solved :{
                    "1":[false],
                    "2":[false],
                    "3":[false]
                },
                score :{
                    "1":0,
                    "2":0,
                    "3":0
                }
            })
        .then(()=>{
            resolve();
        })
        .catch((err) =>{
            reject('Synchronization failed');
        });
    });
}

function GetUserData(uid)
{
    return new Promise(( resolve, reject ) =>{
        var done=false;
        database.ref("/users/"+uid).once("value", (dat) => {
            if(!done)
            {
                done=true;
                resolve(dat.val());
            }
        });
        setTimeout(()=>{
            if(!done)
            {
                done=true;
                reject("could not connect to database, please try again");
            }
        },dbTimeOut);
    });
}

function GetClueData(clue)
{
    return new Promise(( resolve, reject ) =>{
        var done=false;
        database.ref("/clues/"+clue).once("value", (dat) => {
            if(!done)
            {
                done=true;
                resolve(dat.val());
            }
        });
        setTimeout(()=>{
            if(!done)
            {
                done=true;
                reject("could not connect to database, please try again");
            }
        },dbTimeOut);
    });
}

function UpdateUser(UserData)
{
    return new Promise(( resolve, reject ) =>{
        var done=false;
        database.ref("/users/" + UserData.uid).set(UserData)
        .then(()=>{
            resolve();
            done=true;
        })
        .catch((err) =>{
            reject('Synchronization failed');
        });
        // setTimeout(()=>{
        //     if(!done)
        //     {
        //         reject("could not connect to database, please try again");
        //     }
        // },TimeOut);
    });
}

function ReplaceInvalidChar(ip, reverse=false)
{
    //  ".", "#", "$", "[", or "]"
    if(! reverse)
    {
        return String(ip)
        .replaceAll(".", ",")
        .replaceAll("#", "@")
        .replaceAll("$", "%")
        .replaceAll("[", "^")
        .replaceAll("]", "&");
    }
    else
    {
        return String(ip)
        .replaceAll(",", ".")
        .replaceAll("@", "#")
        .replaceAll("%", "$")
        .replaceAll("^", "[")
        .replaceAll("&", "]");
    }
}

function UpdateIp(ip, BanStatus)
{
    ip=ReplaceInvalidChar(ip);
    database.ref("/rate-limit/" + ip).set(BanStatus);
}

function GetBanStatus(ip)
{
    ip=ReplaceInvalidChar(ip);
    return new Promise(( resolve, reject ) =>{
        var done=false;
        database.ref("/rate-limit/"+ip).once("value", (dat) => {
            if(!done)
            {
                resolve(dat.val());
                done=true;
            }
        });
        setTimeout(()=>{
            if(!done)
            {
                reject("could not connect to database, please try again");
                done=true;
            }
        },dbTimeOut);
    });
}

function AddUserToIP(ip, uid)
{
    ip=ReplaceInvalidChar(ip);
    return new Promise(( resolve, reject ) =>{
        var done=false;
        database.ref("/rate-limit/"+ip+"/uids").once("value", (dat) => {
            if(!done)
            {
                done=true;
                var v = dat.val();
                if(v == null) v = [uid];
                else if(!v.includes(uid)) v.push(uid);
                database.ref("/rate-limit/"+ip+"/uids").set(v);
                resolve();
            }
        });
        setTimeout(()=>{
            if(!done)
            {
                done=true;
                reject("could not connect to database, please try again");
            }
        },dbTimeOut);
    });
}
module.exports = {
    RegisterUser : RegisterUser,
    GetUserData : GetUserData,
    GetClueData : GetClueData,
    UpdateUser : UpdateUser,
    UpdateIp: UpdateIp,
    GetBanStatus : GetBanStatus,
    AddUserToIP : AddUserToIP
};
//database.ref("/ips/")

// database.ref("/users/test-user").set({
//     uid:"test-user",
//     solved :{
//         "1":[false],
//         "2":[false],
//         "3":[false]
//     },
//     score :{
//         "1":0,
//         "2":0,
//         "3":0
//     }
// });

// database.ref("/clues/test-clue").set({
//     index : 0,
//     cluetype : "1",
//     task : "message",
//     message : "ouff joss beda tui bagher baccha",
//     image : null,
//     link : "youtube.com",
//     relatedto : null
// });

// database.ref("/clues/test-clue-related").set({
//     index : 1,
//     cluetype : "2",
//     task : "message",
//     message : "waw",
//     image : null,
//     link : "pihacks.net",
//     relatedto : "test-clue"
// });


// database.ref("/users/test-usera").on("value", (dat) => {
//     console.log(dat.val());
// })