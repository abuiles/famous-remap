define('famous/core/ViewSequence', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    function ViewSequence(options) {
        if (!options)
            options = [];
        if (options instanceof Array)
            options = { array: options };
        this._ = null;
        this.index = options.index || 0;
        if (options.array)
            this._ = new this.constructor.Backing(options.array);
        else if (options._)
            this._ = options._;
        if (this.index === this._.firstIndex)
            this._.firstNode = this;
        if (this.index === this._.firstIndex + this._.array.length - 1)
            this._.lastNode = this;
        if (options.loop !== undefined)
            this._.loop = options.loop;
        this._previousNode = null;
        this._nextNode = null;
    }
    ViewSequence.Backing = function Backing(array) {
        this.array = array;
        this.firstIndex = 0;
        this.loop = false;
        this.firstNode = null;
        this.lastNode = null;
    };
    ViewSequence.Backing.prototype.getValue = function getValue(i) {
        var _i = i - this.firstIndex;
        if (_i < 0 || _i >= this.array.length)
            return null;
        return this.array[_i];
    };
    ViewSequence.Backing.prototype.setValue = function setValue(i, value) {
        this.array[i - this.firstIndex] = value;
    };
    ViewSequence.Backing.prototype.reindex = function reindex(start, removeCount, insertCount) {
        if (!this.array[0])
            return;
        var i = 0;
        var index = this.firstIndex;
        var indexShiftAmount = insertCount - removeCount;
        var node = this.firstNode;
        while (index < start - 1) {
            node = node.getNext();
            index++;
        }
        var spliceStartNode = node;
        for (i = 0; i < removeCount; i++) {
            node = node.getNext();
            if (node)
                node._previousNode = spliceStartNode;
        }
        var spliceResumeNode = node ? node.getNext() : null;
        spliceStartNode._nextNode = null;
        node = spliceStartNode;
        for (i = 0; i < insertCount; i++)
            node = node.getNext();
        index += insertCount;
        if (node !== spliceResumeNode) {
            node._nextNode = spliceResumeNode;
            if (spliceResumeNode)
                spliceResumeNode._previousNode = node;
        }
        if (spliceResumeNode) {
            node = spliceResumeNode;
            index++;
            while (node && index < this.array.length + this.firstIndex) {
                if (node._nextNode)
                    node.index += indexShiftAmount;
                else
                    node.index = index;
                node = node.getNext();
                index++;
            }
        }
    };
    ViewSequence.prototype.getPrevious = function getPrevious() {
        if (this.index === this._.firstIndex) {
            if (this._.loop) {
                this._previousNode = this._.lastNode || new this.constructor({
                    _: this._,
                    index: this._.firstIndex + this._.array.length - 1
                });
                this._previousNode._nextNode = this;
            } else {
                this._previousNode = null;
            }
        } else if (!this._previousNode) {
            this._previousNode = new this.constructor({
                _: this._,
                index: this.index - 1
            });
            this._previousNode._nextNode = this;
        }
        return this._previousNode;
    };
    ViewSequence.prototype.getNext = function getNext() {
        if (this.index === this._.firstIndex + this._.array.length - 1) {
            if (this._.loop) {
                this._nextNode = this._.firstNode || new this.constructor({
                    _: this._,
                    index: this._.firstIndex
                });
                this._nextNode._previousNode = this;
            } else {
                this._nextNode = null;
            }
        } else if (!this._nextNode) {
            this._nextNode = new this.constructor({
                _: this._,
                index: this.index + 1
            });
            this._nextNode._previousNode = this;
        }
        return this._nextNode;
    };
    ViewSequence.prototype.getIndex = function getIndex() {
        return this.index;
    };
    ViewSequence.prototype.toString = function toString() {
        return '' + this.index;
    };
    ViewSequence.prototype.unshift = function unshift(value) {
        this._.array.unshift.apply(this._.array, arguments);
        this._.firstIndex -= arguments.length;
    };
    ViewSequence.prototype.push = function push(value) {
        this._.array.push.apply(this._.array, arguments);
    };
    ViewSequence.prototype.splice = function splice(index, howMany) {
        var values = Array.prototype.slice.call(arguments, 2);
        this._.array.splice.apply(this._.array, [
            index - this._.firstIndex,
            howMany
        ].concat(values));
        this._.reindex(index, howMany, values.length);
    };
    ViewSequence.prototype.swap = function swap(other) {
        var otherValue = other.get();
        var myValue = this.get();
        this._.setValue(this.index, otherValue);
        this._.setValue(other.index, myValue);
        var myPrevious = this._previousNode;
        var myNext = this._nextNode;
        var myIndex = this.index;
        var otherPrevious = other._previousNode;
        var otherNext = other._nextNode;
        var otherIndex = other.index;
        this.index = otherIndex;
        this._previousNode = otherPrevious === this ? other : otherPrevious;
        if (this._previousNode)
            this._previousNode._nextNode = this;
        this._nextNode = otherNext === this ? other : otherNext;
        if (this._nextNode)
            this._nextNode._previousNode = this;
        other.index = myIndex;
        other._previousNode = myPrevious === other ? this : myPrevious;
        if (other._previousNode)
            other._previousNode._nextNode = other;
        other._nextNode = myNext === other ? this : myNext;
        if (other._nextNode)
            other._nextNode._previousNode = other;
        if (this.index === this._.firstIndex)
            this._.firstNode = this;
        else if (this.index === this._.firstIndex + this._.array.length - 1)
            this._.lastNode = this;
        if (other.index === this._.firstIndex)
            this._.firstNode = other;
        else if (other.index === this._.firstIndex + this._.array.length - 1)
            this._.lastNode = other;
    };
    ViewSequence.prototype.get = function get() {
        return this._.getValue(this.index);
    };
    ViewSequence.prototype.getSize = function getSize() {
        var target = this.get();
        return target ? target.getSize() : null;
    };
    ViewSequence.prototype.render = function render() {
        var target = this.get();
        return target ? target.render.apply(target, arguments) : null;
    };
    module.exports = ViewSequence;
});