define('famous/core/Entity', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    var entities = [];
    function get(id) {
        return entities[id];
    }
    function set(id, entity) {
        entities[id] = entity;
    }
    function register(entity) {
        var id = entities.length;
        set(id, entity);
        return id;
    }
    function unregister(id) {
        set(id, null);
    }
    module.exports = {
        register: register,
        unregister: unregister,
        get: get,
        set: set
    };
});