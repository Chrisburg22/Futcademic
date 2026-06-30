import openpyxl
import json
import os

wb = openpyxl.load_workbook('/Users/christianalejandroramosperez/Documents/Personal/Futcamedic/Sheet1-WPS Office.xlsx')

data = {
    "school_name": "M.R Master Fut",
    "admin": {
        "email": "mariana251722@gmail.com",
        "password": "mariana12345678"
    },
    "categories": []
}

def parse_range(sheet_name, cat_name, start_row, end_row, tournament_name, birth_year):
    ws = wb[sheet_name]
    students = []
    for row in ws.iter_rows(min_row=start_row, max_row=end_row, max_col=10, values_only=True):
        name = row[1]
        if name and str(name).strip():
            student = {
                "name": str(name).strip(),
                "birth_date": str(row[2]) if row[2] else None,
                "payments": []
            }
            # Monthly payments
            months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo"]
            for i, month in enumerate(months):
                val = row[4+i]
                if isinstance(val, (int, float)):
                    student["payments"].append({"month": i+1, "amount": float(val), "type": "mensualidad"})
            
            # Tournament payment
            t_val = row[9]
            if t_val:
                if isinstance(t_val, (int, float)):
                    student["payments"].append({"name": tournament_name, "amount": float(t_val), "type": "torneo"})
                elif isinstance(t_val, str) and "pagado" in t_val.lower():
                    # If we don't have an amount, maybe record as a flag or skip? 
                    # User wants to import them. If it's a string, we might not have the amount.
                    # I'll default to 0 or something if it says 'pagado'?
                    student["payments"].append({"name": tournament_name, "amount": 0.0, "type": "torneo", "note": t_val})
            
            students.append(student)
    
    data["categories"].append({
        "name": cat_name,
        "birth_year": birth_year,
        "students": students
    })

# Sheet1
parse_range('Sheet1', '20-21-22', 2, 31, 'CORDICA', 2021)
parse_range('Sheet1', '18-19', 41, 73, 'GALLOS', 2019)

# Sheet2
parse_range('Sheet2', '2016-2017', 2, 41, 'GALLOS', 2017)
parse_range('Sheet2', '2014-2015 A', 51, 78, 'CORDICA', 2015)
parse_range('Sheet2', '2014-2015 B', 85, 111, 'GALLOS', 2015)

# Sheet3
parse_range('Sheet3', '2018-2019', 2, 18, 'NONE', 2019)
parse_range('Sheet3', '2016-2017', 23, 33, 'AREDAV', 2017)
parse_range('Sheet3', '2014-2015', 39, 57, 'SOLI', 2015)
parse_range('Sheet3', '2012-2013', 63, 82, 'CÓRDICA', 2013)
parse_range('Sheet3', '2010-2011', 88, 99, 'SOLI', 2011)

# Hoja1
parse_range('Hoja1', '2012-2013 A', 2, 19, 'GALLOS', 2013)
parse_range('Hoja1', '2012-2013 B', 30, 50, 'GALLOS', 2013)

with open('academy_data.json', 'w') as f:
    json.dump(data, f, indent=2)

print("Extraction complete. Data saved to academy_data.json")
