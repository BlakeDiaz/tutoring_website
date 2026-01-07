import time
from .tasks import procrastinate_app
from app import create_app
import os
from .config import DevelopmentConfig, ProductionConfig

# Get config from environment variable
configs = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
}
env_name = os.environ.get("FLASK_ENV", "development")
config_class = configs.get(env_name, DevelopmentConfig)

app = create_app(config_class())

def start_worker():
    while True:
        try:
            with app.app_context():
                procrastinate_app.run_worker(queues=None)
        except Exception as e:
            print(e)
            time.sleep(5)

if __name__ == "__main__":
    start_worker()