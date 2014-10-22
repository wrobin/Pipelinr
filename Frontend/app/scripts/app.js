'use strict';

/**
 * @ngdoc overview
 * @name pipelinrApp
 * @description
 * # pipelinrApp
 *
 * Main module of the application.
 */
angular
  .module('pipelinrApp', [
    'ngRoute',
    'ui.bootstrap',
    'ngCookies',
    'btford.socket-io',
    'd3',
    'perfect_scrollbar',
    'ngResource'
  ])
  .config(['$routeProvider', '$httpProvider', function($routeProvider, $httpProvider) {
    $routeProvider
      .when('/register', {
        templateUrl: 'views/register.html',
        controller: 'RegisterCtrl'
      })
      .when('/pipelines', {
        templateUrl: 'views/pipelines.html',
        controller: 'PipelinesCtrl',
        access: { isFree: true }
      })
      .when('/pipelines/:id', {
        templateUrl: 'views/pipeline.html',
        controller: 'PipelineCtrl',
        access: { isFree: true }
      })
      .otherwise({
        redirectTo: '/register'
      });
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
  }])
  // Redirection for no session.
  .run( function($rootScope, $location, $templateCache, Session, Socket) {
    // register listener to watch route changes
    $rootScope.$on( '$routeChangeStart', function(event, next, current) {
      if (!Session.isLogged) {
        $location.path( '/register' );
      }      
    });
  });