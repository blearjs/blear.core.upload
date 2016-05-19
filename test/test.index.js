/**
 * 测试 文件
 * @author ydr.me
 * @create 2016-05-17 12:13
 */


'use strict';

var upload = require('../src/index.js');
var selector = require('blear.core.selector');
var event = require('blear.core.event');

var doc = document;


describe('测试文件', function () {
    it('upload/ajax', function (done) {

        var oDiv1 = doc.createElement('div');
        doc.body.appendChild(oDiv1);

        oDiv1.innerHTML = '<button id="send1">send</button><input type="file" id="ipt1">';


        var ipt = selector.query('#ipt1')[0];
        var send = selector.query('#send1')[0];

        upload({
            fileEl: ipt,
            fileName: 'test',
            submitEl: send,
            dataType: 'text',
            body: {name: 'zcl'},
            cross: true,
            action: '/upload/ajax/',
            onSuccess: function (data) {
                expect(data).toEqual('success');
                done();
            }
        });

        event.emit(ipt, 'change');
        event.emit(send, 'click');
    });

    it('upload/iframe', function (done) {
        var oDiv2 = doc.createElement('div');
        doc.body.appendChild(oDiv2);

        oDiv2.innerHTML = '<button id="send2">send</button><input type="file" id="ipt2">';


        var ipt = selector.query('#ipt2')[0];
        var send = selector.query('#send2')[0];

        upload({
            iframe: true,
            fileEl: ipt,
            submitEl: send,
            fileName: 'test',
            body: {name: 'zcl'},
            action: '/upload/iframe/',
            onSuccess: function (data) {
                expect(data.indexOf('success') > -1).toEqual(true);
                done();
            },
            onError: function (msg) {
                done();
            }
        });

        event.emit(ipt, 'change');
        event.emit(send, 'click');
    });
});
