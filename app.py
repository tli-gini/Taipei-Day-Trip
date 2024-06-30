import uvicorn
import json
import jwt
from fastapi import FastAPI, Request, HTTPException,Query,Path,Depends
from fastapi.responses import JSONResponse,FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from passlib.context import CryptContext
from attraction import get_all_attractions, attraction_name, attraction_mrt, get_attraction_id, get_mrt_stats
from user import create_user, check_user, check_signin, get_signin_user_info
from booking import create_booking, get_booking_by_user, delete_booking_by_email
from decimal import Decimal
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os


app=FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


origins = [
    "http://localhost:8000",
    "http://127.0.0.1:8000"
]

load_dotenv()

SECRET_KEY = os.getenv("JWT_KEY")
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserAuth(BaseModel):
    email: str
    password: str

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=7) 
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)  
    raise TypeError(f"Object of type '{type(obj).__name__}' is not JSON serializable")

app.mount("/static", StaticFiles(directory="static"), name="static")

# Static Pages (Never Modify Code in this Block)
@app.get("/", include_in_schema=False)
async def index(request: Request):
	return FileResponse("./static/index.html", media_type="text/html")

@app.get("/attraction/{id}", include_in_schema=False) 
async def attraction(request: Request, id: int):  
	return FileResponse("./static/attraction.html", media_type="text/html")

@app.get("/booking", include_in_schema=False)
async def booking(request: Request):
	return FileResponse("./static/booking.html", media_type="text/html")

# @app.get("/thankyou", include_in_schema=False)
# async def thankyou(request: Request):
# 	return FileResponse("./static/thankyou.html", media_type="text/html")

# User
@app.post("/api/user")
async def user_signup(request: Request):
    user = await request.json()
    name = user.get("name")
    email = user.get("email")
    password = user.get("password")
    
    if not name or not email or not password:
        return JSONResponse(status_code=400, content={"error": True, "message": "請輸入註冊資料"})

    if check_user(email):
        return JSONResponse(status_code=400, content={"error": True, "message": "此電子信箱已被註冊"})

    user = create_user(name, email, password)
    if user:
        return JSONResponse(status_code=200, content={"ok": True,"message": "註冊成功！登入進行下一步"})
    else:
        return JSONResponse(status_code=500, content={"error": True, "message": "伺服器內部錯誤，請確認電子信箱格式"})
    
@app.get("/api/user/auth")
async def get_signin_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get('sub')
        if not email:
            return JSONResponse(status_code=200, content={"data": None})
        
        user_info = get_signin_user_info(email)
        if user_info and user_info['data']:
            return JSONResponse(status_code=200, content=user_info)
        else:
            return JSONResponse(status_code=200, content={"data": None})
    except jwt.PyJWTError:
        return JSONResponse(status_code=400, content={"error": True, "message": "Invalid token or authentication credentials"})

@app.put("/api/user/auth")
async def signin(user: UserAuth):
    email = user.email
    password = user.password

    if not email or not password:
        return JSONResponse(status_code=400, content={"error": True, "message": "請輸入電子信箱和密碼"})

    name, valid = check_signin(email, password)
    if not valid:
        return JSONResponse(status_code=400, content={"error": True, "message": "電子信箱或密碼輸入錯誤"})
    
    try:
        access_token = create_access_token(data={"sub": email, "name": name})
        return JSONResponse(status_code=200, content={"token": access_token})
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        return JSONResponse(status_code=500, content={"error": True, "message": "Internal Server Error"})    

@app.get("/protected-route")
async def protected_route(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=403, detail="Invalid token")
        return {"email": email, "message": "Protected data"}
    except jwt.PyJWTError:
        raise HTTPException(status_code=403, detail="Invalid token")

# Attraction
@app.get("/api/attractions")
async def get_attraction(page: int = Query(0, ge=0), keyword: str = Query(None, alias="keyword")):
    try:
        if keyword:
            attractions = attraction_name(keyword) + attraction_mrt(keyword)
        else:
            attractions = get_all_attractions()  
        
        unique_dicts = {}
        for d in attractions:
            unique_dicts[d['id']] = d

        unique_attractions = list(unique_dicts.values())
        items_per_page = 12
        start_index = page * items_per_page
        end_index = start_index + items_per_page

        page_data = unique_attractions[start_index:end_index]

        if len(unique_attractions) > end_index:
            next_page = page + 1
        else:
            next_page = None 

        if page_data:
            return JSONResponse(content={"nextPage": next_page, "data": page_data}, status_code=200)
        else:
            return JSONResponse(content={"nextPage": next_page, "data": []}, status_code=200)

    except Exception as e:
        print(f"An error occurred: {str(e)}")
        return JSONResponse(content={"error": True, "message": "Internal Server Error"}, status_code=500)

