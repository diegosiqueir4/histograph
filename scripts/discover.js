/*
  Command line for discover process.
  Usage:
  
  node .\scripts\discover.js --resourceid=11160
  
  or
  
  node .\scripts\discover.js --entityid=
  
  or bulk discover
  
  node .\scripts\discover.js --entities=500
  node .\scripts\discover.js --resources=500
*/

var settings = require('../settings'),
    options  = require('minimist')(process.argv.slice(2)),
    
    resource = require('../models/resource'),
    entity   = require('../models/entity'),
    
    neo4j    = require('seraph')(settings.neo4j.host),
    async    = require('async'),
    _        = require('lodash');
    

console.log(options);
if(options.resourceid) {
  if(isNaN(options.resourceid))
    throw 'check your --resourceid value. Should be an integer id!'

  resource.discover(options.resourceid, function(err, res) {
    console.log(res)
  })
  return;
}

if(options.entityid) {
  if(isNaN(options.entityid))
    throw 'check your --entityid value. Should be an integer id!'

  entity.discover(options.entityid, function(err, res) {
    console.log(res);
  })
  return;
}

if(options.entities && !isNaN(options.entities)) {
  var queue = async.waterfall([
    // get pictures and documents having a caption
    function (next) {
      neo4j.query('MATCH (n:`person`) WHERE not(has(n.birth_date)) RETURN n LIMIT {limit}', {
        limit: options.entities
      }, function (err, nodes) {
        if(err)
          throw err;
        next(null, nodes);
      });
    },
    /**
      Nicely add TEXTRAZOR api service to extract persons from resources having caption (an/or source field)
    */
    function (nodes, next) {
      var q = async.queue(function (node, nextNode) {
        console.log('entities remaining', q.length(), '/', nodes.length)
        entity.discover(node.id, function(err, res) {
          if(err)
            throw err;
          console.log(res.id, res.name, res.links_wiki, res.languages);
          setTimeout(nextNode, 1675);
        })
      }, 1);
      q.push(nodes);
      q.drain = next;
    }
  ], function () {
    console.log('completed');
  });
}

if(options.resource) {
  var queue = async.waterfall([
    // get pictures and documents having a caption
    function (next) {
      neo4j.query('MATCH (n:`resource`) WHERE not(has(n.textrazor_annotated)) RETURN n LIMIT 500', function (err, nodes) {
        if(err)
          throw err;
        var limit;
        next(null, _.take(nodes, limit || nodes.length))
      });
    },
    /**
      Nicely add TEXTRAZOR api service to extract persons from resources having caption (an/or source field)
    */
    function (nodes, next) {
      var q = async.queue(function (node, nextNode) {
        console.log('resource remaining', q.length())
        resource.discover(node.id, function(err, res) {
          if(err)
            throw err;
          console.log(res);
          res.textrazor_annotated = true;
          neo4j.save(res, function (err, n) {
            if(err)
              throw err;
            nextNode();
          })
          
        });
      }, 1);
      q.push(nodes);
      q.drain = next;
    }
  ], function () {
    console.log('completed');
  });
}