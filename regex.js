(function (undefined) {

    var regex = function () {
        this.current = '';
    };

    regex.constructor = regex;
    regex.fn = regex.prototype;

    regex.fn.add = function add(token) {
        this.current += token;
        return this;
    };

    regex.fn.finish = function finish() {
        return this.current;
    };

    regex.fn.startGroup = function startGroup() {
        return new group(this);
    };

    regex.tokens = regex.fn.tokens = {
        dot: '.',
        // TODO etc

        real_period: '\\.',
        real_question: '\\?',
        // TODO etc
    };

    var group = function (parent) {
        this.parent = parent;
        this.header = '(?:'; // non-capturing by default
        this.contents = '';
        this.footer = ')';
    };

    group.constructor = group;
    group.fn = group.prototype;

    group.fn.add = function add(token) {
        this.contents += token;
        return this;
    };

    group.fn.closeGroup = function closeGroup() {
        this.parent.add(this.header + this.contents + this.footer);
        return this.parent;
    };

    if (typeof define === 'function' && define.amd) {
        define([], regex);
    }
    else {
        window.regex = regex;
    }

}());
