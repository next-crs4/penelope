var home_module = angular.module('HomeModule', []);

home_module.controller('HomeCtrl',
	function(DashboardService, Utility, $state, $scope, $rootScope) {

		$scope.loading = Utility.loading({busyText: 'Wait while Loading...', theme: 'info', showBar: true, delayHide: 1500});
		$scope.loading.show();

		DashboardService.update_dashboard();

		$scope.counter = $rootScope.counter;


		$scope.$watch('counter.sample_due',
            function (newValue, oldValue) {
                // Ignore initial setup.
                if ( newValue === oldValue) { return;}
					radialProgress(document.getElementById('divSampleDue'))
						.diameter(200)
						.value(Utility.percentage($scope.counter.sample_due, $scope.counter.active))
						.render();
			});

		$scope.$watch('counter.sample_received',
            function (newValue, oldValue) {
                // Ignore initial setup.
                if ( newValue === oldValue) { return;}
					radialProgress(document.getElementById('divSampleReceived'))
						.diameter(200)
						.value(Utility.percentage($scope.counter.sample_received, $scope.counter.active))
						.render();
			});



		$scope.$watch('counter.published',
            function (newValue, oldValue) {
                // Ignore initial setup.
                if ( newValue === oldValue) { return;}

					radialProgress(document.getElementById('divPublished'))
						.diameter(200)
						.value(Utility.percentage($scope.counter.published, $scope.counter.active))
						.render();

			});

		$scope.$watch('counter.active',
            function (newValue, oldValue) {
                // Ignore initial setup.
                if ( newValue === oldValue) { return;}
					radialProgress(document.getElementById('divSampleDue'))
						.diameter(200)
						.value(Utility.percentage($scope.counter.sample_due, $scope.counter.active))
						.render();

					radialProgress(document.getElementById('divSampleReceived'))
						.diameter(200)
						.value(Utility.percentage($scope.counter.sample_received, $scope.counter.active))
						.render();

					radialProgress(document.getElementById('divPublished'))
						.diameter(200)
						.value(Utility.percentage($scope.counter.published, $scope.counter.active))
						.render();

			});
});