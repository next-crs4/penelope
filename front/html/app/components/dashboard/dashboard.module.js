
var dashboard_module = angular.module('DashboardModule',[]);

dashboard_module.run(function($rootScope){
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
			runs: -1,
			samples: -1,
	}

	$rootScope.dashboard_summary = {
	    batches: [],
	    cost_centers: [],
	    clients: [],
	    runs: [],
	    samples: [],
	    sequencers: [],
	    modes: [],
	}

	$rootScope.timeline_history = {
        batches: {
            yearly: {},
            monthly: {},
            date_from: null,
            date_to: null,
        },
        clients: {
            yearly: {},
            monthly: {},
            date_from: null,
            date_to: null,
        },
        cost_centers: {
            yearly: {},
            monthly: {},
            date_from: null,
            date_to: null,
        },
        runs: {
            yearly: {},
            monthly: {},
            date_from: null,
            date_to: null,
        },
        sequencers: {
            yearly: {},
            monthly: {},
            series: [],
            date_from: null,
            date_to: null,
        },
        modes: {
            yearly: {},
            monthly: {},
            series: [],
            date_from: null,
            date_to: null,
        },
        samples: {
            yearly: {},
            monthly: {},
            date_from: null,
            date_to: null,
        },


    }

});

dashboard_module.service('TimelineService', function($rootScope) {
    var timeline_history = $rootScope.timeline_history;

    this.buildTimeline =
        function (objects, type, date_from, date_to) {
            var first = date_from === undefined ? _.first(objects)['date'].split(" ")[0] : date_from;
            var last =  date_to === undefined ? _.last(objects)['date'].split(" ")[0] : date_to;
            this.years = _.range(parseInt(first.split("/")[0]), parseInt(last.split("/")[0])+1);


            var yearly = {};
            var monthly = {};

            _.each(this.years, function(year){

                yearly[year] = _.filter(objects, function(obj) {
                     // return true for every valid entry!
                     return obj.date.search(year) !== -1;
                });

                _.each(_.range(1,13), function(month) {
                    this.month =  String(month).length == 1 ? '0'+month : month;
                    this.year_month = year + '/' + this.month;

                    this.result = _.filter(objects, function(obj) {
                        return obj.date.search(this.year_month) !== -1 && obj.date.substring(0,7) >= first.substring(0,7) && obj.date.substring(0,7) <= last.substring(0,7);
                    });

                    if ( this.result.length > 0) {
                        monthly[this.year_month] = this.result;
                    }
                });
            });

            switch(type) {
                case 'batches':
                    $rootScope.timeline_history.batches.yearly = yearly;
                    $rootScope.timeline_history.batches.monthly = monthly;
                    $rootScope.timeline_history.batches.date_from = first;
                    $rootScope.timeline_history.batches.date_to = last;
                    break;

                case 'clients':
                    $rootScope.timeline_history.clients.yearly = yearly;
                    $rootScope.timeline_history.clients.monthly = monthly;
                    $rootScope.timeline_history.clients.date_from = first;
                    $rootScope.timeline_history.clients.date_to = last;
                    break;

                case 'cost_centers':
                    $rootScope.timeline_history.cost_centers.yearly = yearly;
                    $rootScope.timeline_history.cost_centers.monthly = monthly;
                    $rootScope.timeline_history.cost_centers.date_from = first;
                    $rootScope.timeline_history.cost_centers.date_to = last;
                    break;

                case 'runs':
                    $rootScope.timeline_history.runs.yearly = yearly;
                    $rootScope.timeline_history.runs.monthly = monthly;
                    $rootScope.timeline_history.runs.date_from = first;
                    $rootScope.timeline_history.runs.date_to = last;
                    break;

                case 'sequencers':
                    $rootScope.timeline_history.sequencers.yearly = {};
                    $rootScope.timeline_history.sequencers.monthly = {};
                    $rootScope.timeline_history.sequencers.date_from = first;
                    $rootScope.timeline_history.sequencers.date_to = last;
                    $rootScope.timeline_history.sequencers.series = [];
                    _.each(objects, function(obj) {
                        if (_.indexOf($rootScope.timeline_history.sequencers.series, obj.sequencer) == -1) {
                            $rootScope.timeline_history.sequencers.series.push(obj.sequencer)
                        }
                    });

                    _.each(Object.entries(yearly), function(y) {
                        values = [];

                        _.each($rootScope.timeline_history.sequencers.series, function(s) {
                            this.value = _.filter(y[1], function(obj) {
                                return obj.sequencer.search(s) !== -1;
                            });
                            values.push(this.value);
                        });
                        $rootScope.timeline_history.sequencers.yearly[y[0]] = values;
                    });

                    _.each(Object.entries(monthly), function(m) {
                        values = [];
                        _.each($rootScope.timeline_history.sequencers.series, function(s) {
                            this.value = _.filter(m[1], function(obj) {
                                return obj.sequencer.search(s) !== -1;
                            });
                            values.push(this.value);
                        });
                        $rootScope.timeline_history.sequencers.monthly[m[0]] = values;
                    });

                    break;

                case 'modes':
                    $rootScope.timeline_history.modes.yearly = {};
                    $rootScope.timeline_history.modes.monthly = {};
                    $rootScope.timeline_history.modes.date_from = first;
                    $rootScope.timeline_history.modes.date_to = last;
                    $rootScope.timeline_history.modes.series = [];
                    _.each(objects, function(obj) {
                        if (_.indexOf($rootScope.timeline_history.modes.series, obj.is_rapid) == -1) {
                            $rootScope.timeline_history.modes.series.push(obj.is_rapid)
                        }
                    });

                    _.each(Object.entries(yearly), function(y) {
                        values = [];

                        _.each($rootScope.timeline_history.modes.series, function(s) {
                            this.value = _.filter(y[1], function(obj) {
                                return obj.is_rapid.search(s) !== -1;
                            });
                            values.push(this.value);
                        });
                        $rootScope.timeline_history.modes.yearly[y[0]] = values;
                    });

                    _.each(Object.entries(monthly), function(m) {
                        values = [];
                        _.each($rootScope.timeline_history.modes.series, function(s) {
                            this.value = _.filter(m[1], function(obj) {
                                return obj.is_rapid.search(s) !== -1;
                            });
                            values.push(this.value);
                        });
                        $rootScope.timeline_history.modes.monthly[m[0]] = values;
                    });

                    break;

                case 'samples':
                    $rootScope.timeline_history.samples.yearly = yearly;
                    $rootScope.timeline_history.samples.monthly = monthly;
                    $rootScope.timeline_history.samples.date_from = first;
                    $rootScope.timeline_history.samples.date_to = last;
                    break;

                default:
                    break;
            }

    };

    this.getTimeline =
        function(period, set, series) {

        var item = $rootScope.timeline_history[set][period];

        var chart_timeline = {
            data: [],
            labels: [],
            csv_chart: [],
            csv_query: [],
            date_from: $rootScope.timeline_history[set].date_from,
            date_to: $rootScope.timeline_history[set].date_to,
        };
        var csv_chart = {};

        if (series !== undefined && series) {

            chart_timeline['series'] = $rootScope.timeline_history[set].series;
            var index = 0;

            _.each(chart_timeline['series'], function(s){
                 var data = [];
                 csv_chart['Serie'] = s;
                _.each(item, function(v,k) {
                    if (_.indexOf(chart_timeline.labels, k) === -1) {
                        chart_timeline.labels.push(k);
                    }
                    data.push(v[index].length);
                    csv_chart[k] = v[index].length;
                     _.each(v, function(obj) {
                        _.each(obj, function(o) {
                            o['x-label'] = k;
                            chart_timeline.csv_query.push(_.omit(o, 'metadata'));
                        });
                    });
                });

                chart_timeline.csv_chart.push(csv_chart);
                chart_timeline.data.push(data);
                index++;
                csv_chart = {};

            });

        }
        else {
             _.each(item, function(v,k) {
                chart_timeline.labels.push(k);
                chart_timeline.data.push(v.length);
                csv_chart[k] = v.length;
                _.each(v, function(o) {
                    o['x-label'] = k;
                    chart_timeline.csv_query.push(_.omit(o, 'metadata'));

                });
            });
            chart_timeline.csv_chart.push(csv_chart);
        }

        return chart_timeline;
    };


});

