import json
from flask import jsonify, request
from auth.decorators import advisor_required
from .routes import advisor_bp
from advisor.tax_calculator import calculate_2025_federal_tax
from utils.db import get_db_connection


@advisor_bp.route('/tools/income-tax', methods=['POST'])
@advisor_required
def income_tax_tool(current_user):
    """
    Receives financial data and returns a detailed tax analysis.
    """
    data = request.get_json()
    if not data:
        return jsonify({"message": "Request body is missing"}), 400

    # Extract data from request body, with defaults
    gross_income = float(data.get('gross_income', 0))
    deductions = float(data.get('deductions', 0)) # Sum of all deductions
    credits = float(data.get('credits', 0))
    filing_status = data.get('filing_status', 'married_jointly')

    # 1. Calculate Taxable Income
    taxable_income = gross_income - deductions
    if taxable_income < 0:
        taxable_income = 0

    # 2. Calculate Tax Owed Before Credits
    tax_before_credits = calculate_2025_federal_tax(taxable_income, filing_status)

    # 3. Apply Credits
    final_tax_owed = tax_before_credits - credits
    if final_tax_owed < 0:
        final_tax_owed = 0
    
    # 4. Calculate Rates
    effective_tax_rate = (final_tax_owed / gross_income) * 100 if gross_income > 0 else 0
    # A full marginal rate calculation would check which bracket the taxable_income falls into
    marginal_tax_rate = 22.0 # Hardcoded for the example from Figma

    # 5. Assemble and return the response
    response_data = {
        "inputs": data,
        "results": {
            "gross_income": gross_income,
            "total_deductions": deductions,
            "taxable_income": taxable_income,
            "tax_before_credits": tax_before_credits,
            "tax_credits": credits,
            "final_tax_owed": final_tax_owed,
            "effective_tax_rate_percent": round(effective_tax_rate, 2),
            "marginal_tax_rate_percent": marginal_tax_rate
        }
    }

    return jsonify(response_data), 200

@advisor_bp.route('/clients/<int:client_id>/plans', methods=['POST'])
@advisor_required
def create_financial_plan(current_user, client_id):
    """
    Saves the results of a tool calculation as a financial plan for a client.
    """
    advisor_id = current_user['user_id']
    data = request.get_json()

    if not data or not data.get('plan_name') or not data.get('plan_data_json'):
        return jsonify({"message": "plan_name and plan_data_json are required"}), 400

    plan_name = data.get('plan_name')
    # The data from the calculator is already a dictionary, we'll store it as a JSON string
    plan_data_json = json.dumps(data.get('plan_data_json'))

    conn = get_db_connection()
    if not conn:
        return jsonify({"message": "Database connection error"}), 500
    
    cursor = conn.cursor()
    try:
        # Verify the client is assigned to this advisor first
        cursor.execute(
            "SELECT client_user_id FROM advisor_client_map WHERE advisor_user_id = %s AND client_user_id = %s",
            (advisor_id, client_id)
        )
        if not cursor.fetchone():
            return jsonify({"message": "You are not authorized to create a plan for this client"}), 403

        # Insert the new financial plan
        sql = """
            INSERT INTO financial_plans (client_user_id, advisor_user_id, plan_name, plan_data_json, status)
            VALUES (%s, %s, %s, %s, 'Draft')
        """
        cursor.execute(sql, (client_id, advisor_id, plan_name, plan_data_json))
        conn.commit()
        
        plan_id = cursor.lastrowid

        return jsonify({
            "message": "Financial plan created successfully",
            "plan_id": plan_id
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"message": f"An error occurred: {e}"}), 500
    finally:
        cursor.close()
        conn.close()
