var clients_module = angular.module('ClientsModule',[]);

clients_module.run(function($rootScope){
  $rootScope._ = _;
});

clients_module.controller('ClientsCtrl',
	function(BikaService, Utility, config, ngCart, $scope, $rootScope) {

		$scope.loading_search = Utility.loading({
            busyText: 'Wait while searching clients...',
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
		$scope.review_state = 'active';

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
			$scope.getClients($scope.review_state);
		}

		// :: function :: getClients()
        $scope.getClients =
            function(review_state) {
            	$scope.loading_search.show();
            	$scope.review_state = review_state;
                $scope.clients = [];
                this.params = {sort_on: 'id', sort_order: 'descending', Description: review_state,
                	page_nr: $scope.pagination.page_nr, page_size: $scope.pagination.page_size};

                BikaService.getClients(this.params).success(function (data, status, header, config){
                   _.each(data.result.objects, function(c) {
                        if (c.subject !== 'purchase_order') {
                            $scope.clients.push(c);
                        }

                    });
                    //console.log($scope.clients);
                    $scope.pagination.total = data.result.total;
                    $scope.pagination.last = data.result.last;
					transitions = Array();
					_.each($scope.clients,function(obj) {
						Utility.merge(transitions,obj.transitions,'id');
					});
                    $scope.transitions = transitions;
					$scope.loading_search.hide();

                });
            };


        $scope.sort = function(keyname){
			$scope.sortKey = keyname;   //set the sortKey to the param passed
			$scope.reverse = !$scope.reverse; //if true make it false and vice versa
		}


		$scope.getClients($scope.review_state);



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
				if ($scope.checked_list.length < $scope.clients.length) {
					_.each($scope.clients,function(b) {
						$scope.checked_list.push(b.id);
					})
				}
				else {
					$scope.checked_list = [];
				}
		}

		this.change_review_state =
			function (action, client_id) {
				if (client_id === undefined) {
					var client_id = $scope.checked_list;
				}
				else {var client_id = [client_id];}

				if (action === 'activate') {
					 $scope.activateClients(client_id);
				}
				else if (action === 'deactivate') {
					 $scope.deactivateClients(client_id);
				}

			}

		$scope.activateClients =
			function(client_id) {
				$scope.loading_change_review_state('activating').show();
				this.params = {f: $scope._get_review_params(client_id)};
				BikaService.activateClient(this.params).success(function (data, status, header, config){
					this.params = {input_values: $scope._get_input_values_review_state(client_id,'active')};
					BikaService.updateClients(this.params).success(function (data, status, header, config){
						$scope.loading_change_review_state('activating').hide();
						$scope.checked_list = [];
			 			$scope.getClients($scope.review_state);
					});
				})
				.error(function() {
				    this.params = {input_values: $scope._get_input_values_review_state(client_id,'active')};
					BikaService.updateClients(this.params).success(function (data, status, header, config){
						$scope.loading_change_review_state('activating').hide();
						$scope.checked_list = [];
			 			$scope.getClients($scope.review_state);
					});
				});
			}

		$scope.deactivateClients =
			function(client_id) {
				$scope.loading_change_review_state('deactivating').show();
				this.params = {f: $scope._get_review_params(client_id)};
				BikaService.deactivateClient(this.params).success(function (data, status, header, config){
					this.params = {input_values: $scope._get_input_values_review_state(client_id,'deactivate')};
					//console.log(this.params);
					BikaService.updateClients(this.params).success(function (data, status, header, config){
						$scope.loading_change_review_state('deactivating').hide();
						$scope.checked_list = [];
			 			$scope.getClients($scope.review_state);
					});

				});
			}

		$scope._get_input_values_review_state =
			function (client_id, review_state) {

				var input_values = {};
				_.each(client_id,function(id) {
					this.client = _.findWhere($scope.clients, {'id': id});
					input_values[this.client.path] = {description: review_state!==undefined?review_state:this.client.review_state};
				});
				return JSON.stringify(input_values);
			}

		$scope._get_review_params =
			function(client_id) {
				var f = [];
				_.each(client_id,function(id) {
					this.client = _.findWhere($scope.clients, {'id': id});
					f.push(this.client.path);
				});
				return JSON.stringify(f);


			}

});

