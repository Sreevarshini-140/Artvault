import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Register(){
  const navigate=useNavigate();
  const [form,setForm]=useState({name:"",email:"",password:"",role:"visitor"});
  const [error,setError]=useState("");
  const submit=async(e)=>{e.preventDefault();setError("");try{await api.post("/auth/register",form);navigate("/login");}catch(err){setError(err.response?.data?.message||"Registration failed");}};
  return <section className="auth-wrap"><form className="auth-card" onSubmit={submit}><span className="eyebrow">Join ArtVault</span><h1>Create account</h1><p>Collect, exhibit, and discover exceptional art.</p>{error&&<div className="alert">{error}</div>}<label>Full name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Email<input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>Password<input type="password" minLength="8" required value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label><label>Account type<select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}><option value="visitor">Collector / Visitor</option><option value="artist">Artist</option><option value="curator">Curator</option></select></label><button className="btn" type="submit">Create account</button><small>Already registered? <Link to="/login">Sign in</Link></small></form></section>;
}
