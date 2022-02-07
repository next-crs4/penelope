
from functools import wraps
from bottle import post, get, run, response, request

import xml.etree.ElementTree as ET
import os
import subprocess
import json
from tempfile import NamedTemporaryFile
import csv
import shlex
import ast
from distutils.util import strtobool
from lxml.html import parse
from libs.yrods import IrodsObjectStore
from libs import BikaEncoder

class IrodsApiRestService(object):
    def __init__(self, logger):

        self.metadata = dict(
            rundir_collection=[
                'run',
                'fcid',
                'read1_cycles',
                'read2_cycles',
                'index1_cycles',
                'index2_cycles',
                'is_rapid',
                'date',
                'scanner_id',
                'scanner_nickname',
                'pe_kit',
                'sbs_kit',
                'index_kit',
                'pe_id',
                'sbs_id',
                'index_id',
            ]
        )
        self.positive_labels = ['finished', "ownership ok",
                                'SampleSheet found', 'Barcodes have the same size',
                                'Metadata found']

        self.negative_labels = ['running ', "waiting for ownership's modification",
                                'SampleSheet not found',"Barcodes don't have the same size",
                                'Metadata not found']
        self.logger = logger

    def _success(self, body, return_code=200):
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS, PUT'
        response.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept'
        response.content_type = 'application/json'
        response.status = return_code
        return json.dumps({'result': body}, cls=BikaEncoder)

    def _get_params(self, request_data):
        for item in request_data:
            return eval(item)

    def wrap_default(f):
        @wraps(f)
        def wrapper(inst, *args, **kwargs):
            res = f(inst, *args, **kwargs)
            if not res or len(res) == 0:
                return None
            else:

                return inst._success(res)

        return wrapper

    def test_server(self):
        params = self._get_params(request.forms)
        callback = params.get('callback')
        status = {'status': 'Server running'}
        return '{0}({1})'.format(callback, {'result': status})

    @wrap_default
    def get_runs(self):
        self.logger.info("Getting Runs")
        params = self._get_params(request.forms)
        rundir_collection = params.get('samplesheet_collection')
        params.update(dict(irods_path=rundir_collection))
        res = self._ils(params, delivery=True)

        if params.get('rd_label'):
            runs = [r for r in res['result'] if r.name in [params.get('rd_label')]]
            total, last = 1, 1
        else:
            runs, total, last = self._pagination(data=sorted(res['result'], key=lambda k: k.name, reverse=True),
                                                 page_nr=params.get('page_nr'),
                                                 page_size=params.get('page_size'))

        cmd = 'get_report_folders'
        reports = self._ssh_cmd(user=params.get('user'),
                                host=params.get('host'),
                                password=params.get('password'),
                                cmd=self._get_icmd(cmd=cmd, params=params))

        result = [dict(
            path=r.path,
            run=r.name.encode('utf-8'),
            metadata=self.__get_metadata(irods_obj=r),
            files=[f.name for f in r.data_objects],
            report_path=os.path.join(params.get('report_host'), r.name) if r.name.encode('utf-8') in reports['result'] else '',
            qc_summary=self.__get_qc_summary(base_url=os.path.join(params.get('report_host'), r.name)) if r.name.encode('utf-8') in reports['result'] else ''
        ) for r in runs]

        self.logger.info("Runs: {} - success: {} - error: {}".format(total, res.get('success'),res.get('error')))
        return dict(objects=result, total=total, last=last, success=res.get('success'), error=res.get('error'))

    @wrap_default
    def get_samplesheet(self):
        self.logger.info("Getting Samplesheet")
        params = self._get_params(request.forms)

        rundir_collection = params.get('samplesheet_collection')
        rundir = params.get('run')
        ipath = params.get('path')
        irods_path = os.path.join(ipath, "SampleSheet.csv") if ipath else os.path.join(rundir_collection, rundir, "SampleSheet.csv")
        params.update(dict(irods_path=irods_path))

        res = self._iget(params)
        samplesheet = [l.split(b',') for l in res.get('result')]
        self.logger.info(irods_path + " - success: {} - error: {}".format(
            res.get('success'),
            res.get('error')))
        return dict(objects=samplesheet, success=res.get('success'), error=res.get('error'))

    @wrap_default
    def sync_batchbook(self):
        self.logger.info("Synchronizing batchbook")
        params = self._get_params(request.forms)
        cmd = 'sync_batchbook'
        res = self._ssh_cmd(user=params.get('user'),
                            host=params.get('host'),
                            password=params.get('password'),
                            cmd=self._get_icmd(cmd=cmd, params=params),
                            switch=True)
        result = list()
        self.logger.info("success: {} - error: {}".format(res.get('success'), res.get('error')))
        return dict(objects=result, success=res.get('success'), error=res.get('error'))

    @wrap_default
    def check_runs(self):
        self.logger.info("Checking Runs")
        params = self._get_params(request.forms)
        cmd = 'check_runs'
        res = self._ssh_cmd(user=params.get('user'),
                            host=params.get('host'),
                            password=params.get('password'),
                            cmd=self._get_icmd(cmd=cmd, params=params),
                            switch=True)
        result = list()
        indices = [i for i, s in enumerate(res['result']) if 'Rundir'.encode('utf8') in s]
        for i in indices:
            rundir = res['result'][i].split(b'|')[3].split(b' ')[1]
            check_res = res['result'][i + 1].split(b'|')[3]
            check_res = ast.literal_eval(check_res.decode('utf-8'))
            result.extend([dict(
                run=rundir,
                status=check_res[0],
                ownership=check_res[1],
                samplesheet=check_res[2],
                barcodes=check_res[3],
                metadata=check_res[4],
                ready="True" if set(check_res) == set(self.positive_labels) else "False",
            )])
        self.logger.info("Runs: {} - success: {} - error: {}".format(len(result),
                                                                     res.get('success'),
                                                                     res.get('error')))
        return dict(objects=result, success=res.get('success'), error=res.get('error'))

    @wrap_default
    def get_running_folders(self):
        self.logger.info("Getting Running Folders")
        params = self._get_params(request.forms)
        cmd = 'get_running_folders'
        result = list()
        for this_run_folder in params.get('run_folders'):
                params.update(dict(run_folder=this_run_folder))
                res = self._ssh_cmd(user=params.get('user'),
                                    host=params.get('host'),
                                    password=params.get('password'),
                                    cmd=self._get_icmd(cmd=cmd, params=params))

                result.extend([dict(
                    path=str(this_run_folder),
                    running_folder=str(r),
                    run_info=self._get_run_info(params=params,
                                                run=str(r)),
                    run_parameters=self._get_run_parameters(params=params,
                                                            run=str(r)),
                ) for r in res['result']])
        if len(result) == 0:
            result.append(dict(
                running_folder='MISSING RUN FOLDER',
                run_info=dict(),
                run_parameters=dict()))
        self.logger.info("Runs: {} - success: {} - error: {}".format(len(result),
                                                                     res.get('success'),
                                                                     res.get('error')))

        return dict(objects=result, success=res.get('success'), error=res.get('error'))

    @wrap_default
    def put_samplesheet(self):
        self.logger.info("Putting Samplesheet")
        params = self._get_params(request.forms)

        # creating samplesheet file
        samplesheet = json.loads(params.get('samplesheet'))
        f = NamedTemporaryFile(delete=False)

        with f:
            writer = csv.writer(f)
            writer.writerows(samplesheet)

        local_path = f.name

        # creating run_dir collection
        rundir_collection = os.path.join(params.get('samplesheet_collection'),
                                         params.get('illumina_run_directory'))
        params.update(dict(collection=rundir_collection))

        res = self._imkdir(params)

        if 'success' in res and res.get('success') in "True":

            params.update(dict(local_path=local_path,
                               irods_path=os.path.join(rundir_collection, "SampleSheet.csv")))

            res = self._iput(params=params)

            if 'success' in res and res.get('success') in "True":
                for key in self.metadata.get('rundir_collection', list()):
                    params.update(dict(attr_name=key,
                                       attr_value=str(params.get(key, '')),
                                       irods_path=rundir_collection)
                                  )

                    self._iset_attr(params=params)
        f.close()
        if os.path.exists(local_path):
            os.remove(local_path)
        self.logger.info("success: {} - error: {}".format(res.get('success'), res.get('error')))
        return dict(objects=res.get('result'), success=res.get('success'), error=res.get('error'))

    def _get_irods_conf(self, params):
        return dict(host=params.get('irods_host'),
                    port=params.get('irods_port'),
                    user=params.get('irods_user'),
                    password=params.get('irods_password'),
                    zone=params.get('irods_zone'))

    def _iinit(self, params):
        ir_conf = self._get_irods_conf(params)

        ir = IrodsObjectStore(host=ir_conf['host'],
                              port=ir_conf['port'],
                              user=ir_conf['user'],
                              password=ir_conf['password'],
                              zone=ir_conf['zone'],
                              logger=self.logger)
        return ir

    def _iexit(self, irods_session):
        try:
            irods_session.sess.cleanup()
        except:
            pass

    def _ils(self, params, delivery=True):
        ir = self._iinit(params)
        try:
            irods_path = params.get('irods_path')
            exists, iobj = ir.exists(irods_path, delivery=True)
            #ir.cleanup()
            if exists:
                data_objects = [d for d in iobj.data_objects] if delivery else [d for d in iobj.data_objects]
                data_objects.extend([d for d in iobj.subcollections] if delivery else [d for d in iobj.subcollections])
                return dict(success='True', error=[], result=data_objects)
        except Exception as e:
            self.logger.error(str(e.message))
            #ir.cleanup()
            return dict(success='False', error=[], result=[])

    def _imkdir(self, params):
        ir = self._iinit(params)
        try:
            obj_path = params.get('collection')
            if ir.exists(path=obj_path) and ir.is_a_collection(obj_path=obj_path):
                collection = ir.get_object(src_path=obj_path)
            else:
                collection = ir.create_object(dest_path=obj_path, collection=True)
            #ir.cleanup()
            if collection and collection.path and len(collection.path) > 0:
                res = dict(success='True', error=[], result=dict(name=collection.name, path=collection.path))
            else:
                res = dict(success='False', error=[], result=[])
        except Exception as e:
            self.logger.error(str(e.message))
            #ir.cleanup()
            res = dict(success='False', error=self.__str(e.message), result=[])

        return res

    def _iput(self, params):
        ir = self._iinit(params)
        res = dict(success='True', error=[], result=params)
        overwrite = strtobool(params.get('overwrite_if_exists', 'False'))
        try:
            irods_path = params.get('irods_path')
            if not ir.exists(path=irods_path):
                ir.put_object(source_path=params.get('local_path'), dest_path=irods_path)
            else:
                if overwrite:
                    ir.remove_object(obj_path=irods_path)
                    ir.put_object(source_path=params.get('local_path'), dest_path=irods_path)
                else:
                    msg = '{} already exists'.format(irods_path)
                    return dict(success='False', error=[self.__str(msg)], result=[])
            obj = ir.get_object(irods_path)
            #ir.cleanup()

            if obj and obj.path and len(obj.path) > 0:
                res = dict(success='True', error=[], result=dict(name=obj.name, path=obj.path))
            else:
                res = dict(success='False', error=[], result=[])
        except Exception as e:
            self.logger.error(str(e.message))
            #ir.cleanup()
            res = dict(success='False', error=self.__str(e.message), result=[])

        return res

    def _iget(self, params):
        ir = self._iinit(params)
        try:
            exists, iobj = ir.exists(params.get('irods_path'), delivery=True)
            #ir.cleanup()
            if exists:
                with iobj.open('r') as f:
                    lines = f.read().splitlines()
                res = dict(success='True', error=[], result=lines)
            else:
                res = dict(success='False', error=[], result=[])
        except Exception as e:
            self.logger.error(str(e.message))
            #ir.cleanup()
            res = dict(success='False', error=[], result=[])

        return res

    def _iset_attr(self, params):
        ir = self._iinit(params)
        try:
            if params.get('attr_name') and len(params.get('attr_name')) > 0:

                ir.add_object_metadata(path=params.get('irods_path'),
                                       meta=(params.get('attr_name'),
                                             params.get('attr_value') if len(params.get('attr_value')) > 0 else None))
            #ir.cleanup()
        except Exception as e:
            self.logger.error(str(e.message))
            #ir.cleanup()
            pass

    def _get_run_info(self, params, run):

        def _run_info_parser(run_info):
            result = dict()
            if len(run_info['result']) > 0:
                root = ET.fromstringlist(run_info['result'])
                result = dict(
                    reads=[r.attrib for r in root.iter('Read')],
                    fc_layout=[fc.attrib for fc in root.iter('FlowcellLayout')],
                )
            return result

        cmd = 'get_run_info'
        params.update(dict(this_run=run))
        res = self._ssh_cmd(user=params.get('user'),
                            host=params.get('host'),
                            password=params.get('password'),
                            cmd=self._get_icmd(cmd=cmd, params=params))

        if len(res['result']) == 0:
            cmd = 'get_run_info'
            params.update(dict(this_run=os.path.join(run, 'raw')))
            res = self._ssh_cmd(user=params.get('user'),
                                host=params.get('host'),
                                password=params.get('password'),
                                cmd=self._get_icmd(cmd=cmd, params=params))
        self.logger.info(res)
        return _run_info_parser(res)

    def _get_run_parameters(self, params, run):

        def _run_parameters_parser(run_parameters):
            result = dict()
            if len(run_parameters['result']) > 0:
                root = ET.fromstringlist(run_parameters['result'])
                result = dict(
                    run_info=dict(
                        run_id=list(root.iter('RunID')).pop(0).text if len(list(root.iter('RunID'))) else '',
                        fc_id=list(root.iter('Barcode')).pop(0).text if len(list(root.iter('Barcode'))) else '',
                        date=list(root.iter('RunStartDate')).pop(0).text if len(
                            list(root.iter('RunStartDate'))) else '',
                        scanner_id=list(root.iter('ScannerID')).pop(0).text if len(
                            list(root.iter('ScannerID'))) else '',
                        scanner_number=list(root.iter('ScannerNumber')).pop(0).text if len(
                            list(root.iter('ScannerNumber'))) else '',
                    ),

                    reads=[r.attrib for r in root.iter('Read')],
                    reagents=dict(
                        sbs=dict(
                            kit=list(root.iter('Sbs')).pop(0).text if len(list(root.iter('Sbs'))) else '',
                            id=list(root.iter('SbsReagentKit')).pop(0).find('ID').text if len(
                                list(root.iter('SbsReagentKit'))) else '',
                        ),
                        index=dict(
                            kit=list(root.iter('Index')).pop(0).text if len(list(root.iter('Index'))) else '',
                            id=list(r.find('ReagentKit').find('ID').text for r in root.iter('Index') if
                                    r.find('ReagentKit') is not None).pop() if len(list(
                                r.find('ReagentKit').find('ID').text for r in root.iter('Index') if
                                r.find('ReagentKit') is not None)) else '',
                        ),
                        pe=dict(
                            kit=list(root.iter('Pe')).pop(0).text if len(list(root.iter('Pe'))) else '',
                            id=list(r.find('ReagentKit').find('ID').text for r in root.iter('Pe') if
                                    r.find('ReagentKit') is not None).pop() if len(list(
                                r.find('ReagentKit').find('ID').text for r in root.iter('Pe') if
                                r.find('ReagentKit') is not None)) else '',
                        ),
                    ),
                )
            return result

        cmd = 'get_run_parameters'
        params.update(dict(this_run=run))
        res = self._ssh_cmd(user=params.get('user'),
                            host=params.get('host'),
                            password=params.get('password'),
                            cmd=self._get_icmd(cmd=cmd, params=params))

        if len(res['result']) == 0:
            cmd = 'get_run_parameters'
            params.update(dict(this_run=os.path.join(run, 'raw')))
            res = self._ssh_cmd(user=params.get('user'),
                                host=params.get('host'),
                                password=params.get('password'),
                                cmd=self._get_icmd(cmd=cmd, params=params))

        self.logger.info(res)
        return _run_parameters_parser(res)

    def __get_metadata(self, irods_obj):

        def retrieve_imetadata(iobj):
                return [dict(name=m.name,
                             value=m.value,
                             units=m.units)
                        for m in iobj.metadata.items()]

        if len(irods_obj.metadata.items()) > 0:
            return retrieve_imetadata(irods_obj)
        else:
            for d in irods_obj.data_objects:
                if "SampleSheet.csv" in d.name and len(d.metadata.items()) > 0:
                    return retrieve_imetadata(d)

    def __get_qc_summary(self, base_url):
        fcid = base_url.split('/')[-1].split('_')[-1][1:]
        if '-' in fcid:
            fcid = base_url.split('/')[-1].split('_')[-1]
        url = os.path.join(base_url, 'Reports', 'html', fcid, 'all', 'all', 'all', 'lane.html')
        try:
            doc = parse(url)
        except Exception as e:
            self.logger.error(e)
            return ''
        reports = list()
        for table in doc.iter('table'):
            report = list()
            if 'id' in table.attrib.keys():
                labels = [t.text_content() for t in table.iter('th')]
                for tr in table.iter('tr'):
                    values = [t.text_content() for t in tr.iter('td')]
                    if values:
                        dictionary = dict(zip(labels, values))
                        report.append(dictionary)
                reports.append(report)

        if len(reports) == 0:
            return dict()

        flowcell_report = reports[0]
        lanes_report = reports[1]

        qc_summary = dict(
            flowcell_report=[
                dict(
                    clusters_raw=f.get('Clusters (Raw)'),
                    clusters_pf=f.get('Clusters(PF)'),
                    yield_mbases=f.get('Yield (MBases)'),
                ) for f in flowcell_report],
            lanes_report=[
                dict(
                    lane=l.get('Lane'),
                    yield_mbases=l.get('Yield (Mbases)'),
                    clusters_pf=l.get('PF Clusters'),
                    clusters_pf_perc=l.get('% PFClusters'),
                    mismatch_barcode=l.get('% One mismatchbarcode'),
                    perfect_barcode=l.get('% Perfectbarcode'),
                    quality_score=l.get('Mean QualityScore'),
                    q30_bases=l.get('% >= Q30bases'),
                    of_thelane=l.get('% of thelane'),
                ) for l in lanes_report],
        )

        return qc_summary

    def _ssh_cmd(self, user, host, password, cmd, switch=False):
        remote = "{}@{}".format(user, host)
        self.logger.info(cmd)
        _= shlex.split("sshpass -p " + password + " ssh -oStrictHostKeyChecking=no " + remote + " " + cmd)

        ssh = subprocess.Popen(args=_,
                               shell=False,
                               stdout=subprocess.PIPE,
                               stderr=subprocess.PIPE)

        result = [line.replace(b'\n', b'') for line in ssh.stdout.readlines()]
        error = ssh.stderr.readlines()

        if switch:
            result, error = error, result

        if error:
            result = dict(success='False', error=error, result=[])
        else:
            result = dict(success='True', error=[], result=result)

        return result

    def _get_icmd(self, cmd, params):

        icmds = dict(

            get_running_folders="ls {}".format(params.get('run_folder')),

            check_runs="docker exec presta presta check",

            get_report_folders="ls {}".format(params.get('report_folder')),

            get_run_info="cat {}".format(os.path.join(params.get('run_folder', ''),
                                                      params.get('this_run', ''),
                                                      params.get('run_info_file', ''))),

            get_run_parameters="cat {}".format(os.path.join(params.get('run_folder', ''),
                                                            params.get('this_run', ''),
                                                            params.get('run_parameters_file', ''))),

            sync_batchbook="presta sync -b {} -a -f --emit_events".format(params.get('batch_id', '0'))

        )
        self.logger.info(cmd + " --> " + icmds.get(cmd))
        return icmds.get(cmd)

    def _pagination(self, data, page_nr, page_size):
        total = len(data)
        if page_nr == 0 and page_size == 0:
            return data, total, total

        first = int(page_nr*page_size) #if int(page_nr) == 0 else int(page_nr*page_size+1)
        last = int(first+page_size) if int(first+page_size) <= int(total) else int(total)
        data = data[first:last]
        return data, total, last

    def __str(self, txt):
        if isinstance(txt, (type(None), int, float)):
            txt = str(txt)
        return txt.encode('latin-1', 'ignore')


