/**
 * @ngdoc function
 * @name histograph.controller:indexCtrl
 * @description
 * # IndexCtrl
 */
angular.module('histograph')
  .controller('ResourceCtrl', function ($scope, $log, $routeParams, ResourceFactory, ResourceCommentsFactory, ResourceRelatedFactory, socket) {
    $log.debug('ResourceCtrl ready', $routeParams.id);

    

    

    /**
      commenting, with socket
    */
    $scope.commenting = false; // on commenting = true
    
    $scope.comment = {
      text: "Write something please. Then do not forget to push the button below",
      tags: ''
    }


    /**
      Socket
    */


    socket.on('done:commenting', function (result) {
      
      // add the comment at the bottom
      if(result.resource_id != $routeParams.id)
        return;
      if(result.data.comment) {
        $log.info('done:commenting', result);
        $scope.item.comments.push(result.data);
      } else {
        $log.error('done:commenting', 'comment invalid, please check');
      }
    });

    socket.on('continue:commenting', function (result) {
      $log.info('continue:commenting', result);
    });

    socket.on('start:commenting', function (result) {
      $log.info('start:commenting', result.data, $routeParams.id);
    });

    /*
      Create a comment, twetterlike wherever you are.
      (of course you have to comment a resource)
    */
    $scope.startMention = function (item) {
      $log.debug('resource.startMention', item);
      $scope.commenting = true;
      socket.emit('start:commenting', item.props, function (result) {
        $log.info('start:commenting', result);
      });

    };

    $scope.postMention = function (item) {
      $log.debug('resource.postMention', item);
      ResourceCommentsFactory.save({id: $routeParams.id}, {
        content: $scope.comment.text,
        tags: ''
      }, function(res){
        console.log('postMention', res);
      })
    };


    $scope.switchVersion = function(version) {
      $log.info('resourceCtrl.switchVersion', version)
      $scope.currentVersion = version;
    };

    $scope.switchAnnotation = function(annotation) {
      $scope.currentAnnotation = annotation;
    }
    /**
      on load
    */
    ResourceFactory.get({id:$routeParams.id}, function (res) {
      $log.info('ResourceFactory', res);
      $scope.setUser(res.user); // update user
      // $scope.currentVersion = res.result.item.versions[1];
      // merge all versions (simply concat annotations and join them with entity URI if any matches identification)
      var yamls = [];
      res.result.item.versions.forEach(function(v) {
        if(typeof v.yaml == 'object')
          yamls = yamls.concat(v.yaml);
      });

      $scope.mergedVersion = {
        service: 'merged',
        yaml: yamls
      };
      $scope.currentVersion = $scope.mergedVersion;
      
      $scope.item = res.result.item;
      
      if($scope.item.annotations.length)
        $scope.currentAnnotation = $scope.item.annotations[0];
      else 
        $scope.currentAnnotation = { annotations: {
            source: $scope.item.props.source || '',
            caption: $scope.item.props.caption || '',
          }
        }
      // get theaccepted version

      // get related
      ResourceRelatedFactory.get({id:$routeParams.id}, function (resRelated) {
        $log.info('ResourceRelatedFactory', 'succees');
        $scope.related = resRelated.result.items;
        var graph = {
          nodes: [],
          edges: []
        };
        // fill graph object with related top 100 results
        var entities = {};
        
        // add current item ...

        graph.nodes.push({
          id: res.result.item.id,
          label: $scope.item.props.name || $scope.item.props.title,
          type: 'res',
          x: Math.random()*50,
          y: Math.random()*50,
          size: 10
        });

        for(var i in res.result.item.persons) {
          graph.edges.push({
            id: +(res.result.item.id+'.'+res.result.item.persons[i].id),
            source: res.result.item.persons[i].id,
            target:  res.result.item.id
          });
          if(!entities[res.result.item.persons[i].id]){
            entities[res.result.item.persons[i].id] = {
              id: res.result.item.persons[i].id,
              label: res.result.item.persons[i].name,
              x: 0,
              y: 0,
              size: 0
            };
            graph.nodes.push(entities[res.result.item.persons[i].id]);
          }
          entities[res.result.item.persons[i].id].size++;
        }

        resRelated.result.items.forEach(function (d) {
          graph.nodes.push({
            id: d.id,
            label: d.props.name || d.props.title,
            type: 'res',
            x: Math.random()*50,
            y: Math.random()*50,
            size: Math.max(d.ratings.entity_silmilarity || 0,.3)
          });

          for(var i in d.persons) {
            graph.edges.push({
              id: +(d.id+'.'+d.persons[i].id),
              source: d.persons[i].id,
              target: d.id
            });
            if(!entities[d.persons[i].id]){
              entities[d.persons[i].id] = {
                id: d.persons[i].id,
                label: d.persons[i].name,
                x: 0,
                y: 0,
                size: 0
              };
              graph.nodes.push(entities[d.persons[i].id]);
            }
            entities[d.persons[i].id].size++;
          };
        });

        $scope.setGraph(graph);




      });

      
    });
  })