import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Users, 
  Search, 
  FileText, 
  LogOut, 
  LayoutDashboard,
  Menu,
  X,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar on route change (mobile)
  const handleNavClick = () => setIsOpen(false);

  const NavItem = ({ href, icon: Icon, children, matchPattern }: { href: string; icon: any; children: React.ReactNode; matchPattern?: string }) => {
    const isActive = location === href || (matchPattern && location.startsWith(matchPattern));
    return (
      <Link href={href} className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
        isActive 
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 font-semibold" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )} onClick={handleNavClick}>
        <Icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
        <span className="text-base">{children}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Toggle */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-white rounded-lg shadow-md border text-primary"
        >
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Content */}
      <motion.aside 
        className={cn(
          "fixed md:sticky top-0 right-0 h-screen w-72 bg-white/90 backdrop-blur-xl border-l border-border z-40 flex flex-col shadow-2xl md:shadow-none",
          "transform transition-transform duration-300 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "translate-x-full" // RTL: translate-x-full hides it to the right
        )}
      >
        <div className="p-8 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <LayoutDashboard className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-foreground leading-tight">السجل المدني</h1>
              <p className="text-xs text-muted-foreground">نظام الإدارة المتكامل</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <NavItem href="/dashboard" icon={Search}>
            بحث عن مواطن
          </NavItem>
          
          <NavItem href="/settings" icon={Settings}>
            الإعدادات
          </NavItem>
          
          {user?.isAdmin && (
            <>
              <div className="pt-4 pb-2 px-4 text-xs font-bold text-muted-foreground/50 uppercase tracking-wider">
                الإدارة
              </div>
              <NavItem href="/users" icon={Users}>
                إدارة المستخدمين
              </NavItem>
              <NavItem href="/logs" icon={FileText} matchPattern="/logs">
                سجلات النشاط
              </NavItem>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-border/50 bg-muted/30">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-semibold text-sm truncate">{user?.username}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {user?.isAdmin ? 'مسؤول النظام' : 'مستخدم'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => logout()}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
