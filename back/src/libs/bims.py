from bikaclient import BikaClient as bika


class Bims(object):
    def __init__(self, host, user, password, logger):
        self.logger = logger
        self.bims = bika(host=host, username=user, password=password)

        if self.is_authenticated():
            self.logger.info("Connected to {} (client version: {}".format(host, self.bims.version))
        else:
            self.logger.error("FAILED connection to {} (client version: {}".format(host, self.bims.version))

    def is_authenticated(self):
        return self.bims.is_authenticated()

    def is_error(self):
        return self.bims.is_error()

    def get_error(self):
        return self.bims.get_error_msg()


