跨域对于前端来说是一个老大难的问题，许多方法如`jsonp`、`document.domain + iframe`...都有或多或少的问题，一个最佳实践就是通过服务器`nginx`做反向代理，但奈何不懂相关知识，就一直琢磨着使用 `node.js`来做。

#### 3月28更新：

在实现完功能后，我考虑将它做成一个可供任意项目调用的模块，简化其使用方法，预想的调用方式为：

    start.js
    ````
        const webProxy = require('./webProxy').webProxy
        webProxy(targetUrl, localPort)
    ````  

在CMD中切换到文件所在地址，键入：`node start.js`开启服务

下载地址：[这里](https://github.com/CaptainLiao/node)

### 配置http服务器和 http-proxy 转发请求

````
const http = require('http'),
    httpProxy = require('http-proxy'),
    fs = require('fs'),
    url = require('url'),
    path = require('path'),
    mime = require('./mime').types;

let proxy = httpProxy.createProxyServer({
    target: 'http://192.168.1.30:6760',
    secure: false
})

proxy.on('error', function (err, request, response) {
    res.writeHead(500, {
        'Content-Type': 'text/plain'
    })
    console.log(err)
    res.end('Something went wrong.')
})


let server = http.createServer((request, response)=> {
    var pathName = url.parse(request.url).pathname;
    var realPath = request.url.substring(1);
    var extName = realPath;
    var indexOfQuestionMark = extName.indexOf('?');

    if(indexOfQuestionMark >= 0){
        extName = extName.substring(0, indexOfQuestionMark);
        realPath = realPath.substring(0, indexOfQuestionMark);
    }

    extName = path.extname(extName);
    extName = extName ? extName.slice(1) : 'unknown';

    if(/\/api\/.*$/.test(pathName)){
        proxy.web(request, response);
        return;
    }

    if(!fs.existsSync(realPath)){
        response.writeHead(404, {'content-type': 'text/plain'});
        response.write('The request URL:' + realPath + ' could not be found.');
        response.end();
        return;
    }

    fs.readFile(realPath, 'binary', function(err, file){
        if(err){
            response.writeHead(500, {'content-type': 'text/plain'});
            response.end(err);
            return;
        }

        var contentType = mime[extName] || 'text/plain';
        response.writeHead(200, {'content-type': contentType});
        response.write(file, 'binary');
        response.end();
    });
});

console.log('listening on port 9060')

server.listen(9060);
````
### mime.js
````
exports.types = {
  "css": "text/css",
  "gif": "image/gif",
  "html": "text/html",
  "ico": "image/x-icon",
  "jpeg": "image/jpeg",
  "jpg": "image/jpeg",
  "js": "text/javascript",
  "json": "application/json",
  "pdf": "application/pdf",
  "png": "image/png",
  "svg": "image/svg+xml",
  "swf": "application/x-shockwave-flash",
  "tiff": "image/tiff",
  "txt": "text/plain",
  "wav": "audio/x-wav",
  "wma": "audio/x-ms-wma",
  "wmv": "video/x-ms-wmv",
  "xml": "text/xml",
  "woff": "application/x-woff",
  "woff2": "application/x-woff2",
  "tff": "application/x-font-truetype",
  "otf": "application/x-font-opentype",
  "eot": "application/vnd.ms-fontobject"
};
````
### 项目工程结构如图

![](http://images2015.cnblogs.com/blog/1085489/201703/1085489-20170327183058701-1478201562.png)

### 配置说明

基于node.js实现服务器的反向代理，核心步骤分为：
*    通过`http`模块搭建本地服务器，使用`fs`模块读取本地`.html`、`.js`、`.css`等文件；
*    使用`http-proxy`插件完成代理，基本用法可以在[这里](https://www.npmjs.com/package/http-proxy)找到。
*    通过 pathname 找到用于发送ajax 请求的api 地址，拦截请求，通过`http-proxy`模块转发。

    ````
    if(/\/api\/.*$/.test(pathName)){
        proxy.web(request, response);
        return;
    }
    ````
*    当链接如右所示：`http://localhost:9060/view/index.html?id=5`，拿到的扩展名（变量extname）会有bug，所以这里先去掉了"?"后面的数据。
    ````
    var indexOfQuestionMark = extName.indexOf('?');

    if(indexOfQuestionMark >= 0){
        extName = extName.substring(0, indexOfQuestionMark);
        realPath = realPath.substring(0, indexOfQuestionMark);
    }
    ````

### 其他

通过 `node.js`内置的服务器和第三方插件，我们完成了**反向代理服务器**，在其他文件不进行任何改动的情况下完成了跨域请求。但同时，又有了新的思考：

1、  每次启动服务都要键入`node proxy.js`, 非常麻烦，有没有简便方法？
2、  是否可以和gulp等构建工具配合使用？
3、  如何使用vue 之类的框架？

留待优化......

文章部分引用：
http://www.cnblogs.com/shawn-xie/archive/2013/06/06/3121173.html
https://segmentfault.com/a/1190000005101903

感谢！！！