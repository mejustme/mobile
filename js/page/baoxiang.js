$(function(){
    /*------Ajax请求函数------*/
  var  $content = $('#content');
    function ajaxFun (obj,param){
        var shopsTplCompiled = _.template($('#J_shops').html());
        $.ajax({
            url: obj.data('url')
            ,data: param
            ,success: function(data){
                if(data.status === 'success'){
                    _.each(data.itemList,function(item){
                        $content.append(shopsTplCompiled(item));
                    });
                    lib.lazyload($('#content')[0],{
                        lazyClass:'lazy-load',
                        lazyHeight : 400
                    });
                }

            }
        })
    }//ajaxFun

    ajaxFun($content,{});


    function successCollect($ele){
        $ele.text('已收藏');
        $ele.removeClass('uncollected').addClass('collected');
    }
    function oneMore(){
        $('.page-title').text('你还有一次收藏赢宝箱的机会');

    }

    function doCollect(){
        successCollect($(this));
        var a = (Math.random()*10).toFixed(0);
        if(a >= 0 && a<= 3){
            $.pgwModal({
                target: '#J_onemore',
                titleBar : false,
                maxWidth: "30rem",
                mainClassName : 'onemoreModal',
                closeContent : ''
            });
        }else if(a > 3 && a<= 6){
            $.pgwModal({
                target: '#J_successModal',
                titleBar : false,
                maxWidth: "30rem",
                mainClassName : 'successModal',
                closeContent : ''
            });
        }else{
            $.pgwModal({
                target: '#J_failModal',
                titleBar : false,
                maxWidth: "30rem",
                mainClassName : 'failModal',
                closeContent : ''
            });
        }

        /*
         do收藏{
         if 收藏成功
         do获取宝箱
         {
         //服务端
         if用户今天第一次收藏{
         todo 更改显示，
         todo 更改类名，下次点击无效。
         if成功{
         后台发奖品
         前台提示成功
         告知APP任务完成，
         }
         else{
         提示开启宝箱"失败"
         提示赢得一次机会再打开
         dotitle显示还有一次机会
         }
         }//今天第一次收藏
         else{
         todo 提示今天已经领过宝箱
         todo 更改显示
         }
         }
         }//收藏成功
         else{
         什么都不做，提示网络错误，收藏失败
         }
         }

         */
    }
//绑定监听事件监听事件
    $('#content').on('click','.uncollected',doCollect);

});
