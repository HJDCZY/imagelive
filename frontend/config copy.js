const config = {
    backendUrl : 'https://backend_imagelive.tjustv.cn', //后端服务器地址
    faviconpath : '/logo.jpg', //浏览器标签图标，一般是favicon.ico ，是基于frontend/public目录的相对路径
    logopath : '/logo.jpg',   // logo地址，这个logo用于版权页面 ，是基于frontend/public目录的相对路径
    headname : "天大学视-图片直播", // 网站标题，显示在浏览器标签上
    ensureHTTPS : false, // 是否强制使用HTTPS
    //前端浏览器要求我们使用HTTPS，但是如果您使用了反向代理或者cloudflare隧道等，那么您的服务器可能是HTTP的，这时候您可以设置ensureHTTPS为false, cookie不会被影响
    //如果您不使用HTTPS，可以忽略下面两个配置项
    sslcertpath : '/hjdczy.top/cert/Nginx/hjdczy.top.crt', // HTTPS证书路径
    sslkeypath : '/hjdczy.top/cert/Nginx/hjdczy.top.key', // HTTPS私钥路径
    host: '0.0.0.0', // 允许访问的主机
    port: 47839  // 添加端口配置

}

export default config;