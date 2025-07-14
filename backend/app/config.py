from configparser import ConfigParser
import os

dirname = os.path.dirname(__file__)
config = ConfigParser()
config.read(os.path.join(dirname, "../config.ini"))
