/**
 * @fileoverview Lazyload  2.0.0
 * @module lazyload
 * @author caochun.cr || wanyan.wz
 * @since 2014-03-17
 * @description 此次修改剥离zepto,增加容器内部lazy,且支持图片lazy完销毁事件
 */
;(function(win,lib){
    //一些常量
    var ITEMREALSRC = 'data-img';
    var ITEMRealSIZE = 'data-size';
    var REGSRCRULE = /_(\d+x\d+|cy\d+i\d+|sum|m|b)?(xz|xc)?(q\d+)?(s\d+)?(\.jpg)?$/i;
    var NATIVERESPOND = 200;
    var DOC = win.document;
    var IMGREG = /(^https?:)?\/\/.*(?:alicdn|taobaocdn|taobao)\.(com|net)\/.*(?:\.(jpg|png|gif|jpeg|webp))?$/gi;

    //lazyload需要使用的一些方法
    //var filter = Array.prototype.filter;
    var Utils = {
        extend : function(target,source){
            for(var k in source){
                target[k] = source[k];
            }
        },
        filter : function(arr){
            return arr.filter(function(item){
                return !!item;
            });
        },
        addEvent : function(obj,type,callback){
            obj.addEventListener(type,callback,false);
        },
        removeEvent : function(obj,type,callback){
            obj.removeEventListener(type,callback,false);
        },
        getTime : function(){
            return Date.now ? Date.now() : new Date().getTime();
        },
        //是否js的Object
        isJsonObject : function(obj){
            return typeof obj === 'object' && Object.getPrototypeOf(obj) === Object.prototype;
        },
        //是否在主客内
        uaInTaobaoApp : function(){
            var userAgent = navigator.userAgent;
            if(userAgent.match(/WindVane/i) != null){
                return true;
            }
            else{
                return false;
            }
        },
        /*
         获取url参数
         传入key可获取url中对应的value，若不传，则返回所有参数Object
         @key [String] 参数名
         */
        getParamVal : function (key) {
            var params = win.location.search.slice(1);
            var result = {};
            if(params !== ''){
                var kvs = params.split('&');
                var kv;
                for(var i = 0,len = kvs.length;i < len;i++){
                    kv = kvs[i].split('=');
                    result[kv[0]] = kv[1] || '';
                }
            }
            return key ? result[key] : result;
        },
        //获取降级图片参数
        getQ : function(data){
            var network = data ? data : this.getParamVal('getStatus');
            var q = '';
            switch(network){
                case 'false':
                    q = 'q90';
                    break;
                case 'true':
                    q = 'q75';
                    break;
                case '_noq': //不加后缀q
                    q = '';
                    break;
                default:
                    q = network;
                    break;
            }
            return q;
        },
        //获取用户当前ios系统版本
        fetchVersion : function(){
            var systemVer = navigator.appVersion.match(/(iPhone\sOS)\s([\d_]+)/);
            var isPhone = systemVer && true || false;
            var version = isPhone && systemVer[2].split('_');
            version = version && parseFloat(version.length > 1 ? version.splice(0,2).join('.') : version[0],10);
            var result = isPhone && version < 6;
            //console.log(result);
            this.fetchVersion = function(){return result;}
            return result;
        },
        //获取元素坐标@obj [DOM Element]
        getOffset : function(obj,param){
            if(!obj) return;
            if(!param){
                param = {x:0 , y:0};
            }
            if(obj != win){
                var el = obj.getBoundingClientRect();
                var l = el.left;
                var t = el.top;
                var r = el.right;
                var b = el.bottom;
            }
            else{
                l = 0;
                t = 0;
                r = l + obj.innerWidth;
                b = t + obj.innerHeight;
            }
            return{
                'left' : l,
                'top' : t,
                'right' : r + param.x,
                'bottom' : b + param.y
            };
        },
        //元素位置比较@d1 @d2 [Object]
        compare : function(d1,d2){
            var left = d2.right > d1.left && d2.left < d1.right,
                top = d2.bottom > d1.top && d2.top < d1.bottom;
            return left && top;
        },
        /*
         @url [String] 图片地址
         @size [String] 图片后缀尺寸(200x200)
         */
        setImgSrc : function(url,size,q){
            if(!url) return;
            if(url.match(IMGREG) == null){
                return url;
            }
            q = q || '';
            size = size || '';
            //查找最后一个，url中可能存在_.
            var arr = url.lastIndexOf('_.');
            //取到_.后的字符串
            var last = arr != -1 ? url.slice(arr+2) : null;
            //是否webp
            var isWebp = last && last.toLowerCase() == 'webp' ? true : false;
            var newurl = isWebp ? url.slice(0,arr) : url;

            //var REGSRCRULE = /_(\d+x\d+|cy\d+i\d+|sum|m|b)?(xz|xc)?(q\d+)?(s\d+)?\.jpg?/i;
            var urlMartch = newurl.match(REGSRCRULE);
            if(urlMartch != null){
                //console.log(urlMartch);
                var reg1 = urlMartch[1] || size;
                var reg3 = urlMartch[3] || q;
                var src = newurl.replace(REGSRCRULE,'_' + reg1 + (urlMartch[2] || '') + reg3 + (urlMartch[4] || '') +'.jpg');
            }
            else{
                if(size || q){
                    newurl += '_';
                    newurl += size;
                    newurl += q;
                    newurl += '.jpg';
                }
                src = newurl;
            }
            return isWebp && (src + '_.webp') || src;
        },
        /*
         @url [String] 图片地址
         */
        clearImgSrc : function(url){
            if(!url || typeof url !== 'string') return;
            return url.replace(REGSRCRULE,'');
        }
    };
    //lazyload constructor
    var Lazyload = function(el,option){
        if(!el && !option){
            el = win;
        }
        else if(Utils.isJsonObject(el)){
            option = el;
            el = win;
        }
        var obj = typeof el === 'string' ? DOC.querySelector(el) : el;
        if(!obj) return;
        this.Container = obj;
        this.reset(option || {});
        this.attachMethod();
        this.getItem();
        this.filterItem();
    }
    Lazyload.prototype = {
        /*
         option [Object] 配置
         @lazyHeight [Number] 预加载当前屏幕以下lazyHeight内的图片
         @lazyWidth [Number] 预加载当前屏幕右边lazyWidth内的图片
         @lazyClass [String] 懒加载元素的class
         @definition [Boolean] 在retina屏或高清屏开启高清图片(size大小),默认值false
         @size [String || Object] 图片尺寸大小，默认直接去掉后缀使用原图大小;
         支持多种DPI{'1.5' : '120x120' , '2' : '180x180' , 'default' : '120x120'},default用来垫底,android机器DPR有1.35,1.75
         @autoDestroy [Boolean] 元素都呈现后是否清除事件,默认true
         @q [String] 和客户端内接口参数值保持一致，'false'表示强网络q90,'true'表示弱网络q75,'_noq'表示不加q参数,或者传任意符合ali图片服务器的q值(q30,q50等)。参数配置优先级最高,其次客户端接口，再次url中的getStatus参数
         @loadCallback [Function] 图片加载完后load触发的回调
         @errorCallback [Function] 图片加载完后error触发的回调
         */
        reset : function(option){
            var op = {
                lazyHeight : 400,
                lazyWidth : 0,
                lazyClass : 'lb-lazy',
                definition : false,
                autoDestroy : true,
                q : ''
            };
            var extend = Utils.extend;
            //和默认配置合并
            var defaultAttr = this.defaultAttr;
            if(defaultAttr){
                extend(option,defaultAttr);
            }
            extend(op,option);
            //得到q后缀值
            var q = op.q;
            if(typeof q === 'Boolean'){
                q = q.toString();
            }
            op.q = Utils.getQ(q);

            var devicePixelRatio = win.devicePixelRatio;
            //配置true且devicePixelRatio大于1，认为是高清屏(部分安卓机器是1.5)
            op.definition = op.definition && devicePixelRatio && devicePixelRatio > 1 || false;
            var size = op.size;
            if(size){
                size = typeof size === 'object' ? (size[devicePixelRatio] || size['default']) : size;
            }
            op.size = size || '';
            var lazyClass = op.lazyClass;
            op.lazyClass = lazyClass.charAt(0) !== '.' ? lazyClass : lazyClass.slice(1);
            op.lazyClassReg = new RegExp('(^|\\s)' + op.lazyClass + '(\\s|$)');
            this.defaultAttr = option;
            this.attr = op;
        },
        /*
         @key [String] 获取当前attr中key的value
         */
        get : function(key){
            return key ? this.attr[key] : null;
        },
        //可重新配置参数,须和上一次的配置参数合并
        fireEvent : function(option){
            var that = this;
            option && that.reset(option);
            that.getItem();
            that.filterItem();
        },
        handleEvent : function(e){
            var type = e.type;
            if(type === 'scroll'){
                this.filterItem();
            }
            else if(type === 'touchstart'){
                this.tstart();
            }
            else if(type === 'touchend'){
                this.tend();
            }
        },
        tstart : function(){
            this._touchLazy = {
                sy : win.pageYOffset,
                time : Utils.getTime()
            };
            this._timerPhone && clearTimeout(this._timerPhone);
        },
        tend : function(){
            var that = this;
            var _touchLazy = that._touchLazy;
            var disty = Math.abs(win.pageYOffset - _touchLazy.sy);
            if(disty > 5){
                var timedist = Utils.getTime() - _touchLazy.time;
                that._timerPhone = setTimeout(function(){
                    that.filterItem();
                    that.touchLazy = {};
                    clearTimeout(that._timerPhone);
                    that._timerPhone = null;
                },timedist > 100 ? 0 : 10);
            }
        },
        //添加方法
        attachMethod : function(){
            var addEvent = Utils.addEvent;
            addEvent(win,'scroll',this);
            var isPhone = Utils.fetchVersion();
            if(isPhone){
                addEvent(DOC,'touchstart',this);
                addEvent(DOC,'touchend',this);
                //DOC.addEventListener('touchstart',this,false);
                //DOC.addEventListener('touchend',this,false);
            }
        },
        destroy : function(){
            var removeEvent = Utils.removeEvent;
            removeEvent(win,'scroll',this);
            var isPhone = Utils.fetchVersion();
            if(isPhone){
                removeEvent(DOC,'touchstart',this);
                removeEvent(DOC,'touchend',this);
                //DOC.removeEventListener('touchstart',this,false);
                //DOC.removeEventListener('touchend',this,false);
            }
        },
        //获取lazy的元素
        getItem : function(){
            var that = this;
            var Container = that.Container;
            var itemList = that.itemList;
            if(itemList){
                for(var i=0,len=itemList.length;i<len;i++){
                    itemList[i] && (itemList[i].onerror = itemList[i].onload = null);
                }
            }
            Container = Container === win ? DOC : Container;
            var arr = Container.querySelectorAll('.' + that.get('lazyClass'));
            var tmparr = [];
            for(var i=0,len=arr.length;i<len;i++){
                tmparr.push(arr[i]);
            }
            that.itemList = tmparr;
        },
        filterItem : function(){
            var that = this;
            var util = Utils;
            var Container = that.Container;
            var param = {
                x : that.get('lazyWidth'),
                y : that.get('lazyHeight')
            };
            //console.log(param);
            //容器内的，需容器在当前显示区域,才能加载容器内的元素
            /*if(Container !== win){
             if(!util.compare(util.getOffset(win,param),util.getOffset(Container))){
             return;
             }
             }*/
            var itemList = that.itemList;
            var filterList = util.filter(itemList);
            if(filterList && filterList.length){
                for(var i=0,len=itemList.length;i<len;i++){
                    if(itemList[i]){
                        //console.log(util.getOffset(itemList[i]))
                        if(util.compare(util.getOffset(win,param),util.getOffset(itemList[i]))){
                            that.fetchItem(itemList[i],i);
                        }
                    }
                }
            }
            else if(that.get('autoDestroy')){
                that.destroy();
            }
        },
        fetchItem : function(self,n){
            var that = this;
            var original = self.getAttribute(ITEMREALSRC);
            var datasize = self.getAttribute(ITEMRealSIZE);
            var q = that.get('q');
            //不存在表示图片正在加载，且未完成加载
            if(!original){
                //that.removeItemAttr(self,n);
                return;
            }
            if(that.get('definition')){
                //datasize优先级高，不存在则取attr中的size
                if(!datasize){
                    datasize = that.get('size');
                }
            }
            original = Utils.setImgSrc(original,datasize,q);
            self.removeAttribute(ITEMREALSRC);
            self.removeAttribute(ITEMRealSIZE);
            if (self.tagName === 'IMG') {
                self.src = original;
            } else {
                self.style.backgroundImage = 'url(' + original + ')';
            }

            if(!self.onload){
                self.onload = function(){
                    //that.removeItemAttr(this,n);
                    that.loadItem(this,n)
                };
                self.onerror = function(){
                    //that.removeItemAttr(this,n);
                    that.errorItem(this,n)
                };
            }
        },
        loadItem : function(self,n){
            this.removeItemAttr(self,n);
            if(this.get('loadCallback')){
                this.get('loadCallback').call(self);
            }
            //console.log(this.itemList);
        },
        errorItem : function(self,n){
            this.removeItemAttr(self,n);
            if(this.get('errorCallback')){
                this.get('errorCallback').call(self);
            }
        },
        removeItemAttr : function(self,n){
            var that = this;
            self.className = self.className.replace(that.get('lazyClassReg'),'');
            self.onerror = self.onload = null;
            that.itemList[n] = null;
        }
    };
    Lazyload.prototype.constructor = Lazyload;
    lib.lazyload = function(el,option){
        return new Lazyload(el,option);
    }
    lib.lazyload.setImgSrc = Utils.setImgSrc;
    lib.lazyload.clearImgSrc = Utils.clearImgSrc;
    //客户端网络状态
    lib.lazyload.getNetWork = function(callback){
        var WindVane = win['WindVane'];
        if(Utils.uaInTaobaoApp()){ //在客户端内
            if(WindVane){
                WindVane.call('TBWeakNetStatus','getStatus','',function(r){
                        callback(r.WeakNetStatus);
                    },
                    function(e){
                        callback();
                    },NATIVERESPOND);
            }
        }
        else{
            callback();
        }
    }
})(window, window['lib'] || (window['lib'] = {}))