import json
import mysql.connector
import re
from database import connect_db
from decimal import Decimal

def insert_attraction(cursor, data):
    check_sql = "SELECT COUNT(*) FROM information WHERE name = %s AND address = %s"
    cursor.execute(check_sql, (data[0], data[3]))
    if cursor.fetchone()[0] == 0: 
        insert_sql = """
        INSERT INTO information (name, category, description, address, transport, mrt, lat, lng, images)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(insert_sql, data)
    else:
        print("Record already exists for:", data[0])

def main():
    with open('./data/taipei-attractions.json', 'r', encoding='utf-8') as file:
        data = json.load(file)
        attractions_info = data["result"]["results"]
        
        db = connect_db()
        cursor = db.cursor()
        
        try:
            for attraction in attractions_info:
                name = attraction["name"]
                category = attraction["CAT"]
                description = attraction["description"]
                address = attraction["address"]
                transport = attraction["direction"]
                mrt = attraction["MRT"]
                lat = float(attraction["latitude"]) if attraction["latitude"] else None
                lng = float(attraction["longitude"]) if attraction["longitude"] else None
                img_urls = attraction["file"]
                normalized_img_urls = re.findall(r'https://[^\s]+?(?:\.jpg|\.JPG|\.png|\.PNG)', img_urls)
                images_json = json.dumps(normalized_img_urls)
                print(images_json)

                insert_attraction(cursor, (name, category, description, address, transport, mrt, lat, lng, images_json))

            db.commit()
        except mysql.connector.Error as err:
            print("Error: ", err)
            db.rollback()
        finally:
            cursor.close()
            db.close()

if __name__ == "__main__":
    main()

def get_all_attractions():
    db = connect_db()
    cursor = db.cursor(dictionary=True)  
    try:
        query = "SELECT * FROM information"
        cursor.execute(query)
        results = cursor.fetchall()
        
        for result in results:
            if result['images']:
                result['images'] = json.loads(result['images'])

            result['lat'] = str(result['lat']) if isinstance(result['lat'], Decimal) else result['lat']
            result['lng'] = str(result['lng']) if isinstance(result['lng'], Decimal) else result['lng']
        
        return results
    except mysql.connector.Error as e:
        print(f"Error querying database: {e}")
        return None
    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()


def attraction_name(name):
    db = connect_db()
    cursor = db.cursor(dictionary=True)  
    try:
        query = "SELECT * FROM information WHERE name LIKE %s"
        search_term = f"%{name}%"
        cursor.execute(query, (search_term,))
        results = cursor.fetchall()
        
        # Decode JSON string to Python list right after fetching
        for result in results:
            if result['images']:
                result['images'] = json.loads(result['images'])

            # Convert Decimal types for JSON serialization, if necessary
            result['lat'] = str(result['lat']) if isinstance(result['lat'], Decimal) else result['lat']
            result['lng'] = str(result['lng']) if isinstance(result['lng'], Decimal) else result['lng']
        
        return results
    except mysql.connector.Error as e:
        print(f"Error querying database: {e}")
        return None
    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()

def attraction_mrt(mrt):
    db = connect_db()
    cursor = db.cursor(dictionary=True)  
    try:
        query = "SELECT * FROM information WHERE mrt = %s"
        cursor.execute(query, (mrt,)) 

        results = cursor.fetchall()
        
        for result in results:
             if 'images' in result and result['images']:
                result['images'] = json.loads(result['images'])  # Decode JSON string to list

             if isinstance(result.get('lat'), Decimal):
                result['lat'] = str(result['lat'])
             if isinstance(result.get('lng'), Decimal):
                result['lng'] = str(result['lng'])

        
        return results
    except mysql.connector.Error as e:
        print(f"Error querying database: {e}")
        return None
    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()

def get_attraction_id(id):
    db = connect_db()
    cursor = db.cursor(dictionary=True)
    try:
        query = "SELECT * FROM information WHERE id = %s"
        cursor.execute(query, (id,))
        result = cursor.fetchone() 
        return result
    except mysql.connector.Error as e:
        print(f"Database error: {e}")
        return None
    finally:
        cursor.close()
        db.close()

def get_mrt_stats():
    db = connect_db()
    cursor = db.cursor(dictionary=True)
    try:
        query = """
        SELECT mrt, COUNT(*) as attraction_count
        FROM information
        WHERE mrt IS NOT NULL
        GROUP BY mrt
        ORDER BY attraction_count DESC
        """
        cursor.execute(query)
        results = cursor.fetchall()
        return results
    except mysql.connector.Error as e:
        print(f"Database error: {e}")
        return []
    finally:
        cursor.close()
        db.close()

