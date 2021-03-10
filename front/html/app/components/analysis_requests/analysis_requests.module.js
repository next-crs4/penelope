var analysis_requests_module = angular.module('AnalysisRequestsModule',[]);

analysis_requests_module.run(function($rootScope){
  $rootScope._ = _;
});

analysis_requests_module.controller('AnalysisRequestsCtrl',
	function(BikaService, Utility, config, ngCart, $scope, $stateParams, $rootScope) {

		$scope.analyses = [];
		$scope.analysis_requests = [];
		$scope.checked_list = [];
		$scope.review_state = ($stateParams.review_state!==undefined && $stateParams.review_state!=='')?$stateParams.review_state:'active';
		$scope.buttons = {radio: $scope.review_state};
		$scope.stickers={id:null};

		$scope.pagination= {
			page_nr: 0,
			page_size: 50,
			total: 0,
			current: 1,
			last: 0,
		};

		this.changePage = function(newPageNumber, oldPageNumber) {
			if (newPageNumber !== undefined) {
				$scope.pagination.page_nr = newPageNumber-1;
				$scope.pagination.current = newPageNumber;
			}
			$scope.getAnalysisRequests($scope.review_state);
		}

        $scope.loading_ars = Utility.loading({
            busyText: 'Wait while loading analyses...',
            delayHide: 1000,
        });

        $scope.loading_change_review_state =
        	function(text) {
        		params = {
	        		busyText: text===undefined?'Wait...':'Wait while ' + text + '...',
            		delayHide: 1000,
            		theme: 'warning',
        		}
        		return Utility.loading(params);
        	};

		$scope.getAnalysisRequests =
            function(review_state, print_stickers) {

            	$scope.loading_ars.show();
            	$scope.review_state = review_state;
                $scope.analysis_requests = [];
                params = {sort_on: 'Date', sort_order: 'descending',
                		page_nr: $scope.pagination.page_nr, page_size: $scope.pagination.page_size};

                if (review_state === 'active') {
					params['Subjects'] = 'sample_due|sample_received|to_be_verified|verified|published';
				}
				else if (review_state === 'published') {
					params['review_state'] = review_state;
				}
				else {
					params['Subject'] = review_state;
				}

                BikaService.getAnalysisRequests(params).success(function (data, status, header, config){
                    $scope.analysis_requests = data.result.objects;
                    $scope.pagination.total = data.result.total;
                    $scope.pagination.last = data.result.last;

                    transitions = Array();
					_.each($scope.analysis_requests,function(obj) {
						Utility.merge(transitions,obj.transitions,'id');
					});

                    $scope.transitions = transitions;
                    $scope.loading_ars.hide();
                    if (print_stickers !==undefined && print_stickers === true) {

                    	Utility.print_stickers($scope.stickers.id);
                    }
                    //$rootScope.counter = DashboardService.update_dashboard();
                });
            };

        $scope.sort = function(keyname){
			$scope.sortKey = keyname;   //set the sortKey to the param passed
			$scope.reverse = !$scope.reverse; //if true make it false and vice versa
		}

		$scope.getAnalysisRequests($scope.review_state);

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

		this.check_transitions = function(id_transition, transitions) {
			if (transitions === undefined) {
				var transitions = $scope.transitions;
			}
			return Utility.check_transitions(id_transition, transitions);
		}

		$scope.cancelAnalysisRequest =
			function(id) {
				$scope.loading_change_review_state('deleting analysis requests').show();
				params = {ids: id};
				BikaService.cancelAnalysisRequest(params).success(function (data, status, header, config){
					$scope.checked_list = [];
					$scope.loading_change_review_state('deleting analysis requests').hide();
					$scope.getAnalysisRequests($scope.review_state);
				});

			}

		$scope.reinstateAnalysisRequest =
			function(id) {
				$scope.loading_change_review_state('reinstating analysis requests').show();
				params = {ids: id};

				BikaService.reinstateAnalysisRequest(params).success(function (data, status, header, config){
				 	$scope.checked_list = [];
				 	$scope.loading_change_review_state('reinstating analysis requests').hide();
				 	$scope.getAnalysisRequests($scope.review_state);
				 });

			}

		$scope.receiveSample =
			function(id) {
				$scope.loading_change_review_state('receiving samples').show();
				params = {ids: id};
				$scope.stickers.id=id;

				BikaService.receiveSample(params).success(function (data, status, header, config){
					//console.log(data);
					$scope.checked_list = [];
					$scope.loading_change_review_state('receiving samples').hide();
					$scope.getAnalysisRequests($scope.review_state, true);

				});

			}

		this.change_review_state =
			function (action, id) {

				if (id === undefined) {
					var id = $scope.checked_list.join('|');
				}
				if (action === 'receive') {
					$scope.receiveSample(id);
				}
				else if (action === 'cancel') {
					 $scope.cancelAnalysisRequest(id);
				}
				else if (action === 'reinstate') {
					 $scope.reinstateAnalysisRequest(id);
				}
			}

		this.add_to_blackboard =
			function(ids) {
				_.each(ids,function(id) {
					if (ngCart.getItemById(id) === false ) {
						var ar = _.findWhere($scope.analysis_requests, {'id': id});
						if (ar !== undefined) {ngCart.addItem(id,id,1,1,ar);}
					}
				});
				$scope.checked_list = [];
			}

		this.remove_from_blackboard =
			function(ids) {
				_.each(ids,function(id) {
					if (ngCart.getItemById(id) !== false ) {
						//var ar = _.findWhere($scope.analysis_requests, {'id': id});
						ngCart.removeItemById(id);
					}
				});
				$scope.checked_list = [];
		}

		this.toggle = function(id) {

				var idx = $scope.checked_list.indexOf(id);
				if (idx > -1) {
					$scope.checked_list.splice(idx, 1);
				}
				else {
					$scope.checked_list.push(id);
				}
		}

		this.toggle_all = function() {
				if ($scope.checked_list.length < $scope.analysis_requests.length) {
					_.each($scope.analysis_requests,function(ar) {
						$scope.checked_list.push(ar.id);
					})
				}
				else {
					$scope.checked_list = [];
				}
		}

	});

