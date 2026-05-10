from db import SessionLocal
from models import Problem

def auto_tag_problems():
    db = SessionLocal()
    problems = db.query(Problem).all()
    
    # The classification engine
    keyword_map = {
        "Arrays & Hashing": ["array", "sum", "duplicate", "anagram", "hash", "product", "consecutive", "matrix"],
        "Linked List": ["linked list", "list node", "cycle", "reverse list", "merge"],
        "Trees": ["tree", "bst", "trie", "forest", "node", "root", "ancestor", "depth"],
        "Dynamic Programming": ["dp", "dynamic programming", "climbing stairs", "house robber", "coin change", "word break", "jump game"],
        "Graphs": ["graph", "island", "course schedule", "network", "path", "clone"],
        "Sliding Window": ["window", "substring", "longest sequence", "character replacement"],
        "Two Pointers": ["two pointer", "container", "trapping rain", "water"],
        "Intervals": ["interval", "merge", "insert"],
        "Binary Search": ["search", "rotated", "median"],
        "Stack": ["stack", "parentheses", "polish notation", "temperature"],
    }
    
    updated_count = 0
    for p in problems:
        title_lower = p.title.lower()
        assigned_topic = "General"
        
        for topic, keywords in keyword_map.items():
            if any(kw in title_lower for kw in keywords):
                assigned_topic = topic
                break
                
        if p.topic != assigned_topic:
            p.topic = assigned_topic
            updated_count += 1
            
    db.commit()
    print(f"Successfully auto-tagged {updated_count} problems!")
    db.close()

if __name__ == "__main__":
    auto_tag_problems()