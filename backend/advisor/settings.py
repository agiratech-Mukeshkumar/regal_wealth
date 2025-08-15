from flask import jsonify, request
from utils.db import get_db_connection
from auth.decorators import advisor_required
from werkzeug.security import check_password_hash, generate_password_hash
from .routes import advisor_bp


@advisor_bp.route('/settings/security', methods=['PUT'])
@advisor_required
def update_advisor_security_settings(current_user):
    """
    Updates the logged-in advisor's password or 2FA setting.
    """
    advisor_id = current_user['user_id']
    data = request.get_json()
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # --- Handle Password Change ---
        if 'current_password' in data and 'new_password' in data:
            cursor.execute("SELECT password_hash FROM users WHERE id = %s", (advisor_id,))
            user = cursor.fetchone()
            
            if not user or not check_password_hash(user['password_hash'], data['current_password']):
                return jsonify({"message": "Current password is incorrect"}), 403
            
            new_hashed_password = generate_password_hash(data['new_password'])
            cursor.execute("UPDATE users SET password_hash = %s WHERE id = %s", (new_hashed_password, advisor_id))
        
        # --- Handle 2FA Toggle ---
        if 'is_2fa_enabled' in data:
            is_2fa_enabled = bool(data['is_2fa_enabled'])
            cursor.execute("UPDATE users SET is_2fa_enabled = %s WHERE id = %s", (is_2fa_enabled, advisor_id))

        conn.commit()
        return jsonify({"message": "Settings updated successfully"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"message": f"An error occurred: {e}"}), 500
    finally:
        cursor.close()
        conn.close()

