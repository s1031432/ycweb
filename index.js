// 引用linebot SDK
const linebot = require('linebot');
const request = require('request');
// 用於辨識Line Channel的資訊
const bot = linebot({
    channelId: '1657230313',
    channelSecret: '8d3cc1117d914a195c6cfde0ecf02dd3',
    channelAccessToken: 'KLJGS90t85MQb4BxMNapjCk+MkWq1j8048nPGi6CGE/LsiG3MMpT229VxyaBRWkOVyQoCQ3adrQ2puxc9M8BkHr14DKv9jl4BM8VkoyETNI8/tXUroeAUZyWtKkOYHAINQCdc1ljtyjk6cPeijMIuAdB04t89/1O/w1cDnyilFU='
});
const goldenYearsCsv = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTyBNycncdco9uhIst6gTlK_EbQL21nt6lfV5sbYbyp-GsEHf6zQR4mnnVg32Z-jA6nwxLysDAyMF_9/pub?output=csv'
var users=[];
customList = [];
// {
//     '時間戳記': 'aa',
//     '客戶姓名': 'cc',
//     '電子郵件': 'bb@gmail.cop',
//     '手機號碼': 'dd',
//     '成品雲端連結': 'ee'
// }
bot.on('message', function (event) {
    event.source.profile().then(function (profile){
        var myId=event.source.userId;
        if (users[myId]==undefined){
            users[myId]=[];
            users[myId].userId = profile.userId;
            users[myId].userName = profile.displayName;
            users[myId].userMsg = event.message.text;
            users[myId].replyMsg = [];
            users[myId].photoStep = 0;
            users[myId].phone = "";
            users[myId].mail = "";
        }
        else{
            users[myId].replyMsg = [];
            users[myId].userMsg = event.message.text;
        }
        if(event.message.type == "text"){
            if(users[myId].userMsg == "取件"){
                users[myId].photoStep = 1;
                users[myId].replyMsg.push("請輸入您的電話");
                sendMessage(event, users[myId].replyMsg, users[myId].userMsg);
                // Update custom data
                request({
                    uri:    goldenYearsCsv,
                    method: "GET",
                    timeout: 6000,
                    }, (err, res, body) => {
                        // Update custom data
                        customList = csv2json(body);
                        console.log(customList);
                    }
                );
            }
            if(users[myId].photoStep){
                if(users[myId].photoStep == 1 && checkPhone(users[myId].userMsg)){
                    users[myId].photoStep = 2;
                    users[myId].phone = users[myId].userMsg;
                    users[myId].replyMsg.push("請輸入您的電子郵件");
                }
                if(users[myId].photoStep == 2 && checkMail(users[myId].userMsg)){
                    users[myId].photoStep = 0;
                    users[myId].mail = users[myId].userMsg;
                    users[myId].photoLink = getPhotoLink(users[myId].phone, users[myId].mail);
                    if(users[myId].photoLink){
                        users[myId].replyMsg.push("身分驗證成功，附上您的成品連結如下，再次感謝您蒞臨本店。");
                        users[myId].replyMsg.push(users[myId].photoLink);
                    }
                    else{
                        users[myId].replyMsg.push("身分驗證成功，經查您成品尚在趕工修圖當中，請您見諒。");
                    }
                    
                }
                sendMessage(event, users[myId].replyMsg, users[myId].userMsg);
            }
        }
        else{
            users[myId].replyMsg.push("我只看得懂圖片QQ");
            sendMessage(event, users[myId].replyMsg, "(Not text)");
        }
    });
});

function checkPhone(phone){
    console.log(customList);
    for(var i=0;i<customList.length;i++){
        if(customList["手機號碼"] == phone){
            return true;
        }
    }
    return false;
}
function checkMail(mail){
    for(var i=0;i<customList.length;i++){
        if(customList["電子郵件"] == mail){
            return true;
        }
    }
    return false;
}
function getPhotoLink(phone, mail){
    for(var i=0;i<customList.length;i++){
        if(customList["手機號碼"] == photo && customList["電子郵件"] == mail){
            return customList["成品雲端連結"];
        }
    }
    return false;
}
function csv2json(csv_str){
    var csv = csv_str;
    csv = csv.split("\r\n");
    var json_list = [];
    var header_list = csv[0].split(",");
    for(var i=1;i<csv.length;i++){
        // each_row
        let each_data_string = csv[i];
        let each_cell_string = each_data_string.split(",");
        let tempObj = {};
        for(var j=0;j<header_list.length;j++){
            tempObj[header_list[j]] = each_cell_string[j];
        }
        json_list.push(tempObj);
    }
    return json_list;
}
function sendMessage(event, replyMsg, userMsg){
    event.source.profile().then(function (profile) {
        var userName = profile.displayName;
        var userId = profile.userId;
        event.reply(replyMsg).then(function (data){
            console.log(replyMsg);
        }).catch(function (error) {
            console.log("--Reply Fail--");
            console.log(error);
        });
    });
}
bot.listen('/linewebhook', process.env.PORT, function () {
    console.log('[BOT Ready]');
});


