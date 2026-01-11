import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();
  const { user, updateProfile, isUpdatingProfile, updatePassword, isUpdatingPassword } = useAuth();

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get('name')?.toString().trim();
    const username = formData.get('username')?.toString().trim();

    const updates: { name?: string; username?: string } = {};
    const userName = (user as any)?.name;
    if (name && name !== userName) {
      updates.name = name;
    }
    if (username && username !== user?.username) {
      updates.username = username;
    }

    if (Object.keys(updates).length === 0) {
      toast({
        variant: "default",
        title: "لا توجد تغييرات",
        description: "لم تقم بتغيير أي بيانات",
      });
      return;
    }

    updateProfile(updates, {
      onSuccess: () => {
        toast({
          variant: "default",
          title: "تم التحديث بنجاح",
          description: "تم تحديث بياناتك بنجاح",
        });
      },
      onError: (error: Error) => {
        toast({
          variant: "destructive",
          title: "خطأ في التحديث",
          description: error.message || "حدث خطأ أثناء تحديث البيانات",
        });
      },
    });
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const currentPassword = formData.get('currentPassword')?.toString();
    const newPassword = formData.get('newPassword')?.toString();
    const confirmPassword = formData.get('confirmPassword')?.toString();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        variant: "destructive",
        title: "خطأ في الإدخال",
        description: "الرجاء إدخال جميع الحقول",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "خطأ في الإدخال",
        description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "خطأ في الإدخال",
        description: "كلمة المرور الجديدة وتأكيد كلمة المرور غير متطابقين",
      });
      return;
    }

    updatePassword(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          toast({
            variant: "default",
            title: "تم التحديث بنجاح",
            description: "تم تغيير كلمة المرور بنجاح",
          });
          (e.target as HTMLFormElement).reset();
        },
        onError: (error: Error) => {
          toast({
            variant: "destructive",
            title: "خطأ في التحديث",
            description: error.message || "حدث خطأ أثناء تغيير كلمة المرور",
          });
        },
      }
    );
  };

  return (
    <div className="space-y-8" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">الإعدادات</h1>
        <p className="text-muted-foreground mt-2">قم بتحديث بياناتك الشخصية وكلمة المرور</p>
      </div>

      <div className="space-y-8">
        {/* Update Profile Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-border dark:border-slate-700 overflow-hidden">
          <div className="p-8 bg-muted/10 dark:bg-slate-700/10">
            <h2 className="text-xl font-bold text-foreground mb-6">تحديث البيانات الشخصية</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputGroup 
                  label="الاسم" 
                  name="name" 
                  type="text"
                  defaultValue={(user as any)?.name || ''}
                />
                <InputGroup 
                  label="اسم المستخدم" 
                  name="username" 
                  type="text"
                  defaultValue={user?.username || ''}
                />
              </div>
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingProfile ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>حفظ التغييرات</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Update Password Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-border dark:border-slate-700 overflow-hidden">
          <div className="p-8 bg-muted/10 dark:bg-slate-700/10">
            <h2 className="text-xl font-bold text-foreground mb-6">تغيير كلمة المرور</h2>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-4">
                <InputGroup 
                  label="كلمة المرور الحالية" 
                  name="currentPassword" 
                  type="password"
                  placeholder="أدخل كلمة المرور الحالية"
                />
                <InputGroup 
                  label="كلمة المرور الجديدة" 
                  name="newPassword" 
                  type="password"
                  placeholder="أدخل كلمة المرور الجديدة (6 أحرف على الأقل)"
                />
                <InputGroup 
                  label="تأكيد كلمة المرور الجديدة" 
                  name="confirmPassword" 
                  type="password"
                  placeholder="أعد إدخال كلمة المرور الجديدة"
                />
              </div>
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingPassword ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>تغيير كلمة المرور</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputGroup({ 
  label, 
  name, 
  type = "text",
  placeholder,
  defaultValue 
}: { 
  label: string; 
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="w-full px-4 py-3 rounded-xl bg-background dark:bg-slate-700/50 border border-border dark:border-slate-600 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
        placeholder={placeholder || `أدخل ${label}`}
      />
    </div>
  );
}

