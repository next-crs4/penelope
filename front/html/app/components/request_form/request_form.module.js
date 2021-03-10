var request_form_module = angular.module('RequestFormModule',[]);

request_form_module.run(function($rootScope){
  $rootScope._ = _;
});

batches_module.controller('RequestFormCtrl',
	function(BikaService, Utility, config, ngCart, $scope, $rootScope) {

        $scope.project_types = [
            {id: 'DNA', title: 'DNA (Whole Genome)'},
            {id: 'RNA', title: 'RNA-Seq (polyA-selected)'},
            {id: 'EXOME', title: 'Exome'},
        ];

        $scope.checked_list = [];

        $scope.request_params = {
            project_type: null,
            samples_number: null,
        }

        this.more_samples = function() {
            if ($scope.request_params.samples_number != null) {
                $scope.request_params.samples_number += 1;
            }
            else {
                $scope.request_params.samples_number = 1;
            }
        }

        this.less_samples = function() {
            if ($scope.request_params.samples_number != 1 && $scope.request_params.samples_number != null) {
                $scope.request_params.samples_number -= 1;
            }
            else {
                $scope.request_params.samples_number = null;
            }
        }

        this.find_services = function (request_params) {
            this.params = {sort_on: 'keyword', sort_order: 'ascending',};
            BikaService.getAnalysisServices(this.params).success(function (data, status, header, config){
            	$scope.analysis_services = data.result.objects;
            	console.log($scope.analysis_services);
            });

        }

        this.toggle =
			function(id) {
				var idx = $scope.checked_list.indexOf(id);
				if (idx > -1) {
					$scope.checked_list.splice(idx, 1);
				}
				else {
					$scope.checked_list.push(id);
				}
				//console.log($scope.checked_list);
			}

		this.toggle_all = function() {
				if ($scope.checked_list.length < $scope.batches.length) {
					_.each($scope.batches,function(b) {
						$scope.checked_list.push(b.id);
					})
				}
				else {
					$scope.checked_list = [];
				}
		}

});