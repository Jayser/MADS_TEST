(function (doc, win) {

    var apps = win.apps = win.apps || {},
        utils = apps.utils = apps.utils || {};

    utils.extend = function (obj, props) {
        for (var prop in props) {
            if (props.hasOwnProperty(prop)) {
                obj[prop] = props[prop];
            }
        }
        return obj;
    };

    utils.isTouchDevice = function () {
        try {
            document.createEvent("TouchEvent");
            return true;
        } catch (e) {
            return false;
        }
    };

    utils.tpl = function (str, obj) {
        return str.replace(/\{\{(.*?)\}\}/g, function (match, token) {
            return obj[token];
        });
    };

    utils.inherit = function (Child, Parent) {
        var F = function () {};
        F.prototype = Parent.prototype;
        Child.prototype = new F();
        Child.prototype.constructor = Child;
        Child.superclass = Parent.prototype;
    };

    utils.bind = function (fn, ctx) {
        return function () {
            return fn.apply(ctx, arguments);
        };
    };

    utils.getElemById = function (id) {
        return doc.getElementById(id);
    };

}(document, window));