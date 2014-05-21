'use strict';

/* Controllers */

angular.module('myApp.controllers', [])
  .controller('PipelinesCtrl', ['$scope', 'Socket', 'PipelineService', function($scope, Socket, PipelineService) {
	Socket.on('connectionStatus', function (state) {
		//$scope.state = state;
		console.log(state);
   	});

    $scope.$on('$destroy', function (event) {
        Socket.getSocket().removeAllListeners();
    });

    $scope.pipelines = PipelineService.query();
  }])  
 .controller('PipelineDetailCtrl', ['$scope', '$routeParams', function($scope, $routeParams) {
	$scope.originId = $routeParams.originId;
  }]) 
  .controller('RegisterCtrl', ['$scope', '$http', 'UserService', function($scope, $http, UserService) {
    $scope.addUser = function(){
    	var user = {name:$scope.newUser.username, email:$scope.newUser.email, password:$scope.newUser.password1};
	    UserService.create(user);

	    $scope.newUser.username = '';
	    $scope.newUser.email = '';
	    $scope.newUser.password1 = '';
	    $scope.newUser.password2 = '';
	};
  }])
  .controller('SessionCtrl', ['$scope', '$http', '$location', '$cookieStore', 'SessionInService', 'SessionOutService', 'Session', function($scope, $http, $location, $cookieStore, SessionInService, SessionOutService, Session) {
	$scope.Session = Session;

	$scope.loginUser = function(){
		var session = {email:$scope.user.email, password:$scope.user.password};
	    console.log(session);
		$http.defaults.useXDomain = true;
		delete $http.defaults.headers.common['X-Requested-With'];
	    SessionInService.create(session, function(data){

			console.log(data);

			console.log(data.token);
			Session.isLogged = true;
			Session.token = data.token;

			$cookieStore.put("token", data.token);

			console.log(Session);

		  	$scope.user.email = '';
			$scope.user.password = '';

			$location.path( '/pipeline-list' );
		});
	};
	$scope.logoutUser = function(){
		$http.defaults.headers.common['token'] = Session.token;

		SessionOutService.create(function(data){
		  Session.isLogged = false;
		  Session.token = "";
		  $cookieStore.remove("token");

		  console.log(Session);

		  $location.path( '/register' );
		});
	};
}]);