"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Eye, EyeOff, Lock, Mail, ChevronRight, ShieldCheck, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError("");
    setIsLoading(true);
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const payload = isLogin ? { email, password } : { email, password, organizationName: orgName };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        window.location.href = "/";
      } else {
        const err = await res.json();
        setError(err.error || "Authentication failed");
        setIsLoading(false);
      }
    } catch (e) {
      setError("An error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 overflow-hidden relative">
      
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 translate-x-10 -translate-y-32 w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md z-10 px-4"
      >
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
          
          <CardHeader className="text-center pb-8 pt-10">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="mx-auto w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20 shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]"
            >
              <ShieldCheck className="w-8 h-8 text-blue-400" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-white tracking-tight">ApexTrack Secure</CardTitle>
            <CardDescription className="text-slate-400 mt-2">
              {isLogin ? "Sign in to manage your inventory and P&L" : "Create a new organization workspace"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleAuth} className="space-y-5">
              
              {!isLogin && (
                <div className="space-y-2 relative">
                  <label className="text-sm font-medium text-slate-300 ml-1">Organization Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    </div>
                    <Input 
                      type="text" 
                      value={orgName} 
                      onChange={e => setOrgName(e.target.value)} 
                      required
                      placeholder="e.g. Acme Corp"
                      className="pl-10 h-12 bg-slate-950/50 border-slate-800 text-white focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2 relative">
                <label className="text-sm font-medium text-slate-300 ml-1">Work Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <Input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="pl-10 h-12 bg-slate-950/50 border-slate-800 text-white focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2 relative">
                <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="pl-10 pr-12 h-12 bg-slate-950/50 border-slate-800 text-white font-mono focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all"
                  />

                  {/* Advanced Animated Reveal Button */}
                  <div className="absolute inset-y-0 right-0 pr-1 flex items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors relative overflow-hidden"
                      onClick={() => setShowPassword(!showPassword)}
                      onMouseEnter={() => setIsHovering(true)}
                      onMouseLeave={() => setIsHovering(false)}
                    >
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.div
                          key={showPassword ? "eye-off" : "eye"}
                          initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
                          transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 20 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </motion.div>
                      </AnimatePresence>

                      {/* Ripple effect on click */}
                      <AnimatePresence>
                        {isHovering && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 0.1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 bg-blue-400 rounded-lg"
                          />
                        )}
                      </AnimatePresence>
                    </Button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium text-center">
                  {error}
                </div>
              )}

              <div className="pt-2">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-md shadow-[0_0_20px_-5px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_-5px_rgba(37,99,235,0.6)] transition-all group overflow-hidden relative disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <motion.div 
                    className="absolute inset-0 bg-white/20"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  />
                  <span className="flex items-center gap-2">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {isLogin ? "Authenticating..." : "Creating Workspace..."}
                      </>
                    ) : (
                      <>
                        {isLogin ? "Enter Workspace" : "Create Workspace"}
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                </Button>
              </div>

              <div className="text-center mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError("");
                  }}
                  className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
                >
                  {isLogin ? "Don't have an organization? Create one." : "Already have an account? Sign in."}
                </button>
              </div>

            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
