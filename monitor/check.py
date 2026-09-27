"""Public storefront checks, outside the shop PC. No credentials or paid orders."""
import json, os, re, time, urllib.request, urllib.error
from datetime import datetime, timezone
from urllib.parse import urlsplit
from html import unescape

GT="https://gt40marine.com"
OFFERS=[
 "carbon-fiber-seadoo-325-300-260-230-215-185-cold-air-intake-filter-2002-2025",
 "sea-doo-shorty-power-air-intake-filter-sc-230-300-hp-blue-2002-2023",
 "sea-doo-open-loop-cooling-kit", "pcm-gt40-5-8-ecm"]
PAGES=[(GT,"GT40"),(GT+"/shop","GT40"),("https://noodlebomb.co","NoodleBomb"),("https://noodlebomb.co/original-ramen-sauce","NoodleBomb")]

def request(url,body=None):
 data=json.dumps(body).encode() if body is not None else None
 req=urllib.request.Request(url,data=data,headers={"User-Agent":"GT40-Commerce-Monitor/1.0","Content-Type":"application/json"})
 with urllib.request.urlopen(req,timeout=35) as response:
  text=response.read(8000000).decode("utf-8","replace")
  if "We are verifying your connection" in text or "Security by Netlify" in text:raise ValueError("Connection verification: observation unavailable")
  return response.status,response.url,text

def check_page(url,brand):
 code,final,body=request(url)
 if code!=200 or urlsplit(final).hostname!=urlsplit(url).hostname or brand.lower() not in body.lower():raise ValueError("Wrong status, destination or brand")
 return {"http":code,"scope":"public page response and brand marker"}

def check_offer(handle):
 code,final,body=request(GT+"/p/"+handle)
 products=[]
 for script in re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>',body,re.S):
  try:d=json.loads(unescape(script))
  except ValueError:continue
  candidates=d if isinstance(d,list) else d.get("@graph",[d])
  products.extend(x for x in candidates if isinstance(x,dict) and x.get("@type")=="Product")
 if len(products)!=1:raise ValueError("Exact product structured data missing or duplicated")
 p=products[0];offer=p.get("offers");offer=offer[0] if isinstance(offer,list) and len(offer)==1 else offer
 if not isinstance(offer,dict) or not str(offer.get("availability","")).endswith("/InStock"):raise ValueError("Offer unavailable or unknown")
 if offer.get("priceCurrency")!="USD" or float(offer.get("price",0))<=0:raise ValueError("Invalid price/currency")
 code,final,body=request(GT+"/api/v5/checkout",{"items":[{"id":handle,"name":p["name"],"price":float(offer["price"]),"qty":1}]})
 checkout=urlsplit(json.loads(body).get("checkoutUrl",""))
 if checkout.scheme!="https" or checkout.hostname not in {"checkout.gt40marine.com","inmmrt-rk.myshopify.com"} or not checkout.path.startswith(("/checkouts/","/cart/")):raise ValueError("Checkout destination invalid")
 return {"http":code,"scope":"public in-stock offer and unpaid checkout API","checkout_host":checkout.hostname}

def probe(kind,target,fn):
 for attempt in range(2):
  try:return {"kind":kind,"target":target,"passed":True,**fn()}
  except Exception as exc:
   error=type(exc).__name__+": "+str(exc)[:160]
   if attempt==0:time.sleep(8)
 return {"kind":kind,"target":target,"passed":False,"error":error}

def check_local_heartbeat(stamp,now):
 if not stamp:raise ValueError("Local collection heartbeat missing")
 age=(now-datetime.fromisoformat(stamp.replace("Z","+00:00"))).total_seconds()/60
 if not 0<=age<=95:raise ValueError("Local collection heartbeat stale or invalid")
 return {"scope":"local collector execution freshness only", "age_minutes":round(age,1)}

def main():
 rows=[probe("page",url,lambda u=url,b=brand:check_page(u,b)) for url,brand in PAGES]
 rows.extend(probe("offer",GT+"/p/"+h,lambda h=h:check_offer(h)) for h in OFFERS)
 if os.environ.get("GITHUB_ACTIONS"):
  rows.append(probe("heartbeat","Local collector execution",lambda:check_local_heartbeat(os.environ.get("LOCAL_CHECK_LAST_SUCCESS"),datetime.now(timezone.utc))))
 report={"checked_at":datetime.now(timezone.utc).isoformat(),"runner":"GitHub-hosted" if os.environ.get("GITHUB_ACTIONS") else "local-validation","passed":all(r["passed"] for r in rows),"rows":rows,"payment_submitted":False,"buyer_data_entered":False,"exclusions":["Payment UI and paid orders","Ad accounts/spend/profit","All products","Guaranteed schedule or notification delivery"]}
 print(json.dumps(report,indent=2))
 if os.environ.get("GITHUB_STEP_SUMMARY"):
  with open(os.environ["GITHUB_STEP_SUMMARY"],"a",encoding="utf-8") as f:
   f.write("## Independent public commerce checks\n\n"+report["checked_at"]+"\n\n| Check | Result |\n|---|---|\n")
   for row in rows:f.write("| "+row["target"]+" | "+("PASS" if row["passed"] else row["error"])+" |\n")
   f.write("\nUnpaid API carts only; no payment UI, paid order, advertising or profit claim.\n")
 return 0 if report["passed"] else 1
if __name__=="__main__":raise SystemExit(main())
