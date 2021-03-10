var worksheets_module = angular.module('WorksheetsModule',[]);

worksheets_module.run(function($rootScope){
  $rootScope._ = _;
});

worksheets_module.controller('WorksheetsCtrl',
	function(BikaService, Utility, config, ngCart, $scope, $rootScope, $state) {



		$scope.loading_search = Utility.loading({
            busyText: 'Wait while searching worksheets...',
            delayHide: 1000,
        });


		$scope.loading_change_review_state =
        	function(text) {
        		this.params = {
	        		busyText: text===undefined?'Wait...':'Wait while ' + text + '...',
            		delayHide: 1000,
            		theme: 'warning',
        		}
        		return Utility.loading(this.params);
        	};

		$scope.checked_list = [];
		$scope.review_state = 'open';
		$scope.analysts = [];
		$scope.reassign_params = {analyst: null};

		$scope.pagination= {
			page_nr: 0,
			page_size: 100,
			total: 0,
			current: 1,
			last: 0,
		};

		this.changePage = function(newPageNumber, oldPageNumber) {
			if (newPageNumber !== undefined) {
				$scope.pagination.page_nr = newPageNumber-1;
				$scope.pagination.current = newPageNumber;
			}
			$scope.getWorksheets($scope.review_state);
		}

		// :: function :: getWorksheets()
        $scope.getWorksheets =
            function(review_state) {
            	$scope.loading_search.show();
            	$scope.review_state = review_state;
                $scope.worksheets = [];
                this.params = {sort_on: 'Date', sort_order: 'descending', Subject: review_state,
                	page_nr: $scope.pagination.page_nr, page_size: $scope.pagination.page_size};


                BikaService.getWorksheets(this.params).success(function (data, status, header, config){

					if ($rootScope.currentUser.role == 'Analyst') {
						_.each(data.result.objects, function(w) {
							if (w.analyst == $rootScope.currentUser.userid) {
								$scope.worksheets.push(w);
							}
						});
;					}
					else {
						$scope.worksheets = data.result.objects;
					}

                    //$scope.pagination.total = data.result.total;
                    $scope.pagination.total = $scope.worksheets.length;
                    //$scope.pagination.last = data.result.last;
                    $scope.pagination.last = $scope.worksheets.length;
					transitions = Array();
					_.each($scope.worksheets,function(obj) {
						if (obj.transitions.length > 0) {
							Utility.merge(transitions,obj.transitions,'id');
						}
						else {
							Utility.merge(transitions,[{'id': obj.review_state}], 'id');
						}

					});
                    $scope.transitions = transitions;
					$scope.loading_search.hide();
					//$rootScope.counter = DashboardService.update_dashboard();
                });
            };

        $scope.getAnalysists =
			function() {
				BikaService.getAnalystUsers().success(function (data, status, header, config){
					$scope.analysts = data.result.objects;
				});
			}

		$scope.getAnalysists();
        $scope.getWorksheets($scope.review_state);

        this.format_date =
			function(date) {
				return Utility.format_date(date);
			};

		this.format_review_state =
			function(review_state) {
				return Utility.format_review_state(review_state);
			};

		this.check_transitions =
			function(id_transition, transitions) {
				if (transitions === undefined) {
					var transitions = $scope.transitions;
				} else {
					transitions = [{'id': transitions}];
				}
				return Utility.check_transitions(id_transition, transitions);
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
				if ($scope.checked_list.length < $scope.worksheets.length) {
					_.each($scope.worksheets,function(b) {
						$scope.checked_list.push(b.id);
					})
				}
				else {
					$scope.checked_list = [];
				}
		}

		$scope.reassignWorksheet =
			function(worksheet_id) {
				$scope.loading_change_review_state('reassigning worksheets').show();
				this.params = {input_values: $scope._get_input_values_analyst(worksheet_id, $scope.reassign_params.analyst)};
				BikaService.updateWorksheets(this.params).success(function (data, status, header, config){
					this.params = {input_values: $scope._get_input_values_analyses(worksheet_id, $scope.reassign_params.analyst)};
					BikaService.updateAnalysisRequests(this.params).success(function (data, status, header, config){
						$scope.loading_change_review_state('reassigning worksheets').hide();
						$scope.checked_list = [];
				 		$scope.getWorksheets($scope.review_state);
					});
				});
			}

		$scope.closeWorksheet =
			function(worksheet_id) {
				$scope.loading_change_review_state('closing worksheets').show();
				this.params = {input_values: $scope._get_input_values_review_state(worksheet_id,'closed')};
				BikaService.closeWorksheet(this.params).success(function (data, status, header, config){
					$scope.loading_change_review_state('closing worksheets').hide();
					$scope.checked_list = [];
				 	$scope.getWorksheets($scope.review_state);
				});
			}

		$scope.openWorksheet =
			function(worksheet_id) {
				$scope.loading_change_review_state('opening worksheets').show();
				this.params = {input_values: $scope._get_input_values_review_state(worksheet_id, 'open')};
				BikaService.openWorksheet(this.params).success(function (data, status, header, config){
					$scope.loading_change_review_state('opening worksheets').hide();
					$scope.checked_list = [];
				 	$scope.getWorksheets($scope.review_state);
				});
			}

		$scope.cancelWorksheet =
			function(worksheet_id) {
				$scope.loading_change_review_state('deleting worksheets').show();
				this.params = {input_values: $scope._get_input_values_review_state(worksheet_id, 'cancelled')};
				BikaService.cancelWorksheet(this.params).success(function (data, status, header, config){
					$scope.loading_change_review_state('deleting worksheets').hide();
					$scope.checked_list = [];
				 	$scope.getWorksheets($scope.review_state);
				});
			}

		$scope.reinstateWorksheet =
			function(worksheet_id) {
				$scope.loading_change_review_state('reinstating worksheets').show();
				this.params = {input_values: $scope._get_input_values_review_state(worksheet_id, 'open')};
				BikaService.reinstateWorksheet(this.params).success(function (data, status, header, config){
					$scope.loading_change_review_state('reinstating worksheets').hide();
					$scope.checked_list = [];
				 	$scope.getWorksheets($scope.review_state);
				});
			}

		$scope._get_input_values_review_state =
			function (worksheet_id, review_state) {
				if (!Array.isArray(worksheet_id)) {
					var input_values = {};
					input_values[$scope._get_worksheet_path(worksheet_id)] = {subject: review_state};
					return JSON.stringify(input_values);
				}
				else if (Array.isArray(worksheet_id)) {
					var input_values = {};
					_.each(worksheet_id,function(id) {
						input_values[$scope._get_worksheet_path(id)] = {subject: review_state};
					});
					return JSON.stringify(input_values);
				}
			}

		$scope._get_input_values_analyst =
			function (worksheet_id, analyst) {
				if (!Array.isArray(worksheet_id)) {
					var input_values = {};
					input_values[$scope._get_worksheet_path(worksheet_id)] = {Analyst: analyst.userid};
					return JSON.stringify(input_values);
				}
				else if (Array.isArray(worksheet_id)) {
					var input_values = {};
					_.each(worksheet_id,function(id) {
						input_values[$scope._get_worksheet_path(id)] = {Analyst: analyst.userid};
					});
					return JSON.stringify(input_values);
				}
			}

		$scope._get_input_values_analyses =
			function (worksheet_id, analyst) {
				function get_analyses(worksheet_id) {
					this.worksheet = _.findWhere($scope.worksheets, {'id': worksheet_id});
					this.analyses = [];
					_.each(JSON.parse(this.worksheet.remarks), function(remarks) {
						this.analyses.push(remarks.obj_path);
					});
					return this.analyses;
				}

				if (!Array.isArray(worksheet_id)) {
					var input_values = {};
					this.analyses = get_analyses(worksheet_id);
					_.each(this.analyses, function(path) {
						input_values[path] = {Analyst: analyst.userid};
					});

					return JSON.stringify(input_values);
				}
				else if (Array.isArray(worksheet_id)) {
					var input_values = {};
					_.each(worksheet_id,function(id) {
						this.analyses = get_analyses(id);
						_.each(this.analyses, function(path) {
							input_values[path] = {Analyst: analyst.userid};
						});
					});
					return JSON.stringify(input_values);
				}
			}

		$scope._get_worksheet_path =
			function(worksheet_id) {
				this.worksheet = _.findWhere($scope.worksheets, {'id': worksheet_id});
				return this.worksheet.path;
			}

		this.change_review_state =
			function (action, worksheet_id) {
				if (worksheet_id === undefined) {
					var worksheet_id = $scope.checked_list;
				}

				if (action === 'close') {
					 $scope.closeWorksheet(worksheet_id);
				}
				else if (action === 'open') {
					 $scope.openWorksheet(worksheet_id);
				}
				else if (action === 'cancel') {
					 $scope.cancelWorksheet(worksheet_id);
				}
				else if (action === 'reinstate') {
					 $scope.reinstateWorksheet(worksheet_id);
				}
				else if (action === 'reassign') {
					$scope.reassignWorksheet(worksheet_id);
				}
			}

		this.count_analyses = function(remarks) {
			analyses = JSON.parse(remarks);
			return analyses.length;
		}

		 $scope.sort = function(keyname){
			$scope.sortKey = keyname;   //set the sortKey to the param passed
			$scope.reverse = !$scope.reverse; //if true make it false and vice versa
		}
});

