var petal = require('broccoli-petal');

// Current we can leaf can't process famous/Context.js I'm openning an
// issue on leaf
// module.exports = petal('bower_components/famous/core', {
//   name: 'famous/core'
// });


// This is a demo with ember-qunit
module.exports = petal('bower_components/ember-qunit/dist/amd', {
  name: 'ember-qunit'
});
