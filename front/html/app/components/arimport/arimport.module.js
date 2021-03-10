var arimport_module = angular.module('ARImportModule',[]);

arimport_module.run(function($rootScope){
  $rootScope._ = _;
});


arimport_module.controller('ARImportCtrl',
			   function(BikaService, Utility, config, $state, $scope, $timeout) {

		$scope.arimportForm = {};
		$scope.pools = [];
		$scope.loading_import = Utility.loading({
            busyText: 'Wait while importing...',
            delayHide: 3000,
        });

        $scope.loading_worksheet = Utility.loading({
            busyText: 'Wait while creating worksheet...',
            delayHide: 3000,
        });

		$scope.submit =
			function(arimport_params) {

				function batch_exists(batch, batches) {
					found = _.findWhere(batches, {'title': batch});
					if (found === undefined) { return false; }
					else { return true; }
				}



				$scope.submitted = true;
				if (batch_exists($scope.arimport_params.selectedBatch, $scope.batches)) {
					Utility.alert({title:'There\'s been an error<br/>', content:'Batch ' + $scope.arimport_params.selectedBatch + ' already exists', alertType:'danger'});
					return;
				}
				if (_.size($scope.arimport_params.client_samples) == 0) {
					Utility.alert({title:'There\'s been an error<br/>', content:'CSV file required', alertType:'danger'});
					return;
				}
				if ($scope.arimport_params.selectedClient === null || $scope.arimport_params.selectedClient === undefined) {
					Utility.alert({title:'There\'s been an error<br/>', content:'Client field required', alertType:'danger'});
					return;
				}
				if ($scope.arimport_params.selectedContact === null || $scope.arimport_params.selectedContact === undefined) {
					Utility.alert({title:'There\'s been an error<br/>', content:'Contact field required', alertType:'danger'});
					return;
				}

				if ($scope.arimport_params.selectedAnalysisServices.illumina.length === 0 && $scope.arimport_params.selectedAnalysisServices.bioinfo.length === 0
					&& $scope.arimport_params.selectedAnalysisServices.library_prep.length === 0 && $scope.arimport_params.selectedAnalysisServices.extraction.length === 0) {
					Utility.alert({title:'There\'s been an error<br/>', content:'Analysis Service field required', alertType:'danger'});
					return;
				}
				if ($scope.arimport_params.selectedBatch === null || $scope.arimport_params.selectedBatch === undefined) {
					Utility.alert({title:'There\'s been an error<br/>', content:'Batch field required', alertType:'danger'});
					return;
				}
				if ($scope.arimport_params.textDescription === null || $scope.arimport_params.textDescription === undefined) {
					Utility.alert({title:'There\'s been an error<br/>', content:'Description field required', alertType:'danger'});
					return;
				}
				if ($scope.arimport_params.selectedCostCenter === null || $scope.arimport_params.selectedCostCenter === undefined) {
					Utility.alert({title:'There\'s been an error<br/>', content:'Cost Center field required', alertType:'danger'});
					return;
				}
				if (!$scope.arimportForm.$invalid && _.size($scope.arimport_params.client_samples) > 0) {
					if (arimport_params.selectedSampleType.title!=='POOL') {
						$scope.import(arimport_params);
					}
					else {
						_.each($scope.pools, function(pool) {
						    $scope.submit_pool(arimport_params, pool);
						});
					}

				} else {
					Utility.alert_danger({title:'There\'s been an error<br/>', content:'Error', alertType:'danger'});
					return;
				}


			};

		$scope.submit_pool =
			function(arimport_params, pool) {
				this.params = {
					selectedClient: arimport_params.selectedClient,
					selectedContact: arimport_params.selectedContact,
					selectedCCContacts: arimport_params.selectedCCContacts,
					selectedSampleType: arimport_params.selectedSampleType,
					selectedContainerType: arimport_params.selectedContainerType,
					selectedAnalysisServices: arimport_params.selectedAnalysisServices,
					selectedSamplingDate: arimport_params.selectedSamplingDate,
					selectedBatch: arimport_params.selectedBatch + "-" + pool,
					selectedExportMode: arimport_params.selectedExportMode,
					selectedCostCenter: arimport_params.selectedCostCenter,
					textDescription: arimport_params.textDescription,
					uploadFile: arimport_params.uploadFile,
					attachment: arimport_params.attachment,
					attachment_content: arimport_params.attachment_content,
					client_samples: _.where(arimport_params.client_samples, {'pool': pool}),
					createWorksheets: arimport_params.createWorksheets,
				};
				this.params.client_samples.unshift({index: 1, sample: pool, pool: pool});
				$scope.import(this.params);
			};
		// :: function :: ARImport()
		$scope.import =
			function(arimport_params) {

				$scope.loading_import.show()
				var outcome = {
					batch_id: null,
					arequest_ids: [],
				}
				// creating batch
				this.batch_params = {
					title: arimport_params.selectedBatch,
					description: arimport_params.textDescription,
					ClientBatchID: arimport_params.selectedBatch,
					BatchDate: Utility.format_date(arimport_params.selectedSamplingDate),
					Client: arimport_params.selectedClient.id,
					Remarks: arimport_params.selectedExportMode.label,
					rights: arimport_params.selectedCostCenter.id,
					subject: 'open',
				}

				BikaService.createBatch(this.batch_params).success(function (data, status, header, config){

					function get_environmental_conditions(sample_data, selectedSampleType) {
						values = [];
						if ((selectedSampleType.prefix !== 'MS' && selectedSampleType.prefix !== 'FC' && selectedSampleType.prefix !== 'POOL') || sample_data.index === 1) {
							var sample_header = $scope.header;
						}
						else {var sample_header = $scope.attachment_header;}

						if (_.size(sample_data) > 2) {
							_.each(sample_header,function(obj) {

								this.field = {};
								this.field[$scope.format_csv_field(obj)] = sample_data[$scope.format_csv_field(obj)];
								values.push(this.field);
							});
							return JSON.stringify(values);
						}
						return "";

					}

					function get_remarks(sample_data, arimport_params) {
						remarks = (arimport_params.attachment_content!=null && sample_data.index==1)?JSON.stringify(arimport_params.attachment_content):'';
						return remarks;
					}

					function get_sample_type(sample_data, selectedSampleType) {
						if ((selectedSampleType.prefix !== 'MS' && selectedSampleType.prefix !== 'FC' && selectedSampleType.prefix !== 'POOL') || sample_data.index === 1) {
							return selectedSampleType.id;
						}
						else if ((selectedSampleType.prefix === 'MS' || selectedSampleType.prefix === 'FC' || selectedSampleType.prefix === 'POOL') && sample_data.index !== 1) {
							sample_type = _.findWhere($scope.sample_types, {'prefix': 'SAMPLE-IN-'+selectedSampleType.prefix});
							if (sample_type !== undefined) {
								return sample_type.id;
							}
						}
						else {return selectedSampleType.id;}
					}

                    result = data.result;
                    if (result['success'] === 'True') {
                    	outcome.batch_id = result['obj_id']

						var services = Array();
						_.each(arimport_params.selectedAnalysisServices.extraction, function(as) {
							services.push(as.id);
						});
						_.each(arimport_params.selectedAnalysisServices.library_prep, function(as) {
							services.push(as.id);
						});
						_.each(arimport_params.selectedAnalysisServices.illumina, function(as) {
							services.push(as.id);
						});
						_.each(arimport_params.selectedAnalysisServices.bioinfo, function(as) {
							services.push(as.id);
						});
						var contacts = Array();
						_.each(arimport_params.selectedCCContact, function(c) {
							contacts.push(c.id);
						});

						if (arimport_params.selectedSampleType.prefix === 'MS' || arimport_params.selectedSampleType.prefix === 'FC') {
							arimport_params.client_samples.unshift({index: 1, sample:  $scope.format_csv_field($scope.arimport_params.single_sample)});
						}
                    	// creating analysis request
                    	_.each(arimport_params.client_samples, function(client_samples) {
                    		this.ar_params = {
								title: outcome.batch_id,
								Client: arimport_params.selectedClient.id,
								ClientSampleID: client_samples.sample,
								SampleType: get_sample_type(client_samples, arimport_params.selectedSampleType),
								SamplingDate: Utility.format_date(arimport_params.selectedSamplingDate),
								Batch: outcome.batch_id,
								EnvironmentalConditions: get_environmental_conditions(client_samples, arimport_params.selectedSampleType),
								Contact: arimport_params.selectedContact.id,
								CCContact: contacts.length>0?contacts.join('|'):arimport_params.selectedContact.id,
								Services: services.join('|'),
								Remarks: get_remarks(client_samples, arimport_params),
								subject: 'sample_due',
								rights: client_samples.ordinal!=undefined ? client_samples.ordinal : Utility.format_ordinal('0'),
							}

							BikaService.createAnalysisRequest(this.ar_params).success(function (data, status, header, config){
								result = data.result;
								if (result['success'] === 'True') {
									Utility.alert({title:'Success', content: 'Sample '+ result['sample_id'] + ' has been successfully imported', alertType:'success', duration:3000});

									outcome.arequest_ids.push({ar_id:result['ar_id'], sample_id:result['sample_id']});
									if (outcome.arequest_ids.length === arimport_params.client_samples.length) {
										Utility.alert({title:'Success', content: 'Your Batch has been successfully created.', alertType:'success'});
										if (!arimport_params.createWorksheets) {
											$state.go('batch',{batch_id: outcome.batch_id});
										}
										if (arimport_params.createWorksheets){
										    this.worksheets_params = {
										       title: arimport_params.selectedBatch,
					                           description: arimport_params.textDescription,
					                           analysis: {
					                                extraction: arimport_params.selectedAnalysisServices.extraction,
					                                library_prep: arimport_params.selectedAnalysisServices.library_prep,
					                                illumina: arimport_params.selectedAnalysisServices.illumina,
					                                bioinfo: arimport_params.selectedAnalysisServices.bioinfo,
					                           },
					                           request_ids: _.map(outcome.arequest_ids, function(currentObject) {
                                                                return _.values(_.pick(currentObject, "ar_id"));
                                               }),
					                           client_id: arimport_params.selectedClient.id,
					                           client_keyword: arimport_params.selectedClient.client_id,
										    };

										    $scope.createWorksheets(this.worksheets_params);
										}
									}
								}
								if (result['success'] === 'False') {
									console.log(result);
									console.log(result['message']);
									$scope.loading_import.hide();
									Utility.alert({title:'Error while importing...', content: result['message'], alertType:'danger'});
									return;
								}
							});

                    	});
						$scope.loading_import.hide();
						Utility.alert({title:'', content: 'Wait while importing samples', alertType:'info'});
                    }
                    else {
                    	console.log(result['message']);
                    	$scope.loading_import.hide();
                    	Utility.alert({title:'There\'s been an error<br/>', content: result['message'], alertType:'danger'});

                    	return;
                    }
                });
			}


        // :: function :: create_worksheet()
        $scope.create_worksheet =
            function(ws_params, analysis, analyst) {
//                console.log(ws_params);
                function _get_analysis_path(request_id, analysis_id, client_id) {
                    this.path = "/" + Utility.get_root_url() + "/" + 'clients' + "/" + client_id + '/' + request_id + '/' + analysis_id;
                    return this.path

                }

                function _get_input_values_analyst(request_ids, analysis_id, analyst, client_id) {

                        var input_values = {};
                        _.each(request_ids,function(request_id) {
                                input_values[_get_analysis_path(request_id, analysis_id, client_id)] = {Analyst: analyst};
                        });

                        return JSON.stringify(input_values);

                }

                function _get_worksheet_analyses(request_ids, analysis_id, analyst, client_id) {

                        var worksheet_analyses = [];
                        _.each(request_ids,function(request_id) {

                                var item = {
                                    request_id: request_id[0],
                                    analysis_id: analysis_id,
                                    obj_path: _get_analysis_path(request_id, analysis_id, client_id),
                                    analyst: analyst,
                                };
                                worksheet_analyses.push(item);
                        });
//                        console.log(worksheet_analyses);
                        return JSON.stringify(worksheet_analyses);
                }


                this.params = {
                    title: analysis.title + '-' + ws_params.title,
                    description: analysis.title + '-' + ws_params.description,
                    Analyst: analyst,
                    Remarks: _get_worksheet_analyses(ws_params.request_ids, analysis.keyword,  analyst, ws_params.client_id),
                    subject: 'open',
                };

                Utility.alert({title:'', content: 'Wait while creating ' + this.params.title + ' worksheet', alertType:'info'});
                BikaService.createWorksheet(this.params).success(function (data, status, header, config){
                    result = data.result;

                    if (result['success'] === 'True') {
                        Utility.alert({title:'Success', content: 'Your Worksheet ' + result['obj_id'] + ' has been successfully created.', alertType:'success'});

                        this.params = {input_values: _get_input_values_analyst(ws_params.request_ids, analysis.keyword, analyst, ws_params.client_id )};

                        BikaService.updateAnalysisRequests(this.params).success(function (data, status, header, config){
                            if ( analysis.keyword === 'full-analysis' || analysis.keyword === 'FASTQ-File') {
                                $state.go('worksheets');
                            }

                        });
                    }
                    else {
                        console.log(result['message']);
                        Utility.alert({title:'There\'s been an error<br/>', content: result['message'], alertType:'danger'});
                    }

                });
        }

	    // :: function :: createWorksheets()
        $scope.createWorksheets =
            function(worksheets_params) {
                labanalyst = (worksheets_params.client_keyword === 'IRGB-CNR-Angius' ||  worksheets_params.client_keyword === 'IRGB-CNR-Cucca') ? 'maschio' : 'robycuso';

                _.each(worksheets_params.analysis.extraction, function(as) {
                    $scope.create_worksheet(worksheets_params, as, labanalyst);
                });
				_.each(worksheets_params.analysis.library_prep, function(as) {
				     $scope.create_worksheet(worksheets_params, as, labanalyst);
				});
				_.each(worksheets_params.analysis.illumina, function(as) {
				     $scope.create_worksheet(worksheets_params, as, labanalyst);
				});
				_.each(worksheets_params.analysis.bioinfo, function(as) {
				    bioanalyst = as.keyword === 'full-analysis'  ? 'm.massidda' : 'ratzeni';
				    $scope.create_worksheet(worksheets_params, as, bioanalyst);
				});



        }

		// :: function :: getBatches()
        $scope.getBatches =
            function(arimport_params) {
                $scope.batches = [];
                params = {};
                BikaService.getBatches(params).success(function (data, status, header, config){
                    $scope.batches = data.result.objects;
                });
            };

		// :: function :: getClients()
        $scope.getClients =
            function(arimport_params) {
                $scope.clients = [];
                params = {};
                BikaService.getClients(params).success(function (data, status, header, config){
                    _.each(data.result.objects, function(c) {
                        if (c.subject !== 'purchase_order') {
                            $scope.clients.push(c);
                        }

                    });
                });
            };

		// :: function :: getContacts()
        $scope.getContacts =
            function(arimport_params) {
                $scope.contacts = [];
                params = arimport_params.selectedClient != null ? {client_id: arimport_params.selectedClient.id} : {}
                BikaService.getContacts(params).success(function (data, status, header, config){
                    $scope.contacts = data.result.objects;
                });
            };

		// :: function :: getCCContacts()
        $scope.getCCContacts =
            function(arimport_params) {
                params = arimport_params.selectedClient != null ? {client_id: arimport_params.selectedClient.id} : {}
                BikaService.getContacts(params).success(function (data, status, header, config){
                    $scope.cc_contacts = data.result.objects;
                });
            };

		// :: function :: getSampleTypes()
        $scope.getSampleTypes =
            function(arimport_params) {
                params = {}
                BikaService.getSampleTypes(params).success(function (data, status, header, config){
                    $scope.sample_types = data.result.objects;
                });
            };


		// :: function :: getAnalysisProfiles()
        $scope.getAnalysisProfiles =
            function(arimport_params) {
                params = {}
                BikaService.getAnalysisProfiles(params).success(function (data, status, header, config){
                    $scope.analysis_profiles = data.result.objects;
                });
            };

		// :: function :: getAnalysisServices()
        $scope.getAnalysisServices =
            function(arimport_params) {
                this.params = {sort_on: 'keyword', sort_order: 'ascending',}
                BikaService.getAnalysisServices(this.params).success(function (data, status, header, config){
                	$scope.analysis_services = {extraction: [], bioinfo: [], illumina: [], library_prep: []};
                	console.log($scope.analysis_services)
                	_.each(data.result.objects, function (analysis) {

                     	if (analysis.category=="Extraction") {
                     		$scope.analysis_services.extraction.push(analysis);
                     	}
                     	else if (analysis.category=="Bioinformatics Service") {
                     		$scope.analysis_services.bioinfo.push(analysis);
                     	}
                     	else if (analysis.category=="Next Generation Sequencing") {
                     		$scope.analysis_services.illumina.push(analysis);
                     	}
                     	else if (analysis.category=="NGS Library Preparation") {
                     		$scope.analysis_services.library_prep.push(analysis);
                     	}

                    });

                });
            };

         // :: function :: getAnalysts()
        $scope.getAnalysts =
			function() {
				BikaService.getAnalystUsers().success(function (data, status, header, config){
					$scope.analysts = data.result.objects;
				});
			}

        // :: function :: getExportMode()
        $scope.getExportMode =
            function() {
                $scope.export_mode = config.bikaApiRest.data_source.export_mode;
            };

		// :: funcction :: getCostCenters()
		$scope.getCostCenters =
			function(arimport_params) {
				if ( $scope.arimport_params.selectedClient == null ||  $scope.arimport_params.selectedClient == undefined) {return;}
				this.params = {sort_on: 'title', sort_order: 'ascending'}
				BikaService.getSupplyOrders(this.params).success(function (data, status, header, config){
					$scope.cost_centers = [];
					_.each(data.result.objects, function(cc) {
						if (cc.client_id == $scope.arimport_params.selectedClient.id) {
							$scope.cost_centers.push(cc);
						}

					});
				});
			}


        // :: function :: update()
        $scope.update =
            function(arimport_params, target) {

                if (_.size(arimport_params) === 0) {
                    $scope.getClients();
                    $scope.getSampleTypes();
   					//$scope.getAnalysisProfiles();
   					$scope.getAnalysisServices();
   					$scope.getBatches();
   					$scope.getExportMode();
   					$scope.getAnalysts();
                }
            };

        $scope.update([]);

        $scope.arimport_params = {
        	switchAR: true,
            selectedClient: null,
            selectedContact: null,
        	selectedCCContacts: null,
        	selectedSampleType: null,
        	selectedContainerType: null,
        	selectedAnalysisProfiles: null,
        	selectedAnalysisServices: {extraction: [], library_prep: [], illumina: [], bioinfo: []},
        	selectedSamplingDate: Utility.format_date(),
        	selectedBatch: null,
        	selectedExportMode: $scope.export_mode[0],
        	textDescription: null,
        	uploadFile: null,
        	attachment: null,
        	attachment_content: null,
        	client_samples: [],
        	single_sample: 'FCID',
        	createWorksheets: true,
        };

        $scope.$watch('arimport_params.selectedClient',
            function (newValue, oldValue) {
                // Ignore initial setup.
                if ( newValue === oldValue) { return;}
                if ( newValue === null ) {
                	$scope.contacts = [];
                	$scope.cc_contacts = [];
                	$scope.batches = null;
                	$scope.batches_tags = null;
                	return; }
                $scope.getContacts($scope.arimport_params);
				$scope.getCCContacts($scope.arimport_params);
				$scope.getCostCenters($scope.arimport_params);
				//$scope.getBatches($scope.arimport_params);
            }
        );

        $scope.$watch('arimport_params.selectedSampleType',
            function (newValue, oldValue) {
                // Ignore initial setup.
                if ( newValue === oldValue) { return;}
                if ( newValue === null || newValue == undefined ) { $scope.arimport_params.selectedContainerType = null; return; }
                $scope.arimport_params.selectedContainerType = newValue.container_type;
            }
        );

		$scope.$watch('arimport_params.switchAR',
            function (newValue, oldValue) {
                // Ignore initial setup.
                if ( newValue === oldValue) { return;}
                $scope.header = [];
                $scope.arimport_params.client_samples = [];
                $scope.arimport_params.single_sample = null;
                $scope.arimport_params.uploadFile = null;

            });

        $scope.$watch('arimport_params.uploadFile',
            function (newValue, oldValue) {
                // Ignore initial setup.
                if ( newValue === oldValue) { return;}
                if ( newValue === null ) { $scope.arimport_params.client_samples; return; }

				var reader = new FileReader();
				reader.onload = function(event) {
					var data = event.target.result;
					ret_data = $scope.retrieveCSV(data);
					$scope.arimport_params.client_samples = ret_data.data;
					console.log($scope.arimport_params.client_samples);
					$scope.header = ret_data.header;
					$scope.getAnalysisProfiles();
				};

				reader.readAsText($scope.arimport_params.uploadFile);

            });

        $scope.$watch('arimport_params.attachment',
            function (newValue, oldValue) {

            	function extract_samples(content, sample_type) {
					var samples = Array();
					var index = 2;
					var start_sample_list = false;
					var idx = -1;
					_.each(content, function (row) {
						if (start_sample_list) {

							sample_data = row.split(',');
							pool = sample_data[idx];


				            this.sample =  sample_type === 'MS' ? sample_data[0] : sample_data[1];
							if (sample_data !== undefined && sample_data.length > 1 && _.findWhere(samples, {sample: this.sample}) === undefined) {

								if (sample_type === 'FC') {
									samples.push({index: index, sample: $scope.format_csv_field(this.sample)});

								}
								if (sample_type === 'MS') {
								    samples.push({index: index, sample: $scope.format_csv_field(this.sample)});
								}
								if (sample_type === 'POOL'){
									samples.push({index: index, sample: $scope.format_csv_field(this.sample), pool: pool});

									if ($scope.pools.indexOf(pool) == -1) {
										$scope.pools.push(pool);
									}
									$scope.header = ['pool'];
								}
								index++;
							}

						}

						if (row.search('Sample_ID,Sample_Name') != -1) {
								start_sample_list = true;
								sample_data = row.split(',');
						        idx = sample_data.length-1;
						}
					});

					return samples;
            	}
                // Ignore initial setup.
                if ( newValue === oldValue) { return;}
                if ( newValue === null ) {
                	$scope.arimport_params.client_samples = [];
                	return;
                }

				var reader = new FileReader();
				reader.onload = function(event) {
					var data = event.target.result;
					$scope.arimport_params.attachment_content = Array()
					_.each(data.split('\n'), function(row) {
						$scope.arimport_params.attachment_content.push($scope.format_csv_field(row));
					});

					var client_samples = extract_samples($scope.arimport_params.attachment_content, $scope.arimport_params.selectedSampleType.prefix);
					$scope.arimport_params.client_samples = _.union($scope.arimport_params.client_samples, client_samples);
					$scope.getAnalysisProfiles();

				};

				reader.readAsText($scope.arimport_params.attachment);
            });

		$scope.retrieveCSV =
			function(data, is_attachment) {

				function check_header(head) {

					if (head.length < 2) {
						Utility.alert({title:'Not valid CSV file!!!',
							content: "CSV file must contain at least two column: N & SampleID",
							alertType:'danger'}
						);
						return false;
					}
					return true;

				}

				function check_ordinals(value) {

					if (!Number.isInteger(parseInt(value))) {
						Utility.alert({title:'Not valid CSV file!!!',
							content: "First column must be a integer value",
							alertType:'danger'}
						);
						return false;
					}
					return true;
				}

				var ret_data = Array();
				var lines = is_attachment===undefined?data.split('\n'):data;
				header = lines[0].split(',')
				if (!check_header(header)) {return; }
				for(var i = 1; i < lines.length; i++){
					sample_data = lines[i].split(',');
					if (sample_data.length > 1 ) {
						if (!check_ordinals(sample_data[0])) {return;}
						ret_data[i]={index:is_attachment===undefined?i:i+1, ordinal: Utility.format_ordinal(sample_data[0]), sample: $scope.format_csv_field(sample_data[1])};
						if (sample_data.length > 2) {
							for (j = 2; j < sample_data.length; j++) {
								header[j] = $scope.format_csv_field(header[j]);
								ret_data[i][$scope.format_csv_field(header[j])] = $scope.format_csv_field(sample_data[j]);
							}
						}
					}
				}
				ret_data.shift();
				header.shift();
				header.shift();
				//console.log(ret_data);
				return {data: ret_data, header: header};
			}

		this.format_csv_field = function(field) {
			return Utility.format_csv_field(field);
		}

		$scope.format_csv_field = function(field) {
			return Utility.format_csv_field(field);
		}

		this.format_ordinal = function(field) {
			return Utility.format_ordinal(field);
		}

		$scope.sort = function(keyname){
			$scope.sortKey = keyname;   //set the sortKey to the param passed
			$scope.reverse = !$scope.reverse; //if true make it false and vice versa
		}


});

