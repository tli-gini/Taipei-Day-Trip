from database import connect_db
import mysql.connector
from datetime import datetime, timedelta

def create_booking(attractionId, date, time, price, email, name):
    conn = connect_db()
    
    try:
        booking_date = datetime.strptime(date, "%Y-%m-%d").date()
        today = datetime.now().date()
        if booking_date < today or booking_date > today + timedelta(days=90):
            return {"error": True, "message": "請選擇三個月內之日期"}

        with conn.cursor() as cur:
            query = """
            INSERT INTO booking (email, name, attractionId, date, time, price) 
            VALUES (%s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE 
            name = VALUES(name), attractionId = VALUES(attractionId), date = VALUES(date), 
            time = VALUES(time), price = VALUES(price);
            """
            values = (email, name, attractionId, date, time, price)
            cur.execute(query, values)
            conn.commit()

            booking_info = {
                "email": email,
                "name": name,
                "attractionId": attractionId,
                "date": date,
                "time": time,
                "price": price
            }
            return booking_info
    except mysql.connector.Error as e:
        print(f"Error creating booking information: {e}")
        return {"error": True, "message": "預定資料發生錯誤"}
    finally:
        if conn.is_connected():
            conn.close()

def get_booking_by_user(email):
    db = connect_db()
    cursor = db.cursor(dictionary=True)
    try:
        query = "SELECT * FROM booking WHERE email = %s"
        cursor.execute(query, (email,))
        result = cursor.fetchone()
        return result
    except mysql.connector.Error as e:
        print(f"Database error: {e}")
        return None
    finally:
        cursor.close()
        db.close()

def delete_booking_by_email(email):
    db = connect_db()
    cursor = db.cursor()
    try:
        query = "DELETE FROM booking WHERE email = %s"
        cursor.execute(query, (email,))
        db.commit()
        return cursor.rowcount > 0  # Returns True if any rows were deleted
    except mysql.connector.Error as e:
        print(f"Database error during booking deletion: {e}")
        return False
    finally:
        cursor.close()
        db.close()
