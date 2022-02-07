import json


class BikaEncoder(json.JSONEncoder):
    def default(self, obj):

        if isinstance(obj, (bytes, bytearray)): return obj.decode("latin1")
        if isinstance(obj, dict):
            _obj = {
                key.decode('latin1') if isinstance(key, (bytes, bytearray)) else key:
                val.decode('latin1') if isinstance(val, (bytes, bytearray)) else val
                for key, val in obj.items()
            }
            return _obj

        if isinstance(obj, tuple):  return map(default, obj)

        return json.JSONEncoder.default(self, obj)