clients_module.controller('AddClientCtrl',
	function(BikaService, Utility, config, $scope, $rootScope, $state) {

        $scope.loading_create = Utility.loading({
            busyText: 'Wait while creating...',
            delayHide: 1500,
        });

        $scope.client_params = {
            name: null,
            id: null,
            phone: null,
            email: null,
            address: {
                address: null,
                zip: null,
                city: null,
                country: null,
                state: null,
                district: null,
            },
            contacts: [],
        }

        $scope.contact_params = {
            first_name: null,
            surname: null,
            phone: null,
            email: null,
        }

        this.confirm_contact =
            function(contact) {
                $scope.client_params.contacts.push(contact);
                $scope.contact_params = {
                    first_name: null,
                    surname: null,
                    phone: null,
                    email: null,
                }

            }

        this.create_client =
            function(client) {

                this.params = {
                    title: $scope.client_params.name,
                    ClientID: $scope.client_params.id,
                    Phone:  $scope.client_params.phone!==null?$scope.client_params.phone:'',
                    EmailAddress:  $scope.client_params.email!==null?$scope.client_params.email:'',
                    description: 'active',
                    PhysicalAddress: {
                        address: $scope.client_params.address.address!==null?$scope.client_params.address.address:'',
                        zip:  $scope.client_params.address.zip!==null?$scope.client_params.address.zip:'',
                        city:  $scope.client_params.address.city!==null?$scope.client_params.address.city:'',
                        country:  $scope.client_params.address.country!==null?$scope.client_params.address.country:'',
                        state: '',
                        district: '',
                    },
                }

                $scope.loading_create.show();
                BikaService.createClient(this.params).success(function (data, status, header, config){
                    this.result = data.result;
                    if (this.result['success'] === 'True') {
                        client_id = this.result['obj_id'];
                        Utility.alert({title:'Success', content: 'Client has been successfully created with ID: '+client_id, alertType:'success'});
                        if (Array.isArray($scope.client_params.contacts) &&  $scope.client_params.contacts.length > 0) {
                            _.each($scope.client_params.contacts, function(contact){
                                this.params = {
                                    ClientID: client_id,
                                    Firstname: contact.first_name,
                                    Surname: contact.surname,
                                    HomePhone:  contact.phone!==null?contact.phone:'',
                                    EmailAddress: contact.email!==null?contact.email:'',
                                }
                                BikaService.createContact(this.params).success(function (data, status, header, config){
									this.result = data.result;
									if (this.result['success'] === 'True') {
										Utility.alert({title:'Success', content: 'Contact '+contact.surname+' has been added to client '+client_id, alertType:'success'});
									}
									else {
										Utility.alert({title:'Error while creating...', content: result['message'], alertType:'danger'});
										return;
									}
								});
                            });
                        }
                        $scope.loading_create.hide();
                        $state.go('clients',{},{reload: true});
                    }
                    else {
                        $scope.loading_create.hide();
						Utility.alert({title:'Error while creating...', content: result['message'], alertType:'danger'});
						return;
                    }
                })


            }
});

