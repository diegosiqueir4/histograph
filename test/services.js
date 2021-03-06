/* eslint-disable */
/* eslint-env mocha */
/*
  
  Testing services
  ===
  test with 
  mocha -g 'services:'
  
  Note: most services have been commented out, since they require an api key
  and have a limited amount of requests.
  Feel free to comment them out in order to test them.
*/
'use strict';


var settings = require('../settings'),
    services = require('../services'),
    _        = require('lodash'),
    should  = require('should');
    
describe.skip('services: geonames', function() {
  it('should connect to the Geonames endpoint, if available, and return some results', function (done) {
    this.timeout(15000)
    if(!settings.geonames ||_.isEmpty(settings.geonames.username)) {
      done();
    } else
      services.geonames({
        address: 'Roma'
      }, function (err, results){
        should.not.exist(err);
        if(!results.length) {
          console.log(results);
        }
        should.equal(results[0].toponymName, 'Rome')
        should.exist(results.length);
        done()
      });
  });
});

describe.skip('services: geocoding', function() {
  it('should connect to the geocoding endpoint, if available, and return some results fo reverse geocoding activity', function (done) {
    this.timeout(15000)
    if(!settings.geocoding ||_.isEmpty(settings.geocoding.key)) {
      console.log('no geocoding specified in settings, skipping...')
      done();
    } else
      services.reverse_geocoding({
        latlng: '43.036010285,11.60942724'
      }, function (err, results){
        
        if(err)
            throw err;
        should.not.exist(err);
        console.log(results)
        // should.equal(results[0].toponymName, 'Rome')
        // should.exist(results.length);
        done()
      });
  })

  // it('should connect to the Textrazor endpoint and return some results', function (done) {
  //   this.timeout(15000)
  //   services.textrazor({
  //     text: 'Born in 1932 in Kaunas, Vytautas Landsbergis, former opponent of the Soviet Communist regime in Lithuania and founder of Sajudis, the pro-independence movement, was President of Lithuania from 1990 to 1992 and Chairman of the Lithuanian Parliament from 1992 to 1996. He has been a Member of the European Parliament since 2004.'
  //   }, function (err, entitites){
      
  //     if(err)
  //         throw err;
  //     should.exist(entitites.length);
  //     done()
  //   });
  // })
   
  // it('should connect to the endpoint and return a result', function (done) {
  //   this.timeout(25000)
  //   services.yagoaida({
  //     text: 'Born in 1932 in Kaunas, Vytautas Landsbergis, former opponent of the Soviet Communist regime in Lithuania and founder of Sajudis, the pro-independence movement, was President of Lithuania from 1990 to 1992 and Chairman of the Lithuanian Parliament from 1992 to 1996. He has been a Member of the European Parliament since 2004.'
  //   }, function(err, entities){
  //       if(err)
  //         throw err;
  //     // persons 
  //     var persons = entities.filter(function(d) {
  //       return d.type.map( function(t){
  //         return t.replace(/\d/g, '');
  //       }).indexOf('YAGO_wordnet_person_') !== -1
  //     })
      
  //     var locations = entities.filter(function(d) {
  //       return d.type.map( function(t){
  //         return t.replace(/\d/g, '');
  //       }).indexOf('YAGO_wordnet_administrative_district_') !== -1
  //     })
  //     // remap candidates: person with YAGO super special bis
  //     console.log(locations.map(function (d){return d.matchedText}))
  //     done()
  //   });
  // })
});
