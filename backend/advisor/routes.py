from flask import Blueprint

advisor_bp = Blueprint('advisor_bp', __name__)

# Import all route modules so they register with advisor_bp
from . import dashboard