clients_module.controller('ClientDetailsCtrl',
	function(BikaService, Utility, $state, $stateParams, $scope, $rootScope) {

		$scope.state = {client_id: $stateParams.client_id};
		$scope.client = null;
		$scope.batches = [];
		$scope.cost_centers = [];
		$scope.samples = {};

	    $scope.review_states = {
		    batches: 'open',
		    cost_centers: 'pending',
		}

		$scope.checked_list = {
		    batches: [],
		    cost_centers: [],
		}

		$scope.transitions = {
		    batches: [],
		    cost_centers: [],
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

		$scope.loading_client = Utility.loading({
            busyText: 'Wait while loading...',
            delayHide: 1500,
        });

        $scope.loading_edit = Utility.loading({
            busyText: 'Wait while saving...',
            delayHide: 1500,
        });

        $scope.getClient =
            function(client_id) {
            	$scope.loading_client.show();

                this.params = {sort_on: 'Date', sort_order: 'descending', id: client_id};
                BikaService.getClients(this.params).success(function (data, status, header, config){
                    $scope.client = data.result.objects[0];
                    $scope.init_form($scope.client);
                    $scope.getBatches($scope.review_states.batches);
                    $scope.getCostCenters($scope.review_states.cost_centers);
                    $scope.loading_client.hide();
                });
            };

        $scope.count_samples = function() {
			_.each($scope.batches,function(batch) {
			        if (!_.has($scope.samples, batch.id) ){
			            this.params = {title: batch.id, include_fields: 'path'};
                        BikaService.countAnalysisRequests(this.params).success(function (data, status, header, config){
                            $scope.samples[batch.id] = data.result;
                        });
			        }

			});
		}

		$scope.getBatches = function(review_state) {

		    if (review_state != 'all') {
		        $scope.batches =  _.where($scope.client.batches, {'subject':review_state});
		    }
		    else {
		        $scope.batches = $scope.client.batches;
		    }

		    $scope.count_samples();
		    $scope.review_states.batches =  review_state;
		    transitions = Array();
			_.each($scope.batches,function(obj) {
						Utility.merge(transitions,obj.transitions,'id');
			});
            $scope.transitions.batches = transitions;
		}

		$scope.getCostCenters = function(review_state) {

		    if (review_state != 'all') {
		        $scope.cost_centers =  _.where($scope.client.cost_centers, {'review_state':review_state});
		    }
		    else {
		        $scope.cost_centers = $scope.client.cost_centers;
		    }
            //console.log($scope.cost_centers);
		    $scope.review_states.cost_centers =  review_state;
		    transitions = Array();
			_.each($scope.cost_centers,function(obj) {
						Utility.merge(transitions,obj.transitions,'id');
			});
            $scope.transitions.cost_centers = transitions;
		}

        $scope.getClient($scope.state.client_id);

        this.format_date =
			function(date) {
				return Utility.format_date(date);
			}

		this.format_review_state =
			function(review_state) {
				return Utility.format_review_state(review_state);
			}

		this.toggle_batches =
			function(id) {
				var idx = $scope.checked_list.batches.indexOf(id);
				if (idx > -1) {
					$scope.checked_list.batches.splice(idx, 1);
				}
				else {
					$scope.checked_list.batches.push(id);
				}
				//console.log($scope.checked_list);
			}

		this.toggle_cost_centers =
			function(id) {
				var idx = $scope.checked_list.cost_centers.indexOf(id);
				if (idx > -1) {
					$scope.checked_list.cost_centers.splice(idx, 1);
				}
				else {
					$scope.checked_list.cost_centers.push(id);
				}
				//console.log($scope.checked_list);
			}

		this.toggle_all_batches = function() {
				if ($scope.checked_list.batches.length < $scope.batches.length) {
					_.each($scope.batches,function(b) {
						$scope.checked_list.batches.push(b.id);
					})
				}
				else {
					$scope.checked_list.batches = [];
				}
		}

		this.toggle_all_cost_centers = function() {
				if ($scope.checked_list.cost_centers.length < $scope.cost_centers.length) {
					_.each($scope.cost_centers,function(b) {
						$scope.checked_list.cost_centers.push(b.id);
					})
				}
				else {
					$scope.checked_list.cost_centers = [];
				}
		}

		this.check_transitions_batches =
			function(id_transition, transitions) {
				if (transitions === undefined) {
					var transitions = $scope.transitions.batches;
				}
				return Utility.check_transitions(id_transition, transitions);
		}

		this.check_transitions_cost_centers =
			function(id_transition, transitions) {
				if (transitions === undefined) {
					var transitions = $scope.transitions.cost_centers;
				}
				return Utility.check_transitions(id_transition, transitions);
		}

		this.change_review_state_batches =
			function (action, batch_id) {
				if (batch_id === undefined) {
					var batch_id = $scope.checked_list.batches;
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


		this.change_review_state_cost_centers =
			function (action, cost_center_id) {
				if (cost_center_id === undefined) {
					var cost_center_id = $scope.checked_list.cost_centers;
				}
				else {
					var cost_center_id = [cost_center_id]
				}

				if (action === 'activate') {
					 $scope.activateCostCenter(cost_center_id);
				}
				else if (action === 'deactivate') {
					 $scope.deactivateCostCenter(cost_center_id);
				}
				else if (action === 'dispatch') {
					 $scope.dispatchCostCenter(cost_center_id);
				}
			}

		$scope.closeBatch =
			function(batch_id) {
				$scope.loading_change_review_state('closing batches').show();
				this.params = {f: $scope._get_review_params_batches(batch_id)};

				BikaService.closeBatch(this.params).success(function (data, status, header, config){
					this.params = {input_values: $scope._get_input_values_review_state_batches(batch_id,'closed')};

					BikaService.updateBatches(this.params).success(function (data, status, header, config){
						$scope.loading_change_review_state('closing batches').hide();
						$scope.checked_list.batches = [];
						$scope.getClient($scope.state.client_id);
					});
				});

			}

		$scope.openBatch =
			function(batch_id) {
				$scope.loading_change_review_state('opening batches').show();
				this.params = {f: $scope._get_review_params_batches(batch_id)};
				BikaService.openBatch(this.params).success(function (data, status, header, config){
					this.params = {input_values: $scope._get_input_values_review_state_batches(batch_id,'open')};
					BikaService.updateBatches(this.params).success(function (data, status, header, config){
						$scope.loading_change_review_state('opening batches').hide();
						$scope.checked_list.batches = [];
						$scope.getClient($scope.state.client_id);
					});
				});


			}

		$scope.cancelBatch =
			function(batch_id) {
				$scope.loading_change_review_state('deleting batches').show();
				this.params = {f: $scope._get_review_params_batches(batch_id)};
				BikaService.cancelBatch(this.params).success(function (data, status, header, config){
					this.params = {input_values: $scope._get_input_values_review_state_batches(batch_id,'cancelled')};
					BikaService.updateBatches(this.params).success(function (data, status, header, config){
						$scope.loading_change_review_state('deleting batches').hide();
						$scope.checked_list.batches = [];
				 		$scope.getClient($scope.state.client_id);
					});

				});

			}

		$scope.reinstateBatch =
			function(batch_id) {
				$scope.loading_change_review_state('reinstating batches').show();
				this.params = {f: $scope._get_review_params_batches(batch_id)};
				BikaService.reinstateBatch(this.params).success(function (data, status, header, config){
					this.params = {input_values: $scope._get_input_values_review_state_batches(batch_id)};
					BikaService.updateBatches(this.params).success(function (data, status, header, config){
						$scope.loading_change_review_state('reinstating batches').hide();
						$scope.checked_list.batches = [];
				 		$scope.getClient($scope.state.client_id);
					});
				});

			}

		$scope.activateCostCenter =
			function(cost_center_id) {
				$scope.loading_change_review_state('activating').show();
				this.params = {f: $scope._get_review_params_cost_centers(cost_center_id)};
				BikaService.activateSupplyOrder(this.params).success(function (data, status, header, config){
					$scope.loading_change_review_state('activating').hide();
					$scope.checked_list.cost_centers = [];
			 		$scope.getClient($scope.state.client_id);
				});
			}

		$scope.deactivateCostCenter =
			function(cost_center_id) {
				$scope.loading_change_review_state('deactivating').show();
				this.params = {f: $scope._get_review_params_cost_centers(cost_center_id)};
				BikaService.deactivateSupplyOrder(this.params).success(function (data, status, header, config){
					$scope.loading_change_review_state('deactivating').hide();
					$scope.checked_list.cost_centers = [];
			 		$scope.getClient($scope.state.client_id);
				});
			}

		$scope.dispatchCostCenter =
			function(cost_center_id) {
				$scope.loading_change_review_state('dispatching').show();
				this.params = {f: $scope._get_review_params_cost_centers(cost_center_id)};
				BikaService.dispatchSupplyOrder(this.params).success(function (data, status, header, config){
					this.params = {input_values: $scope._get_input_values_review_state_cost_centers(cost_center_id,'dispatched')};
					BikaService.updateSupplyOrders(params).success(function (data, status, header, config){
						$scope.loading_change_review_state('dispatching').hide();
						$scope.checked_list.cost_centers = [];
			 		    $scope.getClient($scope.state.client_id);
					});
				});
			}

		$scope._get_input_values_review_state_batches =
			function (batch_id, review_state) {
				var input_values = {};
				_.each(batch_id,function(id) {
					batch = _.findWhere($scope.batches, {'id': id});
					input_values[batch.path] = {subject: review_state!==undefined?review_state:batch.review_state};
				});
				return JSON.stringify(input_values);
			}

		$scope._get_review_params_batches =
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

		$scope._get_input_values_review_state_cost_centers =
			function (cost_center_id, review_state) {
				var input_values = {};
				_.each(cost_center_id,function(id) {
					this.cost_center = _.findWhere($scope.cost_centers, {'id': id});
					input_values[this.cost_center.path] = {subject: review_state!==undefined?review_state:this.cost_center.review_state};
				});
				return JSON.stringify(input_values);
			}

		$scope._get_review_params_cost_centers =
			function(cost_center_id) {

				if (!Array.isArray(cost_center_id)) {
					var f = [];
					this.cost_center = _.findWhere($scope.cost_centers, {'id':cost_center_id});
					f.push(this.cost_center.path);
					return JSON.stringify(f);
				}
				else if (Array.isArray(cost_center_id)) {
					var f = [];
					_.each(cost_center_id,function(id) {
						this.cost_center = _.findWhere($scope.cost_centers, {'id':id});
						f.push(this.cost_center.path);
					});
					return JSON.stringify(f);
				}

			}


		$scope.init_form =
		    function(client) {
		        $scope.client_params = {
                    name: client.name,
                    id: client.client_id,
                    phone: client.phone,
                    email: client.email_address,
                    address: client.physical_address,
                    contacts: client.contacts,
                }

                $scope.contact_params = {
                    first_name: null,
                    surname: null,
                    phone: null,
                    email_address: null,
                }
		    }

		 this.confirm_contact =
            function(contact) {
                $scope.client_params.contacts.push(contact);
                $scope.contact_params = {
                    first_name: null,
                    surname: null,
                    phone: null,
                    email_address: null,
                }

            }



         this.edit_client =
            function(client) {

                this.params = {
                    'obj_path': $scope.client.path,
                    title: $scope.client_params.name,
                    ClientID: $scope.client_params.id,
                    Phone:  $scope.client_params.phone!==null?$scope.client_params.phone:'',
                    EmailAddress:  $scope.client_params.email!==null?$scope.client_params.email:'',
                    PhysicalAddress: {
                        address: $scope.client_params.address.address!==null?$scope.client_params.address.address:'',
                        zip:  $scope.client_params.address.zip!==null?$scope.client_params.address.zip:'',
                        city:  $scope.client_params.address.city!==null?$scope.client_params.address.city:'',
                        country:  $scope.client_params.address.country!==null?$scope.client_params.address.country:'',
                    },
                }

                $scope.loading_edit.show();
                BikaService.updateClient(this.params).success(function (data, status, header, config){
                    this.result = data.result;
                    if (this.result['success'] === 'True') {
                        client_id = $scope.client.id;
                        Utility.alert({title:'Success', content: 'Client '+client_id+' has been successfully edited ', alertType:'success'});
                        if (Array.isArray($scope.client_params.contacts) &&  $scope.client_params.contacts.length > 0) {
                            _.each($scope.client_params.contacts, function(contact){
                                if (contact.path == undefined) {
                                    this.params = {
                                        ClientID: client_id,
                                        Firstname: contact.first_name,
                                        Surname: contact.surname,
                                        HomePhone:  contact.phone!==null?contact.phone:'',
                                        EmailAddress: contact.email_address!==null?contact.email_address:'',
                                    }
                                    BikaService.createContact(this.params).success(function (data, status, header, config){
                                        this.result = data.result;
                                        if (this.result['success'] === 'True') {
                                            Utility.alert({title:'Success', content: 'Contact '+contact.surname+' has been added to client '+client_id, alertType:'success'});
                                        }
                                        else {
                                            Utility.alert({title:'Error while creating...', content: result['message'], alertType:'danger'});
                                            return;
                                        }
								    });
                                }


                            });
                        }
                        $scope.loading_edit.hide();
                        $state.go('client',{client_id: client_id},{reload: true});
                    }
                    else {
                        $scope.loading_create.hide();
						Utility.alert({title:'Error while editing...', content: result['message'], alertType:'danger'});
						return;
                    }
                });



            }







 });
