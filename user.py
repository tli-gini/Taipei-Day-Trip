from database import connect_db
import mysql.connector
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

hashed_password = hash_password("plaintext_password")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# for @app.post("/api/user")
def create_user(name, email, password):
    conn = connect_db()
    hashed_password = hash_password(password)  
    try:
        with conn.cursor() as cur:
            query = "INSERT INTO member (name, email, password) VALUES (%s, %s, %s)"
            values = (name, email, hashed_password)  
            cur.execute(query, values)
            conn.commit()  
            user_obj = {
                "name": name,
                "email": email
            }
            return user_obj 
    except mysql.connector.Error as e:
        print(f"Error creating user: {e}")
        return None  
    finally:
        conn.close()

def check_user(email):
    conn = connect_db()
    try:
        with conn.cursor() as cur:
            query = "SELECT * FROM member WHERE email = %s"
            cur.execute(query, (email,))
            user = cur.fetchall() 
            return user
    except mysql.connector.Error as e:
        print(f"Error fetching user: {e}")
        user = None  
    finally:
        conn.close()  

    return user

# for @app.get("/api/user/auth")
def get_signin_user_info(email):
    conn=connect_db()
    try:
        with conn.cursor() as cur:
            query="SELECT id, name, email FROM member WHERE email = %s"
            cur.execute(query, (email,))
            user_info = cur.fetchone()
            if user_info:
              response = {
                "data": {
                    "id": user_info[0],
                    "name": user_info[1],
                    "email": user_info[2]
                }
            }
            else:
              response = {
                "data": None
            }
              
            return response
            
    except mysql.connector.Error as e:
        print(f"Error fetching member data: {e}")
        return {"data": None}  
    finally:
        if 'conn' in locals() and conn.is_connected():
            cur.close()
            conn.close()  

# for @app.put("/api/user/auth")
def check_signin(email: str, password: str):
    conn = connect_db()
    try:
        with conn.cursor(dictionary=True) as cur:
            query = "SELECT password, name FROM member WHERE email = %s"
            cur.execute(query, (email,))
            result = cur.fetchone()
            if result:
                stored_hash = result['password']
                name = result['name']
                if verify_password(password, stored_hash):
                    return name, True
                else:
                    print("Password does not match")
                    return "", False
            else:
                print("Email not found")
                return "", False
    except mysql.connector.Error as e:
        print(f"Database error: {e}")
        return "", False
    finally:
        conn.close()
