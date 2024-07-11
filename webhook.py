from fastapi import HTTPException
from dotenv import load_dotenv
import httpx
import os

load_dotenv()

async def pay_by_prime(data,order_info):
  post_data={
        "prime": data.get('prime'),
        "partner_key": os.getenv("PARTNER_KEY"),
        "merchant_id": os.getenv("MERCHANT_ID"),
        "amount": order_info.get('price'),
        "currency": "TWD",
        "details": order_info['trip']['attraction'].get('name'),
        "cardholder": {
            "phone_number":  order_info['contact'].get('phone'),
            "name":  order_info['contact'].get('name'),
            "email": order_info['contact'].get('email')
        }
    }
  headers = {
        'Content-Type': 'application/json',
        'x-api-key': post_data['partner_key']
    }
    
  async with httpx.AsyncClient() as client:
       response = await client.post(
          'https://sandbox.tappaysdk.com/tpc/payment/pay-by-prime',
          json=post_data,
          headers=headers
       )

       if response.is_success:
             return response.json()
       else:
             raise HTTPException(status_code=response.status_code, detail="Failed to process payment")
  
           