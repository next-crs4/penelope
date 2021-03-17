#!/usr/bin/env python

import argparse, daemon, json, sys, os
try:
    from daemon.pidlockfile import PIDLockFile
except ImportError:
    from lockfile.pidlockfile import PIDLockFile


from bottle import post, get, run, response, request
from comoda import a_logger, LOG_LEVELS

from bika_api_rest import BikaApiRestService
from irods_api_rest import IrodsApiRestService

class BikaService(object):

    def __init__(self, bikaApi, irodsApi):
        # Web service methods
        post('/bika/login')(bikaApi.login)
        post('/bika/get/clients')(bikaApi.get_clients)
        post('/bika/get/contacts')(bikaApi.get_contacts)
        post('/bika/get/samples')(bikaApi.get_samples)
        post('/bika/get/analysis_requests')(bikaApi.get_analysis_requests)
        post('/bika/get/arimports')(bikaApi.get_arimports)
        post('/bika/get/batches')(bikaApi.get_batches)
        post('/bika/get/worksheets')(bikaApi.get_worksheets)
        post('/bika/get/deliveries')(bikaApi.get_worksheets)
        post('/bika/get/invoices')(bikaApi.get_invoices)
        post('/bika/get/price_list')(bikaApi.get_price_list)
        post('/bika/get/supply_orders')(bikaApi.get_supply_orders)
        post('/bika/get/purchase_orders')(bikaApi.get_supply_orders)
        post('/bika/get/lab_products')(bikaApi.get_lab_products)
        post('/bika/get/storage_locations')(bikaApi.get_storage_locations)
        post('/bika/get/manufacturers')(bikaApi.get_manufacturers)
        post('/bika/get/suppliers')(bikaApi.get_suppliers)
        post('/bika/get/artemplates')(bikaApi.get_artemplates)
        post('/bika/get/analysis_profiles')(bikaApi.get_analysis_profiles)
        post('/bika/get/analysis_services')(bikaApi.get_analysis_services)
        post('/bika/get/sample_types')(bikaApi.get_sample_types)
        post('/bika/get/users')(bikaApi.get_users)
        post('/bika/get/manager_users')(bikaApi.get_manager_users)
        post('/bika/get/analyst_users')(bikaApi.get_analyst_users)
        post('/bika/get/clerk_users')(bikaApi.get_clerk_users)
        post('/bika/get/client_users')(bikaApi.get_client_users)

        post('/bika/set/analysis_result')(bikaApi.set_analysis_result)
        post('/bika/set/analyses_results')(bikaApi.set_analyses_results)

        post('/bika/update/batch')(bikaApi.update_batch)
        post('/bika/update/batches')(bikaApi.update_batches)
        post('/bika/update/analysis_request')(bikaApi.update_analysis_request)
        post('/bika/update/analysis_requests')(bikaApi.update_analysis_requests)
        post('/bika/update/worksheet')(bikaApi.update_worksheet)
        post('/bika/update/worksheets')(bikaApi.update_worksheets)
        post('/bika/update/delivery')(bikaApi.update_worksheet)
        post('/bika/update/deliveries')(bikaApi.update_worksheets)
        post('/bika/update/supply_order')(bikaApi.update_supply_order)
        post('/bika/update/supply_orders')(bikaApi.update_supply_orders)
        post('/bika/update/purchase_order')(bikaApi.update_supply_order)
        post('/bika/update/purchase_orders')(bikaApi.update_supply_orders)
        post('/bika/update/lab_product')(bikaApi.update_lab_product)
        post('/bika/update/lab_products')(bikaApi.update_lab_products)
        post('/bika/update/client')(bikaApi.update_client)
        post('/bika/update/clients')(bikaApi.update_clients)
        post('/bika/update/contact')(bikaApi.update_contact)
        post('/bika/update/contacts')(bikaApi.update_contacts)

        post('/bika/cancel/batch')(bikaApi.cancel_batch)
        post('/bika/cancel/worksheet')(bikaApi.update_worksheets)
        post('/bika/cancel/analysis_request')(bikaApi.cancel_analysis_request)
        post('/bika/reinstate/batch')(bikaApi.reinstate_batch)
        post('/bika/reinstate/worksheet')(bikaApi.update_worksheets)
        post('/bika/reinstate/analysis_request')(bikaApi.reinstate_analysis_request)

        post('/bika/action/receive_sample')(bikaApi.receive_sample)
        post('/bika/action/close_batch')(bikaApi.close_batch)
        post('/bika/action/open_batch')(bikaApi.open_batch)
        post('/bika/action/close_worksheet')(bikaApi.update_worksheets)
        post('/bika/action/open_worksheet')(bikaApi.update_worksheets)
        post('/bika/action/submit')(bikaApi.submit)
        post('/bika/action/verify')(bikaApi.verify)
        post('/bika/action/publish')(bikaApi.publish)
        post('/bika/action/republish')(bikaApi.republish)
        post('/bika/action/activate_supply_order')(bikaApi.activate_supply_order)
        post('/bika/action/deactivate_supply_order')(bikaApi.deactivate_supply_order)
        post('/bika/action/dispatch_supply_order')(bikaApi.dispatch_supply_order)
        post('/bika/action/activate_lab_product')(bikaApi.activate_lab_product)
        post('/bika/action/deactivate_lab_product')(bikaApi.deactivate_lab_product)
        post('/bika/action/activate_client')(bikaApi.activate_client)
        post('/bika/action/deactivate_client')(bikaApi.deactivate_client)

        post('/bika/create/client')(bikaApi.create_client)
        post('/bika/create/contact')(bikaApi.create_contact)
        post('/bika/create/batch')(bikaApi.create_batch)
        post('/bika/create/analysis_request')(bikaApi.create_analysis_request)
        post('/bika/create/worksheet')(bikaApi.create_worksheet)
        post('/bika/create/delivery')(bikaApi.create_worksheet)
        post('/bika/create/supply_order')(bikaApi.create_supply_order)
        post('/bika/create/purchase_order')(bikaApi.create_supply_order)
        post('/bika/create/lab_product')(bikaApi.create_lab_product)

        post('/bika/count/analysis_requests')(bikaApi.count_analysis_requests)
        post('/bika/count/samples')(bikaApi.count_samples)

        post('/irods/get/running')(irodsApi.get_running_folders)
        post('/irods/get/runs')(irodsApi.get_runs)
        post('/irods/check/runs')(irodsApi.check_runs)
        post('/irods/sync/batchbook')(irodsApi.sync_batchbook)
        post('/irods/put/samplesheet')(irodsApi.put_samplesheet)
        post('/irods/get/samplesheet')(irodsApi.get_samplesheet)

        # check status
        post('/web/check/status')(self.test_server)
        post('/bika/check/status')(bikaApi.test_server)
        post('/irods/check/status')(irodsApi.test_server)

    def test_server(self):
        return json.dumps({'status':'Server running'})

    def start_service(self, host, port, logfile, pidfile, server):
        log = open(logfile, 'a')
        pid =PIDLockFile(pidfile)
        with daemon.DaemonContext(stderr=log, pidfile=pid):
            run(host=host, port=port, server=server)