worksheets_module.controller('WorksheetDetailsCtrl',
	function(BikaService, Utility, ngCart, $stateParams, config, $scope, $rootScope) {

		$scope.worksheet = [];
		$scope.worksheet_details = [];
		$scope.checked_list = [];
		$scope.state = {worksheet_id: $stateParams.worksheet_id};
		$scope.attachment = {content: [], sample_list:[], samplesheet: [], batches: []};

		$scope.analyses = [];
		$scope.analysis_results = Array();

		$scope.stickers={id:null};
		$scope.worksheets = [];
		$scope.analysts = [];

		$scope.loading_worksheet = Utility.loading({
            busyText: 'Wait while loading worksheet data...',
            delayHide: 1000,
        });

        $scope.loading_blackboard = Utility.loading({
            busyText: 'Wait while updating board...',
            delayHide: 1000,
        });

		$scope.loading_change_review_state =
        	function(text) {
        		this.params = {
	        		busyText: text===undefined?'Wait...':'Wait while ' + text + '...',
            		delayHide: 1000,
            		theme: 'warning',
        		}
        		return Utility.loading(this.params);
        	};

		 $scope.getWorksheet =
            function(worksheet_id) {
            	$scope.loading_worksheet.show();
                this.params = {sort_on: 'Date', sort_order: 'descending', id: worksheet_id};
                BikaService.getWorksheets(this.params).success(function (data, status, header, config){
                    $scope.worksheet = data.result.objects[0];
                    var analyses = JSON.parse($scope.worksheet.remarks);
                    var transitions = Array();
                    var workflow_transitions = Array();
					var worksheet_details = Array();
					var is_there_samplesheet = false;

					var ids = [];
					_.each(analyses, function(a){
						if (ids.indexOf(a.request_id) === -1) {ids.push(a.request_id);}
					});
					this.params = {'ids': ids.join('|')};
					BikaService.getAnalysisRequests(this.params).success(function (data, status, header, config){
						this.result = data.result.objects;
						_.each(this.result, function(analysis_request){
							_.each(_.where(analyses, {'request_id': analysis_request.id}), function(a){
								var ar = JSON.parse(JSON.stringify(analysis_request));
								var analysis =  _.findWhere(ar.analyses, {'id': a.analysis_id});
								ar.analyses = analysis;
								worksheet_details.push(ar);

								Utility.merge(transitions,ar.transitions,'id');
								Utility.merge(workflow_transitions,ar.analyses.transitions,'id');
								$scope.transitions = transitions;
								$scope.workflow_transitions = workflow_transitions;
								if (worksheet_details.length == analyses.length) {
									$scope.worksheet_details = worksheet_details;
									//$scope.loading_worksheet.hide();
								}
								if (_.indexOf($scope.attachment.batches,ar.batch_title) == -1) {$scope.attachment.batches.push(ar.batch_title);}
								$scope.analysis_results.push({'request_id': ar.id, 'analysis_id': a.analysis_id, 'result': (ar.analyses.review_state === 'sample_received' || ar.analyses.review_state === 'sample_due')?1:ar.analyses.result});
								if (is_there_samplesheet === false && (ar.sample_type == 'SAMPLE-IN-MISEQ' || ar.sample_type == 'SAMPLE-IN-POOL' || ar.sample_type == 'SAMPLE-IN-FLOWCELL')) {
									this.ar_params = {'title': ar.batch_id};
									is_there_samplesheet = true;
									BikaService.getAnalysisRequests(this.ar_params).success(function (data, status, header, config){
										this.result = data.result.objects;
										_.each(this.result,function(obj) {
											if ($scope.attachment.content.length === 0 && obj.remarks != '') {
												$scope.attachment.samplesheet = obj.remarks;
												_.each(JSON.parse(obj.remarks), function(obj) {
													row = obj.split(',');
													$scope.attachment.content.push(row);
												});

											}

										});
									});
								}

							});
						});
					});
                });
            };

        $scope.getWorksheet($scope.state.worksheet_id);



		this.format_date =
			function(date) {
				return Utility.format_date(date);
			};

		this.format_review_state =
			function(review_state) {
				return Utility.format_review_state(review_state);
			};

		this.results = config.legend.analysis_result;

		this.format_result =
			function(result) {
				return Utility.format_result(result);
			}

		this.check_transitions =
			function(id_transition, transitions) {
				if (transitions === undefined) {
					var transitions = $scope.transitions;
				}
				return Utility.check_transitions(id_transition, transitions);
		}

		this.toggle =
			function(request_id, analysis_id) {
				var idx = _.indexOf($scope.checked_list, _.findWhere($scope.checked_list,  {'request_id': request_id, 'analysis_id': analysis_id}));
				if (idx > -1) {
					$scope.checked_list.splice(idx, 1);
				}
				else {
					$scope.checked_list.push({'request_id': request_id, 'analysis_id': analysis_id});
				}
			}

		this.toggle_all = function() {
				if ($scope.checked_list.length < $scope.worksheet_details.length) {
					_.each($scope.worksheet_details,function(b) {
						var request_id = b.id;
						var analysis_id = b.analyses.id;
						$scope.checked_list.push({'request_id': request_id, 'analysis_id': analysis_id});
					});
				}
				else {
					$scope.checked_list = [];
				}
		}

		$scope.receiveSample =
			function(request_id) {
				if (Array.isArray(request_id) && request_id.length == 0) {
					Utility.alert({title:'Nothing to receive<br/>', content:'Please select at least a Sample', alertType:'warning'});
					return;
				}
				$scope.loading_change_review_state('receiving samples').show();

				this.params = {f: $scope._get_review_params(request_id)};

				BikaService.receiveSample(this.params).success(function (data, status, header, config){
					this.result = data.result;
				 	if (this.result.success === 'True') {
				 		this.params = {input_values: $scope._get_input_values_review_state(request_id, 'sample_received')};
						BikaService.updateAnalysisRequests(this.params).success(function (data, status, header, config){
							$scope.checked_list = [];
							$scope.loading_change_review_state('receiving samples').hide();
							$scope.getWorksheet($scope.state.worksheet_id);
						});
				 	} else {
						Utility.alert({title:'Error while receiving samples...', content: this.result['message'], alertType:'danger'});
						return;
				 	}
				});
			}

		$scope._get_input_values_review_state =
			function (ar_id, review_state) {
				//ar_id = ar_id.split('|');
				var input_values = {};
				_.each(ar_id,function(id) {

					ar = _.findWhere($scope.worksheet_details, {'id': id});
					if (ar != undefined) {
						input_values[ar.path] = {subject: review_state!==undefined?review_state:ar.review_state};
					}

				});
				return JSON.stringify(input_values);
			}

		$scope.submit =
			function(request_id, analysis_id) {

				if (Array.isArray(request_id) && request_id.length == 0) {
					Utility.alert({title:'Nothing to submit<br/>', content:'Please select at least a Sample', alertType:'warning'});
					return;
				}
				$scope.loading_change_review_state('submitting').show();
				this.params = {input_values: $scope._get_input_values(request_id, analysis_id)};
				BikaService.setAnalysesResults(this.params).success(function (data, status, header, config){
				 	this.result = data.result;

				 	if (this.result.success === 'True') {
				 		this.params = {f: $scope._get_action_params(request_id, analysis_id)}
				 		BikaService.submit(this.params).success(function (data, status, header, config){
				 			this.result = data.result;
				 			$scope.loading_change_review_state('submitting').hide();
				 			if (this.result.success === 'True') {
				 				$scope.checked_list = [];
				 				$scope.getWorksheet($scope.state.worksheet_id);
				 			} else {
				 				Utility.alert({title:'Error while submitting..', content: this.result['message'], alertType:'danger'});
								return;
				 			}
				 		});
				 	} else {
						Utility.alert({title:'Error while submitting...', content: this.result['message'], alertType:'danger'});
						return;
				 	}
				});
			}

		$scope.verify =
			function(request_id, analysis_id) {
				if (Array.isArray(request_id) && request_id.length == 0) {
					Utility.alert({title:'Nothing to verify<br/>', content:'Please select at least a Sample', alertType:'warning'});
					return;
				}
				$scope.loading_change_review_state('verifying').show();
				this.params = {f: $scope._get_action_params(request_id, analysis_id)}
				BikaService.verify(this.params).success(function (data, status, header, config){
					$scope.loading_change_review_state('verifying').hide();
					this.result = data.result;
					if (this.result.success === 'True') {
						$scope.checked_list = [];
						$scope.getWorksheet($scope.state.worksheet_id);
					} else {
				 		Utility.alert({title:'Error while verifying..', content: this.result['message'], alertType:'danger'});
						return;
				 	}
				 });
			}

		$scope.publish =
			function(request_id, analysis_id) {
				if (Array.isArray(request_id) && request_id.length == 0) {
					Utility.alert({title:'Nothing to publish<br/>', content:'Please select at least a Sample', alertType:'warning'});
					return;
				}
				$scope.loading_change_review_state('publishing').show();
				this.params = {f: $scope._get_action_params(request_id, analysis_id,'publish')}

				BikaService.publish(this.params).success(function (data, status, header, config){
					$scope.loading_change_review_state('publishing').hide();
					this.result = data.result;
					if (this.result.success === 'True') {
						$scope.checked_list = [];
						$scope.publish_params = {analyses: []};
						$scope.getWorksheet($scope.state.worksheet_id);
					} else {
				 		Utility.alert({title:'Error while publishing..', content: this.result['message'], alertType:'danger'});
						return;
				 	}
				 });
			}

		$scope._get_action_params =
			function(request_id, analysis_id, action) {

				if (!Array.isArray(request_id) && !Array.isArray(analysis_id)) {
					var f = []
					f.push($scope._get_analysis_path(request_id, analysis_id));
					return JSON.stringify(f);
				}
				else if (Array.isArray(request_id)) {
					var f = [];
					_.each(request_id,function(request_obj) {
							//if (action !== undefined && action=='publish') {
							//	f.push($scope._get_analysis_path(request_obj.request_id));
							//}
							f.push($scope._get_analysis_path(request_obj.request_id,request_obj.analysis_id));
					});
					return JSON.stringify(f);
				}

			}

		$scope._get_review_params =
			function(request_id) {

				if (!Array.isArray(request_id)) {
					var f = [];
					f.push($scope._get_analysis_path(request_id));
					return JSON.stringify(f);
				}
				else if (Array.isArray(request_id)) {
					var f = [];
					_.each(request_id,function(id) {
						f.push($scope._get_analysis_path(id));
					});
					return JSON.stringify(f);
				}

			}



		$scope._get_input_values =
			function (request_id, analysis_id) {
				if (!Array.isArray(request_id) && !Array.isArray(analysis_id)) {
					var input_values = {};
					input_values[$scope._get_analysis_path(request_id,analysis_id)] = {Result: $scope._get_analysis_result(request_id, analysis_id)}
					return JSON.stringify(input_values);
				}
				else if (Array.isArray(request_id)) {
					var input_values = {};
					_.each(request_id,function(request_obj) {
						input_values[$scope._get_analysis_path(request_obj.request_id,request_obj.analysis_id)] = {Result: $scope._get_analysis_result(request_obj.request_id,request_obj.analysis_id)}
					});
					return JSON.stringify(input_values);
				}
			}

		$scope._get_analysis_path =
			function(request_id, analysis_id) {
				request = _.findWhere($scope.worksheet_details, {'id': request_id});
				if (analysis_id === undefined) {
					return request.path;
				}
				else {return request.path + "/" + analysis_id;}
			}

		$scope._get_analysis_result =
			function(request_id, analysis_id) {

				analysis_results = _.findWhere($scope.analysis_results, {'request_id': request_id, 'analysis_id': analysis_id});

				return analysis_results.result.toString();
			}

		this.change_review_state =
			function (action, id) {
				if (id === undefined) {
					id = Array();
					_.each($scope.checked_list, function(i) {
						id.push(i.request_id);
					});

				}
				if (action === 'receive') {
					 $scope.receiveSample(id);
				}
				else if (action === 'cancel') {
					 $scope.cancelAnalysisRequest(id);
				}
			}

		this.change_workflow_review_state =
			function (action, request_id, analysis_id) {
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

		this.add_to_blackboard =
			function(ids) {
				//console.log(ids);
				_.each(ids,function(id) {
					$scope.loading_blackboard.show();
					ar = _.findWhere($scope.worksheet_details, {'id': id.request_id});
					if (ngCart.getItemById(ar.id) === false ) {
						ngCart.addItem(ar.id,ar.id,1,1,ar);
					}
					$scope.loading_blackboard.hide();
				});
				$scope.checked_list = [];
			}

		this.remove_from_blackboard =
			function(ids) {
				_.each(ids,function(id) {
					ar = _.findWhere($scope.worksheet_details, {'id': id.request_id});
					if (ngCart.getItemById(ar.id) !== false ) {
						ngCart.removeItemById(ar.id);
					}
				});
				$scope.checked_list = [];
			}

		$scope.sort = function(keyname){
			$scope.sortKey = keyname;   //set the sortKey to the param passed
			$scope.reverse = !$scope.reverse; //if true make it false and vice versa
		}

});