from fastapi import FastAPI, Request, HTTPException,Query,Path
from fastapi.responses import JSONResponse,FileResponse
from attraction import attraction_name, attraction_mrt,get_attraction_id, get_mrt_stats
from decimal import Decimal
import uvicorn
import json


app=FastAPI()

origins = [
    "http://localhost:8000",
    "http://127.0.0.1:8000"
]

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)  
    raise TypeError(f"Object of type '{type(obj).__name__}' is not JSON serializable")

# Static Pages (Never Modify Code in this Block)
# @app.get("/", include_in_schema=False)
# async def index(request: Request):
# 	return FileResponse("./static/index.html", media_type="text/html")

# @app.get("/attraction/{id}", include_in_schema=False)
# async def attraction(request: Request, id: int):
# 	return FileResponse("./static/attraction.html", media_type="text/html")

@app.get("/api/attraction")
async def get_attraction(page: int = Query(0, ge=0), keyword: str = Query(None, alias="keyword")):
    if not keyword:
        raise HTTPException(status_code=500, detail="Keyword is required")

    try:
        attractions = attraction_name(keyword) + attraction_mrt(keyword)
        
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
    

@app.get("/api/mrts")
async def get_mrts():
    try:
        mrts = get_mrt_stats()
        mrt_names = [mrt['mrt'] for mrt in mrts] 
        return JSONResponse(content={"data": mrt_names}, status_code=200)
    except Exception as e:
        print(f"An error occurred: {str(e)}")  
        return JSONResponse(content={"error": True, "message": "Internal Server Error. Please try again later."}, status_code=500)

# @app.get("/booking", include_in_schema=False)
# async def booking(request: Request):
# 	return FileResponse("./static/booking.html", media_type="text/html")

# @app.get("/thankyou", include_in_schema=False)
# async def thankyou(request: Request):
# 	return FileResponse("./static/thankyou.html", media_type="text/html")

if __name__ == '__main__':
    uvicorn.run(app, host="localhost", port=8000)