def get_parser():
    parser = argparse.ArgumentParser('Run the Bika Lims HTTP server')
    parser.add_argument('--host', type=str, default='127.0.0.1',
                        help='web service binding host')
    parser.add_argument('--port', type=int,
                        help='web service binding port')
    parser.add_argument('--server', type=str, default='wsgiref',
                        help='server library (use paste for multi-threaded backend)')
    parser.add_argument('--debug', action='store_true',
                        help='Enable web server DEBUG mode')
    parser.add_argument('--pid-file', type=str,
                        help='PID file for the service daemon',
                        default='/tmp/bika_service.pid')
    parser.add_argument('--log-file', type=str,
                        help='log file for the service daemon',
                        default='/tmp/bika_service.log')
    parser.add_argument('--log-host', type=str, required=False,
                        help='the host of the Logstash server',
                        default=None)
    parser.add_argument('--log-port', type=int, required=False,
                        help='the port of the Logstash server',
                        default=None)
    return parser


def main(argv):
    parser = get_parser()
    args = parser.parse_args(argv)

    logger = a_logger('BikaService', level='INFO',  host=args.log_host, port=args.log_port)

    bikaApi = BikaApiRestService(logger)
    irodsApi = IrodsApiRestService(logger)

    bikaService = BikaService(bikaApi=bikaApi, irodsApi=irodsApi)

    logger.info("Starting Service")
    bikaService.start_service(args.host, args.port, args.log_file,
                              args.pid_file, args.server)

if __name__ == '__main__':
    main(sys.argv[1:])
