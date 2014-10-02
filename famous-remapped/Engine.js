define('famous/core/Engine', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    var Context = require('./Context');
    var EventHandler = require('./EventHandler');
    var OptionsManager = require('./OptionsManager');
    var Engine = {};
    var contexts = [];
    var nextTickQueue = [];
    var deferQueue = [];
    var lastTime = Date.now();
    var frameTime;
    var frameTimeLimit;
    var loopEnabled = true;
    var eventForwarders = {};
    var eventHandler = new EventHandler();
    var options = {
        containerType: 'div',
        containerClass: 'famous-container',
        fpsCap: undefined,
        runLoop: true
    };
    var optionsManager = new OptionsManager(options);
    var MAX_DEFER_FRAME_TIME = 10;
    Engine.step = function step() {
        var currentTime = Date.now();
        if (frameTimeLimit && currentTime - lastTime < frameTimeLimit)
            return;
        var i = 0;
        frameTime = currentTime - lastTime;
        lastTime = currentTime;
        eventHandler.emit('prerender');
        for (i = 0; i < nextTickQueue.length; i++)
            nextTickQueue[i].call(this);
        nextTickQueue.splice(0);
        while (deferQueue.length && Date.now() - currentTime < MAX_DEFER_FRAME_TIME) {
            deferQueue.shift().call(this);
        }
        for (i = 0; i < contexts.length; i++)
            contexts[i].update();
        eventHandler.emit('postrender');
    };
    function loop() {
        if (options.runLoop) {
            Engine.step();
            window.requestAnimationFrame(loop);
        } else
            loopEnabled = false;
    }
    window.requestAnimationFrame(loop);
    function handleResize(event) {
        for (var i = 0; i < contexts.length; i++) {
            contexts[i].emit('resize');
        }
        eventHandler.emit('resize');
    }
    window.addEventListener('resize', handleResize, false);
    handleResize();
    window.addEventListener('touchmove', function (event) {
        event.preventDefault();
    }, true);
    Engine.pipe = function pipe(target) {
        if (target.subscribe instanceof Function)
            return target.subscribe(Engine);
        else
            return eventHandler.pipe(target);
    };
    Engine.unpipe = function unpipe(target) {
        if (target.unsubscribe instanceof Function)
            return target.unsubscribe(Engine);
        else
            return eventHandler.unpipe(target);
    };
    Engine.on = function on(type, handler) {
        if (!(type in eventForwarders)) {
            eventForwarders[type] = eventHandler.emit.bind(eventHandler, type);
            if (document.body) {
                document.body.addEventListener(type, eventForwarders[type]);
            } else {
                Engine.nextTick(function (type, forwarder) {
                    document.body.addEventListener(type, forwarder);
                }.bind(this, type, eventForwarders[type]));
            }
        }
        return eventHandler.on(type, handler);
    };
    Engine.emit = function emit(type, event) {
        return eventHandler.emit(type, event);
    };
    Engine.removeListener = function removeListener(type, handler) {
        return eventHandler.removeListener(type, handler);
    };
    Engine.getFPS = function getFPS() {
        return 1000 / frameTime;
    };
    Engine.setFPSCap = function setFPSCap(fps) {
        frameTimeLimit = Math.floor(1000 / fps);
    };
    Engine.getOptions = function getOptions() {
        return optionsManager.getOptions.apply(optionsManager, arguments);
    };
    Engine.setOptions = function setOptions(options) {
        return optionsManager.setOptions.apply(optionsManager, arguments);
    };
    Engine.createContext = function createContext(el) {
        var needMountContainer = false;
        if (!el) {
            el = document.createElement(options.containerType);
            el.classList.add(options.containerClass);
            needMountContainer = true;
        }
        var context = new Context(el);
        Engine.registerContext(context);
        if (needMountContainer) {
            Engine.nextTick(function (context, el) {
                document.body.appendChild(el);
                context.emit('resize');
            }.bind(this, context, el));
        }
        return context;
    };
    Engine.registerContext = function registerContext(context) {
        contexts.push(context);
        return context;
    };
    Engine.nextTick = function nextTick(fn) {
        nextTickQueue.push(fn);
    };
    Engine.defer = function defer(fn) {
        deferQueue.push(fn);
    };
    optionsManager.on('change', function (data) {
        if (data.id === 'fpsCap')
            Engine.setFPSCap(data.value);
        else if (data.id === 'runLoop') {
            if (!loopEnabled && data.value) {
                loopEnabled = true;
                window.requestAnimationFrame(loop);
            }
        }
    });
    module.exports = Engine;
});