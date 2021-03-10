var blackboard_module = angular.module('BlackBoardModule',[]);

analysis_requests_module.run(function($rootScope){
  $rootScope._ = _;
});

blackboard_module.controller('BlackBoardCtrl',
	function(BikaService, Utility, config, ngCart, $scope, $state, $stateParams, $rootScope) {


		$scope.analysis_requests = [];
		$scope.analysis_results = [];
		$scope.checked_list = [];
		$scope.currentUser = $rootScope.currentUser;
		$scope.csv = {sample_list: []};

		this.in_blackboard_page = true;

		$scope.loading_change_review_state =
        	function(text) {
        		params = {
	        		busyText: text===undefined?'Wait...':'Wait while ' + text + '...',
            		delayHide: 500,
            		theme: 'warning',
        		}
        		return Utility.loading(params);
        	};

		$scope.init =
			function() {
				function sortObj(list, key) {
					function compare(a, b) {
						a = a[key];
						b = b[key];
						var type = (typeof(a) === 'string' ||
									typeof(b) === 'string') ? 'string' : 'number';
						var result;
						if (type === 'string') result = a.localeCompare(b);
						else result = a - b;
						return result;
					}
					return list.sort(compare);
				}


                $scope.csv.sample_list = Array();
				_.each(ngCart.getItems(), function(item) {
					$scope.csv.sample_list.push({
						N: item.getData().rights,
					 	Sample_ID: item.getData().id,
					 	Sample_Name:item.getData().client_sample_id
					})
					$scope.analysis_results[item.getData().id] = [];
					_.each(item.getData().analyses, function(a) {
						$scope.analysis_results[item.getData().id][a.id] = (a.review_state === 'sample_received')?1:a.result;
					});

				});
				$scope.csv.sample_list = sortObj($scope.csv.sample_list,'N');
			}

		$scope.init();

		$scope.sort = function(keyname){
			$scope.sortKey = keyname;   //set the sortKey to the param passed
			$scope.reverse = !$scope.reverse; //if true make it false and vice versa
		}

		this.toggle = function(id) {
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
				if ($scope.checked_list.length < ngCart.getItems().length) {
					_.each(ngCart.getItems(),function(item) {
						$scope.checked_list.push(item.getData().id);
					});
				}
				else {
					$scope.checked_list = [];
				}
		}

		this.format_date =
			function(date) {
				return Utility.format_date(date);
			}

		this.format_review_state =
			function(review_state) {
				return Utility.format_review_state(review_state);
			}

		this.format_result =
			function(result) {
				return Utility.format_result(result);
			}

		this.results = config.legend.analysis_result;


		$scope.updateAnalysisRequests =
			function(id) {
				params = {ids: id};
				BikaService.getAnalysisRequests(params).success(function (data, status, header, config){
				 	analysis_requests = data.result.objects;
				 	_.each(analysis_requests, function(ar) {
				 		if (ngCart.getItemById(ar.id) !== false ) {
							ngCart.removeItemById(ar.id);
							ngCart.addItem(ar.id,ar.id,1,1,ar);
						}
				 	});

					$scope.init();

                    //$rootScope.counter = DashboardService.update_dashboard();
				 });
			}

		this.remove_from_blackboard =
			function(ids) {
				if (!Array.isArray(ids)) {
					ids =[ids];

				}
				_.each(ids,function(id) {
					if (ngCart.getItemById(id) !== false ) {
						//var ar = _.findWhere($scope.analysis_requests, {'id': id});
						ngCart.removeItemById(id);
					}
				});
				$scope.init();
				$scope.checked_list = [];
		}


		this.get_filename =
			function () {
				return 'sample_list.'+Utility.format_date()+'.csv'
			}


		this.getHeader =
			function() {
				{return ["N","Sample_ID", "Sample_Name"]};

			}

});