var express = require('express');
var app = express(); //ecpress는 함수
var fs = require('fs');
//var template = require('./lib/template.js'); //remplate.js을 요구한다.
//var sanitizeHtml = require('sanitize-html');
//var qs = require('querystring');
var bodyParser = require('body-parser'); // npm install body-parser
var compression = require('compression'); // 파일을 압축해준다.
var topicRouters = require('./routes/topic');
var indexRouters = require('./routes/index');

//app.use(helmet());//보안 관련 npm install --svae helmet
app.use(express.static('public'));//public범위 안에서 static파일을 찾겠다.
// parse application/x-www-form-urlencoded
//app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
//app.use 바디파서를 호출하면 이 코드가 실행되면서 이 결과로
//bodyParser.urlencoded({ extended: false })에 미들웨어가 들어오게 된다.
app.use(compression({})); // 파일을 압축해준다. 미들웨어

app.get('*',function(request, response, next){ //request, response는 약속 , '*'는 모든영역
  fs.readdir('./data', function(error, filelist){
    request.list = filelist;
    next(); //그다음에 호출되어야 할 미들웨어가 ()안에 담겨있다.
  });
});
/*get routing
app.get('/', (req, res) => res.send('Hello World!'));
라우팅은 URI(또는 경로) 및 특정한 HTTP 요청 메소드(GET, POST 등)인 특정 엔드포인트에 대한
클라이언트 요청에 애플리케이션이 응답하는 방법을 결정하는 것을 말합니다.*/

app.use('/topic', topicRouters);
app.use('/', indexRouters);
// /topic이라고 시작하는 주소들에게 topicRouters하는 미들웨어를 적용 하겠다.


app.use(function(req, res, next) {
  res.status(404).send('Sorry cant find that!');
}); //error 처리 미들웨어

/*미들웨어란?
다른사람이 만든 소프트웨어를 기반으로 나의 소프트웨어를 만드는
Third-party middleware : officail하지 않은 미들웨어 */

app.use(function(err, req, res, next) { //err에 인자가 있는 경우 ex)/page/qwetqwetqwe
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(3000, function () { // --> app.listen(3000);
  console.log('Example app listening on port 3000!');
});


/*var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var template = require('./lib/template.js');
var path = require('path');
var sanitizeHtml = require('sanitize-html');

var app = http.createServer(function(request,response){
    var _url = request.url;
    var queryData = url.parse(_url, true).query;
    var pathname = url.parse(_url, true).pathname;
    if(pathname === '/'){                          //homepage 구현 부분
      if(queryData.id === undefined){
        fs.readdir('./data', function(error, filelist){
          var title = 'Welcome';
          var description = 'Hello, Node.js';
          var list = template.list(filelist);
          var html = template.HTML(title, list,
            `<h2>${title}</h2>${description}`,
            `<a href="/create">create</a>`
          );
          response.writeHead(200);
          response.end(html);
        });
      } else {
        fs.readdir('./data', function(error, filelist){
          var filteredId = path.parse(queryData.id).base;
          fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
            var title = queryData.id;
            var sanitizedTitle = sanitizeHtml(title);
            var sanitizedDescription = sanitizeHtml(description, {
              allowedTags:['h1']
            });
            var list = template.list(filelist);
            var html = template.HTML(sanitizedTitle, list,
              `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
              ` <a href="/create">create</a>
                <a href="/update?id=${sanitizedTitle}">update</a>
                <form action="delete_process" method="post">
                  <input type="hidden" name="id" value="${sanitizedTitle}">
                  <input type="submit" value="delete">
                </form>`
            );
            response.writeHead(200);
            response.end(html);
          });
        });
      }
    } else if(pathname === '/create'){
      fs.readdir('./data', function(error, filelist){
        var title = 'WEB - create';
        var list = template.list(filelist);
        var html = template.HTML(title, list, `
          <form action="/create_process" method="post">
            <p><input type="text" name="title" placeholder="title"></p>
            <p>
              <textarea name="description" placeholder="description"></textarea>
            </p>
            <p>
              <input type="submit">
            </p>
          </form>
        `, '');
        response.writeHead(200);
        response.end(html);
      });
    } else if(pathname === '/create_process'){
      var body = '';
      request.on('data', function(data){
          body = body + data;
      });
      request.on('end', function(){
          var post = qs.parse(body);
          var title = post.title;
          var description = post.description;
          fs.writeFile(`data/${title}`, description, 'utf8', function(err){
            response.writeHead(302, {Location: `/?id=${title}`});
            response.end();
          })
      });
    } else if(pathname === '/update'){
      fs.readdir('./data', function(error, filelist){
        var filteredId = path.parse(queryData.id).base;
        fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
          var title = queryData.id;
          var list = template.list(filelist);
          var html = template.HTML(title, list,
            `
            <form action="/update_process" method="post">
              <input type="hidden" name="id" value="${title}">
              <p><input type="text" name="title" placeholder="title" value="${title}"></p>
              <p>
                <textarea name="description" placeholder="description">${description}</textarea>
              </p>
              <p>
                <input type="submit">
              </p>
            </form>
            `,
            `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`
          );
          response.writeHead(200);
          response.end(html);
        });
      });
    } else if(pathname === '/update_process'){
      var body = '';
      request.on('data', function(data){
          body = body + data;
      });
      request.on('end', function(){
          var post = qs.parse(body);
          var id = post.id;
          var title = post.title;
          var description = post.description;
          fs.rename(`data/${id}`, `data/${title}`, function(error){
            fs.writeFile(`data/${title}`, description, 'utf8', function(err){
              response.writeHead(302, {Location: `/?id=${title}`});
              response.end();
            })
          });
      });
    } else if(pathname === '/delete_process'){
      var body = '';
      request.on('data', function(data){
          body = body + data;
      });
      request.on('end', function(){
          var post = qs.parse(body);
          var id = post.id;
          var filteredId = path.parse(id).base;
          fs.unlink(`data/${filteredId}`, function(error){
            response.writeHead(302, {Location: `/`});
            response.end();
          })
      });
    } else {
      response.writeHead(404);
      response.end('Not found');
    }
});
app.listen(3000);
*/
