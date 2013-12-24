/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var async = require('async');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

var server = http.createServer(app).listen(app.get('port'), function(){
                                           console.log('Express server listening on port ' + app.get('port'));
                                           });

var io = require('socket.io')
io = io.listen(server)

process.on('uncaughtException', function(err) {
           console.log('uncaughtException: ' + err.stack)
           });

io.on('connection', function(socket) {
      
      socket.on('message', function(msg) {
                console.log("message:"+msg);
                socket.emit("message","メッセージ受信したのでサーバから返したけどイベント名は仕様書通りbattleActionにしてね！");
                });
      
      socket.on('battleAction', function(msg) {
                console.log("message:"+msg);
                var obj = JSON.parse(msg);
                http.get("http://10.13.163.102/eor/battleAction?msg="+msg,function(res){
                         res.on("data", function(datas) {
                                datas = JSON.parse(datas);
                                async.forEachSeries(datas, function(data, next){
                                                    var sendMsg = {
                                                    "castTime": parseInt((new Date) / 1 ) + parseInt(data.cast),
                                                    "target": obj.target,
                                                    "targetGroup": obj.targetGroup,
                                                    "user": obj.user,
                                                    "userGroup": obj.userGroup
                                                    }
                                                    sendMsg = JSON.stringify(sendMsg);
                                                    socket.emit("battleCast",sendMsg);
                                                    
                                                    
                                                    setTimeout(function(){
                                                               var sendMsg = {
                                                               "name": data.name,
                                                               "target": obj.target,
                                                               "targetGroup": obj.targetGroup,
                                                               "user": obj.user,
                                                               "userGroup": obj.userGroup ,
                                                               "value": data.atk
                                                               }
                                                               
                                                               sendMsg = JSON.stringify(sendMsg);
                                                               socket.emit("battleExec",sendMsg);
                                                               next();
                                                               },data.cast);
                                                    
                                                    }, function (err) {
                                                    var sendMsg = {
                                                    "1": "1"
                                                    }
                                                    
                                                    sendMsg = JSON.stringify(sendMsg);
                                                    socket.emit("battleDelayEnd",sendMsg);
                                                    console.log("end");
                                                    });
                                });
                         });
                });
      });

