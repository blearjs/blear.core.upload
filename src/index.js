/**
 * 文件上传 支持iframe html5
 * @author zcl
 * 2016-04-12 17:59
 */


'use strict';

var selector = require('blear.core.selector');
var attribute = require('blear.core.attribute');
var modification = require('blear.core.modification');
var ajax = require('blear.core.ajax');
var typeis = require('blear.utils.typeis');
var object = require('blear.utils.object');
var array = require('blear.utils.array');
var json = require('blear.utils.json');

var win = window;
var doc = win.document;
var iframeCount = 0;
var namespace = 'core-upload-';
var noop = function () {
    // empty
};
var defaults = {
    /**
     * 选择文件按钮
     * @type HTMLElement|String
     */
    fileEl: null,

    /**
     * A Binary Large OBject
     * @type Object
     */
    blob: null,

    /**
     * 是否可以选择多个文件
     * @type boolean
     */
    multiple: false,

    /**
     * 是否跨域，默认false
     * @type boolean
     */
    cross: false,

    /**
     * 提交方法
     * @type string
     */
    method: 'post',

    /**
     * 文件提交路径 默认根路径
     * @type string
     */
    url: '/',

    /**
     * 传输的数据
     * 如果是 iframe 传输，会转变为 input 的name value
     * @type Object
     */
    body: null,

    /**
     * 文件name
     * @type String
     */
    fileName: 'file',

    /**
     * 数据格式
     * @type String
     */
    dataType: 'json',

    /**
     * 上传进度
     * @type Function
     */
    onProgress: noop,

    /**
     * 上传成功后回调
     * @type Function
     */
    onSuccess: noop,

    /**
     * 上传失败后回调
     * @type Function
     */
    onError: noop,

    /**
     * 上传完成后回调
     * @type Function
     */
    onComplete: noop
};

function Uploader(options) {
    var the = this;

    options = the.options = object.assign(true, {}, defaults, options);
    the.fileEl = selector.query(options.fileEl)[0];
    the.iframeName = namespace + iframeCount++;
    the.standard = 'FormData' in window && !options.iframe;

    var oldComplete = options.onComplete;
    options.onComplete = function () {
        the.destroy();
        oldComplete.apply(the, arguments);
        options.onSuccess = options.onError = options.onComplete = options.onProgress = null;
    };

    the.start();
}

Uploader.prototype = {
    constructor: Uploader,


    /**
     * 创建 iframe
     */
    createIframe: function () {
        var the = this;
        var iframeEl = modification.create('iframe', {
            name: the.iframeName
        });

        attribute.hide(iframeEl);
        modification.insert(iframeEl);

        the.iframeEl = iframeEl;
    },

    /**
     * 创建 form
     */
    createForm: function () {
        var the = this;
        var options = the.options;

        var formEl = the.formEl = modification.create('form', {
            method: options.method,
            enctype: 'multipart/form-data',
            target: the.iframeName,
            action: options.url,
            style: {
                display: 'none'
            }
        });

        var body = options.body;

        object.each(body, function (key, val) {
            var inputEl = modification.create('input', {
                type: 'hidden',
                name: key,
                value: val
            });
            modification.insert(inputEl, formEl);
        });

        var originFileEl = the.fileEl;

        // 创建一个克隆 file
        var cloneFileEl = the.cloneEl = originFileEl.cloneNode();

        // 将克隆 file 插入到 file 后面
        modification.insert(cloneFileEl, originFileEl, 'afterend');

        // form 插入到文档中
        modification.insert(formEl);

        // file 插入到 form 里
        modification.insert(originFileEl, formEl);
    },


    /**
     * form 上传
     */
    uploadForm: function () {
        var the = this;
        var options = the.options;

        the.createIframe();
        the.createForm();

        the.iframeEl.onload = function () {
            alert('iframe upload');
            the.iframeEl.onload = null;

            var response;
            try {
                response = this.contentWindow.document.body.innerHTML;
                response = json.safeParse(response);

                if (response === null) {
                    var e = new Error('上传响应数据解析失败');
                    options.onError(e);
                    return options.onComplete(e);
                }

                options.onSuccess(response);
                options.onComplete(null, response);
            } catch (e) {
                options.onError(e);
                options.onComplete(e);
            }
        };

        var submitEl = the.submitEl = modification.create('input', {
            type: 'submit'
        });
        modification.insert(submitEl, the.formEl);
        submitEl.click();
    },


    /**
     * ajax 上传
     */
    uploadAjax: function () {
        var the = this;
        var options = the.options;
        var form = new FormData(the.form);
        var filename = the.fileEl.value.match(/[^\\\/]*$/)[0] || 'anonymous';

        form.append(options.fileName, options.blob ?
                options.blob :
                (options.multiple ? the._files : the._files[0]),
            filename
        );

        object.each(options.body, function (key, val) {
            form.append(key, val);
        });

        ajax({
            url: options.url,
            method: options.method,
            crossDomain: options.cross,
            body: form,
            dataType: options.dataType,
            onProgress: options.onProgress,
            onSuccess: options.onSuccess,
            onError: options.onError,
            onComplete: options.onComplete
        });
    },

    start: function () {
        var the = this;

        the._files = the.fileEl.files || [{
                name: the.fileEl.value
            }];

        if (the.standard) {
            the.uploadAjax();
        } else {
            the.uploadForm();
        }
    },

    /**
     * 销毁实例
     */
    destroy: function () {
        var the = this;

        if (!the.standard) {
            try {
                // 尝试插入到原位置，忽略错误
                modification.insert(the.fileEl, the.cloneEl, 'afterend');
                modification.remove(the.cloneEl);
            } catch (err) {
                // ignore
            }

            // 删除 form
            modification.remove(the.formEl);

            // 删除 iframe
            modification.remove(the.iframeEl);
        }
    }
};


/**
 * 上传
 * @param options
 * @returns {Uploader}
 */
module.exports = function (options) {
    return new Uploader(options);
};
