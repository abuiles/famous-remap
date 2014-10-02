define('famous/core/View', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    var EventHandler = require('./EventHandler');
    var OptionsManager = require('./OptionsManager');
    var RenderNode = require('./RenderNode');
    function View(options) {
        this._node = new RenderNode();
        this._eventInput = new EventHandler();
        this._eventOutput = new EventHandler();
        EventHandler.setInputHandler(this, this._eventInput);
        EventHandler.setOutputHandler(this, this._eventOutput);
        this.options = Object.create(this.constructor.DEFAULT_OPTIONS || View.DEFAULT_OPTIONS);
        this._optionsManager = new OptionsManager(this.options);
        if (options)
            this.setOptions(options);
    }
    View.DEFAULT_OPTIONS = {};
    View.prototype.getOptions = function getOptions() {
        return this._optionsManager.value();
    };
    View.prototype.setOptions = function setOptions(options) {
        this._optionsManager.patch(options);
    };
    View.prototype.add = function add() {
        return this._node.add.apply(this._node, arguments);
    };
    View.prototype._add = View.prototype.add;
    View.prototype.render = function render() {
        return this._node.render();
    };
    View.prototype.getSize = function getSize() {
        if (this._node && this._node.getSize) {
            return this._node.getSize.apply(this._node, arguments) || this.options.size;
        } else
            return this.options.size;
    };
    module.exports = View;
});