dashboard_module.service('DashboardService', function(BikaService, IrodsService, $rootScope) {

		var counter = $rootScope.counter;

 		this.samples_review_state = ['sample_due','sample_received'];
		this.ars_review_state = ['active', 'published'];

		this.services_review_state = [];
		this.worksheets_review_state = [];

		update_counter =
			function (review_state, count, counter) {
				counter[review_state] = parseInt(count);
			}

		countAnalysisRequests =
			function(review_state) {
				params = {sort_on: 'Date', sort_order: 'descending',
                		page_nr: 0, page_size: 1, include_fields: 'path'};

                if (review_state === 'active') {
					params['Subjects'] = 'sample_due|sample_received|to_be_verified|verified|published';
				}
				else {
					params['Subject'] = review_state;
				}

                BikaService.countAnalysisRequests(params).success(function (data, status, header, config){
					var count = data.result;
					update_counter(review_state, count, counter);

					if (review_state === 'active') {

                        this.params = {sort_on: 'id', sort_order: 'ascending', page_nr: 0,
                                       Subjects: "sample_due|sample_received|to_be_verified|verified|published"};
                        BikaService.getAnalysisRequests(this.params).success(function (data, status, header, config){
                            this.count = data.result.total;
                            samples = [];
                            update_counter('samples', this.count, counter);
                            _.each(data.result.objects, function(sample) {
                                this.dict = {id: sample['id'], path: sample['path'], date: sample['date_created']};
                                samples.push(this.dict);
                            });
                            $rootScope.dashboard_summary.samples = samples;

                        });
					}
                });
		}

		countSamples =
			function(review_state) {
                params = {sort_on: 'id', sort_order: 'descending', Subject: review_state, include_fields: 'path', page_nr: 0, page_size: 1};
                BikaService.countAnalysisRequests(params).success(function (data, status, header, config){
					var count = data.result;
					update_counter(review_state, count, counter);
                });
			}

		countWorksheets =
			function(review_state) {
                params = {sort_on: 'id', sort_order: 'descending', Subject: 'open'};

                BikaService.getWorksheets(params).success(function (data, status, header, config){
					var worksheets = data.result.objects;
					var analyst = $rootScope.currentUser.userid;
					var count = 0;
					if (review_state === 'assigned') {
						_.each(worksheets, function(w) {

							if (w.remarks != undefined && w.remarks != null &&  w.remarks != '' && analyst == w.analyst) {
								analyses = JSON.parse(w.remarks);
								count = count +  analyses.length;
								//console.log(count);
							}

						});
					}
					else if (review_state === 'worksheets') {
						count =  worksheets.length;
					}
					update_counter(review_state, count, counter);
                });
			}

		countBatches =
			function() {
                params = {sort_on: 'id', sort_order: 'ascending', Subject: 'open', page_nr: 0, Subjects: "open|closed"};
                BikaService.getBatches(params).success(function (data, status, header, config){
					this.count = data.result.total;
					batches = [];
					update_counter('batches', this.count, counter);
					_.each(data.result.objects, function(batch) {
					    this.dict = {id: batch['id'], path: batch['path'], date: batch['creation_date']};
					    batches.push(this.dict);
					});
					$rootScope.dashboard_summary.batches = batches;
                });
			}

	    countClients =
			function() {
                params = {sort_on: 'id', sort_order: 'ascending', page_nr: 0, Description: "active"};
                BikaService.getClients(params).success(function (data, status, header, config){
					this.count = data.result.total;
					clients = []
					update_counter('clients', this.count, counter);
					_.each(data.result.objects, function(client) {
					    this.dict = {id: client['id'], path: client['path'], date: client['creation_date']};
					    clients.push(this.dict);
					});
					$rootScope.dashboard_summary.clients = clients;
                });
			}

		countCostCenters =
			function() {
                params = {sort_on: 'id', sort_order: 'ascending', page_nr: 0, Subjects: 'pending|dispatch'};
                BikaService.getSupplyOrders(params).success(function (data, status, header, config){
					this.count = data.result.total;
					cost_centers = []
					update_counter('cost_centers', this.count, counter);
					_.each(data.result.objects, function(cost_center) {
					    this.dict = {id: cost_center['id'], path: cost_center['path'], date: cost_center['creation_date']};
					    cost_centers.push(this.dict);
					});
					$rootScope.dashboard_summary.cost_centers = cost_centers;
                });
			}

        countRuns =
			function() {
			    this.params = {sort_on: 'runs', sort_order: 'ascending',  page_nr: 0, page_size: 0};
				IrodsService.getRuns(this.params).success(function (data, status, header, config){
                    this.count = data.result.total;
                    runs = [];
                    update_counter('runs', this.count, counter);
                    _.each(data.result.objects.reverse(), function(run) {
                        date = '20'+ run['run'].substring(0, 2)+'/'+run['run'].substring(2, 4)+'/'+run['run'].substring(4, 6);
                        this.sequencer = _.findWhere(run['metadata'], {'name': 'scanner_id'})['value'];
                        this.is_rapid = _.findWhere(run['metadata'], {'name': 'is_rapid'})['value'];

					    this.dict = {run: run['run'], path: run['path'], date: date,
					                 metadata: run['metadata'], sequencer: this.sequencer, is_rapid: this.is_rapid};

					    runs.push(this.dict);
					});
					$rootScope.dashboard_summary.runs = runs;
					$rootScope.dashboard_summary.sequencers = runs;
					$rootScope.dashboard_summary.modes = runs;
                });

			}

		this.update_dashboard =
			function (target) {
			    if (target === undefined || target === 'samples') {
			        update_counter('samples', -1, $rootScope.counter);
                    _.each(this.ars_review_state,function(review_state) {
                        update_counter(review_state, -1, $rootScope.counter);
                        countAnalysisRequests(review_state);
                    });
                    _.each(this.samples_review_state,function(review_state) {
                        update_counter(review_state, -1, $rootScope.counter);
                        countSamples(review_state);
                    });
                    _.each(this.services_review_state,function(review_state) {
                        update_counter(review_state, -1, $rootScope.counter);
                        countAnalysisRequests(review_state);
                    });
                    _.each(this.worksheets_review_state,function(review_state) {
                        update_counter(review_state, -1, $rootScope.counter);
                        countWorksheets(review_state);
                    });
			    }

			    // Batches
                if (target === undefined || target === 'batches') {
                    update_counter('batches', -1, $rootScope.counter);
				    countBatches();
                }

				// Clients
				if (target === undefined || target === 'clients') {
				    update_counter('clients', -1, $rootScope.counter);
				    countClients();
				}

				// Cost Centers
				if (target === undefined || target === 'cost_centers') {
				    update_counter('cost_centers', -1, $rootScope.counter);
				    countCostCenters();
				}

				// Runs
				if (target === undefined || target === 'runs') {
				    update_counter('runs', -1, $rootScope.counter);
				    countRuns();
				}

				return counter;
			}

		return this;
});

