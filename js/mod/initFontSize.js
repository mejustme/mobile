// ��ʼ��ȫ��HTML�����С ,��δ��벻�ܷ���$(function(){})�У���Ϊ��ʱDOMContentLoaded�¼��Ѿ�������ɣ�������ı�ȫ��font-size��С
(function (doc, win) {
    var docEl = doc.documentElement,
        resizeEvt = 'orientationchange' in window ? 'orientationchange' : 'resize',
        recalc = function () {
            console.log(1);
            var clientWidth = docEl.clientWidth;
            if (!clientWidth) return;
            docEl.style.fontSize = 30 * (clientWidth / 750) + 'px';
        };

    if (!doc.addEventListener) return;
    win.addEventListener(resizeEvt, recalc, false);
    doc.addEventListener('DOMContentLoaded', recalc, false);
})(document, window);