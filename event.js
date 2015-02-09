function EventEmitter() {
    this._events = {
        holdcalls: [],
        events: {},
        ns: {}
    };
}

EventEmitter.prototype.on = function (event, handler, times, context) {
    if (typeof times !== 'number') {
        context = times;
        times = null;
    }

    if (Object.prototype.toString.call(event) === '[object Object]') {
        context = times;
        times = handler;
        handler = undefined;
        for (var evt in event) {
            this.on(evt, event[evt], times, context);
        }

        return this;
    }

    var events = event.split(' ');
    if (events.length > 1) {
        for (var i = 0; i < events.length; i++) {
            this.on(events[i], handler, times, context);
        }

        return this;
    }


    var p = event.split('.');

    var name = p[0];
    var ns = p[1];

    if (!name) throw new Error("Empty name");

    var _events = this._events;
    var events = _events.events;

    if (events[name] === undefined) {
        events[name] = {
            main: [],
            ns: {}
        };
    }

    if (_events.holdcalls.indexOf(name) !== -1) {
        handler.call(context);
        if (times !== undefined) times--;
    }

    if (!ns) {
        events.main.push({
            ctx: context,
            handler: handler,
            times: times
        });

        return this;
    }

    if (events[name].ns[ns] === undefined) {
        events[name].ns[ns] = [];
    }

    if (_events.ns[ns] === undefined) {
        _events.ns[ns] = [];
    }

    var list = events[name].ns[ns];

    for (var i = 0; i < list.length; i++) {
        if (list[i].handler === handler) return this;
    }

    list.push({
        context: context,
        handler: handler,
        times: times
    });

    _events.ns[ns].push(name);

    return this;
};

EventEmitter.prototype.one = function (event, handler, context) {
    this.on(event, handler, 1, context);

    return this;
};

EventEmitter.prototype.off = function (event, handler) {
    var events = event.split(' ');

    if (events.length) {
        for (var i = 0, l = events.length; i < l; i++) {
            this.off(events[i], handler);
        }

        return this;
    }

    var p = event.split('.');

    var name = p[0];
    var ns = p[1];

    var _events = this._events;
    var events = _events.events;

    if (name && ns) {
        delete events[name].ns[ns];
    } else if (name) {
        delete events[name];
    } else if (ns) {
        var eventsByNs = _events.ns[ns];

        if (eventsByNs === undefined) return this;

        for (var i = 0, l = eventsByNs.length; i < l; i++) {
            delete _events[eventsByNs[i]].ns[ns];
        }
    }

    if (!ns) {

    } else {
        delete this._events[name][ns];
    }

    return this;
};
EventEmitter.prototype.emit = function (event) {
    var events = event.split(' ');

    var args = [].slice.call(arguments, 1);

    if (events.length > 1) {
        for (var i = 0; i < events.length; i++) {
            args.unshift(events[i]);
            this.emit.apply(this, args);
        }
    }

    var p = event.split('.');

    var name = p[0];
    var ns = p[1];


    if (ns && name) {
        var e = this._events.events[name];
        var data = e.ns[ns];
        if (data.times) data.handler.apply(data.context, args);
    } else if (name) {
        var e = this._events.events[name];

        for (var key in e) {
            var list = e[key];
            for (var i = 0, l = list.length; i < l; i++) {
                var data = list[i];
                if (data.times) data.handler.apply(data.context, args);
            }
        }
    } else if (ns) {
        var list = this._events.ns[ns];
        if (list.length > 0) {
            for (var i = 0, l = list.length; i < l; i++) {
                var name = list[i];
                var data = this._events.events[name].ns[ns];
                if (data.times) data.handler.apply(data.context, args);
            }
        }
    }

    return this;
};
