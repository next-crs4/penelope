
var main_module = angular.module('MainApp',[
    'ui.router',
    'ngSanitize',
    'ngAnimate',
    'ngTable',
    'ngCsv',
    'angularUtils.directives.dirPagination',
    'bootstrap.fileField',
    'angularMoment',
    'ngQuantum',
    'ngCart',
    'dangle',
    'chart.js',
    'InitModule',
    'ConfigModule',
    'BikaApiRestModule',
    'IrodsApiRestModule',
    'UtilityModule',
    'angularSpinner',
    'LoginModule',
    'HomeModule',
    'ARImportModule',
    'BatchesModule',
    'AnalysisRequestsModule',
    'SamplesheetModule',
    'WorksheetsModule',
    'DeliveriesModule',
    'BlackBoardModule',
    'CostCentersModule',
    'PurchaseOrdersModule',
    'LabProductsModule',
    'RunsModule',
    'ClientsModule',
    'TargetsModule',
    'RequestFormModule',
    'DashboardModule',
    'BrowserModule',
]);

// :: MAIN CONTROLLER
main_module.controller('MainCtrl',
	function(Utility, BikaService, $scope, $rootScope, $state, Auth, AUTH_EVENTS, USER_ROLES, $window, init){
		// this is the parent controller for all controllers.
		// Manages auth login functions and each controller
		// inherits from this controller

		$scope.$state = $state;
		var showLoginDialog = function() {
			$state.go('login');
		};


		var setCurrentUser = function(){
			$scope.currentUser = $rootScope.currentUser;
		}

		var showNotAuthorized = function(){
			alert("Not Authorized");
		}

		$scope.currentUser = null;
		$scope.userRoles = USER_ROLES;
		$scope.isAuthorized = Auth.isAuthorized;

		//listen to events of unsuccessful logins, to run the login dialog
		$rootScope.$on(AUTH_EVENTS.notAuthorized, showNotAuthorized);
		$rootScope.$on(AUTH_EVENTS.notAuthenticated, showLoginDialog);
		$rootScope.$on(AUTH_EVENTS.sessionTimeout, showLoginDialog);
		$rootScope.$on(AUTH_EVENTS.logoutSuccess, showLoginDialog);
		$rootScope.$on(AUTH_EVENTS.loginSuccess, setCurrentUser);
	}
);


// :: RUN MAIN MODULE
main_module.run(
	function($rootScope, $state, Auth, AUTH_EVENTS, init) {

		//before each state change, check if the user is logged in
		//and authorized to move onto the next state

			$rootScope._ = _;
			$rootScope.counter = {
					batches: -1,
					active: -1,
					sample_due: -1,
					sample_received: -1,
					verified: -1,
					published: -1,
					worksheets: -1,
					assigned: -1,

			}

			$rootScope.qc_report = init.sshApiRest.report_host;
			$rootScope.ssheet_templates = init.irodsApiRest.ssheet_templates;

		$rootScope.$on('$stateChangeStart', function (event, next) {

			if (next.data) {
				var authorizedRoles = next.data.authorizedRoles;
				if (!Auth.isAuthorized(authorizedRoles)) {
			    event.preventDefault();
			  if (Auth.isAuthenticated()) {
				// user is not allowed
				$rootScope.$broadcast(AUTH_EVENTS.notAuthorized);
			  } else {
				// user is not logged in
				$rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
			  }
			}

			}
		 });

		/* To show current active state on menu */
		$rootScope.getClass = function(path) {
			if ($state.current.name == path) {
				return "active";
			} else {
				return "";
			}
		}


		$rootScope.logout = function(){
			Auth.logout();
		};




	}
);







