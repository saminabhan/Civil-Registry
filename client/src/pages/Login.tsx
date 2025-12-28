import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { LayoutDashboard, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

const loginSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { login, isLoggingIn, user } = useAuth();
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);
  

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginForm) => {
    setError(null);
    console.log("Form submitted with data:", data);
    login(data, {
      onError: (err) => {
        console.error("Login error:", err);
        setError(err.message || "حدث خطأ أثناء تسجيل الدخول");
      },
      onSuccess: () => {
        console.log("Login successful");
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background to-muted p-4" dir="rtl">
      <div className="w-full max-w-5xl h-[600px] flex rounded-3xl overflow-hidden shadow-2xl bg-card border border-border/50">
        
        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative z-10">
          <div className="mb-10 text-center md:text-right">
            <div className="inline-flex md:hidden items-center justify-center w-12 h-12 bg-primary/10 rounded-xl text-primary mb-4">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">تسجيل الدخول</h1>
            <p className="text-muted-foreground">أدخل بياناتك للوصول إلى النظام</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">اسم المستخدم</label>
              <input
                {...form.register("username")}
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                placeholder="اسم المستخدم..."
                dir="rtl"
              />
              {form.formState.errors.username && (
                <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">كلمة المرور</label>
              <input
                {...form.register("password")}
                type="password"
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                placeholder="••••••••"
                dir="rtl"
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium text-center"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري الدخول...</span>
                </>
              ) : (
                "دخول"
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center text-sm text-muted-foreground">
            نظام السجل المدني الآمن © 2024
          </div>
        </div>

        {/* Left Side - Visual */}
        <div className="hidden md:flex w-1/2 bg-slate-900 relative items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-purple-600/80 mix-blend-overlay" />
          
          {/* Unsplash Background Image */}
          {/* Abstract geometric architecture representing data and structure */}
          <img 
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80" 
            alt="Architecture" 
            className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale"
          />

          <div className="relative z-10 p-12 text-white text-right">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-2xl">
              <LayoutDashboard className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-6 leading-tight">بوابة السجل المدني<br/>المركزية</h2>
            <p className="text-lg text-white/80 leading-relaxed max-w-md">
              منصة آمنة ومتطورة لإدارة بيانات المواطنين بكفاءة عالية وسرية تامة.
            </p>

            <div className="mt-12 flex gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-bold">10k+</span>
                <span className="text-sm text-white/60">سجل مواطن</span>
              </div>
              <div className="w-px h-12 bg-white/20 mx-4" />
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-bold">24/7</span>
                <span className="text-sm text-white/60">توافر النظام</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
