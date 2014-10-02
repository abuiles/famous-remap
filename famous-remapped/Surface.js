define('famous/core/Surface', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    var Entity = require('./Entity');
    var EventHandler = require('./EventHandler');
    var Transform = require('./Transform');
    var devicePixelRatio = window.devicePixelRatio || 1;
    var usePrefix = document.createElement('div').style.webkitTransform !== undefined;
    function Surface(options) {
        this.options = {};
        this.properties = {};
        this.content = '';
        this.classList = [];
        this.size = null;
        this._classesDirty = true;
        this._stylesDirty = true;
        this._sizeDirty = true;
        this._contentDirty = true;
        this._dirtyClasses = [];
        this._matrix = null;
        this._opacity = 1;
        this._origin = null;
        this._size = null;
        this.eventForwarder = function eventForwarder(event) {
            this.emit(event.type, event);
        }.bind(this);
        this.eventHandler = new EventHandler();
        this.eventHandler.bindThis(this);
        this.id = Entity.register(this);
        if (options)
            this.setOptions(options);
        this._currTarget = null;
    }
    Surface.prototype.elementType = 'div';
    Surface.prototype.elementClass = 'famous-surface';
    Surface.prototype.on = function on(type, fn) {
        if (this._currTarget)
            this._currTarget.addEventListener(type, this.eventForwarder);
        this.eventHandler.on(type, fn);
    };
    Surface.prototype.removeListener = function removeListener(type, fn) {
        this.eventHandler.removeListener(type, fn);
    };
    Surface.prototype.emit = function emit(type, event) {
        if (event && !event.origin)
            event.origin = this;
        var handled = this.eventHandler.emit(type, event);
        if (handled && event && event.stopPropagation)
            event.stopPropagation();
        return handled;
    };
    Surface.prototype.pipe = function pipe(target) {
        return this.eventHandler.pipe(target);
    };
    Surface.prototype.unpipe = function unpipe(target) {
        return this.eventHandler.unpipe(target);
    };
    Surface.prototype.render = function render() {
        return this.id;
    };
    Surface.prototype.setProperties = function setProperties(properties) {
        for (var n in properties) {
            this.properties[n] = properties[n];
        }
        this._stylesDirty = true;
    };
    Surface.prototype.getProperties = function getProperties() {
        return this.properties;
    };
    Surface.prototype.addClass = function addClass(className) {
        if (this.classList.indexOf(className) < 0) {
            this.classList.push(className);
            this._classesDirty = true;
        }
    };
    Surface.prototype.removeClass = function removeClass(className) {
        var i = this.classList.indexOf(className);
        if (i >= 0) {
            this._dirtyClasses.push(this.classList.splice(i, 1)[0]);
            this._classesDirty = true;
        }
    };
    Surface.prototype.setClasses = function setClasses(classList) {
        var i = 0;
        var removal = [];
        for (i = 0; i < this.classList.length; i++) {
            if (classList.indexOf(this.classList[i]) < 0)
                removal.push(this.classList[i]);
        }
        for (i = 0; i < removal.length; i++)
            this.removeClass(removal[i]);
        for (i = 0; i < classList.length; i++)
            this.addClass(classList[i]);
    };
    Surface.prototype.getClassList = function getClassList() {
        return this.classList;
    };
    Surface.prototype.setContent = function setContent(content) {
        if (this.content !== content) {
            this.content = content;
            this._contentDirty = true;
        }
    };
    Surface.prototype.getContent = function getContent() {
        return this.content;
    };
    Surface.prototype.setOptions = function setOptions(options) {
        if (options.size)
            this.setSize(options.size);
        if (options.classes)
            this.setClasses(options.classes);
        if (options.properties)
            this.setProperties(options.properties);
        if (options.content)
            this.setContent(options.content);
    };
    function _addEventListeners(target) {
        for (var i in this.eventHandler.listeners) {
            target.addEventListener(i, this.eventForwarder);
        }
    }
    function _removeEventListeners(target) {
        for (var i in this.eventHandler.listeners) {
            target.removeEventListener(i, this.eventForwarder);
        }
    }
    function _cleanupClasses(target) {
        for (var i = 0; i < this._dirtyClasses.length; i++)
            target.classList.remove(this._dirtyClasses[i]);
        this._dirtyClasses = [];
    }
    function _applyStyles(target) {
        for (var n in this.properties) {
            target.style[n] = this.properties[n];
        }
    }
    function _cleanupStyles(target) {
        for (var n in this.properties) {
            target.style[n] = '';
        }
    }
    function _formatCSSTransform(m) {
        m[12] = Math.round(m[12] * devicePixelRatio) / devicePixelRatio;
        m[13] = Math.round(m[13] * devicePixelRatio) / devicePixelRatio;
        var result = 'matrix3d(';
        for (var i = 0; i < 15; i++) {
            result += m[i] < 0.000001 && m[i] > -0.000001 ? '0,' : m[i] + ',';
        }
        result += m[15] + ')';
        return result;
    }
    var _setMatrix;
    if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
        _setMatrix = function (element, matrix) {
            element.style.zIndex = matrix[14] * 1000000 | 0;
            element.style.transform = _formatCSSTransform(matrix);
        };
    } else if (usePrefix) {
        _setMatrix = function (element, matrix) {
            element.style.webkitTransform = _formatCSSTransform(matrix);
        };
    } else {
        _setMatrix = function (element, matrix) {
            element.style.transform = _formatCSSTransform(matrix);
        };
    }
    function _formatCSSOrigin(origin) {
        return 100 * origin[0] + '% ' + 100 * origin[1] + '%';
    }
    var _setOrigin = usePrefix ? function (element, origin) {
        element.style.webkitTransformOrigin = _formatCSSOrigin(origin);
    } : function (element, origin) {
        element.style.transformOrigin = _formatCSSOrigin(origin);
    };
    var _setInvisible = usePrefix ? function (element) {
        element.style.webkitTransform = 'scale3d(0.0001,0.0001,1)';
        element.style.opacity = 0;
    } : function (element) {
        element.style.transform = 'scale3d(0.0001,0.0001,1)';
        element.style.opacity = 0;
    };
    function _xyNotEquals(a, b) {
        return a && b ? a[0] !== b[0] || a[1] !== b[1] : a !== b;
    }
    Surface.prototype.setup = function setup(allocator) {
        var target = allocator.allocate(this.elementType);
        if (this.elementClass) {
            if (this.elementClass instanceof Array) {
                for (var i = 0; i < this.elementClass.length; i++) {
                    target.classList.add(this.elementClass[i]);
                }
            } else {
                target.classList.add(this.elementClass);
            }
        }
        target.style.display = '';
        _addEventListeners.call(this, target);
        this._currTarget = target;
        this._stylesDirty = true;
        this._classesDirty = true;
        this._sizeDirty = true;
        this._contentDirty = true;
        this._matrix = null;
        this._opacity = undefined;
        this._origin = null;
        this._size = null;
    };
    Surface.prototype.commit = function commit(context) {
        if (!this._currTarget)
            this.setup(context.allocator);
        var target = this._currTarget;
        var matrix = context.transform;
        var opacity = context.opacity;
        var origin = context.origin;
        var size = context.size;
        if (this._classesDirty) {
            _cleanupClasses.call(this, target);
            var classList = this.getClassList();
            for (var i = 0; i < classList.length; i++)
                target.classList.add(classList[i]);
            this._classesDirty = false;
        }
        if (this._stylesDirty) {
            _applyStyles.call(this, target);
            this._stylesDirty = false;
        }
        if (this._contentDirty) {
            this.deploy(target);
            this.eventHandler.emit('deploy');
            this._contentDirty = false;
        }
        if (this.size) {
            var origSize = size;
            size = [
                this.size[0],
                this.size[1]
            ];
            if (size[0] === undefined && origSize[0])
                size[0] = origSize[0];
            if (size[1] === undefined && origSize[1])
                size[1] = origSize[1];
        }
        if (size[0] === true)
            size[0] = target.clientWidth;
        if (size[1] === true)
            size[1] = target.clientHeight;
        if (_xyNotEquals(this._size, size)) {
            if (!this._size)
                this._size = [
                    0,
                    0
                ];
            this._size[0] = size[0];
            this._size[1] = size[1];
            this._sizeDirty = true;
        }
        if (!matrix && this._matrix) {
            this._matrix = null;
            this._opacity = 0;
            _setInvisible(target);
            return;
        }
        if (this._opacity !== opacity) {
            this._opacity = opacity;
            target.style.opacity = opacity >= 1 ? '0.999999' : opacity;
        }
        if (_xyNotEquals(this._origin, origin) || Transform.notEquals(this._matrix, matrix) || this._sizeDirty) {
            if (!matrix)
                matrix = Transform.identity;
            this._matrix = matrix;
            var aaMatrix = matrix;
            if (origin) {
                if (!this._origin)
                    this._origin = [
                        0,
                        0
                    ];
                this._origin[0] = origin[0];
                this._origin[1] = origin[1];
                aaMatrix = Transform.thenMove(matrix, [
                    -this._size[0] * origin[0],
                    -this._size[1] * origin[1],
                    0
                ]);
                _setOrigin(target, origin);
            }
            _setMatrix(target, aaMatrix);
        }
        if (this._sizeDirty) {
            if (this._size) {
                target.style.width = this.size && this.size[0] === true ? '' : this._size[0] + 'px';
                target.style.height = this.size && this.size[1] === true ? '' : this._size[1] + 'px';
            }
            this._sizeDirty = false;
        }
    };
    Surface.prototype.cleanup = function cleanup(allocator) {
        var i = 0;
        var target = this._currTarget;
        this.eventHandler.emit('recall');
        this.recall(target);
        target.style.display = 'none';
        target.style.width = '';
        target.style.height = '';
        this._size = null;
        _cleanupStyles.call(this, target);
        var classList = this.getClassList();
        _cleanupClasses.call(this, target);
        for (i = 0; i < classList.length; i++)
            target.classList.remove(classList[i]);
        if (this.elementClass) {
            if (this.elementClass instanceof Array) {
                for (i = 0; i < this.elementClass.length; i++) {
                    target.classList.remove(this.elementClass[i]);
                }
            } else {
                target.classList.remove(this.elementClass);
            }
        }
        _removeEventListeners.call(this, target);
        this._currTarget = null;
        allocator.deallocate(target);
        _setInvisible(target);
    };
    Surface.prototype.deploy = function deploy(target) {
        var content = this.getContent();
        if (content instanceof Node) {
            while (target.hasChildNodes())
                target.removeChild(target.firstChild);
            target.appendChild(content);
        } else
            target.innerHTML = content;
    };
    Surface.prototype.recall = function recall(target) {
        var df = document.createDocumentFragment();
        while (target.hasChildNodes())
            df.appendChild(target.firstChild);
        this.setContent(df);
    };
    Surface.prototype.getSize = function getSize(actual) {
        return actual ? this._size : this.size || this._size;
    };
    Surface.prototype.setSize = function setSize(size) {
        this.size = size ? [
            size[0],
            size[1]
        ] : null;
        this._sizeDirty = true;
    };
    module.exports = Surface;
});