from flask import Flask

from auth.routes import auth_bp

from flask_cors import CORS
from config import Config # Import the full Config object


# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config) # Load config from the object

CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})


# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')


@app.route('/')
def index():
    return "Regal Wealth Advisors API is running."

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)