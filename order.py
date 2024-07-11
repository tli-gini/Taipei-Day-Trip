from database import connect_db
import mysql.connector
import random
import string

def save_order_info(prime, price, attraction_id, attraction_name, attraction_address, attraction_image, trip_date, trip_time, contact_name, contact_email, contact_phone):
    conn = connect_db()

    try:
        with conn.cursor() as cur:
            query = """
                INSERT INTO orders (prime, price, attraction_id, attraction_name, attraction_address, attraction_image, trip_date, trip_time, contact_name, contact_email, contact_phone)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            values = (prime, price, attraction_id, attraction_name, attraction_address, attraction_image, trip_date, trip_time, contact_name, contact_email, contact_phone)
            cur.execute(query, values)
            conn.commit()
            order_id = cur.lastrowid

            order_info = {
                "ordersId": order_id,
                "prime": prime,
                "price": price,
                "attraction_id": attraction_id,
                "attraction_name": attraction_name,
                "attraction_address": attraction_address,
                "attraction_image": attraction_image,
                "trip_date": trip_date,
                "trip_time": trip_time,
                "contact_name": contact_name,
                "contact_email": contact_email,
                "contact_phone": contact_phone,
                "payment_status": "UNPAID"
            }
            return order_info
    except mysql.connector.Error as e:
        print(f"Error: {e}")
        return None
    finally:
        if conn.is_connected():
            conn.close()

def save_payment_info(order_id, order_number, status, message):
    conn = connect_db()

    try:
        with conn.cursor() as cur:
            query = "INSERT INTO payment (order_id, order_number, status, message) VALUES (%s, %s, %s, %s)"
            values = (order_id, order_number, status, message)
            cur.execute(query, values)
            conn.commit()
    except mysql.connector.Error as e:
        print(f"Error: {e}")
    finally:
        if conn.is_connected():
            conn.close()

def generate_order_number(trip_date, attraction_id):
    date_part = trip_date.replace('-', '')
    random_part = ''.join(random.sample(string.ascii_uppercase + string.digits, k=6))
    return f"{date_part}{attraction_id}{random_part}"


def save_payment_info(order_id, order_number, status, message):
    conn = connect_db()

    try:
        with conn.cursor() as cur:
            query = "INSERT INTO payment (order_id, order_number, status, message) VALUES (%s, %s, %s, %s)"
            values = (order_id, order_number, status, message)
            cur.execute(query, values)

            # Update payment_status
            payment_status = 'PAID' if status == 0 else 'UNPAID'
            update_query = "UPDATE orders SET payment_status = %s WHERE ordersId = %s"
            update_values = (payment_status, order_id)
            cur.execute(update_query, update_values)

            if payment_status == 'PAID':
                select_email_query = "SELECT contact_email FROM orders WHERE ordersId = %s"
                cur.execute(select_email_query, (order_id,))
                contact_email = cur.fetchone()[0]

                # Delete booking with the same email
                delete_booking_query = "DELETE FROM booking WHERE email = %s"
                cur.execute(delete_booking_query, (contact_email,))

            conn.commit()
    except mysql.connector.Error as e:
        print(f"Error: {e}")
    finally:
        if conn.is_connected():
            conn.close()
