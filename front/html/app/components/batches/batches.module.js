var batches_module = angular.module('BatchesModule',[]);

batches_module.run(function($rootScope){
  $rootScope._ = _;
});

batches_module.controller('BatchesCtrl',
	function(BikaService, Utility, config, ngCart, $scope, $rootScope) {

		$scope.loading_search = Utility.loading({
            busyText: 'Wait while searching batches...',
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

		$scope.checked_list = [];
		$scope.review_state = 'open';

		$scope.pagination= {
			page_nr: 0,
			page_size: 25,
			total: 0,
			current: 1,
			last: 0,
		};

		$scope.samples = {};

		this.changePage = function(newPageNumber, oldPageNumber) {
			if (newPageNumber !== undefined) {
				$scope.pagination.page_nr = newPageNumber-1;
				$scope.pagination.current = newPageNumber;
			}
			$scope.getBatches($scope.review_state);
		}

		// :: function :: getBatches()
        $scope.getBatches =
            function(review_state) {
            	$scope.loading_search.show();
            	$scope.review_state = review_state;
                $scope.batches = [];
                this.params = {sort_on: 'id', sort_order: 'descending', Subject: review_state,
                	page_nr: $scope.pagination.page_nr, page_size: $scope.pagination.page_size};

                BikaService.getBatches(this.params).success(function (data, status, header, config){
                    $scope.batches = data.result.objects;
                    $scope.pagination.total = data.result.total;
                    $scope.pagination.last = data.result.last;
					transitions = Array();
					_.each($scope.batches,function(obj) {
						Utility.merge(transitions,obj.transitions,'id');
					});
                    $scope.transitions = transitions;
					$scope.loading_search.hide();
					//$rootScope.counter = DashboardService.update_dashboard();
					$scope.count_samples();
                });
            };

		$scope.count_samples = function() {
			_.each($scope.batches,function(batch) {
					this.params = {title: batch.id, include_fields: 'path'};
					BikaService.countAnalysisRequests(this.params).success(function (data, status, header, config){
						$scope.samples[batch.id] = data.result;
                	});
			});
		}



        $scope.closeBatch =
			function(batch_id) {
				$scope.loading_change_review_state('closing batches').show();
				this.params = {f: $scope._get_review_params(batch_id)};

				BikaService.closeBatch(this.params).success(function (data, status, header, config){
//					console.log(data);
					this.params = {input_values: $scope._get_input_values_review_state(batch_id,'closed')};
//					console.log(this.params);
					BikaService.updateBatches(this.params).success(function (data, status, header, config){
						$scope.loading_change_review_state('closing batches').hide();
						$scope.checked_list = [];
				 		$scope.getBatches($scope.review_state);
					});
				});

			}

		$scope.openBatch =
			function(batch_id) {
				$scope.loading_change_review_state('opening batches').show();
				this.params = {f: $scope._get_review_params(batch_id)};
				BikaService.openBatch(this.params).success(function (data, status, header, config){
					this.params = {input_values: $scope._get_input_values_review_state(batch_id,'open')};
					BikaService.updateBatches(this.params).success(function (data, status, header, config){
						$scope.loading_change_review_state('opening batches').hide();
						$scope.checked_list = [];
				 		$scope.getBatches($scope.review_state);
					});
				});


			}

		$scope.cancelBatch =
			function(batch_id) {
				$scope.loading_change_review_state('deleting batches').show();
				this.params = {f: $scope._get_review_params(batch_id)};
				BikaService.cancelBatch(this.params).success(function (data, status, header, config){
					this.params = {input_values: $scope._get_input_values_review_state(batch_id,'cancelled')};
					BikaService.updateBatches(this.params).success(function (data, status, header, config){
						$scope.loading_change_review_state('deleting batches').hide();
						$scope.checked_list = [];
				 		$scope.getBatches($scope.review_state);
					});

				});

			}

		$scope.reinstateBatch =
			function(batch_id) {
				$scope.loading_change_review_state('reinstating batches').show();
				this.params = {f: $scope._get_review_params(batch_id)};
				BikaService.reinstateBatch(this.params).success(function (data, status, header, config){
					this.params = {input_values: $scope._get_input_values_review_state(batch_id)};
					BikaService.updateBatches(this.params).success(function (data, status, header, config){
						$scope.loading_change_review_state('reinstating batches').hide();
						$scope.checked_list = [];
				 		$scope.getBatches($scope.review_state);
					});
				});

			}

		$scope._get_input_values_review_state =
			function (batch_id, review_state) {
//				batch_id = batch_id.split('|');
				var input_values = {};
				_.each(batch_id,function(id) {
					batch = _.findWhere($scope.batches, {'id': id});
					input_values[batch.path] = {subject: review_state!==undefined?review_state:batch.review_state};
				});
				return JSON.stringify(input_values);
			}

		$scope._get_review_params =
			function(batch_id) {

				if (!Array.isArray(batch_id)) {
					var f = [];
					this.batch = _.findWhere($scope.batches, {'id':batch_id});
					f.push(this.batch.path);
					return JSON.stringify(f);
				}
				else if (Array.isArray(batch_id)) {
					var f = [];
					_.each(batch_id,function(id) {
						this.batch = _.findWhere($scope.batches, {'id':id});
						f.push(this.batch.path);
					});
					return JSON.stringify(f);
				}

			}



        $scope.sort = function(keyname){
			$scope.sortKey = keyname;   //set the sortKey to the param passed
			$scope.reverse = !$scope.reverse; //if true make it false and vice versa
		}


        $scope.init =
			function() {
			    this.params = {};
			    $scope.clients = [];
			    $scope.loading_search.show();
                 BikaService.getClients(this.params).success(function (data, status, header, config){
                    $scope.clients = data.result.objects;
                    $scope.getBatches($scope.review_state);
                });
	    }

	    $scope.init();

        this.get_client_id =
			function(client_title) {
				this.client = _.findWhere($scope.clients, {title: client_title});
				return this.client.id;
        }

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
				if ($scope.checked_list.length < $scope.batches.length) {
					_.each($scope.batches,function(b) {
						$scope.checked_list.push(b.id);
					})
				}
				else {
					$scope.checked_list = [];
				}
		}



		this.change_review_state =
			function (action, batch_id) {
				if (batch_id === undefined) {
					var batch_id = $scope.checked_list;
				}
				else { batch_id = [batch_id];}

				if (action === 'close') {
					 $scope.closeBatch(batch_id);
				}
				else if (action === 'open') {
					 $scope.openBatch(batch_id);
				}
				else if (action === 'cancel') {
					 $scope.cancelBatch(batch_id);
				}
				else if (action === 'reinstate') {
					 $scope.reinstateBatch(batch_id);
				}
			}

		this.add_to_blackboard =
			function(batch_ids) {

				_.each(batch_ids,function(batch_id) {
					$scope.loading_blackboard.show();
					this.params = {title: batch_id};
					BikaService.getAnalysisRequests(this.params).success(function (data, status, header, config){
						var analysis_requests = data.result.objects;
						_.each(analysis_requests, function(ar) {
							if (ngCart.getItemById(ar.id) === false ) {
								ngCart.addItem(ar.id,ar.id,1,1,ar);
							}
						});
						$scope.loading_blackboard.hide();
					});
				});
				$scope.checked_list = [];
			}

		this.remove_from_blackboard =
			function(batch_ids) {
				_.each(batch_ids,function(batch_id) {
					this.params = {title: batch_id};
					BikaService.getAnalysisRequests(this.params).success(function (data, status, header, config){
						var analysis_requests = data.result;
						_.each(analysis_requests, function(ar) {
							if (ngCart.getItemById(ar.id) !== false ) {
								ngCart.removeItemById(ar.id);
							}
						});
					})
				});
				$scope.checked_list = [];
			}

});


batches_module.controller('BatchDetailsCtrl',
	function(BikaService, Utility, ngCart, $stateParams, $state, config, $scope, $rootScope) {

		$scope.batch = [];
		$scope.analyses = []
		$scope.analysis_requests = [];
		$scope.checked_list = [];
		$scope.review_state = 'active';
		$scope.stickers={id:null};
		$scope.state = {batch_id: $stateParams.batch_id};
		$scope.attachment = {content: [], sample_list:[], samplesheet: [], batches: []};

		$scope.pagination= {
			page_nr: 0,
			page_size: 250,
			total: 0,
			current: 1,
			last: 0,
		};

		this.changePage = function(newPageNumber, oldPageNumber) {
			if (newPageNumber !== undefined) {
				$scope.pagination.page_nr = newPageNumber-1;
				$scope.pagination.current = newPageNumber;
			}
			//$scope.getAnalysisRequests($stateParams.batch_id, $stateParams.review_state);
			$scope.getBatch($stateParams.batch_id);
		}

		$scope.loading_batch = Utility.loading({
            busyText: 'Wait while loading batch data...',
            delayHide: 1000,
        });

        $scope.loading_ars = Utility.loading({
            busyText: 'Wait while loading analyses...',
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

		$scope.get_sample_list =
			function(batch_id) {
				this.params = {sort_on: 'getId', sort_order: 'ascending', title: batch_id};
				BikaService.getAnalysisRequests(this.params).success(function (data, status, header, config){
					var analysis_requests = data.result.objects;
					_.each(analysis_requests,function(ar) {
						if (ar.sample_type.match('SAMPLE-IN-')) {
							$scope.attachment.sample_list.push({sample: ar.sample_id+'|'+ar.client_sample_id,
							Sample_ID: ar.sample_id,
							Sample_Name: ar.client_sample_id});
						}
					});
				});
			}

		$scope.getAnalysisRequests =
            function(batch_id, review_state, print_stickers) {
            	$scope.loading_ars.show();
            	$scope.review_state = review_state;
                $scope.analysis_requests = [];
                this.params = {sort_on: 'getId', sort_order: 'ascending', title: batch_id,
                	page_nr: $scope.pagination.page_nr, page_size: $scope.pagination.page_size};

				if (review_state === 'active') {
					this.params['Subjects'] = 'sample_due|sample_received|to_be_verified|verified|published';
				}
				else if (review_state === 'published') {
					this.params['review_state'] = review_state;
				}
				else {
					this.params['Subject'] = review_state;
				}
                BikaService.getAnalysisRequests(this.params).success(function (data, status, header, config){
                    $scope.analysis_requests = data.result.objects;
                    $scope.pagination.total = data.result.total;
                    $scope.pagination.last = data.result.last;
                    transitions = Array();
					_.each($scope.analysis_requests,function(obj) {

						if ($scope.attachment.content.length === 0 && obj.remarks != '') {
							$scope.attachment.samplesheet = obj.remarks;
							var start_sample_list = false;
							var index_desc = -1;
							var sample_type = obj.sample_type;

							var batch_title = $scope.batch.title.replace(obj.client_sample_id,'');
							if (batch_title === $scope.batch.title) {$scope.attachment.batches.push(batch_title);}

							_.each(JSON.parse(obj.remarks), function(obj) {
								row = obj.split(',');
								$scope.attachment.content.push(row);
								if (start_sample_list
									&& row.length > 1
									&& batch_title != $scope.batch.title
									&& _.indexOf($scope.attachment.batches,batch_title+row[index_desc]) === -1) {

									$scope.attachment.batches.push(batch_title+row[index_desc]);
								}
								if (_.indexOf(row,'Sample_ID') != -1) {
									start_sample_list = true;
									index_desc = _.indexOf(row,'Sample_Project')+1;
								}

							});
							//$scope.get_sample_list($stateParams.batch_id);
						}

						Utility.merge(transitions,obj.transitions,'id');
						if (obj.analyses.length > 0 && $scope.analyses.length == 0 && $scope.review_state == 'active' ) {
							$scope.analyses = obj.analyses;
						}
					});
//                    console.log($scope.attachment);
                    $scope.transitions = transitions;
                    $scope.loading_ars.hide();
                    if (print_stickers !==undefined && print_stickers === true) {
                    	Utility.print_stickers($scope.stickers.id, $scope.batch.path);
                    }
                    //$rootScope.counter = DashboardService.update_dashboard();
                });
            };

		// :: function :: getBatch()
        $scope.getBatch =
            function(batch_id) {
                this.params = {sort_on: 'Date', sort_order: 'descending', id: batch_id};
                BikaService.getBatches(this.params).success(function (data, status, header, config){
                    $scope.batch = data.result.objects[0];

                    $scope.loading_batch.hide();
                    $scope.getAnalysisRequests($scope.batch.id, $scope.review_state);
                });
            };

        $scope.sort = function(keyname){
			$scope.sortKey = keyname;   //set the sortKey to the param passed
			$scope.reverse = !$scope.reverse; //if true make it false and vice versa
		}

		$scope.init =
		    function() {
            	$scope.loading_batch.show();
                BikaService.getClients(this.params_clients).success(function (data, status, header, config){
                    $scope.clients = data.result.objects;
                    BikaService.getSupplyOrders(this.params).success(function (data, status, header, config){
                        $scope.cost_centers = data.result.objects;
                        $scope.getBatch($stateParams.batch_id);
                    });
                });
		}

        $scope.init()

        this.get_client_id =
            function(client_title, clients){
                this.client = _.findWhere(clients, {title: client_title});
                if (this.client !== undefined) {
                	return this.client.id;
                }
				return '';
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

		this.check_transitions = function(id_transition, transitions) {
			if (transitions === undefined) {
				var transitions = $scope.transitions;
			}
			return Utility.check_transitions(id_transition, transitions);
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
				if ($scope.checked_list.length < $scope.analysis_requests.length) {
					_.each($scope.analysis_requests,function(ar) {
						$scope.checked_list.push(ar.id);
					})
				}
				else {
					$scope.checked_list = [];
				}
		}

		$scope.cancelAnalysisRequest =
			function(id) {
				$scope.loading_change_review_state('deleting analysis requests').show();
				this.params = {f: $scope._get_review_params(id)};
				BikaService.cancelAnalysisRequest(this.params).success(function (data, status, header, config){
					this.params = {input_values: $scope._get_input_values_review_state(id,'cancelled')};
					BikaService.updateAnalysisRequests(this.params).success(function (data, status, header, config){
						$scope.checked_list = [];
						$scope.loading_change_review_state('deleting analysis requests').hide();
						$state.go('batch',{'batch_id': $scope.batch.id},{reload: true});
					});
				});

			}

		$scope.reinstateAnalysisRequest =
			function(id) {
				$scope.loading_change_review_state('reinstating analysis requests').show();
				this.params = {f: $scope._get_review_params(id)};
				BikaService.reinstateAnalysisRequest(this.params).success(function (data, status, header, config){
				 	this.params = {input_values: $scope._get_input_values_review_state(id, 'reinstated')};
					BikaService.updateAnalysisRequests(this.params).success(function (data, status, header, config){
						$scope.checked_list = [];
						$scope.loading_change_review_state('reinstating analysis requests').hide();
						$state.go('batch',{'batch_id': $scope.batch.id},{reload: true});
					});
				 });

			}

		$scope.receiveSample =
			function(id) {
				$scope.loading_change_review_state('receiving samples').show();
				this.params = {f: $scope._get_review_params(id)};
				BikaService.receiveSample(this.params).success(function (data, status, header, config){
					this.params = {input_values: $scope._get_input_values_review_state(id, 'sample_received')};
					BikaService.updateAnalysisRequests(this.params).success(function (data, status, header, config){
						$scope.checked_list = [];
						$scope.loading_change_review_state('receiving samples').hide();
						//$scope.getAnalysisRequests($scope.batch.id, $scope.review_state);
						$state.go('batch',{'batch_id': $scope.batch.id},{reload: true});
					});

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
					this.result = data.result;
					if (this.result.success === 'True') {
						this.params = {input_values: $scope._get_input_values_review_state(request_id, 'published')};
						BikaService.updateAnalysisRequests(this.params).success(function (data, status, header, config){
							$scope.checked_list = [];
							$scope.loading_change_review_state('receiving samples').hide();
							//$scope.getAnalysisRequests($scope.batch.id, $scope.review_state);
							$state.go('batch',{'batch_id': $scope.batch.id},{reload: true});

						});

					}
					else {
				 		Utility.alert({title:'Error while publishing..', content: this.result['message'], alertType:'danger'});
				 		$scope.getAnalysisRequests($stateParams.batch_id);
						return;
				 	}
				 });
			}

		$scope.republish =
			function(request_id, analysis_id) {
				if (Array.isArray(request_id) && request_id.length == 0) {
					Utility.alert({title:'Nothing to publish<br/>', content:'Please select at least a Sample', alertType:'warning'});
					return;
				}
				$scope.loading_change_review_state('publishing').show();
				this.params = {f: $scope._get_action_params(request_id, analysis_id,'publish')}

				BikaService.republish(this.params).success(function (data, status, header, config){
					this.result = data.result;
					if (this.result.success === 'True') {
						this.params = {input_values: $scope._get_input_values_review_state(request_id, 'published')};
						BikaService.updateAnalysisRequests(this.params).success(function (data, status, header, config){
							$scope.checked_list = [];
							$scope.loading_change_review_state('receiving samples').hide();
							//$scope.getAnalysisRequests($scope.batch.id, $scope.review_state);
							$state.go('batch',{'batch_id': $scope.batch.id},{reload: true});

						});

					}
					else {
				 		Utility.alert({title:'Error while publishing..', content: this.result['message'], alertType:'danger'});
				 		$scope.getAnalysisRequests($stateParams.batch_id);
						return;
				 	}
				 });
			}

		$scope._get_review_params =
			function(request_id) {

				if (!Array.isArray(request_id)) {
					var f = [];
					f.push($scope._get_path(request_id));
					return JSON.stringify(f);
				}
				else if (Array.isArray(request_id)) {
					var f = [];
					_.each(request_id,function(id) {
						f.push($scope._get_path(id));
					});
					return JSON.stringify(f);
				}

			}

		$scope._get_path =
			function(request_id) {
				request = _.findWhere($scope.analysis_requests, {'id': request_id});
				return request.path;
			}

		$scope._get_input_values_ =
			function (ar_id, review_state) {
				//ar_id = ar_id.split('|');
				var input_values = {};
				_.each(ar_id,function(id) {
					ar = _.findWhere($scope.analysis_requests, {'id': id});
//					console.log(ar);
					input_values[ar.path] = {subject: review_state!==undefined?review_state:ar.review_state};
				});
				return JSON.stringify(input_values);
			}

		$scope._get_input_values_review_state =
			function (ar_id, review_state) {
				//ar_id = ar_id.split('|');
				var input_values = {};
				_.each(ar_id,function(id) {
					ar = _.findWhere($scope.analysis_requests, {'id': id});
					if (review_state === "published") {
						input_values[ar.path] = {subject: review_state!==undefined?review_state:ar.review_state, DatePublished: Utility.format_date()};
					}
					else if (review_state === 'reinstated'){

						if (ar.date_received === undefined || ar.date_received === null || ar.date_received === 'None' || ar.date_received.length === 0) {
							input_values[ar.path] = {subject: 'sample_due'};
						}
						else {
							input_values[ar.path] = {subject: 'sample_received'};
						}
					}
					else {
						input_values[ar.path] = {subject: review_state!==undefined?review_state:ar.review_state};
					}
				});
				return JSON.stringify(input_values);
			}

		$scope._get_action_params =
			function(request_id, analysis_id, action) {
				if (!Array.isArray(request_id) && analysis_id === undefined) {
					var f = []
					f.push($scope._get_path(request_id));
					return JSON.stringify(f);
				}
				else if (Array.isArray(request_id) && analysis_id === undefined) {
					var f = []
					_.each(request_id,function(request_obj) {
						f.push($scope._get_path(request_obj));
					});
					return JSON.stringify(f);
				}

			}

		this.change_review_state =
			function (action, id) {
				if (id === undefined) {
					var id = $scope.checked_list;
				}
				else {var id = [id];}

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

		this.change_workflow_review_state =
			function (action, request_id, analysis_id) {
				if (action === 'publish') {
					 $scope.publish(request_id, analysis_id);
				}
				else if (action === 'republish') {
					 $scope.republish(request_id, analysis_id);
				}

			}

		this.get_filename =
			function () {
				if ($scope.analysis_requests === undefined || $scope.analysis_requests.length===0) {return 'download.csv';}
				if ($scope.analysis_requests[0].sample_type === 'FLOWCELL') {
					return 'samplesheet_' + $scope.analysis_requests[0].sample_id + '_' + $scope.analysis_requests[0].client_sample_id + '.csv';
				}
				else if ($scope.analysis_requests[0].sample_type === 'MISEQ') {
					return 'samplelist_' + $scope.analysis_requests[0].sample_id + '_' + $scope.analysis_requests[0].client_sample_id + '.csv';
				}
				else if ($scope.analysis_requests[0].sample_type === 'POOL') {
					return 'samplelist_' + $scope.analysis_requests[0].sample_id + '_' + $scope.analysis_requests[0].client_sample_id + '.csv';
				}

				return 'filename.csv'
			}

		this.check_attachment_type =
			function (attachment_type) {
				if ($scope.analysis_requests[0] === undefined) {return false;}
				if (attachment_type === 'samplesheet') {
					return $scope.analysis_requests[0].sample_type === 'MISEQ' || $scope.analysis_requests[0].sample_type === 'FLOWCELL' || $scope.analysis_requests[0].sample_type === 'POOL';
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

		$scope.edit_params = {selectedDate:Utility.format_date(), whichDate: null};

		this.edit =
			function(edit_params, checked_list) {
				if (edit_params.whichDate === null) {
					Utility.alert({title:'Nothing to edit<br/>', content:'Please select date type', alertType:'danger'});
					return;
				}
				if (checked_list.length === 0 ) {
					Utility.alert({title:'Nothing to edit<br/>', content:'Please select at least a Sample', alertType:'danger'});
					return;
				}
				var input_values = {};
				_.each(checked_list,function(id) {
					ar = _.findWhere($scope.analysis_requests, {'id': id});
					if (edit_params.whichDate === 'created_date') {
						input_values[ar.path] = {creation_date: Utility.format_date(edit_params.selectedDate)};
					}
					else if (edit_params.whichDate === 'received_date') {
						input_values[ar.path] = {DateReceived: Utility.format_date(edit_params.selectedDate)};
					}
					else if (edit_params.whichDate === 'published_date') {
						input_values[ar.path] = {DatePublished: Utility.format_date(edit_params.selectedDate)};
					}
				});
				$scope.loading_change_review_state('updating...').show();
				this.params = {input_values: JSON.stringify(input_values)};
				BikaService.updateAnalysisRequests(this.params).success(function (data, status, header, config){
					$scope.checked_list = [];
					$scope.loading_change_review_state('updating...').hide();
					$scope.getAnalysisRequests($scope.batch.id, $scope.review_state);
				});
		};
});

batches_module.controller('BatchBookCtrl',
	function(BikaService, IrodsService, Utility, ngCart, $stateParams, $state, config, $scope, $modal, $rootScope) {

		//$scope.batch = [];
		$scope.analyses = [];
		$scope.analysis_requests = [];
		//$scope.analysis_results = [];
		$scope.checked_list = [];
		$scope.batch_id = $stateParams.batch_id;
		//$scope.workflow_params = {analyses: []};
		$scope.workflow_params = {
			analyses: [],
			worksheet: null,
			analyst: null,
			worksheet_title: null,
			worksheet_description: null,
			switchWorksheet: false,
		};

        $scope.delivery_params = {
			delivery: null,
			export_mode: null,
			title: null,
			description: null,
			switchDelivery: false,
			switchMerge: true,
			runs: [],
            path: null,
            recipients: null,
		};
        $scope.export_mode = config.bikaApiRest.data_source.export_mode;

		$scope.stickers={id:null};
		$scope.worksheets = [];
		$scope.analysts = [];


		$scope.pagination= {
			page_nr: 0,
			page_size: 250,
			total: 0,
			current: 1,
			last: 0,
		};

		this.changePage = function(newPageNumber, oldPageNumber) {
			if (newPageNumber !== undefined) {
				$scope.pagination.page_nr = newPageNumber-1;
				$scope.pagination.current = newPageNumber;
			}
			$scope.getAnalysisRequests($stateParams.batch_id);
		}


		$scope.loading_change_review_state =
        	function(text) {
        		this.params = {
	        		busyText: text===undefined?'Wait...':'Wait while ' + text + '...',
            		delayHide: 1000,
            		theme: 'warning',
        		}
        		return Utility.loading(this.params);
        	};


        $scope.getBatch =
            function(batch_id) {
                this.params = {sort_on: 'Date', sort_order: 'descending', id: batch_id};
                BikaService.getBatches(this.params).success(function (data, status, header, config){
                    $scope.batch = data.result.objects[0];
                    this.params = {Title: $scope.batch.client};
                    BikaService.getClients(this.params).success(function (data, status, header, config){
                        client = _.findWhere(data.result.objects,{name: $scope.batch.client});
                        $scope.contacts = client.contacts;
                    });
                });
            };



		$scope.getAnalysisRequests =
            function(batch_id, print_stickers) {
                $scope.analysis_requests = [];
                this.params = {sort_on: 'id', sort_order: 'ascending', title: batch_id, cancelled_state: 'active',
                	page_nr: $scope.pagination.page_nr, page_size: $scope.pagination.page_size};

                BikaService.getAnalysisRequests(this.params).success(function (data, status, header, config){

                    $scope.analysis_requests = data.result.objects;
                    $scope.pagination.total = data.result.total;
                    $scope.pagination.last = data.result.last;
					$scope.analysis_results = {};
                    transitions = Array();
                    runs = Array();
                    workflow_transitions = Array();
					_.each($scope.analysis_requests,function(obj) {

						Utility.merge(transitions,obj.transitions,'id');
						if (obj.analyses.length > 0 && $scope.analyses.length == 0 && $scope.review_state == 'active' ) {
							$scope.analyses = obj.analyses;
						}
						$scope.obj_id = obj.id;
						$scope.analysis_results[$scope.obj_id] = [];

						_.each(obj.analyses, function(o) {
							Utility.merge(workflow_transitions, o.transitions, 'id');
							$scope.analysis_results[$scope.obj_id][o.id] = (o.review_state === 'sample_received')?1:o.result;
						});

					    runs = _.union(runs, obj.runs)

					});
					$scope.runs = runs;
                    $scope.transitions = transitions;
                    $scope.workflow_transitions = workflow_transitions;
                    //console.log($scope.transitions);
                    //console.log($scope.workflow_transitions);
                    if (print_stickers !==undefined && print_stickers === true) {
                    	Utility.print_stickers($scope.stickers.id, $scope.batch.path);
                    }
                    //$rootScope.counter = DashboardService.update_dashboard();
                    $scope.getBatch($stateParams.batch_id);
                });
            };

		$scope.getAnalysists =
			function() {
				BikaService.getAnalystUsers().success(function (data, status, header, config){
					$scope.analysts = data.result.objects;
				});
			}

		$scope.getWorksheets =
			function() {
				this.params = {sort_on: 'id', sort_order: 'descending'}
				BikaService.getWorksheets(this.params).success(function (data, status, header, config){
					$scope.worksheets = data.result.objects;
				});
			}

		$scope.getDeliveries =
            function() {
                this.params = {
                    sort_on: 'Date', sort_order: 'descending', Subject: 'draft',
                	page_nr: $scope.pagination.page_nr, page_size: $scope.pagination.page_size
                };

                BikaService.getWorksheets(this.params).success(function (data, status, header, config){
					$scope.deliveries = data.result.objects;
                });
            };



        $scope.getAnalysisRequests($stateParams.batch_id);

        $scope.getWorksheets();
        $scope.getAnalysists();
        $scope.getDeliveries();


		$scope.ultimate_workflow_transitions =
			function(params, review_state) {
				paths = JSON.parse(params.f);
				request_paths = Array()
				_.each(paths, function(path) {
					request_path = _.initial(path.split('/')).join('/');
					if (!_.contains(request_paths, request_path)) {
						request_paths.push(request_path);
					}
				});
				var i = 0;
				_.each(request_paths, function(path){
					this.params = {path: path};
					BikaService.getAnalysisRequests(this.params).success(function (data, status, header, config){
						i++;
						ar = data.result.objects[0];
						if (ar.review_state === review_state) {
							this.params = {obj_path: path, subject: review_state};
							BikaService.updateAnalysisRequest(this.params).success(function (data, status, header, config){
								if (i == request_paths.length) {$scope.getAnalysisRequests($stateParams.batch_id)};
							});
						}
						else {if (i == request_paths.length) {$scope.getAnalysisRequests($stateParams.batch_id)};}

					});

				});

		}

		this.sync_batchbook =
		    function(batch_id) {

            	$scope.loading_change_review_state('synchronizing').show();

                this.params = {batch_id: batch_id};
				IrodsService.syncBatchbook(this.params).success(function (data, status, header, config){
				    console.log(data);
                    this.params = {batch_id: batch_id};
                    IrodsService.syncBatchbook(this.params).success(function (data, status, header, config){
				       console.log(data);
					   $scope.loading_change_review_state('synchronizing').hide();
					   $scope.getAnalysisRequests($stateParams.batch_id);
					});
                });

		    };

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
				this.params = {input_values: $scope._get_input_values(request_id, analysis_id)};

				BikaService.setAnalysesResults(this.params).success(function (data, status, header, config){
				 	this.result = data.result;
				 	//console.log(result);
				 	if (this.result.success === 'True') {
				 		this.params = {f: $scope._get_action_params(request_id, analysis_id)}

				 		BikaService.submit(this.params).success(function (data, status, header, config){
				 			this.result = data.result;
				 			if (this.result.success === 'True') {
								$scope.workflow_params.analyses = [];
								$scope.checked_list = [];
								//$scope.ultimate_workflow_transitions(params, 'to_be_verified');
								$scope.loading_change_review_state('submitting').hide();
								$scope.getAnalysisRequests($stateParams.batch_id);
							}
							else {
								Utility.alert({title:'Error while submitting..', content: this.result['message'], alertType:'danger'});
								$scope.getAnalysisRequests($stateParams.batch_id);
								return;
							}

				 		});
				 	}
				 	else {
				 		Utility.alert({title:'Error while submitting..', content: this.result['message'], alertType:'danger'});
				 		$scope.getAnalysisRequests($stateParams.batch_id);
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
				if (Array.isArray(analysis_id) && analysis_id.length == 0) {
					Utility.alert({title:'Nothing to verify<br/>', content:'Please select at least a Analysis', alertType:'warning'});
					return;
				}
				$scope.loading_change_review_state('verifying').show();
				this.params = {f: $scope._get_action_params(request_id, analysis_id)}

				BikaService.verify(this.params).success(function (data, status, header, config){
					this.result = data.result;
					if (this.result.success === 'True') {
						$scope.checked_list = [];
						$scope.workflow_params.analyses = [];
						//$scope.ultimate_workflow_transitions(params, 'verified');
						$scope.loading_change_review_state('verifying').hide();
						$scope.getAnalysisRequests($stateParams.batch_id);
					}
					else {
				 		Utility.alert({title:'Error while verifying..', content: this.result['message'], alertType:'danger'});
				 		$scope.getAnalysisRequests($stateParams.batch_id);
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
				if (Array.isArray(analysis_id) && analysis_id.length == 0) {
					Utility.alert({title:'Nothing to publish<br/>', content:'Please select at least a Analysis', alertType:'warning'});
					return;
				}
				$scope.loading_change_review_state('publishing').show();
				this.params = {f: $scope._get_action_params(request_id, analysis_id,'publish')}

				BikaService.publish(this.params).success(function (data, status, header, config){
					this.result = data.result;
					if (this.result.success === 'True') {
						$scope.checked_list = [];
						$scope.workflow_params.analyses = [];
						//$scope.ultimate_workflow_transitions(params, 'published');
						$scope.loading_change_review_state('publishing').hide();
						$state.go('batch',{'batch_id': $stateParams.batch_id},{reload: true});
						//$scope.getAnalysisRequests($stateParams.batch_id);
					}
					else {
				 		Utility.alert({title:'Error while publishing..', content: this.result['message'], alertType:'danger'});
				 		$scope.getAnalysisRequests($stateParams.batch_id);
						return;
				 	}
				 });
			}

		$scope.assign =
			function(request_id, analysis_id) {
				if (Array.isArray(request_id) && request_id.length == 0) {
					Utility.alert({title:'Nothing to assign<br/>', content:'Please select at least a Sample', alertType:'warning'});
					return;
				}
				if (Array.isArray(analysis_id) && analysis_id.length == 0) {
					Utility.alert({title:'Nothing to assign<br/>', content:'Please select at least a Analysis', alertType:'warning'});
					return;
				}
				if ($scope.workflow_params.switchWorksheet && $scope.workflow_params.worksheet == null ||
				 	!$scope.workflow_params.switchWorksheet &&
				 	($scope.workflow_params.worksheet_title == null || $scope.workflow_params.worksheet_title == '' )) {
				 	Utility.alert({title:'Nothing to assign<br/>', content:'Please select at least a Worksheet', alertType:'warning'});
					return;
				}
				$scope.loading_change_review_state('assigning').show();
				if (!$scope.workflow_params.switchWorksheet) {
					this.params = {
						title: $scope.workflow_params.worksheet_title,
						description: $scope.workflow_params.worksheet_description,
						Analyst: $scope.workflow_params.analyst.userid,
						Remarks: $scope._get_worksheet_analyses(request_id, analysis_id),
						subject: 'open',
					};


					BikaService.createWorksheet(this.params).success(function (data, status, header, config){
						result = data.result;
						this.params = {input_values: $scope._get_input_values_analyst(request_id, analysis_id, $scope.workflow_params.analyst.userid)};
						BikaService.updateAnalysisRequests(this.params).success(function (data, status, header, config){
							$scope.checked_list = [];
							$scope.workflow_params = {
								analyses: [],
								worksheet: null,
								analyst: null,
								worksheet_title: null,
								worksheet_description: null,
								switchWorksheet: false,
							};
							$scope.loading_change_review_state('assigning').hide();
							$scope.getAnalysisRequests($stateParams.batch_id);
							$scope.getWorksheets();
						});

					});

				}
				else {

					this.params = {
						obj_path: $scope.workflow_params.worksheet.path,
						Remarks: $scope._get_worksheet_analyses(request_id, analysis_id, JSON.parse($scope.workflow_params.worksheet.remarks)),
					}
					BikaService.updateWorksheet(this.params).success(function (data, status, header, config){
						result = data.result;
						this.params = {input_values: $scope._get_input_values_analyst(request_id, analysis_id, $scope.workflow_params.analyst.userid)};
						BikaService.updateAnalysisRequests(this.params).success(function (data, status, header, config){
							$scope.checked_list = [];
							$scope.workflow_params = {
								analyses: [],
								worksheet: null,
								analyst: null,
								worksheet_title: null,
								worksheet_description: null,
								switchWorksheet: false,
							};
							$scope.loading_change_review_state('assigning').hide();
							$scope.getAnalysisRequests($stateParams.batch_id);
							$scope.getWorksheets();
						});

					});

				}
				//$scope.loading_change_review_state('assigning').show();
		}

		$scope._get_worksheet_analyses =
			function(request_id, analysis_id, analysis_list) {
				if (!Array.isArray(request_id) && !Array.isArray(analysis_id)) {
					var worksheet_analyses = [];
					var item = {
						request_id: request_id,
						analysis_id: analysis_id,
						obj_path: $scope._get_analysis_path(request_id, analysis_id),
					};
					worksheet_analyses.push(item);
					if (analysis_list !== undefined) {
						Utility.merge(worksheet_analyses,analysis_list,'request_id');
					}

					return JSON.stringify(worksheet_analyses);

				}
				else if (Array.isArray(request_id) && Array.isArray(analysis_id)) {
					var worksheet_analyses = [];
					_.each(request_id,function(request_obj) {
						_.each(analysis_id,function(id) {
							var item = {
								request_id: request_obj,
								analysis_id: id,
								obj_path: $scope._get_analysis_path(request_obj, id),
								analyst: $scope.workflow_params.analyst.userid,
							};
							worksheet_analyses.push(item);
						});
					});
					if (analysis_list !== undefined) {
						Utility.merge(worksheet_analyses,analysis_list,'request_id');
					}
					return JSON.stringify(worksheet_analyses);
				}

			}

		$scope._get_action_params =
			function(request_id, analysis_id, action) {
				if (!Array.isArray(request_id) && !Array.isArray(analysis_id)) {
					var f = []
					f.push($scope._get_analysis_path(request_id, analysis_id));
					return JSON.stringify(f);
				}
				else if (Array.isArray(request_id) && Array.isArray(analysis_id)) {
					var f = []
					_.each(request_id,function(request_obj) {
						//if (action !== undefined && action=='publish') {
						//	f.push($scope._get_analysis_path(request_obj));
						//}
						_.each(analysis_id,function(id) {
							f.push($scope._get_analysis_path(request_obj, id));
						});
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
				else if (Array.isArray(request_id) && Array.isArray(analysis_id)) {
					var input_values = {};
					_.each(request_id,function(request_obj) {
						_.each(analysis_id,function(id) {
							input_values[$scope._get_analysis_path(request_obj,id)] = {Result: $scope._get_analysis_result(request_obj, id)}
						});
					});
					return JSON.stringify(input_values);
				}
			}

		$scope._get_input_values_analyst =
			function (request_id, analysis_id, analyst) {
				if (!Array.isArray(request_id) && !Array.isArray(analysis_id)) {
					var input_values = {};
					input_values[$scope._get_analysis_path(request_id,analysis_id)] = {Analyst: analyst};
					return JSON.stringify(input_values);
				}
				else if (Array.isArray(request_id) && Array.isArray(analysis_id)) {
					var input_values = {};
					_.each(request_id,function(request_obj) {
						_.each(analysis_id,function(id) {
							input_values[$scope._get_analysis_path(request_obj,id)] = {Analyst: analyst};
						});
					});
					return JSON.stringify(input_values);
				}
			}

		$scope._get_analysis_path =
			function(request_id, analysis_id) {
				request = _.findWhere($scope.analysis_requests, {'id': request_id});
				if (analysis_id === undefined) {
					return request.path;
				}
				else {return request.path + "/" + analysis_id;}

			}

		$scope._get_analysis_result =
			function(request_id, analysis_id) {
				return $scope.analysis_results[request_id][analysis_id].toString();
			}

        this.check_transitions = function(id_transition, transitions) {
			if (transitions === undefined) {
				var transitions = $scope.transitions;
			}
			return Utility.check_transitions(id_transition, transitions);
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
		this.results = config.legend.analysis_result;

		this.format_review_state =
			function(review_state) {
				return Utility.format_review_state(review_state);
			}

		this.format_result =
			function(result) {
				return Utility.format_result(result);
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

		this.toggle_analyses = function(id) {
				var idx = $scope.workflow_params.analyses.indexOf(id);
				if (idx > -1) {
					$scope.workflow_params.analyses.splice(idx, 1);
				}
				else {
					$scope.workflow_params.analyses.push(id);
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

		 $scope.$watch('workflow_params.worksheet',
            function (newValue, oldValue) {
                // Ignore initial setup.
                if ( newValue === oldValue) { return;}
                if ( newValue === null ) { return; }
                $scope.workflow_params.analyst = _.findWhere($scope.analysts, {'userid': $scope.workflow_params.worksheet.analyst});
         });

         $scope.$watch('delivery_params.delivery',
            function (newValue, oldValue) {
                // Ignore initial setup.
                if ( newValue === oldValue) { return;}
                if ( newValue === null ) { return; }

                this.params = JSON.parse(newValue.location);
                $scope.delivery_params.description = newValue.description;
                $scope.delivery_params.runs = this.params['runs'];
                $scope.delivery_params.export_mode =  _.findWhere($scope.export_mode, {value: this.params['mode']});
                $scope.delivery_params.switchMerge =  this.params['merge'];
                $scope.delivery_params.path =  this.params['path'];
         });

         this.create_delivery = function(request_id, delivery_params){
            if (Array.isArray(request_id) && request_id.length == 0) {
					Utility.alert({title:'Nothing to assign<br/>', content:'Please select at least a Sample', alertType:'warning'});
					return;
				}

				if (delivery_params.switchDelivery && delivery_params.delivery == null ||
				 	!delivery_params.switchDelivery &&
				 	(delivery_params.title == null || delivery_params.title == '' )) {
				 	Utility.alert({title:'Nothing to assign<br/>', content:'Please select at least a Delivery Worksheet', alertType:'warning'});
					return;
				}
				$scope.loading_change_review_state('creating delivery').show();
				if (!delivery_params.switchDelivery) {

				    var delivery_samples = [];
					_.each(request_id,function(request_obj) {
							var item = {
								request_id: request_obj,
								analysis_id: '',
								obj_path: '',
								analyst: '',
							};
							delivery_samples.push(item);
					});

					this.params = {
						title: delivery_params.title,
						description: delivery_params.description,
						Remarks: JSON.stringify(delivery_samples),
						subject: 'draft',
						location: JSON.stringify({  mode: delivery_params.export_mode['value'],
						                            path: delivery_params.path,
						                            user: '',
						                            password:'',
						                            merge: delivery_params.switchMerge,
						                            runs: delivery_params.runs,
						                            recipients: delivery_params.recipients,
						                            client: $scope.batch.client})
					};


					BikaService.createDelivery(this.params).success(function (data, status, header, config){
						result = data.result;
						$scope.delivery_params = {
                            delivery: null,
                            export_mode: null,
                            title: null,
                            description: null,
                            switchDelivery: false,
                            switchMerge: true,
                            runs: [],
                            path: null,
                        };
                        $scope.checked_list = [];
						$scope.loading_change_review_state('creating delivery').hide();
						if (result['success'] === 'True') {
						    Utility.alert({title:'Success', content: 'Your Delivery Worksheet has been successfully created.', alertType:'success'});
						    $state.go('delivery',{delivery_id: result['obj_id']});
						}
						else {
						    $scope.getDeliveries();
							Utility.alert({title:'Error while creating...', content: result['message'], alertType:'danger'});
							return;
						}


					});
                }
                else {
                    var delivery_samples = [];
                    _.each(request_id,function(request_obj) {
							var item = {
								request_id: request_obj,
								analysis_id: '',
								obj_path: '',
								analyst: '',
							};

							delivery_samples.push(item);
					});
					Utility.merge(delivery_samples,JSON.parse(delivery_params.delivery.remarks),'request_id');

					this.params = {
						obj_path: delivery_params.delivery.path,
						Remarks: JSON.stringify(delivery_samples),
					}
                    $scope.loading_change_review_state('updating delivery').show();
					BikaService.updateWorksheet(this.params).success(function (data, status, header, config){
					    $scope.loading_change_review_state('updating delivery').hide();
						result = data.result;



                        if (result['success'] === 'True') {
						    Utility.alert({title:'Success', content: 'Your Delivery Worksheet has been successfully updated.', alertType:'success'});
						    $scope.checked_list = [];

						    $state.go('delivery',{delivery_id: $scope.delivery_params.delivery.id});
						}
						else {
						    $scope.delivery_params = {
                                delivery: null,
                                export_mode: null,
                                title: null,
                                description: null,
                                switchDelivery: false,
                                switchMerge: true,
                                runs: [],
                                path: null,
                            };
						    $scope.getDeliveries();
							Utility.alert({title:'Error while updating...', content: result['message'], alertType:'danger'});
							return;
						}
						$scope.getDeliveries();


					});

				}

         }

	});