---
layout: post
title: ssl 证书文件获取与 node 环境下的配置
---

# ssl证书文件获取与node环境下的配置

前两天个人小站域名到期（其实也是忘续了），有点空就收拾了一下，申请了新的域名上线。
带来的问题是，站点一直用 https，换域名后原 ssl 签名证书也就无效了，这又得再申请一个。

以这个契机，就来完整的说一下 https 站点 ssl 证书的 **生成/获取、服务器配置(以 nodejs 为例)** 方法。

## ssl 证书生成

**生成** 和 **获取** 是两种得到签名文件方法。
自己生成的一般都是非法的，只用于非正式环境等，要是线上的话，唯一途经就是去正规证书颁发机构去申请，有时也会遇到自己生成签名的时候，下面给出一个很简单的方法。

大致分为三步

#### 生成自己的私钥 和 CSR

> openssl req -new -newkey rsa:2048 -nodes -keyout ca.key -out ca.csr

这一步需要填写一些 ca 机构的相关信息，如国家、地区、邮箱等等，大家就按提示一步一步往下走就OK了。

#### 生成签名

> openssl x509 -req -days 365 -in ca.csr -signkey ca.key -out cert.crt

#### node 服务器配置

运行后会生成三个文件，实际只需要两个，因为没有 ca 机构证书，当然 ca 文件也可以自己生成，但实际没有意义，一般用两个文件按以下配置就行：

~~~javascript
{
    key: fs.readFileSync('SSL/ca.key'),
    cert: fs.readFileSync('SSL/cert.crt')
}
~~~

## ssl 证书获取

这个过程因为是在第三方机构上申请，所以就麻烦不少。我个人从 Wosign 和 Let's encrypt 上面申请过，两个过程完全不同，下面就分别说一下。

### Wosign 沃通