dashboard_module.factory('focus', function($timeout, $window) {
    return function(id) {
      // timeout makes sure that it is invoked after any other event has been triggered.
      // e.g. click events that need to run before the focus or
      // inputs elements that are in a disabled state but are enabled when those events
      // are triggered.
      $timeout(function() {
        var element = $window.document.getElementById(id);
        if(element)
          element.focus();
      });
    };
});

dashboard_module.directive('eventFocus', function(focus) {
    return function(scope, elem, attr) {
      elem.on(attr.eventFocus, function() {
        focus(attr.eventFocusId);
      });

      // Removes bound events in the element itself
      // when the scope is destroyed
      scope.$on('$destroy', function() {
        elem.off(attr.eventFocus);
      });
    };
});

dashboard_module.controller('DashboardCtrl',
	function(DashboardService, Utility,  focus, $state, $scope, $rootScope) {
	    $scope.params = {choose: 'oversee'};
        focus($scope.params.choose);

	    this.goto = function(id) {
            // do something awesome
            focus(id);
            $scope.params.choose = id;
        };

        $scope.$watch('params.choose',
            function (newValue, oldValue) {
                // Ignore initial setup.
                if ( newValue === oldValue) { return;}
                focus(newValue);
        });


});

dashboard_module.controller('OverseeCtrl',
	function(DashboardService, TimelineService, Utility, $state, $scope, $rootScope) {

		$scope.loading = Utility.loading({busyText: 'Wait while Loading...', theme: 'info', showBar: true, delayHide: 1500});
		$scope.loading.show();

		DashboardService.update_dashboard();

		$scope.counter = $rootScope.counter;
        $scope.dashboard_summary = $rootScope.dashboard_summary;

        $scope.chart = {
            batches: {
                type: 'Bar',
                labels: [],
                options: {},
                data: [],
                period: 'yearly',
                date_from: null,
                date_to: null,
            },

            clients: {
                type: 'Bar',
                labels: [],
                options: {},
                data: [],
                period: 'yearly',
                date_from: null,
                date_to: null,
            },

            cost_centers: {
                type: 'Bar',
                labels: [],
                options: {},
                data: [],
                period: 'yearly',
                date_from: null,
                date_to: null,
            },

            runs: {
                type: 'Bar',
                labels: [],
                options: {},
                data: [],
                period: 'yearly',
                date_from: null,
                date_to: null,
            },

            samples: {
                type: 'Bar',
                labels: [],
                options: {},
                data: [],
                period: 'yearly',
                date_from: null,
                date_to: null,
            },
        };

        $scope.chart_types = ['Bar', 'Line', 'Horizontal Bar', 'Pie', 'Doughnut', 'Polar Area'];

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

        $scope.$watch('dashboard_summary.batches',
            function (newValue, oldValue) {
                if ( newValue === oldValue) { return;}
                TimelineService.buildTimeline($scope.dashboard_summary.batches, 'batches')
                $scope.getTimeline('batches');
            });

        $scope.$watch('chart.batches.period',
            function (newValue, oldValue) {
                if ( newValue === oldValue) { return;}
                $scope.getTimeline('batches');
            });

        $scope.$watch('chart.batches.type',
            function (newValue, oldValue) {
                if ( newValue === oldValue) { return;}
                $scope.getTimeline('batches');
            });

        $scope.$watchGroup(['chart.batches.date_from','chart.batches.date_to'],
            function (newValues, oldValues) {
                if ( _.isEqual(newValues, oldValues) ) { return;}
                TimelineService.buildTimeline($scope.dashboard_summary.batches, 'batches', newValues[0], newValues[1])
                $scope.getTimeline('batches');

            });

        $scope.$watch('dashboard_summary.clients',
            function (newValue, oldValue) {
                if ( newValue === oldValue) { return;}
                TimelineService.buildTimeline($scope.dashboard_summary.clients, 'clients')
                $scope.getTimeline('clients');
            });

        $scope.$watch('chart.clients.period',
            function (newValue, oldValue) {
                if ( newValue === oldValue) { return;}
                $scope.getTimeline('clients');
            });

        $scope.$watch('chart.clients.type',
            function (newValue, oldValue) {
                if ( newValue === oldValue) { return;}
                $scope.getTimeline('clients');
            });

        $scope.$watchGroup(['chart.clients.date_from','chart.clients.date_to'],
            function (newValues, oldValues) {
                if ( _.isEqual(newValues, oldValues) ) { return;}
                TimelineService.buildTimeline($scope.dashboard_summary.clients, 'clients', newValues[0], newValues[1])
                $scope.getTimeline('clients');

            });

        $scope.$watch('dashboard_summary.cost_centers',
            function (newValue, oldValue) {
                if ( newValue === oldValue) { return;}
                TimelineService.buildTimeline($scope.dashboard_summary.cost_centers, 'cost_centers')
                $scope.getTimeline('cost_centers');
            });

        $scope.$watch('chart.cost_centers.period',
            function (newValue, oldValue) {
                if ( newValue === oldValue) { return;}
                $scope.getTimeline('cost_centers');
            });

        $scope.$watch('chart.cost_centers.type',
            function (newValue, oldValue) {
                if ( newValue === oldValue) { return;}
                $scope.getTimeline('cost_centers');
            });

        $scope.$watchGroup(['chart.cost_centers.date_from','chart.cost_centers.date_to'],
            function (newValues, oldValues) {
                if ( _.isEqual(newValues, oldValues) ) { return;}
                TimelineService.buildTimeline($scope.dashboard_summary.cost_centers, 'cost_centers', newValues[0], newValues[1])
                $scope.getTimeline('cost_centers');

            });

        $scope.$watch('dashboard_summary.runs',
            function (newValue, oldValue) {
                if ( newValue === oldValue) { return;}
                TimelineService.buildTimeline($scope.dashboard_summary.runs, 'runs')
                $scope.getTimeline('runs');
            });

        $scope.$watch('chart.runs.period',
            function (newValue, oldValue) {
                if ( newValue === oldValue) { return;}
                $scope.getTimeline('batches');
            });

        $scope.$watch('chart.runs.type',
            function (newValue, oldValue) {
                if ( newValue === oldValue) { return;}
                $scope.getTimeline('runs');
            });

        $scope.$watchGroup(['chart.runs.date_from','chart.runs.date_to'],
            function (newValues, oldValues) {
                if ( _.isEqual(newValues, oldValues) ) { return;}
                TimelineService.buildTimeline($scope.dashboard_summary.runs, 'runs', newValues[0], newValues[1])
                $scope.getTimeline('runs');

            });

        $scope.$watch('dashboard_summary.samples',
            function (newValue, oldValue) {
                if ( newValue === oldValue) { return;}
                TimelineService.buildTimeline($scope.dashboard_summary.samples, 'samples')
                $scope.getTimeline('samples');
            });

        $scope.$watch('chart.samples.period',
            function (newValue, oldValue) {
                if ( newValue === oldValue) { return;}
                $scope.getTimeline('samples');
            });

        $scope.$watch('chart.samples.type',
            function (newValue, oldValue) {
                if ( newValue === oldValue) { return;}
                $scope.getTimeline('samples');
            });

        $scope.$watchGroup(['chart.samples.date_from','chart.samples.date_to'],
            function (newValues, oldValues) {
                if ( _.isEqual(newValues, oldValues) ) { return;}
                TimelineService.buildTimeline($scope.dashboard_summary.samples, 'samples', newValues[0], newValues[1])
                $scope.getTimeline('samples');

            });

        $scope.getTimeline =
            function(set) {
                this.result = TimelineService.getTimeline($scope.chart[set].period, set);

                if (_.indexOf(['Pie', 'Polar Area', 'Doughnut'], $scope.chart[set].type) !== -1 ) {
                    $scope.chart[set].options['legend'] = {display: true, position: 'left'};

                }
                else {$scope.chart[set].options['legend'] = {display: false};}

                $scope.chart[set].options['scales'] = {
                    yAxes: [{
                        ticks: {
                            beginAtZero:true
                        }
                    }],
                    xAxes: [{
                        ticks: {
                            beginAtZero:true
                        }
                    }]
                }

                $scope.chart[set].labels = this.result.labels;
                $scope.chart[set].data = this.result.data;
                $scope.chart[set].csv_chart = this.result.csv_chart;
                $scope.chart[set].csv_query = this.result.csv_query;
                $scope.chart[set].date_from = this.result.date_from;
                $scope.chart[set].date_to = this.result.date_to;

        };



});

