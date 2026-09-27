import unittest
from datetime import datetime,timezone,timedelta
from check import check_local_heartbeat
class HeartbeatTests(unittest.TestCase):
 def test_boundaries(self):
  now=datetime(2026,9,27,19,tzinfo=timezone.utc)
  for minutes in [0,60,95]:self.assertEqual(check_local_heartbeat((now-timedelta(minutes=minutes)).isoformat(),now)["age_minutes"],minutes)
  for stamp in [None,"bad",(now-timedelta(minutes=96)).isoformat(),(now+timedelta(minutes=1)).isoformat()]:
   with self.assertRaises((ValueError,TypeError)):check_local_heartbeat(stamp,now)
if __name__=="__main__":unittest.main()
