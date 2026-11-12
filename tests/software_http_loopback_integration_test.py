"""Loopback wire-level HTTP integration checks for a deliberately fictional origin.

Checks the sample origin's implementation, NOT conformity of any real API,
production reachability, web UI behavior, or internet services.
Python standard library only; server listens on ephemeral 127.0.0.1 port.
"""
import http.client
import http.server
import json
import threading
import unittest

class FixtureOrigin(http.server.BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    def log_message(self, *_args):
        pass
    def response(self, status, data=b"", **headers):
        self.send_response(status)
        self.send_header("Content-Length",str(len(data)))
        for key,value in headers.items():
            self.send_header(key.replace("_","-"),str(value))
        self.end_headers()
        if self.command!="HEAD" and status not in (204,304):
            self.wfile.write(data)
    def read_json(self):
        length=int(self.headers.get("Content-Length","0"))
        return json.loads(self.rfile.read(length).decode("utf-8"))
    def do_GET(self):
        if self.path!="/resource":
            self.response(404);return
        raw=json.dumps(self.server.resource,separators=(",",":")).encode("utf-8")
        if self.headers.get("If-None-Match")==self.server.etag:
            self.response(304,b"",ETag=self.server.etag)
        else:
            self.response(200,raw,Content_Type="application/json",ETag=self.server.etag)
    def do_HEAD(self):
        self.do_GET()
    def do_PUT(self):
        if self.path!="/resource":
            self.response(404);return
        self.server.resource=self.read_json()
        self.response(204)
    def do_DELETE(self):
        if self.path!="/resource":
            self.response(404);return
        status=204 if self.server.resource is not None else 404
        self.server.resource=None
        self.response(status)
    def do_POST(self):
        if self.path!="/orders":
            self.response(404);return
        payload=self.read_json()
        key=self.headers.get("Idempotency-Key")
        if key is not None and key in self.server.keys:
            order=self.server.keys[key]
        else:
            order={"id":len(self.server.orders)+1,"amount":payload["amount"]}
            self.server.orders.append(order)
            if key is not None:self.server.keys[key]=order
        self.response(201,json.dumps(order).encode("utf-8"),
                      Content_Type="application/json")

class LoopbackHTTP(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server=http.server.ThreadingHTTPServer(("127.0.0.1",0),FixtureOrigin)
        cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True)
        cls.thread.start()
        cls.port=cls.server.server_address[1]
    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=3)
    def setUp(self):
        self.server.resource={"x":1,"y":2}
        self.server.etag='"v1"'
        self.server.orders=[]
        self.server.keys={}
    def send(self,method,path,body=None,headers=None):
        data=None if body is None else json.dumps(body).encode("utf-8")
        h=dict(headers or {})
        if data is not None:
            h["Content-Type"]="application/json"
        con=http.client.HTTPConnection("127.0.0.1",self.port,timeout=2)
        try:
            con.request(method,path,body=data,headers=h)
            response=con.getresponse()
            return response.status,response.read(),dict(response.getheaders())
        finally:
            con.close()
    def test_get_returns_selected_representation_and_validator(self):
        status,data,headers=self.send("GET","/resource")
        self.assertEqual(200,status)
        self.assertEqual({"x":1,"y":2},json.loads(data))
        self.assertEqual('"v1"',headers["ETag"])
        self.assertEqual(len(data),int(headers["Content-Length"]))
    def test_conditional_get_matching_validator_returns_304_without_content(self):
        status,data,_=self.send("GET","/resource",headers={"If-None-Match":'"v1"'})
        self.assertEqual((304,b""),(status,data))
    def test_conditional_get_nonmatching_validator_returns_full_response(self):
        status,data,_=self.send("GET","/resource",headers={"If-None-Match":'"v0"'})
        self.assertEqual(200,status)
        self.assertEqual({"x":1,"y":2},json.loads(data))
    def test_head_advertises_selected_length_but_sends_no_body(self):
        status,body,headers=self.send("HEAD","/resource")
        self.assertEqual(200,status)
        self.assertEqual(b"",body)
        selected=json.dumps({"x":1,"y":2},separators=(",",":")).encode("utf-8")
        self.assertEqual(len(selected),int(headers["Content-Length"]))
    def test_put_is_full_replacement_even_under_identical_replay(self):
        for _ in range(2):
            status,body,_=self.send("PUT","/resource",{"x":4})
            self.assertEqual((204,b""),(status,body))
        status,data,_=self.send("GET","/resource")
        self.assertEqual({"x":4},json.loads(data))
    def test_delete_effect_is_stable_even_if_response_changes(self):
        first,data,_=self.send("DELETE","/resource")
        second,data2,_=self.send("DELETE","/resource")
        self.assertEqual((204,404),(first,second))
        self.assertEqual((b"",b""),(data,data2))
        self.assertIsNone(self.server.resource)
    def test_unkeyed_post_retry_may_duplicate(self):
        status1,data1,_=self.send("POST","/orders",{"amount":7})
        status2,data2,_=self.send("POST","/orders",{"amount":7})
        self.assertEqual((201,201),(status1,status2))
        self.assertNotEqual(json.loads(data1)["id"],json.loads(data2)["id"])
        self.assertEqual(2,len(self.server.orders))
    def test_application_defined_idempotency_key_deduplicates(self):
        h={"Idempotency-Key":"K7"}
        _,data1,_=self.send("POST","/orders",{"amount":7},h)
        _,data2,_=self.send("POST","/orders",{"amount":7},h)
        self.assertEqual(json.loads(data1),json.loads(data2))
        self.assertEqual(1,len(self.server.orders))
    def test_distinct_application_keys_create_distinct_orders(self):
        _,one,_=self.send("POST","/orders",{"amount":7},{"Idempotency-Key":"K7"})
        _,two,_=self.send("POST","/orders",{"amount":7},{"Idempotency-Key":"K8"})
        self.assertNotEqual(json.loads(one)["id"],json.loads(two)["id"])
        self.assertEqual(2,len(self.server.orders))

if __name__=="__main__":
    unittest.main(verbosity=2)
