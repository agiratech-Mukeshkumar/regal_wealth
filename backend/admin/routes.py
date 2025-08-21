from flask import Blueprint

admin_bp = Blueprint('admin_bp', __name__)

# Import all route modules so they get registered
from . import users, advisors, clients, forms, content