dashboard_module.controller('DashRunsCtrl',
	function(DashboardService, TimelineService, Utility, $state, $scope, $rootScope) {

		$scope.loading = Utility.loading({busyText: 'Wait while Loading...', theme: 'info', showBar: true, delayHide: 1500});
		$scope.loading.show();

		DashboardService.update_dashboard('runs');
//		DashboardService.update_dashboard('sequencers');

        $scope.dashboard_summary = $rootScope.dashboard_summary;

        $scope.chart = {
            runs: {
                type: 'Bar',
                labels: [],
                options: {},
                data: [],
                period: 'yearly',
                date_from: null,
                date_to: null,
            },
            sequencers: {
                type: 'Bar',
                labels: [],
                options: {},
                data: [],
                period: 'yearly',
                date_from: null,
                date_to: null,
                series: [],
            },
            modes: {
                type: 'Bar',
                labels: [],
                options: {},
                data: [],
                period: 'yearly',
                date_from: null,
                date_to: null,
                series: [],
            },
        }

        $scope.chart_types = ['Bar', 'Horizontal Bar'];



        $scope.$watch('dashboard_summary.runs',
            function (newValue, oldValue) {
                if ( newValue === oldValue) { return;}
                TimelineService.buildTimeline($scope.dashboard_summary.runs, 'runs')
                $scope.getTimeline('runs');
            });

        $scope.$watch('chart.runs.period',
            function (newValue, oldValue) {
                if ( newValue === oldValue) { return;}
                $scope.getTimeline('runs');
            });

        $scope.$watch('chart.runs.type',
            function (newValue, oldValue) {
                if ( newValue === oldValue) { return;}
                $scope.getTimeline('runs');
            });

        $scope.$watchGroup(['chart.runs.date_from','chart.runs.date_to'],
            function (newValues, oldValues) {
                if ( _.isEqual(newValues, oldValues) ) { return;}
                TimelineService.buildTimeline($scope.dashboard_summary.runs, 'runs', newValues[0], newValues[1])
                $scope.getTimeline('runs');

            });

        $scope.$watch('dashboard_summary.sequencers',
            function (newValue, oldValue) {
                if ( newValue === oldValue) { return;}
                TimelineService.buildTimeline($scope.dashboard_summary.sequencers, 'sequencers')
                $scope.getTimeline('sequencers', true);
            });

        $scope.$watch('chart.sequencers.period',
            function (newValue, oldValue) {
                if ( newValue === oldValue) { return;}
                $scope.getTimeline('sequencers', true);
            });

        $scope.$watch('chart.sequencers.type',
            function (newValue, oldValue) {
                if ( newValue === oldValue) { return;}
                $scope.getTimeline('sequencers', true);
            });

        $scope.$watchGroup(['chart.sequencers.date_from','chart.sequencers.date_to'],
            function (newValues, oldValues) {
                if ( _.isEqual(newValues, oldValues) ) { return;}
                TimelineService.buildTimeline($scope.dashboard_summary.sequencers, 'sequencers', newValues[0], newValues[1])
                $scope.getTimeline('sequencers', true);

            });

        $scope.$watch('dashboard_summary.modes',
            function (newValue, oldValue) {
                if ( newValue === oldValue) { return;}
                TimelineService.buildTimeline($scope.dashboard_summary.modes, 'modes')
                $scope.getTimeline('modes', true);
            });

        $scope.$watch('chartmodes.period',
            function (newValue, oldValue) {
                if ( newValue === oldValue) { return;}
                $scope.getTimeline('modes', true);
            });

        $scope.$watch('chart.modesype',
            function (newValue, oldValue) {
                if ( newValue === oldValue) { return;}
                $scope.getTimeline('modes', true);
            });

        $scope.$watchGroup(['chart.modes.date_from','chart.modes.date_to'],
            function (newValues, oldValues) {
                if ( _.isEqual(newValues, oldValues) ) { return;}
                TimelineService.buildTimeline($scope.dashboard_summary.modes, 'modes', newValues[0], newValues[1])
                $scope.getTimeline('modes', true);

            });

        $scope.getTimeline =
            function(set, series) {
                this.result = TimelineService.getTimeline($scope.chart[set].period, set, series);

                $scope.chart[set].labels = this.result.labels;
                $scope.chart[set].data = this.result.data;
                $scope.chart[set].csv_chart = this.result.csv_chart;
                $scope.chart[set].csv_query = this.result.csv_query;
                $scope.chart[set].date_from = this.result.date_from;
                $scope.chart[set].date_to = this.result.date_to;

                if ( set === 'sequencers' || set === 'modes') {
                    $scope.chart[set].options['legend'] = {display: true, position: 'top'};
                    $scope.chart[set].series = this.result.series;
                    $scope.chart[set].options['scales'] = {
                        xAxes: [{
                          stacked: true,
                          ticks: {
                            beginAtZero:true,
                          },
                        }],
                        yAxes: [{
                          stacked: true,
                          ticks: {
                            beginAtZero:true,
                          },
                        }]
                      }
                }
                else {
                    $scope.chart[set].options['legend'] = {display: false};
                    $scope.chart[set].options['scales'] = {
                        yAxes: [{
                            ticks: {
                                beginAtZero:true
                            }
                        }],
                        xAxes: [{
                            ticks: {
                                beginAtZero:true
                            }
                        }]
                    }

                }

        };



});