[沃通](https://www.wosign.com/)是国内最大 ssl 签名颁发机构，之前也推出过免费证书业务，但是去年底停止了，据说是因为免费证书申请的审核不严，加密算法还用的是 sha-1，遭到 mozila 和 google 的联合抵制，然后就玩完了。
不过它的收费业务还是有效的，大家可以放心申请。

过程相对比较简单，填写一张表单就行，它同时会对你要申请的域名进行检测，没有备案要求，等一切步骤走完，就可以领取一个装有签名文件的压缩包，压缩包是加密的，密码只能人从 wosign 领取一次，打开后一定妥善保管。

里面一此文件夹按常见服务器的分类，实际内容都一样，方便用户一下找到，但是没有 nodejs 的，实际用 apache 的那套证书就可以了，如下：

~~~javascript
// xxx 是你申请的域名，注意前的文件序号就行
{
    key: fs.readFileSync('3_xxx.key'),          
    cert: fs.readFileSync('2_xxx.crt'),
    ca: fs.readFileSync('1_root_bundle.crt'),
}
~~~

### Let's encrypt

[Let's encrypt](https://letsencrypt.org/) 现在影响力越来越大，是 mozila 和 google 合力为了推广 https 而支持的技术提供站点（看了一眼沃通💡~？）。
只提供免费的证书，但你可别想简单了，google 推的东西技术含量都不低。
笔者刚一上去也没反应过来，而且市面上相关资料很少，硬着头皮看了一个多小时的英文文档才开始下手搞起。😫

它的获取方式不像传统申请审核那样中规中矩，一切通过设计好的命令和代码搞定，中间没有人工干预。
签名文件在获取过程中都是隐式的，直接生成在你的服务器上，从面解决了签名在网络上传输的安全问题，而且对一些常用的服务器，如 nginx，它还会自动识别、自动部署签名，非常腻害。
但是没有 nodejs 的。。。

实际过程中自动化程度非常高，需要操作的步骤也很少，但前提是要弄明白怎么回事，否则下不了手。。。以 centOS_7 为例，说一下获取过程，也是本文的重点内容。

#### 安装 certbot

certbot 是自动获取证书的一个命令工具包，也是所有过程的前提，安装这个比较简单，用 yum ：

> $ sudo yum install certbot

> 注：如果没有此工具，先运行一下：
> $ yum install epel-release

#### 自己站点的准备

* 保证自己站内对外访问良好
* 提供一个类似静态资源目录的对外可访问目录，如：/usr/www/static/，使得对外链接 www.your_web.com/aaa/bbb.js 可以访问到 /usr/www/static/aaa/bbb.js 文件

#### 命令行获取

以上都准备好后，就开始正式获取了。运行：

> $ certbot certonly

~~~shell
-------------------------------------------------------------------------------
1: Place files in webroot directory (webroot)
2: Spin up a temporary webserver (standalone)
-------------------------------------------------------------------------------
~~~

会出现两种获取方式的选择，我先的是第一种，感觉更方便一些。

~~~shell
Please enter in your domain name(s) (comma and/or space separated)  (Enter 'c' to cancel):
~~~

输入你的站点域名，用逗号/空格分隔： 比如`xxx.com, www.xxx.com`

~~~shell
-------------------------------------------------------------------------------
1: Enter a new webroot
-------------------------------------------------------------------------------
~~~

到了这一步稍麻烦点，它是让你输入本地站点目录的绝对路径，不过不一定就是你想得这样。
它的目的是要检测你对该网站的控制权，要在你输入的目录里放置静态校验文件，然后进行远程校验，
所以我们需要把网站的静态资源文件目录给它，要求再回去看 **自己站点的准备** 那一节。

如我们输入： `/usr/www/static` 就行。

如果你之前绑定只是一个域名，到这就结束了，如果多个域名的话，会显示： 

~~~shell
Select the webroot for www.xxx.ml:
-------------------------------------------------------------------------------
1: Enter a new webroot
2: /root/www/static
-------------------------------------------------------------------------------
~~~

如果目录一致，我们可以直接 2。

#### 签名文件的使用

上述过程成功后，会提示：

~~~shell
Waiting for verification...
Cleaning up challenges
Generating key (2048 bits): /etc/letsencrypt/keys/0000_key-certbot.pem
Creating CSR: /etc/letsencrypt/csr/0000_csr-certbot.pem

IMPORTANT NOTES:
 - Congratulations! Your certificate and chain have been saved at
   /etc/letsencrypt/live/xxx.ml/fullchain.pem. Your cert will
   expire on 2017-06-07. To obtain a new or tweaked version of this
   certificate in the future, simply run certbot again. To
   non-interactively renew *all* of your certificates, run "certbot
   renew"
 - If you like Certbot, please consider supporting our work by:

   Donating to ISRG / Let's Encrypt:   https://letsencrypt.org/donate
   Donating to EFF:                    https://eff.org/donate-le
~~~

同时在 `/etc/letsencrypt/` 路径下生成一组签名文件：

~~~shell
accounts  archive  csr  keys  live  renewal
~~~

其中我们需要的是 live 那组，里面有你域名一致的一个文件夹，包含四个签名文件：

~~~shell
cert.pem  chain.pem  fullchain.pem  privkey.pem
~~~

和 nodejs https 的对应关系是：

~~~javascript
// xxx 是你申请的域名，注意前的文件序号就行
{
    key: fs.readFileSync('privkey.pem'),          
    cert: fs.readFileSync('cert.pem'),
    ca: fs.readFileSync('fullchain.pem'),
}
~~~

配置好，重启服务器，再打开你的站点，是不是已经变成：

![/img/brower_https.png](/img/brower_https.png)

过程看起来很简单，前提是你知道这个过程。以后证书就它了。

#### 后续延长证书有效期

能过以上方法顺利获取的证书有效期只有三个月，快到期的时候记得去续期，这个也很简单，只需要执行：

~~~bash
$ certbot renew
~~~

然后按照提示往下走几步就可以了。这样就又有三个月有效期了。

---

> 引用：  
> https://certbot.eff.org/docs/using.html#webroot  
> https://certbot.eff.org/#centosrhel7-other  
> https://community.letsencrypt.org/t/how-to-get-crt-and-key-files-from-i-just-have-pem-files/7348