analysis_requests_module.controller('AnalysisRequestDetailsCtrl',
	function(BikaService, Utility, config, $stateParams, $scope, $rootScope) {

		$scope.state = {analysis_request_id: $stateParams.analysis_request_id};
		$scope.analysis_request = null;
		$scope.stickers = {id: null};

		$scope.analysis_results = [];
		$scope.workflow_params = {analyses: []};
		$scope.analyses = []

		$scope.loading_ars = Utility.loading({
            busyText: 'Wait while loading analyses...',
            delayHide: 1000,
        });

        $scope.loading_change_review_state =
        	function(text) {
        		params = {
	        		busyText: text===undefined?'Wait...':'Wait while ' + text + '...',
            		delayHide: 1000,
            		theme: 'warning',
        		}
        		return Utility.loading(params);
        	};

		$scope.getAnalysisRequests =
            function(analysis_request_id, print_stickers) {
            	$scope.loading_ars.show();
                params = {id: analysis_request_id};
                BikaService.getAnalysisRequests(params).success(function (data, status, header, config){
                    $scope.analysis_request = data.result.objects[0];
                    $scope.transitions = $scope.analysis_request.transitions;

                    workflow_transitions = Array()
                    $scope.analysis_results[analysis_request_id] = [];
					_.each($scope.analysis_request.analyses, function(obj) {
						Utility.merge(workflow_transitions, obj.transitions, 'id');
						$scope.analysis_results[analysis_request_id][obj.id] = (obj.review_state === 'sample_received')?1:obj.result;
					});
					$scope.analyses = $scope.analysis_request.analyses;
					$scope.workflow_transitions = workflow_transitions;
                    $scope.loading_ars.hide();
                    if (print_stickers !==undefined && print_stickers === true) {
                    	Utility.print_stickers($scope.stickers.id);
                    }
                    //$rootScope.counter = DashboardService.update_dashboard();


                });
            };

		$scope.getAnalysisRequests($scope.state.analysis_request_id);

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

		$scope.cancelAnalysisRequest =
			function(id) {
				$scope.loading_change_review_state('deleting analysis requests').show();
				params = {ids: id};
				BikaService.cancelAnalysisRequest(params).success(function (data, status, header, config){
					$scope.checked_list = [];
					$scope.loading_change_review_state('deleting analysis requests').hide();
					$scope.getAnalysisRequests($scope.state.analysis_request_id);
				});

			}

		$scope.reinstateAnalysisRequest =
			function(id) {
				$scope.loading_change_review_state('reinstating analysis requests').show();
				params = {ids: id};
				BikaService.reinstateAnalysisRequest(params).success(function (data, status, header, config){
				 	$scope.checked_list = [];
				 	$scope.loading_change_review_state('reinstating analysis requests').hide();
				 	$scope.getAnalysisRequests($scope.state.analysis_request_id);
				 });

			}

		$scope.receiveSample =
			function(id) {
				$scope.loading_change_review_state('receiving samples').show();
				params = {ids: id};
				$scope.stickers.id=id;
				BikaService.receiveSample(params).success(function (data, status, header, config){
					//console.log(data);
					$scope.checked_list = [];
					$scope.loading_change_review_state('receiving samples').hide();
					$scope.getAnalysisRequests($scope.state.analysis_request_id, true);

				});

			}

		this.change_review_state =
			function (action, id) {
				if (id === undefined) {
					var id = $scope.state.analysis_request_id;
				}
				if (action === 'receive') {
					$scope.receiveSample(id);
				}
				else if (action === 'cancel') {
					 $scope.cancelAnalysisRequest(id);
				}
				else if (action === 'reinstate') {
					 $scope.reinstateAnalysisRequest(id);
				}
			}


		$scope.ultimate_workflow_transitions =
			function(request_id, review_state) {
					_params = {id: request_id}
					BikaService.getAnalysisRequests(_params).success(function (data, status, header, config){
						ar = data.result.objects[0];
						if (ar.review_state === review_state) {
							var __params = {obj_path: ar.path, subject: review_state};
							BikaService.updateAnalysisRequest(__params).success(function (data, status, header, config){
								$scope.getAnalysisRequests($scope.state.analysis_request_id);
							});
						} else {$scope.getAnalysisRequests($scope.state.analysis_request_id);}
					});
		}

		$scope.submit =
			function(request_id, analysis_id) {
				if (Array.isArray(request_id) && request_id.length == 0) {
					Utility.alert({title:'Nothing to submit<br/>', content:'Please select at least a Sample', alertType:'warning'});
					return;
				}
				if (Array.isArray(analysis_id) && analysis_id.length == 0) {
					Utility.alert({title:'Nothing to submit<br/>', content:'Please select at least a Analysis', alertType:'warning'});
					return;
				}
				$scope.loading_change_review_state('submitting').show();
				params = {input_values: $scope._get_input_values(request_id, analysis_id)};
				//console.log(params);
				BikaService.setAnalysesResults(params).success(function (data, status, header, config){
				 	result = data.result;
				 	//console.log(result);
				 	if (result.success === 'True') {
				 		params = {f: $scope._get_action_params(request_id, analysis_id)}
				 		//console.log(params);

				 		BikaService.submit(params).success(function (data, status, header, config){
				 			result = data.result;
				 			//console.log(result);
				 			$scope.checked_list = [];
				 			$scope.workflow_params = {analyses: []};
				 			$scope.ultimate_workflow_transitions($scope.state.analysis_request_id, 'to_be_verified');
				 			$scope.loading_change_review_state('submitting').hide();
				 		});
				 	}
				});
			}

		$scope.verify =
			function(request_id, analysis_id) {
				if (Array.isArray(request_id) && request_id.length == 0) {
					Utility.alert({title:'Nothing to verify<br/>', content:'Please select at least a Sample', alertType:'warning'});
					return;
				}
				if (Array.isArray(analysis_id) && analysis_id.length == 0) {
					Utility.alert({title:'Nothing to verify<br/>', content:'Please select at least a Analysis', alertType:'warning'});
					return;
				}
				$scope.loading_change_review_state('verifying').show();
				params = {f: $scope._get_action_params(request_id, analysis_id)}
				//console.log(params);

				BikaService.verify(params).success(function (data, status, header, config){
					result = data.result;
					//console.log(result);
					$scope.checked_list = [];
					$scope.workflow_params = {analyses: []};
					$scope.ultimate_workflow_transitions($scope.state.analysis_request_id, 'verified');
					$scope.loading_change_review_state('verifying').hide();
					//$scope.getAnalysisRequests($scope.state.analysis_request_id)
				 });
			}

		$scope.publish =
			function(request_id, analysis_id) {
				if (Array.isArray(request_id) && request_id.length == 0) {
					Utility.alert({title:'Nothing to publish<br/>', content:'Please select at least a Sample', alertType:'warning'});
					return;
				}
				if (Array.isArray(analysis_id) && analysis_id.length == 0) {
					Utility.alert({title:'Nothing to publish<br/>', content:'Please select at least a Analysis', alertType:'warning'});
					return;
				}
				$scope.loading_change_review_state('publishing').show();
				params = {f: $scope._get_action_params(request_id, analysis_id,'publish')}
				//console.log(params);

				BikaService.publish(params).success(function (data, status, header, config){
					result = data.result;
					//console.log(result);
					$scope.checked_list = [];
					$scope.workflow_params = {analyses: []};
					$scope.ultimate_workflow_transitions($scope.state.analysis_request_id, 'published');
					$scope.loading_change_review_state('publishing').hide();
					//$scope.getAnalysisRequests($scope.state.analysis_request_id);
				 });
			}

		$scope._get_action_params =
			function(request_id, analysis_id, action) {
				if (!Array.isArray(request_id) && !Array.isArray(analysis_id)) {
					var f = [];
					f.push($scope._get_analysis_path(request_id, analysis_id));
					return JSON.stringify(f);
				}
				else if (!Array.isArray(request_id) && Array.isArray(analysis_id)) {
					var f = []

					if (action !== undefined && action=='publish') {
						f.push($scope._get_analysis_path(request_id));
					}
					_.each(analysis_id,function(id) {
						f.push($scope._get_analysis_path(request_id, id));
					});

					return JSON.stringify(f);
				}

			}

		$scope._get_input_values =
			function (request_id, analysis_id) {
				var input_values = {};

				if (!Array.isArray(analysis_id)) {
					input_values[$scope._get_analysis_path(request_id,analysis_id)] = {Result: $scope._get_analysis_result(request_id, analysis_id)}
				}
				else if (Array.isArray(analysis_id)) {
					_.each(analysis_id,function(id) {
						input_values[$scope._get_analysis_path(request_id, id)] = {Result: $scope._get_analysis_result(request_id, id)}
					});
				}
				return JSON.stringify(input_values);
			}

		$scope._get_analysis_path =
			function(request_id, analysis_id) {
				request = $scope.analysis_request;
				if (analysis_id === undefined) {
					return request.path;
				}
				else {return request.path + "/" + analysis_id;}

			}

		$scope._get_analysis_result =
			function(request_id, analysis_id) {
				return $scope.analysis_results[request_id][analysis_id].toString();
			}


		this.change_workflow_review_state =
			function (action, request_id, analysis_id) {

				var request_id = $scope.state.analysis_request_id;


				if (action === 'submit') {
					 $scope.submit(request_id, analysis_id);
				}
				else if (action === 'verify') {
					 $scope.verify(request_id, analysis_id);
				}
				else if (action === 'assign') {
					 $scope.assign(request_id, analysis_id);
				}
				else if (action === 'publish') {
					 $scope.publish(request_id, analysis_id);
				}

			}

		this.check_transitions = function(id_transition, transitions) {
			if (transitions === undefined) {
				var transitions = $scope.transitions;
			}
			return Utility.check_transitions(id_transition, transitions);
		}

		this.results = config.legend.analysis_result;

		this.toggle_analyses = function(id) {
				var idx = $scope.workflow_params.analyses.indexOf(id);
				if (idx > -1) {
					$scope.workflow_params.analyses.splice(idx, 1);
				}
				else {
					$scope.workflow_params.analyses.push(id);
				}
			}

		this.toggle_all_analyses = function() {
				if ($scope.workflow_params.analyses.length < $scope.analysis_request.analyses.length) {
					_.each($scope.analysis_request.analyses,function(a) {
						$scope.workflow_params.analyses.push(a.id);
					})
				}
				else {
					$scope.workflow_params.analyses = [];
				}
		}


});