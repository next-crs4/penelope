main_module.config(function($stateProvider, $urlRouterProvider, USER_ROLES) {
    $urlRouterProvider.otherwise('/login');

    $stateProvider
        .state('home', {
            url: '/home',
            templateUrl: 'app/components/home/home.home.view.html',
            controller: 'HomeCtrl',
            data: {
                authorizedRoles: [USER_ROLES.admin, USER_ROLES.manager]
            }
        })
        .state('dashboard', {
            url: '/dashboard',
            templateUrl: 'app/components/dashboard/dashboard.home.view.html',

            data: {
                 authorizedRoles: [USER_ROLES.admin, USER_ROLES.manager]
            }
        })
        .state('browser', {
            url: '/browser',
            templateUrl: 'app/components/browser/browser.home.view.html',

            data: {
                 authorizedRoles: [USER_ROLES.admin, USER_ROLES.manager]
            }
        })
        .state('clients', {
            url: '/clients',
            templateUrl: 'app/components/clients/clients.home.view.html',

            data: {
                 authorizedRoles: [USER_ROLES.admin, USER_ROLES.manager]
            }

        })
        .state('client', {
            url: '/client/:client_id',
            templateUrl: 'app/components/clients/client.home.view.html',
           	controller: function($stateParams) {
				$stateParams.client_id
			},
           	data: {
                  authorizedRoles: [USER_ROLES.admin, USER_ROLES.manager]
            }
        })
        .state('targets', {
            url: '/targets',
            templateUrl: 'app/components/admin/targets/targets.home.view.html',

            data: {
                 authorizedRoles: [USER_ROLES.admin, USER_ROLES.manager]
            }

        })
        .state('target', {
            url: '/target/:target_id',
            templateUrl: 'app/components/admin/targets/target.home.view.html',
           	controller: function($stateParams) {
				$stateParams.target_id
			},
           	data: {
                  authorizedRoles: [USER_ROLES.admin, USER_ROLES.manager]
            }
        })
        .state('deliveries', {
            url: '/deliveries',
            templateUrl: 'app/components/deliveries/deliveries.home.view.html',

            data: {
                 authorizedRoles: [USER_ROLES.admin, USER_ROLES.manager]
            }
        })
        .state('delivery', {
            url: '/delivery/:delivery_id',
            templateUrl: 'app/components/deliveries/delivery.home.view.html',

            data: {
                 authorizedRoles: [USER_ROLES.admin, USER_ROLES.manager]
            }
        })
        .state('request_form', {
            url: '/request_form',
            templateUrl: 'app/components/request_form/request_form.home.view.html',

            data: {
                 authorizedRoles: [USER_ROLES.admin, USER_ROLES.manager]
            }
        })
        .state('batches', {
            url: '/batches',
            templateUrl: 'app/components/batches/batches.home.view.html',

            data: {
                 authorizedRoles: [USER_ROLES.admin, USER_ROLES.manager]
            }
        })
        .state('batch', {
            url: '/batches/:batch_id',
            templateUrl: 'app/components/batches/batch.home.view.html',
           	controller: function($stateParams) {
				$stateParams.batch_id
			},
           	data: {
                  authorizedRoles: [USER_ROLES.admin, USER_ROLES.manager]
            }


        })
        .state('samplesheet_view', {
            url: '/samplesheet/view/:batches/{content}',
            templateUrl: 'app/shared/attachment/samplesheet.view.html',
            controller: function($stateParams) {
				$stateParams.batches
				$stateParams.content
			},
            data: {
                 authorizedRoles: [USER_ROLES.admin, USER_ROLES.manager, USER_ROLES.analyst]
            }

        })
        .state('samplesheet_link2run', {
            url: '/samplesheet/link_to_run/{content}',
            templateUrl: 'app/shared/attachment/samplesheet_link2run.home.view.html',
            controller: function($stateParams) {
				$stateParams.content
			},
            data: {
                 authorizedRoles: [USER_ROLES.admin, USER_ROLES.manager, USER_ROLES.analyst]
            }

        })
        .state('samplesheet_upload', {
            url: '/samplesheet/link_to_run',
            templateUrl: 'app/shared/attachment/samplesheet_link2run.home.view.html',
            data: {
                 authorizedRoles: [USER_ROLES.admin, USER_ROLES.manager, USER_ROLES.analyst]
            }

        })
        .state('samplesheet_replace', {
            url: '/samplesheet/replace',
            templateUrl: 'app/shared/attachment/samplesheet_replace.home.view.html',
            data: {
                 authorizedRoles: [USER_ROLES.admin, USER_ROLES.manager, USER_ROLES.analyst]
            }

        })
        .state('analysis_requests', {
            url: '/analysis_requests/:review_state',
            templateUrl: 'app/components/analysis_requests/analysis_requests.home.view.html',
			controller: function($stateParams) {
				$stateParams.review_state
			},
            data: {
                 authorizedRoles: [USER_ROLES.admin, USER_ROLES.manager]
            }

        })
        .state('analysis_request', {
            url: '/analysis_request/:analysis_request_id',
            templateUrl: 'app/components/analysis_requests/analysis_request.home.view.html',
			controller: function($stateParams) {
				$stateParams.analysis_request_id
			},
            data: {
                 authorizedRoles: [USER_ROLES.admin, USER_ROLES.manager]
            }

        })
        .state('worksheets', {
            url: '/worksheets',
            templateUrl: 'app/components/worksheets/worksheets.home.view.html',
            data: {
                 authorizedRoles: [USER_ROLES.admin, USER_ROLES.manager, USER_ROLES.analyst]
            }

        })
        .state('worksheet', {
            url: '/worksheet/:worksheet_id',
            templateUrl: 'app/components/worksheets/worksheet.home.view.html',
            data: {
                 authorizedRoles: [USER_ROLES.admin, USER_ROLES.manager, USER_ROLES.analyst]
            }

        })
        .state('arimport', {
            url: '/arimport',
            templateUrl: 'app/components/arimport/arimport.home.view.html',
            data: {
                authorizedRoles: [USER_ROLES.admin, USER_ROLES.manager]
            }

        })
        .state('cost_centers', {
            url: '/cost_centers',
            templateUrl: 'app/components/admin/cost_centers/cost_centers.home.view.html',
            data: {
                authorizedRoles: [USER_ROLES.admin]
            }

        })
        .state('cost_center', {
            url: '/cost_center/:costcenter_id',
            templateUrl: 'app/components/admin/cost_centers/cost_center.home.view.html',
            data: {
                authorizedRoles: [USER_ROLES.admin]
            }

        }).state('purchase_orders', {
            url: '/purchase_orders',
            templateUrl: 'app/components/admin/purchase_orders/purchase_orders.home.view.html',
            data: {
                authorizedRoles: [USER_ROLES.admin]
            }

        })
        .state('purchase_order', {
            url: '/purchase_order/:purchaseorder_id',
            templateUrl: 'app/components/admin/purchase_orders/purchase_order.home.view.html',
            data: {
                authorizedRoles: [USER_ROLES.admin]
            }

        })
        .state('lab_products', {
            url: '/lab_products',
            templateUrl: 'app/components/admin/lab_products/lab_products.home.view.html',
            data: {
                authorizedRoles: [USER_ROLES.admin, USER_ROLES.clerk]
            }

        })
        .state('lab_product', {
            url: '/lab_product/:labproduct_id',
            templateUrl: 'app/components/admin/lab_products/lab_product.home.view.html',
            data: {
                authorizedRoles: [USER_ROLES.admin, USER_ROLES.clerk]
            }

        })
        .state('runs', {
            url: '/runs',
            templateUrl: 'app/components/admin/runs/runs.home.view.html',
            data: {
                authorizedRoles: [USER_ROLES.admin, USER_ROLES.manager, USER_ROLES.analyst]
            }

        })
         .state('run', {
            url: '/run/:rd_label',
            templateUrl: 'app/components/admin/runs/run.home.view.html',
            data: {
                authorizedRoles: [USER_ROLES.admin, USER_ROLES.manager, USER_ROLES.analyst]
            }

        })
        .state('blackboard', {
            url: '/blackboard',
            templateUrl: 'app/components/blackboard/blackboard.home.view.html',
            data: {
                 authorizedRoles: [USER_ROLES.admin, USER_ROLES.manager, USER_ROLES.analyst]
            }
        })
        .state('login', {
            url: '/login',
            templateUrl: 'app/shared/login/login.view.html',
            controller: 'LoginCtrl',
        })
});
