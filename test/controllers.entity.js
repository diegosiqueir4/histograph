/*
  
  Test entity ctrl via REST API
  ===

*/
'use strict';

var settings  = require('../settings'),
    should    = require('should'),
    neo4j     = require('seraph')(settings.neo4j.host),
    app       = require('../server').app,
    _         = require('lodash'),
    
    Entity    = require('../models/entity'),
    Resource  = require('../models/resource'),
    User      = require('../models/user'),

    Session   = require('supertest-session')({
                  app: app
                }),
    
    generator = require('../generator')({
                  suffix: 'entity'
                });
    
var session,
    __MARVIN,
    __user,
    __resource,
    __entity;

before(function () {
  session = new Session();
});

after(function () {
  session.destroy();
});

describe('controller:entity before', function() {
  it('should delete MARVIN, if any', function (done) {
    User.remove(generator.user.marvin(), function (err) {
      if(err)
        throw err;
      done();
    });
  });
  it('should create MARVIN', function (done) {
    User.create(generator.user.marvin(), function (err, user) {
      if(err)
        throw err;
      should.exist(user.username);
      __MARVIN = user;
      done();
    });
  });
  
  it('should delete the researcher, if any', function (done) {
    User.remove(generator.user.researcher(), function (err) {
      if(err)
        throw err;
      done();
    });
  });
  
  it('should create the researcher', function (done){
    User.create(generator.user.researcher(), function (err, user) {
      if(err)
        throw err;
      should.exist(user.username);
      __user = user;
      done();
    });
  });

  it('should create a new resource A', function (done){
    Resource.create(generator.resource.multilanguage({
      user: __MARVIN
    }), function (err, resource) {
      if(err)
        throw err;
      __resource = resource;
      done();
    });
  });
  
  it('should create a new entity, by using links_wiki', function (done) {
    Entity.create({
      links_wiki: 'TESTESTTESTYalta_Conference',
      type: 'social_group',
      name: 'TESTESTTESTYalta_Conference',
      resource: __resource
    }, function (err, entity) {
      should.not.exist(err, err);
      should.equal(entity.rel.type, 'appears_in');
      should.exist(entity.props.name)
      __entity = entity;
      done();
    })
  });

  it('should authenticate the user', function (done) {
    session
      .post('/login')
      .send({
        username   : __user.username,
        password   : generator.user.researcher().password,
      })
      .expect(302)
      .end(function (err, res) {
        should.equal(res.headers.location, '/api')
        done();
      })
  });
});
  

describe('controller:entity biasics', function() {
  it('should get a specific entity', function (done) {
    session
      .get('/api/entity/' + __entity.id)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        should.not.exists(err);
        should.equal(res.body.result.item.id, __entity.id);
        done();
      });
  });
});

describe('controller:entity related items', function() {

  it('should upvote the relationship' , function (done) {
    console.log('' + __entity.id + '->' + __resource.id);
    session
      .post('/api/entity/' + __entity.id +'/related/resource/'+ __resource.id + '/upvote')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        should.not.exists(err);
        should.equal(res.body.result.item.id, __entity.id);
        should.exist(res.body.result.item.rel);
        done();
      });
  });
});


describe('controller:entity after', function() {
  it('should delete the resource', function (done) {
    Resource.remove(__resource, function (err) {
      if(err)
        throw err;
      done();
    });
  });
  it('should delete the entity', function (done) {
    Entity.remove(__entity, function (err) {
      if(err)
        throw err;
      done();
    });
  });
  it('should delete the researcher', function (done) {
    User.remove(generator.user.researcher(), function (err) {
      if(err)
        throw err;
      done();
    });
  });
  it('should delete MARVIN', function (done) {
    User.remove(generator.user.marvin(), function (err) {
      if(err)
        throw err;
      done();
    });
  });
});