function EventEmitter() {
    this._events = {};
}

EventEmitter.prototype.on = function (event, handler, times, context) {
    if (typeof times !== 'number') {
        context = times;
        times = null;
    }

    if (Object.prototype.toString.call(event) === '[object Object]') {
        for (var evt in event) {
            this.on(event[evt], handler, times, context);
        }

        return this;
    }

    var events = event.split(' ');
    if (events.length) {
        for (var i = 0; i < events.length; i++) {
            this.on(events[i], handler, times, context);
        }

        return this;
    }

    var p = event.split('.');

    var name = p[0];
    var namespace = p[1] ? p[1] : '___main___'; // FIXME

    var _events = this._events;

    if (_events[name] === undefined) {
        _events[name] = {};
    }

    if (_events[name][namespace] === undefined) {
        _events[name][namespace] = [];
    }

    var list = _events[name][namespace];

    for (var i = 0; i < list.length; i++) {
        if (list[i].handler === handler) return this;
    }

    list.push({
        context: context,
        handler: handler,
        times: times
    });

    return this;
};

EventEmitter.prototype.one = function (event, handler, context) {
    this.on(event, handler, 1, context);

    return this;
};
EventEmitter.prototype.off = function (event, handler) {
    var events = event.split(' ');
    if (events.length) {
        for (var i = 0; i < events.length; i++) {
            this.off(events[i], handler);
        }

        return this;
    }

    var p = event.split('.');

    var name = p[0];
    var namespace = p[1];

    var _events = this._events;

    if (name && namespace) {
        delete _events[name][namespace];
    } else if (name) {
        delete _events[name];
    } else {
        for (var event in events) {
            var index = events[event].indexOf(namespace);
            if (index !== -1) events[event].splice(index, 1);
        }
    }

    if (!namespace) {

    } else {
        delete this._events[name][namespace];
    }

    return this;
};
EventEmitter.prototype.events = function () {
    return this._events;
};
EventEmitter.prototype.emit = function (evt) {
    var p = evt.split('.');
    var args = [].slice.call(arguments, 1);

    var name = p[0];
    var namespace = p[1];

    if (!this._events[name]) return this;

    if (!namespace) {
        var e = this._events[name];
        for (var key in e) {
            var list = e[key];
            for (var i = 0, l = list.length; i < l; i++) {
                apply(list[i], args);
            }
        }
    } else {
        var list = this._events[name][namespace];
        if (list) {
            for (var i = 0, l = list.length; i < l; i++) {
                apply(list[i], args);
            }
        }
    }

    return this;
};