@app.get("/api/attraction/{attractionId}")
async def get_attraction_by_id(attractionId: int = Path(..., description="The ID of the attraction to retrieve")):
    try:
        attraction = get_attraction_id(attractionId)
        if not attraction:
            return JSONResponse(content={"error": True, "message": "Attraction not found"}, status_code=500)
        if 'images' in attraction and attraction['images']:
            attraction['images'] = json.loads(attraction['images'])
        # Serialize using json.dumps to handle Decimals and ensure no unwanted escaping
        response_content = json.dumps({"data": attraction}, default=decimal_default, ensure_ascii=False)
        return JSONResponse(content=json.loads(response_content), status_code=200)
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        return JSONResponse(content={"error": True, "message": "Internal Server Error"}, status_code=500)
    
# MRT 
@app.get("/api/mrts")
async def get_mrts():
    try:
        mrts = get_mrt_stats()
        mrt_names = [mrt['mrt'] for mrt in mrts] 
        return JSONResponse(content={"data": mrt_names}, status_code=200)
    except Exception as e:
        print(f"An error occurred: {str(e)}")  
        return JSONResponse(content={"error": True, "message": "伺服器內部錯誤，請再試一次"}, status_code=500)

# Booking
@app.get("/api/booking")
async def get_booking(request: Request):
    token = request.headers.get('Authorization', '').split(" ")[1] if request.headers.get('Authorization', '').startswith("Bearer ") else None
    if not token:
        return JSONResponse(status_code=403, content={"error": True, "message": "請登入再進行預訂"})

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get('sub')
        if not email:
            return JSONResponse(status_code=403, content={"error": True, "message": "請登入再進行預訂"})

        booking = get_booking_by_user(email)
        if not booking:
            return JSONResponse(status_code=400, content={"error": True, "message": "找不到預訂資訊"})

        attraction = get_attraction_id(booking['attractionId'])
        if not attraction:
            return JSONResponse(status_code=400, content={"error": True, "message": "找不到相關景點資訊"})

        image_url = json.loads(attraction['images'])[0] if 'images' in attraction and attraction['images'] else None

        booking_info = {
            "attraction": {
                "id": attraction['id'],
                "name": attraction['name'],
                "address": attraction['address'],
                "image": image_url
            },
            "date": booking['date'].strftime("%Y-%m-%d"),
            "time": booking['time'],
            "price": booking['price']
        }
        return JSONResponse(status_code=200, content={"data": booking_info})

    except jwt.PyJWTError as e:
        return JSONResponse(status_code=403, content={"error": True, "message": "連線逾時，請再次登入"})
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        return JSONResponse(status_code=500, content={"error": True, "message": "伺服器內部錯誤，請再試一次"})

@app.post("/api/booking")
async def get_booking_info(request: Request):
    token = request.headers.get('Authorization', '').split(" ")[1] if request.headers.get('Authorization', '').startswith("Bearer ") else None
    if not token:
        return JSONResponse(status_code=403, content={"error": True, "message": "請登入再進行預訂"})

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get('sub')
        if not email:
            return JSONResponse(status_code=403, content={"error": True, "message": "請登入再進行預訂"})

        # Fetch user info using email
        user_info = get_signin_user_info(email)
        if not user_info['data']:
            return JSONResponse(status_code=404, content={"error": True, "message": "請登入再進行預訂"})

        booking_data = await request.json()
        attractionId = booking_data.get("attractionId")
        date = booking_data.get("date")
        time = booking_data.get("time")
        price = booking_data.get("price")

        if not date or not time:
            return JSONResponse(status_code=400, content={"error": True, "message": "請選擇日期與時間以進行預訂"})
        
        result = create_booking(attractionId, date, time, price, user_info['data']['email'], user_info['data']['name'])
        
        if result and result.get("error"):
            return JSONResponse(status_code=400, content={"error": True, "message": result.get("message", "預定系統錯誤，請再試一次")})

        return JSONResponse(status_code=200, content={"ok": True})
    except jwt.PyJWTError as e:
        return JSONResponse(status_code=403, content={"error": True, "message": "連線逾時，請再次登入"})
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        return JSONResponse(status_code=500, content={"error": True, "message": "伺服器內部錯誤，請再試一次"})

@app.delete("/api/booking")
async def delete_booking(request: Request):
    token = request.headers.get('Authorization', '').split(" ")[1] if request.headers.get('Authorization', '').startswith("Bearer ") else None
    if not token:
        return JSONResponse(status_code=403, content={"error": True, "message": "請登入以繼續"})

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get('sub')
        if not email:
            return JSONResponse(status_code=403, content={"error": True, "message": "請登入以繼續"})

        if delete_booking_by_email(email):
            return JSONResponse(status_code=200, content={"ok": True})
        else:
            return JSONResponse(status_code=400, content={"error": True, "message": "無此預訂資料"})
    
    except jwt.PyJWTError:
        return JSONResponse(status_code=403, content={"error": True, "message": "連線逾時，請再次登入"})
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        return JSONResponse(status_code=500, content={"error": True, "message": "伺服器內部錯誤，請再試一次"})

if __name__ == '__main__':
    uvicorn.run(app, host="localhost", port=8000)