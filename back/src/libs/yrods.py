import os

from comoda import ensure_dir

from irods.session import iRODSSession
from irods.collection import iRODSCollection
from irods.data_object import iRODSDataObject
from irods.exception import DataObjectDoesNotExist
from irods.exception import CollectionDoesNotExist


class IrodsObjectStore(object):
    """
    Here objects mean iRODS data_objects and iRODS collections
    """

    def __init__(self, host=None, port=1247, user=None, password=None,
                 zone=None, logger=None):
        self.host = host
        self.port = port
        self.user = user
        self.password = password
        self.zone = zone
        self.home = os.path.join('/', self.zone, 'home', self.user)
        self.logger = logger

    def exists(self, path, delivery=False):
        session = iRODSSession(host=self.host, port=self.port, user=self.user, password=self.password, zone=self.zone)
        session.connection_timeout = 300
        try:
            obj = session.data_objects.get(path)
            self.logger.info("Getting: {}".format(str(obj.name)))
            exists = True
        except DataObjectDoesNotExist as e:
            self.logger.error(str(e))
            exists = False
            obj = None

        if not obj:
            try:
                obj = session.collections.get(path)
                self.logger.info("Getting: {}".format(str(obj.name)))
                exists = True
            except CollectionDoesNotExist as e:
                self.logger.error(str(e))
                exists = False
                obj = None
        session.cleanup()
        return (exists, obj)

    def is_a_collection(self, obj_path):
        ret = self.exists(obj_path, delivery=True)
        obj = ret[1]
        return True if isinstance(obj, iRODSCollection) else False

    def is_a_data_object(self, obj_path):
        ret = self.exists(obj_path, delivery=True)
        obj = ret[1]
        return True if isinstance(obj, iRODSDataObject) else False

    def create_object(self, dest_path, collection=True):
        """
        Creates a new object into the dest_path. Default is a collection

        :type dest_path: str
        :param dest_path: irods path

        :type collection: bool
        :param collection: if True create a collection else a data_object

        :return: an irods.data_object.iRODSDataObject,
        irods.collection.iRODSCollection
        """

        session = iRODSSession(host=self.host, port=self.port, user=self.user, password=self.password, zone=self.zone)
        session.connection_timeout = 300

        if not self.exists(dest_path)[0]:
            if collection:
                obj = session.collections.create(dest_path)
            else:
                obj = session.data_objects.create(dest_path)
        else:
            raise RuntimeError("Collection already present into the catalog")

        session.cleanup()
        return obj

    def get_object(self, src_path, dest_path=None, prefix='irods://'):
        """
        Retrieves an object from an existing path.
        If dest_path is set, data will be copied from iRODS to the filesystem.

        :type src_path: str
        :param src_path: irods path

        :param dest_path: str
        :param dest_path: destination path

        :type prefix: str
        :param prefix: path's prefix (if any)

        :return: an irods.data_object.iRODSDataObject,
        irods.collection.iRODSCollection or None
        """

        if src_path.startswith(prefix):
            src_path = os.path.join(src_path.replace(prefix, '/'))
        ret = self.exists(src_path, delivery=True)
        exists = ret[0]
        obj = ret[1]
        if exists and dest_path:
            ensure_dir(os.path.dirname(dest_path))
            with open(dest_path, 'w') as df:
                    with obj.open('r') as sf:
                        for line in sf:
                            df.write(line.decode())

        return obj

    def put_object(self, source_path, dest_path=None, force=False):
        """
        Reads from source_path and puts into the dest_path.
        If dest_path is not set, will be used the same value of source_path
        down to the iRODS user home.
        Mimics the same behaviour of iput: don't overwrite without the force
        flag raised.

        :type source_path: str
        :param source_path: source path

        :type dest_path: str
        :param dest_path: destination path

        :type force: bool
        :param force: force the put execution

        :return: nothing
        """

        session = iRODSSession(host=self.host, port=self.port, user=self.user, password=self.password, zone=self.zone)
        session.connection_timeout = 300

        if not dest_path:
            dest_path = os.path.join(self.home, source_path.strip('/'))
        new_object = False

        if os.path.isfile(source_path):
            if self.exists(dest_path)[0]:
                obj = session.data_objects.get(dest_path)
            else:
                obj = self.create_object(dest_path, collection=False)
                new_object = True

            if not(new_object or force):
                raise ValueError('Overwrite without force flag: {}'.format(obj.path))
            else:
                with obj.open('r+') as d:
                    with open(source_path, 'r') as s:
                        for line in s:
                            d.write(line.encode())
        else:
            self.logger.warning('Something wrong here. I received a path that is '
                                'not a regular file - {}'.format(dest_path))

        session.cleanup()

    def remove_object(self, obj_path, recurse=False, force=False):
        """

        :type obj_path: str
        :param obj_path: iRODS path

        :type recurse: bool
        :param recurse: delete everything under the path

        :type force: bool
        :param force: force remove execution

        :return: False if object is missing
        """

        session = iRODSSession(host=self.host, port=self.port, user=self.user, password=self.password, zone=self.zone)
        session.connection_timeout = 300

        if self.is_a_data_object(obj_path):
            session.data_objects.unlink(obj_path, force=force)
        elif self.is_a_collection(obj_path):
            session.collections.remove(obj_path, recurse=recurse, force=force)
        else:
            self.logger.error("Object missing")
            session.cleanup()
            return False
        session.cleanup()
        return True

    def add_object_metadata(self, path, meta):
        """
        adds an AVU tuple to the path

        :type path: str
        :param path: destination path in iRODS zone

        :type meta: tuple
        :param meta: a tuple of strings with at least the first two elements (
        attribute and value). If missing, units are set to None

        :return: nothing
        """

        assert (len(meta) >= 2), "Missing element in the metadata tuple {}".format(meta)

        obj = self.get_object(path)
        obj_metadata = []
        for i in obj.metadata.items():
            obj_metadata.append({'name': i.name,
                                 'value': i.value,
                                 'units': i.units})
        if len(meta) == 2:
            meta = meta + (None,)
        avu = {'name': meta[0] if type(meta[0]) == str else str(meta[0]),
               'value': meta[1] if type(meta[1]) == str else str(meta[1]),
               'units': meta[2] if type(meta[2]) == str else str(meta[2])}

        if avu in obj_metadata:
            self.logger.info("AVU {} already present into the catalog".format(avu))
        else:
            obj.metadata.add(avu['name'], avu['value'], avu['units'])
