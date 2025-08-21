from flask import request, jsonify
from utils.db import get_db_connection
from auth.decorators import admin_required
from .routes import admin_bp
import json

@admin_bp.route('/forms/<form_name>', methods=['GET'])
@admin_required
def get_form_fields(form_name):
    """
    Fetches all fields and their options for a form, organizing them into a
    hierarchical structure.
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Step 1: Fetch all fields for the form
        field_sql = """
            SELECT id, field_label, field_type, is_active, parent_field_id, field_order
            FROM form_fields 
            WHERE form_name = %s
            ORDER BY field_order ASC
        """
        cursor.execute(field_sql, (form_name,))
        all_fields = cursor.fetchall()

        if not all_fields:
            return jsonify([]), 200

        field_ids = [field['id'] for field in all_fields]

        # Step 2: Fetch all options for those fields
        option_sql = """
            SELECT id, field_id, option_label, option_value, linked_group_id
            FROM form_options
            WHERE field_id IN ({})
            ORDER BY option_order ASC
        """.format(','.join(['%s'] * len(field_ids)))
        cursor.execute(option_sql, tuple(field_ids))
        all_options = cursor.fetchall()

        # Step 3: Attach options to their parent fields
        for field in all_fields:
            field['options'] = [opt for opt in all_options if opt['field_id'] == field['id']]
            field['sub_fields'] = [] # Initialize sub_fields for hierarchy building

        # Step 4: Build the hierarchy
        fields_map = {field['id']: field for field in all_fields}
        structured_fields = []

        for field in all_fields:
            if field['parent_field_id'] is None:
                structured_fields.append(field)
            else:
                parent_id = field['parent_field_id']
                if parent_id in fields_map:
                    fields_map[parent_id]['sub_fields'].append(field)

        return jsonify(structured_fields), 200
        
    except Exception as e:
        return jsonify({"message": f"An error occurred: {e}"}), 500
    finally:
        cursor.close()
        conn.close()

# This function is now simpler, as options are handled separately
@admin_bp.route('/forms/<form_name>/fields', methods=['POST'])
@admin_required
def create_form_field(form_name):
    data = request.get_json()
    field_label = data.get('field_label')
    field_type = data.get('field_type')
    parent_field_id = data.get('parent_field_id')

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        sql = """
            INSERT INTO form_fields (form_name, field_label, field_type, parent_field_id)
            VALUES (%s, %s, %s, %s)
        """
        cursor.execute(sql, (form_name, field_label, field_type, parent_field_id))
        conn.commit()
        return jsonify({"message": "Form field created successfully", "field_id": cursor.lastrowid}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"message": f"An error occurred: {e}"}), 500
    finally:
        cursor.close()
        conn.close()

# **NEW ROUTE: Add an option to a field**
@admin_bp.route('/forms/fields/<int:field_id>/options', methods=['POST'])
@admin_required
def create_form_option(field_id):
    data = request.get_json()
    option_label = data.get('option_label', 'New Option')
    option_value = data.get('option_value', option_label.lower().replace(' ', '_'))
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        sql = "INSERT INTO form_options (field_id, option_label, option_value) VALUES (%s, %s, %s)"
        cursor.execute(sql, (field_id, option_label, option_value))
        conn.commit()
        return jsonify({"message": "Option added successfully", "option_id": cursor.lastrowid}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"message": f"An error occurred: {e}"}), 500
    finally:
        cursor.close()
        conn.close()

# **NEW ROUTE: Update a specific option**
# In backend/admin/forms.py
import json # Make sure json is imported at the top of the file

# ... (rest of your imports and routes) ...

@admin_bp.route('/forms/options/<int:option_id>', methods=['PUT'])
@admin_required
def update_form_option(option_id):
    """
    Dynamically updates properties of a form option based on the provided data.
    """
    data = request.get_json()
    if not data:
        return jsonify({"message": "No data provided in request."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        update_parts = []
        values = []

        # Check which fields were sent by the frontend and add them to the query
        if 'option_label' in data:
            update_parts.append("option_label = %s")
            values.append(data.get('option_label'))
        
        if 'details_field_label' in data:
            update_parts.append("details_field_label = %s")
            values.append(data.get('details_field_label'))

        if not update_parts:
            return jsonify({"message": "No valid fields to update."}), 400

        # Build the final SQL query dynamically
        sql = f"UPDATE form_options SET {', '.join(update_parts)} WHERE id = %s"
        values.append(option_id)
        
        cursor.execute(sql, tuple(values))
        conn.commit()
        
        return jsonify({"message": "Option updated successfully"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"message": f"An error occurred: {e}"}), 500
    finally:
        cursor.close()
        conn.close()
# **NEW ROUTE: Delete a specific option**
@admin_bp.route('/forms/options/<int:option_id>', methods=['DELETE'])
@admin_required
def delete_form_option(option_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM form_options WHERE id = %s", (option_id,))
        conn.commit()
        return jsonify({"message": "Option deleted successfully"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"message": f"An error occurred: {e}"}), 500
    finally:
        cursor.close()
        conn.close()

@admin_bp.route('/forms/fields/<int:field_id>', methods=['PUT'])
@admin_required
def update_form_field(field_id):
    """ Updates an existing form field's properties. """
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        update_parts = []
        values = []
        for key in ['field_label', 'field_type', 'options_json', 'is_active', 'field_order']:
            if key in data:
                update_parts.append(f"{key} = %s")
                values.append(data[key])
        
        if not update_parts:
            return jsonify({"message": "No updateable fields provided"}), 400

        values.append(field_id)
        sql = f"UPDATE form_fields SET {', '.join(update_parts)} WHERE id = %s"
        cursor.execute(sql, tuple(values))
        conn.commit()
        return jsonify({"message": "Field updated successfully"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"message": f"An error occurred: {e}"}), 500
    finally:
        cursor.close()
        conn.close()

@admin_bp.route('/forms/fields/<int:field_id>', methods=['DELETE'])
@admin_required
def delete_form_field(field_id):
    """ Deletes a form field. Cascade delete will handle children. """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM form_fields WHERE id = %s", (field_id,))
        conn.commit()
        if cursor.rowcount == 0:
            return jsonify({"message": "Field not found"}), 404
        return jsonify({"message": "Field deleted successfully"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"message": f"An error occurred: {e}"}), 500
    finally:
        cursor.close()
        conn.close()