import json
from db import SessionLocal
from models import Problem

def seed_database():
    db = SessionLocal()
    
    # Check if we already seeded the database to prevent duplicates
    if db.query(Problem).first():
        print("Database is already seeded!")
        db.close()
        return

    print("Seeding problems into the database...")
    with open("problems.json", "r") as file:
        problems_data = json.load(file)
        
        for p in problems_data:
            new_problem = Problem(
                title=p["title"],
                difficulty=p["difficulty"],
                url=p["url"],
                sheet_name=p["sheet_name"]
            )
            db.add(new_problem)
            
        db.commit()
        print(f"Successfully seeded {len(problems_data)} problems!")
        
    db.close()

if __name__ == "__main__":
    seed_database()