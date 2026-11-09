import { describe, it, expect } from "vitest";
import { onRequestGet, onRequestPost } from "../functions/api/booking-payment-evidence.js";
const token="preview-test-token";
const makeEnv=()=>({FIGHTS_ADMIN_TOKEN:token,SEAT_LOCKS_DB:{prepare(sql){return {bind(...args){return {first:async()=>({id:args[0]}),all:async()=>({results:[]}),run:async()=>({meta:{changes:1}})}}}}}});
const req=(method,body)=>new Request("https://preview.example/api/booking-payment-evidence"+(method==="GET"?"?bookingId=BK-TEST":""),{method,headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},...(body?{body:JSON.stringify(body)}:{})});
describe("booking payment evidence recordkeeping",()=>{
 it("requires admin authorization",async()=>{const response=await onRequestGet({request:new Request("https://preview.example/api/booking-payment-evidence?bookingId=BK-TEST"),env:makeEnv()});expect(response.status).toBe(401)});
 it("lists records without asserting payment",async()=>{const response=await onRequestGet({request:req("GET"),env:makeEnv()});expect(response.status).toBe(200);expect((await response.json()).records).toEqual([])});
 it("stores customer-reported metadata as unverified only",async()=>{const response=await onRequestPost({request:req("POST",{bookingId:"BK-TEST",sourceType:"provider_reference",reportedAmount:1500,externalReference:"REF-123",evidenceNote:"Customer supplied reference"}),env:makeEnv()});expect(response.status).toBe(201);const data=await response.json();expect(data.record.record_state).toBe("received_unverified")});
 it("rejects unsupported source types",async()=>{const response=await onRequestPost({request:req("POST",{bookingId:"BK-TEST",sourceType:"auto_approved"}),env:makeEnv()});expect(response.status).toBe(400)});
});
